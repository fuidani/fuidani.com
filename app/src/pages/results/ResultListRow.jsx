import {
  LIST_FIELDS,
  LIST_FIELDS_FINANCIAL,
  LIST_FIELDS_CONTRACT,
} from "./constants";
import styles from "../ResultsPage.module.css";

const DEFAULT_FIELDS_BY_TYPE = {
  "case-law": LIST_FIELDS,
  "financial-statement": LIST_FIELDS_FINANCIAL,
  contract: LIST_FIELDS_CONTRACT,
};

function getDocTypeKey(data) {
  return data.documentType || "case-law";
}

function getVisibleFields(docType, customFields) {
  if (customFields) {
    return customFields.filter((field) => field.visible).map((field) => field.name);
  }

  return DEFAULT_FIELDS_BY_TYPE[docType] || LIST_FIELDS;
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

function getSublineText(data, docType) {
  if (docType === "case-law") {
    return data["Court"] || data["Court Level"] || "Tax Appeals Tribunal";
  }

  if (docType === "contract") {
    return data["Governing Law"] || "JibuDocs File Manager";
  }

  return data.companyName || data["Industry"] || "JibuDocs File Manager";
}

function getValueStyle(field, value) {
  if (field === "Disposition") {
    if (value === "Dismissed") return { color: "#b91c1c", fontWeight: 600 };
    if (value === "Allowed") return { color: "#047857", fontWeight: 600 };
  }

  if (field === "Profit Or Loss" && value && value !== "—") {
    return parseFloat(String(value).replace(/,/g, "")) >= 0
      ? { color: "#047857", fontWeight: 600 }
      : { color: "#b91c1c", fontWeight: 600 };
  }

  return undefined;
}

export default function ResultListRow({
  id,
  data,
  isPreviewActive,
  onPreviewSelect,
  onAddToReport,
  addedToReport,
  collectionFull,
  customFields,
  onEditCard,
  showEditButton = true,
}) {
  const docType = getDocTypeKey(data);
  const hasCustomFields = customFields !== undefined;
  const visibleFields = getVisibleFields(docType, customFields);
  const defaultFields = getVisibleFields(docType, null);
  const metaFields = (hasCustomFields ? visibleFields : defaultFields).filter((field) => data[field]);
  const titleText = getTitleText(data, docType);
  const typeLabel = getTypeLabel(docType);
  const sublineText = getSublineText(data, docType);

  return (
    <div
      className={`${styles.resultListRow} ${isPreviewActive ? styles.resultListRowActive : ""} ${addedToReport ? styles.resultListRowSelected : ""}`}
      onClick={() => onPreviewSelect?.(id)}
    >
      <div className={styles.resultListTop}>
        <div className={styles.resultListHeading}>
          <h4 className={styles.resultListTitle}>{titleText}</h4>
          <div className={styles.resultListSubline}>
            <span className={styles.resultListTypeBadge}>{typeLabel}</span>
            <span className={styles.resultListSource}>{sublineText}</span>
          </div>
        </div>

        <div className={styles.resultListActions}>
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
                Select
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
          {showEditButton && (
            <button
              type="button"
              className={styles.editCardBtn}
              onClick={(event) => {
                event.stopPropagation();
                onEditCard?.(id);
              }}
            >
              Edit Card
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          )}
        </div>
      </div>

      {metaFields.length > 0 && (
        <div className={styles.resultListMetaGrid}>
          {metaFields.map((field) => (
            <div key={field} className={styles.resultListMetaItem}>
              <span className={styles.fieldKey}>{field}</span>
              <span className={styles.resultListMetaValue} style={getValueStyle(field, data[field])}>
                {data[field]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
