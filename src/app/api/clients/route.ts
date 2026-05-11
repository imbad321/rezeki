import { db } from "@/lib/prisma"
import { auth } from "@/auth"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const counts = req.nextUrl.searchParams.get("counts") === "1"

    if (session.user.role === "CLIENT") {
      const client = await db.client.findUnique({
        where: { id: session.user.clientId ?? "" },
        select: {
          id: true, name: true, industry: true, stage: true, color: true,
          ...(counts ? { _count: { select: { transactions: true } } } : {}),
        },
      })
      return Response.json(client ? [client] : [])
    }

    const clients = await db.client.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true, name: true, industry: true, stage: true, color: true,
        ...(counts ? { _count: { select: { transactions: true } } } : {}),
      },
    })
    return Response.json(clients)
  } catch {
    return Response.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN")
    return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { name, industry, stage, color } = await req.json()
    if (!name?.trim()) return Response.json({ error: "Name required" }, { status: 400 })
    const client = await db.client.create({
      data: {
        name: name.trim(),
        industry: industry?.trim() || null,
        stage: stage?.trim() || null,
        color: color || "#10b981",
      },
      select: { id: true, name: true, industry: true, stage: true, color: true },
    })
    return Response.json(client, { status: 201 })
  } catch {
    return Response.json({ error: "Failed to create client" }, { status: 500 })
  }
}
