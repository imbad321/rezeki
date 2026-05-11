import { db } from "@/lib/prisma"
import type { Investor, FundingRound, CapTableEntry } from "@/schemas/investor"

export async function getInvestors(clientId: string): Promise<Investor[]> {
  const investors = await db.investor.findMany({
    where: { clientId },
    orderBy: { name: "asc" },
  })
  return investors as Investor[]
}

export async function getFundingRounds(clientId: string): Promise<FundingRound[]> {
  const rounds = await db.fundingRound.findMany({
    where: { clientId },
    orderBy: { closedAt: "asc" },
  })
  return rounds as FundingRound[]
}

export async function getCapTable(clientId: string): Promise<CapTableEntry[]> {
  const entries = await db.capTableEntry.findMany({
    where: { investor: { clientId } },
    include: { investor: true, round: true },
    orderBy: { ownershipPct: "desc" },
  })
  return entries as unknown as CapTableEntry[]
}
