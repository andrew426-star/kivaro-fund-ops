import type { CustodianPosition, LedgerPosition, PositionReconciliationRow } from "@/lib/reconciliation/types"
import {
  MATERIALITY_ABS_FLOOR,
  MATERIALITY_THRESHOLD_BPS,
  PRICE_TOLERANCE_BPS,
  QUANTITY_EPSILON,
} from "@/lib/reconciliation/tolerance"

function materiality(marketValueDelta: number, fundNavReference: number) {
  const materialityBps = fundNavReference === 0 ? 0 : (Math.abs(marketValueDelta) / fundNavReference) * 10_000
  const isMaterial = materialityBps >= MATERIALITY_THRESHOLD_BPS && Math.abs(marketValueDelta) >= MATERIALITY_ABS_FLOOR
  return { materialityBps, isMaterial }
}

// Matching key is symbol only (one position per symbol per fund per
// period) — a deliberate demo simplification. Real reconciliation keys
// on CUSIP/ISIN + account.
export function reconcilePositions(
  ledgerPositions: LedgerPosition[],
  custodianPositions: CustodianPosition[],
  fundNavReference: number
): PositionReconciliationRow[] {
  const ledgerBySymbol = new Map(ledgerPositions.map((p) => [p.symbol, p]))
  const custodianBySymbol = new Map(custodianPositions.map((p) => [p.symbol, p]))
  const allSymbols = new Set([...ledgerBySymbol.keys(), ...custodianBySymbol.keys()])

  const rows: PositionReconciliationRow[] = []

  for (const symbol of allSymbols) {
    const ledger = ledgerBySymbol.get(symbol) ?? null
    const custodian = custodianBySymbol.get(symbol) ?? null
    const name = (ledger ?? custodian)!.name
    const assetClass = (ledger ?? custodian)!.assetClass

    if (ledger && !custodian) {
      const { materialityBps, isMaterial } = materiality(ledger.marketValue, fundNavReference)
      rows.push({
        symbol,
        name,
        assetClass,
        status: "missing_from_custodian",
        ledger,
        custodian: null,
        quantityDelta: null,
        marketValueDelta: ledger.marketValue,
        materialityBps,
        isMaterial,
      })
      continue
    }

    if (custodian && !ledger) {
      const { materialityBps, isMaterial } = materiality(custodian.marketValue, fundNavReference)
      rows.push({
        symbol,
        name,
        assetClass,
        status: "missing_from_ledger",
        ledger: null,
        custodian,
        quantityDelta: null,
        marketValueDelta: -custodian.marketValue,
        materialityBps,
        isMaterial,
      })
      continue
    }

    // Both present.
    const quantityDelta = ledger!.quantity - custodian!.quantity
    const marketValueDelta = ledger!.marketValue - custodian!.marketValue

    let status: PositionReconciliationRow["status"] = "matched"
    if (Math.abs(quantityDelta) > QUANTITY_EPSILON) {
      status = "quantity_break"
    } else {
      const priceDeltaBps = ledger!.price === 0 ? 0 : (Math.abs(ledger!.price - custodian!.price) / ledger!.price) * 10_000
      if (priceDeltaBps > PRICE_TOLERANCE_BPS) status = "price_break"
    }

    const { materialityBps, isMaterial } = materiality(marketValueDelta, fundNavReference)
    rows.push({
      symbol,
      name,
      assetClass,
      status,
      ledger,
      custodian,
      quantityDelta,
      marketValueDelta,
      materialityBps,
      isMaterial: status === "matched" ? false : isMaterial,
    })
  }

  return rows.sort((a, b) => a.symbol.localeCompare(b.symbol))
}
