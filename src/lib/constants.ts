import {
  LayoutDashboard,
  FolderLock,
  Users,
  BarChart3,
  ArrowLeftRight,
} from "lucide-react"

export const NAV_ITEMS = [
  { label: "Dashboard",    href: "/dashboard",    icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Budget",       href: "/budget",       icon: BarChart3 },
  { label: "Investors",    href: "/investors",    icon: Users },
  { label: "Documents",    href: "/documents",    icon: FolderLock },
] as const

export const DOCUMENT_CATEGORIES = [
  { value: "ALL",              label: "All Files" },
  { value: "FINANCIAL_MODEL",  label: "Financial Models" },
  { value: "BOARD_DECK",       label: "Board Decks" },
  { value: "INVESTOR_UPDATE",  label: "Investor Updates" },
  { value: "OTHER",            label: "Other" },
] as const

export type DocumentCategory = "ALL" | "FINANCIAL_MODEL" | "BOARD_DECK" | "INVESTOR_UPDATE" | "OTHER"

export const DEPT_COLORS: Record<string, string> = {
  ENGINEERING:      "#6366f1",
  SALES:            "#22d3ee",
  MARKETING:        "#a78bfa",
  G_AND_A:          "#f59e0b",
  PRODUCT:          "#34d399",
  CUSTOMER_SUCCESS: "#f472b6",
}

export const DEPT_LABELS: Record<string, string> = {
  ENGINEERING:      "Engineering",
  SALES:            "Sales",
  MARKETING:        "Marketing",
  G_AND_A:          "G&A",
  PRODUCT:          "Product",
  CUSTOMER_SUCCESS: "Customer Success",
}

export const INVESTOR_TYPE_LABELS: Record<string, string> = {
  LEAD_VC:   "Lead VC",
  VC:        "VC",
  ANGEL:     "Angel",
  STRATEGIC: "Strategic",
}

export const ROUND_LABELS: Record<string, string> = {
  PRE_SEED: "Pre-Seed",
  SEED:     "Seed",
  SERIES_A: "Series A",
  SERIES_B: "Series B",
  BRIDGE:   "Bridge",
}

export const TRANSACTION_CATEGORIES = [
  "SaaS Subscriptions",
  "Professional Services",
  "API Usage",
  "Enterprise Licenses",
  "Platform Revenue",
  "Marketplace",
  "Payroll",
  "Infrastructure",
  "Sales & Marketing",
  "R&D Tools",
  "Office & Admin",
  "Legal & Compliance",
] as const
