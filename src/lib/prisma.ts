import { PrismaClient } from "@/generated/prisma/client"

function createPrismaClient() {
  const provider = process.env.DATABASE_PROVIDER ?? "sqlite"

  if (provider === "sqlite") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3")
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path")
    const adapter = new PrismaBetterSqlite3({ url: path.resolve(process.cwd(), "dev.db") })
    return new PrismaClient({ adapter })
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaPg } = require("@prisma/adapter-pg")
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
