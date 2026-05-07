import { AwsClient } from "aws4fetch";

const SIGN_TTL_SECONDS = 60 * 60; // 1 hour

// aws4fetch — Cloudflare Workers/edge-compatible SigV4 signer.
// Avoids DOMParser dependency from @aws-sdk/client-s3.
function aws(): AwsClient {
  return new AwsClient({
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    service: "s3",
    region: "auto",
  });
}

function objectUrl(key: string): string {
  const account = process.env.R2_ACCOUNT_ID!;
  const bucket = process.env.R2_BUCKET_NAME!;
  return `https://${account}.r2.cloudflarestorage.com/${bucket}/${encodeURIComponent(key).replace(/%2F/g, "/")}`;
}

export async function uploadObject(
  key: string,
  body: ArrayBuffer | Uint8Array,
  contentType: string,
): Promise<void> {
  const buf =
    body instanceof ArrayBuffer
      ? body
      : (body.buffer.slice(
          body.byteOffset,
          body.byteOffset + body.byteLength,
        ) as ArrayBuffer);
  const res = await aws().fetch(objectUrl(key), {
    method: "PUT",
    body: buf,
    headers: {
      "content-type": contentType,
      "content-length": String(buf.byteLength),
    },
  });
  if (!res.ok) {
    throw new Error(`R2 upload failed: ${res.status} ${await res.text()}`);
  }
}

export async function deleteObject(key: string): Promise<void> {
  const res = await aws().fetch(objectUrl(key), { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    throw new Error(`R2 delete failed: ${res.status} ${await res.text()}`);
  }
}

export async function getSignedReadUrl(key: string): Promise<string> {
  const url = new URL(objectUrl(key));
  url.searchParams.set("X-Amz-Expires", String(SIGN_TTL_SECONDS));
  const signed = await aws().sign(url.toString(), {
    method: "GET",
    aws: { signQuery: true },
  });
  return signed.url;
}
