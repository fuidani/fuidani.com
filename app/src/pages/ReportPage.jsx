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

function ToggleSwitch({ checked, onChange, disabled = false }) {
  return (
    <label className={styles.toggleSwitch} onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <span className={styles.slider} />
    </label>
  );
}

function getDocumentLabel(doc) {
  return doc.parties
    ? `${doc.caseRef || ""}: ${doc.parties}`
    : doc.companyName || doc.documentTitle || "Untitled";
}

function getCompareDocumentHeading(doc) {
  if (doc.parties) {
    return {
      eyebrow: doc.caseRef || "Case",
      title: doc.parties,
    };
  }

  if (doc.companyName) {
    return {
      eyebrow: doc.companyName,
      title: doc.documentTitle || "Untitled",
    };
  }

  return {
    eyebrow: doc["Contract Type"] || DOC_TYPE_LABELS[doc.documentType] || "Document",
    title: doc.documentTitle || doc["Contract Name"] || "Untitled",
  };
}

function formatCompareValue(value) {
  return value === undefined || value === null || value === "" ? "—" : value;
}

function allCompareValuesMatch(values) {
  const normalized = values
    .map((value) => formatCompareValue(value))
    .map((value) => String(value).trim().toLowerCase());

  if (normalized.length < 2) return true;
  return normalized.every((value) => value === normalized[0]);
}

function getComparisonRows(cases, metaFields, sections) {
  const metadataRows = metaFields
    .map((field) => {
      const values = cases.map((doc) => formatCompareValue(doc[field]));
      return {
        id: `meta-${field}`,
        label: field,
        values,
        isDifferent: !allCompareValuesMatch(values),
      };
    })
    .filter((row) => row.values.some((value) => value !== "—"));

  const narrativeRows = sections
    .filter((section) => section.enabled)
    .map((section) => {
      const values = cases.map((doc) => formatCompareValue(doc[section.id]));
      return {
        id: `section-${section.id}`,
        label: section.label,
        values,
        isDifferent: !allCompareValuesMatch(values),
      };
    })
    .filter((row) => row.values.some((value) => value !== "—"));

  return {
    metadataRows,
    narrativeRows,
    differingMetadataCount: metadataRows.filter((row) => row.isDifferent).length,
    sharedMetadataCount: metadataRows.filter((row) => !row.isDifferent).length,
    differingNarrativeCount: narrativeRows.filter((row) => row.isDifferent).length,
  };
}

/* ─── Document Preview ──────────────────────────────────── */

function DocumentPreview({
  title,
  subtitle,
  logoUrl,
  sections,
  metaFields,
  cases,
  onRemove,
  includeComparisonAppendix = false,
  docTypeLabel = "Documents",
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

      <div className={styles.docFooter}>
        <span>JibuDocs · AI-Enabled Document Management</span>
        <span>Confidential</span>
      </div>
    </div>
  );
}

/* ─── Comparison Matrix ────────────────────────────────── */

function SwapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function HeatmapOverview({
  cases,
  metadataRows,
  narrativeRows,
  differingMetadataCount,
  sharedMetadataCount,
  differingNarrativeCount,
  docLabel,
  includeInExport,
  onToggleInclude,
  onCellClick,
}) {
  const allRows = [
    ...metadataRows.map((r) => ({ ...r, group: "metadata" })),
    ...narrativeRows.map((r) => ({ ...r, group: "narrative" })),
  ];

  // For each cell, determine if that specific document's value differs from any other
  const getCellStatus = (row, docIndex) => {
    const val = row.values[docIndex];
    if (val === "—") return "empty";
    return row.isDifferent ? "diff" : "match";
  };

  return (
    <div className={styles.compareWorkspace}>
      <div className={styles.compareOverview}>
        <div className={styles.compareOverviewMain}>
          <div className={styles.compareEyebrow}>Compare selected documents</div>
          <div className={styles.compareTitle}>{cases.length} {docLabel} at a glance</div>
          <p className={styles.compareIntro}>
            Each cell shows whether a field matches or differs across documents. Click any cell to drill into a side-by-side comparison.
          </p>
          <div className={styles.compareOverviewActions}>
            <span
              className={`${styles.compareConfigBadge} ${
                includeInExport ? styles.compareConfigBadgeActive : styles.compareConfigBadgeInactive
              }`}
            >
              {includeInExport ? "Included in export" : "Preview only"}
            </span>
            {onToggleInclude && (
              <button className={styles.compareExportBtn} onClick={onToggleInclude}>
                {includeInExport ? "Remove from export" : "Add comparison to export"}
              </button>
            )}
          </div>
        </div>
        <div className={styles.compareStats}>
          <div className={styles.compareStatCard}>
            <span className={styles.compareStatValue}>{differingMetadataCount}</span>
            <span className={styles.compareStatLabel}>metadata fields differ</span>
          </div>
          <div className={styles.compareStatCard}>
            <span className={styles.compareStatValue}>{sharedMetadataCount}</span>
            <span className={styles.compareStatLabel}>metadata fields match</span>
          </div>
          <div className={styles.compareStatCard}>
            <span className={styles.compareStatValue}>{differingNarrativeCount}</span>
            <span className={styles.compareStatLabel}>narrative sections differ</span>
          </div>
        </div>
      </div>

      {allRows.length > 0 ? (
        <section className={styles.comparePanel}>
          <div className={styles.comparePanelHeader}>
            <div>
              <div className={styles.comparePanelTitle}>Differences heatmap</div>
              <div className={styles.comparePanelHint}>
                Click any cell to open a detailed side-by-side comparison of two documents.
              </div>
            </div>
            <div className={styles.heatmapLegend}>
              <span className={styles.heatmapLegendItem}>
                <span className={`${styles.heatmapDot} ${styles.heatmapDotMatch}`} /> Same
              </span>
              <span className={styles.heatmapLegendItem}>
                <span className={`${styles.heatmapDot} ${styles.heatmapDotDiff}`} /> Differs
              </span>
              <span className={styles.heatmapLegendItem}>
                <span className={`${styles.heatmapDot} ${styles.heatmapDotEmpty}`} /> N/A
              </span>
            </div>
          </div>

          <div className={styles.heatmapContainer}>
            <table className={styles.heatmapTable}>
              <thead>
                <tr>
                  <th className={styles.heatmapCorner}>Field</th>
                  {cases.map((doc) => {
                    const heading = getCompareDocumentHeading(doc);
                    const label = heading.eyebrow;
                    return (
                      <th key={doc.id} className={styles.heatmapDocHeader} title={`${heading.eyebrow}: ${heading.title}`}>
                        <div className={styles.heatmapDocLabel}>{label}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {metadataRows.length > 0 && (
                  <tr className={styles.heatmapGroupRow}>
                    <td colSpan={cases.length + 1} className={styles.heatmapGroupCell}>Metadata</td>
                  </tr>
                )}
                {metadataRows.map((row) => (
                  <tr key={row.id} className={styles.heatmapRow}>
                    <th scope="row" className={styles.heatmapFieldLabel}>
                      <span className={styles.heatmapFieldName}>{row.label}</span>
                      <span className={`${styles.heatmapFieldBadge} ${row.isDifferent ? styles.heatmapFieldBadgeDiff : styles.heatmapFieldBadgeSame}`}>
                        {row.isDifferent ? "Differs" : "Same"}
                      </span>
                    </th>
                    {cases.map((doc, colIdx) => {
                      const status = getCellStatus(row, colIdx);
                      return (
                        <td
                          key={`${row.id}-${doc.id}`}
                          className={styles.heatmapCell}
                          onClick={() => onCellClick(doc.id)}
                          title={`${row.label}: ${row.values[colIdx]}`}
                          aria-label={`${row.label}, ${getDocumentLabel(doc)}: ${status}`}
                        >
                          <span className={`${styles.heatmapDot} ${
                            status === "diff" ? styles.heatmapDotDiff
                              : status === "match" ? styles.heatmapDotMatch
                              : styles.heatmapDotEmpty
                          }`} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {narrativeRows.length > 0 && (
                  <tr className={styles.heatmapGroupRow}>
                    <td colSpan={cases.length + 1} className={styles.heatmapGroupCell}>Narrative Sections</td>
                  </tr>
                )}
                {narrativeRows.map((row) => (
                  <tr key={row.id} className={styles.heatmapRow}>
                    <th scope="row" className={styles.heatmapFieldLabel}>
                      <span className={styles.heatmapFieldName}>{row.label}</span>
                      <span className={`${styles.heatmapFieldBadge} ${row.isDifferent ? styles.heatmapFieldBadgeDiff : styles.heatmapFieldBadgeSame}`}>
                        {row.isDifferent ? "Differs" : "Same"}
                      </span>
                    </th>
                    {cases.map((doc, colIdx) => {
                      const status = getCellStatus(row, colIdx);
                      return (
                        <td
                          key={`${row.id}-${doc.id}`}
                          className={styles.heatmapCell}
                          onClick={() => onCellClick(doc.id)}
                          title={`${row.label}: ${String(row.values[colIdx]).substring(0, 120)}${String(row.values[colIdx]).length > 120 ? "…" : ""}`}
                          aria-label={`${row.label}, ${getDocumentLabel(doc)}: ${status}`}
                        >
                          <span className={`${styles.heatmapDot} ${
                            status === "diff" ? styles.heatmapDotDiff
                              : status === "match" ? styles.heatmapDotMatch
                              : styles.heatmapDotEmpty
                          }`} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className={styles.compareEmpty}>
          <div className={styles.compareEmptyTitle}>Nothing to compare yet</div>
          <p className={styles.compareEmptyText}>
            Turn on metadata fields or sections in the left panel to populate the comparison view.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── AI Compare Assistant ────────────────────────────── */

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function simulateAIAnswer(question, leftDoc, rightDoc, narrativeRows) {
  const leftLabel = getDocumentLabel(leftDoc);
  const rightLabel = getDocumentLabel(rightDoc);
  const q = question.toLowerCase();

  // Build context from narrative sections
  const differingSections = narrativeRows.filter((r) => r.isDifferent).map((r) => r.label);
  const sameSections = narrativeRows.filter((r) => !r.isDifferent).map((r) => r.label);

  if (q.includes("differ") || q.includes("different") || q.includes("difference")) {
    const diffs = differingSections.length > 0
      ? differingSections.join(", ")
      : "no narrative sections";
    return `The two documents differ in the following narrative sections: ${diffs}.\n\n` +
      (differingSections.length > 0
        ? narrativeRows
            .filter((r) => r.isDifferent)
            .map((r) => `**${r.label}:**\n• ${leftLabel}: "${String(r.values[0]).substring(0, 150)}…"\n• ${rightLabel}: "${String(r.values[1]).substring(0, 150)}…"`)
            .join("\n\n")
        : "Both documents share identical content across all enabled narrative sections.");
  }

  if (q.includes("similar") || q.includes("common") || q.includes("same") || q.includes("share")) {
    return sameSections.length > 0
      ? `Both documents share the same content in: ${sameSections.join(", ")}.\n\nThis suggests common ground in these areas, which could indicate shared legal principles or factual circumstances.`
      : "The two documents do not share identical content in any of the enabled narrative sections.";
  }

  if (q.includes("summary") || q.includes("summarize") || q.includes("summarise") || q.includes("overview")) {
    const total = narrativeRows.length;
    const diffCount = differingSections.length;
    return `**Comparison summary: ${leftLabel} vs ${rightLabel}**\n\n` +
      `Out of ${total} narrative section${total !== 1 ? "s" : ""}, ${diffCount} differ${diffCount === 1 ? "s" : ""} and ${total - diffCount} match${total - diffCount === 1 ? "es" : ""}.\n\n` +
      (diffCount > 0 ? `Key differences appear in: ${differingSections.join(", ")}.\n\n` : "") +
      narrativeRows
        .slice(0, 3)
        .map((r) => `**${r.label}** — ${r.isDifferent ? "Differs" : "Same"}${r.isDifferent ? `: the first document focuses on "${String(r.values[0]).substring(0, 80)}…" while the second addresses "${String(r.values[1]).substring(0, 80)}…"` : ""}`)
        .join("\n\n");
  }

  if (q.includes("argument") || q.includes("appellant") || q.includes("respondent")) {
    const relevantRows = narrativeRows.filter(
      (r) => r.label.toLowerCase().includes("argument") || r.label.toLowerCase().includes("appellant") || r.label.toLowerCase().includes("respondent")
    );
    if (relevantRows.length > 0) {
      return relevantRows
        .map((r) => `**${r.label}** (${r.isDifferent ? "Differs" : "Same"}):\n• ${leftLabel}: "${String(r.values[0]).substring(0, 200)}…"\n• ${rightLabel}: "${String(r.values[1]).substring(0, 200)}…"`)
        .join("\n\n");
    }
  }

  if (q.includes("finding") || q.includes("decision") || q.includes("outcome") || q.includes("ruling")) {
    const relevantRows = narrativeRows.filter(
      (r) => r.label.toLowerCase().includes("finding") || r.label.toLowerCase().includes("decision")
    );
    if (relevantRows.length > 0) {
      return relevantRows
        .map((r) => `**${r.label}** (${r.isDifferent ? "Differs" : "Same"}):\n• ${leftLabel}: "${String(r.values[0]).substring(0, 200)}…"\n• ${rightLabel}: "${String(r.values[1]).substring(0, 200)}…"`)
        .join("\n\n");
    }
  }

  // Default: general comparison
  return `**Comparing ${leftLabel} and ${rightLabel}**\n\n` +
    `Across ${narrativeRows.length} narrative section${narrativeRows.length !== 1 ? "s" : ""}, ` +
    `${differingSections.length} show${differingSections.length === 1 ? "s" : ""} differences` +
    (differingSections.length > 0 ? ` (${differingSections.join(", ")})` : "") +
    ` and ${sameSections.length} match` +
    (sameSections.length > 0 ? ` (${sameSections.join(", ")})` : "") +
    `.\n\nTo dive deeper, try asking about specific sections like "How do the appellant's arguments differ?" or "Summarize the tribunal findings."`;
}

function CompareAIAssistant({ leftDoc, rightDoc, narrativeRows }) {
  const [question, setQuestion] = useState("");
  const [conversations, setConversations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editText, setEditText] = useState("");
  const inputRef = useRef(null);

  const suggestedQuestions = [
    "Summarize the key differences between these documents",
    "What do these documents have in common?",
    "Compare the appellant's arguments",
    "How do the tribunal findings differ?",
  ];

  const handleAsk = (q) => {
    const queryText = q || question.trim();
    if (!queryText || isGenerating) return;

    setIsGenerating(true);
    setQuestion("");

    // Simulate AI delay
    const answer = simulateAIAnswer(queryText, leftDoc, rightDoc, narrativeRows);
    setTimeout(() => {
      setConversations((prev) => [...prev, { question: queryText, answer, editedAnswer: null }]);
      setIsGenerating(false);
    }, 600 + Math.random() * 800);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const startEdit = (idx) => {
    setEditingIdx(idx);
    setEditText(conversations[idx].editedAnswer || conversations[idx].answer);
  };

  const saveEdit = (idx) => {
    setConversations((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, editedAnswer: editText } : c))
    );
    setEditingIdx(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingIdx(null);
    setEditText("");
  };

  return (
    <section className={styles.comparePanel}>
      <div className={styles.comparePanelHeader}>
        <div>
          <div className={styles.comparePanelTitle}>
            <span className={styles.aiTitleIcon}><SparkleIcon /></span>
            AI Narrative Analysis
          </div>
          <div className={styles.comparePanelHint}>
            Ask a question about these documents and get an AI-generated comparison. You can edit any response.
          </div>
        </div>
      </div>

      <div className={styles.aiBody}>
        {/* Suggested questions — show when no conversations yet */}
        {conversations.length === 0 && !isGenerating && (
          <div className={styles.aiSuggestions}>
            <div className={styles.aiSuggestionsLabel}>Suggested questions</div>
            <div className={styles.aiSuggestionsGrid}>
              {suggestedQuestions.map((sq) => (
                <button
                  key={sq}
                  className={styles.aiSuggestionBtn}
                  onClick={() => handleAsk(sq)}
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation thread */}
        {conversations.map((conv, idx) => (
          <div key={idx} className={styles.aiConversation}>
            <div className={styles.aiQuestion}>
              <div className={styles.aiQuestionLabel}>You asked</div>
              <div className={styles.aiQuestionText}>{conv.question}</div>
            </div>
            <div className={styles.aiAnswer}>
              <div className={styles.aiAnswerHeader}>
                <div className={styles.aiAnswerLabel}>
                  <SparkleIcon /> AI Analysis
                  {conv.editedAnswer && <span className={styles.aiEditedBadge}>Edited</span>}
                </div>
                {editingIdx !== idx && (
                  <button className={styles.aiEditBtn} onClick={() => startEdit(idx)}>
                    <PencilIcon /> Edit
                  </button>
                )}
              </div>
              {editingIdx === idx ? (
                <div className={styles.aiEditArea}>
                  <textarea
                    className={styles.aiEditTextarea}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={8}
                  />
                  <div className={styles.aiEditActions}>
                    <button className={styles.aiEditSaveBtn} onClick={() => saveEdit(idx)}>Save</button>
                    <button className={styles.aiEditCancelBtn} onClick={cancelEdit}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className={styles.aiAnswerBody}>
                  {(conv.editedAnswer || conv.answer).split("\n").map((line, i) => (
                    <p key={i} className={line.startsWith("**") ? styles.aiAnswerBold : ""}>
                      {line.replace(/\*\*/g, "")}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isGenerating && (
          <div className={styles.aiGenerating}>
            <div className={styles.aiGeneratingDots}>
              <span /><span /><span />
            </div>
            <span>Analyzing documents...</span>
          </div>
        )}

        {/* Input bar — always visible at bottom */}
        <div className={styles.aiInputBar}>
          <input
            ref={inputRef}
            type="text"
            className={styles.aiInput}
            placeholder="Ask a question about these two documents..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
          />
          <button
            className={styles.aiSendBtn}
            onClick={() => handleAsk()}
            disabled={!question.trim() || isGenerating}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

function PairwiseDetail({
  cases,
  metaFields,
  sections,
  leftDocId,
  rightDocId,
  onChangeLeft,
  onChangeRight,
  onSwap,
  onBack,
}) {
  const leftDoc = cases.find((c) => c.id === leftDocId) || cases[0];
  const rightDoc = cases.find((c) => c.id === rightDocId) || cases[1];
  const pair = [leftDoc, rightDoc].filter(Boolean);
  const [metadataExpanded, setMetadataExpanded] = useState(false);

  const {
    metadataRows,
    narrativeRows,
  } = pair.length === 2 ? getComparisonRows(pair, metaFields, sections) : { metadataRows: [], narrativeRows: [] };

  const differCount = metadataRows.filter((r) => r.isDifferent).length;

  return (
    <div className={styles.compareWorkspace}>
      {/* Picker header */}
      <div className={styles.pairwiseHeader}>
        <button className={styles.pairwiseBackBtn} onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
          </svg>
          Heatmap overview
        </button>
        <div className={styles.pairwisePickerRow}>
          <select
            className={styles.pairwisePicker}
            value={leftDoc?.id || ""}
            onChange={(e) => onChangeLeft(e.target.value)}
          >
            {cases.map((doc) => (
              <option key={doc.id} value={doc.id} disabled={doc.id === rightDoc?.id}>
                {getDocumentLabel(doc)}
              </option>
            ))}
          </select>
          <button className={styles.pairwiseSwapBtn} onClick={onSwap} title="Swap documents">
            <SwapIcon />
          </button>
          <select
            className={styles.pairwisePicker}
            value={rightDoc?.id || ""}
            onChange={(e) => onChangeRight(e.target.value)}
          >
            {cases.map((doc) => (
              <option key={doc.id} value={doc.id} disabled={doc.id === leftDoc?.id}>
                {getDocumentLabel(doc)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* AI Narrative Analysis — shown first, prominently */}
      {pair.length === 2 && narrativeRows.length > 0 && (
        <CompareAIAssistant
          leftDoc={leftDoc}
          rightDoc={rightDoc}
          narrativeRows={narrativeRows}
        />
      )}

      {/* Metadata comparison — collapsible, below AI analysis */}
      {metadataRows.length > 0 && (
        <section className={styles.comparePanel}>
          <button
            className={styles.comparePanelHeaderToggle}
            onClick={() => setMetadataExpanded((v) => !v)}
            aria-expanded={metadataExpanded}
          >
            <div>
              <div className={styles.comparePanelTitle}>
                Metadata comparison
                <span className={styles.metadataBadge}>
                  {differCount} differ{differCount !== 1 ? "" : "s"} &middot; {metadataRows.length} fields
                </span>
              </div>
              <div className={styles.comparePanelHint}>
                Side-by-side view of the two selected documents.
              </div>
            </div>
            <svg
              className={`${styles.collapseChevron} ${metadataExpanded ? styles.collapseChevronOpen : ""}`}
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {metadataExpanded && (
            <div className={styles.compareMatrix}>
              <table className={styles.compareTable}>
                <thead>
                  <tr>
                    <th className={styles.compareCorner}>Field</th>
                    {pair.map((doc) => {
                      const heading = getCompareDocumentHeading(doc);
                      return (
                        <th key={doc.id} className={styles.compareDocHeader}>
                          <div className={styles.compareDocEyebrow}>{heading.eyebrow}</div>
                          <div className={styles.compareDocTitle}>{heading.title}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {metadataRows.map((row) => (
                    <tr key={row.id} className={row.isDifferent ? styles.compareDiffRow : ""}>
                      <th scope="row" className={styles.compareFieldLabel}>
                        <div className={styles.compareFieldName}>{row.label}</div>
                        <span
                          className={`${styles.compareFieldState} ${
                            row.isDifferent ? styles.compareFieldStateDiff : styles.compareFieldStateSame
                          }`}
                        >
                          {row.isDifferent ? "Differs" : "Same"}
                        </span>
                      </th>
                      {row.values.map((value, index) => (
                        <td
                          key={`${row.id}-${pair[index].id}`}
                          className={`${styles.compareCell} ${
                            row.isDifferent ? styles.compareCellDiff : styles.compareCellSame
                          }`}
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {metadataRows.length === 0 && narrativeRows.length === 0 && (
        <div className={styles.compareEmpty}>
          <div className={styles.compareEmptyTitle}>Nothing to compare yet</div>
          <p className={styles.compareEmptyText}>
            Turn on metadata fields or sections in the left panel to populate the comparison view.
          </p>
        </div>
      )}
    </div>
  );
}

function ComparisonMatrix({
  cases,
  metaFields,
  sections,
  docTypeLabel,
  includeInExport = false,
  onToggleInclude = null,
}) {
  const [compareView, setCompareView] = useState("pairwise"); // "overview" | "pairwise"
  const [leftDocId, setLeftDocId] = useState(cases[0]?.id || null);
  const [rightDocId, setRightDocId] = useState(cases[1]?.id || null);

  // Reset doc selections if cases change and selected docs are no longer available
  const caseIds = useMemo(() => new Set(cases.map((c) => c.id)), [cases]);
  const safeLeftId = caseIds.has(leftDocId) ? leftDocId : cases[0]?.id || null;
  const safeRightId = caseIds.has(rightDocId) && rightDocId !== safeLeftId ? rightDocId : cases.find((c) => c.id !== safeLeftId)?.id || null;

  if (safeLeftId !== leftDocId) setLeftDocId(safeLeftId);
  if (safeRightId !== rightDocId) setRightDocId(safeRightId);

  if (cases.length < 2) {
    return (
      <div className={styles.compareEmpty}>
        <div className={styles.compareEmptyTitle}>Compare Documents</div>
        <p className={styles.compareEmptyText}>Select at least 2 documents to compare.</p>
      </div>
    );
  }

  const {
    metadataRows,
    narrativeRows,
    differingMetadataCount,
    sharedMetadataCount,
    differingNarrativeCount,
  } = getComparisonRows(cases, metaFields, sections);
  const docLabel = `${docTypeLabel} document${cases.length !== 1 ? "s" : ""}`;

  const handleCellClick = (docId) => {
    // Set the clicked doc as the right doc, keep current left (or pick first other doc)
    const newRight = docId;
    const newLeft = safeLeftId === docId ? cases.find((c) => c.id !== docId)?.id || null : safeLeftId;
    setLeftDocId(newLeft);
    setRightDocId(newRight);
    setCompareView("pairwise");
  };

  const handleSwap = () => {
    setLeftDocId(safeRightId);
    setRightDocId(safeLeftId);
  };

  if (compareView === "pairwise") {
    return (
      <PairwiseDetail
        cases={cases}
        metaFields={metaFields}
        sections={sections}
        leftDocId={safeLeftId}
        rightDocId={safeRightId}
        onChangeLeft={setLeftDocId}
        onChangeRight={setRightDocId}
        onSwap={handleSwap}
        onBack={() => setCompareView("overview")}
      />
    );
  }

  return (
    <HeatmapOverview
      cases={cases}
      metadataRows={metadataRows}
      narrativeRows={narrativeRows}
      differingMetadataCount={differingMetadataCount}
      sharedMetadataCount={sharedMetadataCount}
      differingNarrativeCount={differingNarrativeCount}
      docLabel={docLabel}
      includeInExport={includeInExport}
      onToggleInclude={onToggleInclude}
      onCellClick={handleCellClick}
    />
  );
}

/* ─── Main Report Page ──────────────────────────────────── */

function ComparisonAppendix({ cases, metaFields, sections, docTypeLabel }) {
  if (cases.length < 2) return null;

  const {
    metadataRows,
    narrativeRows,
    differingMetadataCount,
    sharedMetadataCount,
    differingNarrativeCount,
  } = getComparisonRows(cases, metaFields, sections);

  if (metadataRows.length === 0 && narrativeRows.length === 0) return null;

  return (
    <section className={styles.compareAppendix}>
      <div className={styles.compareAppendixHeader}>
        <div className={styles.compareAppendixEyebrow}>Appendix</div>
        <div className={styles.compareAppendixTitle}>Comparison Summary</div>
        <p className={styles.compareAppendixIntro}>
          Side-by-side comparison of the selected {docTypeLabel.toLowerCase()} documents.
        </p>
      </div>

      <div className={styles.compareAppendixStats}>
        <div className={styles.compareAppendixStat}>
          <span className={styles.compareAppendixStatValue}>{differingMetadataCount}</span>
          <span className={styles.compareAppendixStatLabel}>metadata fields differ</span>
        </div>
        <div className={styles.compareAppendixStat}>
          <span className={styles.compareAppendixStatValue}>{sharedMetadataCount}</span>
          <span className={styles.compareAppendixStatLabel}>metadata fields match</span>
        </div>
        <div className={styles.compareAppendixStat}>
          <span className={styles.compareAppendixStatValue}>{differingNarrativeCount}</span>
          <span className={styles.compareAppendixStatLabel}>narrative sections differ</span>
        </div>
      </div>

      {metadataRows.length > 0 && (
        <div className={styles.compareAppendixBlock}>
          <div className={styles.compareAppendixBlockTitle}>Metadata comparison</div>
          <div className={styles.compareAppendixTableWrap}>
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
          </div>
        </div>
      )}

      {narrativeRows.length > 0 && (
        <div className={styles.compareAppendixBlock}>
          <div className={styles.compareAppendixBlockTitle}>Narrative comparison</div>
          <div className={styles.compareAppendixSections}>
            {narrativeRows.map((row) => (
              <section key={row.id} className={styles.compareAppendixSection}>
                <div className={styles.compareAppendixSectionHeader}>
                  <div className={styles.compareAppendixSectionTitle}>{row.label}</div>
                  <span
                    className={`${styles.compareAppendixBadge} ${
                      row.isDifferent ? styles.compareAppendixBadgeDiff : styles.compareAppendixBadgeSame
                    }`}
                  >
                    {row.isDifferent ? "Different" : "Same"}
                  </span>
                </div>
                <div className={styles.compareAppendixSectionGrid}>
                  {cases.map((doc, index) => (
                    <div key={`${row.id}-${doc.id}`} className={styles.compareAppendixCard}>
                      <div className={styles.compareAppendixCardTitle}>{getDocumentLabel(doc)}</div>
                      <div className={styles.compareAppendixCardBody}>{row.values[index]}</div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

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

  const initialMode = useMemo(() => {
    try {
      const mode = sessionStorage.getItem("reportMode");
      sessionStorage.removeItem("reportMode");
      return mode === "compare" ? "compare" : "report";
    } catch {
      return "report";
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
  const [viewTab, setViewTab] = useState(initialMode); // "report" | "compare"
  const [includeComparisonAppendix, setIncludeComparisonAppendix] = useState(initialMode === "compare");
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
  const sourceContextLabel = isSelectionSource ? "One-time export" : "Recurring subscription";
  const sourceLabel = isSelectionSource
    ? `${caseEntries.length} hand-picked document${caseEntries.length !== 1 ? "s" : ""}`
    : reportSource?.query
      ? `Search: "${reportSource.query}"`
      : "Current search";
  const headerCountLabel = isSelectionSource
    ? `${caseEntries.length} selected document${caseEntries.length !== 1 ? "s" : ""}`
    : `Subscription · ${caseEntries.length} document${caseEntries.length !== 1 ? "s" : ""}`;
  const canSubscribe = !isSelectionSource;

  const includedCases = useMemo(
    () => caseEntries.filter((c) => includedCaseIds.has(c.id)),
    [caseEntries, includedCaseIds]
  );
  const canCompare = includedCases.length >= 2;
  const shouldIncludeComparisonAppendix = includeComparisonAppendix && canCompare;
  const activeViewTab = canCompare ? viewTab : "report";

  const openCompareView = () => {
    if (!canCompare) return;
    setViewTab("compare");
  };

  const openCompareFromExport = () => {
    setReportStep(1);
    if (canCompare) {
      openCompareView();
    }
  };

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

  // Delivery state — default to subscription for search-based, one-off for selection
  const [deliveryMode, setDeliveryMode] = useState(isSelectionSource ? "one-off" : "subscription"); // "one-off" | "subscription"
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
      {/* Mode indicator removed — shown in config panel instead */}

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
                {/* Source Card — prominent mode indicator */}
                <div className={`${styles.configSection} ${styles.sourceSection}`}>
                  <div className={styles.sourceCard}>
                    <div className={styles.sourceCardTop}>
                      <div>
                        <div className={styles.sourceEyebrow}>
                          {isSelectionSource ? "One-Time Export" : "Search Subscription"}
                        </div>
                        <div className={styles.sourceTitle}>{sourceLabel}</div>
                      </div>
                      <span className={`${styles.sourceBadge} ${isSelectionSource ? styles.sourceBadgeSelection : styles.sourceBadgeSearch}`}>
                        {isSelectionSource ? "One-time" : "Recurring"}
                      </span>
                    </div>
                    <div className={styles.sourceMetaRow}>
                      <span>{docTypeLabel}</span>
                      <span>{sourceContextLabel}</span>
                    </div>
                    {!isSelectionSource && (
                      <p className={styles.sourceNote}>
                        This report will automatically include up to {MAX_REPORT_DOCS} of the most recent documents matching your search filters each time it is generated.
                      </p>
                    )}
                    {canCompare && (
                      <div className={styles.sourceCompareHint}>
                        <div className={styles.sourceCompareHintTitle}>Comparison available</div>
                        <div className={styles.sourceCompareHintText}>
                          You can export the report and append a side-by-side comparison of the {includedCases.length} selected documents.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

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
                    <span className={styles.csNum}>D</span> Report Sections
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
                    <span className={styles.csNum}>C</span> Metadata Fields
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

                <div className={`${styles.configSection} ${styles.comparisonAppendixSection}`}>
                  <div className={styles.configSectionTitle}>
                    <span className={styles.csNum}>B</span> Compare Documents
                  </div>
                  <p className={styles.configHint}>
                    Add a side-by-side comparison to the end of the exported report when 2 or more documents are selected.
                  </p>
                  <div className={`${styles.compareConfigCard} ${!canCompare ? styles.compareConfigCardDisabled : ""}`}>
                    <div className={styles.compareConfigTop}>
                      <div>
                        <div className={styles.compareConfigTitle}>Add comparison to export</div>
                        <div className={styles.compareConfigText}>
                          {canCompare
                            ? "The exported report can end with a comparison appendix based on the metadata fields and narrative sections you enabled."
                            : "Select at least 2 documents to unlock comparison in the builder."}
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={shouldIncludeComparisonAppendix}
                        onChange={() => setIncludeComparisonAppendix((prev) => !prev)}
                        disabled={!canCompare}
                      />
                    </div>
                    {canCompare ? (
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
                        <button
                          className={styles.comparePreviewBtn}
                          onClick={openCompareView}
                        >
                          Open compare preview
                        </button>
                      </div>
                    ) : (
                      <div className={styles.compareConfigEmpty}>
                        Comparison becomes available once two documents are included.
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents */}
                {isSelectionSource && <div className={`${styles.configSection} ${styles.selectedDocumentsSection}`}>
                  <div className={styles.configSectionTitle}>
                    <span className={styles.csNum}>E</span> Selected Documents ({includedCases.length}/{MAX_REPORT_DOCS})
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

            {/* Right: Live preview */}
            <div className={styles.configRight}>
              {/* View mode tabs */}
              <div className={styles.viewTabBar}>
                <button
                  className={`${styles.viewTab} ${activeViewTab === "report" ? styles.viewTabActive : ""}`}
                  onClick={() => setViewTab("report")}
                >
                  Report Preview
                </button>
                <button
                  className={`${styles.viewTab} ${activeViewTab === "compare" ? styles.viewTabActive : ""}`}
                  onClick={openCompareView}
                  disabled={!canCompare}
                  title={!canCompare ? "Select at least 2 documents to compare" : undefined}
                >
                  Compare Documents
                </button>
              </div>

              {activeViewTab === "report" ? (
                <div className={styles.previewCanvas}>
                  {canCompare && (
                    <div
                      className={`${styles.comparePreviewNotice} ${
                        shouldIncludeComparisonAppendix ? styles.comparePreviewNoticeActive : ""
                      }`}
                    >
                      <div>
                        <div className={styles.comparePreviewNoticeTitle}>
                          {shouldIncludeComparisonAppendix
                            ? "This export will include a comparison appendix."
                            : "This report can also include a comparison appendix."}
                        </div>
                        <div className={styles.comparePreviewNoticeText}>
                          {shouldIncludeComparisonAppendix
                            ? "The exported report will end with a side-by-side comparison of the selected documents."
                            : "Turn it on from the left panel if you want the report to end with a side-by-side comparison section."}
                        </div>
                      </div>
                      <button
                        className={styles.comparePreviewNoticeBtn}
                        onClick={openCompareView}
                      >
                        Open compare preview
                      </button>
                    </div>
                  )}
                  {!isSelectionSource && (
                    <div className={styles.subscriptionPreviewBanner}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <div>
                        <div className={styles.subscriptionBannerTitle}>Subscription Preview</div>
                        <div className={styles.subscriptionBannerDesc}>
                          Showing a sample of current results. Each report cycle will auto-select up to {MAX_REPORT_DOCS} most recent matching documents.
                        </div>
                      </div>
                    </div>
                  )}
                  {isSelectionSource && (
                    <div className={styles.previewSourceBar}>
                      <div className={styles.previewSourceTop}>
                        <div className={styles.sourceBarLabel}>Selected Documents</div>
                        <span className={`${styles.sourceBadge} ${styles.sourceBadgeSelection}`}>
                          One-time export
                        </span>
                      </div>
                      <div className={styles.sourceBarMain}>
                        <span className={styles.sourceBarTitle}>{sourceLabel}</span>
                        <span className={styles.sourceBarDot}>•</span>
                        <span className={styles.sourceBarMeta}>{docTypeLabel}</span>
                      </div>
                    </div>
                  )}
                  <DocumentPreview
                    title={reportTitle}
                    subtitle={reportSubtitle}
                    logoUrl={logoUrl}
                    sections={sections}
                    metaFields={selectedMetaFields}
                    cases={includedCases}
                    onRemove={isSelectionSource ? removeCase : null}
                    includeComparisonAppendix={shouldIncludeComparisonAppendix}
                    docTypeLabel={docTypeLabel}
                  />
                </div>
              ) : (
                <div className={styles.previewCanvas}>
                  <ComparisonMatrix
                    cases={includedCases}
                    metaFields={selectedMetaFields}
                    sections={sections}
                    docTypeLabel={docTypeLabel}
                    includeInExport={shouldIncludeComparisonAppendix}
                    onToggleInclude={() => setIncludeComparisonAppendix((prev) => !prev)}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Step 2: Save & Export ── */
          <div className={styles.deliveryLayout}>
            <div className={styles.deliveryPanel}>
              {/* Report type choice — tailored per mode */}
              <div className={styles.deliveryCard}>
                <div className={styles.deliveryCardTitle}>
                  {isSelectionSource ? "Export Report" : "Delivery Schedule"}
                </div>
                <p className={styles.deliveryCardHint}>
                  {isSelectionSource
                    ? `Export your ${includedCases.length} selected document${includedCases.length !== 1 ? "s" : ""} as a one-time report.`
                    : "Choose whether to receive this report once or on a recurring schedule."}
                </p>
                {shouldIncludeComparisonAppendix && (
                  <div className={styles.deliveryConstraint}>
                    This export will include a comparison appendix after the selected documents.
                  </div>
                )}
                {canSubscribe ? (
                  <div className={styles.deliveryOptions}>
                    <label className={`${styles.deliveryOption} ${deliveryMode === "subscription" ? styles.deliveryOptionSelected : ""}`}>
                      <input type="radio" name="deliveryMode" value="subscription" checked={deliveryMode === "subscription"} onChange={() => selectDeliveryMode("subscription")} className={styles.deliveryRadio} />
                      <div className={styles.deliveryOptionContent}>
                        <div className={styles.deliveryOptionIcon}>
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        </div>
                        <div>
                          <div className={styles.deliveryOptionLabel}>Subscription</div>
                          <div className={styles.deliveryOptionDesc}>Automatically rerun this search and receive updated reports on a schedule</div>
                        </div>
                      </div>
                    </label>
                    <label className={`${styles.deliveryOption} ${deliveryMode === "one-off" ? styles.deliveryOptionSelected : ""}`}>
                      <input type="radio" name="deliveryMode" value="one-off" checked={deliveryMode === "one-off"} onChange={() => selectDeliveryMode("one-off")} className={styles.deliveryRadio} />
                      <div className={styles.deliveryOptionContent}>
                        <div className={styles.deliveryOptionIcon}>
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <div>
                          <div className={styles.deliveryOptionLabel}>One-off Snapshot</div>
                          <div className={styles.deliveryOptionDesc}>Download a one-time snapshot with the current {includedCases.length} document{includedCases.length !== 1 ? "s" : ""}</div>
                        </div>
                      </div>
                    </label>
                  </div>
                ) : null}
              </div>

              {canCompare && (
                <div className={styles.deliveryCard}>
                  <div className={styles.deliveryCardTitle}>Comparison Appendix</div>
                  <p className={styles.deliveryCardHint}>
                    Decide whether the exported report should end with a side-by-side comparison of the selected documents.
                  </p>
                  <div className={styles.compareConfigCard}>
                    <div className={styles.compareConfigTop}>
                      <div>
                        <div className={styles.compareConfigTitle}>Add comparison to export</div>
                        <div className={styles.compareConfigText}>
                          This uses the metadata fields and narrative sections currently enabled in the builder.
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={shouldIncludeComparisonAppendix}
                        onChange={() => setIncludeComparisonAppendix((prev) => !prev)}
                      />
                    </div>
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
                      <button
                        className={styles.comparePreviewBtn}
                        onClick={openCompareFromExport}
                      >
                        Review compare view
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
                includeComparisonAppendix={shouldIncludeComparisonAppendix}
                docTypeLabel={docTypeLabel}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
