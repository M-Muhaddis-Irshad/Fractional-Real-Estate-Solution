import { Router } from "express";
import { getSettings } from "../models/Settings.js";
import { DEFAULT_CONTENT } from "../utils/content.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.json({
      settings: {
        teamFee: settings.teamFee,
        teamEarnings: settings.teamEarnings,
        termsVersion: settings.termsVersion,
        platform: settings.platform || {},
      },
    });
  } catch (err) {
    next(err);
  }
});

// Public homepage content (used by the landing page). Always merged over the
// DEFAULT_CONTENT fallback so newly-added fields (e.g. trustChips) are present
// even when content was saved before the field existed.
router.get("/content", async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.json({ content: { ...DEFAULT_CONTENT, ...(settings.content || {}) } });
  } catch (err) {
    next(err);
  }
});

export default router;
