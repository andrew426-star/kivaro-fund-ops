import { NextResponse } from "next/server"
import { Type } from "@google/genai"

import { GEMINI_MODEL, getGeminiClient } from "@/lib/gemini-client"
import { getFundOpsSnapshot } from "@/lib/fund-ops"
import type { PositionReconciliationRow, TransactionReconciliationRow } from "@/lib/reconciliation/types"

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: {
      type: Type.STRING,
      description:
        "2-3 sentence plain-English summary of overall reconciliation health and NAV impact for a fund controller/COO audience. Plain prose only — no markdown formatting (no **bold**, no #headers, no bullet dashes).",
    },
    navCommentary: {
      type: Type.STRING,
      description:
        "Explains the relationship between ledger NAV and custodian-confirmed NAV per unit, grounded only in the supplied figures. Plain prose only, no markdown.",
    },
    prioritizedFindings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          breakId: {
            type: Type.STRING,
            description: "Must exactly match a symbol or transaction key supplied in the input below. Never invent an identifier not present in the input.",
          },
          priorityRank: { type: Type.INTEGER, description: "1 = most urgent to resolve." },
          likelyRootCause: {
            type: Type.STRING,
            description:
              "A plausible operational root-cause hypothesis (e.g. unbooked trade, settlement timing lag, stale price feed, unrecorded corporate action, FX translation difference), grounded only in the facts provided. Plain prose only, no markdown.",
          },
          suggestedAction: { type: Type.STRING, description: "One concrete next operational step. Plain prose only, no markdown." },
        },
        required: ["breakId", "priorityRank", "likelyRootCause", "suggestedAction"],
      },
    },
    operationalReportNote: {
      type: Type.STRING,
      description: "A short closing note suitable for an investor-facing operational report, describing data integrity and any caveats. Plain prose only, no markdown.",
    },
  },
  required: ["executiveSummary", "navCommentary", "prioritizedFindings", "operationalReportNote"],
}

function formatPositionRow(row: PositionReconciliationRow): string {
  const ledgerStr = row.ledger ? `Ledger: ${row.ledger.quantity.toLocaleString()} sh @ $${row.ledger.price.toLocaleString()} = $${row.ledger.marketValue.toLocaleString()}.` : "Ledger: no position."
  const custodianStr = row.custodian ? `Custodian: ${row.custodian.quantity.toLocaleString()} sh @ $${row.custodian.price.toLocaleString()} = $${row.custodian.marketValue.toLocaleString()}.` : "Custodian: no position."
  return `${row.symbol} (${row.assetClass}) — ${row.status}. ${ledgerStr} ${custodianStr} Delta: $${row.marketValueDelta.toLocaleString()} (${row.materialityBps.toFixed(1)} bps of NAV). ${row.isMaterial ? "MATERIAL." : "immaterial."}`
}

function formatTransactionRow(row: TransactionReconciliationRow): string {
  const ledgerStr = row.ledger ? `Ledger: ${row.ledger.side} ${row.ledger.quantity.toLocaleString()} sh @ $${row.ledger.price.toLocaleString()} on ${row.ledger.tradeDate}, net $${row.ledger.netAmount.toLocaleString()}.` : "Ledger: no matching trade."
  const custodianStr = row.custodian ? `Custodian: ${row.custodian.side} ${row.custodian.quantity.toLocaleString()} sh @ $${row.custodian.price.toLocaleString()} on ${row.custodian.tradeDate}, net $${row.custodian.netAmount.toLocaleString()}.` : "Custodian: no matching trade."
  const timing = row.tradeDateDeltaDays !== null ? ` Trade date offset: ${row.tradeDateDeltaDays} day(s).` : ""
  return `${row.transactionKey} (${row.symbol}) — ${row.status}. ${ledgerStr} ${custodianStr}${timing} Delta: $${(row.netAmountDelta ?? 0).toLocaleString()} (${row.materialityBps.toFixed(1)} bps of NAV). ${row.isMaterial ? "MATERIAL." : "immaterial."}`
}

function buildPrompt(snapshot: ReturnType<typeof getFundOpsSnapshot>): string {
  const { fund, positionRows, transactionRows, nav } = snapshot

  const positionBreaks = positionRows.filter((r) => r.status !== "matched").map(formatPositionRow).join("\n")
  const transactionBreaks = transactionRows.filter((r) => r.status !== "matched").map(formatTransactionRow).join("\n")

  const navSummary = `Fund: ${fund.fundName}, as of ${nav.asOfDate}.
Gross Asset Value (ledger): $${nav.grossAssetValueLedger.toLocaleString()}.
Gross Asset Value (custodian-confirmed): $${nav.grossAssetValueConfirmed.toLocaleString()}.
Accrued management fee: $${nav.accruedManagementFee.toLocaleString()}. Other accrued liabilities: $${nav.otherAccruedLiabilities.toLocaleString()}.
NAV (ledger): $${nav.navLedger.toLocaleString()} ($${nav.navPerUnitLedger.toFixed(2)}/unit).
NAV (custodian-confirmed): $${nav.navConfirmed.toLocaleString()} ($${nav.navPerUnitConfirmed.toFixed(2)}/unit).
NAV impact of unresolved breaks: $${nav.navImpactOfBreaks.toLocaleString()}.
Unrecorded positions value (received at custodian, never booked to the ledger, excluded from confirmed NAV): $${nav.unrecordedPositionsValue.toLocaleString()}.`

  return `You are a fund operations analyst reviewing a reconciliation run. You are given the fund's NAV summary and every position/transaction that did NOT cleanly match between the internal ledger and the custodian statement. Materiality has already been determined for you (MATERIAL vs immaterial, computed from a fixed basis-point threshold) — do not re-judge materiality yourself, only prioritize and explain within it. Ground every finding strictly in the data below — do not invent facts, and cite every finding by its exact ID (a symbol for a position break, or the full transaction key for a transaction break). Output plain prose only in every text field — no markdown formatting of any kind (no **bold**, no #headers, no bullet lists or dashes).

NAV SUMMARY:
${navSummary}

POSITION BREAKS:
${positionBreaks || "None — every position matched cleanly."}

TRANSACTION BREAKS:
${transactionBreaks || "None — every transaction matched cleanly."}`
}

export async function POST() {
  try {
    const snapshot = getFundOpsSnapshot()

    const client = getGeminiClient()
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildPrompt(snapshot),
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    })

    const raw = response.text
    if (!raw) throw new Error("Gemini returned an empty response.")
    const parsed = JSON.parse(raw)

    const validIds = new Set<string>([
      ...snapshot.positionRows.filter((r) => r.status !== "matched").map((r) => r.symbol),
      ...snapshot.transactionRows.filter((r) => r.status !== "matched").map((r) => r.transactionKey),
    ])

    const prioritizedFindings = (parsed.prioritizedFindings as { breakId: string; priorityRank: number; likelyRootCause: string; suggestedAction: string }[])
      .filter((f) => validIds.has(f.breakId))
      .sort((a, b) => a.priorityRank - b.priorityRank)
      // Re-number sequentially from 1 — the model's raw ranks can have
      // gaps once invalid breakIds are filtered out (or just from its own
      // internal numbering), which would otherwise look like a bug.
      .map((f, i) => ({ ...f, priorityRank: i + 1 }))

    return NextResponse.json({
      narrative: {
        executiveSummary: parsed.executiveSummary,
        navCommentary: parsed.navCommentary,
        prioritizedFindings,
        operationalReportNote: parsed.operationalReportNote,
      },
      generatedAt: Date.now(),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate narrative." },
      { status: 502 }
    )
  }
}
