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
