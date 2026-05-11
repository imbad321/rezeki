import { getDashboardData } from "@/lib/data/dashboard"
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

    if (!clientId) return Response.json({ error: "No clients found" }, { status: 404 })
    const data = await getDashboardData(clientId)
    return Response.json(data)
  } catch (e) {
    console.error(e)
    return Response.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
