"use client"

import { DocumentCard } from "./DocumentCard"
import type { DocumentType } from "@/schemas/document"

interface Props {
  docs: DocumentType[]
}

export function DocumentGrid({ docs }: Props) {
  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="text-sm font-medium text-slate-900">No documents found</div>
        <div className="text-xs text-slate-400 mt-1">Upload a file to get started</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {docs.map((doc) => (
        <DocumentCard key={doc.id} doc={doc} />
      ))}
    </div>
  )
}
