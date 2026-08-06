import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

export function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export function uploadBuffer(buffer, { folder = "flux", publicId = null }) {
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
