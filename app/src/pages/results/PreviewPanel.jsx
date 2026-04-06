import styles from "../ResultsPage.module.css";
import {
  getPreviewSections,
  getResultTitle,
} from "../../data/documentUtils";

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

  const title = getResultTitle(data);
  const sections = getPreviewSections(data);
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
