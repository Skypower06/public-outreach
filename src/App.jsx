import { useState, useEffect, useCallback, useMemo, useRef } from "react";

/* ════════════════════════════════════════════════════════════
   PUBLIC OUTREACH v2 — mobile-first, clair, convivial
   Palette logo : Navy #2D2B6B · Rouge #E23744 · Or #F5C518
   ════════════════════════════════════════════════════════════ */

const SU = "https://guznkeqjpuqrmmzlmsfx.supabase.co";
const SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1em5rZXFqcHVxcm1temxtc2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMTcwMjAsImV4cCI6MjA5MDg5MzAyMH0.bwDxfh7ZhZ2I38i5hy1UFgkozw92mF8HoIqjAP8Z54c";
const HD = { apikey: SK, Authorization: "Bearer " + SK, "Content-Type": "application/json", Prefer: "return=representation" };
const SQ = { appId: "sq0idp-YZmxliRAFh5cKQRwoCsLLQ", locationId: "LPG6Q1KE7DEXM", env: "production" };

const SEED_USERS = [
  { id: "m1", login: "manager", password: "admin", role: "manager", name: "Sophie Tremblay", team: "Équipe Alpha" },
  { id: "c1", login: "alex", password: "1234", role: "collector", name: "Alex Dupont", team: "Équipe Alpha" },
  { id: "c2", login: "marie", password: "1234", role: "collector", name: "Marie Leclerc", team: "Équipe Alpha" },
  { id: "c3", login: "julien", password: "1234", role: "collector", name: "Julien Moreau", team: "Équipe Beta" },
  { id: "c4", login: "camille", password: "1234", role: "collector", name: "Camille Roy", team: "Équipe Beta" },
  { id: "c5", login: "lucas", password: "1234", role: "collector", name: "Lucas Bernard", team: "Non assigné" },
];
const seedDons = () => {
  const dn = ["Jean Valjean", "Claire Fontaine", "Pierre Martin", "Lucie Roche", "Marc Antoine", "Nadia Caron", "Henri Lafleur", "Isabelle Côté"];
  const ty = ["Mensuel", "Ponctuel", "Annuel"]; const r = []; const cs = SEED_USERS.filter(u => u.role === "collector");
  for (let d = 0; d < 7; d++) { const dt = new Date(); dt.setDate(dt.getDate() - d); const ds = dt.toISOString().split("T")[0];
    cs.forEach(c => { const n = Math.floor(Math.random() * 4) + 1; for (let i = 0; i < n; i++) r.push({ id: "d-" + c.id + "-" + d + "-" + i, collector_id: c.id, collector_name: c.name, team: c.team, donor: dn[Math.floor(Math.random() * dn.length)], amount: (Math.floor(Math.random() * 19) + 2) * 5, type: ty[Math.floor(Math.random() * ty.length)], date: ds, time: (9 + Math.floor(Math.random() * 9)) + ":" + String(Math.floor(Math.random() * 60)).padStart(2, "0") }); });
  } return r;
};
const LS = {
  _d: {},
  init() { try {
    this._d.users = JSON.parse(localStorage.getItem("po_users")) || [...SEED_USERS];
    this._d.donations = JSON.parse(localStorage.getItem("po_donations")) || seedDons();
    this._d.objectives = JSON.parse(localStorage.getItem("po_objectives")) || [{ team: "Équipe Alpha", goal: 25 }, { team: "Équipe Beta", goal: 20 }];
    this._d.day_status = JSON.parse(localStorage.getItem("po_day_status")) || [{ team: "Équipe Alpha", is_open: true }, { team: "Équipe Beta", is_open: true }];
    this._d.billing_records = JSON.parse(localStorage.getItem("po_billing_records")) || [];
    this._d.billing_entries = JSON.parse(localStorage.getItem("po_billing_entries")) || [];
    this._d.tap_donations = JSON.parse(localStorage.getItem("po_tap_donations")) || [];
    this._d.monthly_donations = JSON.parse(localStorage.getItem("po_monthly_donations")) || [];
  } catch { this._d = { users: [...SEED_USERS], donations: seedDons(), objectives: [{ team: "Équipe Alpha", goal: 25 }, { team: "Équipe Beta", goal: 20 }], day_status: [{ team: "Équipe Alpha", is_open: true }, { team: "Équipe Beta", is_open: true }], billing_records: [], billing_entries: [], tap_donations: [], monthly_donations: [] }; } },
  save(t) { try { localStorage.setItem("po_" + t, JSON.stringify(this._d[t])); } catch {} },
  get(t, q) { let d = this._d[t] || []; if (q) { q.split("&").forEach(p => { const m = p.match(/^(\w+)=eq\.(.+)$/); if (m) d = d.filter(r => String(r[m[1]]) === decodeURIComponent(m[2])); }); } return d; },
  post(t, a) { if (!this._d[t]) this._d[t] = []; a.forEach(r => this._d[t].push(r)); this.save(t); return a; },
  patch(t, q, d) { const m = q.match(/^(\w+)=eq\.(.+)$/); if (m) { this._d[t] = this._d[t].map(r => String(r[m[1]]) === decodeURIComponent(m[2]) ? { ...r, ...d } : r); this.save(t); } return d; },
  upsert(t, a) { if (!this._d[t]) this._d[t] = []; a.forEach(it => { const pk = (t === "objectives" || t === "day_status") ? "team" : "id"; const i = this._d[t].findIndex(r => r[pk] === it[pk]); if (i >= 0) this._d[t][i] = { ...this._d[t][i], ...it }; else this._d[t].push(it); }); this.save(t); return a; },
};
LS.init();
let useLocal = false;
const db = {
  get: async (t, q = "") => { if (useLocal) return LS.get(t, q); try { const r = await fetch(SU + "/rest/v1/" + t + "?" + q, { headers: HD }); if (r.ok) return r.json(); useLocal = true; return LS.get(t, q); } catch { useLocal = true; return LS.get(t, q); } },
  post: async (t, d) => { if (useLocal) return LS.post(t, d); try { const r = await fetch(SU + "/rest/v1/" + t, { method: "POST", headers: HD, body: JSON.stringify(d) }); if (r.ok) return r.json(); useLocal = true; return LS.post(t, d); } catch { useLocal = true; return LS.post(t, d); } },
  patch: async (t, m, d) => { if (useLocal) return LS.patch(t, m, d); try { const r = await fetch(SU + "/rest/v1/" + t + "?" + m, { method: "PATCH", headers: HD, body: JSON.stringify(d) }); if (r.ok) return r.json(); useLocal = true; return LS.patch(t, m, d); } catch { useLocal = true; return LS.patch(t, m, d); } },
  upsert: async (t, d) => { if (useLocal) return LS.upsert(t, d); try { const h = { ...HD, Prefer: "return=representation,resolution=merge-duplicates" }; const r = await fetch(SU + "/rest/v1/" + t, { method: "POST", headers: h, body: JSON.stringify(d) }); if (r.ok) return r.json(); useLocal = true; return LS.upsert(t, d); } catch { useLocal = true; return LS.upsert(t, d); } },
};

/* ── Configuration Square ─────────────────────────────────────
   1) SQ.appId  : Application ID (developer.squareup.com → ton app → Credentials)
   2) SQ.locationId : Location ID (même page, onglet Locations)
   3) Secrets côté serveur (Supabase → Edge Functions → square → Secrets) :
      SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID, SQUARE_ENV (production|sandbox)
   Tant que appId/locationId sont vides, l'app reste en mode démo. */
const SQ = { appId: "", locationId: "", env: "production" };
const sqReady = () => !!(SQ.appId && SQ.locationId);
const callSq = async (body) => {
  try {
    const r = await fetch(SU + "/functions/v1/square", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + SK, apikey: SK }, body: JSON.stringify(body) });
    return await r.json();
  } catch (e) { return { ok: false, error: String(e) }; }
};
let sqSdkP = null;
const loadSqSdk = () => {
  if (window.Square) return Promise.resolve(window.Square);
  if (!sqSdkP) sqSdkP = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = SQ.env === "sandbox" ? "https://sandbox.web.squarecdn.com/v1/square.js" : "https://web.squarecdn.com/v1/square.js";
    s.onload = () => res(window.Square); s.onerror = rej;
    document.head.appendChild(s);
  });
  return sqSdkP;
};

