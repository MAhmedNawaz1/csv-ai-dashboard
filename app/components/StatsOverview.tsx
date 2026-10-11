import { Columns3, FileDigit, Rows3, TriangleAlert } from "lucide-react";
import { formatBytes, formatNumber } from "../lib/format";
import type { AnalysisResult, FileMeta } from "../lib/types";

interface StatsOverviewProps {
  analysis: AnalysisResult;
  fileMeta: FileMeta;
}

const cards = [
  {
    key: "rows" as const,
    label: "Total Rows",
    icon: Rows3,
    accent: "from-cyan-400/20 to-transparent text-cyan-300",
  },
  {
    key: "cols" as const,
    label: "Total Columns",
    icon: Columns3,
    accent: "from-violet-400/20 to-transparent text-violet-300",
  },
  {
    key: "missing" as const,
    label: "Missing / Null",
    icon: TriangleAlert,
    accent: "from-amber-400/20 to-transparent text-amber-300",
  },
  {
    key: "size" as const,
    label: "File Size",
    icon: FileDigit,
    accent: "from-emerald-400/20 to-transparent text-emerald-300",
  },
];

export default function StatsOverview({ analysis, fileMeta }: StatsOverviewProps) {
  const values = {
    rows: formatNumber(analysis.rowCount),
    cols: formatNumber(analysis.columnCount),
    missing: formatNumber(analysis.missingCount),
    size: formatBytes(fileMeta.size),
  };

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.key}
            className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-60`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
                  {values[card.key]}
                </p>
              </div>
              <Icon className={`h-5 w-5 ${card.accent.split(" ").pop()}`} />
            </div>
          </article>
        );
      })}
    </section>
  );
}
