import { readFileSync } from "fs";
import { AwsClient } from "aws4fetch";

// Loads .env so this can run standalone (mirrors upload-ios-guide.ts).
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

// Official Apple "Download on the App Store" badges, fetched unmodified from
// Apple's marketing tools. Per Apple guidelines the badge artwork must NOT be
// recolored/resized/optimized — uploaded as-is (SVG), not run through WebP.
const FILES = [
  { src: "/tmp/asb-en.svg", key: "guide/app-store-badge-en.svg" },
  { src: "/tmp/asb-th.svg", key: "guide/app-store-badge-th.svg" },
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
  console.log(`  uploaded ${key} (${(body.byteLength / 1024).toFixed(1)} KB)`);
}

async function main() {
  for (const f of FILES) {
    const buf = readFileSync(f.src);
    await upload(f.key, buf, "image/svg+xml");
  }
  console.log("\nDone! App Store badges uploaded.");
}

main().catch((e) => { console.error(e); process.exit(1); });
