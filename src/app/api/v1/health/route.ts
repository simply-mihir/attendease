import { prisma, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Public health check — no auth required. Full system diagnostics. */
export async function GET() {
  const start = Date.now();
  const checks: Record<string, any> = {
    status: "checking",
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasDbUrl: !!process.env.DATABASE_URL,
      dbHost: process.env.DATABASE_URL
        ? new URL(process.env.DATABASE_URL).hostname
        : null,
      dbPort: process.env.DATABASE_URL
        ? new URL(process.env.DATABASE_URL).port || "5432"
        : null,
      hasNextAuthSecret: !!(process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET),
      hasGoogleOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      hasGitHubOAuth: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      vercelRegion: process.env.VERCEL_REGION || null,
    },
  };

  // 1. Raw database connectivity
  const dbStart = Date.now();
  try {
    const result: any[] = await prisma.$queryRawUnsafe(
      "SELECT 1 AS ok, version() AS pg_version, current_database() AS db_name"
    );
    checks.database = {
      status: "connected",
      latencyMs: Date.now() - dbStart,
      pgVersion: result[0]?.pg_version?.split(" ").slice(0, 2).join(" ") || "unknown",
      dbName: result[0]?.db_name || "unknown",
    };
  } catch (err: any) {
    checks.database = {
      status: "error",
      latencyMs: Date.now() - dbStart,
      message: err.message,
      code: err.code,
    };
    checks.status = "unhealthy";
    checks.totalMs = Date.now() - start;
    return Response.json(checks, { status: 500 });
  }

  // 2. Schema migration
  try {
    await ensureSchema();
    checks.schema = { status: "ok" };
  } catch (err: any) {
    checks.schema = { status: "error", message: err.message };
  }

  // 3. Table checks — verify core tables exist and are queryable
  const tables = [
    { name: "User", fn: () => prisma.user.count() },
    { name: "Subject", fn: () => prisma.subject.count() },
    { name: "Semester", fn: () => prisma.semester.count() },
    { name: "Schedule", fn: () => prisma.schedule.count() },
    { name: "AttendanceRecord", fn: () => prisma.attendanceRecord.count() },
    { name: "NotificationSetting", fn: () => prisma.notificationSetting.count() },
    { name: "ScheduleOverride", fn: () => prisma.scheduleOverride.count() },
  ];

  checks.tables = {};
  for (const t of tables) {
    try {
      const count = await t.fn();
      checks.tables[t.name] = { status: "ok", count };
    } catch (err: any) {
      checks.tables[t.name] = { status: "error", message: err.message };
    }
  }

  // 4. Connection pool stats
  try {
    const poolStats: any[] = await prisma.$queryRawUnsafe(`
      SELECT numbackends AS active_connections,
             datname AS database
      FROM pg_stat_database
      WHERE datname = current_database()
    `);
    checks.pool = {
      activeConnections: Number(poolStats[0]?.active_connections) || 0,
      database: poolStats[0]?.database || "unknown",
    };
  } catch (err: any) {
    checks.pool = { status: "error", message: err.message };
  }

  // 5. Slug column verification
  try {
    const slugCheck: any[] = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Subject' AND column_name = 'slug'
    `);
    checks.slugColumn = slugCheck.length > 0
      ? { status: "exists", type: slugCheck[0].data_type, nullable: slugCheck[0].is_nullable }
      : { status: "missing" };
  } catch (err: any) {
    checks.slugColumn = { status: "error", message: err.message };
  }

  // Summary
  const tableErrors = Object.values(checks.tables as Record<string, any>)
    .filter((t: any) => t.status === "error");
  const allOk =
    checks.database.status === "connected" &&
    checks.schema?.status === "ok" &&
    checks.slugColumn?.status === "exists" &&
    tableErrors.length === 0;

  checks.status = allOk ? "healthy" : "degraded";
  checks.totalMs = Date.now() - start;

  return Response.json(checks, { status: allOk ? 200 : 500 });
}
