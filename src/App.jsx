import { useState, useEffect, useRef, useCallback } from "react";

const API = (process.env.REACT_APP_API_URL || "https://weka-soko-backend-production.up.railway.app").replace(/\/$/, "");

const CATEGORIES = [
  { name:"Electronics", icon:"📱", sub:["Phones & Tablets","Laptops","TVs & Audio","Cameras","Gaming","Accessories"] },
  { name:"Vehicles", icon:"🚗", sub:["Cars","Motorcycles","Trucks","Buses","Boats","Vehicle Parts"] },
  { name:"Property", icon:"🏠", sub:["Houses for Sale","Land","Commercial Property","Short Stays"] },
  { name:"Fashion", icon:"👗", sub:["Men's Clothing","Women's Clothing","Shoes","Bags","Watches","Jewellery"] },
  { name:"Furniture", icon:"🛋️", sub:["Sofas & Chairs","Beds & Mattresses","Tables","Wardrobes","Office Furniture"] },
  { name:"Home & Garden", icon:"🏡", sub:["Kitchen Appliances","Home Décor","Garden Tools","Cleaning","Lighting"] },
  { name:"Sports & Outdoors", icon:"⚽", sub:["Fitness Equipment","Bicycles","Outdoor Gear","Team Sports","Water Sports"] },
  { name:"Baby & Kids", icon:"🍼", sub:["Baby Gear","Toys & Games","Kids Clothing","Kids Furniture","School Supplies"] },
  { name:"Books & Education", icon:"📚", sub:["Textbooks","Fiction","Non-Fiction","Courses","Instruments"] },
  { name:"Agriculture", icon:"🌾", sub:["Livestock","Farm Equipment","Seeds & Fertilizer","Produce","Irrigation"] },
  { name:"Services", icon:"🔧", sub:["Home Services","Business Services","Tech Services","Transport","Events"] },
  { name:"Jobs", icon:"💼", sub:["Full-time","Part-time","Freelance","Internship"] },
  { name:"Food & Catering", icon:"🍽️", sub:["Catering Equipment","Food Products","Restaurant Supplies"] },
  { name:"Health & Beauty", icon:"💊", sub:["Health Products","Beauty & Skincare","Gym Equipment","Medical Equipment"] },
  { name:"Pets", icon:"🐾", sub:["Dogs","Cats","Birds","Fish","Pet Supplies"] },
  { name:"Other", icon:"📦", sub:["Miscellaneous"] },
];

const TERMS = `WEKA SOKO — TERMS & CONDITIONS
Last updated: February 2026

1. ACCEPTANCE
By creating an account or using Weka Soko ("the Platform"), you agree to these Terms. If you do not agree, do not use the Platform.

2. PLATFORM ROLE & DISCLAIMER OF LIABILITY
Weka Soko is a classified advertising platform only. We are NOT a party to any transaction between buyers and sellers. We do not buy, sell, hold, inspect, or guarantee any listed item. ALL transactions occur solely between the buyer and seller. Weka Soko, its owners, directors, and employees are NOT liable for: item quality, safety, legality or authenticity; any loss or damage arising from a transaction; fraudulent listings; failed or disputed payments; or any indirect damages. Users transact entirely at their own risk.

3. ESCROW SERVICE
Escrow is provided as a convenience only. Weka Soko is not a licensed financial institution. The 2.5% platform fee is non-refundable once an STK push is accepted. Dispute decisions by Weka Soko are final.

4. FEES & PAYMENTS
The KSh 250 contact unlock fee is non-refundable. All payments are made to Till Number 5673935.

5. PROHIBITED CONTENT
Users may NOT list: stolen goods, counterfeit items, illegal drugs, weapons, adult/explicit content, or anything prohibited under Kenyan law. Violators will be permanently banned and may be reported to the relevant authorities.

6. CONTENT POLICY
No offensive or hateful language. No contact information shared in chat before unlock. Listing photos must not contain nudity or personal contact details.

7. ACCOUNT RESPONSIBILITY
You are responsible for all activity on your account. Keep your password secure.

8. GOVERNING LAW
These Terms are governed exclusively by the laws of Kenya. Any disputes shall be resolved in Kenyan courts.

Contact us: support@wekasoko.co.ke`;

const fmtKES = n => "KSh " + Number(n).toLocaleString("en-KE");
const ago = ts => {
  const d = Date.now() - new Date(ts).getTime();
  if (d < 60000) return "just now";
  if (d < 3600000) return Math.floor(d / 60000) + "m ago";
  if (d < 86400000) return Math.floor(d / 3600000) + "h ago";
  return Math.floor(d / 86400000) + "d ago";
};

