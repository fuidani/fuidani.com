export {
  getCompareDocumentHeading,
  getDocumentLabel,
} from "../../data/documentUtils";

export function formatCompareValue(value) {
  return value === undefined || value === null || value === "" ? "—" : value;
}

export function allCompareValuesMatch(values) {
  const normalized = values
    .map((value) => formatCompareValue(value))
    .map((value) => String(value).trim().toLowerCase());

  if (normalized.length < 2) return true;
  return normalized.every((value) => value === normalized[0]);
}

export function getComparisonRows(cases, metaFields, sections) {
  const metadataRows = metaFields
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

  const narrativeRows = sections
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
