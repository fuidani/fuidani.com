import { useState, useRef, useEffect } from "react";
import { getDocumentLabel } from "./utils";
import { SparkleIcon, PencilIcon, PlusIcon, CheckIcon } from "./Icons";
import { CaseRecord, ReportSection } from "../../data/sampleCases";

const SIMULATED_DELAY = 900;

interface Conversation {
  question: string;
  answer: string;
  editedAnswer: string | null;
}

interface Insight {
  question: string;
  answer: string;
}

interface ReportAIChatProps {
  cases: CaseRecord[];
  sections: ReportSection[];
  onAddToReport?: ((insight: Insight) => void) | null;
  onClose: () => void;
}

function simulateReportAnswer(question: string, cases: CaseRecord[], sections: ReportSection[]): string {
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

export default function ReportAIChat({ cases, sections, onAddToReport, onClose }: ReportAIChatProps) {
  const [question, setQuestion] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [addedToReport, setAddedToReport] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [conversations, isGenerating]);

  const handleAsk = (q?: string) => {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); }
  };

  const startEdit = (idx: number) => { setEditingIdx(idx); setEditText(conversations[idx].editedAnswer || conversations[idx].answer); };
  const saveEdit = (idx: number) => { setConversations((prev) => prev.map((c, i) => (i === idx ? { ...c, editedAnswer: editText } : c))); setEditingIdx(null); setEditText(""); };
  const cancelEdit = () => { setEditingIdx(null); setEditText(""); };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
        <div>
          <div className="text-sm font-bold text-slate-800">Chat</div>
          <div className="text-[10px] text-yellow-600 mt-px">Powered by JibuDocs</div>
        </div>
        <button
          className="w-7 h-7 rounded-md border-none bg-transparent text-slate-400 flex items-center justify-center cursor-pointer hover:bg-slate-100 hover:text-slate-500 transition-all duration-[120ms]"
          onClick={onClose}
          aria-label="Close chat"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1" ref={scrollRef}>
        {/* Welcome message */}
        <div className="flex gap-2.5 py-1 pb-2">
          <span className="w-7 h-7 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 flex-shrink-0 [&_svg]:w-[13px] [&_svg]:h-[13px]">
            <SparkleIcon />
          </span>
          <div>
            <div className="text-xs font-bold text-slate-800 mb-0.5">Assistant</div>
            <div className="text-xs text-slate-600 leading-[1.5]">
              Hi there! How can I help you explore {cases.length === 1 ? "this document" : `these ${cases.length} documents`}?
            </div>
          </div>
        </div>

        {/* Suggestion chips — show only when no conversations */}
        {conversations.length === 0 && !isGenerating && (
          <div className="flex flex-wrap gap-1.5 py-1 pb-2 pl-[38px]">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="inline-flex items-center gap-1 border border-gray-200 bg-white text-gray-700 text-[11px] font-medium px-2.5 py-[5px] rounded-md cursor-pointer transition-all duration-[120ms] leading-[1.3] hover:border-yellow-600 hover:bg-yellow-50 hover:text-amber-800 [&_svg]:w-[10px] [&_svg]:h-[10px] [&_svg]:text-yellow-600 [&_svg]:flex-shrink-0"
                onClick={() => handleAsk(s)}
              >
                <SparkleIcon /> {s}
              </button>
            ))}
          </div>
        )}

        {/* Conversation */}
        {conversations.map((conv, idx) => (
          <div key={idx} className="flex flex-col gap-2 py-2.5 [&+&]:border-t [&+&]:border-slate-100">
            {/* User question */}
            <div className="flex justify-end">
              <div className="max-w-[88%] bg-slate-100 text-slate-800 text-xs font-medium leading-[1.45] px-[11px] py-[7px] rounded-[10px_10px_2px_10px]">
                {conv.question}
              </div>
            </div>

            {/* AI answer */}
            <div className="flex gap-2">
              <span className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 flex-shrink-0 mt-px [&_svg]:w-[11px] [&_svg]:h-[11px]">
                <SparkleIcon />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-slate-800 mb-[3px] flex items-center gap-1.5">
                  Assistant
                  {conv.editedAnswer && (
                    <span className="text-[9px] font-semibold text-slate-400 bg-gray-100 px-1 rounded-sm">edited</span>
                  )}
                </div>

                {editingIdx === idx ? (
                  <div className="flex flex-col gap-[5px]">
                    <textarea
                      className="w-full text-[11px] leading-[1.55] text-slate-800 border border-gray-300 rounded-md px-2 py-1.5 resize-y font-[inherit] focus:outline-none focus:border-yellow-600 focus:shadow-[0_0_0_2px_rgba(202,138,4,0.1)]"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={5}
                    />
                    <div className="flex gap-[5px]">
                      <button
                        className="text-[10px] font-semibold px-2.5 py-[3px] rounded bg-slate-800 text-white border-none cursor-pointer hover:bg-slate-900"
                        onClick={() => saveEdit(idx)}
                      >
                        Save
                      </button>
                      <button
                        className="text-[10px] font-semibold px-2.5 py-[3px] rounded border border-gray-300 bg-white text-gray-500 cursor-pointer hover:bg-gray-50"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11.5px] leading-[1.6] text-slate-600 [&_p]:m-0 [&_p]:mb-[2px] [&_p:empty]:h-1">
                    {(conv.editedAnswer || conv.answer).split("\n").map((line, i) => (
                      <p key={i} className={line.startsWith("**") ? "font-semibold text-slate-800" : undefined}>
                        {line.replace(/\*\*/g, "")}
                      </p>
                    ))}
                  </div>
                )}

                {editingIdx !== idx && (
                  <div className="flex gap-0.5 mt-1">
                    <button
                      className="inline-flex items-center gap-[3px] text-[10px] font-semibold text-slate-400 bg-none border-none px-[5px] py-[2px] rounded cursor-pointer transition-all duration-[120ms] hover:text-slate-600 hover:bg-slate-50"
                      onClick={() => startEdit(idx)}
                    >
                      <PencilIcon /> Edit
                    </button>
                    {onAddToReport && (
                      <button
                        className={`inline-flex items-center gap-[3px] text-[10px] font-semibold bg-none border-none px-[5px] py-[2px] rounded cursor-pointer transition-all duration-[120ms] ${
                          addedToReport.has(idx)
                            ? "text-emerald-300 cursor-default"
                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                        }`}
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
          <div className="flex gap-2">
            <span className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 flex-shrink-0 mt-px [&_svg]:w-[11px] [&_svg]:h-[11px]">
              <SparkleIcon />
            </span>
            <div className="flex items-center gap-1 py-1.5">
              {[0, 0.15, 0.3].map((delay, i) => (
                <span
                  key={i}
                  className="w-[5px] h-[5px] rounded-full bg-yellow-600"
                  style={{ animation: `rcDot 1.2s infinite ease-in-out ${delay}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-1.5 px-3.5 pt-2.5 pb-3.5 border-t border-slate-100 bg-[#fafbfc] flex-shrink-0">
        <span className="flex-shrink-0 flex items-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          className="flex-1 text-xs text-slate-800 border-none bg-transparent font-[inherit] p-0 min-w-0 focus:outline-none placeholder:text-slate-400"
          placeholder="Ask anything..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isGenerating}
        />
        <button
          className="w-7 h-7 rounded-full border-none bg-slate-200 text-slate-400 flex items-center justify-center cursor-pointer flex-shrink-0 transition-all duration-150 hover:not-disabled:bg-yellow-600 hover:not-disabled:text-white disabled:cursor-default"
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
