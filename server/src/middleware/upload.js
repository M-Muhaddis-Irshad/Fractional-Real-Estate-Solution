import multer from "multer";

const storage = multer.memoryStorage();

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, WebP or GIF images are allowed."));
    }
    cb(null, true);
  },
});
