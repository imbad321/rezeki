import { db } from "@/lib/prisma"
import { auth } from "@/auth"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const clientId = searchParams.get("clientId") ?? ""
  if (!clientId) return Response.json({ error: "clientId required" }, { status: 400 })

  // CLIENT role can only access their own data
  if (session.user.role === "CLIENT" && session.user.clientId !== clientId)
    return Response.json({ error: "Forbidden" }, { status: 403 })

  const monthParam = searchParams.get("month") // YYYY-MM, optional
  const where = monthParam
    ? { clientId, month: { gte: new Date(`${monthParam}-01`), lt: new Date(new Date(`${monthParam}-01`).setMonth(new Date(`${monthParam}-01`).getMonth() + 1)) } }
    : { clientId }

  const [mrrPoints, snapshots] = await Promise.all([
    db.mrrDataPoint.findMany({
      where: monthParam
        ? { clientId, month: { gte: new Date(`${monthParam}-01`), lt: new Date(new Date(`${monthParam}-01`).setMonth(new Date(`${monthParam}-01`).getMonth() + 1)) } }
        : { clientId },
      orderBy: { month: "desc" },
    }),
    db.companySnapshot.findMany({
      where: monthParam
        ? { clientId, snapshotDate: { gte: new Date(`${monthParam}-01`), lt: new Date(new Date(`${monthParam}-01`).setMonth(new Date(`${monthParam}-01`).getMonth() + 1)) } }
        : { clientId },
      orderBy: { snapshotDate: "desc" },
    }),
  ])

  return Response.json({ mrrPoints, snapshots })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  if (session.user.role === "CLIENT") return Response.json({ error: "Forbidden" }, { status: 403 })

  const { clientId, month, mrr, newMrr, expansion, churn, cashOnHand, burnRate, headcount } = await req.json()
  if (!clientId || !month) return Response.json({ error: "clientId and month required" }, { status: 400 })

  const monthDate = new Date(`${month}-01T00:00:00.000Z`)
  const nextMonth = new Date(monthDate)
  nextMonth.setMonth(nextMonth.getMonth() + 1)

  const [mrrPoint, snapshot] = await Promise.all([
    db.mrrDataPoint.upsert({
      where: { clientId_month: { clientId, month: monthDate } },
      create: {
        clientId, month: monthDate,
        mrr: mrr ?? 0, newMrr: newMrr ?? 0, expansion: expansion ?? 0, churn: churn ?? 0,
      },
      update: {
        mrr: mrr ?? 0, newMrr: newMrr ?? 0, expansion: expansion ?? 0, churn: churn ?? 0,
      },
    }),
    db.companySnapshot.upsert({
      where: { clientId_snapshotDate: { clientId, snapshotDate: monthDate } },
      create: {
        clientId, snapshotDate: monthDate,
        cashOnHand: cashOnHand ?? 0, burnRate: burnRate ?? 0,
        headcount: headcount ?? 0, arr: (mrr ?? 0) * 12,
      },
      update: {
        cashOnHand: cashOnHand ?? 0, burnRate: burnRate ?? 0,
        headcount: headcount ?? 0, arr: (mrr ?? 0) * 12,
      },
    }),
  ])

  return Response.json({ mrrPoint, snapshot })
}
