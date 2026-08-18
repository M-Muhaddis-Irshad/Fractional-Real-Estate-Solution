"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import Modal from "./Modal";
import Badge from "./Badge";
import { api } from "@/lib/api";
import { money, shortHash, fmtDateTime } from "@/lib/format";
import type { Token } from "@/lib/types";

/** Compact card showing a minted ownership token. */
export function TokenCard({ token, onOpen }: { token: Token; onOpen: (t: Token) => void }) {
  return (
    <div
      className="tkCard"
      onClick={() => onOpen(token)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(token);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="tkCardTop">
        <span className="tkSymbol">{token.symbol || "FLX"}</span>
        <span className="tkId">{token.tokenId}</span>
      </div>
      <div className="tkCardName">{token.propertyName}</div>
      <div className="tkCardMeta">
        {token.shares} share{token.shares > 1 ? "s" : ""} · {money(token.totalValue)}
      </div>
      <div className="tkCardFoot">
        <span className="dMono">Block #{token.blockNumber}</span>
        <span className="dMono">{shortHash(token.hash)}</span>
      </div>
    </div>
  );
}

/** Full ownership certificate with on-chain details + chain verification. */
export function TokenCertificate({ token, onClose }: { token: Token; onClose: () => void }) {
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{ valid?: boolean; error?: string; blockCount?: number; tokenCount?: number } | null>(null);

  const verify = async () => {
    setVerifying(true);
    setResult(null);
    try {
      const data = await api<{ valid?: boolean; blockCount?: number; tokenCount?: number }>("/tokens/verify", {
        auth: false,
      });
      setResult(data);
    } catch {
      setResult({ valid: false, error: "Chain unavailable." });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Modal title={`Token certificate · ${token.tokenId}`} onClose={onClose} wide>
      <div className="tkCert">
        <div className="tkCertHead">
          <div className="tkCertTitle">{token.propertyName}</div>
          <Badge status="approved" label="Minted" />
        </div>
        <div className="pdReceiptRows">
          <div>
            <span>Owner</span>
            <span className="dStrong">{token.ownerName}</span>
          </div>
          <div>
            <span>Shares</span>
            <span>{token.shares}</span>
          </div>
          <div>
            <span>Price per share</span>
            <span>{money(token.pricePerShare)}</span>
          </div>
          <div>
            <span>Total value</span>
            <span className="dStrong">{money(token.totalValue)}</span>
          </div>
          <div>
            <span>Minted</span>
            <span>{fmtDateTime(token.timestamp)}</span>
          </div>
        </div>
        <div className="tkHashRows">
          <div>
            <span>Token ID</span>
            <span className="dMono">{token.tokenId}</span>
          </div>
          <div>
            <span>Transaction hash</span>
            <span className="dMono">{token.txHash}</span>
          </div>
          <div>
            <span>Block</span>
            <span className="dMono">#{token.blockNumber}</span>
          </div>
          <div>
            <span>Previous block hash</span>
            <span className="dMono">{token.previousHash}</span>
          </div>
          <div>
            <span>Block hash</span>
            <span className="dMono">{token.hash}</span>
          </div>
          <div>
            <span>Mining nonce</span>
            <span className="dMono">{token.nonce}</span>
          </div>
        </div>
        <div className="tkVerify">
          <button className="btn btnGhost" onClick={verify} disabled={verifying}>
            {verifying ? "Verifying…" : "Verify chain integrity"}
          </button>
          {result && (
            <div className={`tkVerifyResult ${result.valid ? "tkVerifyOk" : "tkVerifyBad"}`}>
              {result.valid ? (
                <>
                  <Check size={13} /> Ledger intact — {result.blockCount} blocks ({result.tokenCount}{" "}
                  tokens) verified.
                </>
              ) : (
                <>
                  <X size={13} /> Chain integrity check failed — a block does not link correctly.
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
