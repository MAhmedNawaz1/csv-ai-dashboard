import type {
  AnalysisResult,
  CategoryValue,
  ColumnKind,
  ColumnProfile,
  CsvRow,
  QualityIssue,
} from "./types";

const MISSING_TOKENS = new Set([
  "",
  "null",
  "na",
  "n/a",
  "none",
  "nan",
  "-",
  "--",
  "undefined",
  "nil",
]);

function isMissing(value: string): boolean {
  return MISSING_TOKENS.has(value.trim().toLowerCase());
}

function parseNumeric(value: string): number | null {
  const cleaned = value.replace(/[%$,€£\s]/g, "").replace(/,/g, "");
  if (cleaned === "" || cleaned === ".") return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function stdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function countOutliers(sorted: number[]): number {
  if (sorted.length < 4) return 0;
  const q1 = median(sorted.slice(0, Math.floor(sorted.length / 2)));
  const q3 = median(sorted.slice(Math.ceil(sorted.length / 2)));
  const iqr = q3 - q1;
  if (iqr === 0) return 0;
  const low = q1 - 1.5 * iqr;
  const high = q3 + 1.5 * iqr;
  return sorted.filter((value) => value < low || value > high).length;
}

function classifyColumn(values: string[]): ColumnKind {
  const present = values.filter((value) => !isMissing(value));
  if (present.length === 0) return "categorical";
  const numericHits = present.filter((value) => parseNumeric(value) !== null).length;
  return numericHits / present.length >= 0.7 ? "numeric" : "categorical";
}

function topCategories(values: string[], limit = 3): CategoryValue[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (isMissing(value)) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const present = values.filter((value) => !isMissing(value)).length || 1;
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({
      value,
      count,
      pct: (count / present) * 100,
    }));
}

function rowSignature(row: CsvRow, columns: string[]): string {
  return columns.map((column) => row[column] ?? "").join("\u0001");
}

