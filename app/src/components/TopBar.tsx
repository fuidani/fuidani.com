import { useNavigate } from "react-router-dom";
import logoIcon from "../assets/Light_Logo_JibuDocs_Icon.png";

interface TopBarProps {
  activeTab?: "search" | "files" | "reports";
  onReportsClick?: () => void;
}

export default function TopBar({ activeTab, onReportsClick }: TopBarProps) {
  const navigate = useNavigate();

  const handleReportsClick = () => {
    if (onReportsClick) {
      onReportsClick();
    } else {
      navigate("/report");
    }
  };

  const tabBase =
    "bg-transparent border-none text-slate-400 text-[13px] px-3.5 py-1.5 rounded-md cursor-pointer transition-[background,color] duration-150 hover:bg-white/[.08] hover:text-slate-200";
  const tabActive = "bg-white/[.12] text-white";

  return (
    <header className="sticky top-0 flex items-center justify-between h-12 min-h-12 px-4 bg-slate-800 text-white z-[100] max-[380px]:px-[10px]">
      <div className="flex items-center gap-3 max-[380px]:gap-2">
        <a
          className="flex items-center gap-2 cursor-pointer no-underline"
          onClick={() => navigate("/search")}
          role="button"
          tabIndex={0}
        >
          <img src={logoIcon} alt="JibuDocs" width="28" height="28" />
          <span className="font-bold text-[15px] tracking-[-0.3px] text-white mr-2 max-[740px]:mr-0">
            JibuDocs
          </span>
        </a>
        <nav className="flex gap-0.5 max-[740px]:hidden">
          <button
            className={`${tabBase} ${activeTab === "search" ? tabActive : ""}`}
            onClick={() => navigate("/search")}
          >
            Doc Search
          </button>
          <button
            className={`${tabBase} ${activeTab === "files" ? tabActive : ""}`}
          >
            File Browser
          </button>
          <button
            className={`${tabBase} ${activeTab === "reports" ? tabActive : ""}`}
            onClick={handleReportsClick}
          >
            Reports
          </button>
        </nav>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="text-[12px] text-slate-400 max-[740px]:hidden">
          dpisani@637capital.com
        </span>
        <div className="w-[30px] h-[30px] rounded-full bg-slate-600 text-slate-200 text-[11px] font-semibold flex items-center justify-center">
          DP
        </div>
      </div>
    </header>
  );
}
