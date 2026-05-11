import { getInvestors } from "@/lib/data/investors"
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

    const investors = await getInvestors(clientId)
    return Response.json(investors)
  } catch {
    return Response.json({ error: "Failed to fetch investors" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN")
    return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { clientId, name, firm, type, email, website, leadRound } = await req.json()
    if (!clientId || !name?.trim() || !type)
      return Response.json({ error: "clientId, name, and type required" }, { status: 400 })

    const investor = await db.investor.create({
      data: {
        clientId,
        name: name.trim(),
        firm: firm?.trim() || null,
        type,
        email: email?.trim() || null,
        website: website?.trim() || null,
        leadRound: leadRound || null,
      },
    })
    return Response.json(investor, { status: 201 })
  } catch {
    return Response.json({ error: "Failed to create investor" }, { status: 500 })
  }
}
