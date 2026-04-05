import { DOC_TYPE_LABELS } from "../../data/sampleCases";

export function getDocumentLabel(doc) {
  return doc.parties
    ? `${doc.caseRef || ""}: ${doc.parties}`
    : doc.companyName || doc.documentTitle || "Untitled";
}

export function getCompareDocumentHeading(doc) {
  if (doc.parties) {
    return {
      eyebrow: doc.caseRef || "Case",
      title: doc.parties,
    };
  }

  if (doc.companyName) {
    return {
      eyebrow: doc.companyName,
      title: doc.documentTitle || "Untitled",
    };
  }

  return {
    eyebrow: doc["Contract Type"] || DOC_TYPE_LABELS[doc.documentType] || "Document",
    title: doc.documentTitle || doc["Contract Name"] || "Untitled",
  };
}

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
