/* ─── Filter definitions ────────────────────────────────── */

export const FILTER_DEFS = [
  { key: "documentType", label: "Document Type", field: "documentType", defaultOpen: true, fallback: "case-law",
    displayLabel: { "case-law": "Case Law", "financial-statement": "Financial Statement", "contract": "Contract" } },
  { key: "taxType",      label: "Tax Type",      field: "Tax Type",     defaultOpen: true },
  { key: "disposition",  label: "Disposition",    field: "Disposition",  defaultOpen: true },
  { key: "prevailingParty",      label: "Prevailing Party",      field: "Prevailing Party",      defaultOpen: true },
  { key: "taxIssueCategory",     label: "Tax Issue Category",     field: "Tax Issue Category",     defaultOpen: false },
  { key: "taxpayerClassification", label: "Taxpayer Classification", field: "Taxpayer Classification", defaultOpen: false },
  { key: "decisionYear", label: "Decision Year", field: "Decision Date", defaultOpen: false, extract: (v) => v?.match(/\d{4}/)?.[0] },
];

export function getFilterOptionLabels(def, item) {
  const raw = item[def.field] || def.fallback;
  if (!raw) return [];

  const values = def.extract ? [def.extract(raw)] : String(raw).split(" / ");
  return values
    .map((value) => {
      const trimmed = value?.trim();
      if (!trimmed) return null;
      return def.displayLabel?.[trimmed] || trimmed;
    })
    .filter(Boolean);
}

export function matchesSelectedFilters(item, selectedFilters) {
  return FILTER_DEFS.every((def) => {
    const selectedValues = selectedFilters[def.key];
    if (!selectedValues?.length) return true;

    const itemLabels = getFilterOptionLabels(def, item);
    return selectedValues.some((value) => itemLabels.includes(value));
  });
}

/** Build FILTER_SECTIONS with live counts from a cases object (id → data). */
export function buildFilterSections(cases) {
  const items = Object.values(cases);
  return FILTER_DEFS.map((def) => {
    const counts = {};
    for (const item of items) {
      const labels = getFilterOptionLabels(def, item);
      for (const label of labels) {
        counts[label] = (counts[label] || 0) + 1;
      }
    }
    const options = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));
    return { key: def.key, label: def.label, options, defaultOpen: def.defaultOpen };
  }).filter((sec) => sec.options.length > 0);
}

/** Backward-compat: static placeholder (prefer buildFilterSections). */
export const FILTER_SECTIONS = FILTER_DEFS.map((d) => ({ key: d.key, label: d.label, options: [], defaultOpen: d.defaultOpen }));

export const SUGGESTED_CHIPS = [
  "Customs Duty",
  "Transfer Pricing",
  "Large Taxpayer",
  "Dismissed",
  "2025 Decisions",
];

export const CARD_FIELDS = [
  "Court",
  "Tax Type",
  "Decision Date",
  "Disposition",
  "Disputed Tax Amount",
  "Prevailing Party",
  "Tax Issue Category",
];

export const CARD_FIELDS_FINANCIAL = [
  "Statement Type",
  "Reporting Period End Date",
  "Industry",
  "Country Or Region",
  "Revenue",
  "Profit Or Loss",
  "Auditor Opinion",
  "Is Signed",
];

export const CARD_FIELDS_CONTRACT = [
  "Contract Name",
  "Contract Type",
  "Legal Area",
  "Contract Date",
  "Signing Date",
  "Expiration Date",
  "Parties",
  "Governing Law",
  "Contract Value",
  "Currency",
];

export const LIST_FIELDS = [
  "Court",
  "Decision Date",
  "Tax Type",
  "Disposition",
  "Prevailing Party",
];

export const LIST_FIELDS_FINANCIAL = [
  "Statement Type",
  "Reporting Period End Date",
  "Industry",
  "Revenue",
  "Profit Or Loss",
];

export const LIST_FIELDS_CONTRACT = [
  "Contract Type",
  "Contract Date",
  "Signing Date",
  "Governing Law",
  "Contract Value",
];

export const ALL_FIELDS = [
  "Court", "Court Level", "Decision Date", "Decision Type", "Prevailing Party",
  "Disposition", "Legal Topics", "Jurisdiction", "Issues", "Tax Type",
  "Tax Issue Category", "Taxpayer Classification", "Revenue Authority",
  "Disputed Tax Amount", "Penalty Amount", "Judge Name",
];

export const ALL_FIELDS_FINANCIAL = [
  "Statement Type", "Reporting Period End Date", "Industry", "Country Or Region",
  "Revenue", "Profit Or Loss", "Auditor Opinion", "Is Signed", "Currency",
];

export const ALL_FIELDS_CONTRACT = [
  "Contract Name", "Contract Type", "Legal Area", "Contract Date",
  "Signing Date", "Expiration Date", "Parties", "Governing Law",
  "Contract Value", "Currency", "Jurisdiction",
];

export const ALL_LIST_FIELDS = [...LIST_FIELDS];

export const ALL_LIST_FIELDS_FINANCIAL = [...LIST_FIELDS_FINANCIAL];

export const ALL_LIST_FIELDS_CONTRACT = [...LIST_FIELDS_CONTRACT];

export const FOOTER_SECTIONS_BY_TYPE = {
  "financial-statement": [
    { key: "companyIdentifiers", label: "Company Identifiers" },
    { key: "reportingStandards", label: "Reporting Standards" },
    { key: "consolidationLevel", label: "Consolidation Level" },
    { key: "presentationCurrency", label: "Presentation Currency" },
    { key: "units", label: "Units" },
    { key: "roundingPolicy", label: "Rounding Policy" },
  ],
  contract: [
    { key: "effectiveDate", label: "Effective Date" },
    { key: "jurisdiction", label: "Jurisdiction" },
    { key: "paymentTerms", label: "Payment Terms" },
    { key: "term", label: "Term" },
    { key: "scopeOfWork", label: "Scope of Work" },
    { key: "background", label: "Background" },
    { key: "fees", label: "Fees" },
  ],
};

export const FOOTER_SECTIONS_CASE = ["background", "issues", "findings", "decision"];
