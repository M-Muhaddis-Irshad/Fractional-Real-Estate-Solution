import { v2 as cloudinary } from "cloudinary";

// Lazy config — dotenv.config() runs in src/index.js AFTER the import graph is
// evaluated, so calling cloudinary.config() at module scope would read empty
// values even when CLOUDINARY_* env vars are set. Configure on first use
// instead (same bug class as the Google strategy and RESET_URL fixes).
let configured = false;
function configureCloudinary() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
    api_key: process.env.CLOUDINARY_API_KEY || "",
    api_secret: process.env.CLOUDINARY_API_SECRET || "",
  });
  configured = true;
}

export function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export function uploadBuffer(buffer, { folder = "flux", publicId = null }) {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId || undefined, resource_type: "image" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export function destroyImage(publicId) {
  configureCloudinary();
  return new Promise((resolve) => {
    if (!publicId) return resolve(null);
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error("[cloudinary] destroy failed:", error.message);
        return resolve(null);
      }
      resolve(result);
    });
  });
}

export { cloudinary };
