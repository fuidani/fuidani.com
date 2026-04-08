import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Dark_Logo_JibuDocs_Icon.png";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
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
    <div className={styles.page}>
      <div className={styles.card}>
        <img src={logo} alt="JibuDocs" className={styles.logo} />
        <h1 className={styles.title}>Sign in to JibuDocs</h1>
        <p className={styles.subtitle}>Enter your credentials to continue</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Email
            <input
              type="email"
              className={styles.input}
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </label>

          <label className={styles.label}>
            Password
            <input
              type="password"
              className={styles.input}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
