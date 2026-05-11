import { db } from "@/lib/prisma"
import { auth } from "@/auth"
import bcrypt from "bcryptjs"
import { NextRequest } from "next/server"

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN")
    return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const { name, password } = await req.json()

  const data: any = {}
  if (name?.trim()) data.name = name.trim()
  if (password)     data.password = await bcrypt.hash(password, 10)

  const user = await db.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, clientId: true },
  })
  return Response.json(user)
}

export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN")
    return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params

  // Prevent deleting yourself
  if (id === session.user.id)
    return Response.json({ error: "Cannot delete your own account" }, { status: 400 })

  await db.user.delete({ where: { id } })
  return Response.json({ ok: true })
}
