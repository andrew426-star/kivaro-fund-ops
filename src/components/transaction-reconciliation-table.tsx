"use client"

import { useState } from "react"
import { ArrowLeftRightIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import type { TransactionReconciliationRow } from "@/lib/reconciliation/types"

function money(n: number): string {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })
}

export function TransactionReconciliationTable({ rows }: { rows: TransactionReconciliationRow[] }) {
  const [breaksOnly, setBreaksOnly] = useState(true)
  const visible = breaksOnly ? rows.filter((r) => r.status !== "matched") : rows
  const breakCount = rows.filter((r) => r.status !== "matched").length

  return (
    <Card className="glow-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-1.5">
          <ArrowLeftRightIcon className="size-4 text-primary" />
          Transaction Reconciliation
        </CardTitle>
        <button
          type="button"
          onClick={() => setBreaksOnly((v) => !v)}
          className="glow-border-hover rounded-full px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {breaksOnly ? `Showing ${breakCount} breaks — show all ${rows.length}` : `Showing all ${rows.length} — show ${breakCount} breaks only`}
        </button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
              <th className="pb-2 pr-3 font-medium">Trade</th>
              <th className="pb-2 pr-3 font-medium">Status</th>
              <th className="pb-2 pr-3 font-medium text-right">Ledger Net</th>
              <th className="pb-2 pr-3 font-medium text-right">Custodian Net</th>
              <th className="pb-2 pr-3 font-medium text-right">Delta</th>
              <th className="pb-2 font-medium text-right">Materiality</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.transactionKey} className="border-b border-border/50 last:border-0">
                <td className="py-2 pr-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {row.symbol} {row.side}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(row.ledger ?? row.custodian)!.tradeDate}
                      {row.tradeDateDeltaDays !== null ? ` (±${row.tradeDateDeltaDays}d)` : ""}
                    </span>
                  </div>
                </td>
                <td className="py-2 pr-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="py-2 pr-3 text-right text-foreground">{row.ledger ? money(row.ledger.netAmount) : "—"}</td>
                <td className="py-2 pr-3 text-right text-foreground">{row.custodian ? money(row.custodian.netAmount) : "—"}</td>
                <td className="py-2 pr-3 text-right text-foreground">{money(row.netAmountDelta ?? 0)}</td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="font-mono text-xs text-muted-foreground">{row.materialityBps.toFixed(1)} bps</span>
                    {row.isMaterial && (
                      <Badge variant="outline" className="border-destructive/40 text-destructive">
                        material
                      </Badge>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
