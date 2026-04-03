import { useState, useEffect } from "react";

/*
 ╔════════════════════════════════════════════════════════════════╗
 ║  PUBLIC OUTREACH — Canvassing & Donation Management           ║
 ║  Navy #2D2B6B · Red #E23744 · Gold #F5C518                   ║
 ╚════════════════════════════════════════════════════════════════╝
*/

// ─── Storage / DB ────────────────────────────────────────────────────
const DB = {
  async get(k) { try { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : null; } catch { return null; } },
  async set(k, v) { try { await window.storage.set(k, JSON.stringify(v)); } catch(e) { console.error(e); } },
};

// ─── Seed ────────────────────────────────────────────────────────────
const DEF_USERS = [
  { id:"m1", login:"manager", password:"admin", role:"manager", name:"Sophie Tremblay", team:"Équipe Alpha" },
  { id:"c1", login:"alex", password:"1234", role:"collector", name:"Alex Dupont", team:"Équipe Alpha" },
  { id:"c2", login:"marie", password:"1234", role:"collector", name:"Marie Leclerc", team:"Équipe Alpha" },
  { id:"c3", login:"julien", password:"1234", role:"collector", name:"Julien Moreau", team:"Équipe Beta" },
  { id:"c4", login:"camille", password:"1234", role:"collector", name:"Camille Roy", team:"Équipe Beta" },
  { id:"c5", login:"lucas", password:"1234", role:"collector", name:"Lucas Bernard", team:"Non assigné" },
];
const TEAMS = ["Équipe Alpha", "Équipe Beta"];
const seedDon = (users) => {
  const dn = ["Jean Valjean","Claire Fontaine","Pierre Martin","Lucie Roche","Marc Antoine","Nadia Caron","Henri Lafleur","Isabelle Côté","François Gagnon","Élise Bouchard","Thomas Simard","Valérie Paradis","Maxime Dufour","Chantal Bélanger"];
  const ty = ["Mensuel","Ponctuel","Annuel"]; const r = []; const cs = users.filter(u => u.role === "collector");
  for (let d = 0; d < 7; d++) { const dt = new Date(); dt.setDate(dt.getDate()-d); const ds = dt.toISOString().split("T")[0];
    cs.forEach(c => { const n = Math.floor(Math.random()*5)+1; for (let i=0;i<n;i++) r.push({ id:`d-${c.id}-${d}-${i}`, collectorId:c.id, collectorName:c.name, team:c.team, donor:dn[Math.floor(Math.random()*dn.length)], amount:(Math.floor(Math.random()*19)+2)*5, type:ty[Math.floor(Math.random()*ty.length)], date:ds, time:`${9+Math.floor(Math.random()*9)}:${String(Math.floor(Math.random()*60)).padStart(2,"0")}` }); });
  } return r;
};
const today = new Date().toISOString().split("T")[0];

// ─── Theme ───────────────────────────────────────────────────────────
const C = {
  navy:"#2D2B6B", navyL:"#3D3B8B", navyD:"#1E1C4F", navyXL:"#4E4CAA",
  red:"#E23744", redL:"#FF5A65", redD:"#C12030",
  gold:"#F5C518", goldL:"#FFD84D", goldD:"#C9A000",
  bg:"#F4F3FA", surf:"#FFFFFF", card:"#FFFFFF",
  bdr:"#E2E0F0", bdrL:"#EDECF6",
  txt:"#1A1840", txtD:"#6E6B99", txtM:"#A8A6C4",
  sh:"0 2px 16px rgba(45,43,107,.07)", shL:"0 8px 40px rgba(45,43,107,.13)",
};
const F = { d:"'Outfit','Segoe UI',sans-serif", m:"'JetBrains Mono',monospace" };

