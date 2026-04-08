import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  REPORT_SECTIONS,
  FIELD_CATEGORIES,
  REPORT_SECTIONS_BY_TYPE,
  FIELD_CATEGORIES_BY_TYPE,
  DEFAULT_META_FIELDS_BY_TYPE,
  DOC_TYPE_LABELS,
} from "../data/sampleCases";
import useLocalCaseDatabase from "../hooks/useLocalCaseDatabase";
import { getDocumentLabel } from "../data/documentUtils";
import darkLogo from "../assets/Dark_Logo_JibuDocs_Icon.png";
import styles from "./ReportPage.module.css";
import ToggleSwitch from "../components/ToggleSwitch";
import DocumentPreview from "./report/DocumentPreview";
import ReportAIChat from "./report/ReportAIChat";

const DEFAULT_META_FIELDS = DEFAULT_META_FIELDS_BY_TYPE['case-law'];

const hasRenderableMetaField = (doc, field) =>
  Object.prototype.hasOwnProperty.call(doc, field) && doc[field] !== undefined;

const getAvailableMetaFieldSet = (categories, docs) => {
  const available = new Set();

  for (const fields of Object.values(categories)) {
    for (const field of fields) {
      if (docs.some((doc) => hasRenderableMetaField(doc, field))) {
        available.add(field);
      }
    }
  }

  return available;
};

/* ─── Main Report Page ──────────────────────────────────── */