const TEAMS = ["Équipe Alpha", "Équipe Beta"];
const td = new Date().toISOString().split("T")[0];
const frDate = new Date().toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long" });
const greet = () => { const h = new Date().getHours(); return h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir"; };
const ini = n => n.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

const C = { nv: "#2D2B6B", nl: "#403D8F", nd: "#1E1C4F", rd: "#E23744", rk: "#C12030", gd: "#F5C518", gk: "#B8930A", bg: "#F5F4FB", sf: "#FFFFFF", bd: "#E6E4F2", bl: "#F0EFF8", tx: "#1A1840", t2: "#5F5C8A", t3: "#A3A1C2" };
const Fn = { d: "'Outfit',sans-serif", m: "'JetBrains Mono',monospace" };

/* ── Global CSS ── */
const Css = () => { useEffect(() => { if (document.getElementById("po")) return; const s = document.createElement("style"); s.id = "po"; s.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
body{background:${C.bg}}
@keyframes fu{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fi{from{opacity:0}to{opacity:1}}
@keyframes si{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
@keyframes up{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
@keyframes sp{to{transform:rotate(360deg)}}
@keyframes sL{0%{opacity:0;transform:scale(.5) rotate(-10deg)}60%{opacity:1;transform:scale(1.08) rotate(2deg)}100%{opacity:1;transform:scale(1)}}
@keyframes sR1{0%{stroke-dashoffset:200;opacity:0}50%{opacity:1}100%{stroke-dashoffset:0;opacity:1}}
@keyframes sR2{0%{stroke-dashoffset:200;opacity:0}60%{opacity:1}100%{stroke-dashoffset:0;opacity:1}}
@keyframes sR3{0%{stroke-dashoffset:200;opacity:0}70%{opacity:1}100%{stroke-dashoffset:0;opacity:1}}
@keyframes sT{0%{opacity:0;transform:translateY(16px);letter-spacing:10px}100%{opacity:1;transform:translateY(0);letter-spacing:-.5px}}
@keyframes sO{to{opacity:0;transform:scale(1.04)}}
@keyframes wP{0%{opacity:0;transform:scale(.7)}60%{transform:scale(1.05)}100%{opacity:1;transform:scale(1)}}
@keyframes wR{0%{transform:scale(.5);opacity:0}50%{opacity:.3}100%{transform:scale(2.4);opacity:0}}
@keyframes wC{from{stroke-dashoffset:30}to{stroke-dashoffset:0}}
@keyframes pg{from{width:0}}
@keyframes nfc{0%{transform:scale(.62);opacity:.85}100%{transform:scale(1.55);opacity:0}}
.afu{animation:fu .5s ease both}.afi{animation:fi .4s ease both}.asi{animation:si .35s ease both}
.d1{animation-delay:.05s}.d2{animation-delay:.1s}.d3{animation-delay:.15s}.d4{animation-delay:.2s}.d5{animation-delay:.25s}
.bt{transition:transform .18s ease,box-shadow .18s ease,opacity .18s;cursor:pointer;font-family:${Fn.d}}
.bt:active{transform:scale(.97)}
@media(hover:hover){.bt:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(45,43,107,.14)}}
.ip:focus{border-color:${C.nv}!important;box-shadow:0 0 0 4px rgba(45,43,107,.1)!important;outline:none}
input[type=number]::-webkit-inner-spin-button{opacity:1}
::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-thumb{background:${C.bd};border-radius:3px}::-webkit-scrollbar-track{background:transparent}
.deskNav{display:flex}.mobNav{display:none}
@media(max-width:720px){.deskNav{display:none}.mobNav{display:flex}.mainPad{padding-bottom:104px!important}}
@media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}
`; document.head.appendChild(s); }, []); return null; };

/* ── Atoms ── */
const Ic = ({ d, sz = 18, c = "currentColor", sw = 2 }) => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
const ic = {
  home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  us: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  lk: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  ot: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  ls: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  ca: "M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18",
  tm: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  xx: "M18 6L6 18M6 6l12 12",
  ck: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2",
  pl: "M5 3l14 9-14 9V3z", st: "M6 4h4v16H6zM14 4h4v16h-4z",
  fi: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
  sv: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8",
  dn: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  rf: "M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15",
  tp: "M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM1 10h22",
  ch: "M20 6L9 17l-5-5",
  ht: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z",
  gift: "M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z",
  arr: "M5 12h14M12 5l7 7-7 7",
};
const Logo = ({ sz = 36, an = false }) => <svg width={sz} height={sz} viewBox="0 0 100 100" fill="none"><rect x="5" y="5" width="44" height="44" rx="7" stroke={C.rd} strokeWidth="5.5" fill="none" style={an ? { strokeDasharray: 200, animation: "sR1 1s ease both" } : {}} /><rect x="26" y="26" width="44" height="44" rx="7" stroke={C.nv} strokeWidth="5.5" fill="none" style={an ? { strokeDasharray: 200, animation: "sR2 1s ease .15s both" } : {}} /><rect x="38" y="42" width="38" height="38" rx="7" stroke={C.gd} strokeWidth="5.5" fill="none" style={an ? { strokeDasharray: 200, animation: "sR3 1s ease .3s both" } : {}} /></svg>;

const card = { background: C.sf, borderRadius: 20, border: "1px solid " + C.bd, boxShadow: "0 2px 14px rgba(45,43,107,.06)" };
const iS = { width: "100%", padding: "15px 16px", background: C.bg, border: "1.5px solid " + C.bd, borderRadius: 14, color: C.tx, fontSize: 16, fontFamily: Fn.d, fontWeight: 500, boxSizing: "border-box", outline: "none", transition: "border .2s, box-shadow .2s" };
const lbl = { color: C.t2, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 7, textTransform: "uppercase", letterSpacing: 1.3 };

function toCSV(data, fn) { if (!data.length) return false; const h = Object.keys(data[0]); const c = [h.join(","), ...data.map(r => h.map(k => '"' + String(r[k] ?? "").replace(/"/g, '""') + '"').join(","))].join("\n"); const b = new Blob(["\uFEFF" + c], { type: "text/csv;charset=utf-8;" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = fn; a.click(); URL.revokeObjectURL(u); return true; }

/* ── Progress Ring (signature) ── */
function Ring({ pct, size = 150, sw = 13, label, sub }) {
  const r = (size - sw) / 2, c2 = 2 * Math.PI * r, off = c2 * (1 - Math.min(pct, 100) / 100);
  const id = "g" + Math.round(size);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        <defs><linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={pct >= 100 ? C.gd : C.rd} /><stop offset="55%" stopColor={pct >= 100 ? "#FFD84D" : C.nv} /><stop offset="100%" stopColor={pct >= 100 ? C.gk : C.nl} />
        </linearGradient></defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={C.bl} strokeWidth={sw} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={"url(#" + id + ")"} strokeWidth={sw} fill="none" strokeLinecap="round" strokeDasharray={c2} strokeDashoffset={off} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size / 4.6, fontWeight: 900, fontFamily: Fn.d, color: pct >= 100 ? C.gk : C.nv, lineHeight: 1 }}>{Math.round(pct)}%</span>
        {label && <span style={{ fontSize: 11, fontWeight: 700, color: C.t2, marginTop: 3 }}>{label}</span>}
        {sub && <span style={{ fontSize: 10, fontWeight: 600, color: C.t3, fontFamily: Fn.m }}>{sub}</span>}
      </div>
    </div>
  );
}

/* ── Donation list (cards, mobile-friendly) ── */
const typeColor = t => t === "Mensuel" ? C.nv : t === "Annuel" ? C.gk : C.rd;
const typeBg = t => t === "Mensuel" ? C.nv + "12" : t === "Annuel" ? C.gd + "22" : C.rd + "10";
function DonList({ data, showCol, empty }) {
  if (!data.length) return (
    <div className="afu" style={{ ...card, padding: "44px 24px", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 18, background: C.bl, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}><Ic d={ic.gift} sz={26} c={C.t3} /></div>
      <p style={{ color: C.t2, fontSize: 15, fontWeight: 700 }}>{empty || "Aucune donation pour l'instant"}</p>
      <p style={{ color: C.t3, fontSize: 13, marginTop: 4 }}>Les donations apparaîtront ici.</p>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map((d, i) => (
        <div key={d.id} className="afu" style={{ ...card, animationDelay: Math.min(i * .03, .3) + "s", padding: "14px 16px", display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: typeBg(d.type), color: typeColor(d.type), display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, fontFamily: Fn.d, flexShrink: 0 }}>{ini(d.donor)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: C.tx, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.donor}</div>
            <div style={{ color: C.t3, fontSize: 12, fontWeight: 500, marginTop: 2 }}>{d.time}{showCol ? " · " + d.collector_name : ""}{" · " + d.date}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ color: C.nv, fontSize: 16, fontWeight: 800, fontFamily: Fn.m }}>{d.amount}$</div>
            <span style={{ background: typeBg(d.type), color: typeColor(d.type), padding: "2px 9px", borderRadius: 12, fontSize: 10, fontWeight: 800 }}>{d.type}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Small bits ── */
function Stat({ icon, label, value, color, cl }) {
  return <div className={"afu " + (cl || "")} style={{ ...card, padding: "16px 18px", flex: 1, minWidth: 100 }}>
    <div style={{ width: 34, height: 34, borderRadius: 10, background: (color || C.nv) + "12", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}><Ic d={icon} sz={16} c={color || C.nv} /></div>
    <div style={{ color: C.tx, fontSize: 23, fontWeight: 900, fontFamily: Fn.d, lineHeight: 1 }}>{value}</div>
    <div style={{ color: C.t2, fontSize: 11.5, fontWeight: 600, marginTop: 5 }}>{label}</div>
  </div>;
}
function Chip({ on, children, onClick }) {
  return <button onClick={onClick} className="bt" style={{ padding: "9px 17px", borderRadius: 22, border: "1.5px solid " + (on ? C.nv : C.bd), background: on ? C.nv : C.sf, color: on ? "#fff" : C.t2, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>{children}</button>;
}
function DtP({ v, set }) {
  return <input type="date" value={v} onChange={e => set(e.target.value)} className="ip" style={{ background: C.sf, border: "1.5px solid " + C.bd, borderRadius: 12, padding: "9px 13px", color: C.tx, fontSize: 13, fontFamily: Fn.m, fontWeight: 500 }} />;
}
function SecTitle({ children, right }) {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "26px 0 13px", gap: 10, flexWrap: "wrap" }}>
    <h3 style={{ color: C.tx, fontSize: 16, fontWeight: 800, fontFamily: Fn.d }}>{children}</h3>{right}
  </div>;
}

/* ── Splash & Welcome ── */
function Splash({ onDone }) {
  const [o, sO] = useState(false);
  useEffect(() => { const a = setTimeout(() => sO(true), 2100); const b = setTimeout(onDone, 2650); return () => { clearTimeout(a); clearTimeout(b); }; }, [onDone]);
  return <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: `linear-gradient(165deg,${C.nd},${C.nv} 55%,${C.nl})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: Fn.d, animation: o ? "sO .55s ease both" : "none" }}><Css />
    <div style={{ animation: "sL 1s cubic-bezier(.34,1.56,.64,1) both", marginBottom: 26 }}><Logo sz={86} an /></div>
    <h1 style={{ color: "#fff", fontSize: 34, fontWeight: 900, animation: "sT .9s ease .55s both" }}>Public Outreach</h1>
    <p style={{ color: "rgba(255,255,255,.55)", fontSize: 14, fontWeight: 500, animation: "fi .5s ease 1.1s both", marginTop: 8 }}>Gestion de collecte de dons</p>
    <div style={{ marginTop: 34, width: 110, height: 3, background: "rgba(255,255,255,.12)", borderRadius: 3, overflow: "hidden", animation: "fi .4s ease 1.3s both" }}><div style={{ height: "100%", background: `linear-gradient(90deg,${C.rd},${C.gd})`, animation: "pg 1.4s ease .8s both" }} /></div>
  </div>;
}
function Welcome({ usr, onDone }) {
  const [o, sO] = useState(false);
  useEffect(() => { const a = setTimeout(() => sO(true), 1800); const b = setTimeout(onDone, 2300); return () => { clearTimeout(a); clearTimeout(b); }; }, [onDone]);
  return <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: `linear-gradient(165deg,${C.nd},${C.nv} 55%,${C.nl})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: Fn.d, animation: o ? "sO .5s ease both" : "none" }}><Css />
    <div style={{ position: "absolute", width: 100, height: 100, borderRadius: "50%", border: "2px solid " + C.gd + "40", animation: "wR 1.4s ease .25s both" }} />
    <div style={{ position: "absolute", width: 100, height: 100, borderRadius: "50%", border: "2px solid " + C.rd + "30", animation: "wR 1.4s ease .5s both" }} />
    <div style={{ animation: "wP .65s cubic-bezier(.34,1.56,.64,1) both", marginBottom: 22 }}>
      <div style={{ width: 84, height: 84, borderRadius: "50%", background: `linear-gradient(135deg,${C.rd},${C.gd})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 36px rgba(226,55,68,.35)" }}>
        <svg width={38} height={38} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" style={{ strokeDasharray: 30, animation: "wC .55s ease .45s both" }} /></svg>
      </div>
    </div>
    <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 900, animation: "fu .55s ease .25s both" }}>{greet()}, {usr.name.split(" ")[0]} !</h2>
    <p style={{ color: "rgba(255,255,255,.55)", fontSize: 14, fontWeight: 500, animation: "fu .55s ease .4s both", marginTop: 6 }}>{usr.role === "manager" ? "Espace Manager" : "Espace Collecteur"} · {usr.team}</p>
  </div>;
}

