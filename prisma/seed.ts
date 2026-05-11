import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import bcrypt from "bcryptjs"
import path from "path"

const provider = process.env.DATABASE_PROVIDER ?? "sqlite"
let db: PrismaClient

if (provider === "sqlite") {
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3")
  const adapter = new PrismaBetterSqlite3({ url: path.resolve(process.cwd(), "dev.db") })
  db = new PrismaClient({ adapter } as any)
} else {
  const { PrismaPg } = require("@prisma/adapter-pg")
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  db = new PrismaClient({ adapter } as any)
}

async function main() {
  const hashed = await bcrypt.hash("admin", 10)
  await db.user.upsert({
    where: { email: "admin@rezeki.com" },
    create: { email: "admin@rezeki.com", password: hashed, name: "Admin", role: "ADMIN" },
    update: {},
  })
  console.log("Admin ready: admin@rezeki.com / admin")
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
