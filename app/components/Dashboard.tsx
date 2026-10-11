"use client";

import { useCallback, useState } from "react";
import { BrainCircuit, Download, Sparkles } from "lucide-react";
import { analyzeData } from "../lib/analyzeData";
import { parseCsvFile, parseCsvText } from "../lib/parseCsv";
import { SAMPLE_CSV } from "../lib/sampleCsv";
import type { AnalysisResult, CsvRow, FileMeta, ParseStatus } from "../lib/types";
import DataTable from "./DataTable";
import DataVisualizer from "./DataVisualizer";
import FileUpload from "./FileUpload";
import InsightsPanel from "./InsightsPanel";
import StatsOverview from "./StatsOverview";

export default function Dashboard() {
  const [status, setStatus] = useState<ParseStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const ingest = useCallback(async (file: File, parser: () => Promise<{ rows: CsvRow[]; columns: string[] }>) => {
    setStatus("parsing");
    setError(null);
    setFileMeta({ name: file.name, size: file.size });

    try {
      const parsed = await parser();
      const nextAnalysis = analyzeData(parsed.rows, parsed.columns);
      setRows(parsed.rows);
      setColumns(parsed.columns);
      setAnalysis(nextAnalysis);
      setStatus("ready");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not parse this CSV.";
      setRows([]);
      setColumns([]);
      setAnalysis(null);
      setError(message);
      setStatus("error");
    }
  }, []);

  const onFile = useCallback(
    (file: File) => {
      void ingest(file, () => parseCsvFile(file));
    },
    [ingest],
  );

  const onSample = useCallback(() => {
    const file = new File([SAMPLE_CSV], "sample-sales.csv", { type: "text/csv" });
    void ingest(file, () => parseCsvText(SAMPLE_CSV, file.name));
  }, [ingest]);

  // 1. Function to Export AI Report
  const downloadAIReport = () => {
    if (!analysis || !fileMeta) return;

    const analysisAny = analysis as any;
    const takeawaysList = analysisAny.takeaways || analysisAny.insights || [];
    const takeawaysText = takeawaysList.length > 0 
      ? takeawaysList.map((t: any) => `- ${typeof t === 'string' ? t : t.title || JSON.stringify(t)}`).join('\n') 
      : '- No critical issues detected.';

    const reportContent = `# AI CSV Data Insights Executive Report
File Name: ${fileMeta.name}
Generated On: ${new Date().toLocaleDateString()}

---

## 📊 Summary Metrics
- Total Rows: ${rows.length}
- Total Columns: ${columns.length}

## 💡 Key AI Takeaways & Insights
${takeawaysText}
`;

    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileMeta.name.replace('.csv', '')}_AI_Report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 2. Function to Clean and Export CSV
  const downloadCleanCSV = () => {
    if (rows.length === 0) return;

    // Remove duplicate rows
    const uniqueRowsMap = new Map();
    rows.forEach((row) => {
      const key = JSON.stringify(row);
      if (!uniqueRowsMap.has(key)) {
        uniqueRowsMap.set(key, row);
      }
    });

    const cleanRows = Array.from(uniqueRowsMap.values());
    const headers = columns.join(',');
    const csvLines = cleanRows.map((row) =>
      columns.map((col) => `"${row[col] ?? ''}"`).join(',')
    );

    const cleanCsvData = [headers, ...csvLines].join('\n');
    const blob = new Blob([cleanCsvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cleaned_${fileMeta?.name || 'Dataset.csv'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_32%),radial-gradient(circle_at_top_right,rgba(167,139,250,0.08),transparent_28%)]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
              <BrainCircuit className="h-3.5 w-3.5" />
              Local AI insights engine
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              CSV Data Insights
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Drop a spreadsheet to profile quality, type columns, and surface actionable takeaways
              — all in the browser.
            </p>
          </div>

          {/* Export Buttons Header Section */}
          {status === "ready" && (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadAIReport}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 transition shadow-sm"
              >
                <Sparkles className="h-4 w-4" />
                Export AI Report (.md)
              </button>
              <button
                onClick={downloadCleanCSV}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition shadow-sm"
              >
                <Download className="h-4 w-4" />
                Clean & Export CSV
              </button>
            </div>
          )}
        </header>

        <FileUpload
          status={status}
          error={error}
          fileMeta={fileMeta}
          onFile={onFile}
          onSample={onSample}
        />

        {status === "ready" && analysis && fileMeta ? (
          <>
            <StatsOverview analysis={analysis} fileMeta={fileMeta} />
            <DataVisualizer analysis={analysis} />
            <InsightsPanel analysis={analysis} />
            <DataTable rows={rows} columns={columns} />
          </>
        ) : (
          status !== "error" && (
            <div className="rounded-2xl border border-dashed border-zinc-800 px-6 py-16 text-center text-sm text-zinc-500">
              Upload a CSV to unlock metric cards, visual fill rates, and the insights panel.
            </div>
          )
        )}
      </div>
    </div>
  );
}