/**
 * Derives every logo asset from assets/logo-source.jpeg.
 *
 *   node scripts/build-logo-assets.mjs
 *
 * Re-run this after replacing the source file. Outputs are committed so the
 * build never depends on this script, but keeping it means the assets are
 * reproducible rather than mystery binaries.
 *
 * Uses sharp, which is already present as a Next.js dependency.
 */
import sharp from "sharp";

const SRC = "assets/logo-source.jpeg";
const DARK = "#21140f";

/**
 * Brightness at which a pixel counts as fully opaque.
 *
 * The logo is artwork composited on a pure-black matte. A hard threshold would
 * leave jagged edges on the anti-aliased artwork, so alpha is derived from
 * brightness and the colour is then un-multiplied to recover its true tone
 * over transparency.
 */
const OPAQUE_AT = 60;

async function blackMatteToAlpha(path) {
  const { data, info } = await sharp(path)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.alloc(width * height * 4);

  for (let p = 0, q = 0; p < data.length; p += channels, q += 4) {
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const a = Math.min(255, Math.round((Math.max(r, g, b) * 255) / OPAQUE_AT));
    out[q + 3] = a;
    if (a === 0) continue;
    out[q] = Math.min(255, Math.round((r * 255) / a));
    out[q + 1] = Math.min(255, Math.round((g * 255) / a));
    out[q + 2] = Math.min(255, Math.round((b * 255) / a));
  }

  return { buffer: out, width, height };
}

const { buffer, width, height } = await blackMatteToAlpha(SRC);
const rgba = { raw: { width, height, channels: 4 } };

// A single intermediate file: sharp cannot chain extract and trim in one pass.
const flat = await sharp(buffer, rgba).png().toBuffer();

// Full lockup — mark, wordmark and tagline.
await sharp(flat).trim().png().toFile("public/images/logo-lockup.png");

// Mark only. The wordmark begins around 74% down, so crop above it, then trim.
const markOnly = await sharp(flat)
  .extract({ left: 0, top: 0, width, height: Math.round(height * 0.71) })
  .toBuffer();
await sharp(markOnly).trim().png().toFile("public/images/logo-mark.png");

// Favicon. A transparent icon vanishes against dark browser chrome, so the
// mark gets the brand's dark plate.
const markPlate = await sharp("public/images/logo-mark.png")
  .resize({
    width: 420,
    height: 420,
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .toBuffer();
await sharp({
  create: { width: 512, height: 512, channels: 4, background: DARK },
})
  .composite([{ input: markPlate, gravity: "center" }])
  .png()
  .toFile("app/icon.png");

// Social card at the Open Graph standard 1200x630.
const lockup = await sharp("public/images/logo-lockup.png")
  .resize({ width: 520, fit: "inside" })
  .toBuffer();
await sharp({
  create: { width: 1200, height: 630, channels: 4, background: DARK },
})
  .composite([{ input: lockup, gravity: "center" }])
  .jpeg({ quality: 90 })
  .toFile("public/images/social-card.jpg");

// Portraits, cropped to the aspect ratios the hero and about frames define.
//
// The two use different anchors on purpose. The hero source is already a
// portrait, so trimming from the top keeps the face. The about source is a
// landscape studio shot that has to lose a lot of width, and `attention` finds
// the subject far better than a blind centre crop would.
for (const [src, out, ratio, position] of [
  ["assets/author-source.jpg", "public/images/hero-portrait.jpg", 0.76, "top"],
  [
    "assets/about-source.jpg",
    "public/images/about-portrait.jpg",
    0.78,
    "attention",
  ],
]) {
  const { width, height } = await sharp(src).metadata();
  // Fit the crop inside the source so nothing is upscaled.
  const cropHeight = Math.min(height, Math.round(width / ratio));
  const cropWidth = Math.round(cropHeight * ratio);
  await sharp(src)
    .resize(cropWidth, cropHeight, { fit: "cover", position })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(out);
}

// Article card images, cropped to the 1.18 ratio .article-media defines.
// Sources live in assets/articles/ so this stays reproducible offline.
const CARD_WIDTH = 900;
const CARD_HEIGHT = Math.round(CARD_WIDTH / 1.18);

for (const [src, out, position] of [
  ["assets/articles/gaslighting.jpg", "public/images/articles/gaslighting.jpg"],
  ["assets/articles/condom.jpg", "public/images/articles/condom.jpg"],
  // The source is a 2.2:1 letterbox with the subject hard against the right
  // edge, and `attention` sliced his face in half. Anchor the crop instead.
  ["assets/articles/who-lost.jpg", "public/images/articles/who-lost.jpg", "right"],
  ["assets/articles/train-station.jpg", "public/images/articles/train-station.jpg"],
  ["assets/articles/humiliating.jpg", "public/images/articles/humiliating.jpg"],
  ["assets/articles/abortion.jpg", "public/images/articles/abortion.jpg"],
]) {
  await sharp(src)
    // `attention` picks the most salient region rather than the centre, which
    // matters on the very wide sources.
    .resize(CARD_WIDTH, CARD_HEIGHT, {
      fit: "cover",
      position: position ?? "attention",
    })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(out);
}

// Workshop card images, cropped to the 1.55 ratio .workshop-image defines.
const WORKSHOP_WIDTH = 1200;
const WORKSHOP_HEIGHT = Math.round(WORKSHOP_WIDTH / 1.55);

for (const [src, out] of [
  [
    "assets/workshops/writing-the-unconscious.jpg",
    "public/images/workshops/writing-the-unconscious.jpg",
  ],
  ["assets/workshops/writing-drama.jpg", "public/images/workshops/writing-drama.jpg"],
]) {
  await sharp(src)
    .resize(WORKSHOP_WIDTH, WORKSHOP_HEIGHT, {
      fit: "cover",
      position: "attention",
    })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(out);
}

for (const file of [
  "public/images/logo-lockup.png",
  "public/images/logo-mark.png",
  "app/icon.png",
  "public/images/social-card.jpg",
  "public/images/hero-portrait.jpg",
  "public/images/about-portrait.jpg",
  "public/images/articles/gaslighting.jpg",
  "public/images/articles/condom.jpg",
  "public/images/articles/who-lost.jpg",
  "public/images/articles/train-station.jpg",
  "public/images/articles/humiliating.jpg",
  "public/images/articles/abortion.jpg",
  "public/images/workshops/writing-the-unconscious.jpg",
  "public/images/workshops/writing-drama.jpg",
]) {
  const meta = await sharp(file).metadata();
  console.log(`${file.padEnd(34)} ${meta.width}x${meta.height} ${meta.format}`);
}
