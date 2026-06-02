import { readFileSync } from "fs";
import sharp from "sharp";
import { AwsClient } from "aws4fetch";

// Load .env (same pattern as upload-ios-guide.ts)
const envContent = readFileSync(".env", "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const ACCOUNT = process.env.R2_ACCOUNT_ID!;
const BUCKET = process.env.R2_BUCKET_NAME!;

const aws = new AwsClient({
  accessKeyId: process.env.R2_ACCESS_KEY_ID!,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  service: "s3",
  region: "auto",
});

// Source promo graphic (Thai "Try Pro 14 days, no card") and its R2 key.
// JPEG — not WebP — because Outlook/Windows desktop mail clients can't render WebP.
const SRC = process.env.PROMO_SRC
  || "/Users/chaiwutsittiboonta/Desktop/707427207_122101352157324983_8462873706177493712_n.jpg";
const KEY = "promo/trial-14d.jpg";

async function upload(key: string, body: Buffer, contentType: string) {
  const url = `https://${ACCOUNT}.r2.cloudflarestorage.com/${BUCKET}/${key}`;
  const ab = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer;
  const res = await aws.fetch(url, {
    method: "PUT",
    body: ab,
    headers: { "content-type": contentType, "content-length": String(body.byteLength) },
  });
  if (!res.ok) throw new Error(`Upload ${key} failed: ${res.status} ${await res.text()}`);
  console.log(`  uploaded ${key} (${(body.byteLength / 1024).toFixed(0)} KB)`);
}

async function main() {
  console.log(`Converting ${SRC}...`);
  const buf = await sharp(SRC)
    .resize({ width: 1080, height: 1080, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  await upload(KEY, buf, "image/jpeg");
  console.log(`\nDone. Public URL: ${process.env.R2_PUBLIC_URL}/${KEY}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
