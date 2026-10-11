export type CsvRow = Record<string, string>;

export type ColumnKind = "numeric" | "categorical";

export type IssueSeverity = "high" | "medium" | "low";

export interface FileMeta {
  name: string;
  size: number;
}

export interface CategoryValue {
  value: string;
  count: number;
  pct: number;
}

export interface ColumnProfile {
  name: string;
  kind: ColumnKind;
  fillRate: number;
  missingCount: number;
  uniqueCount: number;
  sampleValues: string[];
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  std?: number;
  outlierCount?: number;
  topValues?: CategoryValue[];
}

export interface QualityIssue {
  severity: IssueSeverity;
  title: string;
  detail: string;
}

export interface AnalysisResult {
  rowCount: number;
  columnCount: number;
  missingCount: number;
  duplicateRowCount: number;
  numericColumns: string[];
  categoricalColumns: string[];
  columns: ColumnProfile[];
  issues: QualityIssue[];
  recommendations: string[];
  takeaways: string[];
}

export interface ParsedCsv {
  rows: CsvRow[];
  columns: string[];
}

export type ParseStatus = "idle" | "parsing" | "ready" | "error";
