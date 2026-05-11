import { db } from "@/lib/prisma"

export async function GET() {
  try {
    const clients = await db.client.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, industry: true, stage: true, color: true },
    })
    return Response.json(clients)
  } catch {
    return Response.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}
