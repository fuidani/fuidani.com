import { useState, useRef, useEffect } from "react";
import { getDocumentLabel } from "./utils";
import { SparkleIcon, PencilIcon, PlusIcon, CheckIcon } from "./Icons";
import styles from "../ReportPage.module.css";

const SIMULATED_DELAY = 900;

function simulateReportAnswer(question, cases, sections) {
  const q = question.toLowerCase();
  const enabled = sections.filter((s) => s.enabled);
  const docs = cases.map((c) => ({
    label: getDocumentLabel(c),
    content: enabled.map((s) => (c[s.id] ? `${s.label}: ${String(c[s.id]).substring(0, 120)}` : null)).filter(Boolean),
    raw: c,
  }));

  if (q.includes("common") || q.includes("share") || q.includes("similar")) {
    const shared = enabled.filter((s) => {
      const vals = cases.map((c) => String(c[s.id] || "").trim().toLowerCase());
      return vals.length > 1 && vals.every((v) => v && v === vals[0]);
    }).map((s) => s.label);
    return shared.length > 0
      ? `Across all ${cases.length} documents, these sections share identical content: ${shared.join(", ")}.\n\nThis indicates common legal principles or shared factual foundations.`
      : `The ${cases.length} documents do not share identical content in any narrative section, though they may address similar legal themes.\n\n` +
        docs.slice(0, 3).map((d) => `**${d.label}** focuses on: ${d.content.slice(0, 2).join("; ")}`).join("\n\n");
  }

  if (q.includes("differ") || q.includes("difference") || q.includes("compare")) {
    const diffs = enabled.filter((s) => {
      const vals = cases.map((c) => String(c[s.id] || "").trim().toLowerCase());
      return vals.length > 1 && !vals.every((v) => v === vals[0]);
    });
    return `**Key differences across ${cases.length} documents:**\n\n` +
      (diffs.length > 0
        ? diffs.slice(0, 4).map((s) => `**${s.label}:**\n` + cases.slice(0, 3).map((c) => `  \u2022 ${getDocumentLabel(c)}: \u201c${String(c[s.id] || "\u2014").substring(0, 100)}\u2026\u201d`).join("\n")).join("\n\n")
        : "No significant narrative differences detected across the enabled sections.");
  }

  if (q.includes("summary") || q.includes("summarize") || q.includes("summarise") || q.includes("overview")) {
    return `**Report Summary \u2014 ${cases.length} Documents**\n\n` +
      docs.map((d) => `**${d.label}:**\n${d.content.slice(0, 3).map((c) => `  \u2022 ${c}`).join("\n")}`).join("\n\n") +
      `\n\nThe report covers ${enabled.length} section${enabled.length !== 1 ? "s" : ""} across ${cases.length} document${cases.length !== 1 ? "s" : ""}.`;
  }

  if (q.includes("argument") || q.includes("appellant") || q.includes("respondent") || q.includes("defense") || q.includes("prosecution")) {
    const rel = enabled.filter((s) => ["argument", "appellant", "respondent", "defense", "prosecution"].some((kw) => s.id.toLowerCase().includes(kw) || s.label.toLowerCase().includes(kw)));
    if (rel.length > 0) return rel.map((s) => `**${s.label}:**\n` + cases.slice(0, 4).map((c) => `  \u2022 ${getDocumentLabel(c)}: \u201c${String(c[s.id] || "\u2014").substring(0, 150)}\u2026\u201d`).join("\n")).join("\n\n");
  }

  if (q.includes("finding") || q.includes("holding") || q.includes("ruling") || q.includes("decision") || q.includes("outcome")) {
    const rel = enabled.filter((s) => ["finding", "holding", "ruling", "decision", "outcome"].some((kw) => s.id.toLowerCase().includes(kw) || s.label.toLowerCase().includes(kw)));
    if (rel.length > 0) return rel.map((s) => `**${s.label}:**\n` + cases.slice(0, 4).map((c) => `  \u2022 ${getDocumentLabel(c)}: \u201c${String(c[s.id] || "\u2014").substring(0, 180)}\u2026\u201d`).join("\n")).join("\n\n");
  }

  return `**Analysis of ${cases.length} documents:**\n\n` +
    docs.slice(0, 3).map((d) => `**${d.label}:** ${d.content[0] || "No narrative content."}`).join("\n\n") +
    "\n\nTry asking something specific, like \u201cSummarize the key differences\u201d or \u201cWhat do these have in common?\u201d";
}

const SUGGESTIONS = [
  "Summarize the document",
  "What are the topics in this document?",
];

