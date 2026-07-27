import { AiNarrativePanel } from "@/components/ai-narrative-panel"
import { NavSummaryPanel } from "@/components/nav-summary-panel"
import { PositionReconciliationTable } from "@/components/position-reconciliation-table"
import { SampleDataBanner } from "@/components/sample-data-banner"
import { TransactionReconciliationTable } from "@/components/transaction-reconciliation-table"
import { getFundOpsSnapshot } from "@/lib/fund-ops"

export default function Home() {
  const snapshot = getFundOpsSnapshot()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6 sm:px-8">
      <header className="flex flex-col gap-1 py-2">
        <span className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Fund Operations Automation
        </span>
        <h1 className="font-heading text-2xl text-gradient-green sm:text-3xl">
          Reconciliation and NAV, Computed — Not Guessed
        </h1>
        <p className="text-sm text-muted-foreground">
          Every position and transaction is matched between the internal ledger and the custodian
          statement by deterministic, auditable logic — real arithmetic, not an LLM eyeballing
          numbers. The AI layer only prioritizes and explains the breaks that logic already found.
        </p>
      </header>

      <SampleDataBanner />
      <NavSummaryPanel nav={snapshot.nav} fundName={snapshot.fund.fundName} />
      <PositionReconciliationTable rows={snapshot.positionRows} />
      <TransactionReconciliationTable rows={snapshot.transactionRows} />
      <AiNarrativePanel />
    </div>
  )
}
