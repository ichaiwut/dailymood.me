import { readFileSync } from "fs";
import { AwsClient } from "aws4fetch";
import sharp from "sharp";

// Load .env (R2 creds point at the shared dev/prod bucket — see CLAUDE.md).
const envContent = readFileSync(".env", "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const ACCOUNT = process.env.R2_ACCOUNT_ID!;
const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC = process.env.R2_PUBLIC_URL!;

const aws = new AwsClient({
  accessKeyId: process.env.R2_ACCESS_KEY_ID!,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  service: "s3",
  region: "auto",
});

// --- Pack definition -------------------------------------------------------
// Icons land at R2 key `{PACK_ID}/{moodId}.{ext}`. All 7 system moods must be
// covered. The whole pack must share ONE format (the app stores a single
// `icon_format` per pack). Rule (CLAUDE.md): SVG uploads as-is (vector); raster
// (png/jpg/webp) is optimized to WebP (≤128px, q82) before upload.
const PACK_ID = "icons8_premium";
const SRC_DIR = "/Users/chaiwutsittiboonta/Desktop/Mood/Emoji/PNG/480px";

// moodId -> source filename (without dir)
// NOTE: tired intentionally reuses the sad face (per user) — no sleepy face in this 3D set.
const MAP: Record<string, string> = {
  amazing: "smiling-face-with-heart-eyes-2_hires.png",
  happy: "grinning-face_hires.png",
  neutral: "3d-fluency-eyes_hires.png",
  sad: "3d-fluency-face-holding-back-tears_hires.png",
  angry: "pouting-face-icon_hires.png",
  anxious: "melting-face-2_hires.png",
  tired: "3d-fluency-face-holding-back-tears_hires.png",
};
// ---------------------------------------------------------------------------

async function upload(key: string, body: Buffer, contentType: string) {
  const url = `https://${ACCOUNT}.r2.cloudflarestorage.com/${BUCKET}/${key}`;
  const ab = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer;
  const res = await aws.fetch(url, {
    method: "PUT",
    body: ab,
    headers: { "content-type": contentType, "content-length": String(body.byteLength) },
  });
  if (!res.ok) throw new Error(`Upload ${key} failed: ${res.status} ${await res.text()}`);
  console.log(`  uploaded ${key} (${(body.byteLength / 1024).toFixed(1)} KB)`);
}

async function main() {
  // Derive the pack's single output format from the first source file.
  const firstSrc = Object.values(MAP)[0].toLowerCase();
  const isSvg = firstSrc.endsWith(".svg");
  const ext = isSvg ? "svg" : "webp";
  const contentType = isSvg ? "image/svg+xml" : "image/webp";

  console.log(`Uploading pack "${PACK_ID}" (${ext}) from ${SRC_DIR}\n`);
  for (const [moodId, file] of Object.entries(MAP)) {
    const raw = readFileSync(`${SRC_DIR}/${file}`);
    const body = isSvg
      ? raw
      : await sharp(raw)
          .resize({ width: 128, height: 128, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();
    await upload(`${PACK_ID}/${moodId}.${ext}`, body, contentType);
  }
  console.log(`\nDone (icon_format="${ext}"). Sample: ${PUBLIC}/${PACK_ID}/amazing.${ext}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
