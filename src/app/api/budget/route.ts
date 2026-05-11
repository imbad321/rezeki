import { getBudgetData } from "@/lib/data/budget"
import { auth } from "@/auth"
import { db } from "@/lib/prisma"
import { DEPT_COLORS } from "@/lib/constants"

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

    const data = await getBudgetData(clientId)
    return Response.json(data)
  } catch {
    return Response.json({ error: "Failed to fetch budget data" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN")
    return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { clientId, departmentName, month, budgeted, actual } = await req.json()
    if (!clientId || !departmentName || !month)
      return Response.json({ error: "clientId, departmentName, and month required" }, { status: 400 })

    const monthDate = new Date(`${month}-01T00:00:00.000Z`)
    const color = DEPT_COLORS[departmentName] ?? "#6366f1"

    const dept = await db.department.upsert({
      where: { clientId_name: { clientId, name: departmentName } },
      create: { clientId, name: departmentName, color },
      update: {},
    })

    const entry = await db.budgetEntry.upsert({
      where: { departmentId_month: { departmentId: dept.id, month: monthDate } },
      create: { departmentId: dept.id, month: monthDate, budgeted: budgeted ?? 0, actual: actual ?? 0 },
      update: { budgeted: budgeted ?? 0, actual: actual ?? 0 },
    })

    return Response.json({ department: dept, entry }, { status: 201 })
  } catch {
    return Response.json({ error: "Failed to save budget entry" }, { status: 500 })
  }
}
