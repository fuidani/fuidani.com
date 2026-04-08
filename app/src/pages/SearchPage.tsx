import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";

const SUGGESTIONS = [
  "Blind discrimination",
  "Discover fraud upon exercise of reasonable diligence",
  "Value Added Tax",
  "General damages for unfair termination",
  "Section 12 of the Consumer Protection Act",
  "Breach of fiduciary duty",
  "Constitutional right to fair hearing",
  "Vicarious liability in employment",
];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(() => searchParams.get("q") || "");

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/refine?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleChipClick = (text: string) => {
    setQuery(text);
  };

  return (
    <div
      className="font-[Noto_Sans,sans-serif] text-slate-800 min-h-[var(--app-height)] flex flex-col"
      style={{
        background:
          "radial-gradient(circle at center top, rgba(202,138,4,0.10), transparent 50%), linear-gradient(180deg,#fffdf7 0%,#f8fafc 100%)",
      }}
    >
      <TopBar activeTab="search" />
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-[720px] px-6 -translate-y-12 max-[480px]:translate-y-0 max-[480px]:px-4">
          <h1 className="text-center text-[1.75rem] font-medium text-slate-800 mb-8 tracking-[-0.01em] max-[480px]:text-[1.35rem] max-[480px]:mb-6">
            What are you looking for?
          </h1>

          <div className="relative w-full mb-10 max-[480px]:mb-7">
            <input
              type="text"
              placeholder="Describe what you're looking for..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full py-4 pl-5 pr-[52px] text-base text-slate-800 bg-white border border-slate-300 rounded-2xl outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-slate-400 focus:border-yellow-600 focus:shadow-[0_0_0_3px_rgba(202,138,4,0.15)] max-[480px]:py-3 max-[480px]:pl-4 max-[480px]:pr-[46px] max-[480px]:text-[0.9rem] max-[480px]:rounded-xl"
            />
            <button
              type="button"
              onClick={handleSubmit}
              aria-label="Search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-800 border-none rounded-full cursor-pointer flex items-center justify-center transition-colors duration-200 hover:bg-slate-700 max-[480px]:w-[34px] max-[480px]:h-[34px]"
            >
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-white">
                <path
                  d="M12 19V5m0 0l-6 6m6-6l6 6"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </button>
          </div>

          <div className="text-[0.75rem] uppercase tracking-[0.08em] text-slate-500 mb-3.5 pl-1 max-[480px]:mb-2.5">
            Suggestions
          </div>
          <div className="flex flex-wrap gap-2.5 max-[480px]:gap-2">
            {SUGGESTIONS.map((text) => (
              <button
                type="button"
                key={text}
                onClick={() => handleChipClick(text)}
                className="inline-block px-4 py-2 text-[0.85rem] font-[inherit] leading-[1.2] text-slate-600 bg-white border border-slate-300 rounded-[10px] cursor-pointer transition-[background,border-color,color] duration-200 select-none hover:bg-yellow-50 hover:border-yellow-600 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-600 focus-visible:outline-offset-2 max-[480px]:px-3 max-[480px]:py-1.5 max-[480px]:text-[0.8rem] max-[480px]:rounded-lg"
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