/* ── Login ── */
function Login({ onLogin }) {
  const [l, sL] = useState(""); const [p, sP] = useState(""); const [e, sE] = useState(""); const [ld, sLd] = useState(false);
  const go = async () => {
    if (!l || !p) { sE("Entrez votre identifiant et mot de passe"); return; }
    sLd(true); sE("");
    try { const u = await db.get("users", "login=eq." + encodeURIComponent(l) + "&password=eq." + encodeURIComponent(p)); if (u.length) onLogin(u[0]); else { sE("Identifiant ou mot de passe incorrect"); sLd(false); } }
    catch { sE("Connexion impossible — réessayez"); sLd(false); }
  };
  return <div style={{ minHeight: "100vh", background: `linear-gradient(165deg,${C.nd},${C.nv} 50%,${C.nl})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: Fn.d, padding: 20, position: "relative", overflow: "hidden" }}><Css />
    <div style={{ position: "absolute", top: -110, right: -110, width: 340, height: 340, borderRadius: "50%", background: C.rd + "14" }} />
    <div style={{ position: "absolute", bottom: -90, left: -90, width: 290, height: 290, borderRadius: "50%", background: C.gd + "12" }} />
    <div className="asi" style={{ width: "100%", maxWidth: 430, background: C.sf, borderRadius: 28, padding: "48px 36px 40px", boxShadow: "0 28px 80px rgba(0,0,0,.32)", position: "relative" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div className="afu"><Logo sz={54} /></div>
        <h1 className="afu d1" style={{ color: C.nv, fontSize: 27, fontWeight: 900, margin: "13px 0 5px" }}>Public Outreach</h1>
        <p className="afu d2" style={{ color: C.t2, fontSize: 14, fontWeight: 500 }}>Connectez-vous à votre espace</p>
      </div>
      <div className="afu d2" style={{ marginBottom: 18 }}>
        <label style={lbl}>Identifiant</label>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)" }}><Ic d={ic.us} sz={16} c={C.t3} /></div>
          <input value={l} onChange={x => sL(x.target.value)} onKeyDown={x => x.key === "Enter" && go()} placeholder="Votre identifiant" autoCapitalize="none" className="ip" style={{ ...iS, paddingLeft: 46 }} />
        </div>
      </div>
      <div className="afu d3" style={{ marginBottom: 26 }}>
        <label style={lbl}>Mot de passe</label>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)" }}><Ic d={ic.lk} sz={16} c={C.t3} /></div>
          <input type="password" value={p} onChange={x => sP(x.target.value)} onKeyDown={x => x.key === "Enter" && go()} placeholder="Votre mot de passe" className="ip" style={{ ...iS, paddingLeft: 46 }} />
        </div>
      </div>
      {e && <div className="asi" style={{ background: C.rd + "0A", border: "1px solid " + C.rd + "25", borderRadius: 12, padding: "11px 15px", marginBottom: 16, color: C.rd, fontSize: 13, textAlign: "center", fontWeight: 700 }}>{e}</div>}
      <button onClick={go} disabled={ld} className="bt afu d4" style={{ width: "100%", padding: 17, background: ld ? C.nl : `linear-gradient(135deg,${C.nv},${C.nd})`, border: "none", borderRadius: 16, color: "#fff", fontSize: 16, fontWeight: 800, opacity: ld ? .75 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
        {ld ? <><div style={{ width: 16, height: 16, border: "2.5px solid rgba(255,255,255,.35)", borderTopColor: "#fff", borderRadius: "50%", animation: "sp .8s linear infinite" }} />Connexion...</> : "Se connecter"}
      </button>
    </div>
  </div>;
}

/* ── Tap : donation unique (sans contact) ou mensuelle ── */
const AMTS = [10, 20, 25, 50, 75, 100];
const AMTS_M = [5, 10, 15, 20, 25, 50];
const okEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const digits = s => s.replace(/\D/g, "");
const isMob = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

function TapDon({ usr, onDone, notify }) {
  const [mode, sMode] = useState(null);
  const [step, sStep] = useState("form");
  const [fm, sFm] = useState({ fn: "", ln: "", em: "", amt: 25, cst: "", adr: "", sx: "", ph: "" });
  const [pm, sPm] = useState("carte");
  const [cd, sCd] = useState({ num: "", exp: "", cvc: "" });
  const [bk, sBk] = useState({ tr: "", inst: "", acc: "" });
  const [consent, sConsent] = useState(false);
  const [er, sEr] = useState("");
  const [sqSt, sSqSt] = useState("idle");
  const [cdLast, sCdLast] = useState("");
  const sqCardRef = useRef(null);
  const amt = fm.cst ? parseInt(fm.cst) : fm.amt;
  const sf = (k, v) => sFm(p => ({ ...p, [k]: v }));
  const full = () => (fm.fn.trim() + " " + fm.ln.trim()).trim();
  const back = () => { sEr(""); if (step === "form") { sMode(null); } else { sStep("form"); } };
  const resetAll = () => { sFm({ fn: "", ln: "", em: "", amt: 25, cst: "", adr: "", sx: "", ph: "" }); sCd({ num: "", exp: "", cvc: "" }); sBk({ tr: "", inst: "", acc: "" }); sConsent(false); sEr(""); sCdLast(""); sStep("form"); sMode(null); if (onDone) onDone(); };

  /* Module carte Square (don mensuel) */
  useEffect(() => {
    let dead = false;
    if (!(mode === "monthly" && step === "pay" && pm === "carte" && sqReady())) return;
    (async () => {
      try {
        sSqSt("loading");
        const Sq = await loadSqSdk();
        const payments = Sq.payments(SQ.appId, SQ.locationId);
        const cardEl = await payments.card();
        if (dead) { try { cardEl.destroy(); } catch {} return; }
        await cardEl.attach("#sq-card");
        sqCardRef.current = cardEl;
        sSqSt("ready");
      } catch { if (!dead) sSqSt("error"); }
    })();
    return () => { dead = true; try { if (sqCardRef.current) { sqCardRef.current.destroy(); sqCardRef.current = null; } } catch {} };
  }, [mode, step, pm]);

  /* validations */
  const goU = () => {
    if (!fm.fn.trim() || !fm.ln.trim()) { sEr("Entrez le prénom et le nom du donateur"); return; }
    if (!amt || amt < 1) { sEr("Choisissez un montant valide"); return; }
    if (!fm.em.trim() || !okEmail(fm.em.trim())) { sEr("Entrez un courriel valide pour le reçu"); return; }
    sEr(""); sStep("tap");
  };
  const goM = () => {
    if (!fm.fn.trim() || !fm.ln.trim()) { sEr("Entrez le prénom et le nom"); return; }
    if (!fm.adr.trim()) { sEr("Entrez l'adresse"); return; }
    if (!fm.em.trim() || !okEmail(fm.em.trim())) { sEr("Entrez un courriel valide"); return; }
    if (!fm.ph.trim() || digits(fm.ph).length < 10) { sEr("Entrez un numéro de téléphone valide"); return; }
    if (!amt || amt < 1) { sEr("Choisissez un montant valide"); return; }
    sEr(""); sStep("pay");
  };

  const now = () => { const n = new Date(); return n.getHours() + ":" + String(n.getMinutes()).padStart(2, "0"); };

  /* ── Tap to Pay réel : ouvre l'app Square Point de vente ── */
  const tapSquare = () => {
    try { localStorage.setItem("po_pending_tap", JSON.stringify({ fn: fm.fn.trim(), ln: fm.ln.trim(), em: fm.em.trim(), amt, uid: usr.id, uname: usr.name, team: usr.team })); } catch {}
    const cb = window.location.origin + window.location.pathname;
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      const data = { amount_money: { amount: Math.round(amt * 100), currency_code: "CAD" }, callback_url: cb, client_id: SQ.appId, version: "1.3", notes: "Donation Public Outreach", options: { supported_tender_types: ["CREDIT_CARD"] } };
      window.location.href = "square-commerce-v1://payment/create?data=" + encodeURIComponent(JSON.stringify(data));
    } else {
      window.location.href = "intent:#Intent;action=com.squareup.pos.action.CHARGE;package=com.squareup;S.browser_fallback_url=" + encodeURIComponent(cb) + ";S.com.squareup.pos.WEB_CALLBACK_URI=" + encodeURIComponent(cb) + ";S.com.squareup.pos.CLIENT_ID=" + SQ.appId + ";S.com.squareup.pos.API_VERSION=v2.0;i.com.squareup.pos.TOTAL_AMOUNT=" + Math.round(amt * 100) + ";S.com.squareup.pos.CURRENCY_CODE=CAD;S.com.squareup.pos.TENDER_TYPES=com.squareup.pos.TENDER_CARD;end";
    }
  };

  /* ── Donation unique simulée (sans terminal) ── */
  const payU = async () => {
    sStep("processing");
    const t = now(); const id = "tap-" + usr.id + "-" + Date.now();
    try {
      await Promise.all([
        db.post("tap_donations", [{ id, donor_name: full(), first_name: fm.fn.trim(), last_name: fm.ln.trim(), donor_email: fm.em.trim(), donor_phone: null, amount: amt, collector_id: usr.id, collector_name: usr.name, team: usr.team, payment_status: "completed", payment_nonce: "tap_sim_" + Date.now(), receipt_sent: true, date: td, time: t }]),
        db.post("donations", [{ id, collector_id: usr.id, collector_name: usr.name, team: usr.team, donor: full(), amount: amt, type: "Ponctuel", date: td, time: t }]),
      ]);
      await new Promise(r => setTimeout(r, 1900));
      sStep("success");
    } catch { sEr("Le paiement n'a pas pu être traité"); sStep("tap"); }
  };

  /* ── Don mensuel : Square réel (carte) ou enregistrement (chèque / simulation) ── */
  const payM = async () => {
    if (pm === "cheque") {
      if (digits(bk.tr).length !== 5) { sEr("Le numéro de transit compte 5 chiffres"); return; }
      if (digits(bk.inst).length !== 3) { sEr("Le numéro d'institution compte 3 chiffres"); return; }
      if (digits(bk.acc).length < 5) { sEr("Numéro de compte invalide"); return; }
      if (!consent) { sEr("Le consentement au prélèvement est requis"); return; }
    } else if (!sqReady()) {
      if (digits(cd.num).length < 12) { sEr("Numéro de carte invalide"); return; }
      if (!/^\d{2}\/\d{2}$/.test(cd.exp)) { sEr("Expiration au format MM/AA"); return; }
      if (digits(cd.cvc).length < 3) { sEr("CVC invalide"); return; }
    }
    sEr("");
    const t = now(); const id = "mon-" + usr.id + "-" + Date.now();
    const base = { id, first_name: fm.fn.trim(), last_name: fm.ln.trim(), address: fm.adr.trim(), email: fm.em.trim(), gender: fm.sx || null, phone: fm.ph.trim(), amount: amt, collector_id: usr.id, collector_name: usr.name, team: usr.team, date: td, time: t, status: "active" };
    const donRow = { id, collector_id: usr.id, collector_name: usr.name, team: usr.team, donor: full(), amount: amt, type: "Mensuel", date: td, time: t };

    /* Carte via Square : tokenisation + abonnement réel */
    if (pm === "carte" && sqReady()) {
      if (!sqCardRef.current) { sEr("Le module de carte n'est pas encore prêt"); return; }
      sStep("processing");
      try {
        const tk = await sqCardRef.current.tokenize();
        if (tk.status !== "OK") throw new Error((tk.errors && tk.errors[0] && tk.errors[0].message) || "Carte refusée");
        const res = await callSq({ action: "create_subscription", card_token: tk.token, amount: amt, first_name: fm.fn.trim(), last_name: fm.ln.trim(), email: fm.em.trim(), phone: fm.ph.trim(), address: fm.adr.trim() });
        if (!res.ok) throw new Error(res.error || "Erreur Square");
        sCdLast(res.card_last4 || "");
        await Promise.all([
          db.post("monthly_donations", [{ ...base, payment_method: "carte", card_last4: res.card_last4 || null, bank_transit: null, bank_institution: null, bank_account: null, ppa_consent: false, square_customer_id: res.customer_id || null, square_subscription_id: res.subscription_id || null }]),
          db.post("donations", [donRow]),
        ]);
        sStep("success");
      } catch (e) { sEr(String((e && e.message) || e)); sStep("pay"); }
      return;
    }

    /* Chèque (PPA) ou carte en mode démo */
    sStep("processing");
    try {
      if (pm === "carte") sCdLast(digits(cd.num).slice(-4));
      await Promise.all([
        db.post("monthly_donations", [{ ...base, payment_method: pm, card_last4: pm === "carte" ? digits(cd.num).slice(-4) : null, bank_transit: pm === "cheque" ? digits(bk.tr) : null, bank_institution: pm === "cheque" ? digits(bk.inst) : null, bank_account: pm === "cheque" ? digits(bk.acc) : null, ppa_consent: pm === "cheque" ? consent : false, square_customer_id: null, square_subscription_id: null }]),
        db.post("donations", [donRow]),
      ]);
      await new Promise(r => setTimeout(r, 1500));
      sStep("success");
    } catch { sEr("L'inscription n'a pas pu être enregistrée"); sStep("pay"); }
  };

  const eBox = er ? <div className="asi" style={{ background: C.rd + "0A", border: "1px solid " + C.rd + "25", borderRadius: 12, padding: "11px 15px", marginBottom: 14, color: C.rd, fontSize: 13, fontWeight: 700, textAlign: "center" }}>{er}</div> : null;
  const stepsArr = mode === "unique" ? ["Donateur", "Sans contact", "Confirmé"] : ["Donateur", "Paiement", "Confirmé"];
  const stepIdx = step === "form" ? 0 : step === "success" ? 2 : 1;
  const segBtn = (on) => ({ flex: 1, padding: "12px 10px", borderRadius: 12, border: "2px solid " + (on ? C.nv : C.bd), background: on ? C.nv : C.sf, color: on ? "#fff" : C.t2, fontSize: 13.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 });

  return <div style={{ maxWidth: 530, margin: "0 auto" }}>

    {/* ── Choix du type ── */}
    {mode === null && <div>
      <div className="afu" style={{ textAlign: "center", marginBottom: 20 }}>
        <h3 style={{ color: C.tx, fontSize: 21, fontWeight: 900 }}>Nouvelle donation</h3>
        <p style={{ color: C.t2, fontSize: 13.5, fontWeight: 500, marginTop: 4 }}>Choisissez le type de don</p>
      </div>
      <button onClick={() => { sMode("unique"); sStep("form"); }} className="bt afu d1" style={{ ...card, width: "100%", padding: 22, display: "flex", alignItems: "center", gap: 16, textAlign: "left", marginBottom: 13 }}>
        <div style={{ width: 54, height: 54, borderRadius: 16, background: `linear-gradient(135deg,${C.rd},${C.gd})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ic d={ic.tp} sz={25} c="#fff" /></div>
        <div style={{ flex: 1 }}>
          <p style={{ color: C.tx, fontSize: 16.5, fontWeight: 900 }}>Donation unique</p>
          <p style={{ color: C.t2, fontSize: 13, fontWeight: 500, marginTop: 3 }}>Paiement sans contact · reçu par courriel</p>
        </div>
        <Ic d={ic.arr} sz={18} c={C.t3} />
      </button>
      <button onClick={() => { sMode("monthly"); sStep("form"); }} className="bt afu d2" style={{ ...card, width: "100%", padding: 22, display: "flex", alignItems: "center", gap: 16, textAlign: "left" }}>
        <div style={{ width: 54, height: 54, borderRadius: 16, background: `linear-gradient(135deg,${C.nv},${C.nl})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ic d={ic.ht} sz={24} c="#fff" /></div>
        <div style={{ flex: 1 }}>
          <p style={{ color: C.tx, fontSize: 16.5, fontWeight: 900 }}>Donation mensuelle</p>
          <p style={{ color: C.t2, fontSize: 13, fontWeight: 500, marginTop: 3 }}>Prélèvement récurrent · carte ou chèque</p>
        </div>
        <Ic d={ic.arr} sz={18} c={C.t3} />
      </button>
    </div>}

    {/* ── Stepper ── */}
    {mode !== null && <div className="afu" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, justifyContent: "center" }}>
      {stepsArr.map((s, i) => { const on = i <= stepIdx; return <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: on ? C.nv : C.bl, color: on ? "#fff" : C.t3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, transition: "all .3s" }}>{i < stepIdx ? "✓" : i + 1}</div>
          <span style={{ fontSize: 12, fontWeight: 700, color: on ? C.nv : C.t3 }}>{s}</span>
        </div>
        {i < 2 && <div style={{ width: 24, height: 2, background: i < stepIdx ? C.nv : C.bl, borderRadius: 2 }} />}
      </div>; })}
    </div>}

    {/* ══ UNIQUE : formulaire ══ */}
    {mode === "unique" && step === "form" && <div className="afu" style={{ ...card, padding: 26 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: `linear-gradient(135deg,${C.rd},${C.gd})`, display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={ic.tp} sz={21} c="#fff" /></div>
        <div><h3 style={{ color: C.tx, fontSize: 18, fontWeight: 900 }}>Donation unique</h3><p style={{ color: C.t2, fontSize: 12.5, fontWeight: 500 }}>Paiement sans contact</p></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginBottom: 15 }}>
        <div><label style={lbl}>Prénom *</label><input value={fm.fn} onChange={x => sf("fn", x.target.value)} placeholder="Prénom" className="ip" style={iS} /></div>
        <div><label style={lbl}>Nom *</label><input value={fm.ln} onChange={x => sf("ln", x.target.value)} placeholder="Nom" className="ip" style={iS} /></div>
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={lbl}>Courriel *</label>
        <input value={fm.em} onChange={x => sf("em", x.target.value)} placeholder="courriel@exemple.com" inputMode="email" autoCapitalize="none" className="ip" style={iS} />
        <p style={{ color: C.t3, fontSize: 11.5, fontWeight: 500, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}><Ic d={ic.fi} sz={12} c={C.t3} />Le reçu de donation sera envoyé à cette adresse</p>
      </div>
      <label style={lbl}>Montant *</label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9, marginBottom: 12 }}>
        {AMTS.map(a => { const on = fm.amt === a && !fm.cst; return <button key={a} onClick={() => { sf("amt", a); sf("cst", ""); }} className="bt" style={{ padding: "15px 8px", borderRadius: 13, border: "2px solid " + (on ? C.nv : C.bd), background: on ? C.nv : C.sf, color: on ? "#fff" : C.t2, fontSize: 17, fontWeight: 800 }}>{a}$</button>; })}
      </div>
      <input type="number" min="1" value={fm.cst} onChange={x => sf("cst", x.target.value)} placeholder="Autre montant ($)" inputMode="numeric" className="ip" style={{ ...iS, fontFamily: Fn.m, fontWeight: 700, marginBottom: 18 }} />
      {eBox}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={back} className="bt" style={{ flex: 1, padding: 16, borderRadius: 15, border: "1.5px solid " + C.bd, background: C.sf, color: C.t2, fontSize: 14, fontWeight: 700 }}>Retour</button>
        <button onClick={goU} className="bt" style={{ flex: 2, padding: 16, borderRadius: 15, border: "none", background: `linear-gradient(135deg,${C.nv},${C.nd})`, color: "#fff", fontSize: 15.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>Continuer<Ic d={ic.arr} sz={16} c="#fff" /></button>
      </div>
    </div>}

    {/* ══ UNIQUE : Tap to Pay ══ */}
    {mode === "unique" && step === "tap" && <div className="asi" style={{ ...card, overflow: "hidden", boxShadow: "0 12px 44px rgba(45,43,107,.16)" }}>
      <div style={{ background: `linear-gradient(135deg,${C.nv},${C.nd})`, padding: "22px 26px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, opacity: .65, textTransform: "uppercase", letterSpacing: 1.5 }}>Donation de</p>
          <div style={{ fontSize: 36, fontWeight: 900 }}>{amt}$</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 14, fontWeight: 700 }}>{full()}</p>
          <p style={{ fontSize: 12, opacity: .7, marginTop: 2 }}>{fm.em}</p>
        </div>
      </div>
      <div style={{ padding: "34px 26px 26px", textAlign: "center" }}>
        <div style={{ position: "relative", width: 150, height: 150, margin: "0 auto 22px" }}>
          {[0, .5, 1].map(d => <div key={d} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2.5px solid " + C.nv + "55", animation: `nfc 2s ease ${d}s infinite` }} />)}
          <div style={{ position: "absolute", inset: 22, borderRadius: "50%", background: `linear-gradient(135deg,${C.nv},${C.nl})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 36px rgba(45,43,107,.35)" }}>
            <Ic d={ic.tp} sz={40} c="#fff" />
          </div>
        </div>
        <h3 style={{ color: C.tx, fontSize: 18, fontWeight: 900, marginBottom: 6 }}>Approchez la carte du téléphone</h3>
        <p style={{ color: C.t2, fontSize: 13.5, fontWeight: 500, marginBottom: 4 }}>Carte, téléphone ou montre — sans contact</p>
        <p style={{ color: sqReady() ? C.nv : C.t3, fontSize: 11.5, fontWeight: 700, marginBottom: 22, display: "inline-flex", alignItems: "center", gap: 5, background: sqReady() ? C.nv + "0C" : C.bl, padding: "5px 13px", borderRadius: 14 }}><Ic d={ic.lk} sz={11} c={sqReady() ? C.nv : C.t3} />{sqReady() ? "Terminal Square connecté" : "Mode démo — Square non configuré"}</p>
        {eBox}
        {sqReady() && isMob && <button onClick={tapSquare} className="bt" style={{ width: "100%", padding: 17, borderRadius: 15, border: "none", background: `linear-gradient(135deg,${C.rd},${C.rk})`, color: "#fff", fontSize: 15.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}><Ic d={ic.tp} sz={17} c="#fff" />Tap to Pay avec Square</button>}
        {sqReady() && !isMob && <p style={{ color: C.t2, fontSize: 12.5, fontWeight: 600, marginBottom: 12, background: C.bl, borderRadius: 12, padding: "11px 14px" }}>Le Tap to Pay s'effectue sur un téléphone avec l'app Square Point de vente installée.</p>}
        <button onClick={payU} className="bt" style={{ width: "100%", padding: sqReady() ? 13 : 17, marginTop: sqReady() && isMob ? 9 : 0, borderRadius: sqReady() ? 13 : 15, border: sqReady() ? "1.5px solid " + C.bd : "none", background: sqReady() ? C.sf : `linear-gradient(135deg,${C.rd},${C.rk})`, color: sqReady() ? C.t2 : "#fff", fontSize: sqReady() ? 13.5 : 15.5, fontWeight: sqReady() ? 700 : 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>{!sqReady() && <Ic d={ic.tp} sz={17} c="#fff" />}{sqReady() ? "Enregistrer sans terminal (simulation)" : "Présenter la carte (simulation)"}</button>
        <button onClick={back} className="bt" style={{ width: "100%", padding: 13, marginTop: 9, borderRadius: 13, border: "1.5px solid " + C.bd, background: C.sf, color: C.t2, fontSize: 13.5, fontWeight: 700 }}>Modifier la donation</button>
      </div>
    </div>}

    {/* ══ MENSUEL : formulaire ══ */}
    {mode === "monthly" && step === "form" && <div className="afu" style={{ ...card, padding: 26 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: `linear-gradient(135deg,${C.nv},${C.nl})`, display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={ic.ht} sz={21} c="#fff" /></div>
        <div><h3 style={{ color: C.tx, fontSize: 18, fontWeight: 900 }}>Donation mensuelle</h3><p style={{ color: C.t2, fontSize: 12.5, fontWeight: 500 }}>Informations du donateur</p></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginBottom: 15 }}>
        <div><label style={lbl}>Prénom *</label><input value={fm.fn} onChange={x => sf("fn", x.target.value)} placeholder="Prénom" className="ip" style={iS} /></div>
        <div><label style={lbl}>Nom *</label><input value={fm.ln} onChange={x => sf("ln", x.target.value)} placeholder="Nom" className="ip" style={iS} /></div>
      </div>
      <div style={{ marginBottom: 15 }}>
        <label style={lbl}>Adresse *</label>
        <input value={fm.adr} onChange={x => sf("adr", x.target.value)} placeholder="123 rue Exemple, Montréal, QC H2X 1Y4" className="ip" style={iS} />
      </div>
      <div style={{ marginBottom: 15 }}>
        <label style={lbl}>Courriel *</label>
        <input value={fm.em} onChange={x => sf("em", x.target.value)} placeholder="courriel@exemple.com" inputMode="email" autoCapitalize="none" className="ip" style={iS} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginBottom: 18 }}>
        <div>
          <label style={lbl}>Sexe</label>
          <select value={fm.sx} onChange={x => sf("sx", x.target.value)} className="ip" style={{ ...iS, appearance: "none", cursor: "pointer" }}>
            <option value="">Sélectionner…</option><option value="Femme">Femme</option><option value="Homme">Homme</option><option value="Autre">Autre</option><option value="Préfère ne pas répondre">Préfère ne pas répondre</option>
          </select>
        </div>
        <div><label style={lbl}>Téléphone *</label><input value={fm.ph} onChange={x => sf("ph", x.target.value)} placeholder="514-555-0123" inputMode="tel" className="ip" style={iS} /></div>
      </div>
      <label style={lbl}>Montant mensuel *</label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9, marginBottom: 12 }}>
        {AMTS_M.map(a => { const on = fm.amt === a && !fm.cst; return <button key={a} onClick={() => { sf("amt", a); sf("cst", ""); }} className="bt" style={{ padding: "14px 8px", borderRadius: 13, border: "2px solid " + (on ? C.nv : C.bd), background: on ? C.nv : C.sf, color: on ? "#fff" : C.t2, fontSize: 16, fontWeight: 800 }}>{a}$<span style={{ fontSize: 10, fontWeight: 600, opacity: .75 }}>/mois</span></button>; })}
      </div>
      <input type="number" min="1" value={fm.cst} onChange={x => sf("cst", x.target.value)} placeholder="Autre montant mensuel ($)" inputMode="numeric" className="ip" style={{ ...iS, fontFamily: Fn.m, fontWeight: 700, marginBottom: 18 }} />
      {eBox}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={back} className="bt" style={{ flex: 1, padding: 16, borderRadius: 15, border: "1.5px solid " + C.bd, background: C.sf, color: C.t2, fontSize: 14, fontWeight: 700 }}>Retour</button>
        <button onClick={goM} className="bt" style={{ flex: 2, padding: 16, borderRadius: 15, border: "none", background: `linear-gradient(135deg,${C.nv},${C.nd})`, color: "#fff", fontSize: 15.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>Continuer<Ic d={ic.arr} sz={16} c="#fff" /></button>
      </div>
    </div>}

    {/* ══ MENSUEL : paiement ══ */}
    {mode === "monthly" && step === "pay" && <div className="asi" style={{ ...card, overflow: "hidden", boxShadow: "0 12px 44px rgba(45,43,107,.16)" }}>
      <div style={{ background: `linear-gradient(135deg,${C.nv},${C.nd})`, padding: "22px 26px", color: "#fff" }}>
        <p style={{ fontSize: 11, fontWeight: 700, opacity: .65, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Don mensuel de</p>
        <div style={{ fontSize: 36, fontWeight: 900 }}>{amt}$<span style={{ fontSize: 17, fontWeight: 700, opacity: .8 }}> /mois</span></div>
        <p style={{ fontSize: 13.5, fontWeight: 600, opacity: .85, marginTop: 3 }}>{full()}</p>
      </div>
      <div style={{ padding: 24 }}>
        <label style={lbl}>Mode de prélèvement</label>
        <div style={{ display: "flex", gap: 9, marginBottom: 18 }}>
          <button onClick={() => { sPm("carte"); sEr(""); }} className="bt" style={segBtn(pm === "carte")}><Ic d={ic.tp} sz={15} c={pm === "carte" ? "#fff" : C.t3} />Carte</button>
          <button onClick={() => { sPm("cheque"); sEr(""); }} className="bt" style={segBtn(pm === "cheque")}><Ic d={ic.fi} sz={15} c={pm === "cheque" ? "#fff" : C.t3} />Spécimen de chèque</button>
        </div>

        {pm === "carte" && sqReady() && <div style={{ background: C.bg, border: "1.5px solid " + C.bd, borderRadius: 15, padding: 17, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}><Ic d={ic.tp} sz={17} c={C.nv} /><span style={{ color: C.tx, fontSize: 14, fontWeight: 800 }}>Carte de crédit — Square</span></div>
          <div id="sq-card" style={{ minHeight: 94, background: C.sf, borderRadius: 12, padding: "8px 10px", border: "1.5px solid " + C.bd }} />
          {sqSt === "loading" && <p style={{ color: C.t3, fontSize: 12, fontWeight: 600, marginTop: 10, textAlign: "center" }}>Chargement du module sécurisé…</p>}
          {sqSt === "error" && <p style={{ color: C.rd, fontSize: 12, fontWeight: 700, marginTop: 10, textAlign: "center" }}>Module Square indisponible — vérifiez l'Application ID</p>}
          <p style={{ color: C.t3, fontSize: 11, marginTop: 11, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Ic d={ic.lk} sz={11} c={C.t3} />Carte chiffrée par Square — aucun numéro ne transite par l'application</p>
        </div>}

        {pm === "carte" && !sqReady() && <div style={{ background: C.bg, border: "1.5px solid " + C.bd, borderRadius: 15, padding: 17, marginBottom: 18 }}>
          <input value={cd.num} onChange={x => sCd(p => ({ ...p, num: x.target.value }))} placeholder="Numéro de carte" inputMode="numeric" className="ip" style={{ ...iS, fontSize: 14, fontFamily: Fn.m, marginBottom: 9, background: C.sf }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
            <input value={cd.exp} onChange={x => { let v = digits(x.target.value).slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2); sCd(p => ({ ...p, exp: v })); }} placeholder="MM/AA" inputMode="numeric" className="ip" style={{ ...iS, fontSize: 14, fontFamily: Fn.m, background: C.sf }} />
            <input value={cd.cvc} onChange={x => sCd(p => ({ ...p, cvc: digits(x.target.value).slice(0, 4) }))} placeholder="CVC" inputMode="numeric" className="ip" style={{ ...iS, fontSize: 14, fontFamily: Fn.m, background: C.sf }} />
          </div>
          <p style={{ color: C.t3, fontSize: 11, marginTop: 11, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Ic d={ic.lk} sz={11} c={C.t3} />Mode démo — Square tokenisera la carte une fois configuré</p>
        </div>}

        {pm === "cheque" && <div style={{ background: C.bg, border: "1.5px solid " + C.bd, borderRadius: 15, padding: 17, marginBottom: 18 }}>
          <div style={{ background: C.sf, border: "1.5px dashed " + C.bd, borderRadius: 12, padding: "13px 15px", marginBottom: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 9 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.t3, textTransform: "uppercase", letterSpacing: 1 }}>Spécimen de chèque</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.t3, fontFamily: Fn.m }}>VOID</span>
            </div>
            <div style={{ display: "flex", gap: 8, fontFamily: Fn.m, fontSize: 12, color: C.t2, fontWeight: 700 }}>
              <span style={{ borderBottom: "2px solid " + C.nv, paddingBottom: 2 }}>⑆ {bk.tr || "·····"}</span>
              <span style={{ borderBottom: "2px solid " + C.rd, paddingBottom: 2 }}>⑆ {bk.inst || "···"}</span>
              <span style={{ borderBottom: "2px solid " + C.gk, paddingBottom: 2 }}>⑈ {bk.acc || "·······"}</span>
            </div>
            <div style={{ display: "flex", gap: 8, fontSize: 9.5, color: C.t3, fontWeight: 700, marginTop: 4 }}>
              <span style={{ color: C.nv }}>Transit</span><span style={{ color: C.rd }}>Institution</span><span style={{ color: C.gk }}>Compte</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 9 }}>
            <input value={bk.tr} onChange={x => sBk(p => ({ ...p, tr: digits(x.target.value).slice(0, 5) }))} placeholder="Transit (5 chiffres)" inputMode="numeric" className="ip" style={{ ...iS, fontSize: 14, fontFamily: Fn.m, background: C.sf }} />
            <input value={bk.inst} onChange={x => sBk(p => ({ ...p, inst: digits(x.target.value).slice(0, 3) }))} placeholder="Institution (3)" inputMode="numeric" className="ip" style={{ ...iS, fontSize: 14, fontFamily: Fn.m, background: C.sf }} />
          </div>
          <input value={bk.acc} onChange={x => sBk(p => ({ ...p, acc: digits(x.target.value).slice(0, 12) }))} placeholder="Numéro de compte" inputMode="numeric" className="ip" style={{ ...iS, fontSize: 14, fontFamily: Fn.m, background: C.sf, marginBottom: 13 }} />
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", background: C.sf, borderRadius: 11, padding: "12px 13px", border: "1.5px solid " + (consent ? C.nv : C.bd) }}>
            <input type="checkbox" checked={consent} onChange={x => sConsent(x.target.checked)} style={{ width: 17, height: 17, marginTop: 1, accentColor: C.nv, flexShrink: 0 }} />
            <span style={{ color: C.t2, fontSize: 12, fontWeight: 600, lineHeight: 1.45 }}>J'autorise Public Outreach à prélever <strong style={{ color: C.nv }}>{amt}$ par mois</strong> sur ce compte (accord de prélèvement préautorisé, annulable en tout temps).</span>
          </label>
        </div>}

        {eBox}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={back} className="bt" style={{ flex: 1, padding: 15, borderRadius: 14, border: "1.5px solid " + C.bd, background: C.sf, color: C.t2, fontSize: 14, fontWeight: 700 }}>Retour</button>
          <button onClick={payM} className="bt" style={{ flex: 2, padding: 15, borderRadius: 14, border: "none", background: `linear-gradient(135deg,${C.rd},${C.rk})`, color: "#fff", fontSize: 15, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Ic d={ic.ht} sz={15} c="#fff" />Activer le don mensuel</button>
        </div>
      </div>
    </div>}

    {/* ══ Traitement ══ */}
    {step === "processing" && <div className="asi" style={{ ...card, padding: 46, textAlign: "center" }}>
      <div style={{ width: 52, height: 52, border: "4px solid " + C.bl, borderTopColor: C.nv, borderRadius: "50%", animation: "sp .9s linear infinite", margin: "0 auto 22px" }} />
      <h3 style={{ color: C.tx, fontSize: 17, fontWeight: 800, marginBottom: 6 }}>{mode === "unique" ? "Lecture de la carte…" : "Activation du don mensuel…"}</h3>
      <p style={{ color: C.t2, fontSize: 13.5, fontWeight: 500 }}>Ne fermez pas cette page</p>
    </div>}

    {/* ══ Succès ══ */}
    {step === "success" && <div className="asi" style={{ ...card, padding: "42px 30px", textAlign: "center" }}>
      <div style={{ width: 70, height: 70, borderRadius: "50%", background: `linear-gradient(135deg,${C.gd},#FFD84D)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", boxShadow: "0 8px 28px " + C.gd + "45" }}>
        <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" style={{ strokeDasharray: 30, animation: "wC .55s ease .15s both" }} /></svg>
      </div>
      <h3 style={{ color: C.tx, fontSize: 21, fontWeight: 900, marginBottom: 5 }}>Merci, {fm.fn} !</h3>
      {mode === "unique" && <p style={{ color: C.t2, fontSize: 14.5, fontWeight: 500 }}>Paiement sans contact de <strong style={{ color: C.nv, fontFamily: Fn.m }}>{amt}$</strong> approuvé</p>}
      {mode === "monthly" && <p style={{ color: C.t2, fontSize: 14.5, fontWeight: 500 }}>Don mensuel de <strong style={{ color: C.nv, fontFamily: Fn.m }}>{amt}$/mois</strong> activé ({pm === "carte" ? "carte ····" + (cdLast || "    ") : "prélèvement bancaire"})</p>}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 13, background: C.nv + "0C", color: C.nv, padding: "9px 16px", borderRadius: 13, fontSize: 12.5, fontWeight: 700 }}>
        <Ic d={ic.fi} sz={14} c={C.nv} />Reçu envoyé à {fm.em}
      </div>
      <button onClick={() => { notify(mode === "unique" ? "Donation de " + amt + "$ enregistrée — reçu envoyé" : "Don mensuel de " + amt + "$/mois activé"); resetAll(); }} className="bt" style={{ width: "100%", padding: 16, marginTop: 24, borderRadius: 14, border: "none", background: `linear-gradient(135deg,${C.nv},${C.nd})`, color: "#fff", fontSize: 15, fontWeight: 800 }}>Nouvelle donation</button>
    </div>}
  </div>;
}

/* ── Fermeture de journée ── */
function CloseM({ team, mem, onOk, onNo }) {
  const [hrs, sH] = useState(() => { const o = {}; mem.forEach(m => { o[m.id] = { w: 8, a: 0 }; }); return o; });
  const sf = (id, f, v) => { const n = parseFloat(v) || 0; sH(p => ({ ...p, [id]: { ...p[id], [f]: Math.max(0, Math.min(24, n)) } })); };
  const tW = Object.values(hrs).reduce((s, h) => s + h.w, 0), tA = Object.values(hrs).reduce((s, h) => s + h.a, 0);
  const nI = c => ({ width: "100%", padding: "11px 6px", background: C.bg, border: "1.5px solid " + C.bd, borderRadius: 11, color: c, fontSize: 15, fontFamily: Fn.m, fontWeight: 700, textAlign: "center", boxSizing: "border-box", outline: "none" });
  return <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
    <div style={{ position: "absolute", inset: 0, background: "rgba(30,28,79,.45)", backdropFilter: "blur(8px)", animation: "fi .25s ease both" }} onClick={onNo} />
    <div style={{ position: "relative", width: "100%", maxWidth: 620, maxHeight: "90vh", display: "flex", flexDirection: "column", background: C.sf, borderRadius: "26px 26px 0 0", boxShadow: "0 -16px 60px rgba(30,28,79,.25)", overflow: "hidden", animation: "up .35s cubic-bezier(.32,.72,.35,1) both" }}>
      <div style={{ width: 42, height: 4, background: C.bd, borderRadius: 4, margin: "12px auto 0" }} />
      <div style={{ padding: "16px 26px 14px", borderBottom: "1px solid " + C.bd }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div><h2 style={{ color: C.tx, fontSize: 20, fontWeight: 900 }}>Fermer la journée</h2><p style={{ color: C.t2, fontSize: 13, fontWeight: 500, marginTop: 3 }}>{team} · {frDate}</p></div>
          <button onClick={onNo} className="bt" style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid " + C.bd, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={ic.xx} sz={15} c={C.t2} /></button>
        </div>
        <p style={{ color: C.t2, fontSize: 12.5, fontWeight: 600, marginTop: 10 }}>Indiquez les heures de chaque membre pour la feuille de temps.</p>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 26px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 86px 86px 56px", gap: 8, padding: "6px 0 9px", borderBottom: "1px solid " + C.bl }}>
          {["Membre", "Terrain", "Admin", "Total"].map((h, i) => <span key={h} style={{ color: C.t3, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, textAlign: i === 0 ? "left" : i === 3 ? "right" : "center" }}>{h}</span>)}
        </div>
        {mem.map((m, i) => { const h = hrs[m.id] || { w: 0, a: 0 }; return <div key={m.id} className="afu" style={{ animationDelay: i * .04 + "s", display: "grid", gridTemplateColumns: "1fr 86px 86px 56px", gap: 8, alignItems: "center", padding: "11px 0", borderBottom: "1px solid " + C.bl }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: C.nv + "0F", color: C.nv, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{ini(m.name)}</div>
            <span style={{ color: C.tx, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name.split(" ")[0]}</span>
          </div>
          <input type="number" step="0.5" min="0" max="24" value={h.w} onChange={e => sf(m.id, "w", e.target.value)} className="ip" style={nI(C.nv)} />
          <input type="number" step="0.5" min="0" max="24" value={h.a} onChange={e => sf(m.id, "a", e.target.value)} className="ip" style={nI(C.rd)} />
          <div style={{ textAlign: "right", color: C.tx, fontSize: 14, fontWeight: 900, fontFamily: Fn.m }}>{(h.w + h.a).toFixed(1)}</div>
        </div>; })}
      </div>
      <div style={{ padding: "15px 26px 26px", borderTop: "1px solid " + C.bd, background: C.bg }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15, fontSize: 13, flexWrap: "wrap", gap: 6 }}>
          <span style={{ color: C.t2 }}>Terrain <strong style={{ color: C.nv, fontFamily: Fn.m }}>{tW.toFixed(1)}h</strong> · Admin <strong style={{ color: C.rd, fontFamily: Fn.m }}>{tA.toFixed(1)}h</strong></span>
          <span style={{ color: C.tx, fontWeight: 900, fontFamily: Fn.m, fontSize: 15 }}>{(tW + tA).toFixed(1)}h au total</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onNo} className="bt" style={{ flex: 1, padding: 15, borderRadius: 14, border: "1.5px solid " + C.bd, background: C.sf, color: C.t2, fontSize: 14, fontWeight: 700 }}>Annuler</button>
          <button onClick={() => onOk(Object.fromEntries(Object.entries(hrs).map(([k, v]) => [k, { worked: v.w, admin: v.a }])))} className="bt" style={{ flex: 2, padding: 15, borderRadius: 14, border: "none", background: `linear-gradient(135deg,${C.rd},${C.rk})`, color: "#fff", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Ic d={ic.sv} sz={15} c="#fff" />Fermer la journée</button>
        </div>
      </div>
    </div>
  </div>;
}

/* ── Accueil collecteur ── */
function ColHome({ usr, dons, obj, goTap }) {
  const my = dons.filter(d => d.collector_id === usr.id && d.date === td);
  const tm = dons.filter(d => d.team === usr.team && d.date === td);
  const gl = obj[usr.team] || 30;
  const tot = my.reduce((s, d) => s + d.amount, 0);
  const avg = my.length ? Math.round(tot / my.length) : 0;
  return <div>
    <div className="afu">
      <p style={{ color: C.t2, fontSize: 14, fontWeight: 600 }}>{greet()},</p>
      <h2 style={{ color: C.tx, fontSize: 26, fontWeight: 900, lineHeight: 1.1 }}>{usr.name.split(" ")[0]} 👋</h2>
      <p style={{ color: C.t3, fontSize: 13, fontWeight: 500, marginTop: 3, textTransform: "capitalize" }}>{frDate}</p>
    </div>
    <div className="afu d1" style={{ ...card, marginTop: 18, padding: 22, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <Ring pct={(tm.length / gl) * 100} label="objectif équipe" sub={tm.length + "/" + gl + " dons"} />
      <div style={{ flex: 1, minWidth: 150 }}>
        <p style={{ color: C.t2, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2 }}>Ma journée</p>
        <div style={{ color: C.nv, fontSize: 38, fontWeight: 900, fontFamily: Fn.d, lineHeight: 1.1 }}>{tot}$</div>
        <p style={{ color: C.t2, fontSize: 13.5, fontWeight: 600, marginTop: 4 }}>{my.length} don{my.length > 1 ? "s" : ""} · moyenne {avg}$</p>
        <button onClick={goTap} className="bt" style={{ marginTop: 14, padding: "13px 22px", borderRadius: 13, border: "none", background: `linear-gradient(135deg,${C.rd},${C.rk})`, color: "#fff", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}><Ic d={ic.tp} sz={16} c="#fff" />Donation Tap</button>
      </div>
    </div>
    <SecTitle>Mes donations du jour</SecTitle>
    <DonList data={my} empty="Aucune donation aujourd'hui" />
  </div>;
}

/* ── Accueil manager ── */
function MgrHome({ usr, dons, obj, ds, goTap, notify, cols }) {
  const aDn = dons.filter(d => d.date === td);
  const totT = aDn.reduce((s, d) => s + d.amount, 0);
  const actifs = cols.filter(c => c.team !== "Non assigné").length;
  const xKPI = () => { const r = []; const dts = [...new Set(dons.map(d => d.date))].sort(); dts.forEach(dt => { cols.forEach(c => { const cd = dons.filter(d => d.collector_id === c.id && d.date === dt); r.push({ Date: dt, Collecteur: c.name, Équipe: c.team, Dons: cd.length, Montant: cd.reduce((s, d) => s + d.amount, 0) }); }); }); if (toCSV(r, "PO_KPI_" + td + ".csv")) notify("Export KPI téléchargé"); };
  const xDon = () => { if (toCSV(dons.map(d => ({ Date: d.date, Heure: d.time, Collecteur: d.collector_name, Équipe: d.team, Donateur: d.donor, Montant: d.amount, Type: d.type })), "PO_Donations_" + td + ".csv")) notify("Export donations téléchargé"); };
  return <div>
    <div className="afu">
      <p style={{ color: C.t2, fontSize: 14, fontWeight: 600 }}>{greet()},</p>
      <h2 style={{ color: C.tx, fontSize: 26, fontWeight: 900, lineHeight: 1.1 }}>{usr.name.split(" ")[0]} 👋</h2>
      <p style={{ color: C.t3, fontSize: 13, fontWeight: 500, marginTop: 3, textTransform: "capitalize" }}>{frDate}</p>
    </div>
    <div style={{ display: "flex", gap: 11, marginTop: 18, flexWrap: "wrap" }}>
      <Stat icon={ic.gift} label="Collecté aujourd'hui" value={totT + "$"} color={C.nv} cl="d1" />
      <Stat icon={ic.ls} label="Dons reçus" value={aDn.length} color={C.rd} cl="d2" />
      <Stat icon={ic.tm} label="Collecteurs actifs" value={actifs} color={C.gk} cl="d3" />
    </div>
    <SecTitle>Progression des équipes</SecTitle>
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {TEAMS.map((t, i) => {
        const v = dons.filter(d => d.team === t && d.date === td);
        const open = ds[t] !== false;
        return <div key={t} className={"afu d" + (i + 1)} style={{ ...card, flex: "1 1 230px", padding: 18, display: "flex", alignItems: "center", gap: 16 }}>
          <Ring pct={(v.length / (obj[t] || 30)) * 100} size={92} sw={9} sub={v.length + "/" + (obj[t] || 30)} />
          <div>
            <p style={{ color: C.tx, fontSize: 15, fontWeight: 800 }}>{t}</p>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6, padding: "4px 11px", borderRadius: 14, background: open ? C.nv + "0F" : C.rd + "0F", color: open ? C.nv : C.rd, fontSize: 11.5, fontWeight: 800 }}>
              <Ic d={open ? ic.pl : ic.st} sz={10} c={open ? C.nv : C.rd} />{open ? "Journée ouverte" : "Journée fermée"}
            </span>
          </div>
        </div>;
      })}
    </div>
    <SecTitle>Actions rapides</SecTitle>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <button onClick={goTap} className="bt afu" style={{ padding: "14px 22px", borderRadius: 14, border: "none", background: `linear-gradient(135deg,${C.rd},${C.rk})`, color: "#fff", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}><Ic d={ic.tp} sz={16} c="#fff" />Donation Tap</button>
      <button onClick={xKPI} className="bt afu d1" style={{ padding: "14px 22px", borderRadius: 14, border: "1.5px solid " + C.nv + "30", background: C.nv + "07", color: C.nv, fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}><Ic d={ic.dn} sz={15} c={C.nv} />Exporter les KPI</button>
      <button onClick={xDon} className="bt afu d2" style={{ padding: "14px 22px", borderRadius: 14, border: "1.5px solid " + C.gk + "35", background: C.gd + "0C", color: C.gk, fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}><Ic d={ic.dn} sz={15} c={C.gk} />Exporter les donations</button>
    </div>
  </div>;
}

/* ── Donations (manager) ── */
function MgrDons({ dons, users }) {
  const [t, sT] = useState(TEAMS[0]); const [sc, sSc] = useState(null); const [dt, sDt] = useState(td);
  const mem = users.filter(u => u.role === "collector" && u.team === t);
  const f = useMemo(() => dons.filter(d => d.team === t && d.date === dt && (!sc || d.collector_id === sc)), [dons, t, dt, sc]);
  const tot = f.reduce((s, d) => s + d.amount, 0);
  return <div>
    <SecTitle right={<DtP v={dt} set={sDt} />}>Donations</SecTitle>
    <div style={{ display: "flex", gap: 8, marginBottom: 12, overflowX: "auto", paddingBottom: 4 }}>{TEAMS.map(x => <Chip key={x} on={t === x} onClick={() => { sT(x); sSc(null); }}>{x}</Chip>)}</div>
    <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
      <Chip on={!sc} onClick={() => sSc(null)}>Tous</Chip>
      {mem.map(m => <Chip key={m.id} on={sc === m.id} onClick={() => sSc(m.id)}>{m.name.split(" ")[0]}</Chip>)}
    </div>
    <div className="afu" style={{ ...card, padding: "15px 20px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: C.t2, fontSize: 13, fontWeight: 700 }}>{f.length} don{f.length > 1 ? "s" : ""} {dt === td ? "aujourd'hui" : "le " + dt}</span>
      <span style={{ color: C.nv, fontSize: 21, fontWeight: 900, fontFamily: Fn.m }}>{tot}$</span>
    </div>
    <DonList data={f} showCol={!sc} empty="Aucune donation pour cette sélection" />
  </div>;
}

/* ── Équipes (manager) ── */
function MgrTeams({ users, rl, notify }) {
  const una = users.filter(u => u.role === "collector" && u.team === "Non assigné");
  const asgn = async (id, t, nm) => { await db.patch("users", "id=eq." + id, { team: t }); rl(); notify(t === "Non assigné" ? nm + " retiré de l'équipe" : nm + " ajouté à " + t); };
  return <div>
    <SecTitle>Gestion des équipes</SecTitle>
    {TEAMS.map((team, ti) => {
      const mem = users.filter(u => u.role === "collector" && u.team === team);
      return <div key={team} className={"afu d" + ti} style={{ ...card, padding: 20, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h4 style={{ color: C.nv, fontSize: 16, fontWeight: 900 }}>{team}</h4>
          <span style={{ color: C.t3, fontSize: 12, fontWeight: 700 }}>{mem.length} membre{mem.length > 1 ? "s" : ""}</span>
        </div>
        {mem.length === 0 && <p style={{ color: C.t3, fontSize: 13, padding: "8px 0" }}>Aucun membre — assignez un collecteur ci-dessous.</p>}
        {mem.map(m => <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid " + C.bl }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: C.nv + "0F", color: C.nv, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}>{ini(m.name)}</div>
            <span style={{ color: C.tx, fontSize: 14, fontWeight: 700 }}>{m.name}</span>
          </div>
          <button onClick={() => asgn(m.id, "Non assigné", m.name)} className="bt" style={{ padding: "6px 14px", borderRadius: 9, border: "1.5px solid " + C.rd + "30", background: "transparent", color: C.rd, fontSize: 12, fontWeight: 700 }}>Retirer</button>
        </div>)}
      </div>;
    })}
    {una.length > 0 && <div className="afu d2" style={{ ...card, border: "2px dashed " + C.gd + "55", padding: 20 }}>
      <h4 style={{ color: C.gk, fontSize: 15, fontWeight: 900, marginBottom: 10 }}>En attente d'assignation ({una.length})</h4>
      {una.map(u => <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid " + C.bl, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: C.gd + "20", color: C.gk, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}>{ini(u.name)}</div>
          <span style={{ color: C.tx, fontSize: 14, fontWeight: 700 }}>{u.name}</span>
        </div>
        <div style={{ display: "flex", gap: 7 }}>{TEAMS.map(x => <button key={x} onClick={() => asgn(u.id, x, u.name)} className="bt" style={{ padding: "6px 13px", borderRadius: 9, border: "1.5px solid " + C.nv + "30", background: "transparent", color: C.nv, fontSize: 12, fontWeight: 700 }}>+ {x.replace("Équipe ", "")}</button>)}</div>
      </div>)}
    </div>}
  </div>;
}

/* ── Journées + feuilles de temps (manager) ── */
function MgrDays({ users, obj, ds, sDs, bill, sBill, rl, notify }) {
  const [cl, sCl] = useState(null); const [bd, sBd] = useState(td); const [bt, sBt] = useState(TEAMS[0]);
  const clM = cl ? users.filter(u => u.role === "collector" && u.team === cl) : [];
  const closeDay = t => { if (ds[t] !== false) sCl(t); else { db.upsert("day_status", [{ team: t, is_open: true }]); sDs(p => ({ ...p, [t]: true })); notify("Journée de " + t + " ouverte"); } };
  const okCl = async hrs => {
    const rid = "b-" + cl + "-" + Date.now();
    await db.post("billing_records", [{ id: rid, team: cl, date: td }]);
    const en = Object.entries(hrs).map(([c, h]) => { const u = users.find(x => x.id === c); return { record_id: rid, collector_id: c, collector_name: u ? u.name : c, worked: h.worked, admin: h.admin }; });
    await db.post("billing_entries", en);
    await db.upsert("day_status", [{ team: cl, is_open: false }]);
    sDs(p => ({ ...p, [cl]: false })); sBill(p => [{ id: rid, team: cl, date: td, entries: en }, ...p]);
    notify("Journée de " + cl + " fermée — feuille de temps créée"); sCl(null);
  };
  const setGl = async (team, v) => { await db.upsert("objectives", [{ team, goal: v }]); rl(); notify("Objectif de " + team + " : " + v + " dons"); };
  const xTm = () => { const r = []; bill.forEach(b => b.entries.forEach(e => r.push({ Date: b.date, Équipe: b.team, Collecteur: e.collector_name, Terrain: e.worked, Admin: e.admin, Total: (Number(e.worked) + Number(e.admin)).toFixed(1) }))); if (toCSV(r, "PO_Temps_" + td + ".csv")) notify("Export des temps téléchargé"); else notify("Aucune feuille de temps à exporter"); };
  const recs = bill.filter(r => r.team === bt && r.date === bd);
  return <div>
    <SecTitle>Journées des équipes</SecTitle>
    {TEAMS.map((team, i) => {
      const op = ds[team] !== false; const gl = obj[team] || 30;
      return <div key={team} className={"afu d" + i} style={{ ...card, padding: 20, marginBottom: 13 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h4 style={{ color: C.nv, fontSize: 16, fontWeight: 900 }}>{team}</h4>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6, padding: "4px 11px", borderRadius: 14, background: op ? C.nv + "0F" : C.rd + "0F", color: op ? C.nv : C.rd, fontSize: 11.5, fontWeight: 800 }}>
              <Ic d={op ? ic.pl : ic.st} sz={10} c={op ? C.nv : C.rd} />{op ? "Ouverte" : "Fermée"}
            </span>
          </div>
          <button onClick={() => closeDay(team)} className="bt" style={{ padding: "12px 22px", borderRadius: 13, border: "none", background: op ? `linear-gradient(135deg,${C.rd},${C.rk})` : `linear-gradient(135deg,${C.nv},${C.nl})`, color: "#fff", fontSize: 13.5, fontWeight: 800 }}>{op ? "Fermer la journée" : "Ouvrir la journée"}</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 15, paddingTop: 14, borderTop: "1px solid " + C.bl }}>
          <label style={{ color: C.t2, fontSize: 13, fontWeight: 700 }}>Objectif quotidien</label>
          <input type="number" min="1" defaultValue={gl} onBlur={e => { const v = parseInt(e.target.value) || 0; if (v !== gl) setGl(team, v); }} className="ip" style={{ width: 76, padding: "9px 12px", background: C.bg, border: "1.5px solid " + C.bd, borderRadius: 11, color: C.tx, fontSize: 15, fontFamily: Fn.m, fontWeight: 700, textAlign: "center", outline: "none" }} />
          <span style={{ color: C.t3, fontSize: 13, fontWeight: 600 }}>dons</span>
        </div>
      </div>;
    })}
    <SecTitle right={<div style={{ display: "flex", gap: 8, alignItems: "center" }}><DtP v={bd} set={sBd} /><button onClick={xTm} className="bt" style={{ padding: "9px 14px", borderRadius: 11, border: "1.5px solid " + C.nv + "30", background: C.nv + "07", color: C.nv, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}><Ic d={ic.dn} sz={13} c={C.nv} />Exporter</button></div>}>Feuilles de temps</SecTitle>
    <div style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>{TEAMS.map(x => <Chip key={x} on={bt === x} onClick={() => sBt(x)}>{x}</Chip>)}</div>
    {recs.length === 0 && <div className="afu" style={{ ...card, padding: "38px 24px", textAlign: "center" }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, background: C.bl, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><Ic d={ic.fi} sz={24} c={C.t3} /></div>
      <p style={{ color: C.t2, fontSize: 14, fontWeight: 700 }}>Aucune feuille de temps à cette date</p>
      <p style={{ color: C.t3, fontSize: 12.5, marginTop: 4 }}>Une feuille est créée à chaque fermeture de journée.</p>
    </div>}
    {recs.map(rec => {
      const tw = rec.entries.reduce((s, e) => s + Number(e.worked), 0), ta = rec.entries.reduce((s, e) => s + Number(e.admin), 0);
      return <div key={rec.id} className="afu" style={{ ...card, overflow: "hidden", marginBottom: 13 }}>
        <div style={{ padding: "15px 20px", borderBottom: "1px solid " + C.bd, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div><span style={{ color: C.nv, fontSize: 15, fontWeight: 900 }}>{rec.team}</span><span style={{ color: C.t3, fontSize: 12, marginLeft: 10, fontFamily: Fn.m }}>{rec.date}</span></div>
          <span style={{ color: C.tx, fontWeight: 900, fontFamily: Fn.m, fontSize: 14 }}>{(tw + ta).toFixed(1)}h</span>
        </div>
        {rec.entries.map(e => <div key={e.collector_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 20px", borderBottom: "1px solid " + C.bl }}>
          <span style={{ color: C.tx, fontSize: 13.5, fontWeight: 700 }}>{e.collector_name}</span>
          <span style={{ fontSize: 12.5, fontFamily: Fn.m, fontWeight: 700 }}>
            <span style={{ color: C.nv }}>{Number(e.worked).toFixed(1)}h</span><span style={{ color: C.t3 }}> terrain · </span>
            <span style={{ color: C.rd }}>{Number(e.admin).toFixed(1)}h</span><span style={{ color: C.t3 }}> admin</span>
          </span>
        </div>)}
      </div>;
    })}
    {cl && <CloseM team={cl} mem={clM} onOk={okCl} onNo={() => sCl(null)} />}
  </div>;
}

/* ── Équipe (collecteur) ── */
function ColTeam({ usr, dons, obj }) {
  const tm = dons.filter(d => d.team === usr.team && d.date === td);
  const gl = obj[usr.team] || 30;
  return <div>
    <SecTitle>{usr.team} — aujourd'hui</SecTitle>
    <div className="afu" style={{ ...card, padding: 22, display: "flex", alignItems: "center", gap: 20, marginBottom: 18, flexWrap: "wrap" }}>
      <Ring pct={(tm.length / gl) * 100} size={104} sw={10} sub={tm.length + "/" + gl} />
      <div>
        <p style={{ color: C.tx, fontSize: 17, fontWeight: 900 }}>{tm.reduce((s, d) => s + d.amount, 0)}$ collectés</p>
        <p style={{ color: C.t2, fontSize: 13.5, fontWeight: 600, marginTop: 3 }}>{tm.length} don{tm.length > 1 ? "s" : ""} sur un objectif de {gl}</p>
      </div>
    </div>
    <DonList data={tm} showCol empty="Votre équipe n'a pas encore de donation aujourd'hui" />
  </div>;
}

/* ── Historique (collecteur) ── */
function ColHist({ usr, dons }) {
  const [dt, sDt] = useState(td);
  const mh = dons.filter(d => d.collector_id === usr.id && d.date === dt);
  return <div>
    <SecTitle right={<DtP v={dt} set={sDt} />}>Mon historique</SecTitle>
    <div className="afu" style={{ ...card, padding: "15px 20px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: C.t2, fontSize: 13, fontWeight: 700 }}>{mh.length} don{mh.length > 1 ? "s" : ""} {dt === td ? "aujourd'hui" : "le " + dt}</span>
      <span style={{ color: C.nv, fontSize: 21, fontWeight: 900, fontFamily: Fn.m }}>{mh.reduce((s, d) => s + d.amount, 0)}$</span>
    </div>
    <DonList data={mh} empty="Aucune donation à cette date" />
  </div>;
}

/* ── App ── */
export default function App() {
  const [spl, sSpl] = useState(true); const [wel, sWel] = useState(null); const [usr, sUsr] = useState(null);
  const [users, sUsers] = useState([]); const [dons, sDons] = useState([]); const [obj, sObj] = useState({});
  const [ds, sDs] = useState({}); const [bill, sBill] = useState([]);
  const [rdy, sRdy] = useState(false); const [tab, sTab] = useState("home"); const [toast, sToast] = useState(null);

  const notify = useCallback(m => { sToast({ m, id: Date.now() }); setTimeout(() => sToast(null), 2600); }, []);
  const load = useCallback(async () => {
    const [u, d, o, dsr] = await Promise.all([db.get("users", "order=id"), db.get("donations", "order=date.desc,time.desc"), db.get("objectives"), db.get("day_status")]);
    sUsers(u || []); sDons(d || []);
    const ob = {}; (o || []).forEach(r => { ob[r.team] = r.goal; }); sObj(ob);
    const dso = {}; (dsr || []).forEach(r => { dso[r.team] = r.is_open; }); sDs(dso);
    sRdy(true);
  }, []);
  const loadBill = useCallback(async () => {
    const br = await db.get("billing_records", "order=created_at.desc");
    const full = await Promise.all((br || []).map(async r => { const e = await db.get("billing_entries", "record_id=eq." + r.id); return { ...r, entries: e || [] }; }));
    sBill(full);
  }, []);
  useEffect(() => { load(); }, [load]);
  /* Retour de l'app Square Point de vente (Tap to Pay) */
  useEffect(() => {
    let pend = null;
    try { pend = localStorage.getItem("po_pending_tap"); } catch {}
    if (!pend) return;
    const sp = new URLSearchParams(window.location.search);
    const dataP = sp.get("data");
    const andTx = sp.get("com.squareup.pos.SERVER_TRANSACTION_ID") || sp.get("com.squareup.pos.CLIENT_TRANSACTION_ID");
    const andErr = sp.get("com.squareup.pos.ERROR_CODE");
    if (!dataP && !andTx && !andErr) return;
    let okPay = false, txid = "";
    if (dataP) { try { const d = JSON.parse(dataP); if (String(d.status || "").toLowerCase() === "ok") { okPay = true; txid = d.transaction_id || d.client_transaction_id || ""; } } catch {} }
    if (andTx) { okPay = true; txid = andTx; }
    if (andErr) okPay = false;
    try { localStorage.removeItem("po_pending_tap"); } catch {}
    window.history.replaceState({}, "", window.location.pathname);
    if (okPay) {
      try {
        const p = JSON.parse(pend);
        const n = new Date(); const t = n.getHours() + ":" + String(n.getMinutes()).padStart(2, "0");
        const id = "tap-" + p.uid + "-" + Date.now();
        const fullN = (p.fn + " " + p.ln).trim();
        Promise.all([
          db.post("tap_donations", [{ id, donor_name: fullN, first_name: p.fn, last_name: p.ln, donor_email: p.em, donor_phone: null, amount: p.amt, collector_id: p.uid, collector_name: p.uname, team: p.team, payment_status: "completed", payment_nonce: txid || "square_pos", receipt_sent: true, date: td, time: t }]),
          db.post("donations", [{ id, collector_id: p.uid, collector_name: p.uname, team: p.team, donor: fullN, amount: p.amt, type: "Ponctuel", date: td, time: t }]),
        ]).then(() => { load(); notify("Paiement Square de " + p.amt + "$ confirmé"); });
      } catch {}
    } else { notify("Paiement Square annulé ou refusé"); }
  }, [load, notify]);
  useEffect(() => { if (usr && usr.role === "manager") loadBill(); }, [usr, loadBill]);
  useEffect(() => { if (!rdy || !usr) return; const i = setInterval(load, 30000); return () => clearInterval(i); }, [rdy, usr, load]);

  const cols = useMemo(() => users.filter(u => u.role === "collector"), [users]);
  const onLogin = u => sWel(u);
  const onWel = () => { sUsr(wel); sWel(null); sTab("home"); };
  const logout = () => { sUsr(null); sTab("home"); };

  if (spl) return <Splash onDone={() => sSpl(false)} />;
  if (!rdy) return <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: Fn.d }}><Css /><div style={{ textAlign: "center" }}><div style={{ animation: "sp .9s linear infinite", width: 36, height: 36, border: "3px solid " + C.bd, borderTopColor: C.nv, borderRadius: "50%", margin: "0 auto 14px" }} /><p style={{ color: C.t2, fontSize: 14, fontWeight: 600 }}>Chargement…</p></div></div>;
  if (wel) return <Welcome usr={wel} onDone={onWel} />;
  if (!usr) return <Login onLogin={onLogin} />;

  const isMgr = usr.role === "manager";
  const navs = isMgr
    ? [{ id: "home", lb: "Accueil", icn: ic.home }, { id: "tap", lb: "Tap", icn: ic.tp }, { id: "dons", lb: "Donations", icn: ic.ls }, { id: "teams", lb: "Équipes", icn: ic.tm }, { id: "days", lb: "Journées", icn: ic.ca }]
    : [{ id: "home", lb: "Accueil", icn: ic.home }, { id: "tap", lb: "Tap", icn: ic.tp }, { id: "team", lb: "Équipe", icn: ic.tm }, { id: "hist", lb: "Historique", icn: ic.ck }];

  return <div style={{ minHeight: "100vh", background: C.bg, fontFamily: Fn.d, color: C.tx }}>
    <Css />
    {/* tri-color accent */}
    <div style={{ height: 4, background: `linear-gradient(90deg,${C.rd} 0%,${C.rd} 33%,${C.nv} 33%,${C.nv} 66%,${C.gd} 66%)`, position: "sticky", top: 0, zIndex: 60 }} />
    {/* Header */}
    <header className="afi" style={{ background: C.sf, borderBottom: "1px solid " + C.bd, padding: "0 20px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 4, zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Logo sz={28} />
        <span style={{ fontSize: 17, fontWeight: 900, color: C.nv }}>Public Outreach</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => { load(); if (isMgr) loadBill(); notify("Données actualisées"); }} className="bt" title="Actualiser" style={{ width: 36, height: 36, borderRadius: 11, border: "1.5px solid " + C.bd, background: C.sf, display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={ic.rf} sz={14} c={C.t2} /></button>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: `linear-gradient(135deg,${C.nv},${C.nl})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }} title={usr.name}>{ini(usr.name)}</div>
        <button onClick={logout} className="bt" title="Se déconnecter" style={{ width: 36, height: 36, borderRadius: 11, border: "1.5px solid " + C.bd, background: C.sf, display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={ic.ot} sz={15} c={C.rd} /></button>
      </div>
    </header>
    {/* Desktop nav */}
    <div className="deskNav" style={{ justifyContent: "center", gap: 4, padding: "14px 20px 0", maxWidth: 980, margin: "0 auto" }}>
      {navs.map(n => <button key={n.id} onClick={() => sTab(n.id)} className="bt" style={{ padding: "11px 20px", borderRadius: 12, border: "none", background: tab === n.id ? C.nv : "transparent", color: tab === n.id ? "#fff" : C.t2, fontSize: 13.5, fontWeight: tab === n.id ? 800 : 600, display: "flex", alignItems: "center", gap: 7 }}><Ic d={n.icn} sz={15} c={tab === n.id ? "#fff" : C.t3} />{n.lb}</button>)}
    </div>
    {/* Content */}
    <main className="mainPad" style={{ maxWidth: 980, margin: "0 auto", padding: "22px 18px 48px" }}>
      {isMgr && tab === "home" && <MgrHome usr={usr} dons={dons} obj={obj} ds={ds} cols={cols} goTap={() => sTab("tap")} notify={notify} />}
      {isMgr && tab === "tap" && <TapDon usr={usr} onDone={load} notify={notify} />}
      {isMgr && tab === "dons" && <MgrDons dons={dons} users={users} />}
      {isMgr && tab === "teams" && <MgrTeams users={users} rl={load} notify={notify} />}
      {isMgr && tab === "days" && <MgrDays users={users} obj={obj} ds={ds} sDs={sDs} bill={bill} sBill={sBill} rl={load} notify={notify} />}
      {!isMgr && tab === "home" && <ColHome usr={usr} dons={dons} obj={obj} goTap={() => sTab("tap")} />}
      {!isMgr && tab === "tap" && <TapDon usr={usr} onDone={load} notify={notify} />}
      {!isMgr && tab === "team" && <ColTeam usr={usr} dons={dons} obj={obj} />}
      {!isMgr && tab === "hist" && <ColHist usr={usr} dons={dons} />}
    </main>
    {/* Mobile bottom nav */}
    <nav className="mobNav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 70, background: C.sf, borderTop: "1px solid " + C.bd, padding: "8px 6px calc(10px + env(safe-area-inset-bottom))", justifyContent: "space-around", boxShadow: "0 -4px 24px rgba(45,43,107,.08)" }}>
      {navs.map(n => { const on = tab === n.id; return <button key={n.id} onClick={() => sTab(n.id)} className="bt" style={{ flex: 1, maxWidth: 88, padding: "7px 4px", borderRadius: 13, border: "none", background: on ? C.nv + "0D" : "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <Ic d={n.icn} sz={20} c={on ? C.nv : C.t3} sw={on ? 2.4 : 2} />
        <span style={{ fontSize: 10.5, fontWeight: on ? 800 : 600, color: on ? C.nv : C.t3 }}>{n.lb}</span>
      </button>; })}
    </nav>
    {/* Toast */}
    {toast && <div key={toast.id} style={{ position: "fixed", bottom: "calc(86px + env(safe-area-inset-bottom))", left: "50%", transform: "translateX(-50%)", zIndex: 99, background: C.nd, color: "#fff", padding: "13px 22px", borderRadius: 14, fontSize: 13.5, fontWeight: 700, fontFamily: Fn.d, boxShadow: "0 10px 36px rgba(30,28,79,.4)", display: "flex", alignItems: "center", gap: 9, animation: "up .35s cubic-bezier(.32,.72,.35,1) both", maxWidth: "88vw", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
      <Ic d={ic.ch} sz={15} c={C.gd} sw={3} />{toast.m}
    </div>}
  </div>;
}
