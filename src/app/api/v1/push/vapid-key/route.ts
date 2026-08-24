import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Return the public VAPID key so the client can subscribe at runtime. */
export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) {
    return NextResponse.json({ error: "VAPID key not configured" }, { status: 500 });
  }
  return NextResponse.json({ key });
}
