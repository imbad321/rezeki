import { db } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const { name, industry, stage, color } = await req.json()
    if (!name?.trim()) return Response.json({ error: "Name required" }, { status: 400 })
    const client = await db.client.update({
      where: { id },
      data: {
        name: name.trim(),
        industry: industry?.trim() || null,
        stage: stage?.trim() || null,
        color: color || "#10b981",
      },
      select: { id: true, name: true, industry: true, stage: true, color: true },
    })
    return Response.json(client)
  } catch {
    return Response.json({ error: "Failed to update client" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    await db.client.delete({ where: { id } })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: "Failed to delete client" }, { status: 500 })
  }
}
