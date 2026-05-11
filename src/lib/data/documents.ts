import { db } from "@/lib/prisma"
import type { DocumentType } from "@/schemas/document"

export async function getDocuments(category?: string): Promise<DocumentType[]> {
  const docs = await db.document.findMany({
    where: category && category !== "ALL" ? { category } : undefined,
    orderBy: { uploadedAt: "desc" },
  })
  return docs as DocumentType[]
}
