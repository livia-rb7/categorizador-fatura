import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Conta criada! Verifique seu e-mail para confirmar o cadastro.");
      }
    }
    setLoading(false);
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ fontSize: 52, marginBottom: 8, textAlign: "center" }}>💳</div>
        <h1 style={S.title}>Categorizador de Fatura</h1>
        <p style={S.subtitle}>
          Importe, categorize e analise suas faturas
        </p>

        {/* Tabs */}
        <div style={S.tabs}>
          {[
            { key: "login", label: "Entrar" },
            { key: "signup", label: "Criar conta" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setMode(key); setError(null); setMessage(null); }}
              style={{
                ...S.tab,
                ...(mode === key ? S.tabActive : {}),
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={S.form}>
          <div>
            <label style={S.label}>E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              style={S.input}
            />
          </div>
          <div>
            <label style={S.label}>Senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              style={S.input}
            />
          </div>

          {error && <div style={S.error}>{error}</div>}
          {message && <div style={S.success}>{message}</div>}

          <button type="submit" disabled={loading} style={{
            ...S.btn,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}>
            {loading
              ? "Aguarde..."
              : mode === "login"
                ? "Entrar"
                : "Criar conta"}
          </button>
        </form>

        <p style={S.footer}>
          Seus dados são processados localmente no navegador.
          <br />O banco armazena apenas categorias e histórico.
        </p>
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
    padding: "40px 36px",
    maxWidth: 400,
    width: "100%",
  },
  title: {
    margin: "0 0 6px",
    fontSize: 24,
    fontWeight: 800,
    color: "#0f172a",
    textAlign: "center",
  },
  subtitle: {
    margin: "0 0 24px",
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  tabs: {
    display: "flex",
    background: "#f1f5f9",
    borderRadius: 10,
    padding: 3,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    padding: "8px 0",
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: "#64748b",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  tabActive: {
    background: "#fff",
    color: "#0f172a",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  label: {
    display: "block",
    marginBottom: 4,
    fontSize: 12,
    fontWeight: 700,
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    color: "#0f172a",
    outline: "none",
    background: "#f8fafc",
    boxSizing: "border-box",
  },
  btn: {
    width: "100%",
    padding: "12px 0",
    border: "none",
    borderRadius: 10,
    background: "#3b82f6",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    marginTop: 4,
  },
  error: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 500,
  },
  success: {
    background: "#f0fdf4",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 500,
  },
  footer: {
    marginTop: 20,
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 1.5,
  },
};
