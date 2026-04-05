import styles from "../ResultsPage.module.css";

export default function PreviewPanel({ data }) {
  if (!data) {
    return (
      <aside className={`${styles.previewPanel} ${styles.previewPanelEmpty}`}>
        <div className={styles.previewEmptyState}>
          <p className={styles.previewEmptyText}>Select a result to preview its details.</p>
        </div>
      </aside>
    );
  }

  const docType = data.documentType;
  const title = docType
    ? (data.companyName || data.documentTitle)
    : `${data.caseRef}: ${data.parties.split(" VS ").join(" vs ")}`;
  const sections = docType === "financial-statement"
    ? [
        { key: "documentTitle", label: "Document Title" },
        { key: "Statement Type", label: "Statement Type" },
        { key: "Reporting Period End Date", label: "Reporting Period" },
        { key: "Revenue", label: "Revenue" },
        { key: "Profit Or Loss", label: "Profit Or Loss" },
        { key: "Auditor Opinion", label: "Auditor Opinion" },
      ]
    : docType === "contract"
      ? [
          { key: "Contract Name", label: "Contract Name" },
          { key: "Contract Type", label: "Contract Type" },
          { key: "Legal Area", label: "Legal Area" },
          { key: "Parties", label: "Parties" },
          { key: "Contract Value", label: "Contract Value" },
          { key: "Governing Law", label: "Governing Law" },
        ]
      : [
          { key: "background", label: "Background" },
          { key: "issues", label: "Issues" },
          { key: "findings", label: "Findings" },
          { key: "decision", label: "Decision" },
        ];
  return (
    <aside className={styles.previewPanel}>
      <h3 className={styles.previewTitle}>{title}</h3>
      {sections.map((sec) =>
        data[sec.key] ? (
          <div key={sec.key} className={styles.previewSection}>
            <h4 className={styles.previewSectionTitle}>{sec.label}</h4>
            <p className={styles.previewText}>{data[sec.key]}</p>
          </div>
        ) : null
      )}
    </aside>
  );
}
