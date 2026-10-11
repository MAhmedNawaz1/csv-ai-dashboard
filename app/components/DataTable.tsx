"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { CsvRow } from "../lib/types";

interface DataTableProps {
  rows: CsvRow[];
  columns: string[];
}

type SortDir = "asc" | "desc";

function compareValues(a: string, b: string, dir: SortDir): number {
  const aNum = Number(a.replace(/[%$,€£,\s]/g, ""));
  const bNum = Number(b.replace(/[%$,€£,\s]/g, ""));
  const bothNumeric =
    a !== "" && b !== "" && Number.isFinite(aNum) && Number.isFinite(bNum);

  let result = 0;
  if (bothNumeric) {
    result = aNum - bNum;
  } else {
    result = a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  }
  return dir === "asc" ? result : -result;
}

export default function DataTable({ rows, columns }: DataTableProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const next = needle
      ? rows.filter((row) =>
          columns.some((column) => (row[column] ?? "").toLowerCase().includes(needle)),
        )
      : rows;

    if (!sortKey) return next;
    return [...next].sort((a, b) => compareValues(a[sortKey] ?? "", b[sortKey] ?? "", sortDir));
  }, [rows, columns, query, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  function toggleSort(column: string) {
    if (sortKey === column) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(column);
      setSortDir("asc");
    }
    setPage(0);
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
            Data grid
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {filtered.length.toLocaleString()} matching records
          </p>
        </div>
        <label className="relative block w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder="Search records…"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-100 outline-none ring-cyan-400/40 placeholder:text-zinc-500 focus:ring-2"
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-zinc-950/80">
            <tr>
              {columns.map((column) => {
                const active = sortKey === column;
                return (
                  <th key={column} className="sticky top-0 whitespace-nowrap px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => toggleSort(column)}
                      className="inline-flex items-center gap-1.5 font-medium text-zinc-300 hover:text-white"
                    >
                      {column}
                      {active ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-cyan-300" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-cyan-300" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-600" />
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={Math.max(columns.length, 1)} className="px-3 py-8 text-center text-zinc-500">
                  No rows match this search.
                </td>
              </tr>
            ) : (
              visible.map((row, index) => (
                <tr
                  key={`${start}-${index}`}
                  className="border-t border-zinc-800/80 odd:bg-zinc-900/40 even:bg-zinc-950/20 hover:bg-cyan-400/5"
                >
                  {columns.map((column) => {
                    const value = row[column] ?? "";
                    return (
                      <td
                        key={column}
                        className={`max-w-[16rem] truncate px-3 py-2.5 ${
                          value ? "text-zinc-200" : "italic text-zinc-600"
                        }`}
                        title={value}
                      >
                        {value || "null"}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          Rows per page
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(0);
            }}
            className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safePage === 0}
            onClick={() => setPage((value) => Math.max(0, value - 1))}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-2 py-1 text-sm text-zinc-200 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>
          <span className="text-sm text-zinc-400">
            Page {safePage + 1} of {pageCount}
          </span>
          <button
            type="button"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((value) => value + 1)}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-2 py-1 text-sm text-zinc-200 disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
