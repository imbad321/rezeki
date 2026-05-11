import * as z from "zod"

export const DepartmentNameSchema = z.enum([
  "ENGINEERING",
  "SALES",
  "MARKETING",
  "G_AND_A",
  "PRODUCT",
  "CUSTOMER_SUCCESS",
])

export const BudgetEntrySchema = z.object({
  id: z.string(),
  departmentId: z.string(),
  month: z.coerce.date(),
  budgeted: z.number(),
  actual: z.number(),
})

export const DepartmentSchema = z.object({
  id: z.string(),
  name: DepartmentNameSchema,
  color: z.string(),
})

export const MonthlyBudgetSchema = z.object({
  month: z.coerce.date(),
  budgeted: z.number(),
  actual: z.number(),
  variance: z.number(),
  variancePct: z.number(),
})

export const BudgetRowSchema = z.object({
  department: DepartmentSchema,
  monthlyData: z.array(MonthlyBudgetSchema),
  totalBudgeted: z.number(),
  totalActual: z.number(),
  totalVariancePct: z.number(),
})

export const BudgetApiResponseSchema = z.object({
  rows: z.array(BudgetRowSchema),
  months: z.array(z.coerce.date()),
})

export type Department = z.infer<typeof DepartmentSchema>
export type BudgetRow = z.infer<typeof BudgetRowSchema>
export type MonthlyBudget = z.infer<typeof MonthlyBudgetSchema>
export type BudgetApiResponse = z.infer<typeof BudgetApiResponseSchema>
