import { getFundingRounds } from "@/lib/data/investors"
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

    const rounds = await getFundingRounds(clientId)
    return Response.json(rounds)
  } catch {
    return Response.json({ error: "Failed to fetch rounds" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN")
    return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { clientId, roundType, closedAt, amountRaised, preMoneyVal, postMoneyVal, leadInvestor } = await req.json()
    if (!clientId || !roundType || !closedAt)
      return Response.json({ error: "clientId, roundType, and closedAt required" }, { status: 400 })

    const round = await db.fundingRound.create({
      data: {
        clientId,
        roundType,
        closedAt: new Date(closedAt),
        amountRaised: amountRaised ?? 0,
        preMoneyVal: preMoneyVal ?? 0,
        postMoneyVal: postMoneyVal ?? 0,
        leadInvestor: leadInvestor?.trim() || null,
      },
    })
    return Response.json(round, { status: 201 })
  } catch {
    return Response.json({ error: "Failed to create round" }, { status: 500 })
  }
}
