import { getBudgetData } from "@/lib/data/budget"
import { db } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    let clientId = searchParams.get("clientId") ?? ""
    if (!clientId) {
      const first = await db.client.findFirst({ orderBy: { createdAt: "asc" } })
      clientId = first?.id ?? ""
    }
    const data = await getBudgetData(clientId)
    return Response.json(data)
  } catch {
    return Response.json({ error: "Failed to fetch budget data" }, { status: 500 })
  }
}
