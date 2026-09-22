import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? "";

  // In serverless environments like Vercel, keep the pool small so one
  // instance does not exhaust the database connection limit.
  let max = process.env.NODE_ENV === "production" ? 1 : 10;
  try {
    const parsed = new URL(connectionString);
    const limit = Number(parsed.searchParams.get("connection_limit"));
    if (Number.isInteger(limit) && limit >= 1 && limit <= 20) {
      max = limit;
    }
  } catch {
    // Invalid or empty URL: keep the default.
  }

  const adapter = new PrismaPg({ connectionString, max });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}