import { getDocumentLabel, getComparisonRows } from "./utils";
import styles from "../ReportPage.module.css";

export default function ComparisonAppendix({ cases, metaFields, sections, docTypeLabel }) {
  if (cases.length < 2) return null;

  const {
    metadataRows,
    differingMetadataCount,
    sharedMetadataCount,
  } = getComparisonRows(cases, metaFields, sections);

  if (metadataRows.length === 0) return null;

  const useTransposed = cases.length > 3;

  const docNumbers = cases.map((doc, i) => ({
    num: i + 1,
    doc,
    label: getDocumentLabel(doc),
  }));

  const differenceSummaries = metadataRows
    .filter((row) => row.isDifferent)
    .map((row) => {
      const counts = {};
      row.values.forEach((val) => {
        counts[val] = (counts[val] || 0) + 1;
      });
      const groups = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([val, count]) => `${count}/${cases.length}: ${val}`);
      return { label: row.label, groups };
    });

  return (
    <section className={styles.compareAppendix}>
      <div className={styles.compareAppendixHeader}>
        <div className={styles.compareAppendixEyebrow}>Appendix</div>
        <div className={styles.compareAppendixTitle}>Comparison Summary</div>
        <p className={styles.compareAppendixIntro}>
          {useTransposed
            ? `Cross-reference of ${cases.length} ${docTypeLabel.toLowerCase()} documents across ${metadataRows.length} metadata fields.`
            : `Side-by-side comparison of the selected ${docTypeLabel.toLowerCase()} documents.`}
        </p>
      </div>

      <div className={styles.compareAppendixStats}>
        <div className={styles.compareAppendixStat}>
          <span className={styles.compareAppendixStatValue}>{cases.length}</span>
          <span className={styles.compareAppendixStatLabel}>documents compared</span>
        </div>
        <div className={styles.compareAppendixStat}>
          <span className={styles.compareAppendixStatValue}>{differingMetadataCount}</span>
          <span className={styles.compareAppendixStatLabel}>metadata fields differ</span>
        </div>
        <div className={styles.compareAppendixStat}>
          <span className={styles.compareAppendixStatValue}>{sharedMetadataCount}</span>
          <span className={styles.compareAppendixStatLabel}>metadata fields match</span>
        </div>
      </div>

      {differenceSummaries.length > 0 && useTransposed && (
        <div className={styles.compareAppendixBlock}>
          <div className={styles.compareAppendixBlockTitle}>Key differences</div>
          <div className={styles.diffSummaryGrid}>
            {differenceSummaries.map((item) => (
              <div key={item.label} className={styles.diffSummaryCard}>
                <div className={styles.diffSummaryField}>{item.label}</div>
                <div className={styles.diffSummaryValues}>
                  {item.groups.map((g, i) => (
                    <span key={i} className={styles.diffSummaryChip}>{g}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {metadataRows.length > 0 && (
        <div className={styles.compareAppendixBlock}>
          <div className={styles.compareAppendixBlockTitle}>Metadata comparison</div>

          {useTransposed && (
            <div className={styles.docLegend}>
              {docNumbers.map(({ num, label }) => (
                <div key={num} className={styles.docLegendItem}>
                  <span className={styles.docLegendNum}>{num}</span>
                  <span className={styles.docLegendLabel}>{label}</span>
                </div>
              ))}
            </div>
          )}

          <div className={useTransposed ? undefined : styles.compareAppendixTableWrap}>
            {useTransposed ? (
              <>
                {metadataRows.filter((r) => r.isDifferent).length > 0 && (
                  <table className={styles.compareAppendixTableTransposed}>
                    <thead>
                      <tr>
                        <th className={styles.compareAppendixDocNumCol}>#</th>
                        {metadataRows.filter((r) => r.isDifferent).map((row) => (
                          <th key={row.id}>{row.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cases.map((doc, docIdx) => (
                        <tr key={doc.id}>
                          <th scope="row" className={styles.compareAppendixDocNumCell}>
                            {docIdx + 1}
                          </th>
                          {metadataRows.filter((r) => r.isDifferent).map((row) => (
                            <td
                              key={`${row.id}-${doc.id}`}
                              className={styles.compareAppendixCellDiff}
                            >
                              {row.values[docIdx]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {metadataRows.filter((r) => !r.isDifferent).length > 0 && (
                  <div className={styles.sharedFieldsList}>
                    <div className={styles.sharedFieldsTitle}>Shared across all documents</div>
                    <div className={styles.sharedFieldsItems}>
                      {metadataRows.filter((r) => !r.isDifferent).map((row) => (
                        <span key={row.id} className={styles.sharedFieldsItem}>
                          <strong>{row.label}:</strong> {row.values[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <table className={styles.compareAppendixTable}>
                <thead>
                  <tr>
                    <th>Field</th>
                    {cases.map((doc) => (
                      <th key={doc.id}>{getDocumentLabel(doc)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metadataRows.map((row) => (
                    <tr key={row.id}>
                      <th scope="row">{row.label}</th>
                      {row.values.map((value, index) => (
                        <td
                          key={`${row.id}-${cases[index].id}`}
                          className={row.isDifferent ? styles.compareAppendixCellDiff : ""}
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
