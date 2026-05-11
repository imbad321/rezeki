import * as z from "zod"

export const MrrDataPointSchema = z.object({
  id: z.string(),
  month: z.coerce.date(),
  mrr: z.number(),
  newMrr: z.number(),
  expansion: z.number(),
  churn: z.number(),
})

export const CompanySnapshotSchema = z.object({
  id: z.string(),
  snapshotDate: z.coerce.date(),
  cashOnHand: z.number(),
  burnRate: z.number(),
  headcount: z.number(),
  arr: z.number(),
})

export const KpiDataSchema = z.object({
  mrr: z.number(),
  arr: z.number(),
  burnRate: z.number(),
  runway: z.number(),
  cashOnHand: z.number(),
  headcount: z.number(),
  mrrGrowthPct: z.number(),
})

export const BurnSeriesPointSchema = z.object({
  month: z.coerce.date(),
  burn: z.number(),
  cash: z.number(),
})

export const DashboardApiResponseSchema = z.object({
  kpis: KpiDataSchema,
  mrrSeries: z.array(MrrDataPointSchema),
  burnSeries: z.array(BurnSeriesPointSchema),
})

export type MrrDataPoint = z.infer<typeof MrrDataPointSchema>
export type KpiData = z.infer<typeof KpiDataSchema>
export type BurnSeriesPoint = z.infer<typeof BurnSeriesPointSchema>
export type DashboardApiResponse = z.infer<typeof DashboardApiResponseSchema>
