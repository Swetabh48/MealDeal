/** Simple localStorage cache with TTL to cut repeat network lag */

export function cacheGet<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { exp: number; data: T };
    if (!parsed?.exp || Date.now() > parsed.exp) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, data: T, ttlMs = 10 * 60 * 1000) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ exp: Date.now() + ttlMs, data })
    );
  } catch {
    // quota / private mode — ignore
  }
}

export function cacheClear(prefix?: string) {
  if (typeof window === 'undefined') return;
  if (!prefix) return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(prefix)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}