// ─── Global Styles ───────────────────────────────────────────────────
const Styles = () => {
  useEffect(() => {
    if (document.getElementById("po-css")) return;
    const s = document.createElement("style"); s.id = "po-css";
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes scaleIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
      @keyframes slideR{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}}
      @keyframes progress{from{width:0}}
      @keyframes shine{from{background-position:200% center}to{background-position:-200% center}}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes splashLogo{0%{opacity:0;transform:scale(.5) rotate(-10deg)}60%{opacity:1;transform:scale(1.08) rotate(2deg)}100%{opacity:1;transform:scale(1) rotate(0deg)}}
      @keyframes splashRect1{0%{stroke-dashoffset:200;opacity:0}50%{opacity:1}100%{stroke-dashoffset:0;opacity:1}}
      @keyframes splashRect2{0%{stroke-dashoffset:200;opacity:0}60%{opacity:1}100%{stroke-dashoffset:0;opacity:1}}
      @keyframes splashRect3{0%{stroke-dashoffset:200;opacity:0}70%{opacity:1}100%{stroke-dashoffset:0;opacity:1}}
      @keyframes splashText{0%{opacity:0;transform:translateY(16px);letter-spacing:12px}100%{opacity:1;transform:translateY(0);letter-spacing:-.5px}}
      @keyframes splashOut{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.05)}}
      @keyframes welcomePop{0%{opacity:0;transform:scale(.7) translateY(20px)}60%{transform:scale(1.04) translateY(-4px)}100%{opacity:1;transform:scale(1) translateY(0)}}
      @keyframes welcomeRing{0%{transform:scale(.5);opacity:0}50%{opacity:.3}100%{transform:scale(2.5);opacity:0}}
      @keyframes welcomeCheck{0%{stroke-dashoffset:30}100%{stroke-dashoffset:0}}
      @keyframes glowPulse{0%,100%{box-shadow:0 0 0 0 rgba(45,43,107,.15)}50%{box-shadow:0 0 0 8px rgba(45,43,107,0)}}
      .fu{animation:fadeUp .55s ease both}.fi{animation:fadeIn .4s ease both}.si{animation:scaleIn .4s ease both}.sr{animation:slideR .45s ease both}
      .d1{animation-delay:.06s}.d2{animation-delay:.12s}.d3{animation-delay:.18s}.d4{animation-delay:.24s}.d5{animation-delay:.3s}
      .btn{transition:all .22s ease;cursor:pointer;font-family:${F.d}}.btn:hover{transform:translateY(-2px);box-shadow:${C.shL}}.btn:active{transform:translateY(0)}
      .crd{transition:all .25s ease}.crd:hover{box-shadow:${C.shL};transform:translateY(-3px)}
      .inp:focus{border-color:${C.navy}!important;box-shadow:0 0 0 4px rgba(45,43,107,.1)!important}
      .prg{animation:progress 1.2s ease both}
      .shn{background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent);background-size:200% 100%;animation:shine 2.5s ease-in-out infinite}
      input[type=number]::-webkit-inner-spin-button{opacity:1}
      ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.bdr};border-radius:3px}
    `;
    document.head.appendChild(s);
  }, []);
  return null;
};

// ─── Logo SVG ────────────────────────────────────────────────────────
const Logo = ({ size = 36, animate = false }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <rect x="5" y="5" width="44" height="44" rx="7" stroke={C.red} strokeWidth="5.5" fill="none"
      style={animate ? { strokeDasharray:200, animation:"splashRect1 1s ease both" } : {}} />
    <rect x="26" y="26" width="44" height="44" rx="7" stroke={C.navy} strokeWidth="5.5" fill="none"
      style={animate ? { strokeDasharray:200, animation:"splashRect2 1s ease .15s both" } : {}} />
    <rect x="38" y="42" width="38" height="38" rx="7" stroke={C.gold} strokeWidth="5.5" fill="none"
      style={animate ? { strokeDasharray:200, animation:"splashRect3 1s ease .3s both" } : {}} />
  </svg>
);

// ─── Splash Screen (App Launch) ──────────────────────────────────────
function SplashScreen({ onDone }) {
  const [out, setOut] = useState(false);
  useEffect(() => { const t1 = setTimeout(() => setOut(true), 2200); const t2 = setTimeout(onDone, 2800); return () => { clearTimeout(t1); clearTimeout(t2); }; }, [onDone]);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, background:`linear-gradient(160deg, ${C.navyD} 0%, ${C.navy} 50%, ${C.navyL} 100%)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:F.d, animation: out ? "splashOut .6s ease both" : "none" }}>
      <Styles />
      <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", border:`1px solid ${C.red}15`, top:"50%", left:"50%", transform:"translate(-50%,-50%)" }} />
      <div style={{ position:"absolute", width:550, height:550, borderRadius:"50%", border:`1px solid ${C.gold}10`, top:"50%", left:"50%", transform:"translate(-50%,-50%)" }} />
      <div style={{ animation:"splashLogo 1.1s cubic-bezier(.34,1.56,.64,1) both", marginBottom:28 }}>
        <Logo size={90} animate />
      </div>
      <h1 style={{ color:"#fff", fontSize:36, fontWeight:900, letterSpacing:"-.5px", animation:"splashText 1s ease .6s both", marginBottom:8 }}>Public Outreach</h1>
      <p style={{ color:"rgba(255,255,255,.5)", fontSize:14, fontWeight:500, animation:"fadeIn .6s ease 1.2s both" }}>Gestion de collecte de dons</p>
      <div style={{ marginTop:36, width:120, height:3, background:"rgba(255,255,255,.1)", borderRadius:3, overflow:"hidden", animation:"fadeIn .5s ease 1.4s both" }}>
        <div style={{ height:"100%", background:`linear-gradient(90deg, ${C.red}, ${C.gold}, ${C.navy})`, borderRadius:3, animation:"progress 1.6s ease .8s both" }} />
      </div>
    </div>
  );
}

