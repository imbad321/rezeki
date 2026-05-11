interface Props {
  mimeType: string
  size?: number
}

export function FileTypeIcon({ mimeType, size = 32 }: Props) {
  if (mimeType.includes("pdf")) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#fee2e2" />
        <path d="M10 8h8l6 6v12H10V8z" fill="#fca5a5" />
        <path d="M18 8v6h6" fill="#ef4444" />
        <text x="10" y="22" fontSize="7" fontWeight="700" fill="#dc2626" fontFamily="sans-serif">PDF</text>
      </svg>
    )
  }
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("xlsx")) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#dcfce7" />
        <path d="M10 8h8l6 6v12H10V8z" fill="#bbf7d0" />
        <path d="M18 8v6h6" fill="#22c55e" />
        <text x="9" y="22" fontSize="6" fontWeight="700" fill="#16a34a" fontFamily="sans-serif">XLSX</text>
      </svg>
    )
  }
  if (mimeType.includes("presentation") || mimeType.includes("pptx")) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#fef3c7" />
        <path d="M10 8h8l6 6v12H10V8z" fill="#fde68a" />
        <path d="M18 8v6h6" fill="#f59e0b" />
        <text x="9" y="22" fontSize="6" fontWeight="700" fill="#d97706" fontFamily="sans-serif">PPTX</text>
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="6" fill="#f1f5f9" />
      <path d="M10 8h8l6 6v12H10V8z" fill="#e2e8f0" />
      <path d="M18 8v6h6" fill="#94a3b8" />
    </svg>
  )
}
