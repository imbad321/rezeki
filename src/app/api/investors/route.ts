import { getInvestors } from "@/lib/data/investors"
import { db } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    let clientId = searchParams.get("clientId") ?? ""
    if (!clientId) {
      const first = await db.client.findFirst({ orderBy: { createdAt: "asc" } })
      clientId = first?.id ?? ""
    }
    const investors = await getInvestors(clientId)
    return Response.json(investors)
  } catch {
    return Response.json({ error: "Failed to fetch investors" }, { status: 500 })
  }
}
