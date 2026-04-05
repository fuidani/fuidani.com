import { getDocumentLabel } from "./utils";
import { SparkleIcon } from "./Icons";
import ComparisonAppendix from "./ComparisonAppendix";
import styles from "../ReportPage.module.css";

export default function DocumentPreview({
  title,
  subtitle,
  logoUrl,
  sections,
  metaFields,
  cases,
  onRemove,
  includeComparisonAppendix = false,
  docTypeLabel = "Documents",
  reportInsights = [],
  onRemoveInsight = null,
}) {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className={styles.docPage}>
      <div className={styles.docHeader}>
        {logoUrl && (
          <div className={styles.docBrand}>
            <img src={logoUrl} alt="Logo" className={styles.docBrandImg} />
          </div>
        )}
        <div className={styles.docTitle}>{title || "Untitled Report"}</div>
        {subtitle && <div className={styles.docSubtitle}>{subtitle}</div>}
        <div className={styles.docMeta}>Generated {today} · {cases.length} document{cases.length !== 1 ? "s" : ""}</div>
      </div>

      {cases.length === 0 && (
        <div className={styles.docEmpty}>
          <p>No documents selected yet.</p>
          <p>Go back to search results to add documents to your report.</p>
        </div>
      )}

      {cases.map((c, idx) => {
        const caseTitle = getDocumentLabel(c);
        return (
        <div key={c.id}>
          {onRemove && (
            <div className={styles.caseRemoveRow}>
              <button className={styles.caseBlockRemoveBtn} onClick={() => onRemove(c.id)} title="Remove from report">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Remove from report
              </button>
            </div>
          )}
          <div className={styles.caseBlock}>
            <div className={styles.caseTitle}>{caseTitle}</div>

            {metaFields.length > 0 && (
              <div className={styles.caseMetaGrid}>
                {metaFields.map((f) =>
                  c[f] !== undefined ? (
                    <div key={f} className={styles.caseMetaItem}>
                      <span className={styles.metaLabel}>{f}</span>
                      <span className={styles.metaValue}>{c[f] || "—"}</span>
                    </div>
                  ) : null
                )}
              </div>
            )}

            {sections
              .filter((s) => s.enabled && c[s.id])
              .map((s) => (
                <div key={s.id} className={styles.caseSection}>
                  <div className={styles.caseSectionTitle}>{s.label}</div>
                  <div className={styles.caseSectionBody}>{c[s.id]}</div>
                </div>
              ))}
          </div>
          {idx < cases.length - 1 && <hr className={styles.caseSeparator} />}
        </div>
        );
      })}

      {includeComparisonAppendix && (
        <ComparisonAppendix
          cases={cases}
          metaFields={metaFields}
          sections={sections}
          docTypeLabel={docTypeLabel}
        />
      )}

      {reportInsights.length > 0 && (
        <section className={styles.insightsAppendix}>
          <div className={styles.insightsAppendixHeader}>
            <div className={styles.compareAppendixEyebrow}>AI Analysis</div>
            <div className={styles.compareAppendixTitle}>
              <SparkleIcon /> Curated Insights
            </div>
          </div>
          {reportInsights.map((insight) => (
            <div key={insight.id} className={styles.insightBlock}>
              <div className={styles.insightQuestion}>
                <span className={styles.insightQuestionLabel}>Q:</span> {insight.question}
              </div>
              <div className={styles.insightAnswer}>
                {insight.answer.split("\n").map((line, i) => (
                  <p key={i} className={line.startsWith("**") ? styles.aiAnswerBold : ""}>
                    {line.replace(/\*\*/g, "")}
                  </p>
                ))}
              </div>
              {onRemoveInsight && (
                <button
                  className={styles.insightRemoveBtn}
                  onClick={() => onRemoveInsight(insight.id)}
                  title="Remove from report"
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Remove
                </button>
              )}
            </div>
          ))}
        </section>
      )}

      <div className={styles.docFooter}>
        <span>JibuDocs · AI-Enabled Document Management</span>
        <span>Confidential</span>
      </div>
    </div>
  );
}
