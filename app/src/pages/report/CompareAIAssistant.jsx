import { useState, useRef } from "react";
import { getDocumentLabel } from "./utils";
import { SparkleIcon, PencilIcon, PlusIcon, CheckIcon } from "./Icons";
import styles from "../ReportPage.module.css";

const SIMULATED_RESPONSE_DELAY_MS = 900;

function simulateAIAnswer(question, leftDoc, rightDoc, narrativeRows) {
  const leftLabel = getDocumentLabel(leftDoc);
  const rightLabel = getDocumentLabel(rightDoc);
  const q = question.toLowerCase();

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

  return `**Comparing ${leftLabel} and ${rightLabel}**\n\n` +
    `Across ${narrativeRows.length} narrative section${narrativeRows.length !== 1 ? "s" : ""}, ` +
    `${differingSections.length} show${differingSections.length === 1 ? "s" : ""} differences` +
    (differingSections.length > 0 ? ` (${differingSections.join(", ")})` : "") +
    ` and ${sameSections.length} match` +
    (sameSections.length > 0 ? ` (${sameSections.join(", ")})` : "") +
    `.\n\nTo dive deeper, try asking about specific sections like "How do the appellant's arguments differ?" or "Summarize the tribunal findings."`;
}

export default function CompareAIAssistant({ leftDoc, rightDoc, narrativeRows, onAddToReport }) {
  const [question, setQuestion] = useState("");
  const [conversations, setConversations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editText, setEditText] = useState("");
  const [addedToReport, setAddedToReport] = useState(new Set());
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

    const answer = simulateAIAnswer(queryText, leftDoc, rightDoc, narrativeRows);
    setTimeout(() => {
      setConversations((prev) => [...prev, { question: queryText, answer, editedAnswer: null }]);
      setIsGenerating(false);
    }, SIMULATED_RESPONSE_DELAY_MS);
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
                <>
                  <div className={styles.aiAnswerBody}>
                    {(conv.editedAnswer || conv.answer).split("\n").map((line, i) => (
                      <p key={i} className={line.startsWith("**") ? styles.aiAnswerBold : ""}>
                        {line.replace(/\*\*/g, "")}
                      </p>
                    ))}
                  </div>
                  {onAddToReport && (
                    <div className={styles.aiAnswerFooter}>
                      <button
                        className={`${styles.aiAddToReportBtn} ${addedToReport.has(idx) ? styles.aiAddToReportBtnAdded : ""}`}
                        onClick={() => {
                          if (!addedToReport.has(idx)) {
                            onAddToReport({
                              question: conv.question,
                              answer: conv.editedAnswer || conv.answer,
                            });
                            setAddedToReport((prev) => new Set(prev).add(idx));
                          }
                        }}
                        disabled={addedToReport.has(idx)}
                      >
                        {addedToReport.has(idx) ? (
                          <><CheckIcon /> Added to report</>
                        ) : (
                          <><PlusIcon /> Add to report</>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className={styles.aiGenerating}>
            <div className={styles.aiGeneratingDots}>
              <span /><span /><span />
            </div>
            <span>Analyzing documents...</span>
          </div>
        )}

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
