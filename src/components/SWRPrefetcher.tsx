"use client";

import { useEffect } from "react";
import { preload } from "swr";
import { apiFetch } from "@/hooks/useApi";

const fetcher = (url: string) => apiFetch(url);

// Prefetch the most-visited page data as soon as the app shell mounts
const PREFETCH_PATHS = [
  "/dashboard",
  "/subjects",
];

export function SWRPrefetcher() {
  useEffect(() => {
    // Small delay so it doesn't compete with the current page's fetch
    const timer = setTimeout(() => {
      PREFETCH_PATHS.forEach((path) => preload(path, fetcher));
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return null; // Renders nothing
}
