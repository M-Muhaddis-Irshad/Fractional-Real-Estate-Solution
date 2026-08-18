import crypto from "node:crypto";
import Token from "../models/Token.js";

// Leading zeros required in every block hash. Tune via FLUX_CHAIN_DIFFICULTY
// (default 4 → ~1/65k chance per attempt, mints in tens of milliseconds).
// Lazy read — dotenv.config() runs in src/index.js AFTER the import graph is
// evaluated, so a module-scope read would capture undefined and ignore the env
// var (same bug class as the Google strategy and RESET_URL fixes).
const getDifficulty = () =>
  Math.min(Math.max(parseInt(process.env.FLUX_CHAIN_DIFFICULTY || "4", 10), 1), 6);

export const sha256 = (input) =>
  crypto.createHash("sha256").update(String(input)).digest("hex");

export const GENESIS_PREV_HASH = "0".repeat(64);

/** The exact hash a block must equal — deterministic from stored fields. */
export function computeBlockHash(blockNumber, timestamp, data, previousHash, nonce) {
  return sha256(
    `${blockNumber}|${new Date(timestamp).toISOString()}|${data}|${previousHash}|${nonce}`
  );
}

function mine(blockNumber, timestamp, data, previousHash) {
  const target = "0".repeat(getDifficulty());
  let nonce = 0;
  let hash = "";
  do {
    hash = computeBlockHash(blockNumber, timestamp, data, previousHash, nonce);
    nonce += 1;
  } while (!hash.startsWith(target));
  return { nonce: nonce - 1, hash };
}

/** Ensure the genesis block exists (chain starts at block 0). */
export async function ensureGenesis() {
  const existing = await Token.findOne({ kind: "genesis" });
  if (existing) return existing;

  const data = JSON.stringify({
    kind: "genesis",
    network: "flux-chain",
    message: "Genesis block — Flux fractional real-estate ownership token ledger",
    created: new Date().toISOString(),
  });
  const timestamp = new Date();
  const { nonce, hash } = mine(0, timestamp.toISOString(), data, GENESIS_PREV_HASH);

  try {
    return await Token.create({
      tokenId: "FLX-GENESIS-000000",
      kind: "genesis",
      blockNumber: 0,
      previousHash: GENESIS_PREV_HASH,
      hash,
      nonce,
      data,
      timestamp,
    });
  } catch (err) {
    // Unique index race — another process already minted genesis.
    if (err && err.code === 11000) return Token.findOne({ kind: "genesis" });
    throw err;
  }
}

/**
 * Mint an ownership token for a settled share purchase and append it as the
 * next block of the chain. Returns the created Token document.
 *
 * Two purchases can race for the same next block; the read-compute-create
 * cycle is retried on duplicate-key errors so a losing attempt re-reads the
 * new head and mints on the next free block instead of silently dropping.
 */
export async function mintTokens({
  user,
  property,
  shares,
  pricePerShare,
  totalValue,
  requestId = null,
  transactionId = null,
}) {
  await ensureGenesis();
  const symbol = String(property.initials || property.name.slice(0, 2) || "PRP").toUpperCase();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const head = await Token.findOne().sort({ blockNumber: -1 });
    const blockNumber = (head ? head.blockNumber : 0) + 1;
    const tokenId = `FLX-${symbol}-${String(blockNumber).padStart(6, "0")}`;
    const timestamp = new Date();
    const previousHash = head ? head.hash : GENESIS_PREV_HASH;

    const txHash = sha256(
      JSON.stringify({
        kind: "mint",
        tokenId,
        requestId: requestId ? requestId.toString() : null,
        transactionId: transactionId ? transactionId.toString() : null,
        propertyId: property._id.toString(),
        propertyName: property.name,
        symbol,
        shares,
        pricePerShare,
        totalValue,
        ownerId: user._id.toString(),
        ownerName: user.name,
        timestamp: timestamp.toISOString(),
      })
    );

    const data = JSON.stringify({
      kind: "mint",
      tokenId,
      propertyId: property._id.toString(),
      propertyName: property.name,
      symbol,
      shares,
      pricePerShare,
      totalValue,
      txHash,
      ownerId: user._id.toString(),
      ownerName: user.name,
      timestamp: timestamp.toISOString(),
    });

    const { nonce, hash } = mine(blockNumber, timestamp.toISOString(), data, previousHash);

    try {
      return await Token.create({
        tokenId,
        kind: "mint",
        blockNumber,
        previousHash,
        hash,
        nonce,
        data,
        ownerId: user._id,
        ownerName: user.name,
        propertyId: property._id,
        propertyName: property.name,
        symbol,
        shares,
        pricePerShare,
        totalValue,
        txHash,
        transactionId: transactionId || null,
        requestId: requestId || null,
        timestamp,
      });
    } catch (err) {
      // Lost the race for this block number — re-read the head and retry.
      if (err && err.code === 11000 && attempt < 7) continue;
      throw err;
    }
  }
  throw new Error("Could not mint token after retries.");
}

/**
 * Walk the entire chain and recompute every block hash from its stored
 * fields, checking that each block links to the previous one's hash.
 * Returns whether the ledger is tamper-evident and intact.
 */
export async function verifyChain() {
  const blocks = await Token.find().sort({ blockNumber: 1 });
  let previousHash = GENESIS_PREV_HASH;
  let valid = true;
  let firstBad = null;
  let expectedBlock = 0;

  for (const b of blocks) {
    // Blocks must be a contiguous sequence starting at 0 (genesis).
    if (b.blockNumber !== expectedBlock) {
      valid = false;
      firstBad = b.tokenId;
      break;
    }
    if (b.previousHash !== previousHash) {
      valid = false;
      firstBad = b.tokenId;
      break;
    }
    const computed = computeBlockHash(b.blockNumber, b.timestamp, b.data, b.previousHash, b.nonce);
    if (computed !== b.hash) {
      valid = false;
      firstBad = b.tokenId;
      break;
    }
    previousHash = b.hash;
    expectedBlock += 1;
  }

  return {
    valid,
    blockCount: blocks.length,
    tokenCount: blocks.filter((b) => b.kind === "mint").length,
    firstBad,
    difficulty: getDifficulty(),
    checkedAt: new Date().toISOString(),
  };
}
