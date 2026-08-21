import { prisma } from "@/lib/db";

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

  try {
    // Simple query to test connection
    const result = await prisma.$queryRawUnsafe("SELECT 1 as ok");
    checks.database = { status: "connected", result };
  } catch (err: any) {
    checks.database = {
      status: "error",
      message: err.message,
      code: err.code,
      name: err.name,
    };
  }

  // Test Subject table specifically (slug column issue?)
  try {
    const count = await prisma.subject.count();
    checks.subjectTable = { status: "ok", count };
  } catch (err: any) {
    checks.subjectTable = {
      status: "error",
      message: err.message,
    };
  }

  const allOk = checks.database?.status === "connected" && checks.subjectTable?.status === "ok";

  return Response.json(checks, { status: allOk ? 200 : 500 });
}
