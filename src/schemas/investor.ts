import * as z from "zod"

export const InvestorTypeSchema = z.enum(["LEAD_VC", "VC", "ANGEL", "STRATEGIC"])
export const RoundTypeSchema = z.enum(["PRE_SEED", "SEED", "SERIES_A", "SERIES_B", "BRIDGE"])

export const InvestorSchema = z.object({
  id: z.string(),
  name: z.string(),
  firm: z.string().nullable(),
  type: InvestorTypeSchema,
  email: z.string().nullable(),
  logoUrl: z.string().nullable(),
  website: z.string().nullable(),
  leadRound: RoundTypeSchema.nullable(),
})

export const FundingRoundSchema = z.object({
  id: z.string(),
  roundType: RoundTypeSchema,
  closedAt: z.coerce.date(),
  amountRaised: z.number(),
  preMoneyVal: z.number(),
  postMoneyVal: z.number(),
  leadInvestor: z.string().nullable(),
})

export const CapTableEntrySchema = z.object({
  id: z.string(),
  investorId: z.string(),
  roundId: z.string(),
  sharesOwned: z.number(),
  ownershipPct: z.number(),
  sharePrice: z.number(),
  investedAmount: z.number(),
  investor: InvestorSchema,
  round: FundingRoundSchema,
})

export type Investor = z.infer<typeof InvestorSchema>
export type FundingRound = z.infer<typeof FundingRoundSchema>
export type CapTableEntry = z.infer<typeof CapTableEntrySchema>
