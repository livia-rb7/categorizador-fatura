import { useState, useCallback, useRef, useEffect } from "react";

// ─── Auto-categorization rules ───────────────────────────────────────────────
const AUTO_RULES = [
  { keywords: ["mercadolivre", "mercado livre", "mp*mercadoliv"], category: "Compras Online" },
  { keywords: ["hotmart", "htm "], category: "Educação" },
  { keywords: ["adobe"], category: "Ferramenta" },
  { keywords: ["airtable"], category: "Ferramenta" },
  { keywords: ["anthropic", "claude.ai"], category: "Ferramenta" },
  { keywords: ["apify"], category: "Ferramenta" },
  { keywords: ["asa*utmify", "utmify"], category: "Ferramenta" },
  { keywords: ["autentique"], category: "Ferramenta" },
  { keywords: ["clinthub"], category: "Ferramenta" },
  { keywords: ["digitalocean"], category: "Ferramenta" },
  { keywords: ["dl*google"], category: "Ferramenta" },
  { keywords: ["hostinger", "dm *hostinger"], category: "Ferramenta" },
  { keywords: ["canva"], category: "Ferramenta" },
  { keywords: ["elevenlabs"], category: "Ferramenta" },
  { keywords: ["framer.com"], category: "Ferramenta" },
  { keywords: ["ig*salvy", "ig*turbocloud", "pg *turbo cloud", "turbocloud"], category: "Ferramenta" },
  { keywords: ["inlead"], category: "Ferramenta" },
  { keywords: ["instrack"], category: "Ferramenta" },
  { keywords: ["lovable"], category: "Ferramenta" },
  { keywords: ["manychat"], category: "Ferramenta" },
  { keywords: ["openai", "chatgpt"], category: "Ferramenta" },
  { keywords: ["paddle.net"], category: "Ferramenta" },
  { keywords: ["pg *unnichat"], category: "Ferramenta" },
  { keywords: ["pg *yoshiura"], category: "Ferramenta" },
  { keywords: ["railway"], category: "Ferramenta" },
  { keywords: ["rapidapi"], category: "Ferramenta" },
  { keywords: ["scrapingdog"], category: "Ferramenta" },
  { keywords: ["sendpulse"], category: "Ferramenta" },
  { keywords: ["short.io"], category: "Ferramenta" },
  { keywords: ["soniox"], category: "Ferramenta" },
  { keywords: ["stape"], category: "Ferramenta" },
  { keywords: ["streamyard"], category: "Ferramenta" },
  { keywords: ["supabase"], category: "Ferramenta" },
  { keywords: ["uazapi"], category: "Ferramenta" },
  { keywords: ["vidiq"], category: "Ferramenta" },
  { keywords: ["visitorapi"], category: "Ferramenta" },
  { keywords: ["vturb"], category: "Ferramenta" },
  { keywords: ["yay! forms", "yayforms"], category: "Ferramenta" },
  { keywords: ["zoom.com", "zoom.us"], category: "Ferramenta" },
  { keywords: ["iof operacao", "iof operação"], category: "Imposto" },
  { keywords: ["claro negoci"], category: "Operacional" },
  { keywords: ["starlink"], category: "Operacional" },
  { keywords: ["pg *br did telefonia", "br did"], category: "Operacional" },
  { keywords: ["recvivo"], category: "Operacional" },
  { keywords: ["zurich seguro"], category: "Operacional" },
  { keywords: ["guaritao"], category: "PF - Rafa" },
  { keywords: ["prudent*apol"], category: "PF - Rafa" },
  { keywords: ["anuidade visa", "anuidade mastercard", "anuidade"], category: "Taxa" },
  { keywords: ["protecao perda", "proteção perda"], category: "Taxa" },
  { keywords: ["facebk "], category: "Tráfego Pago" },
  { keywords: ["americam plaza", "american p a h"], category: "Viagem" },
  { keywords: ["auto posto sofia"], category: "Viagem" },
  { keywords: ["captions.ai"], category: "Viagem" },
  { keywords: ["elias do coco"], category: "Viagem" },
  { keywords: ["estac. sicoob", "pedgio sicoob"], category: "Viagem" },
  { keywords: ["estanplaza"], category: "Viagem" },
  { keywords: ["mp*voeeconomy", "voeeconomy"], category: "Viagem" },
  { keywords: ["radisson"], category: "Viagem" },
  { keywords: ["rest frangoassado", "rest. - cambui", "restaurante do marqu", "trembao restaurante"], category: "Viagem" },
  { keywords: ["rodoposto", "rodosnack"], category: "Viagem" },
  { keywords: ["tivoli ecoresort"], category: "Viagem" },
  { keywords: ["scp estacionamento"], category: "Viagem" },
];

