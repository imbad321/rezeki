import { getCapTable } from "@/lib/data/investors"
import { auth } from "@/auth"
import { db } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    let clientId = searchParams.get("clientId") ?? ""

    if (session.user.role === "CLIENT") {
      clientId = session.user.clientId ?? ""
    } else if (!clientId) {
      const first = await db.client.findFirst({ orderBy: { createdAt: "asc" } })
      clientId = first?.id ?? ""
    }

    const entries = await getCapTable(clientId)
    return Response.json(entries)
  } catch {
    return Response.json({ error: "Failed to fetch cap table" }, { status: 500 })
  }
}
