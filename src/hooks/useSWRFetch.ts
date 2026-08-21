"use client";

import useSWR, { SWRConfiguration, mutate as globalMutate } from "swr";
import { apiFetch } from "./useApi";

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,       // Don't refetch when user tabs back
  revalidateOnReconnect: true,    // Refetch when network reconnects
  dedupingInterval: 10000,        // 10s — same key within 10s = 1 fetch
  errorRetryCount: 2,
};

export function useSWRFetch<T = unknown>(
  path: string | null,
  config?: SWRConfiguration & { throwOnError?: boolean }
) {
  const result = useSWR<T>(
    path,
    (url: string) => apiFetch(url),
    { ...defaultConfig, ...config }
  );

  if (result.error && config?.throwOnError !== false) {
    throw result.error;
  }

  return result;
}

// Invalidate a specific cache key from anywhere (e.g., after a mutation)
export function invalidate(path: string) {
  return globalMutate(path);
}

// Invalidate multiple keys matching a prefix
export function invalidatePrefix(prefix: string) {
  return globalMutate(
    (key) => typeof key === "string" && key.startsWith(prefix),
    undefined,
    { revalidate: true }
  );
}
