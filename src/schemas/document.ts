import * as z from "zod"

export const DocumentCategorySchema = z.enum([
  "FINANCIAL_MODEL",
  "BOARD_DECK",
  "INVESTOR_UPDATE",
  "OTHER",
])

export const DocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: DocumentCategorySchema,
  mimeType: z.string(),
  sizeBytes: z.number(),
  url: z.string(),
  fileKey: z.string(),
  uploadedAt: z.coerce.date(),
  description: z.string().nullable(),
})

export const DocumentListResponseSchema = z.array(DocumentSchema)

export const UploadMetadataSchema = z.object({
  description: z.string().max(500).optional(),
})

export type DocumentType = z.infer<typeof DocumentSchema>
export type DocumentCategory = z.infer<typeof DocumentCategorySchema>
