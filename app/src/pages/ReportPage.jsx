import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  SAMPLE_CASES,
  REPORT_SECTIONS,
  FIELD_CATEGORIES,
  REPORT_SECTIONS_BY_TYPE,
  FIELD_CATEGORIES_BY_TYPE,
  DEFAULT_META_FIELDS_BY_TYPE,
  DOC_TYPE_LABELS,
} from "../data/sampleCases";
import darkLogo from "../assets/Dark_Logo_JibuDocs_Icon.png";
import styles from "./ReportPage.module.css";

const DEFAULT_META_FIELDS = DEFAULT_META_FIELDS_BY_TYPE['case-law'];

/* ─── Icons ─────────────────────────────────────────────── */

function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
      <circle cx="9" cy="5" r="1" /><circle cx="15" cy="5" r="1" />
      <circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="19" r="1" /><circle cx="15" cy="19" r="1" />
    </svg>
  );
}

/* ─── Toggle Switch ─────────────────────────────────────── */

function ToggleSwitch({ checked, onChange }) {
  return (
    <label className={styles.toggleSwitch} onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className={styles.slider} />
    </label>
  );
}

/* ─── Document Preview ──────────────────────────────────── */

function DocumentPreview({ title, subtitle, logoUrl, sections, metaFields, cases, onRemove }) {
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
        const caseTitle = c.parties
          ? `${c.caseRef || ""}: ${c.parties}`
          : c.companyName || c.documentTitle || "Untitled";
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

      <div className={styles.docFooter}>
        <span>JibuDocs · AI-Enabled Document Management</span>
        <span>Confidential</span>
      </div>
    </div>
  );
}

/* ─── Main Report Page ──────────────────────────────────── */

