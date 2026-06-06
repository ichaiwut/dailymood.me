/**
 * Optimize + upload an article cover to R2, then set articles.cover_image_key.
 *
 * Optimize policy (CLAUDE.md → Images): resize ≤1600px long side, WebP, q~0.82.
 * Article covers store only the imageKey in DB; reads sign a short-lived URL.
 *
 *   node --env-file=.env --env-file=.env.local scripts/upload-article-cover.mjs \
 *     <slug> <source-image-path>
 *
 * (.env supplies R2 creds; .env.local overrides DATABASE_URL → local DB.)
 */
import sharp from "sharp";
import pg from "pg";
import { AwsClient } from "aws4fetch";

const [slug, src] = process.argv.slice(2);
if (!slug || !src) {
  console.error("Usage: upload-article-cover.mjs <slug> <source-image-path>");
  process.exit(1);
}

const ACCOUNT = process.env.R2_ACCOUNT_ID;
const BUCKET = process.env.R2_BUCKET_NAME;
const aws = new AwsClient({
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  service: "s3",
  region: "auto",
});

async function r2Put(key, body, contentType) {
  const url = `https://${ACCOUNT}.r2.cloudflarestorage.com/${BUCKET}/${key}`;
  const ab = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
  const res = await aws.fetch(url, {
    method: "PUT",
    body: ab,
    headers: { "content-type": contentType, "content-length": String(body.byteLength) },
  });
  if (!res.ok) throw new Error(`R2 upload failed: ${res.status} ${await res.text()}`);
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const r = await pool.query("SELECT id, cover_image_key FROM articles WHERE slug = $1", [slug]);
  if (!r.rows[0]) { console.error(`Article "${slug}" not found`); process.exit(1); }
  const { id, cover_image_key: oldKey } = r.rows[0];

  const meta = await sharp(src).metadata();
  const buf = await sharp(src)
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  // Canonical key matches the admin cover route: articles/<id>/cover.<ext>
  const key = `articles/${id}/cover.webp`;
  await r2Put(key, buf, "image/webp");
  console.log(`Uploaded ${key}  (${meta.width}x${meta.height} ${meta.format} → webp, ${(buf.byteLength / 1024).toFixed(0)} KB)`);

  await pool.query(
    "UPDATE articles SET cover_image_key = $1, updated_at = NOW() WHERE id = $2",
    [key, id],
  );
  console.log(`Set cover_image_key on "${slug}"`);

  if (oldKey && oldKey !== key) {
    const url = `https://${ACCOUNT}.r2.cloudflarestorage.com/${BUCKET}/${oldKey}`;
    const del = await aws.fetch(url, { method: "DELETE" });
    if (del.ok || del.status === 404) console.log(`Removed old cover ${oldKey}`);
  }
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
