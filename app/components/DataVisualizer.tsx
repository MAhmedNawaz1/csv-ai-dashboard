import { BarChart3 } from "lucide-react";
import { clampPct, formatNumber } from "../lib/format";
import type { AnalysisResult } from "../lib/types";

interface DataVisualizerProps {
  analysis: AnalysisResult;
}

export default function DataVisualizer({ analysis }: DataVisualizerProps) {
  const fillBars = [...analysis.columns]
    .sort((a, b) => a.fillRate - b.fillRate)
    .slice(0, 8);

  const numericBars = analysis.columns
    .filter((col) => col.kind === "numeric" && col.mean !== undefined)
    .slice(0, 6);

  const maxAbsMean = Math.max(...numericBars.map((col) => Math.abs(col.mean ?? 0)), 1);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-cyan-300" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
          Visual analytics
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-xs font-medium text-zinc-400">Column fill rate</p>
          <ul className="space-y-3">
            {fillBars.map((col) => (
              <li key={col.name}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="truncate text-zinc-200">{col.name}</span>
                  <span className="shrink-0 text-zinc-400">{col.fillRate.toFixed(0)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={`h-full rounded-full ${
                      col.fillRate < 60 ? "bg-amber-400" : "bg-cyan-400"
                    }`}
                    style={{ width: `${clampPct(col.fillRate)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-xs font-medium text-zinc-400">
            Numeric means (scaled to largest mean)
          </p>
          {numericBars.length === 0 ? (
            <p className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-6 text-sm text-zinc-500">
              No numeric columns detected yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {numericBars.map((col) => {
                const width = clampPct((Math.abs(col.mean ?? 0) / maxAbsMean) * 100);
                return (
                  <li key={col.name}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                      <span className="truncate text-zinc-200">{col.name}</span>
                      <span className="shrink-0 text-zinc-400">
                        μ {formatNumber(col.mean ?? 0, 1)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-violet-400"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
