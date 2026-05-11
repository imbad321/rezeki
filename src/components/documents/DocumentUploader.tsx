"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { UploadDropzone } from "@/lib/uploadthing"

const UPLOAD_TABS = [
  { label: "Financial Model", endpoint: "financialModelUploader" as const, hint: ".xlsx / .xls · up to 16 MB" },
  { label: "Board Deck", endpoint: "boardDeckUploader" as const, hint: ".pdf / .pptx · up to 32 MB" },
  { label: "Investor Update", endpoint: "investorUpdateUploader" as const, hint: ".pdf · up to 16 MB" },
]

interface Props {
  onClose: () => void
}

export function DocumentUploader({ onClose }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)
  const [description, setDescription] = useState("")
  const [uploaded, setUploaded] = useState(false)

  const tab = UPLOAD_TABS[activeTab]

  function handleUploadComplete() {
    setUploaded(true)
    router.refresh()
    setTimeout(onClose, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="font-semibold text-slate-900">Upload Document</div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-5">
            {UPLOAD_TABS.map((t, i) => (
              <button
                key={t.endpoint}
                onClick={() => { setActiveTab(i); setUploaded(false) }}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                  activeTab === i
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              placeholder="e.g. Q4 2024 Board Deck"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-300"
            />
          </div>

          <div className="text-xs text-slate-400 mb-3">{tab.hint}</div>

          {uploaded ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-sm font-medium text-slate-900">Upload complete</div>
              <div className="text-xs text-slate-400 mt-1">Your document vault is refreshing…</div>
            </div>
          ) : (
            <UploadDropzone
              endpoint={tab.endpoint}
              input={{ description: description || undefined }}
              onClientUploadComplete={handleUploadComplete}
              appearance={{
                container: "border-2 border-dashed border-slate-200 rounded-xl p-6 cursor-pointer hover:border-slate-300 transition-colors ut-uploading:border-emerald-300",
                label: "text-sm text-slate-500",
                uploadIcon: "text-slate-300",
                button: "bg-slate-900 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors ut-readying:bg-slate-400",
              }}
            />
          )}
        </div>

        <div className="px-6 py-4" />
      </div>
    </div>
  )
}
