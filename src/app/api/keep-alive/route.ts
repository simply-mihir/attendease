import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  // Optional: simple auth via query param to prevent abuse
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (token !== process.env.KEEP_ALIVE_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Cheapest possible query — keeps Neon compute awake
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Keep-Alive] DB ping failed:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
