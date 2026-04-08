import { getDocumentLabel } from "./utils";
import { SparkleIcon } from "./Icons";
import ComparisonAppendix from "./ComparisonAppendix";
import { CaseRecord, ReportSection } from "../../data/sampleCases";

interface Insight {
  id: number;
  question: string;
  answer: string;
}

interface DocumentPreviewProps {
  title?: string;
  subtitle?: string;
  logoUrl?: string | null;
  sections: ReportSection[];
  metaFields: string[];
  cases: CaseRecord[];
  onRemove?: ((id: string) => void) | null;
  includeComparisonAppendix?: boolean;
  docTypeLabel?: string;
  reportInsights?: Insight[];
  onRemoveInsight?: ((id: number) => void) | null;
}

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
}: DocumentPreviewProps) {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className="w-[800px] min-h-[900px] bg-white rounded-sm box-border leading-relaxed text-[#222] font-['Noto_Serif',serif] text-[13.5px] h-auto print:shadow-none print:w-full print:min-h-0 print:px-[50px] print:py-10"
      style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)", padding: "56px 60px" }}
    >
      {/* Document header */}
      <div className="border-b-[3px] border-slate-800 pb-4 mb-[26px]">
        {logoUrl && (
          <div className="flex items-center mb-1">
            <img src={logoUrl} alt="Logo" className="max-h-14 object-contain" />
          </div>
        )}
        <div className="font-['Noto_Sans',sans-serif] text-[22px] font-bold text-slate-800 mt-1.5 mb-[3px]">
          {title || "Untitled Report"}
        </div>
        {subtitle && (
          <div className="text-[13px] text-gray-500">{subtitle}</div>
        )}
        <div className="text-[11px] text-gray-400 mt-[3px]">
          Generated {today} · {cases.length} document{cases.length !== 1 ? "s" : ""}
        </div>
      </div>

      {cases.length === 0 && (
        <div className="text-center py-[60px] px-5 text-gray-400">
          <p className="text-sm mb-1.5">No documents selected yet.</p>
          <p className="text-xs">Go back to search results to add documents to your report.</p>
        </div>
      )}

      {includeComparisonAppendix && cases.length >= 2 && (
        <ComparisonAppendix
          cases={cases}
          metaFields={metaFields}
          sections={sections}
          docTypeLabel={docTypeLabel}
        />
      )}

      {cases.map((c, idx) => {
        const caseTitle = getDocumentLabel(c);
        return (
          <div key={c.id ?? idx}>
            {onRemove && (
              <div className="flex justify-end mb-1.5 print:hidden">
                <button
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-red-200 bg-white text-red-700 text-[11px] font-semibold cursor-pointer whitespace-nowrap transition-all duration-150 hover:bg-red-50 hover:border-red-300"
                  onClick={() => onRemove(c.id!)}
                  title="Remove from report"
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Remove from report
                </button>
              </div>
            )}
            <div className="mb-7 break-inside-avoid">
              <div className="font-['Noto_Sans',sans-serif] text-[13px] font-bold text-slate-800 px-3 py-[7px] bg-yellow-100 border-l-4 border-yellow-600 rounded-r mb-3">
                {caseTitle}
              </div>

              {metaFields.length > 0 && (
                <div className="grid grid-cols-2 gap-x-[18px] gap-y-[3px] mb-3 px-3.5 py-2.5 bg-gray-50 rounded-md border border-gray-200">
                  {metaFields.map((f) =>
                    c[f] !== undefined ? (
                      <div key={f} className="flex gap-1.5 text-[11px] py-0.5">
                        <span className="font-['Noto_Sans',sans-serif] font-bold text-gray-500 min-w-[95px] flex-shrink-0">{f}</span>
                        <span className="text-gray-800">{c[f] || "—"}</span>
                      </div>
                    ) : null
                  )}
                </div>
              )}

              {sections
                .filter((s) => s.enabled && c[s.id])
                .map((s) => (
                  <div key={s.id} className="mb-2">
                    <div className="font-['Noto_Sans',sans-serif] text-[11px] font-bold text-slate-800 uppercase tracking-[0.3px] mb-[3px] pb-0.5 border-b border-gray-200">
                      {s.label}
                    </div>
                    <div className="text-xs text-gray-700 leading-[1.65] text-justify">{c[s.id]}</div>
                  </div>
                ))}
            </div>
            {idx < cases.length - 1 && (
              <hr className="border-none border-t border-dashed border-gray-300 my-5" />
            )}
          </div>
        );
      })}

      {reportInsights.length > 0 && (
        <section className="mt-6 pt-5 border-t-2 border-gray-200">
          <div className="mb-4">
            <div className="font-['Noto_Sans',sans-serif] text-[10px] font-[800] uppercase tracking-[0.08em] text-yellow-700 mb-1.5">
              AI Analysis
            </div>
            <div className="font-['Noto_Sans',sans-serif] text-lg font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <SparkleIcon /> Curated Insights
            </div>
          </div>
          {reportInsights.map((insight) => (
            <div key={insight.id} className="relative border border-gray-200 rounded-[10px] overflow-hidden mb-3">
              <div className="px-3.5 py-2.5 bg-slate-50 border-b border-gray-200 font-['Noto_Sans',sans-serif] text-xs font-semibold text-slate-800">
                <span className="font-[800] text-slate-500 mr-1">Q:</span> {insight.question}
              </div>
              <div className="px-3.5 py-3">
                {insight.answer.split("\n").map((line, i) => (
                  <p
                    key={i}
                    className={`text-[11px] leading-[1.7] text-slate-700 mb-1 last:mb-0 ${line.startsWith("**") ? "font-bold text-slate-900" : ""}`}
                  >
                    {line.replace(/\*\*/g, "")}
                  </p>
                ))}
              </div>
              {onRemoveInsight && (
                <button
                  className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-[3px] border border-red-200 rounded-md bg-red-50 text-[10px] font-semibold text-red-800 cursor-pointer transition-[background] duration-150 hover:bg-red-200 print:hidden"
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

      <div className="mt-9 pt-2.5 border-t-2 border-slate-800 flex justify-between text-[10px] text-gray-400">
        <span>JibuDocs · AI-Enabled Document Management</span>
        <span>Confidential</span>
      </div>
    </div>
  );
}