function autoCategorizeMemo(memo) {
  const lower = memo.toLowerCase();
  for (const rule of AUTO_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw.toLowerCase()))) return rule.category;
  }
  return null;
}

// ─── OFX parser ──────────────────────────────────────────────────────────────
function parseOFX(text) {
  const transactions = [];
  const stmtRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  let m;
  while ((m = stmtRegex.exec(text)) !== null) {
    const block = m[1];
    const get = (tag) => { const r = new RegExp(`<${tag}>([^<]*)`); const x = r.exec(block); return x ? x[1].trim() : ""; };
    const tipo = get("TRNTYPE");
    const memo = get("MEMO").replace(/&amp;/g, "&");
    const amtRaw = parseFloat(get("TRNAMT").replace(",", "."));
    const dateRaw = get("DTPOSTED");
    const date = dateRaw ? `${dateRaw.slice(6,8)}/${dateRaw.slice(4,6)}/${dateRaw.slice(0,4)}` : "";
    if (!memo || isNaN(amtRaw)) continue;
    if (tipo === "CREDIT" && amtRaw > 0) continue;
    const autoCategory = autoCategorizeMemo(memo);
    transactions.push({ id: get("FITID"), memo, amount: Math.abs(amtRaw), date, category: autoCategory, auto: !!autoCategory });
  }
  return transactions;
}

