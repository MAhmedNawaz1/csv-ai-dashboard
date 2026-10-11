import { Lightbulb, ListChecks, ScanSearch, Sparkles } from "lucide-react";
import type { AnalysisResult, IssueSeverity } from "../lib/types";

interface InsightsPanelProps {
  analysis: AnalysisResult;
}

const severityStyles: Record<IssueSeverity, string> = {
  high: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  low: "border-zinc-600 bg-zinc-800/80 text-zinc-300",
};

export default function InsightsPanel({ analysis }: InsightsPanelProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5">
        <header className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-300" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
            Key takeaways
          </h2>
        </header>
        <p className="mb-3 text-xs text-zinc-500">
          Auto-typed {analysis.numericColumns.length} numeric · {analysis.categoricalColumns.length}{" "}
          categorical
        </p>
        <ul className="space-y-2">
          {analysis.takeaways.map((item) => (
            <li
              key={item}
              className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm leading-6 text-zinc-200"
            >
              {item}
            </li>
          ))}
        </ul>
      </article>

      <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5">
        <header className="mb-3 flex items-center gap-2">
          <ScanSearch className="h-4 w-4 text-amber-300" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
            Quality & anomalies
          </h2>
        </header>
        {analysis.issues.length === 0 ? (
          <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            No major quality issues flagged.
          </p>
        ) : (
          <ul className="space-y-2">
            {analysis.issues.slice(0, 6).map((issue) => (
              <li
                key={`${issue.title}-${issue.detail}`}
                className={`rounded-lg border px-3 py-2 ${severityStyles[issue.severity]}`}
              >
                <p className="text-sm font-medium">{issue.title}</p>
                <p className="mt-1 text-xs opacity-90">{issue.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5">
        <header className="mb-3 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-cyan-300" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
            Recommendations
          </h2>
        </header>
        <ul className="space-y-2">
          {analysis.recommendations.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-6 text-zinc-200">
              <ListChecks className="mt-1 h-4 w-4 shrink-0 text-cyan-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