// ─── Welcome Splash (Post-Login) ─────────────────────────────────────
function WelcomeSplash({ user, onDone }) {
  const [out, setOut] = useState(false);
  useEffect(() => { const t1 = setTimeout(() => setOut(true), 2000); const t2 = setTimeout(onDone, 2500); return () => { clearTimeout(t1); clearTimeout(t2); }; }, [onDone]);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, background:`linear-gradient(160deg, ${C.navyD} 0%, ${C.navy} 50%, ${C.navyL} 100%)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:F.d, animation: out ? "splashOut .5s ease both" : "none" }}>
      <Styles />
      {/* Expanding rings */}
      <div style={{ position:"absolute", width:100, height:100, borderRadius:"50%", border:`2px solid ${C.gold}40`, top:"50%", left:"50%", transform:"translate(-50%,-50%)", animation:"welcomeRing 1.5s ease .3s both" }} />
      <div style={{ position:"absolute", width:100, height:100, borderRadius:"50%", border:`2px solid ${C.red}30`, top:"50%", left:"50%", transform:"translate(-50%,-50%)", animation:"welcomeRing 1.5s ease .6s both" }} />

      {/* Avatar circle with checkmark */}
      <div style={{ animation:"welcomePop .7s cubic-bezier(.34,1.56,.64,1) both", marginBottom:24 }}>
        <div style={{ width:88, height:88, borderRadius:"50%", background:`linear-gradient(135deg, ${C.red}, ${C.gold})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 40px rgba(226,55,68,.35)" }}>
          <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" style={{ strokeDasharray:30, animation:"welcomeCheck .6s ease .5s both" }} />
          </svg>
        </div>
      </div>

      <h2 style={{ color:"#fff", fontSize:28, fontWeight:900, letterSpacing:"-.3px", animation:"fadeUp .6s ease .3s both", marginBottom:6 }}>
        Bienvenue, {user.name.split(" ")[0]}
      </h2>
      <p style={{ color:"rgba(255,255,255,.55)", fontSize:14, fontWeight:500, animation:"fadeUp .6s ease .45s both" }}>
        {user.role === "manager" ? "Espace Manager" : "Espace Collecteur"} · {user.team}
      </p>

      {/* Loading dots */}
      <div style={{ display:"flex", gap:6, marginTop:28, animation:"fadeIn .4s ease .8s both" }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"rgba(255,255,255,.4)", animation:`fadeIn .3s ease ${1+i*.15}s both` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────
const Ic = ({d,size=18,color="currentColor"}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
const P = {
  user:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  lock:"M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  out:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  bar:"M18 20V10M12 20V4M6 20v-6", list:"M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  cal:"M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18",
  team:"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  aim:"M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  x:"M18 6L6 18M6 6l12 12", clk:"M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2",
  dol:"M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  play:"M5 3l14 9-14 9V3z", stop:"M6 4h4v16H6zM14 4h4v16h-4z",
  file:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  save:"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8",
  bag:"M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
  dl:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
};

// ─── Shared UI ───────────────────────────────────────────────────────
const TH = {textAlign:"left",padding:"12px 14px",color:C.txtM,fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:1.3,fontFamily:F.d};
const TD = {padding:"14px",color:C.txt,fontSize:13};
const NI = c => ({width:"100%",padding:"10px",background:C.bg,border:`1.5px solid ${C.bdr}`,borderRadius:10,color:c,fontSize:15,fontFamily:F.m,fontWeight:700,outline:"none",textAlign:"center",boxSizing:"border-box"});

function Stat({icon,label,value,sub,color=C.navy,cl=""}) {
  return <div className={`crd fu ${cl}`} style={{background:C.card,borderRadius:18,padding:"22px 20px",border:`1px solid ${C.bdr}`,flex:"1 1 150px",minWidth:150,boxShadow:C.sh}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
      <div style={{width:38,height:38,borderRadius:11,background:color+"10",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic d={icon} size={17} color={color}/></div>
      <span style={{color:C.txtD,fontSize:12,fontWeight:600}}>{label}</span>
    </div>
    <div style={{color:C.txt,fontSize:30,fontWeight:900,lineHeight:1,fontFamily:F.d}}>{value}</div>
    {sub&&<div style={{color:C.txtM,fontSize:11,marginTop:7,fontWeight:500}}>{sub}</div>}
  </div>;
}

function Prog({current,goal,label,cl=""}) {
  const p = Math.min((current/goal)*100,100);
  return <div className={`fu ${cl}`} style={{background:C.card,borderRadius:18,padding:22,border:`1px solid ${C.bdr}`,boxShadow:C.sh}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:14}}>
      <span style={{color:C.txt,fontSize:14,fontWeight:800}}>{label}</span>
      <span style={{color:C.txtD,fontSize:13,fontFamily:F.m,fontWeight:600}}>{current}/{goal}</span>
    </div>
    <div style={{height:14,background:C.bg,borderRadius:9,overflow:"hidden"}}>
      <div className="prg" style={{height:"100%",width:`${p}%`,background:p>=100?`linear-gradient(90deg,${C.gold},${C.goldL})`:`linear-gradient(90deg,${C.navy},${C.navyXL})`,borderRadius:9,position:"relative",overflow:"hidden"}}>
        <div className="shn" style={{position:"absolute",inset:0}}/>
      </div>
    </div>
    <div style={{textAlign:"right",marginTop:8,fontSize:15,fontWeight:900,fontFamily:F.d,color:p>=100?C.goldD:C.red}}>{Math.round(p)}%</div>
  </div>;
}

function DonTable({data,showCol=false}) {
  if(!data.length) return <div className="fu" style={{color:C.txtD,textAlign:"center",padding:52,fontSize:14,fontWeight:500}}>Aucune donation</div>;
  return <div style={{overflowX:"auto"}}>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
      <thead><tr style={{borderBottom:`2px solid ${C.bdr}`}}>
        {showCol&&<th style={TH}>Collecteur</th>}<th style={TH}>Donateur</th><th style={TH}>Montant</th><th style={TH}>Type</th><th style={TH}>Date</th><th style={TH}>Heure</th>
      </tr></thead>
      <tbody>{data.map((d,i)=><tr key={d.id} className="fu" style={{animationDelay:`${i*.025}s`,borderBottom:`1px solid ${C.bdrL}`}}>
        {showCol&&<td style={TD}><span style={{color:C.navy,fontWeight:700}}>{d.collectorName}</span></td>}
        <td style={TD}>{d.donor}</td>
        <td style={{...TD,color:C.navy,fontWeight:800,fontFamily:F.m}}>{d.amount}$</td>
        <td style={TD}><span style={{background:d.type==="Mensuel"?C.navy+"10":d.type==="Annuel"?C.gold+"18":C.red+"0D",color:d.type==="Mensuel"?C.navy:d.type==="Annuel"?C.goldD:C.red,padding:"5px 13px",borderRadius:20,fontSize:11,fontWeight:700}}>{d.type}</span></td>
        <td style={{...TD,fontFamily:F.m,color:C.txtD,fontSize:12}}>{d.date}</td>
        <td style={{...TD,fontFamily:F.m,color:C.txtD,fontSize:12}}>{d.time}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

function Tabs({tabs,active,onChange}) {
  return <div className="fu" style={{display:"flex",gap:4,background:C.surf,borderRadius:16,padding:5,marginBottom:28,boxShadow:C.sh,border:`1px solid ${C.bdr}`,flexWrap:"wrap"}}>
    {tabs.map(t=><button key={t.id} onClick={()=>onChange(t.id)} className="btn" style={{padding:"12px 20px",borderRadius:12,border:"none",background:active===t.id?C.navy:"transparent",color:active===t.id?"#fff":C.txtD,fontSize:13,fontWeight:active===t.id?700:500,fontFamily:F.d,display:"flex",alignItems:"center",gap:7,whiteSpace:"nowrap",boxShadow:active===t.id?"0 3px 12px rgba(45,43,107,.3)":"none"}}>
      <Ic d={t.icon} size={14} color={active===t.id?"#fff":C.txtM}/>{t.label}
    </button>)}
  </div>;
}

function DateP({value,onChange}) {
  return <div style={{display:"flex",alignItems:"center",gap:8}}>
    <Ic d={P.cal} size={14} color={C.txtD}/>
    <input type="date" value={value} onChange={e=>onChange(e.target.value)} className="inp" style={{background:C.bg,border:`1.5px solid ${C.bdr}`,borderRadius:10,padding:"8px 14px",color:C.txt,fontSize:13,fontFamily:F.m,outline:"none"}}/>
  </div>;
}

function toCSV(data,fn) {
  if(!data.length) return; const h=Object.keys(data[0]);
  const c=[h.join(","),...data.map(r=>h.map(k=>`"${String(r[k]??"").replace(/"/g,'""')}"`).join(","))].join("\n");
  const b=new Blob(["\uFEFF"+c],{type:"text/csv;charset=utf-8;"}); const u=URL.createObjectURL(b);
  const a=document.createElement("a");a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);
}

// ─── Close Day Modal ─────────────────────────────────────────────────
function CloseModal({team,members,onOk,onNo}) {
  const [hrs,setHrs]=useState(()=>{const o={};members.forEach(m=>{o[m.id]={w:8,a:0}});return o;});
  const sf=(id,f,v)=>{const n=parseFloat(v)||0;setHrs(p=>({...p,[id]:{...p[id],[f]:Math.max(0,Math.min(24,n))}}));};
  const tW=Object.values(hrs).reduce((s,h)=>s+h.w,0), tA=Object.values(hrs).reduce((s,h)=>s+h.a,0);
  return <div style={{position:"fixed",inset:0,zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{position:"absolute",inset:0,background:"rgba(45,43,107,.35)",backdropFilter:"blur(10px)"}} onClick={onNo}/>
    <div className="si" style={{position:"relative",width:"100%",maxWidth:640,maxHeight:"88vh",display:"flex",flexDirection:"column",background:C.surf,borderRadius:26,border:`1px solid ${C.bdr}`,boxShadow:"0 32px 80px rgba(45,43,107,.2)",overflow:"hidden"}}>
      <div style={{padding:"26px 30px 16px",borderBottom:`1px solid ${C.bdr}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <h2 style={{color:C.txt,fontSize:22,fontWeight:900,margin:"0 0 4px",fontFamily:F.d}}>Fermeture de journée</h2>
            <p style={{color:C.txtD,fontSize:13,margin:0,fontWeight:500}}>{team} — {today}</p>
          </div>
          <button onClick={onNo} className="btn" style={{width:34,height:34,borderRadius:10,border:`1px solid ${C.bdr}`,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic d={P.x} size={16} color={C.txtD}/></button>
        </div>
        <p style={{color:C.red,fontSize:12,margin:"14px 0 0",fontWeight:700,display:"flex",alignItems:"center",gap:6}}><Ic d={P.clk} size={13} color={C.red}/>Heures de terrain et d'administration</p>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px 30px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 95px 95px 65px",gap:8,marginBottom:10,paddingBottom:10,borderBottom:`1px solid ${C.bdrL}`}}>
          {["Collecteur","Terrain","Admin","Total"].map((h,i)=><span key={h} style={{color:C.txtM,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1.2,textAlign:i>0?(i<3?"center":"right"):"left"}}>{h}</span>)}
        </div>
        {members.map((m,i)=>{const h=hrs[m.id]||{w:0,a:0};return <div key={m.id} className="fu" style={{animationDelay:`${i*.04}s`,display:"grid",gridTemplateColumns:"1fr 95px 95px 65px",gap:8,alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.bdrL}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:10,background:C.navy+"0D",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic d={P.user} size={13} color={C.navy}/></div>
            <span style={{color:C.txt,fontSize:13,fontWeight:700}}>{m.name}</span>
          </div>
          <input type="number" step="0.5" min="0" max="24" value={h.w} onChange={e=>sf(m.id,"w",e.target.value)} className="inp" style={NI(C.navy)}/>
          <input type="number" step="0.5" min="0" max="24" value={h.a} onChange={e=>sf(m.id,"a",e.target.value)} className="inp" style={NI(C.red)}/>
          <div style={{textAlign:"right",color:C.txt,fontSize:15,fontWeight:900,fontFamily:F.m}}>{(h.w+h.a).toFixed(1)}</div>
        </div>;})}
      </div>
      <div style={{padding:"18px 30px 26px",borderTop:`1px solid ${C.bdr}`,background:C.bg}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:18,fontSize:13,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",gap:20}}>
            <span style={{color:C.txtD}}>Terrain: <strong style={{color:C.navy,fontFamily:F.m}}>{tW.toFixed(1)}h</strong></span>
            <span style={{color:C.txtD}}>Admin: <strong style={{color:C.red,fontFamily:F.m}}>{tA.toFixed(1)}h</strong></span>
          </div>
          <span style={{color:C.txt,fontWeight:900,fontFamily:F.m,fontSize:16}}>{(tW+tA).toFixed(1)}h</span>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onNo} className="btn" style={{flex:1,padding:15,borderRadius:14,border:`1.5px solid ${C.bdr}`,background:C.surf,color:C.txtD,fontSize:14,fontWeight:700}}>Annuler</button>
          <button onClick={()=>onOk(Object.fromEntries(Object.entries(hrs).map(([k,v])=>[k,{worked:v.w,admin:v.a}])))} className="btn" style={{flex:2,padding:15,borderRadius:14,border:"none",background:`linear-gradient(135deg,${C.red},${C.redD})`,color:"#fff",fontSize:14,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <Ic d={P.save} size={16} color="#fff"/>Confirmer
          </button>
        </div>
      </div>
    </div>
  </div>;
}

// ─── Login (no demo credentials shown) ───────────────────────────────
function Login({onLogin,users}) {
  const [l,setL]=useState(""); const [pw,setPw]=useState(""); const [err,setErr]=useState(""); const [ld,setLd]=useState(false);
  const go=()=>{setLd(true);setErr("");setTimeout(()=>{const u=users.find(x=>x.login===l&&x.password===pw);if(u)onLogin(u);else{setErr("Identifiants incorrects");setLd(false);}},700);};
  const inp={width:"100%",padding:"16px 16px 16px 48px",background:C.bg,border:`1.5px solid ${C.bdr}`,borderRadius:14,color:C.txt,fontSize:15,fontFamily:F.d,fontWeight:500,outline:"none",boxSizing:"border-box",transition:"all .2s"};
  return <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.navyD} 0%,${C.navy} 45%,${C.navyL} 100%)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F.d,padding:20,position:"relative",overflow:"hidden"}}>
    <Styles/>
    <div style={{position:"absolute",top:-100,right:-100,width:340,height:340,borderRadius:"50%",background:C.red+"12"}}/>
    <div style={{position:"absolute",bottom:-80,left:-80,width:280,height:280,borderRadius:"50%",background:C.gold+"12"}}/>
    <div style={{position:"absolute",top:"25%",left:"8%",width:140,height:140,border:`2px solid ${C.red}20`,borderRadius:24,transform:"rotate(18deg)"}}/>
    <div style={{position:"absolute",bottom:"20%",right:"8%",width:100,height:100,border:`2px solid ${C.gold}20`,borderRadius:18,transform:"rotate(-12deg)"}}/>
    <div className="si" style={{width:"100%",maxWidth:440,background:C.surf,borderRadius:30,padding:"56px 42px 44px",boxShadow:"0 28px 80px rgba(0,0,0,.3)",position:"relative",zIndex:1}}>
      <div style={{textAlign:"center",marginBottom:42}}>
        <div className="fu"><Logo size={58}/></div>
        <h1 className="fu d1" style={{color:C.navy,fontSize:30,fontWeight:900,margin:"14px 0 6px",letterSpacing:"-.5px"}}>Public Outreach</h1>
        <p className="fu d2" style={{color:C.txtD,fontSize:14,fontWeight:500}}>Connectez-vous à votre espace</p>
      </div>
      <div className="fu d2" style={{marginBottom:22}}>
        <label style={{color:C.txtD,fontSize:11,fontWeight:700,display:"block",marginBottom:8,textTransform:"uppercase",letterSpacing:1.5}}>Identifiant</label>
        <div style={{position:"relative"}}><div style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)"}}><Ic d={P.user} size={16} color={C.txtM}/></div>
          <input value={l} onChange={e=>setL(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="Identifiant" className="inp" style={inp}/></div>
      </div>
      <div className="fu d3" style={{marginBottom:32}}>
        <label style={{color:C.txtD,fontSize:11,fontWeight:700,display:"block",marginBottom:8,textTransform:"uppercase",letterSpacing:1.5}}>Mot de passe</label>
        <div style={{position:"relative"}}><div style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)"}}><Ic d={P.lock} size={16} color={C.txtM}/></div>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="Mot de passe" className="inp" style={inp}/></div>
      </div>
      {err&&<div className="si" style={{background:C.red+"08",border:`1px solid ${C.red}20`,borderRadius:12,padding:"12px 16px",marginBottom:18,color:C.red,fontSize:13,textAlign:"center",fontWeight:700}}>{err}</div>}
      <button onClick={go} disabled={ld} className="btn fu d4" style={{width:"100%",padding:18,background:ld?C.navyL:`linear-gradient(135deg,${C.navy},${C.navyD})`,border:"none",borderRadius:16,color:"#fff",fontSize:16,fontWeight:800,opacity:ld?.7:1}}>
        {ld?"Connexion...":"Se connecter"}
      </button>
    </div>
  </div>;
}

// ─── Collector ────────────────────────────────────────────────────────
function ColDash({user,dons,obj}) {
  const [tab,setTab]=useState("today"); const [hd,setHd]=useState(today);
  const tabs=[{id:"today",label:"Aujourd'hui",icon:P.bar},{id:"team",label:"Équipe",icon:P.list},{id:"hist",label:"Historique",icon:P.clk}];
  const my=dons.filter(d=>d.collectorId===user.id&&d.date===today);
  const tm=dons.filter(d=>d.team===user.team&&d.date===today);
  const gl=obj[user.team]||30; const mh=dons.filter(d=>d.collectorId===user.id&&d.date===hd);
  const tot=my.reduce((s,d)=>s+d.amount,0), avg=my.length?Math.round(tot/my.length):0;
  return <div><Tabs tabs={tabs} active={tab} onChange={setTab}/>
    {tab==="today"&&<div>
      <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:22}}>
        <Stat icon={P.dol} label="Montant" value={`${tot}$`} sub="Aujourd'hui" color={C.navy} cl="d1"/>
        <Stat icon={P.aim} label="Mes dons" value={my.length} sub="Collectés" color={C.red} cl="d2"/>
        <Stat icon={P.bar} label="Don moyen" value={`${avg}$`} sub="Par don" color={C.goldD} cl="d3"/>
      </div>
      <Prog current={tm.length} goal={gl} label={`Objectif ${user.team}`} cl="d4"/>
      <div className="fu d5" style={{marginTop:22}}>
        <h3 style={{color:C.txt,fontSize:15,fontWeight:800,margin:"0 0 14px"}}>Mes donations</h3>
        <div style={{background:C.card,borderRadius:18,border:`1px solid ${C.bdr}`,overflow:"hidden",boxShadow:C.sh}}><DonTable data={my}/></div>
      </div>
    </div>}
    {tab==="team"&&<div>
      <Prog current={tm.length} goal={gl} label={`${user.team} — Progression`}/>
      <div className="fu d1" style={{background:C.card,borderRadius:18,border:`1px solid ${C.bdr}`,overflow:"hidden",marginTop:18,boxShadow:C.sh}}><DonTable data={tm} showCol/></div>
    </div>}
    {tab==="hist"&&<div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:18}}>
        <h3 style={{color:C.txt,fontSize:15,fontWeight:800,margin:0}}>Historique</h3><DateP value={hd} onChange={setHd}/>
      </div>
      <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:18}}>
        <Stat icon={P.dol} label="Total" value={`${mh.reduce((s,d)=>s+d.amount,0)}$`} color={C.navy}/>
        <Stat icon={P.aim} label="Dons" value={mh.length} color={C.red} cl="d1"/>
      </div>
      <div style={{background:C.card,borderRadius:18,border:`1px solid ${C.bdr}`,overflow:"hidden",boxShadow:C.sh}}><DonTable data={mh}/></div>
    </div>}
  </div>;
}

// ─── Manager ─────────────────────────────────────────────────────────
function MgrDash({dons,obj,setObj,users,setU,ds,setDs,bill,setBill}) {
  const [tab,setTab]=useState("overview"); const [st,setSt]=useState(TEAMS[0]); const [sc,setSc]=useState(null);
  const [hd,setHd]=useState(today); const [cl,setCl]=useState(null); const [bd,setBd]=useState(today);
  const tabs=[{id:"overview",label:"Vue d'ensemble",icon:P.bar},{id:"donations",label:"Donations",icon:P.list},{id:"teams",label:"Équipes",icon:P.team},{id:"days",label:"Journées",icon:P.cal},{id:"billing",label:"Temps",icon:P.bag},{id:"history",label:"Historique",icon:P.clk}];
  const tm=users.filter(u=>u.role==="collector"&&u.team===st);
  const tDon=dons.filter(d=>d.team===st&&d.date===today);
  const aDon=dons.filter(d=>d.date===today); const totT=aDon.reduce((s,d)=>s+d.amount,0);
  const cols=users.filter(u=>u.role==="collector"); const una=users.filter(u=>u.role==="collector"&&u.team==="Non assigné");
  const clMem=cl?users.filter(u=>u.role==="collector"&&u.team===cl):[];
  const closeDay=t=>{if(ds[t])setCl(t);else setDs(p=>({...p,[t]:true}));};
  const okClose=hrs=>{setBill(p=>[...p,{id:`b-${cl}-${Date.now()}`,team:cl,date:today,entries:Object.entries(hrs).map(([c,h])=>{const u=users.find(x=>x.id===c);return{collectorId:c,collectorName:u?.name||c,worked:h.worked,admin:h.admin};})}]);setDs(p=>({...p,[cl]:false}));setCl(null);};
  const asgn=(id,t)=>setU(p=>p.map(u=>u.id===id?{...u,team:t}:u));
  const expKPI=()=>{const r=[];const dts=[...new Set(dons.map(d=>d.date))].sort();dts.forEach(dt=>{cols.forEach(c=>{const cd=dons.filter(d=>d.collectorId===c.id&&d.date===dt);r.push({Date:dt,Collecteur:c.name,Équipe:c.team,Dons:cd.length,Montant:cd.reduce((s,d)=>s+d.amount,0),Moyen:cd.length?Math.round(cd.reduce((s,d)=>s+d.amount,0)/cd.length):0});});});toCSV(r,`PO_KPI_${today}.csv`);};
  const expDon=()=>toCSV(dons.map(d=>({Date:d.date,Heure:d.time,Collecteur:d.collectorName,Équipe:d.team,Donateur:d.donor,Montant:d.amount,Type:d.type})),`PO_Donations_${today}.csv`);
  const expTime=()=>{const r=[];bill.forEach(b=>b.entries.forEach(e=>r.push({Date:b.date,Équipe:b.team,Collecteur:e.collectorName,Terrain:e.worked,Admin:e.admin,Total:(e.worked+e.admin).toFixed(1)})));toCSV(r,`PO_Temps_${today}.csv`);};
  const TB=t=><button key={t} onClick={()=>{setSt(t);setSc(null);}} className="btn" style={{padding:"9px 18px",borderRadius:11,border:`1.5px solid ${st===t?C.navy:C.bdr}`,background:st===t?C.navy+"08":"transparent",color:st===t?C.navy:C.txtD,fontSize:13,fontWeight:700,fontFamily:F.d}}>{t}</button>;

  return <div><Tabs tabs={tabs} active={tab} onChange={setTab}/>
    {tab==="overview"&&<div>
      <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:22}}>
        <Stat icon={P.dol} label="Collecté" value={`${totT}$`} sub="Aujourd'hui" color={C.navy} cl="d1"/>
        <Stat icon={P.aim} label="Dons" value={aDon.length} sub="Toutes équipes" color={C.red} cl="d2"/>
        <Stat icon={P.team} label="Actifs" value={cols.filter(c=>c.team!=="Non assigné").length} sub="Collecteurs" color={C.goldD} cl="d3"/>
      </div>
      {TEAMS.map((t,i)=>{const td=dons.filter(d=>d.team===t&&d.date===today);return <div key={t} style={{marginBottom:16}}><Prog current={td.length} goal={obj[t]||30} label={`${t}${ds[t]?"":" — FERMÉE"}`} cl={`d${i+4}`}/></div>;})}
      <div className="fu d5" style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:8}}>
        {[["KPI",C.navy,expKPI],["Donations",C.red,expDon],["Temps",C.goldD,expTime]].map(([n,c,fn])=>
          <button key={n} onClick={fn} className="btn" style={{padding:"12px 22px",borderRadius:13,border:`1.5px solid ${c}25`,background:c+"06",color:c,fontSize:13,fontWeight:800,fontFamily:F.d,display:"flex",alignItems:"center",gap:8}}>
            <Ic d={P.dl} size={15} color={c}/>Export {n}
          </button>)}
      </div>
    </div>}
    {tab==="donations"&&<div>
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>{TEAMS.map(TB)}</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        <button onClick={()=>setSc(null)} className="btn" style={{padding:"7px 16px",borderRadius:20,border:"none",background:!sc?C.navy:C.bg,color:!sc?"#fff":C.txtD,fontSize:12,fontWeight:700,fontFamily:F.d}}>Tous</button>
        {tm.map(m=><button key={m.id} onClick={()=>setSc(m.id)} className="btn" style={{padding:"7px 16px",borderRadius:20,border:"none",background:sc===m.id?C.red:C.bg,color:sc===m.id?"#fff":C.txtD,fontSize:12,fontWeight:600,fontFamily:F.d}}>{m.name.split(" ")[0]}</button>)}
      </div>
      {(()=>{const f=sc?dons.filter(d=>d.collectorId===sc&&d.date===today):tDon;const t=f.reduce((s,d)=>s+d.amount,0);return<><div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:16}}><Stat icon={P.dol} label="Montant" value={`${t}$`} color={C.navy}/><Stat icon={P.aim} label="Dons" value={f.length} color={C.red} cl="d1"/></div><div style={{background:C.card,borderRadius:18,border:`1px solid ${C.bdr}`,overflow:"hidden",boxShadow:C.sh}}><DonTable data={f} showCol={!sc}/></div></>;})()}
    </div>}
    {tab==="teams"&&<div>
      {TEAMS.map((team,ti)=>{const mem=users.filter(u=>u.role==="collector"&&u.team===team);return<div key={team} className="crd fu" style={{animationDelay:`${ti*.08}s`,background:C.card,borderRadius:20,border:`1px solid ${C.bdr}`,padding:22,marginBottom:16,boxShadow:C.sh}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h4 style={{color:C.navy,fontSize:17,fontWeight:900,margin:0,fontFamily:F.d}}>{team}</h4><span style={{color:C.txtD,fontSize:12,fontWeight:600}}>{mem.length} membre(s)</span></div>
        {mem.map(m=><div key={m.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:`1px solid ${C.bdrL}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:34,height:34,borderRadius:10,background:C.navy+"0D",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic d={P.user} size={14} color={C.navy}/></div><span style={{color:C.txt,fontSize:14,fontWeight:600}}>{m.name}</span></div>
          <button onClick={()=>asgn(m.id,"Non assigné")} className="btn" style={{padding:"5px 14px",borderRadius:8,border:`1px solid ${C.red}30`,background:"transparent",color:C.red,fontSize:11,fontWeight:700,fontFamily:F.d}}>Retirer</button>
        </div>)}
      </div>;})}
      {una.length>0&&<div className="crd fu d2" style={{background:C.card,borderRadius:20,border:`2px dashed ${C.gold}40`,padding:22,boxShadow:C.sh}}>
        <h4 style={{color:C.goldD,fontSize:15,fontWeight:900,margin:"0 0 14px",fontFamily:F.d}}>Non assignés ({una.length})</h4>
        {una.map(u=><div key={u.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:`1px solid ${C.bdrL}`,flexWrap:"wrap",gap:8}}>
          <span style={{color:C.txt,fontSize:14,fontWeight:600}}>{u.name}</span>
          <div style={{display:"flex",gap:6}}>{TEAMS.map(t=><button key={t} onClick={()=>asgn(u.id,t)} className="btn" style={{padding:"5px 14px",borderRadius:8,border:`1px solid ${C.navy}25`,background:"transparent",color:C.navy,fontSize:11,fontWeight:700,fontFamily:F.d}}>{t}</button>)}</div>
        </div>)}
      </div>}
    </div>}
    {tab==="days"&&<div>
      {TEAMS.map((team,i)=>{const op=ds[team];const gl=obj[team]||30;return<div key={team} className="crd fu" style={{animationDelay:`${i*.08}s`,background:C.card,borderRadius:20,border:`1px solid ${C.bdr}`,padding:22,marginBottom:16,boxShadow:C.sh}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
          <div><h4 style={{color:C.navy,fontSize:17,fontWeight:900,margin:0,fontFamily:F.d}}>{team}</h4>
            <span style={{fontSize:12,color:op?C.navy:C.red,fontWeight:700,display:"flex",alignItems:"center",gap:5,marginTop:5}}><Ic d={op?P.play:P.stop} size={11} color={op?C.navy:C.red}/>{op?"Ouverte":"Fermée"}</span></div>
          <button onClick={()=>closeDay(team)} className="btn" style={{padding:"11px 24px",borderRadius:13,border:"none",background:op?`linear-gradient(135deg,${C.red},${C.redD})`:`linear-gradient(135deg,${C.navy},${C.navyL})`,color:"#fff",fontSize:13,fontWeight:800,fontFamily:F.d}}>{op?"Fermer":"Ouvrir"}</button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}><label style={{color:C.txtD,fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>Objectif:</label>
          <input type="number" value={gl} onChange={e=>setObj(p=>({...p,[team]:parseInt(e.target.value)||0}))} className="inp" style={{width:80,padding:"9px 14px",background:C.bg,border:`1.5px solid ${C.bdr}`,borderRadius:10,color:C.txt,fontSize:15,fontFamily:F.m,fontWeight:700,outline:"none"}}/>
        </div>
      </div>;})}
    </div>}
    {tab==="billing"&&<div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:18}}><h3 style={{color:C.txt,fontSize:16,fontWeight:900,margin:0,fontFamily:F.d}}>Feuilles de temps</h3><DateP value={bd} onChange={setBd}/></div>
      <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>{TEAMS.map(TB)}</div>
      {(()=>{const recs=bill.filter(r=>r.team===st&&r.date===bd);if(!recs.length)return<div className="fu" style={{background:C.card,borderRadius:20,border:`1px solid ${C.bdr}`,padding:52,textAlign:"center",boxShadow:C.sh}}><Ic d={P.file} size={38} color={C.txtM}/><p style={{color:C.txtD,fontSize:14,marginTop:14,fontWeight:600}}>Aucune feuille</p><p style={{color:C.txtM,fontSize:12,margin:"4px 0 0"}}>Créée lors de la fermeture</p></div>;
        return recs.map(rec=>{const tw=rec.entries.reduce((s,e)=>s+e.worked,0),ta=rec.entries.reduce((s,e)=>s+e.admin,0);return<div key={rec.id} className="crd fu" style={{background:C.card,borderRadius:20,border:`1px solid ${C.bdr}`,overflow:"hidden",marginBottom:16,boxShadow:C.sh}}>
          <div style={{padding:"18px 22px",borderBottom:`1px solid ${C.bdr}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
            <div><span style={{color:C.navy,fontSize:16,fontWeight:900,fontFamily:F.d}}>{rec.team}</span><span style={{color:C.txtD,fontSize:12,marginLeft:12,fontFamily:F.m}}>{rec.date}</span></div>
            <div style={{display:"flex",gap:18,fontSize:12}}><span style={{color:C.txtD}}>Terrain: <strong style={{color:C.navy,fontFamily:F.m}}>{tw.toFixed(1)}h</strong></span><span style={{color:C.txtD}}>Admin: <strong style={{color:C.red,fontFamily:F.m}}>{ta.toFixed(1)}h</strong></span><span style={{color:C.txt,fontWeight:900,fontFamily:F.m}}>{(tw+ta).toFixed(1)}h</span></div>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr style={{borderBottom:`2px solid ${C.bdr}`}}><th style={TH}>Collecteur</th><th style={{...TH,textAlign:"center"}}>Terrain</th><th style={{...TH,textAlign:"center"}}>Admin</th><th style={{...TH,textAlign:"right"}}>Total</th></tr></thead>
            <tbody>{rec.entries.map(e=><tr key={e.collectorId} style={{borderBottom:`1px solid ${C.bdrL}`}}>
              <td style={TD}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:28,height:28,borderRadius:8,background:C.navy+"0D",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic d={P.user} size={12} color={C.navy}/></div>{e.collectorName}</div></td>
              <td style={{...TD,textAlign:"center",fontFamily:F.m,color:C.navy,fontWeight:700}}>{e.worked.toFixed(1)}h</td>
              <td style={{...TD,textAlign:"center",fontFamily:F.m,color:C.red,fontWeight:700}}>{e.admin.toFixed(1)}h</td>
              <td style={{...TD,textAlign:"right",fontFamily:F.m,fontWeight:900}}>{(e.worked+e.admin).toFixed(1)}h</td>
            </tr>)}</tbody></table>
        </div>;});
      })()}
    </div>}
    {tab==="history"&&<div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:18}}><h3 style={{color:C.txt,fontSize:16,fontWeight:900,margin:0,fontFamily:F.d}}>Historique</h3><DateP value={hd} onChange={setHd}/></div>
      <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>{TEAMS.map(TB)}</div>
      <div style={{background:C.card,borderRadius:18,border:`1px solid ${C.bdr}`,overflow:"hidden",boxShadow:C.sh}}><DonTable data={dons.filter(d=>d.team===st&&d.date===hd)} showCol/></div>
    </div>}
    {cl&&<CloseModal team={cl} members={clMem} onOk={okClose} onNo={()=>setCl(null)}/>}
  </div>;
}

// ─── App ─────────────────────────────────────────────────────────────
export default function App() {
  const [splash,setSplash]=useState(true);
  const [welcome,setWelcome]=useState(null); // holds user during welcome splash
  const [user,setUser]=useState(null);
  const [users,setUsers]=useState(DEF_USERS);
  const [dons,setDons]=useState([]);
  const [obj,setObj]=useState({"Équipe Alpha":25,"Équipe Beta":20});
  const [ds,setDs]=useState({"Équipe Alpha":true,"Équipe Beta":true});
  const [bill,setBill]=useState([]);
  const [ready,setReady]=useState(false);

  useEffect(()=>{(async()=>{
    const [sU,sD,sO,sDS,sB]=await Promise.all([DB.get("po-users"),DB.get("po-dons"),DB.get("po-obj"),DB.get("po-ds"),DB.get("po-bill")]);
    if(sU)setUsers(sU); if(sD)setDons(sD);else{const s=seedDon(sU||DEF_USERS);setDons(s);await DB.set("po-dons",s);}
    if(sO)setObj(sO); if(sDS)setDs(sDS); if(sB)setBill(sB); setReady(true);
  })();},[]);

  useEffect(()=>{if(ready)DB.set("po-users",users);},[users,ready]);
  useEffect(()=>{if(ready)DB.set("po-dons",dons);},[dons,ready]);
  useEffect(()=>{if(ready)DB.set("po-obj",obj);},[obj,ready]);
  useEffect(()=>{if(ready)DB.set("po-ds",ds);},[ds,ready]);
  useEffect(()=>{if(ready)DB.set("po-bill",bill);},[bill,ready]);

  const handleLogin = (u) => {
    setWelcome(u); // show welcome splash first
  };
  const handleWelcomeDone = () => {
    setUser(welcome);
    setWelcome(null);
  };

  if(splash) return <SplashScreen onDone={()=>setSplash(false)}/>;

  if(!ready) return <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F.d}}>
    <Styles/><div style={{textAlign:"center"}}><div style={{animation:"spin 1s linear infinite",width:36,height:36,border:`3px solid ${C.bdr}`,borderTopColor:C.navy,borderRadius:"50%",margin:"0 auto 16px"}}/><p style={{color:C.txtD,fontSize:14}}>Chargement...</p></div>
  </div>;

  if(welcome) return <WelcomeSplash user={welcome} onDone={handleWelcomeDone}/>;

  if(!user) return <Login onLogin={handleLogin} users={users}/>;

  return <div style={{minHeight:"100vh",background:C.bg,fontFamily:F.d,color:C.txt}}>
    <Styles/>
    <header className="fi" style={{background:C.surf,borderBottom:`1px solid ${C.bdr}`,padding:"0 24px",height:66,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50,boxShadow:"0 1px 12px rgba(45,43,107,.05)"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}><Logo size={30}/><span style={{fontSize:19,fontWeight:900,color:C.navy,letterSpacing:"-.4px"}}>Public Outreach</span></div>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:700,color:C.txt}}>{user.name}</div><div style={{fontSize:11,fontWeight:600,color:user.role==="manager"?C.red:C.navy}}>{user.role==="manager"?"Manager":"Collecteur"} · {user.team}</div></div>
        <button onClick={()=>setUser(null)} className="btn" style={{width:40,height:40,borderRadius:12,border:`1.5px solid ${C.bdr}`,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic d={P.out} size={16} color={C.red}/></button>
      </div>
    </header>
    <main style={{maxWidth:1000,margin:"0 auto",padding:"32px 22px"}}>
      {user.role==="collector"
        ?<ColDash user={user} dons={dons} obj={obj}/>
        :<MgrDash dons={dons} obj={obj} setObj={setObj} users={users} setU={setUsers} ds={ds} setDs={setDs} bill={bill} setBill={setBill}/>}
    </main>
  </div>;
}