import { readFileSync } from "fs";
import sharp from "sharp";
import { AwsClient } from "aws4fetch";

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

const SRC_DIR = "/Users/chaiwutsittiboonta/Desktop";
const FILES = [
  { src: `${SRC_DIR}/1.png`, key: "guide/ios-step-1.webp" },
  { src: `${SRC_DIR}/2.png`, key: "guide/ios-step-2.webp" },
  { src: `${SRC_DIR}/3.png`, key: "guide/ios-step-3.webp" },
  { src: `${SRC_DIR}/4.png`, key: "guide/ios-step-4.webp" },
  { src: `${SRC_DIR}/5.png`, key: "guide/ios-step-5.webp" },
];

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
  for (const f of FILES) {
    console.log(`Converting ${f.src}...`);
    const buf = await sharp(f.src)
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    await upload(f.key, buf, "image/webp");
  }
  console.log("\nDone! All iOS guide images uploaded.");
}

main().catch((e) => { console.error(e); process.exit(1); });
