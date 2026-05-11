import { db } from "@/lib/prisma"
import type { BudgetApiResponse } from "@/schemas/budget"

export async function getBudgetData(clientId: string): Promise<BudgetApiResponse> {
  const departments = await db.department.findMany({
    where: { clientId },
    include: {
      budgets: {
        orderBy: { month: "asc" },
      },
    },
  })

  const allMonths = [
    ...new Set(
      departments.flatMap((d) => d.budgets.map((b) => b.month.toISOString()))
    ),
  ]
    .sort()
    .map((s) => new Date(s))

  const rows = departments.map((dept) => {
    const monthlyData = dept.budgets.map((entry) => {
      const variance = entry.actual - entry.budgeted
      const variancePct =
        entry.budgeted !== 0 ? (variance / entry.budgeted) * 100 : 0
      return {
        month: entry.month,
        budgeted: entry.budgeted,
        actual: entry.actual,
        variance,
        variancePct,
      }
    })

    const totalBudgeted = monthlyData.reduce((s, m) => s + m.budgeted, 0)
    const totalActual = monthlyData.reduce((s, m) => s + m.actual, 0)
    const totalVariancePct =
      totalBudgeted !== 0
        ? ((totalActual - totalBudgeted) / totalBudgeted) * 100
        : 0

    return {
      department: { id: dept.id, name: dept.name as any, color: dept.color },
      monthlyData,
      totalBudgeted,
      totalActual,
      totalVariancePct,
    }
  })

  return { rows, months: allMonths }
}