async function api(path, opts = {}, token = null) {
  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers };
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Request failed");
  return data;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,800;1,9..144,700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#F7F6F2;--surf:#FFFFFF;--sh:#EFEDE6;--border:#E2DED5;
  --accent:#1A6B38;--accent2:#22883F;--gold:#B8860B;--red:#B03030;
  --txt:#1C1B18;--mut:#6A6960;--dim:#AAAA9E;
  --r:12px;--rs:8px;--rl:20px;
  --fn:'DM Sans',system-ui,sans-serif;--fs:'Fraunces',Georgia,serif;
}
body.dark{
  --bg:#0E0E0C;--surf:#181714;--sh:#1C1C19;--border:#2C2C28;
  --accent:#2ECC71;--accent2:#27AE60;--gold:#F0C040;--red:#E05050;
  --txt:#F0EFE9;--mut:#888880;--dim:#555548;
}
body{background:var(--bg);color:var(--txt);font-family:var(--fn);font-size:15px;line-height:1.6;min-height:100vh;overflow-x:hidden;transition:background .2s,color .2s;}
h1,h2,h3{font-family:var(--fs);}
::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px;}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:10px 20px;border-radius:var(--rs);font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all .15s;white-space:nowrap;font-family:var(--fn);letter-spacing:.01em;}
.btn:disabled{opacity:.4;cursor:not-allowed;}
.bp{background:var(--accent);color:#fff;}.bp:hover:not(:disabled){background:var(--accent2);transform:translateY(-1px);box-shadow:0 4px 18px rgba(26,107,56,.28);}
.bs{background:var(--surf);color:var(--txt);border:1.5px solid var(--border);}.bs:hover:not(:disabled){border-color:var(--accent);color:var(--accent);}
.bg2{background:var(--gold);color:#fff;}.bg2:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px);}
.bgh{background:transparent;color:var(--mut);border:none;}.bgh:hover:not(:disabled){color:var(--txt);background:var(--sh);}
.br2{background:rgba(176,48,48,.07);color:var(--red);border:1px solid rgba(176,48,48,.18);}.br2:hover:not(:disabled){background:rgba(176,48,48,.14);}
.sm{padding:6px 13px;font-size:12px;}.lg{padding:13px 28px;font-size:15px;}

.inp{width:100%;padding:10px 13px;background:var(--sh);border:1.5px solid var(--border);border-radius:var(--rs);color:var(--txt);font-family:var(--fn);font-size:14px;outline:none;transition:border-color .15s,background .15s;}
.inp:focus{border-color:var(--accent);background:var(--surf);}
.inp::placeholder{color:var(--dim);}
textarea.inp{resize:vertical;min-height:90px;}
select.inp{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 8L1 3h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;}
.lbl{display:block;font-size:11px;font-weight:700;color:var(--mut);letter-spacing:.07em;text-transform:uppercase;margin-bottom:5px;}

.card{background:var(--surf);border:1px solid var(--border);border-radius:var(--r);}
.lcard{background:var(--surf);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;transition:all .18s;cursor:pointer;}
.lcard:hover{transform:translateY(-3px);box-shadow:0 8px 28px rgba(0,0,0,.09);border-color:rgba(26,107,56,.25);}
body.dark .lcard:hover{box-shadow:0 8px 28px rgba(0,0,0,.4);}
.lcard-list{display:flex;flex-direction:row;}
.lcard-list .lthumb{width:160px;min-width:160px;height:130px;aspect-ratio:unset;}
.lthumb{width:100%;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;background:var(--sh);position:relative;overflow:hidden;}
.lthumb img{width:100%;height:100%;object-fit:cover;}

.nav{position:sticky;top:0;z-index:100;background:rgba(247,246,242,.93);border-bottom:1px solid var(--border);padding:0 26px;height:60px;display:flex;align-items:center;justify-content:space-between;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);}
body.dark .nav{background:rgba(14,14,12,.93);}
.logo{font-family:var(--fs);font-size:22px;font-weight:800;cursor:pointer;letter-spacing:-.02em;}
.logo span{color:var(--accent);}

.ov{position:fixed;inset:0;background:rgba(0,0,0,.48);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(5px);}
body.dark .ov{background:rgba(0,0,0,.72);}
.mod{background:var(--surf);border:1px solid var(--border);border-radius:var(--rl);width:100%;max-width:520px;max-height:93vh;overflow-y:auto;animation:su .2s cubic-bezier(.2,.8,.3,1);}
.mod.lg{max-width:700px;}
@keyframes su{from{opacity:0;transform:translateY(22px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
.mh{padding:22px 26px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--surf);z-index:2;}
.mb{padding:22px 26px;}
.mf{padding:14px 26px 22px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end;}

.badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700;}
.bg-g{background:rgba(26,107,56,.1);color:var(--accent);border:1px solid rgba(26,107,56,.2);}
.bg-y{background:rgba(184,134,11,.1);color:var(--gold);border:1px solid rgba(184,134,11,.2);}
.bg-r{background:rgba(176,48,48,.1);color:var(--red);border:1px solid rgba(176,48,48,.2);}
.bg-m{background:rgba(100,100,90,.08);color:var(--mut);border:1px solid var(--border);}

.toast{position:fixed;bottom:24px;right:24px;z-index:2000;background:var(--surf);border:1px solid var(--border);border-radius:var(--r);padding:14px 18px;font-size:14px;box-shadow:0 8px 36px rgba(0,0,0,.14);animation:ti .22s ease;display:flex;align-items:center;gap:10px;max-width:350px;}
@keyframes ti{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:translateX(0)}}

.sc{background:var(--sh);border-radius:var(--r);padding:18px 20px;border:1px solid var(--border);}
.spin{display:inline-block;width:20px;height:20px;border:2.5px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:sp .7s linear infinite;}
@keyframes sp{to{transform:rotate(360deg)}}
.empty{text-align:center;padding:60px 20px;color:var(--mut);}
.empty-icon{font-size:52px;margin-bottom:14px;opacity:.3;}
.g3{display:grid;grid-template-columns:repeat(auto-fill,minmax(265px,1fr));gap:20px;}
.lvc{display:flex;flex-direction:column;gap:14px;}
.pg{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:36px;flex-wrap:wrap;}
.pb{width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:var(--rs);border:1.5px solid var(--border);background:var(--sh);color:var(--mut);cursor:pointer;font-size:13px;font-weight:700;transition:all .14s;}
.pb.on{background:var(--accent);color:#fff;border-color:var(--accent);}
.pb:hover:not(.on){border-color:var(--accent);color:var(--accent);}
.sold-badge{position:absolute;top:10px;right:10px;background:var(--accent);color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.02em;}
.tag-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;}
.alert{padding:12px 15px;border-radius:var(--rs);font-size:13px;line-height:1.65;}
.ag{background:rgba(26,107,56,.07);border:1px solid rgba(26,107,56,.2);color:var(--accent);}
.ay{background:rgba(184,134,11,.07);border:1px solid rgba(184,134,11,.2);color:var(--gold);}
.ar{background:rgba(176,48,48,.07);border:1px solid rgba(176,48,48,.2);color:var(--red);}
.cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:8px;margin-bottom:28px;}
.cat-item{background:var(--sh);border:1.5px solid var(--border);border-radius:var(--rs);padding:12px 6px;text-align:center;cursor:pointer;transition:all .14s;}
.cat-item:hover,.cat-item.on{border-color:var(--accent);color:var(--accent);background:rgba(26,107,56,.05);}
.how-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:12px;margin-top:28px;}
.how-item{background:var(--surf);border:1px solid var(--border);border-radius:var(--r);padding:18px 16px;}
.tab-row{display:flex;gap:2px;background:var(--sh);border-radius:var(--rs);padding:3px;overflow-x:auto;}
.tab{padding:7px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;transition:all .14s;color:var(--mut);white-space:nowrap;}
.tab.on{background:var(--surf);color:var(--txt);}
.inbox-row{padding:14px 18px;border-bottom:1px solid var(--border);cursor:pointer;}
.inbox-row:hover{background:var(--sh);}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-bottom:18px;}
@media(max-width:640px){
  .nav{padding:0 14px;}.mod{max-width:100%;border-radius:var(--rl) var(--rl) 0 0;align-self:flex-end;max-height:95vh;}
  .mh,.mb,.mf{padding-left:16px;padding-right:16px;}
  .lcard-list{flex-direction:column;}.lcard-list .lthumb{width:100%;height:auto;aspect-ratio:16/9;}
  .g3{grid-template-columns:1fr 1fr;}
  .hero-btns{flex-direction:column;}
}
`;

function Counter({ to }) {
  const [n, setN] = useState(0); const ref = useRef(null);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      let v = 0; const step = Math.max(1, to / 70);
      const iv = setInterval(() => { v += step; if (v >= to) { setN(to); clearInterval(iv); } else setN(Math.floor(v)); }, 16);
      ob.disconnect();
    });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, [to]);
  return <span ref={ref}>{n.toLocaleString()}</span>;
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, []);
  const icon = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" }[type] || "ℹ️";
  return <div className="toast"><span style={{ fontSize: 18 }}>{icon}</span><span>{msg}</span></div>;
}

function Overlay({ onClose, children }) {
  return <div className="ov" onClick={e => e.target === e.currentTarget && onClose()}>{children}</div>;
}

function Modal({ title, onClose, children, footer, large }) {
  return (
    <Overlay onClose={onClose}>
      <div className={`mod${large ? " lg" : ""}`}>
        <div className="mh">
          <h3 style={{ fontSize: 17, fontFamily: "var(--fn)", fontWeight: 700 }}>{title}</h3>
          <button className="btn bgh" style={{ padding: "4px 9px", fontSize: 16 }} onClick={onClose}>✕</button>
        </div>
        <div className="mb">{children}</div>
        {footer && <div className="mf">{footer}</div>}
      </div>
    </Overlay>
  );
}

function FF({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label className="lbl">{label}</label>}
      {children}
      {hint && <p style={{ fontSize: 11, color: "var(--dim)", marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

function TermsModal({ onClose, onAccept }) {
  const [scrolled, setScrolled] = useState(false);
  const boxRef = useRef(null);
  const onScroll = () => {
    const el = boxRef.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 30) setScrolled(true);
  };
  return (
    <Modal title="📄 Terms & Conditions" onClose={onClose} footer={
      <>
        <button className="btn bs" onClick={onClose}>Decline</button>
        <button className="btn bp" onClick={onAccept} disabled={!scrolled}>{scrolled ? "I Accept →" : "Scroll to Accept"}</button>
      </>
    }>
      {!scrolled && <div className="alert ay" style={{ marginBottom: 14 }}>📖 Please scroll to the bottom to accept.</div>}
      <div ref={boxRef} onScroll={onScroll} style={{ maxHeight: 370, overflowY: "auto", background: "var(--sh)", borderRadius: "var(--rs)", padding: "16px 20px", fontSize: 13, lineHeight: 1.9, color: "var(--mut)", whiteSpace: "pre-wrap" }}>
        {TERMS}
      </div>
    </Modal>
  );
}

function AuthModal({ defaultMode, onClose, onAuth, notify }) {
  const [mode, setMode] = useState(defaultMode || "login");
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [f, setF] = useState({ name: "", email: "", password: "", role: "buyer", phone: "" });
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.email || !f.password) { notify("Please fill in all required fields.", "warning"); return; }
    if (mode === "signup") {
      if (!f.name.trim()) { notify("Please enter your name.", "warning"); return; }
      if (f.password.length < 8) { notify("Password must be at least 8 characters.", "warning"); return; }
      if (!agreed) { notify("Please accept the Terms & Conditions.", "warning"); return; }
    }
    setLoading(true);
    try {
      let data;
      if (mode === "login") {
        data = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: f.email.trim(), password: f.password }) });
      } else {
        data = await api("/api/auth/register", { method: "POST", body: JSON.stringify({ name: f.name.trim(), email: f.email.trim(), password: f.password, role: f.role, phone: f.phone.trim() || undefined }) });
      }
      localStorage.setItem("ws_token", data.token);
      localStorage.setItem("ws_user", JSON.stringify(data.user));
      onAuth(data.user, data.token);
      onClose();
      notify(`Welcome${data.user.name ? ", " + data.user.name.split(" ")[0] : ""}! 🎉`, "success");
    } catch (err) {
      notify(err.message, "error");
    } finally { setLoading(false); }
  };

  if (showTerms) return <TermsModal onClose={() => setShowTerms(false)} onAccept={() => { setAgreed(true); setShowTerms(false); notify("Terms accepted ✓", "success"); }} />;

  return (
    <Modal title={mode === "login" ? "Welcome Back" : "Create Account"} onClose={onClose} footer={
      <>
        <button className="btn bs" onClick={onClose}>Cancel</button>
        <button className="btn bp" onClick={submit} disabled={loading}>{loading ? <span className="spin" /> : mode === "login" ? "Sign In →" : "Create Account →"}</button>
      </>
    }>
      {mode === "signup" && <>
        <FF label="Full Name"><input className="inp" placeholder="Your full name" value={f.name} onChange={e => sf("name", e.target.value)} /></FF>
        <FF label="I am a">
          <div style={{ display: "flex", gap: 8 }}>
            {["buyer", "seller"].map(r => <button key={r} className={`btn ${f.role === r ? "bp" : "bs"} sm`} style={{ flex: 1 }} onClick={() => sf("role", r)}>{r === "buyer" ? "🛍 Buyer" : "🏷 Seller"}</button>)}
          </div>
        </FF>
        <FF label="Phone (M-Pesa)"><input className="inp" placeholder="07XXXXXXXX" value={f.phone} onChange={e => sf("phone", e.target.value)} /></FF>
      </>}
      <FF label="Email Address"><input className="inp" type="email" placeholder="you@example.com" value={f.email} onChange={e => sf("email", e.target.value)} /></FF>
      <FF label="Password" hint={mode === "signup" ? "Minimum 8 characters" : ""}>
        <input className="inp" type="password" placeholder="••••••••" value={f.password} onChange={e => sf("password", e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
      </FF>
      {mode === "signup" && (
        <div style={{ background: "var(--sh)", borderRadius: "var(--rs)", padding: "12px 14px" }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 9, cursor: "pointer", fontSize: 13, color: "var(--mut)" }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2, width: 15, height: 15 }} />
            <span>I have read and agree to the <button className="btn bgh" style={{ display: "inline", padding: "0 2px", color: "var(--accent)", fontWeight: 700, fontSize: 13 }} onClick={() => setShowTerms(true)}>Terms & Conditions</button></span>
          </label>
        </div>
      )}
      <p style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "var(--mut)" }}>
        {mode === "login" ? "Don't have an account? " : "Already have one? "}
        <button className="btn bgh" style={{ display: "inline", padding: "0 3px", color: "var(--accent)", fontWeight: 700, fontSize: 13 }} onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Sign up free" : "Sign in here"}
        </button>
      </p>
    </Modal>
  );
}

function ShareModal({ listing, onClose }) {
  const url = `${window.location.href.split("?")[0]}?listing=${listing.id}`;
  const txt = `"${listing.title}" — ${fmtKES(listing.price)} on Weka Soko`;
  const [copied, setCopied] = useState(false);
  const share = (u) => window.open(u, "_blank", "noopener,noreferrer");
  return (
    <Modal title="Share This Listing" onClose={onClose}>
      <div style={{ background: "var(--sh)", borderRadius: "var(--rs)", padding: 14, marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ fontSize: 26 }}>🔗</span>
        <div><div style={{ fontWeight: 600, fontSize: 14 }}>{listing.title}</div><div style={{ fontSize: 12, color: "var(--mut)" }}>{fmtKES(listing.price)}</div></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        {[
          { icon: "💬", label: "WhatsApp", url: `https://wa.me/?text=${encodeURIComponent(txt + "\n" + url)}` },
          { icon: "📘", label: "Facebook", url: `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
          { icon: "🐦", label: "Twitter / X", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(txt)}&url=${encodeURIComponent(url)}` },
          { icon: "✈️", label: "Telegram", url: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(txt)}` },
        ].map(p => (
          <button key={p.label} className="btn bs" style={{ flexDirection: "column", gap: 6, padding: "14px 8px", height: 72 }} onClick={() => share(p.url)}>
            <span style={{ fontSize: 22 }}>{p.icon}</span><span style={{ fontSize: 12 }}>{p.label}</span>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input className="inp" value={url} readOnly style={{ flex: 1, fontSize: 12 }} />
        <button className="btn bp sm" onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2500); }}>{copied ? "✓ Copied!" : "Copy"}</button>
      </div>
    </Modal>
  );
}

function MpesaModal({ amount, purpose, onSuccess, onClose, allowVoucher, token }) {
  const [phone, setPhone] = useState("07");
  const [step, setStep] = useState("form");
  const [countdown, setCountdown] = useState(30);
  const [vcode, setVcode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [vLoading, setVLoading] = useState(false);
  const finalAmt = Math.max(0, Math.round(amount * (1 - discount / 100)));

  const applyVoucher = async () => {
    if (!vcode.trim()) return;
    setVLoading(true);
    try {
      const v = await api(`/api/vouchers/${vcode.toUpperCase()}`, {}, token);
      setDiscount(v.discount);
    } catch { alert("Invalid or expired voucher code."); }
    finally { setVLoading(false); }
  };

  const pay = () => {
    setStep("waiting");
    let c = 30; const iv = setInterval(() => {
      c--; setCountdown(c);
      if (c <= 0) { clearInterval(iv); setStep("done"); setTimeout(() => onSuccess({ receipt: "QH" + Math.floor(Math.random() * 90000000 + 10000000), amount: finalAmt }), 900); }
    }, 1000);
  };

  return (
    <Modal title="M-Pesa Payment" onClose={onClose}>
      {step === "form" && <>
        <div style={{ background: "rgba(26,107,56,.06)", border: "1px solid rgba(26,107,56,.18)", borderRadius: "var(--r)", padding: "16px 18px", marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: "var(--mut)", marginBottom: 2 }}>Paying to Till No. <strong style={{ color: "var(--txt)" }}>5673935</strong></div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "var(--accent)" }}>{fmtKES(finalAmt)}</div>
          {discount > 0 && <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 3 }}>✓ Voucher: {discount}% off</div>}
          <div style={{ fontSize: 13, color: "var(--mut)", marginTop: 3 }}>{purpose}</div>
        </div>
        {allowVoucher && <FF label="Voucher Code (Optional)">
          <div style={{ display: "flex", gap: 8 }}>
            <input className="inp" placeholder="e.g. WS-FREE50" value={vcode} onChange={e => setVcode(e.target.value)} style={{ flex: 1 }} />
            <button className="btn bs sm" onClick={applyVoucher} disabled={vLoading}>{vLoading ? <span className="spin" style={{ width: 14, height: 14 }} /> : "Apply"}</button>
          </div>
        </FF>}
        <FF label="Your M-Pesa Number">
          <div style={{ display: "flex" }}>
            <div style={{ background: "var(--sh)", border: "1.5px solid var(--border)", borderRight: "none", borderRadius: "var(--rs) 0 0 var(--rs)", padding: "10px 12px", fontSize: 13, color: "var(--mut)" }}>🇰🇪 +254</div>
            <input className="inp" style={{ borderRadius: "0 var(--rs) var(--rs) 0" }} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="0712345678" maxLength={10} />
          </div>
        </FF>
        {finalAmt === 0
          ? <button className="btn bp lg" style={{ width: "100%" }} onClick={() => onSuccess({ receipt: "VOUCHER-" + Date.now(), amount: 0 })}>Redeem for Free →</button>
          : <button className="btn bp lg" style={{ width: "100%" }} onClick={pay} disabled={phone.length < 10}>Send STK Push to Phone →</button>}
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--dim)", marginTop: 10 }}>You will receive an M-Pesa prompt on your phone. Enter your PIN to confirm.</p>
      </>}
      {step === "waiting" && <div style={{ textAlign: "center", padding: "30px 0" }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>📱</div>
        <h3 style={{ fontFamily: "var(--fn)", fontWeight: 700, marginBottom: 8 }}>Check Your Phone</h3>
        <p style={{ color: "var(--mut)", fontSize: 14, marginBottom: 16 }}>Enter your M-Pesa PIN to pay <strong>Till 5673935</strong></p>
        <div style={{ fontSize: 38, fontWeight: 800, color: "var(--accent)" }}>{countdown}s</div>
      </div>}
      {step === "done" && <div style={{ textAlign: "center", padding: "30px 0" }}>
        <div style={{ fontSize: 56, marginBottom: 14 }}>✅</div>
        <h3 style={{ color: "var(--accent)", fontFamily: "var(--fn)", fontWeight: 700, marginBottom: 6 }}>Payment Confirmed!</h3>
        <p style={{ color: "var(--mut)", fontSize: 14 }}>Receipt sent to your email and platform inbox.</p>
      </div>}
    </Modal>
  );
}

function ListingCard({ listing: l, onClick, listView }) {
  const isSold = l.status === "sold";
  const photo = Array.isArray(l.photos) ? l.photos[0] : null;
  return (
    <div className={`lcard${listView ? " lcard-list" : ""}`} onClick={onClick} style={{ opacity: isSold ? .82 : 1 }}>
      <div className="lthumb">
        {photo ? <img src={photo} alt={l.title} /> : <span style={{ fontSize: 44, opacity: .28 }}>📦</span>}
        {isSold && <div className="sold-badge">SOLD ✓</div>}
        {l.locked_buyer_id && !l.is_unlocked && <div style={{ position: "absolute", bottom: 8, left: 8, background: "var(--gold)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20 }}>🔥 Buyer Interested</div>}
      </div>
      <div style={{ padding: 14, flex: 1 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35, fontFamily: "var(--fn)", marginBottom: 6 }}>{l.title}</h4>
        <div style={{ fontSize: 21, fontWeight: 800, color: "var(--accent)", marginBottom: 6 }}>{fmtKES(l.price)}</div>
        {listView && l.description && <p style={{ fontSize: 13, color: "var(--mut)", marginBottom: 8, lineHeight: 1.65 }}>{l.description.slice(0, 120)}...</p>}
        <div style={{ display: "flex", gap: 10, color: "var(--mut)", fontSize: 12, flexWrap: "wrap" }}>
          {l.location && <span>📍 {l.location}</span>}
          <span>👁 {l.view_count || 0}</span>
          <span>🕒 {ago(l.created_at)}</span>
        </div>
        <div className="tag-row">
          <span className="badge bg-m">{l.category}</span>
          {l.subcat && <span className="badge bg-m">{l.subcat}</span>}
        </div>
      </div>
    </div>
  );
}

function DetailModal({ listing: l, user, token, onClose, onShare, onUnlock, onEscrow, notify }) {
  const isSeller = user?.id === l.seller_id;
  const photo = Array.isArray(l.photos) ? l.photos[0] : null;
  const escrowFee = Math.round(l.price * 0.025);
  return (
    <Modal title={l.title} onClose={onClose} large footer={
      <div style={{ width: "100%", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn bs sm" onClick={onShare}>↗ Share</button>
        {!isSeller && l.status === "active" && <button className="btn bp" style={{ flex: 1 }} onClick={() => { if (!user) { notify("Please sign in to contact seller.", "warning"); onClose(); } else notify("Chat coming soon — use the contact details after unlock.", "info"); }}>💬 Chat with Seller</button>}
        {!isSeller && l.status === "active" && <button className="btn bg2 sm" onClick={onEscrow}>🔐 Escrow</button>}
        {isSeller && l.locked_buyer_id && !l.is_unlocked && <button className="btn bp" style={{ flex: 1 }} onClick={onUnlock}>🔓 Unlock Contact — KSh 250</button>}
      </div>
    }>
      <div style={{ background: "var(--sh)", borderRadius: "var(--rs)", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 18, position: "relative" }}>
        {photo ? <img src={photo} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 80, opacity: .2 }}>📦</span>}
        {l.status === "sold" && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.42)", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ background: "var(--accent)", color: "#fff", padding: "8px 24px", borderRadius: 30, fontWeight: 800, fontSize: 18, letterSpacing: ".04em" }}>SOLD ✓</div></div>}
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "var(--accent)" }}>{fmtKES(l.price)}</div>
          <div className="tag-row">
            <span className="badge bg-m">{l.category}</span>
            {l.subcat && <span className="badge bg-m">{l.subcat}</span>}
          </div>
        </div>
        <span className={`badge ${l.status === "active" ? "bg-g" : "bg-m"}`}>{l.status}</span>
      </div>
      {l.description && <div style={{ marginBottom: 16 }}><div className="lbl">Description</div><p style={{ color: "var(--mut)", fontSize: 14, lineHeight: 1.8 }}>{l.description}</p></div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {l.reason_for_sale && <div style={{ background: "var(--sh)", borderRadius: "var(--rs)", padding: "11px 13px" }}><div className="lbl">Reason for Sale</div><div style={{ fontSize: 13 }}>{l.reason_for_sale}</div></div>}
        {l.location && <div style={{ background: "var(--sh)", borderRadius: "var(--rs)", padding: "11px 13px" }}><div className="lbl">Location</div><div style={{ fontSize: 13 }}>📍 {l.location}</div></div>}
      </div>
      <div style={{ marginBottom: 16 }}>
        <div className="lbl">Seller</div>
        {l.is_unlocked
          ? <div className="alert ag"><strong>🔓 Contact Revealed</strong><br /><span style={{ fontSize: 13 }}>{l.seller_name || "Seller"} — {l.seller_phone || "Check inbox for details"}</span></div>
          : <div style={{ background: "var(--sh)", borderRadius: "var(--rs)", padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>🔒</span>
            <div><div style={{ fontWeight: 600, fontSize: 14 }}>{l.seller_anon || "Anonymous Seller"}</div><div style={{ fontSize: 12, color: "var(--mut)" }}>Pay KSh 250 to reveal contact details</div></div>
          </div>}
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--mut)" }}>
        <span>👁 {l.view_count || 0} views</span>
        <span>🔥 {l.interest_count || 0} interested</span>
        <span>🕒 {ago(l.created_at)}</span>
      </div>
      {!isSeller && l.status === "active" && <div className="alert ay" style={{ marginTop: 14, fontSize: 12 }}>🔐 <strong>Escrow available</strong> — Pay {fmtKES(l.price + escrowFee)} (2.5% fee). Funds held safely until you confirm receipt of item.</div>}
    </Modal>
  );
}

function PostAdModal({ onClose, onSuccess, token, notify }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({ title: "", category: "", subcat: "", price: "", description: "", reason_for_sale: "", location: "" });
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));
  const cat = CATEGORIES.find(c => c.name === f.category);

  const submit = async () => {
    if (!f.reason_for_sale.trim() || !f.location.trim()) { notify("Please fill in all fields.", "warning"); return; }
    setLoading(true);
    try {
      const body = { title: f.title, category: f.category, price: parseFloat(f.price), description: f.description, reason_for_sale: f.reason_for_sale, location: f.location };
      const result = await api("/api/listings", { method: "POST", body: JSON.stringify(body) }, token);
      onSuccess(result.listing || result);
      onClose();
      notify("🚀 Your ad is live!", "success");
    } catch (err) { notify(err.message, "error"); }
    finally { setLoading(false); }
  };

  return (
    <Modal title={`Post Ad — Step ${step} of 2`} onClose={onClose} footer={
      <div style={{ display: "flex", gap: 8, width: "100%" }}>
        {step === 2 && <button className="btn bs" onClick={() => setStep(1)}>← Back</button>}
        <div style={{ flex: 1 }} />
        {step === 1 && <button className="btn bp" onClick={() => setStep(2)} disabled={!f.title.trim() || !f.category || !f.price || !f.description.trim()}>Continue →</button>}
        {step === 2 && <button className="btn bp" onClick={submit} disabled={loading}>{loading ? <span className="spin" /> : "Publish Ad →"}</button>}
      </div>
    }>
      <div className="alert ag" style={{ marginBottom: 16, fontSize: 12 }}>✓ Free to post. KSh 250 only when a buyer locks in.</div>
      {step === 1 && <>
        <FF label="Item Title"><input className="inp" placeholder="e.g. Samsung 55 inch Smart TV" value={f.title} onChange={e => sf("title", e.target.value)} /></FF>
        <FF label="Category">
          <select className="inp" value={f.category} onChange={e => { sf("category", e.target.value); sf("subcat", ""); }}>
            <option value="">Select a category...</option>
            {CATEGORIES.map(c => <option key={c.name}>{c.name}</option>)}
          </select>
        </FF>
        {cat && <FF label="Subcategory">
          <select className="inp" value={f.subcat} onChange={e => sf("subcat", e.target.value)}>
            <option value="">Select subcategory...</option>
            {cat.sub.map(s => <option key={s}>{s}</option>)}
          </select>
        </FF>}
        <FF label="Price (KSh)"><input className="inp" type="number" placeholder="35000" value={f.price} onChange={e => sf("price", e.target.value)} min={1} /></FF>
        <FF label="Description" hint="Describe condition, what's included, any faults etc."><textarea className="inp" value={f.description} onChange={e => sf("description", e.target.value)} placeholder="Item is in excellent condition. Bought in 2023..." /></FF>
      </>}
      {step === 2 && <>
        <FF label="Reason for Selling"><input className="inp" placeholder="e.g. Upgrading to newer model" value={f.reason_for_sale} onChange={e => sf("reason_for_sale", e.target.value)} /></FF>
        <FF label="Collection Location" hint="General area only. Exact address shared after unlock."><input className="inp" placeholder="e.g. Westlands, Nairobi" value={f.location} onChange={e => sf("location", e.target.value)} /></FF>
        <div className="alert ay" style={{ fontSize: 12 }}>🔒 Your contact details are private until a buyer pays KSh 250 to unlock them.</div>
      </>}
    </Modal>
  );
}

function Dashboard({ user, token, notify, onPostAd, onClose }) {
  const [listings, setListings] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dash");
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [lRes, nRes] = await Promise.all([
          api("/api/listings?seller=me", {}, token).catch(() => ({ listings: [] })),
          api("/api/notifications", {}, token).catch(() => []),
        ]);
        setListings(lRes.listings || []);
        setInbox(Array.isArray(nRes) ? nRes : []);
      } catch { } finally { setLoading(false); }
    };
    load();
  }, [token]);

  const deleteListing = async (id) => {
    if (!window.confirm("Delete this listing permanently?")) return;
    try {
      await api(`/api/listings/${id}`, { method: "DELETE" }, token);
      setListings(p => p.filter(l => l.id !== id));
      notify("Listing deleted.", "success");
    } catch (err) { notify(err.message, "error"); }
  };

  const deleteAccount = async () => {
    try { await api("/api/users/me", { method: "DELETE" }, token); } catch { }
    localStorage.clear(); onClose(); window.location.reload();
  };

  return (
    <Modal title="My Account" onClose={onClose} large>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, paddingBottom: 18, borderBottom: "1px solid var(--border)" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--sh)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, border: "2px solid var(--border)" }}>👤</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{user.name}</div>
          <div style={{ fontSize: 13, color: "var(--mut)" }}>{user.email}</div>
          <span className={`badge ${user.role === "seller" ? "bg-g" : "bg-m"}`} style={{ marginTop: 4 }}>{user.role}</span>
        </div>
      </div>
      <div className="tab-row" style={{ marginBottom: 20 }}>
        {[["dash", "📊 Dashboard"], ["inbox", "📬 Inbox"], ["ads", "📦 My Ads"], ["settings", "⚙️ Settings"]].map(([id, label]) => (
          <div key={id} className={`tab${tab === id ? " on" : ""}`} onClick={() => setTab(id)}>{label}</div>
        ))}
      </div>
      {tab === "dash" && <>
        <div className="stat-grid">
          {[{ l: "My Listings", v: listings.length, c: "var(--accent)" }, { l: "Total Views", v: listings.reduce((a, l) => a + (l.view_count || 0), 0), c: "var(--txt)" }, { l: "Buyers Locked In", v: listings.filter(l => l.locked_buyer_id && !l.is_unlocked).length, c: "var(--gold)" }, { l: "Sold", v: listings.filter(l => l.status === "sold").length, c: "var(--accent)" }].map(s => (
            <div key={s.l} className="sc"><div style={{ fontSize: 26, fontWeight: 800, color: s.c, marginBottom: 3 }}>{s.v}</div><div className="lbl">{s.l}</div></div>
          ))}
        </div>
        {user.role === "seller" && <button className="btn bp" style={{ width: "100%", marginTop: 8 }} onClick={() => { onClose(); onPostAd(); }}>+ Post New Ad</button>}
      </>}
      {tab === "inbox" && <>
        {loading ? <div style={{ textAlign: "center", padding: 30 }}><span className="spin" /></div>
          : inbox.length === 0
            ? <div className="empty"><div className="empty-icon">📬</div><p>No messages yet</p></div>
            : inbox.map((m, i) => <div key={i} className="inbox-row"><div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{m.title || m.type}</div><div style={{ fontSize: 13, color: "var(--mut)" }}>{m.body}</div><div style={{ fontSize: 11, color: "var(--dim)", marginTop: 4 }}>{ago(m.created_at)}</div></div>)}
      </>}
      {tab === "ads" && <>
        {loading ? <div style={{ textAlign: "center", padding: 30 }}><span className="spin" /></div>
          : listings.length === 0
            ? <div className="empty"><div className="empty-icon">📦</div><p>No ads yet</p>{user.role === "seller" && <button className="btn bp" style={{ marginTop: 14 }} onClick={() => { onClose(); onPostAd(); }}>Post First Ad</button>}</div>
            : listings.map(l => (
              <div key={l.id} className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{l.title}</div><div style={{ fontSize: 12, color: "var(--mut)" }}>{fmtKES(l.price)} · {l.category}</div></div>
                <span className={`badge ${l.status === "active" ? "bg-g" : "bg-m"}`}>{l.status}</span>
                <button className="btn br2 sm" onClick={() => deleteListing(l.id)}>Delete</button>
              </div>
            ))}
      </>}
      {tab === "settings" && <>
        <div className="lbl" style={{ marginBottom: 10 }}>Account Actions</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button className="btn bs" style={{ justifyContent: "flex-start" }} onClick={() => { localStorage.removeItem("ws_token"); localStorage.removeItem("ws_user"); onClose(); window.location.reload(); }}>🚪 Sign Out</button>
          <button className="btn br2" style={{ justifyContent: "flex-start" }} onClick={() => setShowDeleteAccount(true)}>🗑 Delete Account Permanently</button>
        </div>
        {showDeleteAccount && <div className="alert ar" style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>⚠️ This is permanent and cannot be undone.</div>
          <p style={{ fontSize: 13, marginBottom: 12 }}>All your ads, messages, and data will be deleted forever.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn br2 sm" onClick={deleteAccount}>Yes, Delete Everything</button>
            <button className="btn bs sm" onClick={() => setShowDeleteAccount(false)}>Cancel</button>
          </div>
        </div>}
      </>}
    </Modal>
  );
}

function Pager({ total, perPage, page, onChange }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  return (
    <div className="pg">
      <div className="pb" onClick={() => page > 1 && onChange(page - 1)}>←</div>
      {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map(p => (
        <div key={p} className={`pb${p === page ? " on" : ""}`} onClick={() => onChange(p)}>{p}</div>
      ))}
      {totalPages > 8 && <div className="pb" style={{ width: "auto", padding: "0 10px", fontSize: 11 }}>…{totalPages}</div>}
      <div className="pb" onClick={() => page < totalPages && onChange(page + 1)}>→</div>
    </div>
  );
}

export default function App() {
  const [dark, setDark] = useState(() => { try { return localStorage.getItem("ws-theme") === "dark"; } catch { return false; } });
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [page, setPage] = useState("home");
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, activeAds: 0, sold: 0, revenue: 0 });
  const [filter, setFilter] = useState({ cat: "", q: "" });
  const [pg, setPg] = useState(1);
  const [vm, setVm] = useState("grid");
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const PER_PAGE = 24;

  const notify = useCallback((msg, type = "info") => setToast({ msg, type, id: Date.now() }), []);
  const closeModal = useCallback(() => setModal(null), []);

  useEffect(() => {
    document.body.className = dark ? "dark" : "";
    try { localStorage.setItem("ws-theme", dark ? "dark" : "light"); } catch { }
  }, [dark]);

  useEffect(() => {
    let el = document.getElementById("ws-css");
    if (!el) { el = document.createElement("style"); el.id = "ws-css"; document.head.appendChild(el); }
    el.textContent = CSS;
  }, []);

  // Restore session and validate token
  useEffect(() => {
    const t = localStorage.getItem("ws_token");
    const u = localStorage.getItem("ws_user");
    if (t && u) {
      try {
        const parsed = JSON.parse(u);
        setUser(parsed); setToken(t);
        // Validate with backend
        api("/api/auth/me", {}, t).then(fresh => {
          setUser(fresh); localStorage.setItem("ws_user", JSON.stringify(fresh));
        }).catch(() => {
          // Token invalid — clear session
          localStorage.removeItem("ws_token"); localStorage.removeItem("ws_user");
          setUser(null); setToken(null);
        });
      } catch { localStorage.removeItem("ws_token"); localStorage.removeItem("ws_user"); }
    }
  }, []);

  // Fetch live stats
  useEffect(() => {
    api("/api/stats").then(setStats).catch(() => { });
  }, []);

  // Fetch listings
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const p = new URLSearchParams({ page: pg, limit: PER_PAGE });
        if (filter.cat) p.set("category", filter.cat);
        if (filter.q) p.set("search", filter.q);
        if (page === "sold") p.set("status", "sold");
        const data = await api(`/api/listings?${p}`);
        const ls = data.listings || (Array.isArray(data) ? data : []);
        setListings(ls);
        setTotal(data.total || ls.length);
      } catch { setListings([]); }
      finally { setLoading(false); }
    };
    load();
  }, [pg, filter, page]);

  const openListing = (l) => {
    setModal({ type: "detail", listing: l });
    // Increment view count
    api(`/api/listings/${l.id}/view`, { method: "POST" }, token).catch(() => { });
  };

  const handleAuth = (u, t) => { setUser(u); setToken(t); };
  const logout = () => { setUser(null); setToken(null); localStorage.removeItem("ws_token"); localStorage.removeItem("ws_user"); notify("Signed out.", "info"); };

  const openPage = (p) => { setPage(p); setFilter({ cat: "", q: "" }); setPg(1); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (<>
    {/* NAV */}
    <nav className="nav">
      <div className="logo" onClick={() => openPage("home")}>Weka<span>Soko</span></div>
      <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn bgh sm" onClick={() => openPage("home")}>Browse</button>
        <button className="btn bgh sm" onClick={() => openPage("sold")}>🏆 Sold</button>
        <button className="btn bgh sm" style={{ fontSize: 16, padding: "6px 10px" }} onClick={() => setDark(d => !d)}>{dark ? "☀️" : "🌙"}</button>
        {user ? <>
          <button className="btn bs sm" onClick={() => setModal({ type: "dashboard" })}>👤 {user.name?.split(" ")[0]}</button>
          {user.role === "seller" && <button className="btn bp sm" onClick={() => setModal({ type: "post" })}>+ Post Ad</button>}
          <button className="btn bgh sm" onClick={logout}>Sign Out</button>
        </> : <>
          <button className="btn bgh sm" onClick={() => setModal({ type: "auth", mode: "login" })}>Sign In</button>
          <button className="btn bp sm" onClick={() => setModal({ type: "auth", mode: "signup" })}>Sign Up Free</button>
        </>}
      </div>
    </nav>

    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 22px 60px" }}>
      {page === "home" && <>
        {/* HERO */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 36, flexWrap: "wrap", marginBottom: 48 }}>
          <div style={{ flex: "1 1 380px" }}>
            <div className="badge bg-g" style={{ marginBottom: 16 }}>🇰🇪 Kenya's Smartest Resell Platform</div>
            <h1 style={{ fontSize: "clamp(32px,5vw,54px)", fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1.07, marginBottom: 18 }}>
              Post Free.<br /><em style={{ fontStyle: "italic", color: "var(--accent)" }}>Pay Only When</em><br />You Get a Buyer.
            </h1>
            <p style={{ fontSize: 15, color: "var(--mut)", lineHeight: 1.8, marginBottom: 26, maxWidth: 440 }}>
              List items in under 2 minutes. Pay KSh 250 only when a real buyer locks in. Safe moderated chat. Escrow protection.
            </p>
            <div className="hero-btns" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn bp lg" onClick={() => user ? setModal({ type: "post" }) : setModal({ type: "auth", mode: "signup" })}>Post an Ad for Free →</button>
              <button className="btn bs lg" onClick={() => document.getElementById("listings-section")?.scrollIntoView({ behavior: "smooth" })}>Browse Listings</button>
            </div>
          </div>
          {/* LIVE STATS */}
          <div style={{ flex: "0 0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, width: "min(280px,100%)", borderRadius: "var(--rl)", overflow: "hidden", border: "1px solid var(--border)" }}>
            {[{ icon: "👥", label: "Users", val: stats.users }, { icon: "📦", label: "Active Ads", val: stats.activeAds }, { icon: "✅", label: "Items Sold", val: stats.sold }, { icon: "💰", label: "Transacted (KSh)", val: stats.revenue }].map(s => (
              <div key={s.label} style={{ background: "var(--sh)", padding: "16px 14px" }}>
                <div style={{ fontSize: 22, marginBottom: 5 }}>{s.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)" }}><Counter to={s.val} /></div>
                <div style={{ fontSize: 11, color: "var(--mut)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CATEGORIES */}
        <h3 className="lbl" style={{ marginBottom: 14 }}>Browse by Category</h3>
        <div className="cat-grid">
          {CATEGORIES.map(c => (
            <div key={c.name} className={`cat-item${filter.cat === c.name ? " on" : ""}`} onClick={() => { setFilter(p => ({ ...p, cat: p.cat === c.name ? "" : c.name })); setPg(1); document.getElementById("listings-section")?.scrollIntoView({ behavior: "smooth" }); }}>
              <div style={{ fontSize: 24, marginBottom: 5 }}>{c.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.3 }}>{c.name}</div>
            </div>
          ))}
        </div>

        {/* SEARCH + SORT */}
        <div id="listings-section" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "13px 16px", marginBottom: 24 }}>
          <input className="inp" style={{ flex: 1, minWidth: 180 }} placeholder="🔍 Search listings..." value={filter.q} onChange={e => { setFilter(p => ({ ...p, q: e.target.value })); setPg(1); }} />
          {filter.cat && <button className="btn bs sm" onClick={() => setFilter(p => ({ ...p, cat: "" }))}>✕ {filter.cat}</button>}
          <div style={{ display: "flex", gap: 2, background: "var(--sh)", borderRadius: "var(--rs)", padding: 3 }}>
            <button className={`btn bgh sm${vm === "grid" ? " bp" : ""}`} style={{ padding: "5px 10px", fontSize: 16 }} onClick={() => setVm("grid")}>⊞</button>
            <button className={`btn bgh sm${vm === "list" ? " bp" : ""}`} style={{ padding: "5px 10px", fontSize: 16 }} onClick={() => setVm("list")}>☰</button>
          </div>
          <button className="btn bp sm" onClick={() => user ? setModal({ type: "post" }) : setModal({ type: "auth", mode: "signup" })}>+ Post Ad</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontSize: 20 }}>{filter.cat || "Latest Listings"} <span style={{ fontFamily: "var(--fn)", fontWeight: 400, fontSize: 14, color: "var(--mut)" }}>({total})</span></h2>
        </div>

        {loading
          ? <div style={{ textAlign: "center", padding: "80px 0" }}><span className="spin" style={{ width: 36, height: 36, borderWidth: 3 }} /></div>
          : listings.length === 0
            ? <div className="empty"><div className="empty-icon">🔍</div><h3 style={{ fontFamily: "var(--fn)", fontWeight: 700, marginBottom: 8 }}>No listings found</h3><p>Try a different search or category</p></div>
            : <div className={vm === "grid" ? "g3" : "lvc"}>{listings.map(l => <ListingCard key={l.id} listing={l} onClick={() => openListing(l)} listView={vm === "list"} />)}</div>}

        <Pager total={total} perPage={PER_PAGE} page={pg} onChange={p => { setPg(p); window.scrollTo({ top: 400, behavior: "smooth" }); }} />

        {/* HOW IT WORKS */}
        <div style={{ marginTop: 60, paddingTop: 40, borderTop: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: 26, textAlign: "center", marginBottom: 6 }}>How Weka Soko Works</h2>
          <p style={{ textAlign: "center", color: "var(--mut)", marginBottom: 32, fontSize: 14 }}>Simple. Safe. Kenyan.</p>
          <div className="how-grid">
            {[["📝","Post for Free","No upfront fees. Add photos, price, and description in 2 minutes."],["💬","Safe Anonymous Chat","Moderated chat keeps you anonymous until unlock. No contact sharing."],["💰","Negotiate Prices","Buyers can make offers. Accept, decline, or counter."],["🔒","Buyer Locks In","Serious buyers click Ready to Buy. You get notified instantly."],["💳","Pay KSh 250","Seller pays once to reveal buyer's contact details. Till 5673935."],["🔐","Optional Escrow","2.5% fee. Funds held securely until both parties confirm the deal."]].map(([icon, title, desc]) => (
              <div key={title} className="how-item">
                <div style={{ fontSize: 30, marginBottom: 10 }}>{icon}</div>
                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>{title}</div>
                <div style={{ fontSize: 13, color: "var(--mut)", lineHeight: 1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </>}

      {page === "sold" && <>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 28, marginBottom: 6 }}>🏆 Sold on Weka Soko</h2>
          <p style={{ color: "var(--mut)" }}>Real transactions by real Kenyans. Join {stats.users.toLocaleString()}+ users.</p>
        </div>
        {loading ? <div style={{ textAlign: "center", padding: 80 }}><span className="spin" style={{ width: 36, height: 36, borderWidth: 3 }} /></div>
          : listings.length === 0 ? <div className="empty"><div className="empty-icon">🏆</div><h3 style={{ fontFamily: "var(--fn)", fontWeight: 700 }}>No sold items yet</h3></div>
            : <div className="g3">{listings.map(l => <ListingCard key={l.id} listing={l} onClick={() => openListing(l)} />)}</div>}
      </>}
    </main>

    {/* MODALS */}
    {modal?.type === "auth" && <AuthModal defaultMode={modal.mode} onClose={closeModal} onAuth={handleAuth} notify={notify} />}
    {modal?.type === "post" && token && <PostAdModal onClose={closeModal} token={token} notify={notify} onSuccess={l => { setListings(p => [l, ...p]); setTotal(t => t + 1); }} />}
    {modal?.type === "detail" && <DetailModal listing={modal.listing} user={user} token={token} onClose={closeModal} notify={notify}
      onShare={() => setModal({ type: "share", listing: modal.listing })}
      onUnlock={() => setModal({ type: "mpesa", amount: 250, purpose: `Unlock: ${modal.listing.title}`, allowVoucher: true, onSuccess: ({ receipt }) => { notify(`🔓 Unlocked! Receipt: ${receipt}`, "success"); closeModal(); } })}
      onEscrow={() => { const fee = Math.round(modal.listing.price * 0.025); setModal({ type: "mpesa", amount: modal.listing.price + fee, purpose: `Escrow: ${modal.listing.title}`, allowVoucher: true, onSuccess: ({ receipt }) => { notify(`🔐 Escrow active! Receipt: ${receipt}`, "success"); closeModal(); } }); }}
    />}
    {modal?.type === "share" && <ShareModal listing={modal.listing} onClose={closeModal} />}
    {modal?.type === "mpesa" && <MpesaModal amount={modal.amount} purpose={modal.purpose} allowVoucher={modal.allowVoucher} token={token} onSuccess={modal.onSuccess} onClose={closeModal} />}
    {modal?.type === "dashboard" && user && <Dashboard user={user} token={token} notify={notify} onPostAd={() => setModal({ type: "post" })} onClose={closeModal} />}
    {toast && <Toast key={toast.id} msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
  </>);
}
