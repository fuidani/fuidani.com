import { CaseRecord, ReportSection } from "../../data/sampleCases";

export {
  getCompareDocumentHeading,
  getDocumentLabel,
} from "../../data/documentUtils";

export interface ComparisonRow {
  id: string;
  label: string;
  values: string[];
  isDifferent: boolean;
}

export interface ComparisonResult {
  metadataRows: ComparisonRow[];
  narrativeRows: ComparisonRow[];
  differingMetadataCount: number;
  sharedMetadataCount: number;
  differingNarrativeCount: number;
}

export function formatCompareValue(value: unknown): string {
  return value === undefined || value === null || value === "" ? "—" : String(value);
}

export function allCompareValuesMatch(values: string[]): boolean {
  const normalized = values
    .map((value) => formatCompareValue(value))
    .map((value) => String(value).trim().toLowerCase());

  if (normalized.length < 2) return true;
  return normalized.every((value) => value === normalized[0]);
}

export function getComparisonRows(
  cases: CaseRecord[],
  metaFields: string[],
  sections: ReportSection[]
): ComparisonResult {
  const metadataRows: ComparisonRow[] = metaFields
    .map((field) => {
      const values = cases.map((doc) => formatCompareValue(doc[field]));
      return {
        id: `meta-${field}`,
        label: field,
        values,
        isDifferent: !allCompareValuesMatch(values),
      };
    })
    .filter((row) => row.values.some((value) => value !== "—"));

  const narrativeRows: ComparisonRow[] = sections
    .filter((section) => section.enabled)
    .map((section) => {
      const values = cases.map((doc) => formatCompareValue(doc[section.id]));
      return {
        id: `section-${section.id}`,
        label: section.label,
        values,
        isDifferent: !allCompareValuesMatch(values),
      };
    })
    .filter((row) => row.values.some((value) => value !== "—"));

  return {
    metadataRows,
    narrativeRows,
    differingMetadataCount: metadataRows.filter((row) => row.isDifferent).length,
    sharedMetadataCount: metadataRows.filter((row) => !row.isDifferent).length,
    differingNarrativeCount: narrativeRows.filter((row) => row.isDifferent).length,
  };
}
