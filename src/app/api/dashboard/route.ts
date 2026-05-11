import { getDashboardData } from "@/lib/data/dashboard"
import { db } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    let clientId = searchParams.get("clientId") ?? ""
    if (!clientId) {
      const first = await db.client.findFirst({ orderBy: { createdAt: "asc" } })
      clientId = first?.id ?? ""
    }
    if (!clientId) return Response.json({ error: "No clients found" }, { status: 404 })
    const data = await getDashboardData(clientId)
    return Response.json(data)
  } catch (e) {
    console.error(e)
    return Response.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
