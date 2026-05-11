import { InvestorGrid } from "./InvestorGrid"
import { RoundTimeline } from "./RoundTimeline"
import { CapTable } from "./CapTable"
import type { Investor, FundingRound, CapTableEntry } from "@/schemas/investor"

interface Props {
  investors: Investor[]
  rounds: FundingRound[]
  capTable: CapTableEntry[]
}

export function InvestorDashboard({ investors, rounds, capTable }: Props) {
  return (
    <div className="space-y-8 max-w-7xl">
      <CapTable entries={capTable} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <RoundTimeline rounds={rounds} />
        <InvestorGrid investors={investors} />
      </div>
    </div>
  )
}
