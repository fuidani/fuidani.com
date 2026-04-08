import { CaseRecord, DocumentType, DOC_TYPE_LABELS } from "./sampleCases";

function cleanText(value: unknown): string {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .trim();
}

function singularDocTypeLabel(docType: string): string {
  if (docType === "financial-statement") return "Financial Statement";
  if (docType === "contract") return "Contract";
  return "Case Law";
}

export interface DocumentHeading {
  eyebrow: string;
  title: string;
}

export interface PreviewSectionDef {
  key: string;
  label: string;
}

export function getDocTypeKey(data: CaseRecord | null | undefined): string {
  return data?.documentType || "case-law";
}

export function getCaseParties(data: CaseRecord | null | undefined): string {
  if (!data) return "";

  const directParties = cleanText(data.parties);
  if (directParties) return directParties;

  const plaintiff = cleanText(data["Plaintiff Name"]);
  const defendant = cleanText(data["Defendant Name"]);

  if (plaintiff && defendant) return `${plaintiff} VS ${defendant}`;
  return plaintiff || defendant || "";
}

export function getFormattedCaseParties(data: CaseRecord | null | undefined): string {
  return getCaseParties(data).replace(/\s+VS\s+/gi, " vs ");
}

export function getCaseReference(data: CaseRecord | null | undefined): string {
  const explicitRef = cleanText(data?.caseRef);
  if (explicitRef) return explicitRef;

  return cleanText(data?.["Decision Type"]) || cleanText(data?.["Court Level"]) || "Case";
}

export function getResultTitle(data: CaseRecord | null | undefined): string {
  const docType = getDocTypeKey(data);

  if (docType === "case-law") {
    const caseRef = cleanText(data?.caseRef);
    const parties = getFormattedCaseParties(data);

    if (caseRef && parties) return `${caseRef}: ${parties}`;
    return parties || caseRef || "Untitled case";
  }

  return cleanText(data?.documentTitle) || cleanText(data?.companyName) || "Untitled document";
}

export function getDocumentLabel(data: CaseRecord | null | undefined): string {
  return getResultTitle(data);
}

export function getResultTypeLabel(data: CaseRecord | null | undefined): string {
  return singularDocTypeLabel(getDocTypeKey(data));
}

export function getSourceLabel(data: CaseRecord | null | undefined): string {
  const docType = getDocTypeKey(data);

  if (docType === "case-law") {
    return cleanText(data?.Court) || cleanText(data?.["Court Level"]) || cleanText(data?.Jurisdiction) || "Case Law";
  }

  if (docType === "contract") {
    return cleanText(data?.["Governing Law"]) || "Contract";
  }

  return cleanText(data?.companyName) || cleanText(data?.Industry) || "Financial Statement";
}

export function getPrimaryDateText(data: CaseRecord | null | undefined): string {
  const docType = getDocTypeKey(data);

  if (docType === "case-law") return cleanText(data?.["Decision Date"]) || "—";
  if (docType === "contract") {
    return (
      cleanText(data?.["Contract Date"])
      || cleanText(data?.["Signing Date"])
      || cleanText(data?.["Expiration Date"])
      || "—"
    );
  }

  return cleanText(data?.["Reporting Period End Date"]) || "—";
}

export function getCompareDocumentHeading(doc: CaseRecord): DocumentHeading {
  const docType = getDocTypeKey(doc);

  if (docType === "case-law") {
    return {
      eyebrow: getCaseReference(doc),
      title: getFormattedCaseParties(doc) || "Untitled case",
    };
  }

  if (doc.companyName) {
    return {
      eyebrow: doc.companyName,
      title: doc.documentTitle || "Untitled",
    };
  }

  return {
    eyebrow: doc["Contract Type"] || DOC_TYPE_LABELS[docType as DocumentType] || "Document",
    title: doc.documentTitle || doc["Contract Name"] || "Untitled",
  };
}

export function getPreviewSections(data: CaseRecord | null | undefined): PreviewSectionDef[] {
  const docType = getDocTypeKey(data);

  if (docType === "financial-statement") {
    return [
      { key: "documentTitle", label: "Document Title" },
      { key: "Statement Type", label: "Statement Type" },
      { key: "Reporting Period End Date", label: "Reporting Period" },
      { key: "Revenue", label: "Revenue" },
      { key: "Profit Or Loss", label: "Profit Or Loss" },
      { key: "Auditor Opinion", label: "Auditor Opinion" },
    ];
  }

  if (docType === "contract") {
    return [
      { key: "Contract Name", label: "Contract Name" },
      { key: "Contract Type", label: "Contract Type" },
      { key: "Legal Area", label: "Legal Area" },
      { key: "Parties", label: "Parties" },
      { key: "Contract Value", label: "Contract Value" },
      { key: "Governing Law", label: "Governing Law" },
    ];
  }

  return [
    { key: "background", label: "Overview" },
    { key: "issues", label: "Issues" },
    { key: "findings", label: "Holdings" },
    { key: "decision", label: "Decision Summary" },
    { key: "legalPrinciples", label: "Legal Principles" },
    { key: "passageText", label: "Key Passage" },
  ];
}

export function getPluralDocTypeLabel(docType: string): string {
  return DOC_TYPE_LABELS[docType as DocumentType] || singularDocTypeLabel(docType);
}
