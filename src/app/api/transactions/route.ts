import { db } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { clientId, date, description, category, type, amount } = await req.json()
    if (!clientId || !date || !description || !category || !type || amount == null)
      return Response.json({ error: "Missing required fields" }, { status: 400 })

    const tx = await db.transaction.create({
      data: { clientId, date: new Date(date), description, category, type, amount: parseFloat(amount) },
    })
    return Response.json(tx, { status: 201 })
  } catch {
    return Response.json({ error: "Failed to create" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    let clientId = searchParams.get("clientId") ?? ""
    const type     = searchParams.get("type") ?? undefined
    const category = searchParams.get("category") ?? undefined

    if (session.user.role === "CLIENT") {
      clientId = session.user.clientId ?? ""
    }

    if (!clientId) return Response.json({ error: "clientId required" }, { status: 400 })

    const transactions = await db.transaction.findMany({
      where: {
        clientId,
        ...(type     ? { type }     : {}),
        ...(category ? { category } : {}),
      },
      orderBy: { date: "desc" },
    })

    return Response.json(transactions)
  } catch {
    return Response.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}
