import { useState } from "react";
import { getDocumentLabel, getComparisonRows } from "./utils";
import { CaseRecord, ReportSection } from "../../data/sampleCases";

interface ComparisonAppendixProps {
  cases: CaseRecord[];
  metaFields: string[];
  sections: ReportSection[];
  docTypeLabel: string;
}

export default function ComparisonAppendix({ cases, metaFields, sections, docTypeLabel }: ComparisonAppendixProps) {
  const [hiddenFields, setHiddenFields] = useState<Set<string>>(new Set());

  if (cases.length < 2) return null;

  const {
    metadataRows: allMetadataRows,
  } = getComparisonRows(cases, metaFields, sections);

  if (allMetadataRows.length === 0) return null;

  const metadataRows = allMetadataRows.filter((r) => !hiddenFields.has(r.label));
  const differingMetadataCount = metadataRows.filter((r) => r.isDifferent).length;
  const sharedMetadataCount = metadataRows.filter((r) => !r.isDifferent).length;
  const hiddenCount = hiddenFields.size;

  const hideField = (label: string) => setHiddenFields((prev) => new Set(prev).add(label));
  const restoreAllFields = () => setHiddenFields(new Set());

  const useTransposed = cases.length > 3;

  const docNumbers = cases.map((doc, i) => ({
    num: i + 1,
    doc,
    label: getDocumentLabel(doc),
  }));

  const differenceSummaries = metadataRows
    .filter((row) => row.isDifferent)
    .map((row) => {
      const counts: Record<string, number> = {};
      row.values.forEach((val) => {
        counts[val] = (counts[val] || 0) + 1;
      });
      const groups = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([val, count]) => `${count}/${cases.length}: ${val}`);
      return { label: row.label, groups };
    });

  /* shared table/cell styles for the standard table */
  const thTdBase = "border border-gray-200 p-2 align-top text-left text-[11px]";
  const theadThBase = `${thTdBase} font-bold bg-slate-50 text-slate-800 font-[Noto_Sans,sans-serif]`;
  const tbodyThBase = `${thTdBase} font-bold whitespace-nowrap text-slate-600 bg-[#fcfcfd] font-[Noto_Sans,sans-serif]`;

  /* shared styles for transposed table */
  const transpThTdBase = "border border-gray-200 py-[5px] px-[6px] align-top text-left [word-wrap:break-word] [overflow-wrap:break-word] text-[9px]";
  const transpTheadThBase = `${transpThTdBase} font-bold text-[8px] bg-slate-50 text-slate-800 font-[Noto_Sans,sans-serif]`;
  const transpTbodyThBase = `${transpThTdBase} font-bold text-slate-600 bg-[#fcfcfd] font-[Noto_Sans,sans-serif]`;

  return (
    <section className="mt-3 pt-0">
      {/* Header */}
      <div className="mb-[18px]">
        <div className="font-[Noto_Sans,sans-serif] text-[10px] font-[800] uppercase tracking-[0.08em] text-yellow-700 mb-1.5">
          Overview
        </div>
        <div className="font-[Noto_Sans,sans-serif] text-lg font-bold text-slate-800 mb-1">
          Overview Summary
        </div>
        <p className="text-xs leading-[1.65] text-gray-600">
          {useTransposed
            ? `Cross-reference of ${cases.length} ${docTypeLabel.toLowerCase()} documents across ${metadataRows.length} metadata fields.`
            : `Overview of the selected ${docTypeLabel.toLowerCase()} documents across ${metadataRows.length} metadata fields.`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-[18px]">
        {[
          { value: cases.length, label: "documents compared" },
          { value: differingMetadataCount, label: "metadata fields differ" },
          { value: sharedMetadataCount, label: "metadata fields match" },
        ].map(({ value, label }) => (
          <div key={label} className="px-3 py-2.5 border border-gray-200 rounded-lg bg-[#fafafa]">
            <span className="block font-[Noto_Sans,sans-serif] text-[17px] font-[800] text-slate-800">{value}</span>
            <span className="block mt-0.5 text-[10px] text-gray-500 leading-[1.45]">{label}</span>
          </div>
        ))}
      </div>

      {metadataRows.length > 0 && (
        <div className="mb-[18px]">
          <div className="font-[Noto_Sans,sans-serif] text-xs font-[800] uppercase tracking-[0.05em] text-slate-800 mb-2">
            Metadata comparison
          </div>

          {hiddenCount > 0 && (
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md text-[11px] mb-2 print:hidden">
              <span className="text-slate-500 font-[Noto_Sans,sans-serif]">
                {hiddenCount} field{hiddenCount !== 1 ? "s" : ""} hidden
              </span>
              <button
                className="border-none bg-none text-blue-600 text-[11px] font-semibold cursor-pointer px-1.5 py-0.5 rounded hover:bg-blue-50 hover:text-blue-700 font-[Noto_Sans,sans-serif]"
                onClick={restoreAllFields}
              >
                Restore all
              </button>
            </div>
          )}

          {useTransposed && (
            <div className="flex flex-col gap-1 mb-2.5 px-3 py-2.5 bg-slate-50 border border-gray-200 rounded-lg text-[10px]">
              {docNumbers.map(({ num, label }) => (
                <div key={num} className="flex items-baseline gap-2">
                  <span className="font-[Noto_Sans,sans-serif] font-[800] text-slate-800 min-w-4 text-center">{num}</span>
                  <span className="text-slate-600 leading-[1.45]">{label}</span>
                </div>
              ))}
            </div>
          )}

          {useTransposed ? (
            <>
              {metadataRows.filter((r) => r.isDifferent).length > 0 && (
                <table className="w-full border-collapse table-fixed text-[9px]">
                  <thead>
                    <tr>
                      <th className={`${transpTheadThBase} w-6 text-center`}>#</th>
                      {metadataRows.filter((r) => r.isDifferent).map((row) => (
                        <th key={row.id} className={transpTheadThBase}>
                          <span className="inline-flex items-center gap-1">
                            {row.label}
                            <button
                              className="inline-flex items-center justify-center w-4 h-4 border-none rounded bg-transparent text-slate-400 cursor-pointer p-0 flex-shrink-0 opacity-0 transition-[opacity,background,color] duration-150 hover:bg-red-100 hover:text-red-600 hover:opacity-100 focus-visible:opacity-100 print:hidden [th:hover_&]:opacity-100"
                              onClick={() => hideField(row.label)}
                              title={`Hide "${row.label}" column`}
                            >
                              <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((doc, docIdx) => (
                      <tr key={doc.id ?? docIdx}>
                        <th scope="row" className={`${transpTbodyThBase} font-[800] text-center text-slate-800 bg-slate-100 w-6`}>
                          {docIdx + 1}
                        </th>
                        {metadataRows.filter((r) => r.isDifferent).map((row) => (
                          <td
                            key={`${row.id}-${doc.id}`}
                            className={`${transpThTdBase} bg-[#fff8e5]`}
                          >
                            {row.values[docIdx]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {metadataRows.filter((r) => !r.isDifferent).length > 0 && (
                <div className="mt-3 px-3 py-2.5 bg-slate-50 border border-gray-200 rounded-lg">
                  <div className="font-[Noto_Sans,sans-serif] text-[9px] font-bold uppercase tracking-[0.05em] text-gray-500 mb-1.5">
                    Shared across all documents
                  </div>
                  <div className="flex flex-wrap gap-1 gap-x-3 text-[10px] text-gray-700 leading-[1.5]">
                    {metadataRows.filter((r) => !r.isDifferent).map((row) => (
                      <span key={row.id}>
                        <strong className="font-bold text-slate-800">{row.label}:</strong> {row.values[0]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr>
                    <th className={theadThBase}>Field</th>
                    {cases.map((doc) => (
                      <th key={doc.id} className={theadThBase}>{getDocumentLabel(doc)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metadataRows.map((row) => (
                    <tr key={row.id}>
                      <th scope="row" className={tbodyThBase}>
                        <span className="inline-flex items-center gap-1">
                          {row.label}
                          <button
                            className="inline-flex items-center justify-center w-4 h-4 border-none rounded bg-transparent text-slate-400 cursor-pointer p-0 flex-shrink-0 opacity-0 transition-[opacity,background,color] duration-150 hover:bg-red-100 hover:text-red-600 hover:opacity-100 focus-visible:opacity-100 print:hidden [th:hover_&]:opacity-100"
                            onClick={() => hideField(row.label)}
                            title={`Hide "${row.label}"`}
                          >
                            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </span>
                      </th>
                      {row.values.map((value, index) => (
                        <td
                          key={`${row.id}-${cases[index].id}`}
                          className={`${thTdBase} ${row.isDifferent ? "bg-[#fff8e5]" : ""}`}
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
        </div>
      )}

      {differenceSummaries.length > 0 && useTransposed && (
        <div className="mb-[18px]">
          <div className="font-[Noto_Sans,sans-serif] text-xs font-[800] uppercase tracking-[0.05em] text-slate-800 mb-2">
            Key differences
          </div>
          <div className="grid gap-2 mb-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
            {differenceSummaries.map((item) => (
              <div key={item.label} className="px-2.5 py-2 border border-gray-200 rounded-lg bg-white">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-[Noto_Sans,sans-serif] text-[10px] font-bold text-slate-800">
                    {item.label}
                  </div>
                  <button
                    className="inline-flex items-center justify-center w-4 h-4 border-none rounded bg-transparent text-slate-400 cursor-pointer p-0 flex-shrink-0 transition-[opacity,background,color] duration-150 hover:bg-red-100 hover:text-red-600 print:hidden"
                    style={{ opacity: 1 }}
                    onClick={() => hideField(item.label)}
                    title={`Hide "${item.label}"`}
                  >
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.groups.map((g, i) => (
                    <span key={i} className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-yellow-100 text-amber-800 leading-[1.45]">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
