"use client"

import { useEffect, useState } from "react"
import { Loader2Icon, RefreshCwIcon, SparklesIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Finding {
  breakId: string
  priorityRank: number
  likelyRootCause: string
  suggestedAction: string
}

interface Narrative {
  executiveSummary: string
  navCommentary: string
  prioritizedFindings: Finding[]
  operationalReportNote: string
}

type NarrativeState =
  | { status: "loading" }
  | { status: "ready"; narrative: Narrative }
  | { status: "error"; message: string }

export function AiNarrativePanel() {
  const [state, setState] = useState<NarrativeState>({ status: "loading" })

  async function loadNarrative() {
    setState({ status: "loading" })
    try {
      const res = await fetch("/api/narrative", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to generate narrative.")
      setState({ status: "ready", narrative: data.narrative })
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : "Failed to generate narrative." })
    }
  }

  useEffect(() => {
    loadNarrative()
  }, [])

  return (
    <Card className="glow-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-1.5">
          <SparklesIcon className="size-4 text-primary" />
          AI Operations Narrative
        </CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={loadNarrative}
          disabled={state.status === "loading"}
          aria-label="Regenerate narrative"
        >
          <RefreshCwIcon className={state.status === "loading" ? "animate-spin" : ""} />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {state.status === "loading" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Analyzing reconciliation results...
          </div>
        )}
        {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
        {state.status === "ready" && (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-xs tracking-wide text-muted-foreground uppercase">Executive Summary</span>
              <p className="text-sm leading-relaxed text-foreground">{state.narrative.executiveSummary}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs tracking-wide text-muted-foreground uppercase">NAV Commentary</span>
              <p className="text-sm leading-relaxed text-foreground">{state.narrative.navCommentary}</p>
            </div>
            {state.narrative.prioritizedFindings.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs tracking-wide text-muted-foreground uppercase">Prioritized Findings</span>
                <ul className="flex flex-col gap-2">
                  {state.narrative.prioritizedFindings
                    .slice()
                    .sort((a, b) => a.priorityRank - b.priorityRank)
                    .map((f) => (
                      <li key={f.breakId} className="glow-border-hover flex flex-col gap-1 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-primary/30 text-primary">
                            #{f.priorityRank}
                          </Badge>
                          <span className="text-sm font-medium text-foreground">{f.breakId}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <span className="text-foreground">Likely cause:</span> {f.likelyRootCause}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <span className="text-foreground">Suggested action:</span> {f.suggestedAction}
                        </p>
                      </li>
                    ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className="text-xs tracking-wide text-muted-foreground uppercase">Operational Report Note</span>
              <p className="text-sm text-muted-foreground italic">{state.narrative.operationalReportNote}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