export default function ReportPage() {
  const navigate = useNavigate();
  const { casesById } = useLocalCaseDatabase();

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
    () => selectedIds.map((id) => casesById[id]).filter(Boolean),
    [casesById, selectedIds]
  );

  // Report config state
  const [reportStep, setReportStep] = useState(1);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);
  const [includeComparisonAppendix, setIncludeComparisonAppendix] = useState(true);
  const [reportInsights, setReportInsights] = useState([]);
  const addInsightToReport = (insight) => {
    setReportInsights((prev) => [...prev, { ...insight, id: Date.now() }]);
  };
  const removeInsightFromReport = (id) => {
    setReportInsights((prev) => prev.filter((i) => i.id !== id));
  };
  const [sections, setSections] = useState(() => typeSections.map((s) => ({ ...s })));
  const [selectedMetaFields, setSelectedMetaFields] = useState(() => typeDefaultMetaFields);
  const [reportTitle, setReportTitle] = useState(docType === "case-law" ? "JibuDocs Case Summaries" : `${docTypeLabel} Report`);
  const [reportSubtitle, setReportSubtitle] = useState(docType === "case-law" ? "Local CSV demo dataset" : "");
  const [logoUrl, setLogoUrl] = useState(darkLogo);
  const fileInputRef = useRef(null);

  // Accordion state — which config section is expanded (null = all collapsed)
  const [openAccordion, setOpenAccordion] = useState("details");
  const toggleAccordion = (key) =>
    setOpenAccordion((prev) => (prev === key ? null : key));

  // Document curation (one-off only)
  const MAX_REPORT_DOCS = 10;
  const [includedCaseIds, setIncludedCaseIds] = useState(() =>
    new Set(selectedIds.slice(0, MAX_REPORT_DOCS))
  );
  const sourceLabel = isSelectionSource
    ? `${caseEntries.length} hand-picked document${caseEntries.length !== 1 ? "s" : ""}`
    : reportSource?.query
      ? `Search: "${reportSource.query}"`
      : "Current search";
  const legacyHeaderCountLabel = isSelectionSource
    ? `${caseEntries.length} selected document${caseEntries.length !== 1 ? "s" : ""}`
    : `Subscription · ${caseEntries.length} document${caseEntries.length !== 1 ? "s" : ""}`;
  const canSubscribe = !isSelectionSource;

  const includedCases = useMemo(
    () => caseEntries.filter((c) => includedCaseIds.has(c.id)),
    [caseEntries, includedCaseIds]
  );
  const metadataSourceCases = includedCases.length > 0 ? includedCases : caseEntries;
  const availableMetaFieldSet = useMemo(
    () => getAvailableMetaFieldSet(typeFieldCategories, metadataSourceCases),
    [metadataSourceCases, typeFieldCategories]
  );
  const visibleFieldCategories = useMemo(
    () =>
      Object.entries(typeFieldCategories)
        .map(([category, fields]) => [category, fields.filter((field) => availableMetaFieldSet.has(field))])
        .filter(([, fields]) => fields.length > 0),
    [availableMetaFieldSet, typeFieldCategories]
  );
  const activeSelectedMetaFields = useMemo(
    () => selectedMetaFields.filter((field) => availableMetaFieldSet.has(field)),
    [availableMetaFieldSet, selectedMetaFields]
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
  const [schedule, setSchedule] = useState(isSelectionSource ? "one-off" : "weekly");
  const deliveryMode = schedule === "one-off" ? "one-off" : "subscription";
  const subscriptionFrequency = schedule === "monthly" ? "monthly" : "weekly";
  const [deliveryMethod, setDeliveryMethod] = useState("folder");
  const canCompare = includedCases.length >= 2;
  const isSubscriptionDelivery = canSubscribe && deliveryMode === "subscription";
  const canCompareInCurrentMode = canCompare && !isSubscriptionDelivery;
  const shouldIncludeComparisonAppendix = includeComparisonAppendix && canCompareInCurrentMode;
  const [aiChatOpen, setAiChatOpen] = useState(true);

  // AI chat panel resize
  const AI_CHAT_DEFAULT = 340;
  const AI_CHAT_MIN = 280;
  const AI_CHAT_MAX = 600;
  const [aiChatWidth, setAiChatWidth] = useState(AI_CHAT_DEFAULT);
  const [isAiResizing, setIsAiResizing] = useState(false);
  const aiResizeRef = useRef({ active: false, startX: 0, startWidth: 0 });
  const configLayoutRef = useRef(null);

  const clampAiWidth = useCallback(
    (w) => Math.max(AI_CHAT_MIN, Math.min(AI_CHAT_MAX, w)),
    []
  );

  const handleAiResizeStart = useCallback((e) => {
    e.preventDefault();
    aiResizeRef.current = { active: true, startX: e.clientX, startWidth: aiChatWidth };
    setIsAiResizing(true);
  }, [aiChatWidth]);

  const handleAiResizeKeyDown = useCallback((e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); setAiChatWidth((w) => clampAiWidth(w + 24)); }
    if (e.key === "ArrowRight") { e.preventDefault(); setAiChatWidth((w) => clampAiWidth(w - 24)); }
    if (e.key === "Home") { e.preventDefault(); setAiChatWidth(AI_CHAT_MIN); }
    if (e.key === "End") { e.preventDefault(); setAiChatWidth(AI_CHAT_MAX); }
  }, [clampAiWidth]);

  const handleAiResizeReset = useCallback(() => {
    setAiChatWidth(AI_CHAT_DEFAULT);
  }, []);

  useEffect(() => {
    if (!isAiResizing) return undefined;
    const onMove = (e) => {
      if (!aiResizeRef.current.active) return;
      const delta = aiResizeRef.current.startX - e.clientX;
      setAiChatWidth(clampAiWidth(aiResizeRef.current.startWidth + delta));
    };
    const onUp = () => {
      aiResizeRef.current.active = false;
      setIsAiResizing(false);
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [isAiResizing, clampAiWidth]);

  const sourceContextLabel = isSelectionSource
    ? "One-time export"
    : isSubscriptionDelivery
      ? "Recurring subscription"
      : "One-off snapshot";
  const sourceEyebrow = isSelectionSource
    ? "One-Time Export"
    : isSubscriptionDelivery
      ? "Search Subscription"
      : "Search Snapshot";
  const sourceBadgeLabel = isSelectionSource
    ? "One-time"
    : isSubscriptionDelivery
      ? "Recurring"
      : "One-off";
  const currentHeaderCountLabel = isSelectionSource
    ? legacyHeaderCountLabel
    : `${isSubscriptionDelivery ? "Subscription" : "Snapshot"} | ${caseEntries.length} document${caseEntries.length !== 1 ? "s" : ""}`;
  const sourceNote = isSubscriptionDelivery
    ? `This report will automatically include up to ${MAX_REPORT_DOCS} of the most recent documents matching your search filters each time it is generated.`
    : "This one-off snapshot uses the current search sample shown in the preview.";
  const sourceCompareHintTitle = isSubscriptionDelivery ? "Overview unavailable" : "Overview available";
  const sourceCompareHintText = isSubscriptionDelivery
    ? "Switch delivery mode to One-off Snapshot in Save & Export if you want an overview summary of the current documents."
    : `The report preview includes an overview summary of the ${includedCases.length} included documents.`;
  const overviewHelperText = !canCompare
    ? "Select at least 2 documents to enable the overview summary."
    : isSubscriptionDelivery
      ? "Overview summary is available only for one-off snapshots. Switch delivery mode in Save & Export to include it."
      : "The overview summary cross-references the metadata fields and narrative sections you enabled across all included documents.";
  const overviewEmptyText = !canCompare
    ? "Overview summary becomes available once two documents are included."
    : "Overview summary is turned off while this report is set to Subscription.";
  const searchPreviewTitle = isSubscriptionDelivery ? "Subscription Preview" : "Snapshot Preview";
  const searchPreviewDescription = isSubscriptionDelivery
    ? `Showing a sample of current results. Each report cycle will auto-select up to ${MAX_REPORT_DOCS} most recent matching documents.`
    : "Showing the current search sample for this one-off snapshot.";


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
        <span className={styles.headerCount}>{currentHeaderCountLabel}</span>
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
          <span className={styles.roStepLabel}>{isSelectionSource ? "Save & Export" : "Set Up Schedule"}</span>
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
            {reportStep === 1
              ? (isSelectionSource ? "Save & Export →" : "Set Up Schedule →")
              : "Done"}
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
                {/* Source Card */}
                <div className={`${styles.configSection} ${styles.sourceSection}`}>
                  <div className={styles.sourceCard}>
                    <div className={styles.sourceCardTop}>
                      <div>
                        <div className={styles.sourceEyebrow}>
                          {sourceEyebrow}
                        </div>
                        <div className={styles.sourceTitle}>{sourceLabel}</div>
                      </div>
                      <span className={`${styles.sourceBadge} ${isSelectionSource ? styles.sourceBadgeSelection : styles.sourceBadgeSearch}`}>
                        {sourceBadgeLabel}
                      </span>
                    </div>
                    <div className={styles.sourceMetaRow}>
                      <span>{docTypeLabel}</span>
                      <span>{sourceContextLabel}</span>
                    </div>
                    {!isSelectionSource && (
                      <p className={styles.sourceNote}>
                        {sourceNote}
                      </p>
                    )}
                    {canCompare && (
                      <div className={styles.sourceCompareHint}>
                        <div className={styles.sourceCompareHintTitle}>{sourceCompareHintTitle}</div>
                        <div className={styles.sourceCompareHintText}>
                          {sourceCompareHintText}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Report Details */}
                <div className={`${styles.configSection} ${styles.reportDetailsSection}`}>
                  <button className={styles.accordionHeader} onClick={() => toggleAccordion("details")}>
                    <span className={styles.csNum}>A</span> Report Details
                    <svg className={`${styles.accordionChevron} ${openAccordion === "details" ? styles.accordionChevronOpen : ""}`} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  <div className={`${styles.accordionBody} ${openAccordion === "details" ? styles.accordionBodyOpen : ""}`}>
                    <div className={styles.accordionInner}>
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
                  </div>
                </div>

                {/* Report Sections */}
                <div className={`${styles.configSection} ${styles.reportSectionsSection}`}>
                  <button className={styles.accordionHeader} onClick={() => toggleAccordion("sections")}>
                    <span className={styles.csNum}>D</span> Report Sections
                    <svg className={`${styles.accordionChevron} ${openAccordion === "sections" ? styles.accordionChevronOpen : ""}`} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  <div className={`${styles.accordionBody} ${openAccordion === "sections" ? styles.accordionBodyOpen : ""}`}>
                    <div className={styles.accordionInner}>
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
                  </div>
                </div>

                {/* Metadata Fields */}
                <div className={`${styles.configSection} ${styles.metadataFieldsSection}`}>
                  <button className={styles.accordionHeader} onClick={() => toggleAccordion("metadata")}>
                    <span className={styles.csNum}>C</span> Metadata Fields
                    <svg className={`${styles.accordionChevron} ${openAccordion === "metadata" ? styles.accordionChevronOpen : ""}`} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  <div className={`${styles.accordionBody} ${openAccordion === "metadata" ? styles.accordionBodyOpen : ""}`}>
                    <div className={styles.accordionInner}>
                      <p className={styles.configHint}>Choose which fields appear on each case.</p>
                      {visibleFieldCategories.length > 0 ? (
                        <div className={styles.fieldPillList}>
                          {visibleFieldCategories.flatMap(([, fields]) => fields).map((f) => {
                            const selected = activeSelectedMetaFields.includes(f);
                            return (
                              <button
                                type="button"
                                key={f}
                                className={`${styles.fieldPill} ${selected ? styles.fieldPillSelected : ""}`}
                                aria-pressed={selected}
                                onClick={() => toggleMetaField(f)}
                              >
                                {f}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className={styles.fieldEmptyState}>
                          No metadata fields are available for the currently selected documents.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`${styles.configSection} ${styles.comparisonAppendixSection}`}>
                  <button className={styles.accordionHeader} onClick={() => toggleAccordion("compare")}>
                    <span className={styles.csNum}>B</span> Overview Summary
                    <svg className={`${styles.accordionChevron} ${openAccordion === "compare" ? styles.accordionChevronOpen : ""}`} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  <div className={`${styles.accordionBody} ${openAccordion === "compare" ? styles.accordionBodyOpen : ""}`}>
                    <div className={styles.accordionInner}>
                      <p className={styles.configHint}>
                        Include an overview summary in the exported report that cross-references metadata across all included documents.
                      </p>
                      <div className={`${styles.compareConfigCard} ${!canCompareInCurrentMode ? styles.compareConfigCardDisabled : ""}`}>
                        <div className={styles.compareConfigTop}>
                          <div>
                            <div className={styles.compareConfigTitle}>Include overview in export</div>
                            <div className={styles.compareConfigText}>
                              {overviewHelperText}
                            </div>
                          </div>
                          <ToggleSwitch
                            checked={shouldIncludeComparisonAppendix}
                            onChange={() => setIncludeComparisonAppendix((prev) => !prev)}
                            disabled={!canCompareInCurrentMode}
                          />
                        </div>
                        {canCompareInCurrentMode ? (
                          <div className={styles.compareConfigFooter}>
                            <span
                              className={`${styles.compareConfigBadge} ${
                                shouldIncludeComparisonAppendix
                                  ? styles.compareConfigBadgeActive
                                  : styles.compareConfigBadgeInactive
                              }`}
                            >
                              {shouldIncludeComparisonAppendix ? "Will be exported" : "Not in export"}
                            </span>
                          </div>
                        ) : (
                          <div className={styles.compareConfigEmpty}>
                            {overviewEmptyText}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`${styles.configSection} ${styles.aiAnalysisSection}`}>
                  <button className={styles.accordionHeader} onClick={() => toggleAccordion("ai")}>
                    <span className={styles.csNum}>E</span> AI Analysis
                    <svg className={`${styles.accordionChevron} ${openAccordion === "ai" ? styles.accordionChevronOpen : ""}`} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  <div className={`${styles.accordionBody} ${openAccordion === "ai" ? styles.accordionBodyOpen : ""}`}>
                    <div className={styles.accordionInner}>
                      <p className={styles.configHint}>
                        Ask questions about the included documents, compare their content, and add AI-generated insights to your report.
                      </p>
                      <div className={styles.aiAnalysisCard}>
                        <div className={styles.aiAnalysisCardIcon}>
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" /></svg>
                        </div>
                        <div>
                          <div className={styles.aiAnalysisCardTitle}>
                            {aiChatOpen ? "Chat panel is open" : "Chat with your documents"}
                          </div>
                          <div className={styles.aiAnalysisCardDesc}>
                            {includedCases.length < 1
                              ? "Include at least one document to start chatting."
                              : aiChatOpen
                                ? "The AI chat panel is visible on the right. Ask questions about your documents."
                                : `Explore and analyse ${includedCases.length} document${includedCases.length !== 1 ? "s" : ""} with AI assistance.`}
                          </div>
                        </div>
                      </div>
                      <button
                        className={styles.aiAnalysisToggleBtn}
                        onClick={() => setAiChatOpen((v) => !v)}
                        disabled={includedCases.length < 1}
                      >
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" /></svg>
                        {aiChatOpen ? "Close chat panel" : "Open chat panel"}
                      </button>
                      {reportInsights.length > 0 && (
                        <div className={styles.aiAnalysisInsightCount}>
                          {reportInsights.length} insight{reportInsights.length !== 1 ? "s" : ""} added to report
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Live preview */}
            <div className={styles.configRight}>
              {includedCases.length > 0 && !aiChatOpen && (
                <div className={styles.aiFloatingToggleWrap}>
                  <button
                    className={styles.aiFloatingToggle}
                    onClick={() => setAiChatOpen(true)}
                    title="Open AI chat"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" /></svg>
                    <span className={styles.aiFloatingLabel}>AI Chat</span>
                  </button>
                </div>
              )}
              <div className={styles.previewCanvas}>
                  {!isSelectionSource && (
                    <div className={styles.subscriptionPreviewBanner}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <div>
                        <div className={styles.subscriptionBannerTitle}>{searchPreviewTitle}</div>
                        <div className={styles.subscriptionBannerDesc}>
                          {searchPreviewDescription}
                        </div>
                      </div>
                    </div>
                  )}
                  <DocumentPreview
                    title={reportTitle}
                    subtitle={reportSubtitle}
                    logoUrl={logoUrl}
                    sections={sections}
                    metaFields={activeSelectedMetaFields}
                    cases={includedCases}
                    onRemove={isSelectionSource ? removeCase : null}
                    includeComparisonAppendix={shouldIncludeComparisonAppendix}
                    docTypeLabel={docTypeLabel}
                    reportInsights={reportInsights}
                    onRemoveInsight={removeInsightFromReport}
                  />
              </div>
            </div>

            {/* Right: AI Chat Panel */}
            {aiChatOpen && includedCases.length > 0 && (
              <>
                <div
                  className={`${styles.aiResizer} ${isAiResizing ? styles.aiResizerActive : ""}`}
                  role="separator"
                  aria-label="Resize AI chat panel"
                  aria-orientation="vertical"
                  tabIndex={0}
                  onPointerDown={handleAiResizeStart}
                  onKeyDown={handleAiResizeKeyDown}
                  onDoubleClick={handleAiResizeReset}
                />
                <div className={styles.configAI} style={{ width: `${aiChatWidth}px` }}>
                  <ReportAIChat
                    cases={includedCases}
                    sections={sections}
                    onAddToReport={addInsightToReport}
                    onClose={() => setAiChatOpen(false)}
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          /* ── Step 2: Save & Export ── */
          subscriptionSuccess ? (
          <div className={styles.successPage}>
            <div className={styles.successCard}>
              <div className={styles.successIcon}>
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="9 12 11.5 14.5 16 9.5" />
                </svg>
              </div>
              <h2 className={styles.successTitle}>Subscription Created</h2>
              <p className={styles.successText}>
                Your {subscriptionFrequency} report has been set up successfully.
                {deliveryMethod === "email"
                  ? " You should receive the first report at your registered email address shortly."
                  : " The first report will be saved to your JibuDocs folder shortly."}
              </p>
              <div className={styles.successDetails}>
                <div className={styles.successDetailRow}>
                  <span className={styles.successDetailLabel}>Report</span>
                  <span className={styles.successDetailValue}>{reportTitle}</span>
                </div>
                <div className={styles.successDetailRow}>
                  <span className={styles.successDetailLabel}>Frequency</span>
                  <span className={styles.successDetailValue}>{subscriptionFrequency === "weekly" ? "Every Monday" : "1st of each month"}</span>
                </div>
                <div className={styles.successDetailRow}>
                  <span className={styles.successDetailLabel}>Delivery</span>
                  <span className={styles.successDetailValue}>{deliveryMethod === "email" ? "Email" : "JibuDocs folder"}</span>
                </div>
              </div>
              <div className={styles.successActions}>
                <button className={styles.successBackBtn} onClick={() => navigate("/results")}>
                  Back to Results
                </button>
              </div>
            </div>
          </div>
          ) : (
          <div className={styles.deliveryLayout}>
            <div className={styles.deliveryPanel}>
              <div className={styles.deliveryCard}>
                <div className={styles.deliveryCardTitle}>
                  {isSelectionSource ? "Export Report" : "Delivery Schedule"}
                </div>
                <p className={styles.deliveryCardHint}>
                  {isSelectionSource
                    ? `Export your ${includedCases.length} selected document${includedCases.length !== 1 ? "s" : ""} as a one-time report.`
                    : "How often should JibuDocs generate this report?"}
                </p>
                {canSubscribe ? (
                  <div className={styles.frequencyOptions}>
                    <button className={`${styles.frequencyBtn} ${schedule === "weekly" ? styles.frequencyBtnSelected : ""}`} onClick={() => setSchedule("weekly")}>
                      <span className={styles.frequencyLabel}>Weekly</span>
                      <span className={styles.frequencyDesc}>Every Monday</span>
                    </button>
                    <button className={`${styles.frequencyBtn} ${schedule === "monthly" ? styles.frequencyBtnSelected : ""}`} onClick={() => setSchedule("monthly")}>
                      <span className={styles.frequencyLabel}>Monthly</span>
                      <span className={styles.frequencyDesc}>1st of each month</span>
                    </button>
                    <button className={`${styles.frequencyBtn} ${schedule === "one-off" ? styles.frequencyBtnSelected : ""}`} onClick={() => setSchedule("one-off")}>
                      <span className={styles.frequencyLabel}>One-off</span>
                      <span className={styles.frequencyDesc}>Single snapshot</span>
                    </button>
                  </div>
                ) : null}
              </div>

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
                    onClick={() => setSubscriptionSuccess(true)}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Subscribe {subscriptionFrequency === "weekly" ? "Weekly" : "Monthly"}
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
                metaFields={activeSelectedMetaFields}
                cases={includedCases}
                includeComparisonAppendix={shouldIncludeComparisonAppendix}
                docTypeLabel={docTypeLabel}
                reportInsights={reportInsights}
              />
            </div>
          </div>
          )
        )}
      </div>

    </div>
  );
}
