"use client"

import { useState, useMemo } from "react"
import { Upload } from "lucide-react"
import { CategoryFilter } from "./CategoryFilter"
import { DocumentGrid } from "./DocumentGrid"
import { DocumentUploader } from "./DocumentUploader"
import type { DocumentType } from "@/schemas/document"
import type { DocumentCategory } from "@/lib/constants"

interface Props {
  initialDocs: DocumentType[]
}

export function DocumentVault({ initialDocs }: Props) {
  const [filter, setFilter] = useState<DocumentCategory | "ALL">("ALL")
  const [uploaderOpen, setUploaderOpen] = useState(false)

  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const doc of initialDocs) {
      map[doc.category] = (map[doc.category] ?? 0) + 1
    }
    return map
  }, [initialDocs])

  const filtered = useMemo(
    () => (filter === "ALL" ? initialDocs : initialDocs.filter((d) => d.category === filter)),
    [initialDocs, filter]
  )

  return (
    <>
      <div className="space-y-5 max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <CategoryFilter selected={filter} onChange={setFilter} counts={counts} />
          <button
            onClick={() => setUploaderOpen(true)}
            className="flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <Upload size={14} />
            Upload
          </button>
        </div>

        <DocumentGrid docs={filtered} />
      </div>

      {uploaderOpen && <DocumentUploader onClose={() => setUploaderOpen(false)} />}
    </>
  )
}
