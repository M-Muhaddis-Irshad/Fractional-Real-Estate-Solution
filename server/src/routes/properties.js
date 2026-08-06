import { Router } from "express";
import Property from "../models/Property.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const properties = await Property.find({ status: "active" }).sort({ createdAt: 1 });
    res.json({ properties: properties.map((p) => p.toSafeJSON()) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const property = await Property.findOne({ _id: req.params.id, status: "active" });
    if (!property) {
      return res.status(404).json({ error: "Property not found." });
    }
    res.json({ property: property.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

export default router;
