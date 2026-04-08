import { CaseRecord } from "./sampleCases";

const CSV_PATH = "/data/jibudocs_cases.csv";

export type CasesById = Record<string, CaseRecord>;

let cachedCasesById: CasesById | null = null;
let loadPromise: Promise<CasesById> | null = null;

const EMPTY_VALUE_SET = new Set(["", "n/a", "na", "null", "undefined", "unknown"]);

function normalizeWhitespace(value: unknown): string {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCell(value: unknown): string {
  const normalized = normalizeWhitespace(value);
  return EMPTY_VALUE_SET.has(normalized.toLowerCase()) ? "" : normalized;
}

function finalizeCsvRow(row: string[]): string[] | null {
  const hasContent = row.some((value) => String(value).trim() !== "");
  return hasContent ? row : null;
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }

    if (char === "\n") {
      row.push(cell);
      const completedRow = finalizeCsvRow(row);
      if (completedRow) rows.push(completedRow);
      row = [];
      cell = "";
      continue;
    }

    if (char !== "\r") {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    const completedRow = finalizeCsvRow(row);
    if (completedRow) rows.push(completedRow);
  }

  if (rows.length === 0) return [];

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((header) => normalizeCell(header));

  return dataRows.map((values) => {
    const record: Record<string, string> = {};

    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = normalizeCell(values[index] ?? "");
    });

    return record;
  });
}

function slugify(value: string): string {
  return normalizeCell(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function appendSentence(parts: string[], label: string | null, value: string | undefined): void {
  if (!value) return;
  const normalized = value.endsWith(".") ? value : `${value}.`;
  parts.push(label ? `${label}: ${normalized}` : normalized);
}

function buildCaseId(row: Record<string, string>, index: number): string {
  const slug = slugify(
    [
      row["Decision Date"],
      row["Plaintiff Name"],
      row["Defendant Name"],
      row["Court"],
    ]
      .filter(Boolean)
      .join(" ")
  );

  return slug ? `${slug}-${index + 1}` : `case-${index + 1}`;
}

function buildPartyLabel(row: Record<string, string>, index: number): string {
  const plaintiff = normalizeCell(row["Plaintiff Name"]);
  const defendant = normalizeCell(row["Defendant Name"]);

  if (plaintiff && defendant) return `${plaintiff} VS ${defendant}`;
  if (plaintiff) return plaintiff;
  if (defendant) return defendant;
  if (row.Overview) return row.Overview;
  return `Case ${index + 1}`;
}

function buildBackground(row: Record<string, string>): string {
  const parts: string[] = [];

  appendSentence(parts, null, row.Overview);
  if (row["Key Facts"] && row["Key Facts"] !== row.Overview) {
    appendSentence(parts, "Key facts", row["Key Facts"]);
  }
  if (!parts.length && row["Passage Text"]) {
    appendSentence(parts, "Passage", row["Passage Text"]);
  }

  return parts.join(" ");
}

function buildDecision(row: Record<string, string>): string {
  const parts: string[] = [];

  appendSentence(parts, "Disposition", row.Disposition);
  appendSentence(parts, "Remedies", row.Remedies);
  appendSentence(parts, "Monetary damages", row["Monetary Damages"]);
  appendSentence(parts, "Prevailing party", row["Prevailing Party"]);
  appendSentence(parts, "Dismissal reason", row["Dismissal Reason"]);

  return parts.join(" ");
}

function normalizeCaseRecord(row: Record<string, string>, index: number): CaseRecord {
  const parties = buildPartyLabel(row, index);

  return {
    ...row,
    id: buildCaseId(row, index),
    documentType: "case-law",
    parties,
    caseRef: "",
    background: buildBackground(row),
    issues: row.Issues,
    findings: row.Holdings || row["Legal Principles"],
    decision: buildDecision(row),
    legalPrinciples: row["Legal Principles"],
    passageText: row["Passage Text"],
  };
}

async function fetchAndBuildCaseDatabase(): Promise<CasesById> {
  const response = await fetch(CSV_PATH, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Could not load local case database (${response.status}).`);
  }

  const csvText = await response.text();
  const parsedRows = parseCsv(csvText);
  const normalizedRows = parsedRows.map(normalizeCaseRecord);

  return normalizedRows.reduce<CasesById>((acc, row) => {
    const id = (row as CaseRecord & { id: string }).id;
    acc[id] = row;
    return acc;
  }, {});
}

export function getCachedLocalCaseDatabase(): CasesById | null {
  return cachedCasesById;
}

export async function loadLocalCaseDatabase(): Promise<CasesById> {
  if (cachedCasesById) return cachedCasesById;

  if (!loadPromise) {
    loadPromise = fetchAndBuildCaseDatabase()
      .then((casesById) => {
        cachedCasesById = casesById;
        return casesById;
      })
      .finally(() => {
        loadPromise = null;
      });
  }

  return loadPromise;
}
