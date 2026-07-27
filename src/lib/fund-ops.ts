import { FUND_STATIC_INPUTS } from "@/lib/data/fund"
import { CUSTODIAN_POSITIONS, LEDGER_POSITIONS } from "@/lib/data/positions"
import { CUSTODIAN_TRANSACTIONS, LEDGER_TRANSACTIONS } from "@/lib/data/transactions"
import { calculateNav, computeAccruedManagementFee, sumLedgerMarketValue } from "@/lib/nav/calculate-nav"
import { reconcilePositions } from "@/lib/reconciliation/match-positions"
import { reconcileTransactions } from "@/lib/reconciliation/match-transactions"

export interface FundOpsSnapshot {
  fund: typeof FUND_STATIC_INPUTS
  positionRows: ReturnType<typeof reconcilePositions>
  transactionRows: ReturnType<typeof reconcileTransactions>
  nav: ReturnType<typeof calculateNav>
}

export function getFundOpsSnapshot(): FundOpsSnapshot {
  // A preliminary ledger NAV, used only as the materiality denominator
  // for classifying individual breaks. Computed directly from the raw
  // ledger arrays (not from reconciliation output), so there's no
  // circular dependency between "reconcile the breaks" and "know how big
  // the fund is." calculateNav() below recomputes the authoritative
  // navLedger from the reconciled rows using the identical formula, so
  // the two numbers always agree.
  const gavLedgerPreview = sumLedgerMarketValue(LEDGER_POSITIONS) + FUND_STATIC_INPUTS.cashAndEquivalents
  const feePreview = computeAccruedManagementFee(gavLedgerPreview, FUND_STATIC_INPUTS.annualManagementFeeRate)
  const navLedgerReference = gavLedgerPreview - feePreview - FUND_STATIC_INPUTS.otherAccruedLiabilities

  const positionRows = reconcilePositions(LEDGER_POSITIONS, CUSTODIAN_POSITIONS, navLedgerReference)
  const transactionRows = reconcileTransactions(LEDGER_TRANSACTIONS, CUSTODIAN_TRANSACTIONS, navLedgerReference)
  const nav = calculateNav(positionRows, FUND_STATIC_INPUTS)

  return { fund: FUND_STATIC_INPUTS, positionRows, transactionRows, nav }
}
