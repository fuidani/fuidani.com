import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  REPORT_SECTIONS,
  FIELD_CATEGORIES,
  REPORT_SECTIONS_BY_TYPE,
  FIELD_CATEGORIES_BY_TYPE,
  DEFAULT_META_FIELDS_BY_TYPE,
  DOC_TYPE_LABELS,
  CaseRecord,
  ReportSection,
  DocumentType,
} from "../data/sampleCases";
import useLocalCaseDatabase from "../hooks/useLocalCaseDatabase";
import { getDocumentLabel } from "../data/documentUtils";
import darkLogo from "../assets/Dark_Logo_JibuDocs_Icon.png";
import ToggleSwitch from "../components/ToggleSwitch";
import DocumentPreview from "./report/DocumentPreview";
import ReportAIChat from "./report/ReportAIChat";

const DEFAULT_META_FIELDS = DEFAULT_META_FIELDS_BY_TYPE['case-law'];

const hasRenderableMetaField = (doc: CaseRecord, field: string): boolean =>
  Object.prototype.hasOwnProperty.call(doc, field) && doc[field] !== undefined;

const getAvailableMetaFieldSet = (categories: Record<string, string[]>, docs: CaseRecord[]): Set<string> => {
  const available = new Set<string>();
  for (const fields of Object.values(categories)) {
    for (const field of fields) {
      if (docs.some((doc) => hasRenderableMetaField(doc, field))) {
        available.add(field);
      }
    }
  }
  return available;
};

interface ReportSource {
  type?: string;
  query?: string;
}

interface Insight {
  id: number;
  question: string;
  answer: string;
}

/* ─── Main Report Page ──────────────────────────────────── */