function fmt(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

// ─── Colors ──────────────────────────────────────────────────────────────────
const TAG_COLORS = [
  { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
  { bg: "#dcfce7", text: "#166534", border: "#86efac" },
  { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
  { bg: "#fef9c3", text: "#854d0e", border: "#fde047" },
  { bg: "#f3e8ff", text: "#6b21a8", border: "#d8b4fe" },
  { bg: "#ffedd5", text: "#9a3412", border: "#fdba74" },
  { bg: "#e0f2fe", text: "#075985", border: "#7dd3fc" },
  { bg: "#fce7f3", text: "#9d174d", border: "#f9a8d4" },
  { bg: "#ecfdf5", text: "#065f46", border: "#6ee7b7" },
  { bg: "#f1f5f9", text: "#334155", border: "#cbd5e1" },
];

const CAT_CHART_COLORS = [
  "#534AB7","#D4537E","#D85A30","#1D9E75","#378ADD",
  "#BA7517","#3B6D11","#E24B4A","#888780","#075985",
];

// ─── SheetJS loader ──────────────────────────────────────────────────────────
let _xlsxReady = null;
function loadXLSX() {
  if (_xlsxReady) return _xlsxReady;
  _xlsxReady = new Promise((resolve, reject) => {
    if (window.XLSX) { resolve(window.XLSX); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = () => resolve(window.XLSX);
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return _xlsxReady;
}

// ─── Export ──────────────────────────────────────────────────────────────────
function exportCSV(transactions) {
  const header = ["Data", "Descrição", "Valor (R$)", "Categoria"];
  const rows = transactions.map(t => [
    t.date,
    `"${t.memo.replace(/"/g, '""')}"`,
    t.amount.toFixed(2).replace(".", ","),
    t.category ? `"${t.category.replace(/"/g, '""')}"` : "Sem categoria",
  ]);
  const csv = [header.join(";"), ...rows.map(r => r.join(";"))].join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, "fatura_categorizada.csv");
}

async function exportXLSX(transactions) {
  const XLSX = await loadXLSX();
  const rows = transactions.map(t => ({
    "Data": t.date, "Descrição": t.memo,
    "Valor (R$)": t.amount, "Categoria": t.category || "Sem categoria",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [{ wch: 13 }, { wch: 42 }, { wch: 14 }, { wch: 24 }];
  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let ri = 1; ri <= range.e.r; ri++) {
    const cell = ws[XLSX.utils.encode_cell({ r: ri, c: 2 })];
    if (cell) cell.z = '#,##0.00';
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Fatura");
  XLSX.writeFile(wb, "fatura_categorizada.xlsx");
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── ExportMenu ───────────────────────────────────────────────────────────────
function ExportMenu({ transactions, filtered, filter }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const isFiltered = filter !== "all";
  const exportTarget = isFiltered ? filtered : transactions;
  const label = isFiltered ? `filtrados (${filtered.length})` : `todos (${transactions.length})`;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} disabled={transactions.length === 0}
        style={{ ...S.newBtn, background: "#0f172a", color: "#fff", border: "none", display: "flex", alignItems: "center", gap: 6, opacity: transactions.length === 0 ? 0.4 : 1, cursor: transactions.length === 0 ? "not-allowed" : "pointer" }}>
        <span>⬇ Exportar</span><span style={{ fontSize: 9, opacity: 0.6 }}>▼</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 28px rgba(0,0,0,0.13)", minWidth: 230, zIndex: 9999, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px 6px", fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Exportar {label}</div>
          {[
            { icon: "📊", label: "Excel (.xlsx)", sub: "Abre direto no Excel", action: () => { exportXLSX(exportTarget).catch(console.error); setOpen(false); } },
            { icon: "📄", label: "CSV (.csv)", sub: "Compatível com qualquer app", action: () => { exportCSV(exportTarget); setOpen(false); } },
          ].map(({ icon, label, sub, action }) => (
            <div key={label} onClick={action} style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
              onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <div><div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{label}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{sub}</div></div>
            </div>
          ))}
          {isFiltered && (
            <>
              <div style={{ height: 1, background: "#f1f5f9", margin: "4px 0" }} />
              <div style={{ padding: "6px 14px 4px", fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Exportar todos ({transactions.length})</div>
              {[
                { icon: "📊", label: "Excel (.xlsx)", action: () => { exportXLSX(transactions).catch(console.error); setOpen(false); } },
                { icon: "📄", label: "CSV (.csv)", action: () => { exportCSV(transactions); setOpen(false); } },
              ].map(({ icon, label, action }) => (
                <div key={`all-${label}`} onClick={action} style={{ padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#334155" }}>{label}</div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── TagSelector ─────────────────────────────────────────────────────────────
function TagSelector({ value, categories, onChange, onAddCategory }) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const cat = categories.find(c => c.name === value);
  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAddCategory(trimmed); onChange(trimmed); setNewName(""); setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20,
        border: cat ? `1.5px solid ${cat.color.border}` : "1.5px dashed #cbd5e1",
        background: cat ? cat.color.bg : "transparent", color: cat ? cat.color.text : "#94a3b8",
        cursor: "pointer", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap", minWidth: 160,
      }}>
        <span style={{ flex: 1, textAlign: "left" }}>{cat ? cat.name : "Selecionar categoria"}</span>
        <span style={{ fontSize: 9, opacity: 0.5 }}>▼</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 28px rgba(0,0,0,0.13)", minWidth: 210, zIndex: 9999 }}>
          {categories.map(c => (
            <div key={c.name} onClick={() => { onChange(c.name); setOpen(false); }}
              style={{ padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
              onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, background: c.color.bg, color: c.color.text, border: `1px solid ${c.color.border}`, fontWeight: 600, fontSize: 12 }}>{c.name}</span>
              {value === c.name && <span style={{ marginLeft: "auto", color: "#3b82f6", fontSize: 13 }}>✓</span>}
            </div>
          ))}
          {value && (
            <div onClick={() => { onChange(null); setOpen(false); }}
              style={{ padding: "7px 12px", cursor: "pointer", fontSize: 12, color: "#94a3b8", borderTop: "1px solid #f1f5f9" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              ✕ Remover categoria
            </div>
          )}
          <div style={{ padding: "8px 10px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 6 }}>
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleAdd(); e.stopPropagation(); }}
              placeholder="Nova categoria..."
              style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 8px", fontSize: 12, outline: "none", color: "#334155" }} />
            <button onClick={handleAdd} style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>+</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Donut Chart (pure SVG) ───────────────────────────────────────────────────
function DonutChart({ entries, grandTotal }) {
  const size = 150, cx = 75, cy = 75, r = 56, inner = 34;
  if (!grandTotal) return null;

  let cum = 0;
  const slices = entries.map(e => {
    const start = cum;
    cum += e.pct / 100;
    return { ...e, start, end: cum };
  });

  const pt = (pct, radius) => {
    const a = pct * 2 * Math.PI - Math.PI / 2;
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  };

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      {slices.map((s, i) => {
        if (s.end - s.start < 0.001) return null;
        const s1 = pt(s.start, r), s2 = pt(s.end, r);
        const i1 = pt(s.start, inner), i2 = pt(s.end, inner);
        const large = s.end - s.start > 0.5 ? 1 : 0;
        const d = `M ${i1.x} ${i1.y} L ${s1.x} ${s1.y} A ${r} ${r} 0 ${large} 1 ${s2.x} ${s2.y} L ${i2.x} ${i2.y} A ${inner} ${inner} 0 ${large} 0 ${i1.x} ${i1.y} Z`;
        return <path key={i} d={d} fill={s.chartColor} stroke="#fff" strokeWidth={1.5} />;
      })}
      <text x={cx} y={cy - 7} textAnchor="middle" fontSize={9} fill="#94a3b8" fontWeight={700} letterSpacing="0.05em">TOTAL</text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize={10} fill="#0f172a" fontWeight={800}>{fmt(grandTotal)}</text>
    </svg>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ transactions, categories, onFilterClick }) {
  const grandTotal = transactions.reduce((s, t) => s + t.amount, 0);
  const semCat = transactions.filter(t => !t.category).length;
  const ticket = transactions.length > 0 ? grandTotal / transactions.length : 0;

  const byCategory = {};
  transactions.forEach(t => {
    const key = t.category || "Sem categoria";
    if (!byCategory[key]) byCategory[key] = { total: 0, count: 0 };
    byCategory[key].total += t.amount;
    byCategory[key].count += 1;
  });

  const entries = Object.entries(byCategory)
    .map(([cat, d]) => {
      const colorIdx = categories.findIndex(c => c.name === cat);
      const tagColor = colorIdx >= 0 ? categories[colorIdx].color : TAG_COLORS[9];
      const chartColor = CAT_CHART_COLORS[colorIdx >= 0 ? colorIdx % CAT_CHART_COLORS.length : 8];
      return { cat, total: d.total, count: d.count, pct: grandTotal > 0 ? (d.total / grandTotal) * 100 : 0, chartColor, tagColor };
    })
    .sort((a, b) => b.total - a.total);

  const maxVal = entries[0]?.total || 1;

  if (transactions.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", color: "#94a3b8" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
        <p style={{ margin: 0, fontSize: 15 }}>Importe uma fatura para ver o dashboard</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      {/* Metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Total gasto", value: fmt(grandTotal), sub: `${transactions.length} lançamentos` },
          { label: "Maior categoria", value: entries[0] ? fmt(entries[0].total) : "—", sub: `${entries[0]?.cat || "—"} · ${entries[0]?.pct.toFixed(1) || 0}%` },
          { label: "Ticket médio", value: fmt(ticket), sub: "por lançamento" },
          { label: "Sem categoria", value: String(semCat), sub: semCat === 0 ? "tudo categorizado ✓" : `de ${transactions.length} lançamentos` },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", border: "1px solid #f1f5f9" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
            <p style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>{value}</p>
            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "start" }}>
        {/* Ranking */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Ranking por categoria</span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>clique para ver os lançamentos</span>
          </div>
          {entries.map((e, i) => (
            <div key={e.cat} onClick={() => onFilterClick(e.cat)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderBottom: i < entries.length - 1 ? "1px solid #f8fafc" : "none", cursor: "pointer" }}
              onMouseEnter={ev => ev.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>
              <span style={{ fontSize: 11, color: "#cbd5e1", width: 16, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
              <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, background: e.tagColor.bg, color: e.tagColor.text, border: `1px solid ${e.tagColor.border}`, fontSize: 11, fontWeight: 700, width: 116, textAlign: "center", flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.cat}</span>
              <div style={{ flex: 1, height: 7, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 4, background: e.chartColor, width: `${(e.total / maxVal) * 100}%`, transition: "width 0.5s ease" }} />
              </div>
              <span style={{ fontSize: 11, color: "#94a3b8", width: 40, textAlign: "right", flexShrink: 0 }}>{e.pct.toFixed(1)}%</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", width: 110, textAlign: "right", flexShrink: 0 }}>{fmt(e.total)}</span>
              <span style={{ fontSize: 11, color: "#cbd5e1", width: 50, textAlign: "right", flexShrink: 0 }}>{e.count} lanç.</span>
            </div>
          ))}
        </div>

        {/* Donut + legend */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px", minWidth: 220 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 14 }}>Distribuição</div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <DonutChart entries={entries} grandTotal={grandTotal} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {entries.map(e => (
              <div key={e.cat} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => onFilterClick(e.cat)}
                onMouseEnter={ev => ev.currentTarget.style.opacity = "0.7"}
                onMouseLeave={ev => ev.currentTarget.style.opacity = "1"}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: e.chartColor, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#334155", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.cat}</span>
                <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, flexShrink: 0 }}>{e.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([
    { name: "Compras Online",  color: TAG_COLORS[2] },
    { name: "Educação",        color: TAG_COLORS[3] },
    { name: "Ferramenta",      color: TAG_COLORS[4] },
    { name: "Imposto",         color: TAG_COLORS[9] },
    { name: "Operacional",     color: TAG_COLORS[6] },
    { name: "PF - Rafa",       color: TAG_COLORS[1] },
    { name: "Taxa",            color: TAG_COLORS[7] },
    { name: "Tráfego Pago",    color: TAG_COLORS[5] },
    { name: "Viagem",          color: TAG_COLORS[0] },
  ]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [uploaded, setUploaded] = useState(false);
  const [activeTab, setActiveTab] = useState("lancamentos");

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    const text = await file.text();
    const txs = parseOFX(text);
    setTransactions(txs);
    setUploaded(true);
    setFilter("all");
    setSearch("");
  }, []);

  const addCategory = (name) => {
    if (categories.find(c => c.name === name)) return;
    const color = TAG_COLORS[categories.length % TAG_COLORS.length];
    setCategories(prev => [...prev, { name, color }]);
  };

  const setCategory = (id, cat) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, category: cat } : t));
  };

  const filtered = transactions.filter(t => {
    const matchSearch = t.memo.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "sem" && !t.category) || t.category === filter;
    return matchSearch && matchFilter;
  });

  const totalFiltered = filtered.reduce((s, t) => s + t.amount, 0);
  const semCategoria = transactions.filter(t => !t.category).length;

  const handleDashFilterClick = (cat) => {
    setFilter(cat === "Sem categoria" ? "sem" : cat);
    setSearch("");
    setActiveTab("lancamentos");
  };

  if (!uploaded) {
    return (
      <div style={S.page}>
        <div style={S.uploadWrap}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>💳</div>
          <h1 style={S.uploadTitle}>Categorizador de Fatura</h1>
          <p style={{ color: "#64748b", margin: "0 0 24px", fontSize: 15 }}>
            Importe um arquivo <strong>.OFX</strong> para começar
          </p>
          <label style={S.uploadBtn}>
            📂 Escolher arquivo .OFX
            <input type="file" accept=".ofx" style={{ display: "none" }} onChange={e => handleFile(e.target.files?.[0])} />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#0f172a" }}>💳 Categorizador de Fatura</span>
          <span style={S.chip}>{transactions.length} lançamentos</span>
          {semCategoria > 0 && (
            <span style={{ ...S.chip, background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
              {semCategoria} sem categoria
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <ExportMenu transactions={transactions} filtered={filtered} filter={filter} />
          <label style={S.newBtn}>
            📂 Nova fatura
            <input type="file" accept=".ofx" style={{ display: "none" }} onChange={e => handleFile(e.target.files?.[0])} />
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 20px", display: "flex" }}>
        {[
          { key: "lancamentos", label: "📋  Lançamentos" },
          { key: "dashboard",   label: "📊  Dashboard" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            padding: "12px 18px", background: "transparent", border: "none",
            borderBottom: activeTab === key ? "2px solid #3b82f6" : "2px solid transparent",
            color: activeTab === key ? "#1d4ed8" : "#64748b",
            fontWeight: activeTab === key ? 700 : 500, fontSize: 13,
            cursor: "pointer", marginBottom: -1,
          }}>{label}</button>
        ))}
      </div>

      {/* ── Tab: Lançamentos ── */}
      {activeTab === "lancamentos" && (
        <>
          <div style={S.filterBar}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍  Buscar descrição..." style={S.search} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {[
                { key: "all", label: `Todos (${transactions.length})` },
                { key: "sem", label: `Sem categoria (${semCategoria})` },
              ].map(({ key, label }) => (
                <button key={key} style={{ ...S.tab, ...(filter === key ? S.tabOn : {}) }}
                  onClick={() => setFilter(key)}>{label}</button>
              ))}
              {categories.map(c => {
                const count = transactions.filter(t => t.category === c.name).length;
                if (!count) return null;
                return (
                  <button key={c.name}
                    style={{ ...S.tab, ...(filter === c.name ? { background: c.color.bg, color: c.color.text, borderColor: c.color.border } : {}) }}
                    onClick={() => setFilter(filter === c.name ? "all" : c.name)}>
                    {c.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={{ ...S.th, width: 88 }}>Data</th>
                  <th style={S.th}>Descrição</th>
                  <th style={{ ...S.th, textAlign: "right", width: 120 }}>Valor</th>
                  <th style={{ ...S.th, width: 250 }}>Categoria</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} style={S.row}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                    <td style={{ ...S.td, color: "#94a3b8", fontSize: 12 }}>{t.date}</td>
                    <td style={S.td}><span style={{ fontSize: 13, color: "#1e293b", fontWeight: 500 }}>{t.memo}</span></td>
                    <td style={{ ...S.td, textAlign: "right", fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums", fontSize: 13 }}>{fmt(t.amount)}</td>
                    <td style={S.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <TagSelector value={t.category} categories={categories}
                          onChange={(cat) => setCategory(t.id, cat)} onAddCategory={addCategory} />
                        {t.auto && t.category && (
                          <span title="Categorizado automaticamente" style={{ fontSize: 10, color: "#6366f1", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 10, padding: "2px 7px", fontWeight: 700, whiteSpace: "nowrap" }}>✦ auto</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>Nenhum lançamento encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={S.footer}>
            <span style={{ color: "#64748b", fontSize: 13 }}>
              {filtered.length} lançamento{filtered.length !== 1 ? "s" : ""} exibido{filtered.length !== 1 ? "s" : ""}
            </span>
            <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>Total: {fmt(totalFiltered)}</span>
          </div>
        </>
      )}

      {/* ── Tab: Dashboard ── */}
      {activeTab === "dashboard" && (
        <Dashboard transactions={transactions} categories={categories} onFilterClick={handleDashFilterClick} />
      )}
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  uploadWrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", textAlign: "center", padding: 24 },
  uploadTitle: { margin: "0 0 8px", fontSize: 26, fontWeight: 800, color: "#0f172a" },
  uploadBtn: { display: "inline-block", background: "#3b82f6", color: "#fff", padding: "12px 28px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 15 },
  header: { background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, position: "sticky", top: 0, zIndex: 100 },
  chip: { background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  newBtn: { display: "inline-block", background: "#f1f5f9", color: "#334155", border: "1px solid #e2e8f0", padding: "7px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 },
  filterBar: { background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "10px 20px" },
  search: { border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 14px", fontSize: 13, outline: "none", color: "#334155", maxWidth: 340, background: "#f8fafc", width: "100%" },
  tab: { padding: "4px 12px", borderRadius: 20, border: "1px solid #e2e8f0", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 12, fontWeight: 600 },
  tabOn: { background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 560, background: "#fff" },
  th: { padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "2px solid #e2e8f0", background: "#f8fafc", position: "sticky", top: 53 },
  row: { borderBottom: "1px solid #f1f5f9", transition: "background 0.1s", background: "#fff" },
  td: { padding: "10px 14px", verticalAlign: "middle" },
  footer: { background: "#fff", borderTop: "1px solid #e2e8f0", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", bottom: 0 },
};
