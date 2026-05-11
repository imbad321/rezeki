import { db } from "@/lib/prisma"
import { UTApi } from "uploadthing/server"

const utapi = new UTApi()

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const doc = await db.document.findUnique({ where: { id } })
    if (!doc) {
      return Response.json({ error: "Not found" }, { status: 404 })
    }

    // Only call UTApi for real uploads (not seed placeholder keys)
    if (!doc.fileKey.startsWith("seed-doc-")) {
      await utapi.deleteFiles(doc.fileKey)
    }

    await db.document.delete({ where: { id } })
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