export function analyzeData(rows: CsvRow[], columns: string[]): AnalysisResult {
  const rowCount = rows.length;
  const columnCount = columns.length;
  const signatures = new Map<string, number>();

  for (const row of rows) {
    const key = rowSignature(row, columns);
    signatures.set(key, (signatures.get(key) ?? 0) + 1);
  }

  const duplicateRowCount = [...signatures.values()].reduce(
    (sum, count) => sum + Math.max(0, count - 1),
    0,
  );

  const profiles: ColumnProfile[] = columns.map((name) => {
    const values = rows.map((row) => row[name] ?? "");
    const missingCount = values.filter(isMissing).length;
    const present = values.filter((value) => !isMissing(value));
    const uniqueCount = new Set(present).size;
    const kind = classifyColumn(values);
    const fillRate = rowCount === 0 ? 0 : ((rowCount - missingCount) / rowCount) * 100;
    const sampleValues = [...new Set(present)].slice(0, 4);

    const profile: ColumnProfile = {
      name,
      kind,
      fillRate,
      missingCount,
      uniqueCount,
      sampleValues,
    };

    if (kind === "numeric") {
      const nums = present
        .map(parseNumeric)
        .filter((value): value is number => value !== null)
        .sort((a, b) => a - b);

      if (nums.length > 0) {
        const mean = nums.reduce((sum, value) => sum + value, 0) / nums.length;
        profile.min = nums[0];
        profile.max = nums[nums.length - 1];
        profile.mean = mean;
        profile.median = median(nums);
        profile.std = stdDev(nums, mean);
        profile.outlierCount = countOutliers(nums);
      }
    } else {
      profile.topValues = topCategories(values);
    }

    return profile;
  });

  const numericColumns = profiles.filter((col) => col.kind === "numeric").map((col) => col.name);
  const categoricalColumns = profiles
    .filter((col) => col.kind === "categorical")
    .map((col) => col.name);
  const missingCount = profiles.reduce((sum, col) => sum + col.missingCount, 0);

  const issues: QualityIssue[] = [];

  if (duplicateRowCount > 0) {
    issues.push({
      severity: duplicateRowCount / Math.max(rowCount, 1) > 0.05 ? "high" : "medium",
      title: "Duplicate rows detected",
      detail: `${duplicateRowCount.toLocaleString()} duplicate row${duplicateRowCount === 1 ? "" : "s"} may inflate totals and bias averages.`,
    });
  }

  for (const col of profiles) {
    const missingPct = rowCount === 0 ? 0 : (col.missingCount / rowCount) * 100;
    if (missingPct >= 40) {
      issues.push({
        severity: "high",
        title: `Sparse column: ${col.name}`,
        detail: `${missingPct.toFixed(0)}% of values are empty or null. Consider dropping or imputing this field.`,
      });
    } else if (missingPct >= 10) {
      issues.push({
        severity: "medium",
        title: `Missing values in ${col.name}`,
        detail: `${col.missingCount.toLocaleString()} empty cells (${missingPct.toFixed(0)}%). Fill strategy will affect reporting.`,
      });
    }

    if (col.kind === "categorical" && col.uniqueCount === 1 && rowCount > 1) {
      issues.push({
        severity: "low",
        title: `Constant column: ${col.name}`,
        detail: "Every filled value is identical, so this field adds little analytical signal.",
      });
    }

    if (col.kind === "categorical" && rowCount > 20 && col.uniqueCount / rowCount > 0.9) {
      issues.push({
        severity: "medium",
        title: `High cardinality: ${col.name}`,
        detail: `${col.uniqueCount.toLocaleString()} unique values look like IDs rather than useful categories.`,
      });
    }

    if ((col.outlierCount ?? 0) > 0) {
      issues.push({
        severity: col.outlierCount! / Math.max(rowCount, 1) > 0.08 ? "high" : "low",
        title: `Outliers in ${col.name}`,
        detail: `${col.outlierCount} value${col.outlierCount === 1 ? "" : "s"} sit outside the IQR fence and may be errors or rare events.`,
      });
    }
  }

  const recommendations: string[] = [];
  if (duplicateRowCount > 0) {
    recommendations.push("Deduplicate rows before aggregating revenue, counts, or conversion metrics.");
  }
  const sparse = profiles.filter((col) => col.fillRate < 60);
  if (sparse.length > 0) {
    recommendations.push(
      `Review ${sparse.map((col) => col.name).join(", ")} — fill rate is below 60%. Drop, impute, or flag as optional.`,
    );
  }
  if (numericColumns.length > 0) {
    recommendations.push(
      "Profile numeric fields for scale differences before charting; normalize or split axes if ranges differ widely.",
    );
  }
  const skewed = profiles.filter((col) => {
    if (col.mean === undefined || col.median === undefined || col.std === undefined) return false;
    if (col.std === 0) return false;
    return Math.abs(col.mean - col.median) > col.std * 0.5;
  });
  if (skewed.length > 0) {
    recommendations.push(
      `${skewed.map((col) => col.name).join(", ")} look skewed (mean diverges from median). Prefer medians or log-scale views.`,
    );
  }
  const dominantCats = profiles.filter(
    (col) => col.kind === "categorical" && (col.topValues?.[0]?.pct ?? 0) >= 70,
  );
  if (dominantCats.length > 0) {
    recommendations.push(
      `Watch class imbalance in ${dominantCats.map((col) => col.name).join(", ")} — one category dominates 70%+ of rows.`,
    );
  }
  if (recommendations.length === 0) {
    recommendations.push("Data looks structurally healthy. Next step: segment key metrics by the strongest categorical fields.");
  }

  const takeaways: string[] = [];
  takeaways.push(
    `Dataset is ${rowCount.toLocaleString()} × ${columnCount} with ${numericColumns.length} numeric and ${categoricalColumns.length} categorical columns.`,
  );

  const weakest = [...profiles].sort((a, b) => a.fillRate - b.fillRate)[0];
  if (weakest) {
    takeaways.push(
      `Completeness ranges from ${weakest.fillRate.toFixed(0)}% (${weakest.name}) to 100% on fully populated fields.`,
    );
  }

  const strongestCat = profiles
    .filter((col) => col.topValues && col.topValues.length > 0)
    .sort((a, b) => (b.topValues?.[0]?.pct ?? 0) - (a.topValues?.[0]?.pct ?? 0))[0];
  if (strongestCat?.topValues?.[0]) {
    const top = strongestCat.topValues[0];
    takeaways.push(
      `Most frequent ${strongestCat.name} value is “${top.value}” (${top.pct.toFixed(0)}% of filled rows).`,
    );
  }

  const widestNumeric = profiles
    .filter((col) => col.kind === "numeric" && col.min !== undefined && col.max !== undefined)
    .sort((a, b) => (b.max ?? 0) - (b.min ?? 0) - ((a.max ?? 0) - (a.min ?? 0)))[0];
  if (widestNumeric?.mean !== undefined) {
    takeaways.push(
      `${widestNumeric.name} spans ${widestNumeric.min?.toLocaleString()} to ${widestNumeric.max?.toLocaleString()} (mean ${widestNumeric.mean.toFixed(1)}).`,
    );
  }

  if (missingCount === 0 && duplicateRowCount === 0) {
    takeaways.push("No empty cells or duplicate rows were found — quality baseline is strong.");
  } else {
    takeaways.push(
      `${missingCount.toLocaleString()} missing cells and ${duplicateRowCount.toLocaleString()} duplicate rows are the main quality flags.`,
    );
  }

  return {
    rowCount,
    columnCount,
    missingCount,
    duplicateRowCount,
    numericColumns,
    categoricalColumns,
    columns: profiles,
    issues,
    recommendations,
    takeaways,
  };
}
