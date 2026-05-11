import { db } from "@/lib/prisma"
import { auth } from "@/auth"
import bcrypt from "bcryptjs"
import { NextRequest } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN")
    return Response.json({ error: "Unauthorized" }, { status: 401 })

  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, clientId: true, createdAt: true },
  })
  return Response.json(users)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN")
    return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { email, password, name, role, clientId } = await req.json()
  if (!email?.trim() || !password) return Response.json({ error: "Email and password required" }, { status: 400 })
  if (role === "CLIENT" && !clientId) return Response.json({ error: "Client ID required for CLIENT role" }, { status: 400 })

  const existing = await db.user.findUnique({ where: { email: email.trim() } })
  if (existing) return Response.json({ error: "Email already in use" }, { status: 409 })

  const hashed = await bcrypt.hash(password, 10)
  const user = await db.user.create({
    data: {
      email: email.trim(),
      password: hashed,
      name: name?.trim() || null,
      role: role === "CLIENT" ? "CLIENT" : "ADMIN",
      clientId: role === "CLIENT" ? (clientId ?? null) : null,
    },
    select: { id: true, email: true, name: true, role: true, clientId: true },
  })
  return Response.json(user, { status: 201 })
}
