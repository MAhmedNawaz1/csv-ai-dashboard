import Papa from "papaparse";
import type { CsvRow, ParsedCsv } from "./types";

const MAX_FILE_BYTES = 25 * 1024 * 1024;

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || String(value).trim() === "";
}

export function assertCsvFile(file: File): void {
  const name = file.name.toLowerCase();
  const isCsv =
    name.endsWith(".csv") ||
    file.type === "text/csv" ||
    file.type === "application/vnd.ms-excel";

  if (!isCsv) {
    throw new Error("Please drop a .csv file. Other formats are not supported.");
  }

  if (file.size === 0) {
    throw new Error("The file is empty. Choose a CSV with a header row and data.");
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error("File is larger than 25 MB. Split it into smaller CSVs and try again.");
  }
}

export function parseCsvFile(file: File): Promise<ParsedCsv> {
  assertCsvFile(file);

  return new Promise((resolve, reject) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const columns = (results.meta.fields ?? []).filter((field) => field.length > 0);

        if (columns.length === 0) {
          reject(
            new Error(
              "No columns were detected. Make sure the CSV has a header row and uses commas as separators.",
            ),
          );
          return;
        }

        const fatal = results.errors.filter(
          (error) => error.type === "Delimiter" || error.type === "Quotes",
        );

        if (fatal.length > 0) {
          reject(
            new Error(
              fatal[0]?.message ||
                "The CSV could not be parsed. Check for mismatched quotes or an unknown delimiter.",
            ),
          );
          return;
        }

        const rows = results.data
          .map((row) => {
            const next: CsvRow = {};
            for (const column of columns) {
              const raw = row[column];
              next[column] = isBlank(raw) ? "" : String(raw).trim();
            }
            return next;
          })
          .filter((row) => columns.some((column) => row[column] !== ""));

        resolve({ rows, columns });
      },
      error: (error) => {
        reject(new Error(error.message || "Failed to parse the CSV file."));
      },
    });
  });
}

export async function parseCsvText(text: string, fileName = "sample.csv"): Promise<ParsedCsv> {
  const blob = new File([text], fileName, { type: "text/csv" });
  return parseCsvFile(blob);
}
