import styles from "../ResultsPage.module.css";

function getDocTypeKey(data) {
  return data.documentType || "case-law";
}

function getTitleText(data, docType) {
  if (docType === "case-law") {
    return `${data.caseRef}: ${data.parties.split(" VS ").join(" vs ")}`;
  }

  return data.documentTitle;
}

function getTypeLabel(docType) {
  if (docType === "contract") return "Contract";
  if (docType === "financial-statement") return "Financial Statement";
  return "Case Law";
}

function getSourceText(data, docType) {
  if (docType === "case-law") {
    return data["Court"] || data["Court Level"] || "Tax Appeals Tribunal";
  }

  if (docType === "contract") {
    return data["Governing Law"] || "Contract";
  }

  return data.companyName || data["Industry"] || "Financial Statement";
}

function getDateText(data, docType) {
  if (docType === "case-law") return data["Decision Date"] || "—";
  if (docType === "contract") return data["Contract Date"] || data["Signing Date"] || "—";
  return data["Reporting Period End Date"] || "—";
}

function getKeyData(data, docType) {
  if (docType === "case-law") {
    return {
      label: "Disposition",
      value: data["Disposition"] || "—",
      style:
        data["Disposition"] === "Dismissed"
          ? { color: "#b91c1c", fontWeight: 700 }
          : data["Disposition"] === "Allowed"
            ? { color: "#047857", fontWeight: 700 }
            : undefined,
    };
  }

  if (docType === "contract") {
    const contractValue = data["Contract Value"];
    return {
      label: "Value",
      value: contractValue ? `${data.Currency || ""}${data.Currency ? " " : ""}${contractValue}` : "—",
    };
  }

  const profitOrLoss = data["Profit Or Loss"];
  const revenue = data["Revenue"];
  const useProfit = Boolean(profitOrLoss);
  const numericValue = useProfit ? profitOrLoss : revenue;
  const style = useProfit && numericValue !== "—"
    ? parseFloat(String(numericValue).replace(/,/g, "")) >= 0
      ? { color: "#047857", fontWeight: 700 }
      : { color: "#b91c1c", fontWeight: 700 }
    : undefined;

  return {
    label: useProfit ? "Profit / Loss" : "Revenue",
    value: numericValue || "—",
    style,
  };
}

export default function ResultTableRow({
  id,
  data,
  isPreviewActive,
  onPreviewSelect,
  onAddToReport,
  addedToReport,
  collectionFull,
}) {
  const docType = getDocTypeKey(data);
  const titleText = getTitleText(data, docType);
  const typeLabel = getTypeLabel(docType);
  const sourceText = getSourceText(data, docType);
  const dateText = getDateText(data, docType);
  const keyData = getKeyData(data, docType);

  return (
    <div
      className={`${styles.resultTableRow} ${isPreviewActive ? styles.resultTableRowActive : ""} ${addedToReport ? styles.resultTableRowSelected : ""}`}
      onClick={() => onPreviewSelect?.(id)}
    >
      <div className={styles.resultTableCell}>
        <button
          type="button"
          className={`${styles.resultTableSelectBtn} ${addedToReport ? styles.resultTableSelectBtnActive : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            onAddToReport(id);
          }}
          disabled={!addedToReport && collectionFull}
          aria-label={addedToReport ? "Remove from one-time export" : "Select for one-time export"}
          title={addedToReport ? "Remove from one-time export" : "Select for one-time export"}
        >
          {addedToReport ? (
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          )}
        </button>
      </div>

      <div className={`${styles.resultTableCell} ${styles.resultTableDocumentCell}`}>
        <span className={styles.resultTableDocumentTitle}>{titleText}</span>
        <span className={styles.resultTableDocumentMeta}>{sourceText}</span>
      </div>

      <div className={styles.resultTableCell}>
        <span className={styles.resultTableType}>{typeLabel}</span>
      </div>

      <div className={styles.resultTableCell}>
        <span className={styles.resultTableDate}>{dateText}</span>
      </div>

      <div className={`${styles.resultTableCell} ${styles.resultTableKeyCell}`}>
        <span className={styles.resultTableKeyLabel}>{keyData.label}</span>
        <span className={styles.resultTableKeyValue} style={keyData.style}>
          {keyData.value}
        </span>
      </div>

      <div className={`${styles.resultTableCell} ${styles.resultTableActionsCell}`}>
        <button
          type="button"
          className={styles.resultTableOpenBtn}
          onClick={(event) => event.stopPropagation()}
          aria-label="Open result"
          title="Open"
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </button>
      </div>
    </div>
  );
}
