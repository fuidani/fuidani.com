import {
  CARD_FIELDS,
  CARD_FIELDS_FINANCIAL,
  CARD_FIELDS_CONTRACT,
  FOOTER_SECTIONS_BY_TYPE,
  FOOTER_SECTIONS_CASE,
} from "./constants";
import styles from "../ResultsPage.module.css";
import { getDocTypeKey, getResultTitle } from "../../data/documentUtils";

export default function ResultCard({
  id,
  data,
  isPreviewActive,
  onPreviewSelect,
  expandedFooter,
  onToggleFooter,
  onAddToReport,
  addedToReport,
  collectionFull,
  customFields,
  onEditCard,
}) {
  const docType = getDocTypeKey(data);
  const isCase = docType === "case-law";
  const footerSections = isCase ? null : FOOTER_SECTIONS_BY_TYPE[docType];

  const defaultFields = docType === "financial-statement"
    ? CARD_FIELDS_FINANCIAL
    : docType === "contract"
      ? CARD_FIELDS_CONTRACT
      : CARD_FIELDS;
  const fields = customFields
    ? customFields.filter((f) => f.visible).map((f) => f.name)
    : defaultFields;

  const titleText = getResultTitle(data);
  const showSubtitle = !isCase;
  const useWideGrid = !isCase;

  return (
    <div
      className={`${styles.resultCard} ${isPreviewActive ? styles.resultCardActive : ""} ${addedToReport ? styles.resultCardSelected : ""}`}
      onClick={() => onPreviewSelect?.(id)}
    >
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <h4 className={styles.cardTitle}>{titleText}</h4>
          {showSubtitle && (
            <span className={styles.cardSubtitle}>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              JibuDocs File Manager
            </span>
          )}
        </div>
        <div className={styles.cardHeaderActions}>
          <button
            type="button"
            className={`${styles.cardAddBtn} ${addedToReport ? styles.cardAddBtnActive : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              onAddToReport(id);
            }}
            disabled={!addedToReport && collectionFull}
            title={addedToReport ? "Remove from one-time export" : "Select for one-time export"}
          >
            {addedToReport ? (
              <>
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Selected
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Select for Analysis
              </>
            )}
          </button>
          <button
            type="button"
            className={styles.cardOpenBtn}
            onClick={(event) => event.stopPropagation()}
          >
            Open
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </button>
        </div>
      </div>

      <div className={useWideGrid ? styles.cardFieldsWide : styles.cardFields}>
        {fields.map((f) => {
          const val = data[f] || "—";
          const isDisposition = f === "Disposition";
          const isProfitLoss = f === "Profit Or Loss";
          const color = isDisposition
            ? val === "Dismissed" ? "#b91c1c" : val === "Allowed" ? "#047857" : undefined
            : isProfitLoss && val !== "—"
              ? parseFloat(val.replace(/,/g, "")) >= 0 ? "#047857" : "#b91c1c"
              : undefined;
          return (
            <div key={f} className={styles.cardField}>
              <span className={styles.fieldKey}>{f}</span>
              <span className={styles.fieldVal} style={color ? { color, fontWeight: 600 } : undefined}>{val}</span>
            </div>
          );
        })}
      </div>

      {isCase && (
        <div className={styles.cardKeyIssue}>
          <span className={styles.fieldKey}>Key Issue</span>
          <span className={`${styles.fieldVal} ${styles.truncateVal}`}>{data.issues || "—"}</span>
        </div>
      )}

      <div className={styles.cardFooter}>
        <div className={styles.footerFields}>
          {footerSections
            ? footerSections.map((sec) => (
                <button
                  key={sec.key}
                  className={styles.footerFieldBtn}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleFooter(id, sec.key);
                  }}
                >
                  {sec.label} {expandedFooter?.[sec.key] ? "−" : "+"}
                </button>
              ))
            : <>
                {FOOTER_SECTIONS_CASE.map((sec) => (
                  <button
                    key={sec}
                    className={styles.footerFieldBtn}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleFooter(id, sec);
                    }}
                  >
                    {sec.charAt(0).toUpperCase() + sec.slice(1)} {expandedFooter?.[sec] ? "−" : "+"}
                  </button>
                ))}
                <button
                  type="button"
                  className={styles.footerFieldBtn}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleFooter(id, "statute");
                  }}
                >
                  Cited Statute +
                </button>
              </>
          }
        </div>
        <button
          type="button"
          className={styles.editCardBtn}
          onClick={(event) => {
            event.stopPropagation();
            onEditCard(id);
          }}
        >
          Edit Card
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>

      {footerSections
        ? footerSections.map((sec) =>
            expandedFooter?.[sec.key] && data[sec.key] ? (
              <div key={sec.key} className={styles.expandedSection}>
                <h5 className={styles.expandedTitle}>{sec.label}</h5>
                <p className={styles.expandedText}>{data[sec.key]}</p>
              </div>
            ) : null
          )
        : <>
            {FOOTER_SECTIONS_CASE.map((sec) =>
              expandedFooter?.[sec] && data[sec] ? (
                <div key={sec} className={styles.expandedSection}>
                  <h5 className={styles.expandedTitle}>{sec.charAt(0).toUpperCase() + sec.slice(1)}</h5>
                  <p className={styles.expandedText}>{data[sec]}</p>
                </div>
              ) : null
            )}
            {expandedFooter?.statute && data["Cited Statute"] && (
              <div className={styles.expandedSection}>
                <h5 className={styles.expandedTitle}>Cited Statute</h5>
                <p className={styles.expandedText}>{data["Cited Statute"]}</p>
              </div>
            )}
          </>
      }
    </div>
  );
}
