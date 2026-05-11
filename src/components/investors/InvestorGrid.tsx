import { InvestorCard } from "./InvestorCard"
import type { Investor } from "@/schemas/investor"

interface Props {
  investors: Investor[]
}

export function InvestorGrid({ investors }: Props) {
  return (
    <div>
      <div className="text-sm font-semibold text-slate-900 mb-3">Investors</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {investors.map((inv) => (
          <InvestorCard key={inv.id} investor={inv} />
        ))}
      </div>
    </div>
  )
}
