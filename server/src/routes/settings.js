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

// Public homepage content (used by the landing page).
router.get("/content", async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.json({ content: settings.content || DEFAULT_CONTENT });
  } catch (err) {
    next(err);
  }
});

export default router;
