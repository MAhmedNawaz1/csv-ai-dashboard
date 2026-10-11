"use client";

import { useCallback, useRef, useState } from "react";
import { FileSpreadsheet, LoaderCircle, UploadCloud } from "lucide-react";
import { formatBytes } from "../lib/format";
import type { FileMeta, ParseStatus } from "../lib/types";

interface FileUploadProps {
  status: ParseStatus;
  error: string | null;
  fileMeta: FileMeta | null;
  onFile: (file: File) => void;
  onSample: () => void;
}

export default function FileUpload({
  status,
  error,
  fileMeta,
  onFile,
  onSample,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const parsing = status === "parsing";

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 shadow-xl shadow-black/20 sm:p-6">
      <div
        role="button"
        tabIndex={0}
        aria-label="CSV dropzone"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={`relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed px-4 py-10 text-center transition-all sm:px-8 sm:py-12 ${
          isDragging
            ? "border-cyan-400 bg-cyan-400/10"
            : error
              ? "border-rose-500/60 bg-rose-500/5"
              : "border-zinc-700 bg-zinc-950/40 hover:border-cyan-500/50 hover:bg-zinc-900/80"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_55%)]" />
        <div className="relative mx-auto flex max-w-lg flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
            {parsing ? (
              <LoaderCircle className="h-6 w-6 animate-spin" />
            ) : (
              <UploadCloud className="h-6 w-6" />
            )}
          </div>
          <div>
            <p className="text-base font-semibold text-zinc-50 sm:text-lg">
              {parsing ? "Parsing CSV…" : "Drop your CSV here"}
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Client-side parse with Papa Parse · header row required · max 25 MB
            </p>
          </div>
          {fileMeta && status !== "error" && (
            <p className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
              <FileSpreadsheet className="h-3.5 w-3.5 text-cyan-300" />
              {fileMeta.name} · {formatBytes(fileMeta.size)}
            </p>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      <div className="mt-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-xs text-zinc-500">
          Files never leave this browser. Nothing is uploaded to a server.
        </p>
        <button
          type="button"
          onClick={onSample}
          disabled={parsing}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-200 transition hover:border-cyan-500/40 hover:text-white disabled:opacity-50"
        >
          Load sample dataset
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}
    </section>
  );
}
