import { Badge } from "@/components/ui/badge"
import type { BreakStatus } from "@/lib/reconciliation/types"

const STATUS_LABELS: Record<BreakStatus, string> = {
  matched: "matched",
  quantity_break: "quantity break",
  price_break: "price break",
  timing_difference: "timing difference",
  missing_from_custodian: "missing at custodian",
  missing_from_ledger: "missing from ledger",
}

const STATUS_STYLES: Record<BreakStatus, string> = {
  matched: "border-primary/30 text-primary",
  quantity_break: "border-accent/40 text-accent",
  price_break: "border-accent/40 text-accent",
  timing_difference: "border-accent/40 text-accent",
  missing_from_custodian: "border-destructive/40 text-destructive",
  missing_from_ledger: "border-destructive/40 text-destructive",
}

export function StatusBadge({ status }: { status: BreakStatus }) {
  return (
    <Badge variant="outline" className={`shrink-0 ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}
