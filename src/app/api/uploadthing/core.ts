import { createUploadthing, type FileRouter } from "uploadthing/next"
import * as z from "zod"
import { db } from "@/lib/prisma"

const f = createUploadthing()

export const ourFileRouter = {
  financialModelUploader: f({
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
      maxFileSize: "16MB",
      maxFileCount: 5,
    },
    "application/vnd.ms-excel": { maxFileSize: "16MB", maxFileCount: 5 },
  })
    .input(z.object({ description: z.string().optional() }))
    .middleware(({ input }) => ({ description: input?.description }))
    .onUploadComplete(async ({ metadata, file }) => {
      await db.document.create({
        data: {
          name: file.name,
          category: "FINANCIAL_MODEL",
          mimeType: file.type,
          sizeBytes: file.size,
          url: file.ufsUrl,
          fileKey: file.key,
          description: metadata.description ?? null,
        },
      })
      return { ok: true }
    }),

  boardDeckUploader: f({
    "application/pdf": { maxFileSize: "32MB", maxFileCount: 3 },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      { maxFileSize: "32MB", maxFileCount: 3 },
  })
    .input(z.object({ description: z.string().optional() }))
    .middleware(({ input }) => ({ description: input?.description }))
    .onUploadComplete(async ({ metadata, file }) => {
      await db.document.create({
        data: {
          name: file.name,
          category: "BOARD_DECK",
          mimeType: file.type,
          sizeBytes: file.size,
          url: file.ufsUrl,
          fileKey: file.key,
          description: metadata.description ?? null,
        },
      })
      return { ok: true }
    }),

  investorUpdateUploader: f({
    "application/pdf": { maxFileSize: "16MB", maxFileCount: 10 },
  })
    .input(z.object({ description: z.string().optional() }))
    .middleware(({ input }) => ({ description: input?.description }))
    .onUploadComplete(async ({ metadata, file }) => {
      await db.document.create({
        data: {
          name: file.name,
          category: "INVESTOR_UPDATE",
          mimeType: file.type,
          sizeBytes: file.size,
          url: file.ufsUrl,
          fileKey: file.key,
          description: metadata.description ?? null,
        },
      })
      return { ok: true }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