export default function ReportPage() {
  const navigate = useNavigate();

  // Read selected items and document type from sessionStorage
  const selectedItems = useMemo(() => {
    try {
      const stored = sessionStorage.getItem("reportItems");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }, []);

  const docType = useMemo(() => {
    try {
      return sessionStorage.getItem("reportDocType") || "case-law";
    } catch {
      return "case-law";
    }
  }, []);

  const reportSource = useMemo(() => {
    try {
      const stored = sessionStorage.getItem("reportSource");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const docTypeLabel = DOC_TYPE_LABELS[docType] || "Documents";
  const typeSections = REPORT_SECTIONS_BY_TYPE[docType] || REPORT_SECTIONS;
  const typeFieldCategories = FIELD_CATEGORIES_BY_TYPE[docType] || FIELD_CATEGORIES;
  const typeDefaultMetaFields = DEFAULT_META_FIELDS_BY_TYPE[docType] || DEFAULT_META_FIELDS;
  const sourceType = reportSource?.type === "selection" ? "selection" : "search";
  const isSelectionSource = sourceType === "selection";

  const selectedIds = Object.keys(selectedItems);
  const caseEntries = useMemo(
    () => selectedIds.filter((id) => SAMPLE_CASES[id]).map((id) => ({ id, ...SAMPLE_CASES[id] })),
    [selectedIds]
  );

  // Report config state
  const [reportStep, setReportStep] = useState(1);
  const [sections, setSections] = useState(() => typeSections.map((s) => ({ ...s })));
  const [selectedMetaFields, setSelectedMetaFields] = useState([...typeDefaultMetaFields]);
  const [reportTitle, setReportTitle] = useState(docType === "case-law" ? "TAT Summaries" : `${docTypeLabel} Report`);
  const [reportSubtitle, setReportSubtitle] = useState(docType === "case-law" ? "January 2026 Edition" : "");
  const [logoUrl, setLogoUrl] = useState(darkLogo);
  const fileInputRef = useRef(null);

  // Document curation (one-off only)
  const MAX_REPORT_DOCS = 10;
  const [includedCaseIds, setIncludedCaseIds] = useState(() =>
    new Set(caseEntries.slice(0, MAX_REPORT_DOCS).map((c) => c.id))
  );
  const sourceContextLabel = isSelectionSource ? "Manual selection" : "Search-based report";
  const sourceLabel = isSelectionSource
    ? `${caseEntries.length} selected document${caseEntries.length !== 1 ? "s" : ""}`
    : reportSource?.query
      ? `Search: "${reportSource.query}"`
      : "Current search";
  const headerCountLabel = isSelectionSource
    ? `${caseEntries.length} selected document${caseEntries.length !== 1 ? "s" : ""}`
    : `${caseEntries.length} matching document${caseEntries.length !== 1 ? "s" : ""}`;
  const canSubscribe = !isSelectionSource;

  const includedCases = useMemo(
    () => caseEntries.filter((c) => includedCaseIds.has(c.id)),
    [caseEntries, includedCaseIds]
  );

  const availableToAdd = useMemo(
    () => caseEntries.filter((c) => !includedCaseIds.has(c.id)),
    [caseEntries, includedCaseIds]
  );

  const removeCase = (id) => {
    setIncludedCaseIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const addCase = (id) => {
    setIncludedCaseIds((prev) => {
      if (prev.size >= MAX_REPORT_DOCS) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  // Delivery state
  const [deliveryMode, setDeliveryMode] = useState("one-off"); // "one-off" | "subscription"
  const [subscriptionFrequency, setSubscriptionFrequency] = useState("weekly"); // "weekly" | "monthly"
  const [deliveryMethod, setDeliveryMethod] = useState("folder"); // "folder" | "email"

  const selectDeliveryMode = (mode) => {
    if (mode === "subscription" && !canSubscribe) return;
    setDeliveryMode(mode);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
    }
  };

  const handleResetLogo = () => {
    setLogoUrl(darkLogo);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleSection = (id) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const toggleMetaField = (field) => {
    setSelectedMetaFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const moveSection = (idx, dir) => {
    const next = [...sections];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setSections(next);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to Results
        </button>
        <div className={styles.headerTitle}>
          <div className={styles.headerTitleIcon}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          Report Builder
        </div>
        <span className={styles.headerCount}>{headerCountLabel}</span>
      </div>
      <div className={styles.sourceBar}>
        <div className={styles.sourceBarLabel}>Report Source</div>
        <div className={styles.sourceBarMain}>
          <span className={styles.sourceBarTitle}>{sourceLabel}</span>
          <span className={styles.sourceBarDot}>•</span>
          <span className={styles.sourceBarMeta}>{sourceContextLabel}</span>
          <span className={styles.sourceBarDot}>•</span>
          <span className={styles.sourceBarMeta}>{docTypeLabel}</span>
        </div>
        <span className={`${styles.sourceBadge} ${isSelectionSource ? styles.sourceBadgeSelection : styles.sourceBadgeSearch}`}>
          {isSelectionSource ? "One-time only" : "Subscription-ready"}
        </span>
      </div>

      {/* ── Stepper ── */}
      <div className={styles.stepper}>
        <div
          className={`${styles.roStep} ${reportStep === 1 ? styles.roStepActive : ""} ${reportStep > 1 ? styles.roStepCompleted : ""}`}
          onClick={() => setReportStep(1)}
        >
          <span className={styles.roStepNum}>
            {reportStep > 1 ? "✓" : "1"}
          </span>
          <span className={styles.roStepLabel}>Design Report</span>
        </div>
        <div className={`${styles.roStepConnector} ${reportStep > 1 ? styles.roStepConnectorDone : ""}`} />
        <div
          className={`${styles.roStep} ${reportStep === 2 ? styles.roStepActive : ""}`}
          onClick={() => setReportStep(2)}
        >
          <span className={styles.roStepNum}>2</span>
          <span className={styles.roStepLabel}>Save &amp; Export</span>
        </div>
        <div className={styles.stepperActions}>
          <button
            className={styles.btnSecondary}
            onClick={() => setReportStep(reportStep - 1)}
            disabled={reportStep === 1}
          >
            &larr; Back
          </button>
          <button
            className={styles.btnPrimary}
            onClick={() => {
              if (reportStep === 1) {
                setReportStep(2);
              } else {
                handleBack();
              }
            }}
          >
            {reportStep === 1 ? "Save & Export →" : "Done"}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className={styles.body}>
        {reportStep === 1 ? (
          <div className={styles.configLayout}>
            {/* Left: Config */}
            <div className={styles.configLeft}>
              <div className={styles.configScroll}>
                {/* Report Details */}
                <div className={`${styles.configSection} ${styles.reportDetailsSection}`}>
                  <div className={styles.configSectionTitle}>
                    <span className={styles.csNum}>A</span> Report Details
                  </div>
                  <div className={styles.formGroup}>
                    <label>Report Title</label>
                    <input type="text" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Subtitle / Edition</label>
                    <input type="text" value={reportSubtitle} onChange={(e) => setReportSubtitle(e.target.value)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Report Logo</label>
                    <div className={styles.logoControl}>
                      <div className={styles.logoPreview}>
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className={styles.logoPreviewImg} />
                        ) : (
                          <span className={styles.logoPlaceholder}>No logo</span>
                        )}
                      </div>
                      <div className={styles.logoActions}>
                        <button className={styles.logoUploadBtn} onClick={() => fileInputRef.current?.click()}>
                          Upload custom logo
                        </button>
                        {logoUrl !== darkLogo && logoUrl && (
                          <button className={styles.logoResetBtn} onClick={handleResetLogo}>
                            Reset to default
                          </button>
                        )}
                        {logoUrl && (
                          <button className={styles.logoResetBtn} onClick={handleRemoveLogo}>
                            Remove logo
                          </button>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleLogoUpload}
                      />
                    </div>
                  </div>
                </div>

                {/* Report Sections */}
                <div className={`${styles.configSection} ${styles.reportSectionsSection}`}>
                  <div className={styles.configSectionTitle}>
                    <span className={styles.csNum}>C</span> Report Sections
                  </div>
                  <p className={styles.configHint}>Toggle sections ON/OFF. Use arrows to reorder.</p>
                  <div className={styles.sectionList}>
                    {sections.map((sec, idx) => (
                      <div key={sec.id} className={styles.sectionToggleItem}>
                        <span className={styles.dragHandle}>☰</span>
                        <span className={styles.toggleLabel}>{sec.label}</span>
                        <ToggleSwitch
                          checked={sec.enabled}
                          onChange={() => toggleSection(sec.id)}
                        />
                        <div className={styles.sectionMoveButtons}>
                          <button onClick={() => moveSection(idx, -1)} disabled={idx === 0}>▲</button>
                          <button onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1}>▼</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metadata Fields */}
                <div className={`${styles.configSection} ${styles.metadataFieldsSection}`}>
                  <div className={styles.configSectionTitle}>
                    <span className={styles.csNum}>B</span> Metadata Fields
                  </div>
                  <p className={styles.configHint}>Choose which fields appear on each case.</p>
                  {Object.entries(typeFieldCategories).map(([cat, fields]) => (
                    <div key={cat}>
                      <div className={styles.fieldCategory}>{cat}</div>
                      <div className={styles.fieldPillList}>
                        {fields.map((f) => (
                          <span
                            key={f}
                            className={`${styles.fieldPill} ${selectedMetaFields.includes(f) ? styles.fieldPillSelected : ""}`}
                            onClick={() => toggleMetaField(f)}
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Documents */}
                {isSelectionSource && <div className={`${styles.configSection} ${styles.selectedDocumentsSection}`}>
                  <div className={styles.configSectionTitle}>
                    <span className={styles.csNum}>D</span> Selected Documents ({includedCases.length}/{MAX_REPORT_DOCS})
                  </div>
                  <p className={styles.configHint}>
                    Use the Remove button on the preview to exclude documents from this one-time export.
                  </p>
                  {/* Re-add removed documents */}
                  {availableToAdd.length > 0 && (
                    <>
                      <div className={styles.caseListHeader}>Removed — click to re-add</div>
                      <div className={styles.caseCheckList}>
                        {availableToAdd.map((c) => {
                          const label = c.parties
                            ? `${c.caseRef || ""}: ${c.parties}`
                            : c.companyName || c.documentTitle || "Untitled";
                          return (
                            <div key={c.id} className={`${styles.caseCheckItem} ${styles.caseCheckItemAvailable}`}>
                              <span className={styles.caseCheckLabel}>{label}</span>
                              <button className={styles.caseAddBtn} onClick={() => addCase(c.id)} title="Add back to report">
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>}
              </div>
            </div>

            {/* Right: Live preview with remove buttons */}
            <div className={styles.configRight}>
              <div className={styles.previewCanvas}>
                <div className={styles.previewSourceBar}>
                  <div className={styles.previewSourceTop}>
                    <div className={styles.sourceBarLabel}>Report Source</div>
                    <span className={`${styles.sourceBadge} ${isSelectionSource ? styles.sourceBadgeSelection : styles.sourceBadgeSearch}`}>
                      {isSelectionSource ? "One-time only" : "Subscription-ready"}
                    </span>
                  </div>
                  <div className={styles.sourceBarMain}>
                    <span className={styles.sourceBarTitle}>{sourceLabel}</span>
                    <span className={styles.sourceBarDot}>•</span>
                    <span className={styles.sourceBarMeta}>{sourceContextLabel}</span>
                    <span className={styles.sourceBarDot}>•</span>
                    <span className={styles.sourceBarMeta}>{docTypeLabel}</span>
                  </div>
                </div>
                <DocumentPreview
                  title={reportTitle}
                  subtitle={reportSubtitle}
                  logoUrl={logoUrl}
                  sections={sections}
                  metaFields={selectedMetaFields}
                  cases={includedCases}
                  onRemove={isSelectionSource ? removeCase : null}
                />
              </div>
            </div>
          </div>
        ) : (
          /* ── Step 2: Save & Export ── */
          <div className={styles.deliveryLayout}>
            <div className={styles.deliveryPanel}>
              {/* Report type choice */}
              <div className={styles.deliveryCard}>
                <div className={styles.deliveryCardTitle}>Report Type</div>
                <p className={styles.deliveryCardHint}>
                  {canSubscribe
                    ? "Choose whether to export this report once or turn the search into a recurring subscription."
                    : "Selected-document reports are one-time only. Subscriptions require a saved search."}
                </p>
                <div className={styles.deliveryOptions}>
                  <label className={`${styles.deliveryOption} ${deliveryMode === "one-off" ? styles.deliveryOptionSelected : ""}`}>
                    <input type="radio" name="deliveryMode" value="one-off" checked={deliveryMode === "one-off"} onChange={() => selectDeliveryMode("one-off")} className={styles.deliveryRadio} />
                    <div className={styles.deliveryOptionContent}>
                      <div className={styles.deliveryOptionIcon}>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </div>
                      <div>
                        <div className={styles.deliveryOptionLabel}>One-off Report</div>
                        <div className={styles.deliveryOptionDesc}>
                          {isSelectionSource
                            ? `Download the ${includedCases.length} document${includedCases.length !== 1 ? "s" : ""} you selected`
                            : `Download a snapshot of this search with ${includedCases.length} document${includedCases.length !== 1 ? "s" : ""}`}
                        </div>
                      </div>
                    </div>
                  </label>
                  <label className={`${styles.deliveryOption} ${deliveryMode === "subscription" ? styles.deliveryOptionSelected : ""} ${!canSubscribe ? styles.deliveryOptionDisabled : ""}`}>
                    <input type="radio" name="deliveryMode" value="subscription" checked={deliveryMode === "subscription"} onChange={() => selectDeliveryMode("subscription")} className={styles.deliveryRadio} disabled={!canSubscribe} />
                    <div className={styles.deliveryOptionContent}>
                      <div className={styles.deliveryOptionIcon}>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      </div>
                      <div>
                        <div className={styles.deliveryOptionLabel}>Subscription</div>
                        <div className={styles.deliveryOptionDesc}>
                          {canSubscribe
                            ? "Automatically rerun this search and receive updated reports on a schedule"
                            : "Unavailable for hand-picked document sets"}
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
                {!canSubscribe && (
                  <div className={styles.deliveryConstraint}>
                    Subscriptions require a search definition. This report was built from selected documents, so it can only be exported once.
                  </div>
                )}
              </div>

              {/* Subscription: frequency */}
              {canSubscribe && deliveryMode === "subscription" && (
                <div className={styles.deliveryCard}>
                  <div className={styles.deliveryCardTitle}>Update Frequency</div>
                  <p className={styles.deliveryCardHint}>How often should JibuDocs regenerate this report with new documents?</p>
                  <div className={styles.frequencyOptions}>
                    <button className={`${styles.frequencyBtn} ${subscriptionFrequency === "weekly" ? styles.frequencyBtnSelected : ""}`} onClick={() => setSubscriptionFrequency("weekly")}>
                      <span className={styles.frequencyLabel}>Weekly</span>
                      <span className={styles.frequencyDesc}>Every Monday</span>
                    </button>
                    <button className={`${styles.frequencyBtn} ${subscriptionFrequency === "monthly" ? styles.frequencyBtnSelected : ""}`} onClick={() => setSubscriptionFrequency("monthly")}>
                      <span className={styles.frequencyLabel}>Monthly</span>
                      <span className={styles.frequencyDesc}>1st of each month</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Subscription: auto-selection note */}
              {canSubscribe && deliveryMode === "subscription" && (
                <div className={styles.deliveryCard}>
                  <div className={styles.autoSelectNote}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <div>
                      <div className={styles.autoSelectTitle}>Up to {MAX_REPORT_DOCS} most recent documents matching your search will be included automatically in each report.</div>
                      <div className={styles.autoSelectDesc}>Documents are selected based on your current search filters each time the report is generated.</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery method */}
              <div className={styles.deliveryCard}>
                <div className={styles.deliveryCardTitle}>Delivery Method</div>
                <p className={styles.deliveryCardHint}>Choose how you receive the report.</p>
                <div className={styles.deliveryOptions}>
                  <label className={`${styles.deliveryOption} ${deliveryMethod === "folder" ? styles.deliveryOptionSelected : ""}`}>
                    <input type="radio" name="deliveryMethod" value="folder" checked={deliveryMethod === "folder"} onChange={() => setDeliveryMethod("folder")} className={styles.deliveryRadio} />
                    <div className={styles.deliveryOptionContent}>
                      <div className={styles.deliveryOptionIcon}>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                      </div>
                      <div>
                        <div className={styles.deliveryOptionLabel}>Save to JibuDocs</div>
                        <div className={styles.deliveryOptionDesc}>Save directly to your JibuDocs folder</div>
                      </div>
                    </div>
                  </label>
                  <label className={`${styles.deliveryOption} ${deliveryMethod === "email" ? styles.deliveryOptionSelected : ""}`}>
                    <input type="radio" name="deliveryMethod" value="email" checked={deliveryMethod === "email"} onChange={() => setDeliveryMethod("email")} className={styles.deliveryRadio} />
                    <div className={styles.deliveryOptionContent}>
                      <div className={styles.deliveryOptionIcon}>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      </div>
                      <div>
                        <div className={styles.deliveryOptionLabel}>Email</div>
                        <div className={styles.deliveryOptionDesc}>Send to your registered JibuDocs email address</div>
                      </div>
                    </div>
                  </label>
                </div>
                {deliveryMethod === "email" && (
                  <div className={styles.emailNote}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    The report will be sent to the email address associated with your JibuDocs account.
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className={styles.deliveryActions}>
                {deliveryMode === "one-off" && (
                  <div className={styles.exportList}>
                    <button className={styles.exportBtn} onClick={handlePrint}>
                      <div className={styles.exportIcon} style={{ background: "#fee2e2", color: "#b91c1c" }}>PDF</div>
                      <div>
                        <div className={styles.exportLabel}>Export as PDF</div>
                        <div className={styles.exportDesc}>Print to PDF via browser</div>
                      </div>
                    </button>
                    <button className={styles.exportBtn} onClick={() => alert("In production, this generates a .docx via the JibuDocs API.")}>
                      <div className={styles.exportIcon} style={{ background: "#dbeafe", color: "#1e40af" }}>DOC</div>
                      <div>
                        <div className={styles.exportLabel}>Export as DOCX</div>
                        <div className={styles.exportDesc}>Download Word document</div>
                      </div>
                    </button>
                  </div>
                )}
                {canSubscribe && deliveryMode === "subscription" && (
                  <button
                    className={styles.subscribeBtn}
                    onClick={() => alert("In production, this creates a subscription via the JibuDocs API.")}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Subscribe — {subscriptionFrequency === "weekly" ? "Weekly" : "Monthly"}
                  </button>
                )}
              </div>
            </div>
            <div className={styles.printDocumentWrapper} aria-hidden="true">
              <DocumentPreview
                title={reportTitle}
                subtitle={reportSubtitle}
                logoUrl={logoUrl}
                sections={sections}
                metaFields={selectedMetaFields}
                cases={includedCases}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
