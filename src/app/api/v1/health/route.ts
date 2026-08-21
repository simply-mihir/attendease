import { prisma, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Public health check — no auth required. Tests database connectivity. */
export async function GET() {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      hasDbUrl: !!process.env.DATABASE_URL,
      dbUrlPrefix: process.env.DATABASE_URL?.slice(0, 30) + "...",
      nodeEnv: process.env.NODE_ENV,
    },
  };

  // 1. Test raw connection
  try {
    const result = await prisma.$queryRawUnsafe("SELECT 1 as ok");
    checks.database = { status: "connected", result };
  } catch (err: any) {
    checks.database = { status: "error", message: err.message, code: err.code };
    return Response.json(checks, { status: 500 });
  }

  // 2. Auto-apply missing schema
  try {
    await ensureSchema();
    checks.schema = { status: "ok" };
  } catch (err: any) {
    checks.schema = { status: "error", message: err.message };
  }

  // 3. Test Subject table
  try {
    const count = await prisma.subject.count();
    checks.subjectTable = { status: "ok", count };
  } catch (err: any) {
    checks.subjectTable = { status: "error", message: err.message };
  }

  const allOk = checks.database?.status === "connected" && checks.subjectTable?.status === "ok";
  return Response.json(checks, { status: allOk ? 200 : 500 });
}
