import { db } from "@/lib/prisma"
import { auth } from "@/auth"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { id } = await params
    await db.transaction.delete({ where: { id } })
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: "Failed to delete" }, { status: 500 })
  }
}
