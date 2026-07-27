import type { FundStaticInputs } from "@/lib/data/fund"
import type { LedgerPosition, PositionReconciliationRow } from "@/lib/reconciliation/types"

export interface NavResult {
  asOfDate: string
  grossAssetValueLedger: number
  grossAssetValueConfirmed: number
  accruedManagementFee: number
  otherAccruedLiabilities: number
  navLedger: number
  navConfirmed: number
  navPerUnitLedger: number
  navPerUnitConfirmed: number
  navImpactOfBreaks: number // navLedger - navConfirmed, signed
  unrecordedPositionsValue: number // custodian MV of missing_from_ledger rows, disclosed, excluded from navConfirmed
  unitsOutstanding: number
}

export function sumLedgerMarketValue(positions: LedgerPosition[]): number {
  return positions.reduce((sum, p) => sum + p.marketValue, 0)
}

export function computeAccruedManagementFee(grossAssetValue: number, annualRate: number): number {
  return round2((grossAssetValue * annualRate) / 12)
}

// The domain rule for which value a position contributes to the
// custodian-confirmed NAV, depending on reconciliation status:
//  - matched: custodian value (the independent, verified pricing source)
//  - any break except missing_from_ledger: ledger carrying value stands
//    — an unconfirmed number can't be substituted into NAV
//  - missing_from_ledger: 0 — the fund cannot include in its official NAV
//    a position it has never booked; disclosed separately instead
function marketValueForNav(row: PositionReconciliationRow): number {
  if (row.status === "missing_from_ledger") return 0
  if (row.status === "matched") return row.custodian!.marketValue
  return row.ledger!.marketValue
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function calculateNav(positionRows: PositionReconciliationRow[], fund: FundStaticInputs): NavResult {
  const positionsLedgerValue = positionRows.reduce((sum, row) => sum + (row.ledger?.marketValue ?? 0), 0)
  const positionsConfirmedValue = positionRows.reduce((sum, row) => sum + marketValueForNav(row), 0)

  const grossAssetValueLedger = round2(positionsLedgerValue + fund.cashAndEquivalents)
  const grossAssetValueConfirmed = round2(positionsConfirmedValue + fund.cashAndEquivalents)

  const accruedManagementFee = computeAccruedManagementFee(grossAssetValueLedger, fund.annualManagementFeeRate)

  const navLedger = round2(grossAssetValueLedger - accruedManagementFee - fund.otherAccruedLiabilities)
  const navConfirmed = round2(grossAssetValueConfirmed - accruedManagementFee - fund.otherAccruedLiabilities)

  const unrecordedPositionsValue = round2(
    positionRows.filter((r) => r.status === "missing_from_ledger").reduce((sum, r) => sum + (r.custodian?.marketValue ?? 0), 0)
  )

  return {
    asOfDate: fund.asOfDate,
    grossAssetValueLedger,
    grossAssetValueConfirmed,
    accruedManagementFee,
    otherAccruedLiabilities: fund.otherAccruedLiabilities,
    navLedger,
    navConfirmed,
    navPerUnitLedger: round2(navLedger / fund.unitsOutstanding),
    navPerUnitConfirmed: round2(navConfirmed / fund.unitsOutstanding),
    navImpactOfBreaks: round2(navLedger - navConfirmed),
    unrecordedPositionsValue,
    unitsOutstanding: fund.unitsOutstanding,
  }
}