export default function ReportAIChat({ cases, sections, onAddToReport, onClose }) {
  const [question, setQuestion] = useState("");
  const [conversations, setConversations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editText, setEditText] = useState("");
  const [addedToReport, setAddedToReport] = useState(new Set());
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [conversations, isGenerating]);

  const handleAsk = (q) => {
    const text = q || question.trim();
    if (!text || isGenerating) return;
    setIsGenerating(true);
    setQuestion("");
    const answer = simulateReportAnswer(text, cases, sections);
    setTimeout(() => {
      setConversations((prev) => [...prev, { question: text, answer, editedAnswer: null }]);
      setIsGenerating(false);
    }, SIMULATED_DELAY);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); }
  };

  const startEdit = (idx) => { setEditingIdx(idx); setEditText(conversations[idx].editedAnswer || conversations[idx].answer); };
  const saveEdit = (idx) => { setConversations((prev) => prev.map((c, i) => (i === idx ? { ...c, editedAnswer: editText } : c))); setEditingIdx(null); setEditText(""); };
  const cancelEdit = () => { setEditingIdx(null); setEditText(""); };

  return (
    <>
      {/* Header */}
      <div className={styles.rcHeader}>
        <div>
          <div className={styles.rcTitle}>Chat</div>
          <div className={styles.rcPowered}>Powered by JibuDocs</div>
        </div>
        <button className={styles.rcClose} onClick={onClose} aria-label="Close chat">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      {/* Thread */}
      <div className={styles.rcThread} ref={scrollRef}>
        {/* Welcome message */}
        <div className={styles.rcWelcome}>
          <span className={styles.rcWelcomeIcon}><SparkleIcon /></span>
          <div>
            <div className={styles.rcWelcomeName}>Assistant</div>
            <div className={styles.rcWelcomeText}>
              Hi there! How can I help you explore {cases.length === 1 ? "this document" : `these ${cases.length} documents`}?
            </div>
          </div>
        </div>

        {/* Suggestion chips — show only when no conversations */}
        {conversations.length === 0 && !isGenerating && (
          <div className={styles.rcChips}>
            {SUGGESTIONS.map((s) => (
              <button key={s} className={styles.rcChip} onClick={() => handleAsk(s)}>
                <SparkleIcon /> {s}
              </button>
            ))}
          </div>
        )}

        {/* Conversation */}
        {conversations.map((conv, idx) => (
          <div key={idx} className={styles.rcExchange}>
            {/* User question */}
            <div className={styles.rcUserRow}>
              <div className={styles.rcUserBubble}>{conv.question}</div>
            </div>

            {/* AI answer */}
            <div className={styles.rcAIRow}>
              <span className={styles.rcAIIcon}><SparkleIcon /></span>
              <div className={styles.rcAIContent}>
                <div className={styles.rcAIName}>
                  Assistant
                  {conv.editedAnswer && <span className={styles.rcEditedTag}>edited</span>}
                </div>

                {editingIdx === idx ? (
                  <div className={styles.rcEditWrap}>
                    <textarea className={styles.rcEditTa} value={editText} onChange={(e) => setEditText(e.target.value)} rows={5} />
                    <div className={styles.rcEditBar}>
                      <button className={styles.rcEditSave} onClick={() => saveEdit(idx)}>Save</button>
                      <button className={styles.rcEditCancel} onClick={cancelEdit}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.rcAIBody}>
                    {(conv.editedAnswer || conv.answer).split("\n").map((line, i) => (
                      <p key={i} className={line.startsWith("**") ? styles.rcBold : undefined}>
                        {line.replace(/\*\*/g, "")}
                      </p>
                    ))}
                  </div>
                )}

                {editingIdx !== idx && (
                  <div className={styles.rcActions}>
                    <button className={styles.rcActBtn} onClick={() => startEdit(idx)}>
                      <PencilIcon /> Edit
                    </button>
                    {onAddToReport && (
                      <button
                        className={`${styles.rcActBtn} ${addedToReport.has(idx) ? styles.rcActPinned : ""}`}
                        disabled={addedToReport.has(idx)}
                        onClick={() => {
                          if (!addedToReport.has(idx)) {
                            onAddToReport({ question: conv.question, answer: conv.editedAnswer || conv.answer });
                            setAddedToReport((prev) => new Set(prev).add(idx));
                          }
                        }}
                      >
                        {addedToReport.has(idx) ? <><CheckIcon /> Pinned</> : <><PlusIcon /> Pin to report</>}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className={styles.rcAIRow}>
            <span className={styles.rcAIIcon}><SparkleIcon /></span>
            <div className={styles.rcTyping}>
              <span /><span /><span />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className={styles.rcInputWrap}>
        <span className={styles.rcInputIcon}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          className={styles.rcInput}
          placeholder="Ask anything..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isGenerating}
        />
        <button
          className={styles.rcSend}
          onClick={() => handleAsk()}
          disabled={!question.trim() || isGenerating}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </>
  );
}
