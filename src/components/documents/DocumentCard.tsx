"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, ExternalLink } from "lucide-react"
import { FileTypeIcon } from "./FileTypeIcon"
import { formatFileSize, formatMonthYear } from "@/lib/utils"
import { DOCUMENT_CATEGORIES } from "@/lib/constants"
import type { DocumentType } from "@/schemas/document"

interface Props {
  doc: DocumentType
}

export function DocumentCard({ doc }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const categoryLabel =
    DOCUMENT_CATEGORIES.find((c) => c.value === doc.category)?.label ?? doc.category

  async function handleDelete() {
    if (!confirm(`Delete "${doc.name}"?`)) return
    setDeleting(true)
    try {
      await fetch(`/api/documents/${doc.id}`, { method: "DELETE" })
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="group bg-white rounded-xl border border-slate-200 p-4 flex gap-3 hover:shadow-md hover:border-slate-300 transition-all">
      <div className="shrink-0">
        <FileTypeIcon mimeType={doc.mimeType} size={36} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-slate-900 truncate">{doc.name}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            {categoryLabel}
          </span>
          <span className="text-xs text-slate-400">{formatFileSize(doc.sizeBytes)}</span>
          <span className="text-xs text-slate-400">{formatMonthYear(doc.uploadedAt)}</span>
        </div>
        {doc.description && (
          <div className="text-xs text-slate-400 mt-1 truncate">{doc.description}</div>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Open file"
        >
          <ExternalLink size={14} />
        </a>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
          title="Delete file"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
