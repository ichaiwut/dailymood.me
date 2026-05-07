// PBKDF2-SHA256 password hashing via Web Crypto.
// Format: pbkdf2$<iter>$<saltB64>$<hashB64>
// 600_000 iterations follows OWASP 2023 recommendation.

const ITERATIONS = 600_000;
const HASH_LEN = 32; // bytes (256 bits)
const SALT_LEN = 16;

function b64encode(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64decode(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function derive(password: string, salt: Uint8Array, iter: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as unknown as BufferSource, hash: "SHA-256", iterations: iter },
    key,
    HASH_LEN * 8,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${b64encode(salt)}$${b64encode(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iter = parseInt(parts[1], 10);
  if (!Number.isFinite(iter) || iter < 1) return false;
  const salt = b64decode(parts[2]);
  const expected = b64decode(parts[3]);
  const got = await derive(password, salt, iter);
  if (got.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ expected[i];
  return diff === 0;
}

// URL-safe random token (base64url, no padding). Default 32 bytes ≈ 256 bits.
export function generateToken(bytes = 32): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return b64encode(buf).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
