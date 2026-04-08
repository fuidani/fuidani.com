import { useState } from "react";
import { getDocumentLabel, getComparisonRows } from "./utils";
import styles from "../ReportPage.module.css";

export default function ComparisonAppendix({ cases, metaFields, sections, docTypeLabel }) {
  const [hiddenFields, setHiddenFields] = useState(new Set());

  if (cases.length < 2) return null;

  const {
    metadataRows: allMetadataRows,
  } = getComparisonRows(cases, metaFields, sections);

  if (allMetadataRows.length === 0) return null;

  const metadataRows = allMetadataRows.filter((r) => !hiddenFields.has(r.label));
  const differingMetadataCount = metadataRows.filter((r) => r.isDifferent).length;
  const sharedMetadataCount = metadataRows.filter((r) => !r.isDifferent).length;
  const hiddenCount = hiddenFields.size;

  const hideField = (label) => setHiddenFields((prev) => new Set(prev).add(label));
  const restoreAllFields = () => setHiddenFields(new Set());

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
        <div className={styles.compareAppendixEyebrow}>Overview</div>
        <div className={styles.compareAppendixTitle}>Overview Summary</div>
        <p className={styles.compareAppendixIntro}>
          {useTransposed
            ? `Cross-reference of ${cases.length} ${docTypeLabel.toLowerCase()} documents across ${metadataRows.length} metadata fields.`
            : `Overview of the selected ${docTypeLabel.toLowerCase()} documents across ${metadataRows.length} metadata fields.`}
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

      {metadataRows.length > 0 && (
        <div className={styles.compareAppendixBlock}>
          <div className={styles.compareAppendixBlockTitle}>Metadata comparison</div>

          {hiddenCount > 0 && (
            <div className={styles.overviewHiddenBar}>
              <span className={styles.overviewHiddenLabel}>
                {hiddenCount} field{hiddenCount !== 1 ? "s" : ""} hidden
              </span>
              <button className={styles.overviewRestoreBtn} onClick={restoreAllFields}>
                Restore all
              </button>
            </div>
          )}

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
                          <th key={row.id}>
                            <span className={styles.overviewColHeader}>
                              {row.label}
                              <button
                                className={styles.overviewColHideBtn}
                                onClick={() => hideField(row.label)}
                                title={`Hide "${row.label}" column`}
                              >
                                <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </button>
                            </span>
                          </th>
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
                      <th scope="row">
                        <span className={styles.overviewColHeader}>
                          {row.label}
                          <button
                            className={styles.overviewColHideBtn}
                            onClick={() => hideField(row.label)}
                            title={`Hide "${row.label}"`}
                          >
                            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </span>
                      </th>
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

      {differenceSummaries.length > 0 && useTransposed && (
        <div className={styles.compareAppendixBlock}>
          <div className={styles.compareAppendixBlockTitle}>Key differences</div>
          <div className={styles.diffSummaryGrid}>
            {differenceSummaries.map((item) => (
              <div key={item.label} className={styles.diffSummaryCard}>
                <div className={styles.diffSummaryFieldRow}>
                  <div className={styles.diffSummaryField}>{item.label}</div>
                  <button
                    className={styles.overviewColHideBtn}
                    onClick={() => hideField(item.label)}
                    title={`Hide "${item.label}"`}
                    style={{ opacity: 1 }}
                  >
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
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
    </section>
  );
}
