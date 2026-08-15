import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

let prisma: PrismaClient;

if (globalForPrisma.prisma) {
  prisma = globalForPrisma.prisma;
} else {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,                // Limit concurrent connections (Neon free tier)
    idleTimeoutMillis: 30_000,  // Close idle connections after 30s
    connectionTimeoutMillis: 10_000,
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

export { prisma };
export default prisma;
