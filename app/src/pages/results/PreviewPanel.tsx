import type { CaseRecord } from "../../data/sampleCases";
import {
  getPreviewSections,
  getResultTitle,
} from "../../data/documentUtils";

interface PreviewPanelProps {
  data: CaseRecord | null;
}

export default function PreviewPanel({ data }: PreviewPanelProps) {
  if (!data) {
    return (
      <aside className="bg-transparent overflow-y-auto min-w-0 p-5 flex items-center justify-center">
        <div className="max-w-[220px] text-center">
          <p className="m-0 text-[13px] leading-[1.6] text-slate-400">Select a result to preview its details.</p>
        </div>
      </aside>
    );
  }

  const title = getResultTitle(data);
  const sections = getPreviewSections(data);

  return (
    <aside className="bg-transparent overflow-y-auto min-w-0 p-5">
      <h3 className="text-[15px] font-bold text-slate-800 m-0 mb-4 leading-[1.35]">{title}</h3>
      {sections.map((sec) =>
        data[sec.key] ? (
          <div key={sec.key} className="mb-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.4px] m-0 mb-1.5">{sec.label}</h4>
            <p className="text-[13px] text-slate-600 leading-[1.6] m-0">{data[sec.key]}</p>
          </div>
        ) : null
      )}
    </aside>
  );
}
