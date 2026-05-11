import { db } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get("clientId") ?? ""
    const type     = searchParams.get("type") ?? undefined
    const category = searchParams.get("category") ?? undefined

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
