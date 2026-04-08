import styles from "../ResultsPage.module.css";
import {
  getDocTypeKey,
  getPrimaryDateText,
  getResultTitle,
  getResultTypeLabel,
  getSourceLabel,
} from "../../data/documentUtils";

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
  const titleText = getResultTitle(data);
  const typeLabel = getResultTypeLabel(data);
  const sourceText = docType === "case-law" ? "Kenya Law" : getSourceLabel(data);
  const dateText = getPrimaryDateText(data);

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
          aria-label={addedToReport ? "Remove from report" : "Add to report"}
          title={addedToReport ? "Remove from report" : "Add to report"}
        >
          {addedToReport ? (
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/></svg>
          )}
        </button>
      </div>

      <div className={`${styles.resultTableCell} ${styles.resultTableDocumentCell}`}>
        <span className={styles.resultTableDocumentTitle}>{titleText}</span>
      </div>

      <div className={styles.resultTableCell}>
        <span className={styles.resultTableType}>{typeLabel}</span>
      </div>

      <div className={styles.resultTableCell}>
        <span className={styles.resultTableSource}>{sourceText}</span>
      </div>

      <div className={styles.resultTableCell}>
        <span className={styles.resultTableDate}>{dateText}</span>
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
