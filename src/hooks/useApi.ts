"use client";

interface CacheItem {
  data: any;
  expiry: number;
}

const apiCache = new Map<string, CacheItem>();
const CACHE_TTL_MS = 60000; // 60 seconds default TTL

export async function apiFetch(path: string, options: RequestInit = {}) {
  const method = options.method || "GET";
  const isGet = method === "GET";
  const cacheKey = path;

  // 1. Return cached data for GET requests if not expired
  if (isGet) {
    const cached = apiCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
  } else {
    // 2. Invalidate entire cache on mutations (POST, PUT, DELETE)
    apiCache.clear();
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`/api/v1${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      window.location.href = "/login";
      return;
    }
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  // 3. Store successful GET requests in cache
  if (isGet) {
    apiCache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL_MS });
  }

  return data;
}
