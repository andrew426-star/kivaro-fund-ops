import type { CustodianTransaction, LedgerTransaction, TransactionReconciliationRow } from "@/lib/reconciliation/types"
import {
  MATERIALITY_ABS_FLOOR,
  MATERIALITY_THRESHOLD_BPS,
  PRICE_TOLERANCE_BPS,
  QUANTITY_EPSILON,
  TIMING_WINDOW_DAYS,
} from "@/lib/reconciliation/tolerance"

function materiality(netAmountDelta: number, fundNavReference: number) {
  const materialityBps = fundNavReference === 0 ? 0 : (Math.abs(netAmountDelta) / fundNavReference) * 10_000
  const isMaterial = materialityBps >= MATERIALITY_THRESHOLD_BPS && Math.abs(netAmountDelta) >= MATERIALITY_ABS_FLOOR
  return { materialityBps, isMaterial }
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / msPerDay)
}

function txKey(t: { symbol: string; side: string; tradeDate: string }): string {
  return `${t.symbol}|${t.side}|${t.tradeDate}`
}

function buildRow(
  symbol: string,
  side: "Buy" | "Sell",
  status: TransactionReconciliationRow["status"],
  ledger: LedgerTransaction | null,
  custodian: CustodianTransaction | null,
  fundNavReference: number,
  tradeDateDeltaDays: number | null = null
): TransactionReconciliationRow {
  const quantityDelta = ledger && custodian ? ledger.quantity - custodian.quantity : null
  const netAmountDelta = ledger && custodian ? ledger.netAmount - custodian.netAmount : ledger ? ledger.netAmount : custodian ? -custodian.netAmount : 0
  const { materialityBps, isMaterial } = materiality(netAmountDelta, fundNavReference)
  const transactionKey = txKey(ledger ?? custodian!)

  return {
    transactionKey,
    symbol,
    side,
    status,
    ledger,
    custodian,
    quantityDelta,
    netAmountDelta,
    tradeDateDeltaDays,
    materialityBps,
    isMaterial: status === "matched" ? false : isMaterial,
  }
}

// Two-pass matcher: (1) exact key symbol|side|tradeDate, (2) fuzzy pass on
// symbol|side with quantity within tolerance and tradeDate within
// TIMING_WINDOW_DAYS for whatever's left, classified timing_difference.
// Anything still unmatched after both passes is genuinely one-sided.
export function reconcileTransactions(
  ledgerTransactions: LedgerTransaction[],
  custodianTransactions: CustodianTransaction[],
  fundNavReference: number
): TransactionReconciliationRow[] {
  const rows: TransactionReconciliationRow[] = []

  const ledgerRemaining = new Map(ledgerTransactions.map((t) => [txKey(t), t]))
  const custodianRemaining = new Map(custodianTransactions.map((t) => [txKey(t), t]))

  // Pass 1: exact key match.
  for (const [key, ledger] of [...ledgerRemaining]) {
    const custodian = custodianRemaining.get(key)
    if (!custodian) continue

    const quantityDelta = ledger.quantity - custodian.quantity
    let status: TransactionReconciliationRow["status"] = "matched"
    if (Math.abs(quantityDelta) > QUANTITY_EPSILON) {
      status = "quantity_break"
    } else {
      const priceDeltaBps = ledger.price === 0 ? 0 : (Math.abs(ledger.price - custodian.price) / ledger.price) * 10_000
      if (priceDeltaBps > PRICE_TOLERANCE_BPS) status = "price_break"
    }

    rows.push(buildRow(ledger.symbol, ledger.side, status, ledger, custodian, fundNavReference))
    ledgerRemaining.delete(key)
    custodianRemaining.delete(key)
  }

  // Pass 2: fuzzy match on symbol|side, quantity within tolerance, trade
  // date within the timing window.
  for (const [ledgerKey, ledger] of [...ledgerRemaining]) {
    let bestMatchKey: string | null = null
    let bestMatchDelta = Infinity

    for (const [custodianKey, custodian] of custodianRemaining) {
      if (custodian.symbol !== ledger.symbol || custodian.side !== ledger.side) continue
      if (Math.abs(custodian.quantity - ledger.quantity) > QUANTITY_EPSILON) continue
      const dayDelta = Math.abs(daysBetween(ledger.tradeDate, custodian.tradeDate))
      if (dayDelta === 0 || dayDelta > TIMING_WINDOW_DAYS) continue
      if (dayDelta < bestMatchDelta) {
        bestMatchDelta = dayDelta
        bestMatchKey = custodianKey
      }
    }

    if (bestMatchKey) {
      const custodian = custodianRemaining.get(bestMatchKey)!
      rows.push(
        buildRow(
          ledger.symbol,
          ledger.side,
          "timing_difference",
          ledger,
          custodian,
          fundNavReference,
          daysBetween(custodian.tradeDate, ledger.tradeDate)
        )
      )
      ledgerRemaining.delete(ledgerKey)
      custodianRemaining.delete(bestMatchKey)
    }
  }

  // Whatever's left is genuinely one-sided.
  for (const ledger of ledgerRemaining.values()) {
    rows.push(buildRow(ledger.symbol, ledger.side, "missing_from_custodian", ledger, null, fundNavReference))
  }
  for (const custodian of custodianRemaining.values()) {
    rows.push(buildRow(custodian.symbol, custodian.side, "missing_from_ledger", null, custodian, fundNavReference))
  }

  return rows.sort((a, b) => a.transactionKey.localeCompare(b.transactionKey))
}
