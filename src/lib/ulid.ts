// Minimal Crockford-base32 ULID generator — Workers-safe (uses crypto.getRandomValues).
const ENC = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function ulid(now = Date.now()): string {
  let timeStr = "";
  let t = now;
  for (let i = 9; i >= 0; i--) {
    timeStr = ENC[t % 32] + timeStr;
    t = Math.floor(t / 32);
  }
  const rand = new Uint8Array(16);
  crypto.getRandomValues(rand);
  let randStr = "";
  for (let i = 0; i < 16; i++) randStr += ENC[rand[i] % 32];
  return timeStr + randStr;
}
