import styles from "../ResultsPage.module.css";

const typeLabel = (t) =>
  t === "case-law" ? "Case Law" : t === "financial-statement" ? "Financial Statements" : "Contracts";

export default function MixedTypeModal({ typeGroups, onProceed, onCancel }) {
  if (!typeGroups) return null;

  const typeKeys = Object.keys(typeGroups);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalBox}>
        <div className={styles.modalHeader}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3 className={styles.modalTitle}>Multiple document types selected</h3>
        </div>
        <p className={styles.modalDesc}>
          Reports can only contain one document type. Choose which type to include:
        </p>
        <div className={styles.modalOptions}>
          {typeKeys.map((t) => (
            <button key={t} className={styles.modalOptionBtn} onClick={() => onProceed(t)}>
              <span className={styles.modalOptionLabel}>{typeLabel(t)}</span>
              <span className={styles.modalOptionCount}>
                {typeGroups[t].length} document{typeGroups[t].length !== 1 ? "s" : ""}
              </span>
            </button>
          ))}
        </div>
        <button className={styles.modalCancelBtn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
