/**
 * One-time PWA icon generator.
 *
 * Generates every install icon from the real site logo (public/logo/logo PNG.png)
 * — navy (#0f1b33) square canvas, logo centered, sizes per PWA/Apple spec.
 *
 * Requires `sharp` at runtime only (NOT a project dependency — icons are
 * pre-generated static assets; sharp is not needed for `next build`):
 *
 *   npm install --no-save sharp   # latest stable; does not touch package.json
 *   node scripts/generate-pwa-icons.mjs
 *   npm rm sharp --no-save        # optional cleanup after generation
 *
 * Outputs to public/icons/.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "public/logo/logo PNG.png");
const OUT_DIR = join(ROOT, "public/icons");

// Brand navy used by the site (matches --navy-ink in src/index.css and the
// manifest background/theme colors). Solid background renders cleanly at small
// sizes and satisfies iOS's no-transparency requirement for apple-touch icons.
const NAVY = { r: 15, g: 27, b: 51, alpha: 1 };

// Fraction of the canvas width the logo should occupy.
const STD_RATIO = 0.72; // standard "any" icons + apple-touch + favicons
const MASKABLE_RATIO = 0.58; // extra padding — logo stays inside the maskable safe zone

/**
 * @param {number} size      output canvas size (px, square)
 * @param {number} ratio     logo width relative to canvas
 * @returns {Promise<Buffer>} composited PNG buffer
 */
async function makeIcon(size, ratio) {
  const logo = sharp(SRC).trim(); // drop the source file's transparent padding
  const meta = await logo.metadata();
  const logoW = Math.round(size * ratio);
  const logoH = Math.round((logoW * meta.height) / meta.width);
  const left = Math.round((size - logoW) / 2);
  const top = Math.round((size - logoH) / 2);

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: NAVY,
    },
  })
    .composite([
      {
        input: await logo.resize(logoW, logoH, { fit: "fill" }).toBuffer(),
        left,
        top,
      },
    ])
    .png()
    .toBuffer();
}

const JOBS = [
  { file: "icon-192.png", size: 192, ratio: STD_RATIO },
  { file: "icon-512.png", size: 512, ratio: STD_RATIO },
  { file: "icon-maskable-192.png", size: 192, ratio: MASKABLE_RATIO },
  { file: "icon-maskable-512.png", size: 512, ratio: MASKABLE_RATIO },
  { file: "apple-touch-icon.png", size: 180, ratio: STD_RATIO },
  { file: "favicon-32.png", size: 32, ratio: STD_RATIO },
  { file: "favicon-16.png", size: 16, ratio: STD_RATIO },
];

await mkdir(OUT_DIR, { recursive: true });

for (const job of JOBS) {
  const buf = await makeIcon(job.size, job.ratio);
  await sharp(buf).toFile(join(OUT_DIR, job.file));
  const meta = await sharp(buf).metadata();
  console.log(`✓ ${job.file}  ${meta.width}x${meta.height}  ${(buf.length / 1024).toFixed(1)} KB`);
}
console.log("Done — icons written to public/icons/");
