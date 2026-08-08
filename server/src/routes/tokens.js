import { Router } from "express";
import Token from "../models/Token.js";
import { requireAuth, requireActive } from "../middleware/auth.js";
import { verifyChain } from "../utils/tokenchain.js";

const router = Router();

// Public — anyone can verify the integrity of the whole ledger.
router.get("/verify", async (req, res, next) => {
  try {
    const result = await verifyChain();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/", requireAuth, requireActive, async (req, res, next) => {
  try {
    const tokens = await Token.find({
      ownerId: req.user._id,
      kind: "mint",
      status: "minted",
    }).sort({ blockNumber: -1 });
    res.json({ tokens: tokens.map((t) => t.toSafeJSON()) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, requireActive, async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id);
    if (!token) return res.status(404).json({ error: "Token not found." });
    if (!token.ownerId || token.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You do not own this token." });
    }
    res.json({ token: token.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

export default router;