export default function ReportPage() {
  const navigate = useNavigate();
  const { casesById } = useLocalCaseDatabase();

  const selectedItems = useMemo<Record<string, unknown>>(() => {
    try {
      const stored = sessionStorage.getItem("reportItems");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }, []);

  const docType = useMemo<string>(() => {
    try {
      return sessionStorage.getItem("reportDocType") || "case-law";
    } catch {
      return "case-law";
    }
  }, []);

  const reportSource = useMemo<ReportSource | null>(() => {
    try {
      const stored = sessionStorage.getItem("reportSource");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const docTypeLabel = DOC_TYPE_LABELS[docType as DocumentType] || "Documents";
  const typeSections = REPORT_SECTIONS_BY_TYPE[docType] || REPORT_SECTIONS;
  const typeFieldCategories = FIELD_CATEGORIES_BY_TYPE[docType] || FIELD_CATEGORIES;
  const typeDefaultMetaFields = DEFAULT_META_FIELDS_BY_TYPE[docType] || DEFAULT_META_FIELDS;
  const sourceType = reportSource?.type === "selection" ? "selection" : "search";
  const isSelectionSource = sourceType === "selection";

  const selectedIds = Object.keys(selectedItems);
  const caseEntries = useMemo(
    () => selectedIds.map((id) => casesById[id]).filter(Boolean) as CaseRecord[],
    [casesById, selectedIds]
  );

  // Report config state
  const [reportStep, setReportStep] = useState(1);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);
  const [includeComparisonAppendix, setIncludeComparisonAppendix] = useState(true);
  const [reportInsights, setReportInsights] = useState<Insight[]>([]);
  const addInsightToReport = (insight: { question: string; answer: string }) => {
    setReportInsights((prev) => [...prev, { ...insight, id: Date.now() }]);
  };
  const removeInsightFromReport = (id: number) => {
    setReportInsights((prev) => prev.filter((i) => i.id !== id));
  };
  const [sections, setSections] = useState<ReportSection[]>(() => typeSections.map((s) => ({ ...s })));
  const [selectedMetaFields, setSelectedMetaFields] = useState<string[]>(() => typeDefaultMetaFields);
  const [reportTitle, setReportTitle] = useState(docType === "case-law" ? "JibuDocs Case Summaries" : `${docTypeLabel} Report`);
  const [reportSubtitle, setReportSubtitle] = useState(docType === "case-law" ? "Local CSV demo dataset" : "");
  const [logoUrl, setLogoUrl] = useState<string | null>(darkLogo);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Accordion state
  const [openAccordion, setOpenAccordion] = useState<string | null>("details");
  const toggleAccordion = (key: string) =>
    setOpenAccordion((prev) => (prev === key ? null : key));

  // Document curation (one-off only)
  const MAX_REPORT_DOCS = 10;
  const [includedCaseIds, setIncludedCaseIds] = useState<Set<string>>(
    () => new Set(selectedIds.slice(0, MAX_REPORT_DOCS))
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
    () => caseEntries.filter((c) => includedCaseIds.has(c.id!)),
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
        .map(([category, fields]) => [category, fields.filter((field) => availableMetaFieldSet.has(field))] as [string, string[]])
        .filter(([, fields]) => fields.length > 0),
    [availableMetaFieldSet, typeFieldCategories]
  );
  const activeSelectedMetaFields = useMemo(
    () => selectedMetaFields.filter((field) => availableMetaFieldSet.has(field)),
    [availableMetaFieldSet, selectedMetaFields]
  );

  const availableToAdd = useMemo(
    () => caseEntries.filter((c) => !includedCaseIds.has(c.id!)),
    [caseEntries, includedCaseIds]
  );

  const removeCase = (id: string) => {
    setIncludedCaseIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const addCase = (id: string) => {
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

  const clampAiWidth = useCallback(
    (w: number) => Math.max(AI_CHAT_MIN, Math.min(AI_CHAT_MAX, w)),
    []
  );

  const handleAiResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    aiResizeRef.current = { active: true, startX: e.clientX, startWidth: aiChatWidth };
    setIsAiResizing(true);
  }, [aiChatWidth]);

  const handleAiResizeKeyDown = useCallback((e: React.KeyboardEvent) => {
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
    const onMove = (e: PointerEvent) => {
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const toggleMetaField = (field: string) => {
    setSelectedMetaFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const moveSection = (idx: number, dir: number) => {
    const next = [...sections];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setSections(next);
  };

  const handleBack = () => navigate(-1);
  const handlePrint = () => {
    const previousTitle = document.title;
    const restoreTitle = () => {
      document.title = previousTitle;
    };

    document.title = "";
    window.addEventListener("afterprint", restoreTitle, { once: true });
    window.print();

    // Some browsers skip afterprint when the dialog is dismissed.
    window.setTimeout(() => {
      if (document.title === "") {
        restoreTitle();
      }
    }, 0);
  };

  // ── Styles helpers ──

  // Stepper step classes
  const stepNumBase = "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 border-gray-300 text-gray-400 transition-all duration-200 flex-shrink-0";
  const stepLabelBase = "text-xs font-semibold text-gray-400 whitespace-nowrap transition-colors duration-200 max-sm:hidden";

  // Accordion body uses CSS grid trick for smooth animation
  const accordionBodyClass = (open: boolean) =>
    `grid transition-[grid-template-rows] duration-[250ms] ease-in-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`;

  return (
    <div
      className="flex flex-col overflow-hidden print:h-auto print:overflow-visible"
      style={{ height: "var(--app-height)", background: "#f8fafc" }}
    >
      {/* ── Header ── */}
      <div className="bg-slate-800 text-white h-12 flex items-center px-4 gap-3 flex-shrink-0 print:hidden max-sm:px-3 max-sm:gap-2">
        <button
          className="flex items-center gap-1.5 text-[13px] font-medium text-slate-400 bg-none border-none cursor-pointer px-2.5 py-1.5 rounded-[5px] transition-all duration-150 hover:text-white hover:bg-white/[0.08] max-sm:px-1.5 max-sm:text-xs"
          onClick={handleBack}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to Results
        </button>
        <div className="text-[15px] font-bold flex items-center gap-2 max-sm:text-[13px]">
          <div className="w-6 h-6 rounded-[5px] flex items-center justify-center" style={{ background: "rgba(202,138,4,0.2)" }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          Report Builder
        </div>
        <span className="text-xs text-slate-400 ml-2 max-sm:hidden">{currentHeaderCountLabel}</span>
      </div>

      {/* ── Stepper ── */}
      <div className="bg-white border-b border-gray-200 px-6 flex items-center h-[50px] flex-shrink-0 print:hidden max-sm:px-3 max-sm:flex-wrap max-sm:h-auto max-sm:min-h-[50px] max-sm:py-2">
        {/* Step 1 */}
        <div
          className={`flex items-center gap-2 px-4 h-full cursor-pointer select-none transition-colors duration-150 max-sm:px-2`}
          onClick={() => setReportStep(1)}
        >
          <span className={`${stepNumBase} ${
            reportStep === 1
              ? "border-yellow-600 bg-yellow-600 text-white"
              : reportStep > 1
                ? "border-emerald-700 bg-emerald-100 text-emerald-700"
                : ""
          }`}>
            {reportStep > 1 ? "✓" : "1"}
          </span>
          <span className={`${stepLabelBase} ${reportStep === 1 ? "text-slate-800" : reportStep > 1 ? "text-gray-500" : ""}`}>
            Design Report
          </span>
        </div>

        {/* Connector */}
        <div className={`flex-[0_0_32px] h-0.5 mx-1 max-sm:flex-[0_0_16px] ${reportStep > 1 ? "bg-emerald-700" : "bg-gray-200"}`} />

        {/* Step 2 */}
        <div
          className="flex items-center gap-2 px-4 h-full cursor-pointer select-none transition-colors duration-150 max-sm:px-2"
          onClick={() => setReportStep(2)}
        >
          <span className={`${stepNumBase} ${reportStep === 2 ? "border-yellow-600 bg-yellow-600 text-white" : ""}`}>
            2
          </span>
          <span className={`${stepLabelBase} ${reportStep === 2 ? "text-slate-800" : ""}`}>
            {isSelectionSource ? "Save & Export" : "Set Up Schedule"}
          </span>
        </div>

        {/* Nav buttons */}
        <div className="ml-auto flex gap-2 items-center max-sm:ml-0 max-sm:w-full max-sm:justify-end max-sm:pt-1.5">
          <button
            className="inline-flex items-center gap-[5px] px-4 py-[7px] rounded-md text-xs font-semibold border border-gray-300 bg-white text-gray-700 cursor-pointer transition-all duration-150 whitespace-nowrap hover:border-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => setReportStep(reportStep - 1)}
            disabled={reportStep === 1}
          >
            &larr; Back
          </button>
          <button
            className="inline-flex items-center gap-[5px] px-4 py-[7px] rounded-md text-xs font-semibold border border-transparent bg-yellow-600 text-white cursor-pointer transition-all duration-150 whitespace-nowrap hover:bg-yellow-700"
            onClick={() => {
              if (reportStep === 1) setReportStep(2);
              else handleBack();
            }}
          >
            {reportStep === 1
              ? (isSelectionSource ? "Save & Export →" : "Set Up Schedule →")
              : "Done"}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div
        className="flex-1 overflow-hidden min-h-0 print:overflow-visible print:h-auto"
        style={{
          background: [
            "radial-gradient(circle at top center, rgba(202, 138, 4, 0.12) 0%, rgba(202, 138, 4, 0.04) 24%, transparent 48%)",
            "radial-gradient(circle at 88% 18%, rgba(30, 41, 59, 0.06) 0%, transparent 30%)",
            "linear-gradient(180deg, #fffdf8 0%, #f8fafc 58%, #f1f5f9 100%)",
          ].join(", "),
        }}
      >
        {reportStep === 1 ? (
          <div className="flex h-full overflow-hidden print:overflow-visible print:h-auto">
            {/* Left: Config */}
            <div className="w-[360px] bg-white border-r border-slate-200 flex flex-col overflow-hidden flex-shrink-0 max-[900px]:w-[280px] max-sm:w-full max-sm:max-h-[50vh]">
              <div className="flex-1 flex flex-col overflow-y-auto p-4 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">

                {/* Source Card */}
                <div className="mb-5">
                  <div className="px-3.5 py-3.5 border border-slate-200 rounded-[10px]" style={{ background: "linear-gradient(180deg, #fffdf8 0%, #ffffff 100%)" }}>
                    <div className="flex justify-between gap-3 items-start">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-yellow-700 mb-1">{sourceEyebrow}</div>
                        <div className="text-sm font-bold text-slate-800 leading-[1.35]">{sourceLabel}</div>
                      </div>
                      <span className={`flex-shrink-0 inline-flex items-center px-2 py-[5px] rounded-full text-[10px] font-bold ${
                        isSelectionSource ? "bg-slate-200 text-slate-700" : "bg-yellow-100 text-amber-800"
                      }`}>
                        {sourceBadgeLabel}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 text-[11px] text-slate-500 pt-2.5 mt-2.5 border-t border-slate-100">
                      <span>{docTypeLabel}</span>
                      <span>{sourceContextLabel}</span>
                    </div>
                    {!isSelectionSource && (
                      <p className="mt-2.5 text-[11px] leading-[1.5] text-gray-500">{sourceNote}</p>
                    )}
                    {canCompare && (
                      <div className="mt-3 px-3 py-3 rounded-[10px] border border-yellow-200" style={{ background: "linear-gradient(180deg, #fffbeb 0%, #fffdf6 100%)" }}>
                        <div className="text-[11px] font-[800] uppercase tracking-[0.05em] text-amber-800">{sourceCompareHintTitle}</div>
                        <div className="mt-1 text-[11px] leading-[1.55] text-yellow-700">{sourceCompareHintText}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Report Details accordion */}
                <div className="mb-5">
                  <button
                    className="w-full flex items-center gap-2 py-2.5 px-1 border-none border-b border-gray-200 bg-none cursor-pointer text-[11px] font-bold uppercase tracking-[0.5px] text-slate-500 transition-colors duration-150 hover:text-slate-800"
                    onClick={() => toggleAccordion("details")}
                  >
                    <span className="w-[18px] h-[18px] bg-slate-800 text-white rounded-full flex items-center justify-center text-[9px] font-bold">A</span>
                    Report Details
                    <svg
                      className={`ml-auto flex-shrink-0 text-gray-400 transition-transform duration-[250ms] ease-in-out ${openAccordion === "details" ? "rotate-0" : "-rotate-90"}`}
                      viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  <div className={accordionBodyClass(openAccordion === "details")}>
                    <div className="overflow-hidden pt-0 transition-[padding-top] duration-[250ms] ease-in-out" style={{ paddingTop: openAccordion === "details" ? "10px" : "0" }}>
                      <div className="mb-2.5">
                        <label className="block text-[11px] font-semibold text-gray-600 mb-[3px]">Report Title</label>
                        <input
                          type="text"
                          value={reportTitle}
                          onChange={(e) => setReportTitle(e.target.value)}
                          className="w-full px-2.5 py-[7px] border border-gray-300 rounded-md text-xs text-gray-800 bg-white focus:outline-none focus:border-yellow-600 focus:[box-shadow:0_0_0_3px_rgba(202,138,4,0.12)]"
                        />
                      </div>
                      <div className="mb-2.5">
                        <label className="block text-[11px] font-semibold text-gray-600 mb-[3px]">Subtitle / Edition</label>
                        <input
                          type="text"
                          value={reportSubtitle}
                          onChange={(e) => setReportSubtitle(e.target.value)}
                          className="w-full px-2.5 py-[7px] border border-gray-300 rounded-md text-xs text-gray-800 bg-white focus:outline-none focus:border-yellow-600 focus:[box-shadow:0_0_0_3px_rgba(202,138,4,0.12)]"
                        />
                      </div>
                      <div className="mb-2.5">
                        <label className="block text-[11px] font-semibold text-gray-600 mb-[3px]">Report Logo</label>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="border border-gray-300 rounded-md bg-white p-1.5 flex items-center justify-center flex-shrink-0">
                            {logoUrl ? (
                              <img src={logoUrl} alt="Logo" className="max-h-10 object-contain" />
                            ) : (
                              <span className="text-[9px] text-gray-400 text-center">No logo</span>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <button
                              className="text-[11px] font-semibold text-yellow-600 bg-none border border-yellow-600 rounded-[5px] px-2.5 py-1 cursor-pointer transition-all duration-150 hover:bg-yellow-50"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              Upload custom logo
                            </button>
                            {logoUrl !== darkLogo && logoUrl && (
                              <button className="text-[10px] text-gray-500 bg-none border-none p-0 cursor-pointer text-left hover:text-gray-800 hover:underline" onClick={handleResetLogo}>
                                Reset to default
                              </button>
                            )}
                            {logoUrl && (
                              <button className="text-[10px] text-gray-500 bg-none border-none p-0 cursor-pointer text-left hover:text-gray-800 hover:underline" onClick={handleRemoveLogo}>
                                Remove logo
                              </button>
                            )}
                          </div>
                          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overview Summary accordion */}
                <div className="mb-5">
                  <button
                    className="w-full flex items-center gap-2 py-2.5 px-1 border-none border-b border-gray-200 bg-none cursor-pointer text-[11px] font-bold uppercase tracking-[0.5px] text-slate-500 transition-colors duration-150 hover:text-slate-800"
                    onClick={() => toggleAccordion("compare")}
                  >
                    <span className="w-[18px] h-[18px] bg-slate-800 text-white rounded-full flex items-center justify-center text-[9px] font-bold">B</span>
                    Overview Summary
                    <svg
                      className={`ml-auto flex-shrink-0 text-gray-400 transition-transform duration-[250ms] ease-in-out ${openAccordion === "compare" ? "rotate-0" : "-rotate-90"}`}
                      viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  <div className={accordionBodyClass(openAccordion === "compare")}>
                    <div className="overflow-hidden pt-0 transition-[padding-top] duration-[250ms] ease-in-out" style={{ paddingTop: openAccordion === "compare" ? "10px" : "0" }}>
                      <p className="text-[10px] text-gray-400 mb-1.5">
                        Include an overview summary in the exported report that cross-references metadata across all included documents.
                      </p>
                      <div className={`border border-slate-200 rounded-[10px] p-3.5 ${!canCompareInCurrentMode ? "opacity-70" : ""}`} style={{ background: "linear-gradient(180deg, #fffef8 0%, #ffffff 100%)" }}>
                        <div className="flex justify-between gap-3 items-start">
                          <div>
                            <div className="text-xs font-bold text-slate-800">Include overview in export</div>
                            <div className="mt-1 text-[11px] leading-[1.55] text-slate-500">{overviewHelperText}</div>
                          </div>
                          <ToggleSwitch
                            checked={shouldIncludeComparisonAppendix}
                            onChange={() => setIncludeComparisonAppendix((prev) => !prev)}
                            disabled={!canCompareInCurrentMode}
                          />
                        </div>
                        {canCompareInCurrentMode ? (
                          <div className="mt-3 flex justify-between gap-2.5 items-center">
                            <span className={`inline-flex items-center px-[9px] py-[5px] rounded-full text-[10px] font-[800] uppercase tracking-[0.05em] ${
                              shouldIncludeComparisonAppendix ? "bg-yellow-100 text-amber-800" : "bg-slate-200 text-slate-600"
                            }`}>
                              {shouldIncludeComparisonAppendix ? "Will be exported" : "Not in export"}
                            </span>
                          </div>
                        ) : (
                          <div className="mt-3 text-[11px] leading-[1.55] text-slate-400">{overviewEmptyText}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metadata Fields accordion */}
                <div className="mb-5">
                  <button
                    className="w-full flex items-center gap-2 py-2.5 px-1 border-none border-b border-gray-200 bg-none cursor-pointer text-[11px] font-bold uppercase tracking-[0.5px] text-slate-500 transition-colors duration-150 hover:text-slate-800"
                    onClick={() => toggleAccordion("metadata")}
                  >
                    <span className="w-[18px] h-[18px] bg-slate-800 text-white rounded-full flex items-center justify-center text-[9px] font-bold">C</span>
                    Metadata Fields
                    <svg
                      className={`ml-auto flex-shrink-0 text-gray-400 transition-transform duration-[250ms] ease-in-out ${openAccordion === "metadata" ? "rotate-0" : "-rotate-90"}`}
                      viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  <div className={accordionBodyClass(openAccordion === "metadata")}>
                    <div className="overflow-hidden pt-0 transition-[padding-top] duration-[250ms] ease-in-out" style={{ paddingTop: openAccordion === "metadata" ? "10px" : "0" }}>
                      <p className="text-[10px] text-gray-400 mb-1.5">Choose which fields appear on each case.</p>
                      {visibleFieldCategories.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {visibleFieldCategories.flatMap(([, fields]) => fields).map((f) => {
                            const selected = activeSelectedMetaFields.includes(f);
                            return (
                              <button
                                type="button"
                                key={f}
                                aria-pressed={selected}
                                className={`inline-flex items-center px-[9px] py-1 rounded text-[11px] font-medium leading-[1.2] appearance-none border cursor-pointer transition-all duration-[120px] select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600 ${
                                  selected
                                    ? "bg-slate-800 text-white border-slate-800 hover:bg-slate-700"
                                    : "border-gray-300 bg-white text-gray-600 hover:border-yellow-600 hover:text-yellow-600"
                                }`}
                                onClick={() => toggleMetaField(f)}
                              >
                                {f}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-3 pb-1 text-xs leading-[1.5] text-slate-500">
                          No metadata fields are available for the currently selected documents.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Report Sections accordion */}
                <div className="mb-5">
                  <button
                    className="w-full flex items-center gap-2 py-2.5 px-1 border-none border-b border-gray-200 bg-none cursor-pointer text-[11px] font-bold uppercase tracking-[0.5px] text-slate-500 transition-colors duration-150 hover:text-slate-800"
                    onClick={() => toggleAccordion("sections")}
                  >
                    <span className="w-[18px] h-[18px] bg-slate-800 text-white rounded-full flex items-center justify-center text-[9px] font-bold">D</span>
                    Report Sections
                    <svg
                      className={`ml-auto flex-shrink-0 text-gray-400 transition-transform duration-[250ms] ease-in-out ${openAccordion === "sections" ? "rotate-0" : "-rotate-90"}`}
                      viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  <div className={accordionBodyClass(openAccordion === "sections")}>
                    <div className="overflow-hidden pt-0 transition-[padding-top] duration-[250ms] ease-in-out" style={{ paddingTop: openAccordion === "sections" ? "10px" : "0" }}>
                      <p className="text-[10px] text-gray-400 mb-1.5">Toggle sections ON/OFF. Use arrows to reorder.</p>
                      <div className="flex flex-col gap-0.5">
                        {sections.map((sec, idx) => (
                          <div key={sec.id} className="flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer transition-[background] duration-100 select-none hover:bg-gray-50">
                            <span className="cursor-grab text-gray-300 text-[10px]">☰</span>
                            <span className="flex-1 text-xs font-medium text-gray-700">{sec.label}</span>
                            <ToggleSwitch checked={sec.enabled} onChange={() => toggleSection(sec.id)} />
                            <div className="flex flex-col gap-0">
                              <button
                                className="bg-none border-none text-[8px] text-slate-400 cursor-pointer px-[3px] leading-none hover:text-slate-600 disabled:opacity-30 disabled:cursor-default"
                                onClick={() => moveSection(idx, -1)}
                                disabled={idx === 0}
                              >▲</button>
                              <button
                                className="bg-none border-none text-[8px] text-slate-400 cursor-pointer px-[3px] leading-none hover:text-slate-600 disabled:opacity-30 disabled:cursor-default"
                                onClick={() => moveSection(idx, 1)}
                                disabled={idx === sections.length - 1}
                              >▼</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Analysis accordion */}
                <div className="mb-5">
                  <button
                    className="w-full flex items-center gap-2 py-2.5 px-1 border-none border-b border-gray-200 bg-none cursor-pointer text-[11px] font-bold uppercase tracking-[0.5px] text-slate-500 transition-colors duration-150 hover:text-slate-800"
                    onClick={() => toggleAccordion("ai")}
                  >
                    <span className="w-[18px] h-[18px] bg-slate-800 text-white rounded-full flex items-center justify-center text-[9px] font-bold">E</span>
                    AI Analysis
                    <svg
                      className={`ml-auto flex-shrink-0 text-gray-400 transition-transform duration-[250ms] ease-in-out ${openAccordion === "ai" ? "rotate-0" : "-rotate-90"}`}
                      viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  <div className={accordionBodyClass(openAccordion === "ai")}>
                    <div className="overflow-hidden pt-0 transition-[padding-top] duration-[250ms] ease-in-out" style={{ paddingTop: openAccordion === "ai" ? "10px" : "0" }}>
                      <p className="text-[10px] text-gray-400 mb-1.5">
                        Ask questions about the included documents, compare their content, and add AI-generated insights to your report.
                      </p>
                      <div className="flex items-start gap-2.5 p-3 rounded-lg mb-2.5 border border-yellow-200" style={{ background: "linear-gradient(135deg, #fffdf5 0%, #fefce8 100%)" }}>
                        <div className="flex-shrink-0 mt-px">
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" /></svg>
                        </div>
                        <div>
                          <div className="font-['Noto_Sans',sans-serif] font-bold text-xs text-slate-800 mb-0.5">
                            {aiChatOpen ? "Chat panel is open" : "Chat with your documents"}
                          </div>
                          <div className="text-[11px] text-slate-500 leading-[1.4]">
                            {includedCases.length < 1
                              ? "Include at least one document to start chatting."
                              : aiChatOpen
                                ? "The AI chat panel is visible on the right. Ask questions about your documents."
                                : `Explore and analyse ${includedCases.length} document${includedCases.length !== 1 ? "s" : ""} with AI assistance.`}
                          </div>
                        </div>
                      </div>
                      <button
                        className="inline-flex items-center gap-1.5 px-3.5 py-[7px] border border-slate-200 rounded-md bg-white text-slate-800 text-[11px] font-semibold font-['Noto_Sans',sans-serif] cursor-pointer transition-[background,border-color] duration-150 hover:not-disabled:bg-slate-50 hover:not-disabled:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setAiChatOpen((v) => !v)}
                        disabled={includedCases.length < 1}
                      >
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" /></svg>
                        {aiChatOpen ? "Close chat panel" : "Open chat panel"}
                      </button>
                      {reportInsights.length > 0 && (
                        <div className="mt-2 text-[11px] text-yellow-600 font-semibold font-['Noto_Sans',sans-serif]">
                          {reportInsights.length} insight{reportInsights.length !== 1 ? "s" : ""} added to report
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Center: Live preview */}
            <div className="relative flex-1 overflow-y-auto p-6 flex flex-col items-center gap-3.5 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] print:overflow-visible" style={{ background: "linear-gradient(180deg, rgba(255,253,248,0.38) 0%, rgba(248,250,252,0.16) 100%)" }}>
              {includedCases.length > 0 && !aiChatOpen && (
                <div className="sticky top-[calc(50%-36px)] self-end z-10 h-0 overflow-visible -mr-6 print:hidden">
                  <button
                    className="flex items-center gap-2 px-4 py-3 border-none rounded-[10px_0_0_10px] bg-slate-800 text-white text-[13px] font-bold font-['Noto_Sans',sans-serif] cursor-pointer whitespace-nowrap transition-[background,box-shadow,transform] duration-150 hover:bg-slate-900 hover:-translate-x-[3px] [&_svg]:stroke-yellow-400 [&_svg]:flex-shrink-0"
                    style={{ boxShadow: "-3px 2px 12px rgba(0,0,0,0.2)" }}
                    onClick={() => setAiChatOpen(true)}
                    title="Open AI chat"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" /></svg>
                    <span className="tracking-[0.02em]">AI Chat</span>
                  </button>
                </div>
              )}
              <div className="w-[min(800px,100%)] flex flex-col gap-3.5">
                {!isSelectionSource && (
                  <div className="flex items-start gap-2.5 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-[10px]">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <div>
                      <div className="text-xs font-bold text-amber-800 mb-0.5">{searchPreviewTitle}</div>
                      <div className="text-[11px] text-yellow-700 leading-[1.5]">{searchPreviewDescription}</div>
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
                {/* Resizer */}
                <div
                  className={`relative w-3 flex-shrink-0 bg-transparent cursor-col-resize transition-[background] duration-150 touch-none before:content-[''] before:absolute before:top-0 before:left-1/2 before:w-0.5 before:h-full before:-translate-x-1/2 before:bg-slate-200 before:opacity-60 before:transition-[opacity,width,background] before:duration-150 hover:before:opacity-100 hover:before:w-[3px] hover:before:bg-yellow-600 focus-visible:outline-none ${isAiResizing ? "before:opacity-100 before:w-[3px] before:bg-yellow-600" : ""}`}
                  role="separator"
                  aria-label="Resize AI chat panel"
                  aria-orientation="vertical"
                  tabIndex={0}
                  onPointerDown={handleAiResizeStart}
                  onKeyDown={handleAiResizeKeyDown}
                  onDoubleClick={handleAiResizeReset}
                />
                <div
                  className="flex-shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden"
                  style={{ width: `${aiChatWidth}px` }}
                >
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
            <div className="flex items-center justify-center h-full py-12 px-6">
              <div className="bg-white border border-slate-200 rounded-xl p-12 max-w-[480px] w-full text-center" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: "48px 40px" }}>
                <div className="mb-5">
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="9 12 11.5 14.5 16 9.5" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-slate-800 m-0 mb-3">Subscription Created</h2>
                <p className="text-sm text-slate-500 leading-relaxed m-0 mb-7">
                  Your {subscriptionFrequency} report has been set up successfully.
                  {deliveryMethod === "email"
                    ? " You should receive the first report at your registered email address shortly."
                    : " The first report will be saved to your JibuDocs folder shortly."}
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-5 py-4 mb-7 text-left">
                  {[
                    { label: "Report", value: reportTitle },
                    { label: "Frequency", value: subscriptionFrequency === "weekly" ? "Every Monday" : "1st of each month" },
                    { label: "Delivery", value: deliveryMethod === "email" ? "Email" : "JibuDocs folder" },
                  ].map(({ label, value }, i) => (
                    <div key={label} className={`flex justify-between py-2 ${i > 0 ? "border-t border-slate-200" : ""}`}>
                      <span className="text-[13px] text-slate-400 font-medium">{label}</span>
                      <span className="text-[13px] text-slate-800 font-medium">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-3">
                  <button
                    className="bg-slate-800 text-white border-none rounded-lg px-6 py-2.5 text-sm font-medium cursor-pointer transition-[background] duration-150 hover:bg-slate-700"
                    onClick={() => navigate("/results")}
                  >
                    Back to Results
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center h-full overflow-y-auto py-8 px-6 print:block print:h-auto print:overflow-visible print:px-0 print:py-0">
              <div className="w-[560px] flex flex-col gap-5 print:hidden">

                {/* Delivery Schedule / Export */}
                <div className="bg-white border border-slate-200 rounded-[10px] p-5">
                  <div className="text-[13px] font-bold text-slate-800 mb-1">
                    {isSelectionSource ? "Export Report" : "Delivery Schedule"}
                  </div>
                  <p className="text-[11px] text-gray-500 mb-3.5">
                    {isSelectionSource
                      ? `Export your ${includedCases.length} selected document${includedCases.length !== 1 ? "s" : ""} as a one-time report.`
                      : "How often should JibuDocs generate this report?"}
                  </p>
                  {canSubscribe ? (
                    <div className="flex gap-2.5">
                      {[
                        { key: "weekly", label: "Weekly", desc: "Every Monday" },
                        { key: "monthly", label: "Monthly", desc: "1st of each month" },
                        { key: "one-off", label: "One-off", desc: "Single snapshot" },
                      ].map(({ key, label, desc }) => (
                        <button
                          key={key}
                          className={`flex-1 px-4 py-3.5 border-2 rounded-lg bg-white cursor-pointer transition-all duration-150 text-center hover:border-gray-300 hover:bg-gray-50 ${
                            schedule === key ? "border-yellow-600 bg-yellow-50 hover:border-yellow-600 hover:bg-yellow-50" : "border-gray-200"
                          }`}
                          onClick={() => setSchedule(key)}
                        >
                          <span className="block text-[13px] font-bold text-slate-800">{label}</span>
                          <span className="block text-[10px] text-gray-500 mt-0.5">{desc}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Auto-select note for subscription */}
                {canSubscribe && deliveryMode === "subscription" && (
                  <div className="bg-white border border-slate-200 rounded-[10px] p-5">
                    <div className="flex items-start gap-2.5 px-3.5 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                      <div>
                        <div className="text-xs font-semibold text-amber-800 mb-0.5">Up to {MAX_REPORT_DOCS} most recent documents matching your search will be included automatically in each report.</div>
                        <div className="text-[11px] text-yellow-700">Documents are selected based on your current search filters each time the report is generated.</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Method */}
                <div className="bg-white border border-slate-200 rounded-[10px] p-5">
                  <div className="text-[13px] font-bold text-slate-800 mb-1">Delivery Method</div>
                  <p className="text-[11px] text-gray-500 mb-3.5">Choose how you receive the report.</p>
                  <div className="flex flex-col gap-2.5">
                    {[
                      {
                        value: "folder",
                        label: "Save to JibuDocs",
                        desc: "Save directly to your JibuDocs folder",
                        icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
                      },
                      {
                        value: "email",
                        label: "Email",
                        desc: "Send to your registered JibuDocs email address",
                        icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
                      },
                    ].map(({ value, label, desc, icon }) => {
                      const selected = deliveryMethod === value;
                      return (
                        <label
                          key={value}
                          className={`flex items-center gap-3 px-4 py-3.5 border-2 rounded-lg cursor-pointer transition-all duration-150 ${
                            selected
                              ? "border-yellow-600 bg-yellow-50 hover:border-yellow-600 hover:bg-yellow-50"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="deliveryMethod"
                            value={value}
                            checked={selected}
                            onChange={() => setDeliveryMethod(value)}
                            className="flex-shrink-0 accent-yellow-600"
                          />
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? "bg-yellow-100 text-yellow-600" : "bg-gray-100 text-slate-600"}`}>
                              {icon}
                            </div>
                            <div>
                              <div className="text-[13px] font-semibold text-slate-800">{label}</div>
                              <div className="text-[11px] text-gray-500 mt-px">{desc}</div>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {deliveryMethod === "email" && (
                    <div className="flex items-center gap-1.5 mt-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-[11px] text-gray-500">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                      The report will be sent to the email address associated with your JibuDocs account.
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-1">
                  {deliveryMode === "one-off" && (
                    <div className="flex flex-col gap-2">
                      <button
                        className="flex items-center gap-2.5 px-3.5 py-3 border border-gray-200 rounded-lg bg-white cursor-pointer transition-all duration-150 text-left hover:border-yellow-600 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                        onClick={handlePrint}
                      >
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-[800] flex-shrink-0" style={{ background: "#fee2e2", color: "#b91c1c" }}>PDF</div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">Export as PDF</div>
                          <div className="text-[10px] text-gray-500">Print to PDF via browser</div>
                        </div>
                      </button>
                      <button
                        className="flex items-center gap-2.5 px-3.5 py-3 border border-gray-200 rounded-lg bg-white cursor-pointer transition-all duration-150 text-left hover:border-yellow-600 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                        onClick={() => alert("In production, this generates a .docx via the JibuDocs API.")}
                      >
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-[800] flex-shrink-0" style={{ background: "#dbeafe", color: "#1e40af" }}>DOC</div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">Export as DOCX</div>
                          <div className="text-[10px] text-gray-500">Download Word document</div>
                        </div>
                      </button>
                    </div>
                  )}
                  {canSubscribe && deliveryMode === "subscription" && (
                    <button
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-[13px] font-bold border-none bg-slate-800 text-white cursor-pointer transition-all duration-150 hover:bg-slate-700"
                      onClick={() => setSubscriptionSuccess(true)}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      Subscribe {subscriptionFrequency === "weekly" ? "Weekly" : "Monthly"}
                    </button>
                  )}
                </div>
              </div>

              {/* Hidden print wrapper */}
              <div className="hidden print:flex print:w-full print:justify-center">
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
