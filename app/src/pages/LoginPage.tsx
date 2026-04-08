import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Dark_Logo_JibuDocs_Icon.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setLoading(true);

    // Simulate API call — replace with real auth later
    setTimeout(() => {
      sessionStorage.setItem("jibudocs_auth", "1");
      navigate("/search");
    }, 600);
  };

  return (
    <div
      className="font-[Noto_Sans,sans-serif] text-slate-800 min-h-[var(--app-height)] flex items-center justify-center"
      style={{
        background:
          "radial-gradient(circle at center top, rgba(202,138,4,0.10), transparent 50%), linear-gradient(180deg,#fffdf7 0%,#f8fafc 100%)",
      }}
    >
      <div className="w-full max-w-[400px] px-9 py-10 bg-white border border-slate-200 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] text-center max-[480px]:mx-4 max-[480px]:px-6 max-[480px]:py-8">
        <img src={logo} alt="JibuDocs" className="w-12 h-12 mb-5" />
        <h1 className="text-[1.35rem] font-semibold m-0 mb-1.5 text-slate-800">
          Sign in to JibuDocs
        </h1>
        <p className="text-[0.875rem] text-slate-500 m-0 mb-7">
          Enter your credentials to continue
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[18px] text-left">
          <label className="text-[0.8rem] font-medium text-slate-600 flex flex-col gap-1.5">
            Email
            <input
              type="email"
              className="w-full px-3.5 py-3 text-[0.9rem] font-[inherit] text-slate-800 bg-white border border-slate-300 rounded-[10px] outline-none transition-[border-color,box-shadow] duration-200 box-border placeholder:text-slate-400 focus:border-yellow-600 focus:shadow-[0_0_0_3px_rgba(202,138,4,0.15)]"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </label>

          <label className="text-[0.8rem] font-medium text-slate-600 flex flex-col gap-1.5">
            Password
            <input
              type="password"
              className="w-full px-3.5 py-3 text-[0.9rem] font-[inherit] text-slate-800 bg-white border border-slate-300 rounded-[10px] outline-none transition-[border-color,box-shadow] duration-200 box-border placeholder:text-slate-400 focus:border-yellow-600 focus:shadow-[0_0_0_3px_rgba(202,138,4,0.15)]"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {error && (
            <div className="text-[0.8rem] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 text-[0.9rem] font-medium font-[inherit] text-white bg-slate-800 border-none rounded-[10px] cursor-pointer transition-colors duration-200 mt-1 hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
