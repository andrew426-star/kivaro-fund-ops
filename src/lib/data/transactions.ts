import type { CustodianTransaction, LedgerTransaction } from "@/lib/reconciliation/types"

// Fully synthetic trade blotter for the period ending 2026-06-30. Same
// two-independent-arrays pattern as positions.ts. The NVDA sell here is
// deliberately linked to positions.ts's NVDA quantity_break — the
// unbooked sell is the real-world root cause of that position break, and
// the AI narrative is expected to connect the two.

export const LEDGER_TRANSACTIONS: LedgerTransaction[] = [
  { symbol: "AAPL", side: "Buy", tradeDate: "2026-06-05", quantity: 3_000, price: 192.1, netAmount: 576_300 },
  // Seeded price_break: ledger booked at $410.00; custodian confirms
  // execution at $416.50 (beyond the tolerance band).
  { symbol: "MSFT", side: "Buy", tradeDate: "2026-06-08", quantity: 1_500, price: 410.0, netAmount: 615_000 },
  { symbol: "GOOGL", side: "Buy", tradeDate: "2026-06-10", quantity: 2_000, price: 175.2, netAmount: 350_400 },
  // No NVDA sell here — see missing_from_ledger note in
  // CUSTODIAN_TRANSACTIONS. This is what explains positions.ts's NVDA
  // quantity_break.
  // Seeded quantity_break: ledger books 2,000 shares sold; custodian
  // confirms only 1,800.
  { symbol: "JPM", side: "Sell", tradeDate: "2026-06-15", quantity: 2_000, price: 246.5, netAmount: 493_000 },
  // Seeded timing_difference: identical quantity/price, trade date 2
  // days apart (within the 3-day matching window).
  { symbol: "AGG", side: "Buy", tradeDate: "2026-06-18", quantity: 5_000, price: 98.0, netAmount: 490_000 },
  { symbol: "LQD", side: "Sell", tradeDate: "2026-06-20", quantity: 4_000, price: 107.1, netAmount: 428_400 },
  { symbol: "GLD", side: "Buy", tradeDate: "2026-06-22", quantity: 1_000, price: 244.5, netAmount: 244_500 },
  { symbol: "BTC", side: "Buy", tradeDate: "2026-06-25", quantity: 2.5, price: 66_800, netAmount: 167_000 },
  // Seeded missing_from_custodian: booked internally near period-end,
  // not yet reflected on the custodian statement. Creates the VNQ
  // position in positions.ts.
  { symbol: "VNQ", side: "Buy", tradeDate: "2026-06-27", quantity: 9_000, price: 88.4, netAmount: 795_600 },
  { symbol: "JPM", side: "Buy", tradeDate: "2026-06-03", quantity: 1_000, price: 243.0, netAmount: 243_000 },
  { symbol: "MSFT", side: "Sell", tradeDate: "2026-06-29", quantity: 500, price: 417.8, netAmount: 208_900 },
  { symbol: "GLD", side: "Sell", tradeDate: "2026-06-30", quantity: 300, price: 245.8, netAmount: 73_740 },
]

export const CUSTODIAN_TRANSACTIONS: CustodianTransaction[] = [
  { symbol: "AAPL", side: "Buy", tradeDate: "2026-06-05", quantity: 3_000, price: 192.1, netAmount: 576_300 },
  { symbol: "MSFT", side: "Buy", tradeDate: "2026-06-08", quantity: 1_500, price: 416.5, netAmount: 624_750 },
  { symbol: "GOOGL", side: "Buy", tradeDate: "2026-06-10", quantity: 2_000, price: 175.2, netAmount: 350_400 },
  // Seeded missing_from_ledger: the 1,000-share sell that never made it
  // into the internal blotter — see the linked position break.
  { symbol: "NVDA", side: "Sell", tradeDate: "2026-06-12", quantity: 1_000, price: 121.75, netAmount: 121_750 },
  { symbol: "JPM", side: "Sell", tradeDate: "2026-06-15", quantity: 1_800, price: 246.5, netAmount: 443_700 },
  { symbol: "AGG", side: "Buy", tradeDate: "2026-06-20", quantity: 5_000, price: 98.0, netAmount: 490_000 },
  { symbol: "LQD", side: "Sell", tradeDate: "2026-06-20", quantity: 4_000, price: 107.1, netAmount: 428_400 },
  { symbol: "GLD", side: "Buy", tradeDate: "2026-06-22", quantity: 1_000, price: 244.5, netAmount: 244_500 },
  { symbol: "BTC", side: "Buy", tradeDate: "2026-06-25", quantity: 2.5, price: 66_800, netAmount: 167_000 },
  // No VNQ row here — see missing_from_custodian note above.
  { symbol: "JPM", side: "Buy", tradeDate: "2026-06-03", quantity: 1_000, price: 243.0, netAmount: 243_000 },
  { symbol: "MSFT", side: "Sell", tradeDate: "2026-06-29", quantity: 500, price: 417.8, netAmount: 208_900 },
  { symbol: "GLD", side: "Sell", tradeDate: "2026-06-30", quantity: 300, price: 245.8, netAmount: 73_740 },
]
