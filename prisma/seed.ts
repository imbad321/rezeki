import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

const adapter = new PrismaBetterSqlite3({ url: "dev.db" })
const db = new PrismaClient({ adapter })

async function main() {
  console.log("Database ready — no seed data. Add clients via the app.")
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
