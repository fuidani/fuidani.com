import { CaseRecord } from "../../data/sampleCases";

/* ─── Filter definitions ────────────────────────────────── */

export interface FilterDef {
  key: string;
  label: string;
  field: string;
  defaultOpen: boolean;
  fallback?: string;
  displayLabel?: Record<string, string>;
  splitPattern?: RegExp;
  extract?: (v: string) => string | undefined;
}

export interface FilterOption {
  label: string;
  count: number;
}

export interface FilterSection {
  key: string;
  label: string;
  options: FilterOption[];
  defaultOpen: boolean;
}

export interface FooterSectionDef {
  key: string;
  label: string;
}

export const PRIMARY_FILTER_DEFS: FilterDef[] = [
  { key: "documentType", label: "Document Type", field: "documentType", defaultOpen: true, fallback: "case-law",
    displayLabel: { "case-law": "Case Law", "financial-statement": "Financial Statement", "contract": "Contract" } },
  { key: "courtLevel",   label: "Court Level",   field: "Court Level",  defaultOpen: true },
  { key: "court",        label: "Court",         field: "Court",        defaultOpen: false },
  { key: "disposition",  label: "Disposition",    field: "Disposition",  defaultOpen: true },
  { key: "prevailingParty",      label: "Prevailing Party",      field: "Prevailing Party",      defaultOpen: false },
  { key: "legalTopics",  label: "Legal Topic",    field: "Legal Topics", defaultOpen: true, splitPattern: /\s*;\s*/ },
  { key: "sector",       label: "Sector",         field: "Sector",       defaultOpen: false, splitPattern: /\s*;\s*/ },
  { key: "decisionYear", label: "Decision Year", field: "Decision Date", defaultOpen: false, extract: (v) => v?.match(/\d{4}/)?.[0] },
];

export const EXTRA_FILTER_DEFS: FilterDef[] = [
  { key: "judgeName",      label: "Judge Name",       field: "Judge Name",       defaultOpen: false },
  { key: "jurisdiction",   label: "Jurisdiction",     field: "Jurisdiction",     defaultOpen: false },
  { key: "plaintiffName",  label: "Plaintiff Name",   field: "Plaintiff Name",   defaultOpen: false },
  { key: "defendantName",  label: "Defendant Name",   field: "Defendant Name",   defaultOpen: false },
  { key: "citedStatute",   label: "Cited Statute",    field: "Cited Statute",    defaultOpen: false, splitPattern: /\s*;\s*/ },
  { key: "precedentName",  label: "Precedent Name",   field: "Precedent Name",   defaultOpen: false },
  { key: "decisionType",   label: "Decision Type",    field: "Decision Type",    defaultOpen: false },
  { key: "legalPrinciples",label: "Legal Principles",  field: "legalPrinciples",  defaultOpen: false, splitPattern: /\s*;\s*/ },
];

export const FILTER_DEFS: FilterDef[] = [...PRIMARY_FILTER_DEFS, ...EXTRA_FILTER_DEFS];

export function getFilterOptionLabels(def: FilterDef, item: CaseRecord): string[] {
  const raw = item[def.field] || def.fallback;
  if (!raw) return [];

  const values = def.extract ? [def.extract(raw)] : String(raw).split(def.splitPattern || " / ");
  return values
    .map((value) => {
      const trimmed = value?.trim();
      if (!trimmed) return null;
      return def.displayLabel?.[trimmed] || trimmed;
    })
    .filter((v): v is string => v !== null);
}

export function matchesSelectedFilters(item: CaseRecord, selectedFilters: Record<string, string[]>): boolean {
  return FILTER_DEFS.every((def) => {
    const selectedValues = selectedFilters[def.key];
    if (!selectedValues?.length) return true;

    const itemLabels = getFilterOptionLabels(def, item);
    return selectedValues.some((value) => itemLabels.includes(value));
  });
}

/** Build FILTER_SECTIONS with live counts from a cases object (id → data). */
export function buildFilterSections(cases: Record<string, CaseRecord>): FilterSection[] {
  const items = Object.values(cases);
  return FILTER_DEFS.map((def) => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const labels = getFilterOptionLabels(def, item);
      for (const label of labels) {
        counts[label] = (counts[label] || 0) + 1;
      }
    }
    const options: FilterOption[] = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));
    return { key: def.key, label: def.label, options, defaultOpen: def.defaultOpen };
  }).filter((sec) => sec.options.length > 0);
}

/** Backward-compat: static placeholder (prefer buildFilterSections). */
export const FILTER_SECTIONS: FilterSection[] = FILTER_DEFS.map((d) => ({ key: d.key, label: d.label, options: [], defaultOpen: d.defaultOpen }));

export const SUGGESTED_CHIPS: string[] = [
  "Judicial Review",
  "Constitutional",
  "High Court",
  "Dismissed",
  "2024 Decisions",
];

export const CARD_FIELDS: string[] = [
  "Court",
  "Decision Date",
  "Decision Type",
  "Disposition",
  "Prevailing Party",
  "Legal Topics",
  "Monetary Damages",
];

export const CARD_FIELDS_FINANCIAL: string[] = [
  "Statement Type",
  "Reporting Period End Date",
  "Industry",
  "Country Or Region",
  "Revenue",
  "Profit Or Loss",
  "Auditor Opinion",
  "Is Signed",
];

export const CARD_FIELDS_CONTRACT: string[] = [
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

export const LIST_FIELDS: string[] = [
  "Court",
  "Decision Date",
  "Disposition",
  "Legal Topics",
  "Judge Name",
];

export const LIST_FIELDS_FINANCIAL: string[] = [
  "Statement Type",
  "Reporting Period End Date",
  "Industry",
  "Revenue",
  "Profit Or Loss",
];

export const LIST_FIELDS_CONTRACT: string[] = [
  "Contract Type",
  "Contract Date",
  "Signing Date",
  "Governing Law",
  "Contract Value",
];

export const ALL_FIELDS: string[] = [
  "Court", "Court Level", "Decision Date", "Decision Type", "Prevailing Party",
  "Disposition", "Judge Name", "Jurisdiction", "Legal Topics", "Sector",
  "Plaintiff Name", "Defendant Name", "Monetary Damages", "Cited Statute",
  "Precedent Name", "Statute Citation",
];

export const ALL_FIELDS_FINANCIAL: string[] = [
  "Statement Type", "Reporting Period End Date", "Industry", "Country Or Region",
  "Revenue", "Profit Or Loss", "Auditor Opinion", "Is Signed", "Currency",
];

export const ALL_FIELDS_CONTRACT: string[] = [
  "Contract Name", "Contract Type", "Legal Area", "Contract Date",
  "Signing Date", "Expiration Date", "Parties", "Governing Law",
  "Contract Value", "Currency", "Jurisdiction",
];

export const ALL_LIST_FIELDS: string[] = [...LIST_FIELDS];

export const ALL_LIST_FIELDS_FINANCIAL: string[] = [...LIST_FIELDS_FINANCIAL];

export const ALL_LIST_FIELDS_CONTRACT: string[] = [...LIST_FIELDS_CONTRACT];

export const FOOTER_SECTIONS_BY_TYPE: Record<string, FooterSectionDef[]> = {
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

export const FOOTER_SECTIONS_CASE: string[] = ["background", "issues", "findings", "decision"];
