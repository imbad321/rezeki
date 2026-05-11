import { db } from "@/lib/prisma"
import { NextRequest } from "next/server"

interface ImportRow {
  date: string
  description: string
  category: string
  type: string
  amount: number
}

export async function POST(req: NextRequest) {
  try {
    const { clientId, transactions } = await req.json() as {
      clientId: string
      transactions: ImportRow[]
    }

    if (!clientId) return Response.json({ error: "clientId required" }, { status: 400 })
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return Response.json({ error: "No transactions provided" }, { status: 400 })
    }

    const client = await db.client.findUnique({ where: { id: clientId } })
    if (!client) return Response.json({ error: "Client not found" }, { status: 404 })

    const data = transactions.map((tx) => ({
      clientId,
      date: new Date(tx.date),
      description: tx.description.slice(0, 500),
      category: tx.category,
      type: tx.type === "INCOME" ? "INCOME" : "EXPENSE",
      amount: Math.abs(tx.amount),
    }))

    const result = await db.transaction.createMany({ data })
    return Response.json({ imported: result.count })
  } catch (e) {
    console.error(e)
    return Response.json({ error: "Import failed" }, { status: 500 })
  }
}
