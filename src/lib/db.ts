import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  schemaReady: Promise<void> | null;
};

let prisma: PrismaClient;
let pool: Pool;

if (globalForPrisma.prisma) {
  prisma = globalForPrisma.prisma;
} else {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const isLocal =
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1");

  pool = new Pool({
    connectionString,
    // Serverless: 1 conn per instance keeps us well under Supabase's
    // PgBouncer pool_size (15 in session mode).  Queries within a single
    // request are queued automatically by pg Pool — safe and correct.
    max: isLocal ? 5 : 1,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });

  pool.on("error", (err) => {
    console.error("Unexpected pg pool error:", err.message);
  });

  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

  // Always cache — prevents duplicate Pools across hot-reload (dev)
  // AND across re-imports within the same serverless instance (prod).
  globalForPrisma.prisma = prisma;
}

/**
 * Auto-apply missing schema changes that can't run via `prisma db push` in
 * Vercel's build environment.  Runs once per cold start (promise is cached so
 * concurrent requests share the same migration).  Every statement is
 * idempotent (IF NOT EXISTS) — safe to re-run on every deploy.
 */
export function ensureSchema(): Promise<void> {
  if (globalForPrisma.schemaReady) return globalForPrisma.schemaReady;

  globalForPrisma.schemaReady = (async () => {
    try {
      // ── Subject.slug ──────────────────────────────────────────
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "slug" TEXT`
      );
      await prisma.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "Subject_userId_slug_key"
         ON "Subject" ("userId", "slug")
         WHERE "slug" IS NOT NULL`
      );
    } catch (err) {
      console.error("ensureSchema error:", err);
      // Reset so next request retries instead of caching a failure
      globalForPrisma.schemaReady = null;
    }
  })();

  return globalForPrisma.schemaReady;
}

export { prisma };
export default prisma;
