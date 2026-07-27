import { CalculatorIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { NavResult } from "@/lib/nav/calculate-nav"

function money(n: number): string {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })
}

export function NavSummaryPanel({ nav, fundName }: { nav: NavResult; fundName: string }) {
  return (
    <Card className="glow-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <CalculatorIcon className="size-4 text-primary" />
          NAV Summary — {fundName}, as of {nav.asOfDate}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <div className="glow-border-hover flex flex-col gap-0.5 rounded-lg p-2.5">
            <span className="text-xs text-muted-foreground">NAV (ledger)</span>
            <span className="font-heading text-lg text-foreground">{money(nav.navLedger)}</span>
            <span className="text-xs text-muted-foreground">${nav.navPerUnitLedger.toFixed(2)}/unit</span>
          </div>
          <div className="glow-border-hover flex flex-col gap-0.5 rounded-lg p-2.5">
            <span className="text-xs text-muted-foreground">NAV (custodian-confirmed)</span>
            <span className="font-heading text-lg text-foreground">{money(nav.navConfirmed)}</span>
            <span className="text-xs text-muted-foreground">${nav.navPerUnitConfirmed.toFixed(2)}/unit</span>
          </div>
          <div className="glow-border-hover flex flex-col gap-0.5 rounded-lg p-2.5">
            <span className="text-xs text-muted-foreground">NAV impact of unresolved breaks</span>
            <span className={`font-heading text-lg ${nav.navImpactOfBreaks !== 0 ? "text-accent" : "text-foreground"}`}>
              {money(nav.navImpactOfBreaks)}
            </span>
            <span className="text-xs text-muted-foreground">ledger minus confirmed</span>
          </div>
          <div className="glow-border-hover flex flex-col gap-0.5 rounded-lg p-2.5">
            <span className="text-xs text-muted-foreground">Unrecorded positions value</span>
            <span className="font-heading text-lg text-destructive">{money(nav.unrecordedPositionsValue)}</span>
            <span className="text-xs text-muted-foreground">at custodian, never booked</span>
          </div>
          <div className="glow-border-hover flex flex-col gap-0.5 rounded-lg p-2.5">
            <span className="text-xs text-muted-foreground">Gross Asset Value (ledger)</span>
            <span className="font-heading text-base text-foreground">{money(nav.grossAssetValueLedger)}</span>
          </div>
          <div className="glow-border-hover flex flex-col gap-0.5 rounded-lg p-2.5">
            <span className="text-xs text-muted-foreground">Gross Asset Value (confirmed)</span>
            <span className="font-heading text-base text-foreground">{money(nav.grossAssetValueConfirmed)}</span>
          </div>
          <div className="glow-border-hover flex flex-col gap-0.5 rounded-lg p-2.5">
            <span className="text-xs text-muted-foreground">Accrued management fee</span>
            <span className="font-heading text-base text-foreground">{money(nav.accruedManagementFee)}</span>
          </div>
          <div className="glow-border-hover flex flex-col gap-0.5 rounded-lg p-2.5">
            <span className="text-xs text-muted-foreground">Other accrued liabilities</span>
            <span className="font-heading text-base text-foreground">{money(nav.otherAccruedLiabilities)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
