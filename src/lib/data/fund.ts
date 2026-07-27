// Fully synthetic — no real fund, client, or capital is represented. See
// SampleDataBanner. Fixed, hardcoded period (not seeded-random like
// kivaro-strategy-dashboard's portfolio.ts) so every figure in this demo
// is reproducible and hand-verifiable.

export interface FundStaticInputs {
  fundName: string
  asOfDate: string
  unitsOutstanding: number
  annualManagementFeeRate: number
  otherAccruedLiabilities: number
  cashAndEquivalents: number
}

export const FUND_STATIC_INPUTS: FundStaticInputs = {
  fundName: "Meridian Capital Partners — Illustrative Fund",
  asOfDate: "2026-06-30",
  unitsOutstanding: 1_000_000,
  annualManagementFeeRate: 0.02,
  otherAccruedLiabilities: 85_000,
  // No cash break is seeded — custodian-confirmed, out of scope for this
  // demo's reconciliation surface.
  cashAndEquivalents: 1_145_800,
}
