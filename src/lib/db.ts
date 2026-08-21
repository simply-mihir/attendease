import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  dbMigrated: boolean;
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

  pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
      ? false
      : { rejectUnauthorized: false },
  });

  pool.on("error", (err) => {
    console.error("Unexpected pg pool error:", err.message);
  });

  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }
}

/**
 * Auto-apply missing schema changes that can't run via `prisma db push` in CI.
 * Runs once per cold start. Each migration is idempotent (IF NOT EXISTS).
 */
export async function ensureSchema() {
  if (globalForPrisma.dbMigrated) return;
  globalForPrisma.dbMigrated = true;

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "slug" TEXT;
    `);
    // Add unique index if it doesn't exist
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Subject_userId_slug_key"
      ON "Subject" ("userId", "slug")
      WHERE "slug" IS NOT NULL;
    `);
  } catch (err) {
    console.error("ensureSchema warning:", err);
  }
}

export { prisma };
export default prisma;
