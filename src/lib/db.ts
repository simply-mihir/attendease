import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // Use Neon serverless HTTP driver — eliminates TCP cold-start overhead
  const connectionString = process.env.DATABASE_URL!;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool as any);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });
}

// Cache globally — reused across serverless invocations in the same process
export const prisma = globalForPrisma.prisma || createPrismaClient();
if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma;

export default prisma;
