export type AssetClass = "Equities" | "Fixed Income" | "Alternatives" | "Digital Assets" | "Cash"

export type BreakStatus =
  | "matched"
  | "quantity_break"
  | "price_break"
  | "timing_difference" // transaction-level only
  | "missing_from_custodian" // present in ledger, absent from custodian
  | "missing_from_ledger" // present in custodian, absent from ledger

export interface LedgerPosition {
  symbol: string
  name: string
  assetClass: AssetClass
  quantity: number
  price: number
  marketValue: number
}

export interface CustodianPosition {
  symbol: string
  name: string
  assetClass: AssetClass
  quantity: number
  price: number
  marketValue: number
}

export interface PositionReconciliationRow {
  symbol: string
  name: string
  assetClass: AssetClass
  status: BreakStatus
  ledger: LedgerPosition | null // null only for missing_from_ledger
  custodian: CustodianPosition | null // null only for missing_from_custodian
  quantityDelta: number | null
  marketValueDelta: number // signed; full one-sided MV when only one side exists
  materialityBps: number
  isMaterial: boolean
}

export interface LedgerTransaction {
  symbol: string
  side: "Buy" | "Sell"
  tradeDate: string
  quantity: number
  price: number
  netAmount: number
}

export interface CustodianTransaction {
  symbol: string
  side: "Buy" | "Sell"
  tradeDate: string
  quantity: number
  price: number
  netAmount: number
}

export interface TransactionReconciliationRow {
  transactionKey: string // symbol|side|tradeDate — synthetic, not a real custodian ref
  symbol: string
  side: "Buy" | "Sell"
  status: BreakStatus
  ledger: LedgerTransaction | null
  custodian: CustodianTransaction | null
  quantityDelta: number | null
  netAmountDelta: number | null
  tradeDateDeltaDays: number | null // populated only for timing_difference
  materialityBps: number
  isMaterial: boolean
}
