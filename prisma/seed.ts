import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import bcrypt from "bcryptjs"

const { PrismaPg } = require("@prisma/adapter-pg")
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter } as any)

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
