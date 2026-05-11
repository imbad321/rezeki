import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

const adapter = new PrismaBetterSqlite3({ url: "dev.db" })
const db = new PrismaClient({ adapter })

function utc(year: number, month: number, day = 1) {
  return new Date(Date.UTC(year, month - 1, day))
}

// Map flat index (0..17) to a Date spread across Nov 2024 – Apr 2026
function txMonth(i: number): Date {
  const months = [
    utc(2024, 11), utc(2024, 12),
    utc(2025, 1),  utc(2025, 2),  utc(2025, 3),  utc(2025, 4),
    utc(2025, 5),  utc(2025, 6),  utc(2025, 7),  utc(2025, 8),
    utc(2025, 9),  utc(2025, 10), utc(2025, 11), utc(2025, 12),
    utc(2026, 1),  utc(2026, 2),  utc(2026, 3),  utc(2026, 4),
  ]
  return months[i]
}

async function main() {
  console.log("Seeding Meridian (multi-client)…")

  await db.budgetEntry.deleteMany()
  await db.department.deleteMany()
  await db.capTableEntry.deleteMany()
  await db.investor.deleteMany()
  await db.fundingRound.deleteMany()
  await db.mrrDataPoint.deleteMany()
  await db.companySnapshot.deleteMany()
  await db.transaction.deleteMany()
  await db.document.deleteMany()
  await db.client.deleteMany()

  // ── CLIENT 1 · Nexus AI ──────────────────────────────────────────────────
  const nexus = await db.client.create({
    data: { name: "Nexus AI", industry: "Artificial Intelligence", stage: "Series A", color: "#6366f1" },
  })

  const nexusMrr = [42000,46500,51200,56800,62400,68900,74300,82100,89400,97200,106500,114800,124300,135700,148200,162400,177800,194500]
  for (let i = 0; i < nexusMrr.length; i++) {
    const mrr = nexusMrr[i]; const prev = i > 0 ? nexusMrr[i-1] : mrr
    await db.mrrDataPoint.create({ data: { clientId: nexus.id, month: txMonth(i), mrr, newMrr: Math.round((mrr-prev)*0.7), expansion: Math.round((mrr-prev)*0.4), churn: Math.round(prev*0.02) } })
  }
  await db.companySnapshot.create({ data: { clientId: nexus.id, snapshotDate: utc(2026,5,1), cashOnHand: 8_400_000, burnRate: 310_000, headcount: 47, arr: 194500*12 } })

  for (let i = 0; i < 18; i++) {
    const dt = new Date(txMonth(i)); dt.setUTCDate(15)
    const b = nexusMrr[i]
    await db.transaction.createMany({ data: [
      { clientId: nexus.id, date: dt, description: "Monthly SaaS Revenue",    category: "SaaS Subscriptions",  type: "INCOME",  amount: Math.round(b*0.72) },
      { clientId: nexus.id, date: dt, description: "Professional Services",   category: "Professional Services",type: "INCOME",  amount: Math.round(b*0.18) },
      { clientId: nexus.id, date: dt, description: "API Usage Fees",          category: "API Usage",            type: "INCOME",  amount: Math.round(b*0.10) },
      { clientId: nexus.id, date: dt, description: "Payroll & Benefits",      category: "Payroll",              type: "EXPENSE", amount: Math.round(170_000+i*4000) },
      { clientId: nexus.id, date: dt, description: "AWS / GCP Infrastructure",category: "Infrastructure",       type: "EXPENSE", amount: Math.round(28_000+i*1200) },
      { clientId: nexus.id, date: dt, description: "Sales & Marketing",       category: "Sales & Marketing",    type: "EXPENSE", amount: Math.round(55_000+i*2000) },
      { clientId: nexus.id, date: dt, description: "Software & Tools",        category: "R&D Tools",            type: "EXPENSE", amount: 14_500 },
      { clientId: nexus.id, date: dt, description: "Office & Admin",          category: "Office & Admin",       type: "EXPENSE", amount: 8_200 },
      { clientId: nexus.id, date: dt, description: "Legal & Compliance",      category: "Legal & Compliance",   type: "EXPENSE", amount: 6_800 },
    ]})
  }

  const [nSeq, nA16z, nAngel] = await Promise.all([
    db.investor.create({ data: { clientId: nexus.id, name: "Michael Chen",  firm: "Sequoia Capital",         type: "LEAD_VC", email: "mchen@sequoia.com",   leadRound: "SERIES_A" } }),
    db.investor.create({ data: { clientId: nexus.id, name: "Sarah Park",    firm: "a16z",                   type: "VC",      email: "spark@a16z.com" } }),
    db.investor.create({ data: { clientId: nexus.id, name: "James Torres",  firm: null,                     type: "ANGEL",   email: "jtorres@gmail.com" } }),
  ])
  const [nSeed, nSerA] = await Promise.all([
    db.fundingRound.create({ data: { clientId: nexus.id, roundType: "SEED",     closedAt: utc(2023,3,15), amountRaised: 3_500_000,  preMoneyVal: 10_000_000, postMoneyVal: 13_500_000, leadInvestor: "a16z" } }),
    db.fundingRound.create({ data: { clientId: nexus.id, roundType: "SERIES_A", closedAt: utc(2024,2,20), amountRaised: 18_000_000, preMoneyVal: 52_000_000, postMoneyVal: 70_000_000, leadInvestor: "Sequoia Capital" } }),
  ])
  await db.capTableEntry.createMany({ data: [
    { investorId: nSeq.id,   roundId: nSerA.id, sharesOwned: 4_200_000, ownershipPct: 22.4, sharePrice: 3.21, investedAmount: 13_500_000 },
    { investorId: nA16z.id,  roundId: nSeed.id, sharesOwned: 2_100_000, ownershipPct: 11.2, sharePrice: 1.12, investedAmount: 2_350_000 },
    { investorId: nA16z.id,  roundId: nSerA.id, sharesOwned: 870_000,   ownershipPct: 4.6,  sharePrice: 3.21, investedAmount: 2_800_000 },
    { investorId: nAngel.id, roundId: nSeed.id, sharesOwned: 530_000,   ownershipPct: 2.8,  sharePrice: 1.12, investedAmount: 600_000 },
  ]})

  const nDepts = await Promise.all([
    db.department.create({ data: { clientId: nexus.id, name: "ENGINEERING",     color: "#6366f1" } }),
    db.department.create({ data: { clientId: nexus.id, name: "SALES",           color: "#22d3ee" } }),
    db.department.create({ data: { clientId: nexus.id, name: "MARKETING",       color: "#a78bfa" } }),
    db.department.create({ data: { clientId: nexus.id, name: "G_AND_A",         color: "#f59e0b" } }),
    db.department.create({ data: { clientId: nexus.id, name: "PRODUCT",         color: "#34d399" } }),
  ])
  const nBudBase = [[120000,125000],[85000,92000],[60000,58000],[35000,34000],[45000,48000]]
  const budgetMonths = [utc(2025,12),utc(2026,1),utc(2026,2),utc(2026,3),utc(2026,4),utc(2026,5)]
  for (let m = 0; m < 6; m++) for (let di = 0; di < nDepts.length; di++) {
    const [bud, act] = nBudBase[di]
    await db.budgetEntry.create({ data: { departmentId: nDepts[di].id, month: budgetMonths[m], budgeted: bud+m*2000, actual: act+m*1800+Math.round((Math.random()-0.5)*5000) } })
  }

  // ── CLIENT 2 · Verdant Health ────────────────────────────────────────────
  const verdant = await db.client.create({
    data: { name: "Verdant Health", industry: "Digital Health", stage: "Seed", color: "#22d3a5" },
  })

  const vMrr = [8200,9400,10800,12100,13900,15600,17200,19400,21800,24500,27300,30800,34200,38100,42600,47800,53400,59900]
  for (let i = 0; i < vMrr.length; i++) {
    const mrr = vMrr[i]; const prev = i > 0 ? vMrr[i-1] : mrr
    await db.mrrDataPoint.create({ data: { clientId: verdant.id, month: txMonth(i), mrr, newMrr: Math.round((mrr-prev)*0.8), expansion: Math.round((mrr-prev)*0.25), churn: Math.round(prev*0.018) } })
  }
  await db.companySnapshot.create({ data: { clientId: verdant.id, snapshotDate: utc(2026,5,1), cashOnHand: 2_100_000, burnRate: 98_000, headcount: 14, arr: 59900*12 } })

  for (let i = 0; i < 18; i++) {
    const dt = new Date(txMonth(i)); dt.setUTCDate(15)
    const b = vMrr[i]
    await db.transaction.createMany({ data: [
      { clientId: verdant.id, date: dt, description: "B2B Clinic Subscriptions",    category: "SaaS Subscriptions", type: "INCOME",  amount: Math.round(b*0.65) },
      { clientId: verdant.id, date: dt, description: "Patient Platform Revenue",    category: "Platform Revenue",   type: "INCOME",  amount: Math.round(b*0.35) },
      { clientId: verdant.id, date: dt, description: "Payroll & Benefits",          category: "Payroll",            type: "EXPENSE", amount: Math.round(52_000+i*1500) },
      { clientId: verdant.id, date: dt, description: "Cloud Infrastructure",        category: "Infrastructure",     type: "EXPENSE", amount: 8_400 },
      { clientId: verdant.id, date: dt, description: "Sales & Marketing",           category: "Sales & Marketing",  type: "EXPENSE", amount: Math.round(18_000+i*600) },
      { clientId: verdant.id, date: dt, description: "HIPAA Compliance & Legal",   category: "Legal & Compliance", type: "EXPENSE", amount: 7_500 },
      { clientId: verdant.id, date: dt, description: "Office & Operations",         category: "Office & Admin",     type: "EXPENSE", amount: 4_200 },
    ]})
  }

  const [vFM, vBio] = await Promise.all([
    db.investor.create({ data: { clientId: verdant.id, name: "Rachel Kim",    firm: "First Mark Capital", type: "LEAD_VC", email: "rkim@firstmark.com", leadRound: "SEED" } }),
    db.investor.create({ data: { clientId: verdant.id, name: "David Nguyen", firm: "Bioventures",        type: "VC",      email: "dnguyen@bio.com" } }),
    db.investor.create({ data: { clientId: verdant.id, name: "Linda Zhao",   firm: null,                 type: "ANGEL",   email: "lzhao@gmail.com" } }),
  ])
  const vSeedRound = await db.fundingRound.create({ data: { clientId: verdant.id, roundType: "SEED", closedAt: utc(2024,6,10), amountRaised: 4_200_000, preMoneyVal: 12_000_000, postMoneyVal: 16_200_000, leadInvestor: "First Mark Capital" } })
  await db.capTableEntry.createMany({ data: [
    { investorId: vFM.id,  roundId: vSeedRound.id, sharesOwned: 3_200_000, ownershipPct: 18.5, sharePrice: 0.88, investedAmount: 2_800_000 },
    { investorId: vBio.id, roundId: vSeedRound.id, sharesOwned: 1_100_000, ownershipPct: 6.4,  sharePrice: 0.88, investedAmount: 950_000 },
  ]})

  const vDepts = await Promise.all([
    db.department.create({ data: { clientId: verdant.id, name: "ENGINEERING", color: "#22d3a5" } }),
    db.department.create({ data: { clientId: verdant.id, name: "SALES",       color: "#22d3ee" } }),
    db.department.create({ data: { clientId: verdant.id, name: "MARKETING",   color: "#a78bfa" } }),
    db.department.create({ data: { clientId: verdant.id, name: "G_AND_A",     color: "#f59e0b" } }),
  ])
  const vBudBase = [[42000,44000],[22000,24500],[15000,16200],[12000,11800]]
  for (let m = 0; m < 6; m++) for (let di = 0; di < vDepts.length; di++) {
    const [bud, act] = vBudBase[di]
    await db.budgetEntry.create({ data: { departmentId: vDepts[di].id, month: budgetMonths[m], budgeted: bud+m*500, actual: act+m*400+Math.round((Math.random()-0.5)*2000) } })
  }

  // ── CLIENT 3 · StackFlow ─────────────────────────────────────────────────
  const stack = await db.client.create({
    data: { name: "StackFlow", industry: "Developer Tools", stage: "Series B", color: "#f59e0b" },
  })

  const sMrr = [285000,302000,318000,336000,354000,372000,394000,418000,441000,468000,497000,528000,561000,596000,634000,675000,718000,764000]
  for (let i = 0; i < sMrr.length; i++) {
    const mrr = sMrr[i]; const prev = i > 0 ? sMrr[i-1] : mrr
    await db.mrrDataPoint.create({ data: { clientId: stack.id, month: txMonth(i), mrr, newMrr: Math.round((mrr-prev)*0.6), expansion: Math.round((mrr-prev)*0.5), churn: Math.round(prev*0.015) } })
  }
  await db.companySnapshot.create({ data: { clientId: stack.id, snapshotDate: utc(2026,5,1), cashOnHand: 34_200_000, burnRate: 820_000, headcount: 112, arr: 764000*12 } })

  for (let i = 0; i < 18; i++) {
    const dt = new Date(txMonth(i)); dt.setUTCDate(15)
    const b = sMrr[i]
    await db.transaction.createMany({ data: [
      { clientId: stack.id, date: dt, description: "Seat-based Subscriptions",  category: "SaaS Subscriptions",  type: "INCOME",  amount: Math.round(b*0.68) },
      { clientId: stack.id, date: dt, description: "Enterprise Contracts",      category: "Enterprise Licenses", type: "INCOME",  amount: Math.round(b*0.22) },
      { clientId: stack.id, date: dt, description: "Marketplace Revenue",       category: "Marketplace",         type: "INCOME",  amount: Math.round(b*0.10) },
      { clientId: stack.id, date: dt, description: "Payroll & Benefits",        category: "Payroll",             type: "EXPENSE", amount: Math.round(480_000+i*8000) },
      { clientId: stack.id, date: dt, description: "Cloud & CDN",               category: "Infrastructure",      type: "EXPENSE", amount: Math.round(72_000+i*2400) },
      { clientId: stack.id, date: dt, description: "Performance Marketing",     category: "Sales & Marketing",   type: "EXPENSE", amount: Math.round(145_000+i*3000) },
      { clientId: stack.id, date: dt, description: "Software & Tooling",        category: "R&D Tools",           type: "EXPENSE", amount: 38_000 },
      { clientId: stack.id, date: dt, description: "Office & Facilities",       category: "Office & Admin",      type: "EXPENSE", amount: 28_500 },
      { clientId: stack.id, date: dt, description: "Legal, Finance & HR",       category: "Legal & Compliance",  type: "EXPENSE", amount: 22_000 },
    ]})
  }

  const [sTiger, sInsight, sAccel] = await Promise.all([
    db.investor.create({ data: { clientId: stack.id, name: "Alex Rivera",   firm: "Tiger Global",      type: "LEAD_VC", email: "arivera@tiger.com",   leadRound: "SERIES_B" } }),
    db.investor.create({ data: { clientId: stack.id, name: "Priya Patel",   firm: "Insight Partners",  type: "VC",      email: "ppatel@insight.com" } }),
    db.investor.create({ data: { clientId: stack.id, name: "Tom Blackwell", firm: "Accel",             type: "VC",      email: "tblack@accel.com" } }),
    db.investor.create({ data: { clientId: stack.id, name: "Susan Lee",     firm: null,                type: "ANGEL",   email: "slee@gmail.com" } }),
  ])
  const [sfSeed, sfSerA, sfSerB] = await Promise.all([
    db.fundingRound.create({ data: { clientId: stack.id, roundType: "SEED",     closedAt: utc(2021,8,5),  amountRaised: 2_800_000,  preMoneyVal: 8_000_000,   postMoneyVal: 10_800_000,  leadInvestor: "Accel" } }),
    db.fundingRound.create({ data: { clientId: stack.id, roundType: "SERIES_A", closedAt: utc(2022,11,12),amountRaised: 22_000_000, preMoneyVal: 68_000_000,  postMoneyVal: 90_000_000,  leadInvestor: "Insight Partners" } }),
    db.fundingRound.create({ data: { clientId: stack.id, roundType: "SERIES_B", closedAt: utc(2024,4,18), amountRaised: 75_000_000, preMoneyVal: 280_000_000, postMoneyVal: 355_000_000, leadInvestor: "Tiger Global" } }),
  ])
  await db.capTableEntry.createMany({ data: [
    { investorId: sTiger.id,   roundId: sfSerB.id, sharesOwned: 12_500_000, ownershipPct: 19.8, sharePrice: 5.60, investedAmount: 70_000_000 },
    { investorId: sInsight.id, roundId: sfSerA.id, sharesOwned: 6_200_000,  ownershipPct: 9.8,  sharePrice: 2.85, investedAmount: 17_700_000 },
    { investorId: sAccel.id,   roundId: sfSeed.id, sharesOwned: 1_800_000,  ownershipPct: 2.8,  sharePrice: 0.62, investedAmount: 1_100_000 },
  ]})

  const sDepts = await Promise.all([
    db.department.create({ data: { clientId: stack.id, name: "ENGINEERING",     color: "#f59e0b" } }),
    db.department.create({ data: { clientId: stack.id, name: "SALES",           color: "#22d3ee" } }),
    db.department.create({ data: { clientId: stack.id, name: "MARKETING",       color: "#a78bfa" } }),
    db.department.create({ data: { clientId: stack.id, name: "G_AND_A",         color: "#fb923c" } }),
    db.department.create({ data: { clientId: stack.id, name: "PRODUCT",         color: "#34d399" } }),
    db.department.create({ data: { clientId: stack.id, name: "CUSTOMER_SUCCESS",color: "#f472b6" } }),
  ])
  const sBudBase = [[320000,335000],[180000,192000],[150000,162000],[85000,82000],[95000,98000],[65000,68000]]
  for (let m = 0; m < 6; m++) for (let di = 0; di < sDepts.length; di++) {
    const [bud, act] = sBudBase[di]
    await db.budgetEntry.create({ data: { departmentId: sDepts[di].id, month: budgetMonths[m], budgeted: bud+m*3000, actual: act+m*2800+Math.round((Math.random()-0.5)*12000) } })
  }

  console.log("✓ Seeded 3 clients: Nexus AI · Verdant Health · StackFlow")
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
