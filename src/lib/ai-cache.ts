const cache = new Map<string, { data: unknown; expiresAt: number }>();

const TTL = 60 * 60 * 1000; // 1 hour

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached(key: string, data: unknown): void {
  cache.set(key, { data, expiresAt: Date.now() + TTL });
}
