import { NextResponse } from "next/server";

/**
 * JSON response with browser/CDN caching headers.
 * Use for GET endpoints with data that doesn't change every second.
 */
export function cachedJson(data: unknown, maxAgeSec = 30) {
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": `private, s-maxage=${maxAgeSec}, stale-while-revalidate=${maxAgeSec * 2}`,
    },
  });
}

/**
 * JSON response that must not be cached. Use for mutations and real-time data.
 */
export function freshJson(data: unknown) {
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}

// ─── Server-side in-memory cache ────────────────────────────
// Prevents identical DB queries from running on rapid-fire requests
// (multiple tabs, page transitions, SWR deduplication gaps).
// Cache is per-process and auto-clears on deploy (serverless cold start).

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memCache = new Map<string, CacheEntry<unknown>>();

// Evict expired entries periodically to prevent memory leaks
const EVICT_INTERVAL = 60_000; // 1 minute
let lastEvict = Date.now();

function evictExpired() {
  const now = Date.now();
  if (now - lastEvict < EVICT_INTERVAL) return;
  lastEvict = now;
  for (const [key, entry] of memCache) {
    if (entry.expiresAt <= now) memCache.delete(key);
  }
}

/**
 * Server-side cache-through helper.
 * Caches the result of `fetcher` in process memory for `ttlSec` seconds.
 * Use for expensive DB queries that don't need real-time freshness.
 *
 * @param key   Unique cache key (include userId + route for isolation)
 * @param ttlSec  Time-to-live in seconds (default 15)
 * @param fetcher  Async function that produces the data
 */
export async function serverCache<T>(
  key: string,
  ttlSec: number,
  fetcher: () => Promise<T>
): Promise<T> {
  evictExpired();

  const now = Date.now();
  const hit = memCache.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expiresAt > now) {
    return hit.data;
  }

  const data = await fetcher();
  memCache.set(key, { data, expiresAt: now + ttlSec * 1000 });
  return data;
}

/**
 * Invalidate cache entries matching a prefix.
 * Call after mutations (POST/PUT/DELETE) to bust stale data.
 */
export function invalidateServerCache(prefix: string) {
  for (const key of memCache.keys()) {
    if (key.startsWith(prefix)) memCache.delete(key);
  }
}
