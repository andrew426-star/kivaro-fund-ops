import type { CustodianPosition, LedgerPosition } from "@/lib/reconciliation/types"

// Fully synthetic period-end (2026-06-30) holdings snapshot. Two
// independent hardcoded arrays — the fund's internal ledger and the
// custodian's statement for the same period — with deliberate, named
// discrepancies seeded in on the custodian side (or, for
// missing_from_ledger, a custodian-only row). This is the enumerable
// answer-key the reconciliation engine is verified against; see the
// per-row comments below for what each one simulates.

export const LEDGER_POSITIONS: LedgerPosition[] = [
  { symbol: "AAPL", name: "Apple Inc.", assetClass: "Equities", quantity: 15_000, price: 195.4, marketValue: 2_931_000 },
  { symbol: "MSFT", name: "Microsoft Corp.", assetClass: "Equities", quantity: 8_000, price: 415.2, marketValue: 3_321_600 },
  { symbol: "GOOGL", name: "Alphabet Inc.", assetClass: "Equities", quantity: 10_000, price: 178.65, marketValue: 1_786_500 },
  // Seeded quantity_break: an unbooked 1,000-share sell (see the matching
  // transaction in transactions.ts) means the ledger still shows the
  // full pre-sale share count.
  { symbol: "NVDA", name: "NVIDIA Corp.", assetClass: "Equities", quantity: 20_000, price: 118.25, marketValue: 2_365_000 },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", assetClass: "Equities", quantity: 12_000, price: 245.8, marketValue: 2_949_600 },
  // Seeded sub-tolerance price diff (~0.16 bps of MV) — should classify
  // matched, proving the tolerance band isn't over-triggering.
  { symbol: "COST", name: "Costco Wholesale Corp.", assetClass: "Equities", quantity: 4_000, price: 912.4, marketValue: 3_649_600 },
  { symbol: "AGG", name: "iShares Core U.S. Aggregate Bond ETF", assetClass: "Fixed Income", quantity: 50_000, price: 98.2, marketValue: 4_910_000 },
  // Seeded price_break: ledger carries the current price; custodian
  // statement carries a stale prior-day price (delta well beyond the
  // 5bps tolerance band).
  { symbol: "TLT", name: "iShares 20+ Year Treasury Bond ETF", assetClass: "Fixed Income", quantity: 25_000, price: 88.5, marketValue: 2_212_500 },
  { symbol: "LQD", name: "iShares iBoxx Investment Grade Corp Bond ETF", assetClass: "Fixed Income", quantity: 30_000, price: 107.3, marketValue: 3_219_000 },
  { symbol: "GLD", name: "SPDR Gold Shares", assetClass: "Alternatives", quantity: 6_000, price: 245.1, marketValue: 1_470_600 },
  // Seeded missing_from_custodian: booked internally on a trade near
  // period-end, not yet reflected on the custodian statement.
  { symbol: "VNQ", name: "Vanguard Real Estate ETF", assetClass: "Alternatives", quantity: 9_000, price: 88.4, marketValue: 795_600 },
  { symbol: "BTC", name: "Bitcoin", assetClass: "Digital Assets", quantity: 18.5, price: 67_200, marketValue: 1_243_200 },
  // No SPINCO row here — see custodian array below.
]

export const CUSTODIAN_POSITIONS: CustodianPosition[] = [
  { symbol: "AAPL", name: "Apple Inc.", assetClass: "Equities", quantity: 15_000, price: 195.4, marketValue: 2_931_000 },
  { symbol: "MSFT", name: "Microsoft Corp.", assetClass: "Equities", quantity: 8_000, price: 415.2, marketValue: 3_321_600 },
  { symbol: "GOOGL", name: "Alphabet Inc.", assetClass: "Equities", quantity: 10_000, price: 178.65, marketValue: 1_786_500 },
  { symbol: "NVDA", name: "NVIDIA Corp.", assetClass: "Equities", quantity: 19_000, price: 118.25, marketValue: 2_246_750 },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", assetClass: "Equities", quantity: 12_000, price: 245.8, marketValue: 2_949_600 },
  { symbol: "COST", name: "Costco Wholesale Corp.", assetClass: "Equities", quantity: 4_000, price: 912.55, marketValue: 3_650_200 },
  { symbol: "AGG", name: "iShares Core U.S. Aggregate Bond ETF", assetClass: "Fixed Income", quantity: 50_000, price: 98.2, marketValue: 4_910_000 },
  { symbol: "TLT", name: "iShares 20+ Year Treasury Bond ETF", assetClass: "Fixed Income", quantity: 25_000, price: 86.9, marketValue: 2_172_500 },
  { symbol: "LQD", name: "iShares iBoxx Investment Grade Corp Bond ETF", assetClass: "Fixed Income", quantity: 30_000, price: 107.3, marketValue: 3_219_000 },
  { symbol: "GLD", name: "SPDR Gold Shares", assetClass: "Alternatives", quantity: 6_000, price: 245.1, marketValue: 1_470_600 },
  { symbol: "BTC", name: "Bitcoin", assetClass: "Digital Assets", quantity: 18.5, price: 67_200, marketValue: 1_243_200 },
  // No VNQ row here (missing_from_custodian, per ledger array above).
  // Seeded missing_from_ledger: a spin-off received and confirmed at
  // custodian, never booked internally — the corporate-action-flavored
  // case referenced in the plan.
  { symbol: "SPINCO", name: "Spinco Industries (spin-off)", assetClass: "Equities", quantity: 3_200, price: 42.1, marketValue: 134_720 },
]
