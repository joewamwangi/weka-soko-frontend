import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const API = (process.env.REACT_APP_API_URL || "https://weka-soko-backend-production.up.railway.app").replace(/\/$/, "");

// ── WEKA SOKO LOGO COMPONENT ──────────────────────────────────────────────────
function WekaSokoLogo({ size = 32, iconOnly = false, light = false }) {
  const iconH = size;
  const iconW = size * (44/52);
  const textSize = size * 0.72;
  const subSize = size * 0.28;
  const gap = size * 0.32;
  const totalH = iconH;
  const totalW = iconOnly ? iconW : iconW + gap + (textSize * (iconOnly ? 0 : 4.6));
  const blue = light ? "#FFFFFF" : "#111111";
  const textColor = light ? "#FFFFFF" : "#111111";
  if (iconOnly) {
    return (
      <svg width={iconW} height={iconH} viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg" style={{display:"block",flexShrink:0}}>
        <rect x="0" y="17" width="44" height="35" rx="3" fill="#111111"/>
        <rect x="0" y="28" width="44" height="5" fill="#333333"/>
        <path d="M10 17 Q10 3 22 3 Q34 3 34 17" fill="none" stroke={blue} strokeWidth="3.5" strokeLinecap="round"/>
        <circle cx="22" cy="42" r="5" fill="white" opacity="0.9"/>
        <circle cx="22" cy="42" r="2.5" fill="#111111"/>
      </svg>
    );
  }
  return (
    <svg width={iconW + gap + 82} height={iconH} viewBox={`0 0 ${Math.round(iconW + gap + 82)} ${iconH}`} fill="none" xmlns="http://www.w3.org/2000/svg" style={{display:"block"}}>
      {/* Bag body */}
      <rect x="0" y={Math.round(iconH*0.33)} width={Math.round(iconW)} height={Math.round(iconH*0.67)} rx="3" fill="#111111"/>
      {/* Bag shadow strip */}
      <rect x="0" y={Math.round(iconH*0.53)} width={Math.round(iconW)} height={Math.round(iconH*0.1)} fill="#333333"/>
      {/* Bag handle */}
      <path d={`M${Math.round(iconW*0.23)} ${Math.round(iconH*0.33)} Q${Math.round(iconW*0.23)} ${Math.round(iconH*0.06)} ${Math.round(iconW*0.5)} ${Math.round(iconH*0.06)} Q${Math.round(iconW*0.77)} ${Math.round(iconH*0.06)} ${Math.round(iconW*0.77)} ${Math.round(iconH*0.33)}`} fill="none" stroke={blue} strokeWidth={Math.round(size*0.08)} strokeLinecap="round"/>
      {/* Lock dot */}
      <circle cx={Math.round(iconW*0.5)} cy={Math.round(iconH*0.81)} r={Math.round(iconH*0.096)} fill="white" opacity="0.9"/>
      <circle cx={Math.round(iconW*0.5)} cy={Math.round(iconH*0.81)} r={Math.round(iconH*0.048)} fill="#111111"/>
      {/* Wordmark */}
      <text x={Math.round(iconW + gap)} y={Math.round(iconH*0.73)} fontFamily="var(--fn,-apple-system,'Segoe UI',Arial,sans-serif)" fontSize={Math.round(textSize)} fontWeight="700" fill={textColor} letterSpacing="-0.02em">Weka<tspan fill="#111111">Soko</tspan></text>
    </svg>
  );
}

const PER_PAGE = 24;

// ── CATEGORIES ────────────────────────────────────────────────────────────────
const CATS = [
  {name:"Electronics",icon:"📱",sub:["Phones & Tablets","Laptops","TVs & Audio","Cameras","Gaming","Accessories"]},
  {name:"Vehicles",icon:"🚗",sub:["Cars","Motorcycles","Trucks","Buses","Boats","Vehicle Parts"]},
  {name:"Property",icon:"🏠",sub:["Houses for Sale","Land","Commercial","Short Stays"]},
  {name:"Fashion",icon:"👗",sub:["Men's Clothing","Women's Clothing","Shoes","Bags","Watches","Jewellery"]},
  {name:"Furniture",icon:"🛋️",sub:["Sofas","Beds & Mattresses","Tables","Wardrobes","Office"]},
  {name:"Home & Garden",icon:"🏡",sub:["Kitchen Appliances","Home Décor","Garden","Cleaning","Lighting"]},
  {name:"Sports",icon:"⚽",sub:["Fitness","Bicycles","Outdoor Gear","Team Sports","Water Sports"]},
  {name:"Baby & Kids",icon:"🍼",sub:["Baby Gear","Toys","Kids Clothing","Kids Furniture","School"]},
  {name:"Books",icon:"📚",sub:["Textbooks","Fiction","Non-Fiction","Courses","Instruments"]},
  {name:"Agriculture",icon:"🌾",sub:["Livestock","Farm Equipment","Seeds","Produce","Irrigation"]},
  {name:"Services",icon:"🔧",sub:["Home Services","Business","Tech","Transport","Events"]},
  {name:"Jobs",icon:"💼",sub:["Full-time","Part-time","Freelance","Internship"]},
  {name:"Food",icon:"🍽️",sub:["Catering Equipment","Food Products","Restaurant Supplies"]},
  {name:"Health & Beauty",icon:"💊",sub:["Health","Beauty & Skincare","Gym","Medical"]},
  {name:"Pets",icon:"🐾",sub:["Dogs","Cats","Birds","Fish","Pet Supplies"]},
  {name:"Other",icon:"📦",sub:["Miscellaneous"]},
];

const TERMS = `WEKA SOKO — TERMS & CONDITIONS  (February 2026)

1. ACCEPTANCE
By using Weka Soko you agree to these Terms.

2. PLATFORM ROLE
Weka Soko is a classified advertising platform only. We are NOT party to any transaction. ALL transactions are solely between buyer and seller. Weka Soko shall NOT be liable for item quality, fraud, loss, or damage. Users transact at their own risk.

3. ESCROW SERVICE
Escrow is a convenience feature. Weka Soko is not a licensed financial institution. The 7.5% platform fee is non-refundable once payment is accepted. Dispute decisions by Weka Soko are final.

4. FEES
Contact unlock fee: KSh 250 (non-refundable). Escrow fee: 7.5% of item price. All payments to Till Number 5673935.

5. PROHIBITED CONTENT
No stolen goods, counterfeit items, illegal drugs, weapons, or adult content. Violators will be permanently banned.

6. CONTENT POLICY
No contact info in chat before unlock. Photos must not contain nudity or contact details.

7. ACCOUNT RESPONSIBILITY
You are responsible for all activity on your account.

8. GOVERNING LAW
These Terms are governed by the laws of Kenya. Contact: support@wekasoko.co.ke`;

// ── HELPERS ───────────────────────────────────────────────────────────────────
const fmtKES = n => "KSh " + Number(n||0).toLocaleString("en-KE");
const ago = ts => { if(!ts)return""; const d=Date.now()-new Date(ts).getTime(); if(d<60000)return"just now"; if(d<3600000)return Math.floor(d/60000)+"m ago"; if(d<86400000)return Math.floor(d/3600000)+"h ago"; if(d<604800000)return Math.floor(d/86400000)+"d ago"; return new Date(ts).toLocaleDateString("en-KE",{day:"numeric",month:"short"}); };
// Time remaining until a future date
const timeLeft = ts => { if(!ts)return""; const d=new Date(ts).getTime()-Date.now(); if(d<=0)return"Expired"; if(d<3600000)return Math.floor(d/60000)+"m left"; if(d<86400000)return Math.floor(d/3600000)+"h left"; if(d<604800000)return Math.floor(d/86400000)+"d left"; const weeks=Math.floor(d/604800000); return weeks+(weeks===1?" week left":" weeks left"); };
const lastSeen = ts => { if(!ts)return""; const d=Date.now()-new Date(ts).getTime(); if(d<30000)return"online"; if(d<60000)return"last seen just now"; if(d<3600000)return"last seen "+Math.floor(d/60000)+"m ago"; if(d<86400000)return"last seen "+Math.floor(d/3600000)+"h ago"; if(d<172800000)return"last seen yesterday"; return"last seen "+new Date(ts).toLocaleDateString("en-KE",{day:"numeric",month:"short"}); };

async function api(path, opts={}, token=null) {
  const isForm = opts.body instanceof FormData;
  const headers = {...(token?{Authorization:`Bearer ${token}`}:{}), ...(!isForm?{"Content-Type":"application/json"}:{}), ...(opts.headers||{})};
  const res = await fetch(`${API}${path}`, {...opts, headers});
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.error||data.message||"Request failed");
  return data;
}

// Convert VAPID base64 key to Uint8Array for PushManager.subscribe
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#FFFFFF;--surf:#FFFFFF;--sh:#F6F6F6;--border:#E6E6E6;
  --a:#1428A0;--a2:#0F1F8A;--gold:#8B6400;--red:#C03030;--blue:#1428A0;
  --txt:#1D1D1D;--mut:#636363;--dim:#ADADAD;
  --r:12px;--rs:8px;
  --fn:'Plus Jakarta Sans','Helvetica Neue',Helvetica,Arial,sans-serif;
  --fs:'Plus Jakarta Sans','Helvetica Neue',Helvetica,Arial,sans-serif;
  --nav-h:66px;
}
body{background:var(--bg);color:var(--txt);font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;line-height:1.55;min-height:100vh;overflow-x:hidden;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-thumb{background:#CCCCCC;}::-webkit-scrollbar-thumb:hover{background:#AAAAAA;}
/* BUTTONS */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:11px 26px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:background .15s,color .15s,border-color .15s;white-space:nowrap;font-family:var(--fn);letter-spacing:.04em;text-transform:none;}
.btn:disabled{opacity:.4;cursor:not-allowed;}
.bp{background:#1428A0;color:#fff;border:2px solid #1428A0;}.bp:hover:not(:disabled){background:#0F1F8A;border-color:#0F1F8A;}
.bs{background:transparent;color:var(--txt);border:1.5px solid var(--txt);}.bs:hover:not(:disabled){background:var(--txt);color:#fff;}
.bg2{background:var(--a);color:#fff;}.bg2:hover:not(:disabled){background:var(--a2);}
.bgh{background:transparent;color:var(--mut);border:none;padding:8px 14px;font-size:13px;letter-spacing:.02em;}.bgh:hover:not(:disabled){color:var(--txt);}
.br2{background:transparent;color:var(--red);border:1px solid var(--red);}.br2:hover:not(:disabled){background:var(--red);color:#fff;}
.sm{padding:8px 18px;font-size:12px;letter-spacing:.04em;}.lg{padding:14px 36px;font-size:15px;letter-spacing:.04em;}
/* INPUTS */
.inp{width:100%;padding:11px 16px;background:#fff;border:1px solid #D9D9D9;border-radius:8px;color:var(--txt);font-family:var(--fn);font-size:14px;outline:none;transition:border-color .15s;letter-spacing:.01em;}
.inp:focus{border-color:#1428A0;outline:none;}
.inp::placeholder{color:#AEAEB2;}
textarea.inp{resize:vertical;min-height:90px;}
select.inp{appearance:none;cursor:pointer;}
/* LABELS */
.lbl{display:block;font-size:11px;font-weight:700;color:#636363;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;}
/* BADGES */
.badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.04em;}
.bg-g{background:#F0F0F0;color:var(--a);}
.bg-y{background:rgba(176,127,16,.1);color:#8B6400;}
.bg-r{background:rgba(192,48,48,.1);color:var(--red);}
.bg-b{background:#F0F0F0;color:var(--a);}
.bg-m{background:var(--sh);color:var(--mut);}
/* MODALS */
.ov{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(8px);}
.mod{background:#fff;border:1px solid #E0E0E0;border-radius:16px;width:100%;max-width:540px;max-height:94vh;overflow-y:auto;animation:su .18s ease;box-shadow:0 8px 40px rgba(0,0,0,.14);}
.mod.lg{max-width:720px;}
.mod.xl{max-width:900px;}
@keyframes su{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.mh{padding:20px 28px 16px;border-bottom:1px solid #E6E6E6;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:#fff;z-index:2;border-radius:16px 16px 0 0;}
.mb{padding:22px 28px;}
.mf{padding:14px 28px 22px;border-top:1px solid #E6E6E6;display:flex;gap:8px;justify-content:flex-end;}
/* NAV */
.nav{position:sticky;top:0;z-index:100;background:#fff;border-bottom:1px solid #E6E6E6;padding:0 48px;height:var(--nav-h);display:flex;align-items:center;justify-content:space-between;}
.logo{cursor:pointer;display:flex;align-items:center;line-height:1;user-select:none;}
.logo span{color:var(--a);}
/* ALERTS */
.alert{padding:12px 16px;border-radius:8px;font-size:13px;line-height:1.6;}
.ag{background:#F8F8F8;border-left:3px solid #1428A0;border-top:none;border-right:none;border-bottom:none;padding-left:14px;color:#1428A0;}
.ay{background:rgba(139,100,0,.04);border-left:3px solid #8B6400;border-top:none;border-right:none;border-bottom:none;padding-left:14px;color:#8B6400;}
.ar{background:rgba(192,48,48,.04);border-left:3px solid #C03030;border-top:none;border-right:none;border-bottom:none;padding-left:14px;color:#C03030;}
/* CARDS */
.card{background:var(--surf);border:1px solid var(--border);border-radius:12px;}
.lcard{background:#fff;border:1px solid #EBEBEB;border-radius:12px;overflow:hidden;transition:border-color .2s,box-shadow .2s;cursor:pointer;}
.lcard:hover{border-color:#1428A0;box-shadow:0 4px 20px rgba(0,0,0,.08);}.lcard:hover .lthumb img{transform:scale(1.03);}
.lcard-list{display:flex;flex-direction:row;}
.lcard-list .lthumb{width:200px;min-width:200px;height:160px;aspect-ratio:unset;}
.lthumb{width:100%;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;background:var(--sh);position:relative;overflow:hidden;}
.lthumb img{width:100%;height:100%;object-fit:cover;transition:transform .4s ease;}
/* GRID */
.g3{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px;}
.lvc{display:flex;flex-direction:column;gap:16px;}
/* SPINNER */
.spin{display:inline-block;width:20px;height:20px;border:2px solid #E5E5E5;border-top-color:var(--a);border-radius:50%;animation:sp .7s linear infinite;}
@keyframes sp{to{transform:rotate(360deg)}}
.empty{text-align:center;padding:80px 20px;color:var(--mut);}
/* PAGINATION */
.pg{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:40px;flex-wrap:wrap;}
.pb{min-width:38px;height:38px;padding:0 10px;display:flex;align-items:center;justify-content:center;border-radius:8px;border:1px solid #E0E0E0;background:#fff;color:#636363;cursor:pointer;font-size:13px;font-weight:700;transition:all .14s;letter-spacing:.02em;}
.pb.on{background:#1428A0;color:#fff;border-color:#1428A0;}
/* TOAST */
.toast{position:fixed;bottom:24px;right:24px;z-index:2000;background:#fff;border:1px solid #E6E6E6;border-radius:12px;padding:14px 18px;font-size:14px;font-family:var(--fn);box-shadow:0 4px 24px rgba(0,0,0,.12);animation:ti .18s ease;display:flex;align-items:center;gap:10px;max-width:360px;border-left:3px solid #1428A0;}
@keyframes ti{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
/* SOLD BADGE */
.sold-badge{position:absolute;top:10px;right:10px;background:rgba(0,0,0,.7);color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;}
/* IMAGE UPLOAD */
.img-upload{border:2px dashed #C7C7CC;border-radius:12px;padding:28px;text-align:center;cursor:pointer;transition:all .15s;background:#FAFAFA;}
.img-upload:hover{border-color:var(--a);background:rgba(20,40,160,.02);}
.img-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px;}
.img-thumb{aspect-ratio:1;border-radius:8px;overflow:hidden;position:relative;background:var(--sh);}
.img-thumb img{width:100%;height:100%;object-fit:cover;}
.img-del{position:absolute;top:4px;right:4px;background:rgba(0,0,0,.6);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;}
/* CHAT */
.chat-wrap{display:flex;flex-direction:column;height:480px;}
.chat-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#F4F4F4;border-radius:8px 8px 0 0;}
.chat-msg{max-width:72%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.55;font-family:var(--fn);}
.chat-msg.me{align-self:flex-end;background:#1428A0;color:#fff;border-radius:16px 16px 4px 16px;}
.chat-msg.them{align-self:flex-start;background:#fff;border:1px solid #E6E6E6;border-radius:16px 16px 16px 4px;}
.chat-msg.blocked{opacity:.5;font-style:italic;}
.chat-input{display:flex;gap:8px;padding:12px;border-top:1px solid var(--border);background:#fff;border-radius:0 0 8px 8px;}
/* TABS */
.tab-row{display:flex;gap:0;background:transparent;border-bottom:1px solid #E5E5E5;padding:0;overflow-x:auto;margin-bottom:24px;}
.tab{padding:14px 22px;border-radius:8px 8px 0 0;font-size:13px;font-weight:700;letter-spacing:.04em;cursor:pointer;transition:color .15s,border-color .15s;color:#9E9E9E;white-space:nowrap;border-bottom:2px solid transparent;margin-bottom:-1px;}
.tab.on{color:#1428A0;border-bottom-color:#1428A0;}
/* NOTIF DOT */
.notif-dot{position:absolute;top:-3px;right:-3px;width:8px;height:8px;background:#FF3B30;border-radius:50%;border:2px solid #fff;}
/* STAT CARD */
.stat-card{background:#F4F4F4;border:none;border-radius:12px;padding:20px;}
/* PROGRESS */
.progress{height:4px;background:#E5E5E5;border-radius:4px;overflow:hidden;margin-top:8px;}
.progress-bar{height:100%;background:var(--a);border-radius:2px;transition:width .6s ease;}
/* TIMELINE */
.timeline-item{display:flex;gap:14px;padding:16px 0;border-bottom:1px solid #F0F0F0;}
.timeline-dot{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;margin-top:2px;}
/* PWA */
.pwa-banner{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #E5E5E5;padding:16px 24px;display:flex;align-items:center;gap:16px;z-index:500;box-shadow:0 -4px 20px rgba(0,0,0,.08);}
/* RESPONSIVE */

/* ── TABLET 768-1024px ───────────────────────────────────────────────── */
@media(max-width:1024px){
  .nav{padding:0 20px;}
  .g3{grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;}
}

/* ── MOBILE <768px ───────────────────────────────────────────────────── */
@media(max-width:768px){
  /* Nav */
  .nav{padding:0 16px;height:54px;}

  /* Modals slide up from bottom on mobile */
  .ov{align-items:flex-end;padding:0;}
  .mod{max-width:100%;border-radius:20px 20px 0 0;align-self:flex-end;max-height:96vh;width:100%;}
  .mod.lg,.mod.xl{max-width:100%;}
  .mh{border-radius:20px 20px 0 0;}
  .mh,.mb,.mf{padding-left:18px;padding-right:18px;}

  /* Cards */
  .lcard-list{flex-direction:column;}
  .lcard-list .lthumb{width:100%;height:auto;aspect-ratio:16/9;min-width:unset;}
  .g3{grid-template-columns:1fr 1fr;gap:10px;}
  .lvc{gap:10px;}

  /* Inputs/forms */
  .img-grid{grid-template-columns:repeat(3,1fr);}
  .inp{font-size:16px;}

  /* Tabs */
  .tab{padding:10px 12px;font-size:12px;letter-spacing:.02em;}
  .tab-row{margin-bottom:16px;}

  /* Pagination */
  .pb{min-width:36px;height:36px;font-size:13px;}
  .pg{gap:4px;margin-top:24px;padding-bottom:20px;}

  /* Chat */
  .chat-wrap{height:380px;}
  .chat-msg{max-width:85%;}

  /* Buttons */
  .btn{padding:10px 18px;font-size:13px;}
  .btn.lg{padding:12px 22px;font-size:14px;}
  .btn.sm{padding:7px 12px;font-size:12px;}

  /* Dashboard */
  .stat-card{padding:14px;}

  /* Toast */
  .toast{bottom:16px;right:16px;left:16px;max-width:unset;}

  /* PWA banner */
  .pwa-banner{padding:12px 16px;}
}

/* ── SMALL MOBILE <480px ─────────────────────────────────────────────── */
@media(max-width:480px){
  .g3{grid-template-columns:1fr 1fr;gap:8px;}
  .lcard-list{flex-direction:column;}
  .pg{gap:3px;}
  .tab{padding:9px 10px;font-size:11px;}
  .chat-wrap{height:340px;}
}
/* ── MOBILE UX IMPROVEMENTS ─────────────────────────────────────────── */
*{-webkit-tap-highlight-color:transparent;}
input,select,textarea{font-size:16px!important;}
.nav{-webkit-overflow-scrolling:touch;}
.tab-row{-webkit-overflow-scrolling:touch;scrollbar-width:none;}
.tab-row::-webkit-scrollbar{display:none;}
.chat-msgs{-webkit-overflow-scrolling:touch;}
img{max-width:100%;height:auto;}
button{touch-action:manipulation;}

/* ── MOBILE LAYOUT ────────────────────────────────────────────────────── */
.mob-root{display:flex;flex-direction:column;min-height:100vh;background:#F5F5F5;padding-bottom:66px;}
.mob-topbar{position:sticky;top:0;z-index:100;background:#fff;border-bottom:1px solid #EBEBEB;padding:0 16px;height:56px;display:flex;align-items:center;justify-content:space-between;gap:10px;}
.mob-logo{font-size:18px;font-weight:800;color:#1428A0;letter-spacing:-.02em;cursor:pointer;flex-shrink:0;}
.mob-search{flex:1;display:flex;align-items:center;background:#F5F5F5;border-radius:10px;padding:0 12px;height:38px;gap:8px;border:1.5px solid #E8E8E8;}
.mob-search input{flex:1;border:none;background:transparent;font-size:15px;font-family:var(--fn);color:#1A1A1A;outline:none;}
.mob-search input::placeholder{color:#AAAAAA;}
.mob-notif{position:relative;width:38px;height:38px;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;}
.mob-section{background:#fff;margin:8px 12px;border-radius:14px;overflow:hidden;border:1px solid #EBEBEB;}
.mob-section-title{font-size:15px;font-weight:700;color:#1A1A1A;padding:14px 16px 0;letter-spacing:-.01em;}
.mob-cats{display:grid;grid-template-columns:repeat(4,1fr);gap:0;padding:10px 8px 8px;}
.mob-cat{display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 4px;cursor:pointer;border-radius:10px;transition:background .15s;}
.mob-cat.active{background:#EEF2FF;}
.mob-cat img{width:52px;height:52px;border-radius:50%;object-fit:cover;border:2px solid #E5E5E5;box-shadow:0 2px 6px rgba(0,0,0,.1);}
.mob-cat.active img{border-color:#1428A0;}
.mob-cat span{font-size:11px;font-weight:600;color:#333;text-align:center;line-height:1.2;}
.mob-cat.active span{color:#1428A0;}
.mob-cards{display:flex;flex-direction:column;gap:0;}
.mob-lcard{background:#fff;display:flex;gap:12px;padding:14px 16px;border-bottom:1px solid #F0F0F0;cursor:pointer;transition:background .15s;}
.mob-lcard:active{background:#F9F9F9;}
.mob-lcard-img{width:90px;height:80px;border-radius:10px;object-fit:cover;flex-shrink:0;background:#F0F0F0;overflow:hidden;}
.mob-lcard-img img{width:100%;height:100%;object-fit:cover;}
.mob-lcard-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;}
.mob-lcard-cat{font-size:11px;font-weight:600;color:#AAAAAA;text-transform:uppercase;letter-spacing:.06em;}
.mob-lcard-title{font-size:14px;font-weight:700;color:#1A1A1A;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mob-lcard-price{font-size:16px;font-weight:800;color:#1428A0;}
.mob-lcard-meta{font-size:11px;color:#AAAAAA;display:flex;gap:10px;margin-top:2px;}
.mob-bottombar{position:fixed;bottom:0;left:0;right:0;z-index:200;background:#fff;border-top:1px solid #EBEBEB;display:flex;height:62px;box-shadow:0 -2px 12px rgba(0,0,0,.08);}
.mob-tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;border:none;background:transparent;transition:color .15s;font-family:var(--fn);}
.mob-tab svg{width:22px;height:22px;}
.mob-tab span{font-size:10px;font-weight:600;letter-spacing:.02em;}
.mob-tab.on{color:#1428A0;}
.mob-tab.off{color:#AAAAAA;}
.mob-tab.post-btn{background:#1428A0;border-radius:50%;width:52px;height:52px;margin-top:-14px;align-self:center;color:#fff;box-shadow:0 4px 14px rgba(20,40,160,.4);}
.mob-tab.post-btn span{display:none;}
.mob-drawer{position:fixed;inset:0;z-index:300;display:flex;flex-direction:column;justify-content:flex-end;}
.mob-drawer-bg{position:absolute;inset:0;background:rgba(0,0,0,.5);}
.mob-drawer-panel{position:relative;background:#fff;border-radius:20px 20px 0 0;max-height:85vh;overflow-y:auto;padding:24px 20px 40px;}
.mob-filter-row{display:flex;flex-direction:column;gap:8px;margin-bottom:16px;}
.mob-filter-label{font-size:12px;font-weight:700;color:#AAAAAA;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;}
.mob-hero-banner{background:linear-gradient(135deg,#1428A0 0%,#0F1F8A 100%);margin:8px 12px;border-radius:14px;padding:20px 18px;}
.mob-trust{display:flex;gap:16px;justify-content:center;padding:12px 16px;background:#fff;border-top:1px solid #EBEBEB;flex-wrap:wrap;}
.mob-trust span{font-size:12px;font-weight:600;color:#555;display:flex;align-items:center;gap:5px;}

`;

// ── COMPONENTS ────────────────────────────────────────────────────────────────
function Spin({s}){return <span className="spin" style={s?{width:s,height:s}:{}}/>;}

function Toast({msg,type,onClose}){
  useEffect(()=>{const t=setTimeout(onClose,5000);return()=>clearTimeout(t);},[]);
  const c={success:"#111111",error:"#444444",warning:"#B07F10",info:"#2563EB"}[type]||"#111111";
  return <div className="toast" style={{borderLeft:`3px solid ${c}`}}><span style={{fontSize:20}}>{({success:"✅",error:"❌",warning:"⚠️",info:"ℹ️"})[type]||"ℹ️"}</span><span>{msg}</span><button className="btn bgh sm" style={{marginLeft:"auto",padding:"2px 6px"}} onClick={onClose}>✕</button></div>;
}

function Modal({title,onClose,children,footer,large,xl}){
  return <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div className={`mod${large?" lg":""}${xl?" xl":""}`}>
      <div className="mh"><h3 style={{fontSize:17,fontWeight:700}}>{title}</h3><button className="btn bgh sm" style={{borderRadius:"50%",width:32,height:32,padding:0}} onClick={onClose}>✕</button></div>
      <div className="mb">{children}</div>
      {footer&&<div className="mf">{footer}</div>}
    </div>
  </div>;
}

function FF({label,hint,children,required}){
  return <div style={{marginBottom:15}}>
    {label&&<label className="lbl">{label}{required&&<span style={{color:"#AAAAAA",marginLeft:3}}>*</span>}</label>}
    {children}
    {hint&&<p style={{fontSize:11,color:"#CCCCCC",marginTop:4}}>{hint}</p>}
  </div>;
}

function Counter({to}){
  const [n,setN]=useState(0);const r=useRef(null);
  useEffect(()=>{
    const ob=new IntersectionObserver(([e])=>{
      if(!e.isIntersecting)return;
      let v=0;const step=Math.max(1,to/70);
      const iv=setInterval(()=>{v+=step;if(v>=to){setN(to);clearInterval(iv);}else setN(Math.floor(v));},16);
      ob.disconnect();
    });
    if(r.current)ob.observe(r.current);
    return()=>ob.disconnect();
  },[to]);
  return <span ref={r}>{n.toLocaleString()}</span>;
}

// ── IMAGE UPLOADER ────────────────────────────────────────────────────────────
function ImageUploader({images,setImages}){
  const ref=useRef(null);
  const add=files=>{
    const n=Array.from(files).slice(0,8-images.length).map(f=>({file:f,preview:URL.createObjectURL(f)}));
    setImages(p=>[...p,...n].slice(0,8));
  };
  const remove=i=>setImages(p=>{URL.revokeObjectURL(p[i].preview);return p.filter((_,j)=>j!==i);});
  return <>
    <div className="img-upload" onClick={()=>ref.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();add(e.dataTransfer.files);}}>
      <div style={{fontSize:36,marginBottom:8}}>📷</div>
      <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>Tap to add photos</div>
      <div style={{fontSize:12,color:"#888888"}}>Or drag & drop · up to 8 photos · First = cover</div>
      <input ref={ref} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>add(e.target.files)}/>
    </div>
    {images.length>0&&<div className="img-grid">{images.map((img,i)=>(
      <div key={i} className="img-thumb">
        <img src={img.preview} alt=""/>
        {i===0&&<div style={{position:"absolute",bottom:4,left:4,background:"#111111",color:"#fff",fontSize:9,padding:"2px 7px",borderRadius:6,fontWeight:600}}>COVER</div>}
        <button className="img-del" onClick={e=>{e.stopPropagation();remove(i);}}>✕</button>
      </div>
    ))}</div>}
  </>;
}

// ── TERMS MODAL ───────────────────────────────────────────────────────────────
function TermsModal({onClose,onAccept}){
  const [ok,setOk]=useState(false);const r=useRef(null);
  return <Modal title="📄 Terms & Conditions" onClose={onClose} footer={
    <><button className="btn bs" onClick={onClose}>Decline</button><button className="btn bp" onClick={onAccept} disabled={!ok}>{ok?"I Accept →":"↓ Scroll to Accept"}</button></>
  }>
    {!ok&&<div className="alert ay" style={{marginBottom:14}}>Scroll to the bottom to enable the Accept button.</div>}
    <div ref={r} onScroll={()=>{const el=r.current;if(el&&el.scrollTop+el.clientHeight>=el.scrollHeight-30)setOk(true);}} style={{maxHeight:380,overflowY:"auto",background:"#F5F5F5",borderRadius:6,padding:"16px 18px",fontSize:13,lineHeight:1.9,color:"#888888",whiteSpace:"pre-wrap"}}>{TERMS}</div>
  </Modal>;
}

// ── PASSWORD FIELD with show/hide toggle ────────────────────────────────────
function PasswordField({label,hint,value,onChange,onEnter,placeholder="••••••••"}){
  const [show,setShow]=useState(false);
  return <FF label={label||"Password"} hint={hint}>
    <div style={{position:"relative",display:"flex",alignItems:"center"}}>
      <input className="inp" style={{flex:1,paddingRight:44}}
        type={show?"text":"password"}
        placeholder={placeholder}
        value={value}
        onChange={e=>onChange(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&onEnter&&onEnter()}
        autoComplete="current-password"
      />
      <button type="button" onClick={()=>setShow(s=>!s)}
        style={{position:"absolute",right:10,background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#888888",padding:"4px",lineHeight:1}}>
        {show?"🙈":"👁"}
      </button>
    </div>
  </FF>;
}

// ── FORGOT PASSWORD PANEL ────────────────────────────────────────────────────
function ForgotPasswordPanel({onBack,notify}){
  const [email,setEmail]=useState("");
  const [sent,setSent]=useState(false);
  const [loading,setLoading]=useState(false);
  const send=async()=>{
    if(!email.trim()){notify("Enter your email address","warning");return;}
    setLoading(true);
    try{
      await api("/api/auth/forgot-password",{method:"POST",body:JSON.stringify({email:email.trim()})});
      setSent(true);
    }catch(err){notify(err.message,"error");}
    finally{setLoading(false);}
  };
  if(sent)return <div style={{textAlign:"center",padding:"20px 0"}}>
    <div style={{fontSize:48,marginBottom:12}}>📬</div>
    <div style={{fontWeight:700,fontSize:16,marginBottom:8}}>Check your email</div>
    <div style={{fontSize:13,color:"#888888",lineHeight:1.7,marginBottom:16}}>
      We sent a reset link to <strong>{email}</strong>.<br/>Check your inbox (and spam folder).
    </div>
    <button className="btn bs" onClick={onBack}>← Back to Sign In</button>
  </div>;
  return <div style={{padding:"8px 0"}}>
    <div style={{fontSize:14,color:"#888888",marginBottom:16,lineHeight:1.6}}>
      Enter the email on your account. We'll send you a link to reset your password.
    </div>
    <FF label="Email Address" required>
      <input className="inp" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}/>
    </FF>
    <div style={{display:"flex",gap:8,marginTop:4}}>
      <button className="btn bs" onClick={onBack}>← Back</button>
      <button className="btn bp" style={{flex:1}} onClick={send} disabled={loading}>{loading?<Spin/>:"Send Reset Link →"}</button>
    </div>
  </div>;
}

// ── RESET PASSWORD MODAL ──────────────────────────────────────────────────────
function ResetPasswordModal({token,onClose,notify}){
  const [password,setPassword]=useState("");
  const [done,setDone]=useState(false);
  const [loading,setLoading]=useState(false);
  const submit=async()=>{
    if(password.length<8){notify("Password must be at least 8 characters","warning");return;}
    setLoading(true);
    try{
      await api("/api/auth/reset-password",{method:"POST",body:JSON.stringify({token,password})});
      setDone(true);
    }catch(err){notify(err.message,"error");}
    finally{setLoading(false);}
  };
  return <Modal title="🔐 Set New Password" onClose={onClose}>
    {done?<div style={{textAlign:"center",padding:"20px 0"}}>
      <div style={{fontSize:48,marginBottom:12}}>✅</div>
      <div style={{fontWeight:700,marginBottom:8}}>Password updated!</div>
      <div style={{color:"#888888",marginBottom:20}}>You can now sign in with your new password.</div>
      <button className="btn bp" onClick={onClose}>Sign In →</button>
    </div>:<>
      <div style={{color:"#888888",fontSize:13,marginBottom:16}}>Choose a new password for your account.</div>
      <PasswordField label="New Password" hint="At least 8 characters" value={password} onChange={setPassword} onEnter={submit}/>
      <button className="btn bp" style={{width:"100%",marginTop:8}} onClick={submit} disabled={loading}>{loading?<Spin/>:"Set New Password →"}</button>
    </>}
  </Modal>;
}

// ── IMAGE LIGHTBOX ────────────────────────────────────────────────────────────
// ── WATERMARKED IMAGE ─────────────────────────────────────────────────────────
// Renders an image on a <canvas> with a tiled diagonal WekaSoko watermark.
// The watermark is baked into the canvas pixel data — right-click save includes it.
function WatermarkedImage({src,alt,style={},onClick}){
  const canvasRef=useRef(null);
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{
    if(!src){setLoaded(false);return;}
    setLoaded(false);
    const img=new Image();
    img.crossOrigin="anonymous";
    img.onload=()=>{
      const canvas=canvasRef.current;
      if(!canvas)return;
      const w=img.naturalWidth, h=img.naturalHeight;
      canvas.width=w; canvas.height=h;
      const ctx=canvas.getContext("2d");
      ctx.drawImage(img,0,0);
      // Single centred diagonal watermark
      const fontSize=Math.max(18,Math.min(w,h)*0.07);
      ctx.save();
      ctx.translate(w/2,h/2);
      ctx.rotate(-Math.PI/6);
      ctx.font=`700 ${fontSize}px var(--fn),Helvetica,Arial,sans-serif`;
      ctx.textAlign="center";
      ctx.textBaseline="middle";
      ctx.shadowColor="rgba(0,0,0,0.30)";
      ctx.shadowBlur=4;
      ctx.fillStyle="rgba(255,255,255,0.22)";
      ctx.fillText("WekaSoko",0,0);
      ctx.restore();
      setLoaded(true);
    };
    img.onerror=()=>setLoaded(false);
    img.src=src;
  },[src]);

  return <>
    <canvas ref={canvasRef} onClick={onClick}
      style={{...style,display:loaded?"block":"none",cursor:onClick?"zoom-in":"default"}}/>
    {!loaded&&<img src={src} alt={alt||""}
      style={{...style,cursor:onClick?"zoom-in":"default"}} onClick={onClick}/>}
  </>;
}

// ── LIGHTBOX ──────────────────────────────────────────────────────────────────
function Lightbox({photos,startIdx,onClose}){
  const [idx,setIdx]=useState(startIdx||0);
  const prev=()=>setIdx(i=>(i-1+photos.length)%photos.length);
  const next=()=>setIdx(i=>(i+1)%photos.length);
  useEffect(()=>{
    const h=e=>{if(e.key==="ArrowLeft")prev();if(e.key==="ArrowRight")next();if(e.key==="Escape")onClose();};
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[]);
  return <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.96)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}
    onClick={onClose}>
    <button onClick={onClose} style={{position:"absolute",top:16,right:20,background:"rgba(255,255,255,.15)",border:"none",color:"#fff",fontSize:28,width:44,height:44,borderRadius:"50%",cursor:"pointer",zIndex:10}}>✕</button>
    <div style={{position:"absolute",top:20,left:"50%",transform:"translateX(-50%)",color:"rgba(255,255,255,.7)",fontSize:13,zIndex:10}}>{idx+1} / {photos.length}</div>
    <div onClick={e=>e.stopPropagation()} style={{display:"flex",alignItems:"center",justifyContent:"center",maxWidth:"92vw",maxHeight:"82vh"}}>
      <WatermarkedImage src={photos[idx]} alt=""
        style={{maxWidth:"92vw",maxHeight:"82vh",objectFit:"contain",borderRadius:8,boxShadow:"0 8px 40px rgba(0,0,0,.6)",display:"block"}}/>
    </div>
    {photos.length>1&&<>
      <button onClick={e=>{e.stopPropagation();prev();}} style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,.15)",border:"none",color:"#fff",fontSize:28,width:50,height:50,borderRadius:"50%",cursor:"pointer",zIndex:10}}>‹</button>
      <button onClick={e=>{e.stopPropagation();next();}} style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,.15)",border:"none",color:"#fff",fontSize:28,width:50,height:50,borderRadius:"50%",cursor:"pointer",zIndex:10}}>›</button>
    </>}
    {photos.length>1&&<div style={{position:"absolute",bottom:20,display:"flex",gap:8,overflowX:"auto",maxWidth:"90vw",padding:"0 8px",zIndex:10}}>
      {photos.map((p,i)=><img key={i} src={p} alt="" onClick={e=>{e.stopPropagation();setIdx(i);}}
        style={{width:56,height:44,objectFit:"cover",borderRadius:8,cursor:"pointer",opacity:i===idx?1:.45,border:i===idx?"2px solid #fff":"2px solid transparent",flexShrink:0,transition:"opacity .2s"}}/>)}
    </div>}
  </div>;
}

// ── AUTH MODAL ────────────────────────────────────────────────────────────────
function AuthModal({defaultMode,onClose,onAuth,notify}){
  const [mode,setMode]=useState(defaultMode||"login");
  const [loading,setLoading]=useState(false);
  const [showTerms,setShowTerms]=useState(false);
  const [agreed,setAgreed]=useState(false);
  const [f,setF]=useState({name:"",email:"",password:"",role:"buyer",phone:""});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const [verifyEmail,setVerifyEmail]=useState(null); // set when verification required
  const [resendLoading,setResendLoading]=useState(false);
  const [resendSent,setResendSent]=useState(false);
  const [unverifiedEmail,setUnverifiedEmail]=useState(null); // for login block

  const resendVerification=async(email)=>{
    setResendLoading(true);
    try{
      // Register a temp token then resend — use resend endpoint
      await api("/api/auth/resend-verification-by-email",{method:"POST",body:JSON.stringify({email})});
      setResendSent(true);
      notify("Verification email resent! Check your inbox.","success");
    }catch(e){notify(e.message,"error");}
    finally{setResendLoading(false);}
  };

  const submit=async()=>{
    if(!f.email||!f.password){notify("Please fill in all fields.","warning");return;}
    if(mode==="signup"){
      if(!f.name.trim()){notify("Please enter your name.","warning");return;}
      if(f.password.length<8){notify("Password must be at least 8 characters.","warning");return;}
      const pwStrong=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(f.password);
      if(!pwStrong){notify("Password must include uppercase, lowercase, and a number.","warning");return;}
      if(!agreed){notify("Please accept the Terms & Conditions.","warning");return;}
    }
    setLoading(true);
    try{
      const data=mode==="login"
        ?await api("/api/auth/login",{method:"POST",body:JSON.stringify({email:f.email.trim(),password:f.password})})
        :await api("/api/auth/register",{method:"POST",body:JSON.stringify({name:f.name.trim(),email:f.email.trim(),password:f.password,role:f.role,phone:f.phone||undefined})});

      if(data.requiresVerification){
        // Signup: show "check your email" screen
        setVerifyEmail(data.email||f.email.trim());
        return;
      }
      localStorage.setItem("ws_token",data.token);
      localStorage.setItem("ws_user",JSON.stringify(data.user));
      onAuth(data.user,data.token);onClose();
      notify(`Welcome${data.user.name?", "+data.user.name.split(" ")[0]:""}! 🎉`,"success");
    }catch(err){
      // Login blocked because email not verified
      if(err.message?.includes("verify your email")||err.message?.includes("requiresVerification")){
        setUnverifiedEmail(f.email.trim());
      } else {
        notify(err.message,"error");
      }
    }
    finally{setLoading(false);}
  };

  if(showTerms)return <TermsModal onClose={()=>setShowTerms(false)} onAccept={()=>{setAgreed(true);setShowTerms(false);notify("Terms accepted ✓","success");}}/>;

  // ── Signup success: verify email screen ──────────────────────────────────
  if(verifyEmail)return <Modal title="Check Your Email 📬" onClose={onClose}>
    <div style={{textAlign:"center",padding:"12px 0 20px"}}>
      <div style={{fontSize:64,marginBottom:16}}>📧</div>
      <h3 style={{fontWeight:700,fontSize:18,marginBottom:10}}>Almost there!</h3>
      <p style={{fontSize:14,color:"#888888",lineHeight:1.8,marginBottom:20}}>
        We sent a verification link to<br/>
        <strong style={{color:"var(--txt)"}}>{verifyEmail}</strong><br/><br/>
        Click the link in that email to activate your account. It expires in 24 hours.
      </p>
      <div style={{background:"#F8F8F8",border:"1px solid #E8E8E8",borderRadius:12,padding:"12px 16px",fontSize:12,color:"#111111",marginBottom:20,textAlign:"left"}}>
        <strong>Can't find the email?</strong> Check your spam or junk folder.<br/>
        Make sure you signed up with <strong>{verifyEmail}</strong>.
      </div>
      {!resendSent
        ?<button className="btn bs" style={{marginBottom:10}} onClick={()=>resendVerification(verifyEmail)} disabled={resendLoading}>
            {resendLoading?<Spin/>:"Resend verification email"}
          </button>
        :<p style={{fontSize:13,color:"#111111",fontWeight:600}}>✓ Email resent! Check your inbox.</p>}
      <button className="btn bgh" style={{display:"block",margin:"8px auto 0"}} onClick={onClose}>Close</button>
    </div>
  </Modal>;

  // ── Login blocked: unverified email ──────────────────────────────────────
  if(unverifiedEmail)return <Modal title="Verify Your Email First" onClose={onClose}>
    <div style={{textAlign:"center",padding:"12px 0 20px"}}>
      <div style={{fontSize:64,marginBottom:16}}>🔒</div>
      <h3 style={{fontWeight:700,fontSize:17,marginBottom:10}}>Email not verified</h3>
      <p style={{fontSize:14,color:"#888888",lineHeight:1.8,marginBottom:20}}>
        Your account was created but your email address hasn't been verified yet.<br/><br/>
        Check <strong style={{color:"var(--txt)"}}>{unverifiedEmail}</strong> for the verification link we sent when you signed up.
      </p>
      {!resendSent
        ?<button className="btn bp" style={{marginBottom:12}} onClick={()=>resendVerification(unverifiedEmail)} disabled={resendLoading}>
            {resendLoading?<Spin/>:"Resend verification email"}
          </button>
        :<div style={{marginBottom:12,padding:"10px 14px",background:"#F8F8F8",border:"1px solid #E8E8E8",borderRadius:12,fontSize:13,color:"#111111"}}>
            ✅ Email sent! Click the link in your inbox to activate your account.
          </div>}
      <button className="btn bgh" style={{display:"block",margin:"0 auto"}} onClick={()=>setUnverifiedEmail(null)}>← Back to Sign In</button>
    </div>
  </Modal>;

  return <Modal title={mode==="login"?"Sign In":"Create Account"} onClose={onClose} footer={
    <><button className="btn bs" onClick={onClose}>Cancel</button><button className="btn bp" onClick={submit} disabled={loading}>{loading?<Spin/>:mode==="login"?"Sign In →":"Create Account →"}</button></>
  }>
    <div style={{textAlign:"center",marginBottom:20,paddingBottom:16,borderBottom:"1px solid #E8E8E8"}}><div style={{display:"inline-flex"}}><WekaSokoLogo size={28}/></div></div>
    {/* Google OAuth placeholder */}
    <button className="btn bs" style={{width:"100%",marginBottom:16,gap:10}} onClick={()=>window.location.href=`${API}/api/auth/google`}>
      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8.1 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.9 1.1 8.1 3l5.7-5.7C34.5 6.5 29.5 4 24 4c-7.8 0-14.5 4.4-17.7 10.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10.1-2 13.7-5.2l-6.3-5.3C29.5 35.5 26.9 36.5 24 36.5c-5.2 0-9.6-3.5-11.2-8.2l-6.5 5C9.4 39.5 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6.1 0 .1 0 0 0l6.3 5.3C37.5 38.7 44 34 44 24c0-1.3-.1-2.7-.4-3.9z"/></svg>
      Continue with Google
    </button>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
      <div style={{flex:1,height:1,background:"#E8E8E8"}}/>
      <span style={{fontSize:12,color:"#CCCCCC"}}>or with email</span>
      <div style={{flex:1,height:1,background:"#E8E8E8"}}/>
    </div>
    {mode==="signup"&&<>
      <FF label="Full Name" required><input className="inp" placeholder="Your full name" value={f.name} onChange={e=>sf("name",e.target.value)}/></FF>
      <FF label="I am a">
        <div style={{display:"flex",gap:8}}>
          {["buyer","seller"].map(r=><button key={r} className={`btn ${f.role===r?"bp":"bs"}`} style={{flex:1}} onClick={()=>sf("role",r)}>{r==="buyer"?"🛍 Buyer":"🏷 Seller"}</button>)}
        </div>
      </FF>
      <FF label="Phone (M-Pesa)" hint="Used for payment notifications"><input className="inp" placeholder="07XXXXXXXX" value={f.phone} onChange={e=>sf("phone",e.target.value)}/></FF>
    </>}
    <FF label="Email" required><input className="inp" type="email" placeholder="you@example.com" value={f.email} onChange={e=>sf("email",e.target.value)}/></FF>
    <PasswordField
      label={mode==="signup"?"Password":"Password"}
      hint=""
      value={f.password}
      onChange={v=>sf("password",v)}
      onEnter={submit}
    />
    {mode==="signup"&&f.password.length>0&&(()=>{
      const s={
        hasLen:f.password.length>=8,
        hasUpper:/[A-Z]/.test(f.password),
        hasLower:/[a-z]/.test(f.password),
        hasNum:/\d/.test(f.password),
        hasSpecial:/[^A-Za-z0-9]/.test(f.password),
      };
      const score=Object.values(s).filter(Boolean).length;
      const color=score<=2?"#AAAAAA":score===3?"#888888":score===4?"#555555":"#111111";
      const label=score<=2?"Weak":score===3?"Fair":score===4?"Good":"Strong";
      return <div style={{marginTop:-10,marginBottom:12}}>
        <div style={{display:"flex",gap:4,marginBottom:6}}>
          {[1,2,3,4,5].map(i=><div key={i} style={{flex:1,height:3,borderRadius:8,background:i<=score?color:"#E8E8E8",transition:"background .2s"}}/>)}
        </div>
        <div style={{fontSize:11,color,fontWeight:600}}>{label} password</div>
        <div style={{fontSize:11,color:"#CCCCCC",marginTop:3}}>
          {!s.hasLen&&"8+ chars · "}{!s.hasUpper&&"Uppercase · "}{!s.hasLower&&"Lowercase · "}{!s.hasNum&&"Number · "}{!s.hasSpecial&&"Symbol (optional)"}
        </div>
      </div>;
    })()}
    {mode==="login"&&<div style={{textAlign:"right",marginTop:-8,marginBottom:8}}>
      <button className="btn bgh" style={{display:"inline",padding:"0 3px",color:"#111111",fontSize:12}} onClick={()=>setMode("forgot")}>Forgot password?</button>
    </div>}
    {mode==="forgot"&&<ForgotPasswordPanel onBack={()=>setMode("login")} notify={notify}/>}
    {mode==="signup"&&<div style={{background:"#F5F5F5",borderRadius:6,padding:"12px 14px"}}>
      <label style={{display:"flex",alignItems:"flex-start",gap:9,cursor:"pointer",fontSize:13,color:"#888888"}}>
        <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} style={{marginTop:3,width:15,height:15}}/>
        <span>I have read and accept the <button className="btn bgh" style={{display:"inline",padding:"0 2px",color:"#1428A0",fontWeight:700,fontSize:13}} onClick={()=>setShowTerms(true)}>Terms & Conditions</button></span>
      </label>
    </div>}
    <p style={{textAlign:"center",marginTop:14,fontSize:13,color:"#888888"}}>
      {mode==="login"?"No account? ":"Already have one? "}
      <button className="btn bgh" style={{display:"inline",padding:"0 3px",color:"#1428A0",fontWeight:700,fontSize:13}} onClick={()=>setMode(m=>m==="login"?"signup":"login")}>{mode==="login"?"Sign up free →":"Sign in"}</button>
    </p>
  </Modal>;
}

// ── SHARE MODAL ───────────────────────────────────────────────────────────────
function ShareModal({listing,onClose}){
  const url=`${window.location.origin}?listing=${listing.id}`;
  const txt=`"${listing.title}" — ${fmtKES(listing.price)} on Weka Soko`;
  const [copied,setCopied]=useState(false);
  const share=[
    {icon:"💬",label:"WhatsApp",href:`https://wa.me/?text=${encodeURIComponent(txt+"\n"+url)}`},
    {icon:"📘",label:"Facebook",href:`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`},
    {icon:"🐦",label:"Twitter/X",href:`https://twitter.com/intent/tweet?text=${encodeURIComponent(txt)}&url=${encodeURIComponent(url)}`},
    {icon:"✈️",label:"Telegram",href:`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(txt)}`},
  ];
  return <Modal title="Share Listing" onClose={onClose}>
    <div style={{background:"#F5F5F5",borderRadius:6,padding:14,marginBottom:18,display:"flex",gap:12,alignItems:"center"}}>
      <span style={{fontSize:28}}>🔗</span>
      <div><div style={{fontWeight:600}}>{listing.title}</div><div style={{fontSize:12,color:"#888888"}}>{fmtKES(listing.price)}</div></div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
      {share.map(s=><button key={s.label} className="btn bs" style={{flexDirection:"column",gap:6,padding:"14px 8px",height:72}} onClick={()=>window.open(s.href,"_blank","noopener,noreferrer")}>
        <span style={{fontSize:22}}>{s.icon}</span><span style={{fontSize:12}}>{s.label}</span>
      </button>)}
    </div>
    <div style={{display:"flex",gap:8}}>
      <input className="inp" value={url} readOnly style={{flex:1,fontSize:12}}/>
      <button className="btn bp sm" onClick={()=>{navigator.clipboard?.writeText(url);setCopied(true);setTimeout(()=>setCopied(false),2500);}}>{copied?"✓ Copied":"Copy"}</button>
    </div>
  </Modal>;
}

// ── REAL M-PESA PAYMENT MODAL ─────────────────────────────────────────────────
function PayModal({type,listingId,amount,purpose,token,user,onSuccess,onClose,notify,allowVoucher}){
  const [phone,setPhone]=useState(user?.phone||"07");
  const [vcode,setVcode]=useState("");
  const [voucherInfo,setVoucherInfo]=useState(null);
  const [step,setStep]=useState("form");
  const [errMsg,setErrMsg]=useState("");
  const [cd,setCd]=useState(90);
  const [manualCode,setManualCode]=useState("");
  const [verifying,setVerifying]=useState(false);
  const pollRef=useRef(null);
  const discount=voucherInfo?.discount||voucherInfo?.discount_percent||0;
  const finalAmt=Math.max(0,Math.round(amount*(1-discount/100)));
  const saving=amount-finalAmt;

  const applyVoucher=async()=>{
    if(!vcode.trim()){notify("Enter a voucher code.","warning");return;}
    try{
      const v=await api(`/api/vouchers/${vcode.trim().toUpperCase()}`,{},token);
      setVoucherInfo(v);
      const pct=v.discount||v.discount_percent||0;
      const saved=Math.round(amount*pct/100);
      notify(`Voucher applied — ${pct}% off! You save ${fmtKES(saved)}`,"success");
    }catch{notify("Invalid or expired voucher code.","error");setVoucherInfo(null);}
  };

  const startPayment=async()=>{
    if(finalAmt>0&&(!phone||phone.length<10)){notify("Enter a valid M-Pesa phone number.","warning");return;}
    setStep("pushing");
    try{
      const endpoint=type==="unlock"?"/api/payments/unlock":"/api/payments/escrow";
      const body={listing_id:listingId,phone:phone.trim()};
      if(voucherInfo)body.voucher_code=vcode.trim().toUpperCase();
      const result=await api(endpoint,{method:"POST",body:JSON.stringify(body)},token);
      if(result.unlocked){setStep("done");setTimeout(()=>onSuccess(result),600);return;}
      setStep("polling");
      let c=90;setCd(90);
      pollRef.current=setInterval(async()=>{
        c--;setCd(c);
        if(c<=0){clearInterval(pollRef.current);setStep("timeout");return;}
        try{
          const s=await api(`/api/payments/status/${result.checkoutRequestId}`,{},token);
          if(s.status==="confirmed"){clearInterval(pollRef.current);setStep("done");setTimeout(()=>onSuccess(s),800);}
          else if(s.status==="failed"){clearInterval(pollRef.current);setStep("error");setErrMsg(s.resultDesc||"Payment failed. Try again.");}
        }catch{}
      },2000);
    }catch(err){setStep("error");setErrMsg(err.message);}
  };

  const verifyManual=async()=>{
    const code=manualCode.trim().toUpperCase();
    if(!code||code.length<8){notify("Enter a valid M-Pesa transaction code.","warning");return;}
    setVerifying(true);
    try{
      const result=await api("/api/payments/verify-manual",{method:"POST",body:JSON.stringify({mpesa_code:code,listing_id:listingId,type})},token);
      setStep("done");setTimeout(()=>onSuccess(result),600);
    }catch(err){notify(err.message,"error");}
    finally{setVerifying(false);}
  };

  useEffect(()=>()=>{if(pollRef.current)clearInterval(pollRef.current);},[]);

  const ManualInput=()=><div style={{marginTop:14,borderTop:"1px solid #E8E8E8",paddingTop:14}}>
    <div className="lbl" style={{marginBottom:8}}>Paid directly? Enter M-Pesa Transaction Code</div>
    <div style={{display:"flex",gap:8}}>
      <input className="inp" placeholder="e.g. RJK2X4ABCD" value={manualCode} onChange={e=>setManualCode(e.target.value.toUpperCase())} style={{flex:1,fontFamily:"monospace",letterSpacing:".05em"}} maxLength={12}/>
      <button className="btn bg2 sm" onClick={verifyManual} disabled={verifying||manualCode.length<8}>{verifying?<Spin/>:"Verify"}</button>
    </div>
    <p style={{fontSize:11,color:"#CCCCCC",marginTop:5}}>We confirm the code was paid to Till 5673935 before unlocking.</p>
  </div>;

  return <Modal title={type==="unlock"?"🔓 Unlock Buyer Contact":"🔐 Escrow Payment"} onClose={onClose}>
    {step==="form"&&<>
      {/* Seller safety tip — shown only on unlock */}
      {type==="unlock"&&<div style={{background:"#F8F8F8",border:"1px solid #E8E8E8",borderRadius:12,padding:"11px 14px",marginBottom:16,fontSize:12,color:"#111111",lineHeight:1.7}}>
        <strong>🛡️ Seller tip:</strong> Once you unlock, you'll see the buyer's contact details. <strong>Do not hand over the item until payment is confirmed.</strong> Use Escrow for full protection — funds are held by Weka Soko until the buyer receives and confirms the item.
      </div>}
      <div style={{background:"#F8F8F8",border:"1px solid #E8E8E8",borderRadius:12,padding:"18px 20px",marginBottom:18}}>
        <div style={{fontSize:11,color:"#888888",marginBottom:4}}>Till Number <strong style={{color:"var(--txt)"}}>5673935</strong> · Weka Soko</div>
        <div style={{display:"flex",alignItems:"baseline",gap:12,flexWrap:"wrap"}}>
          <div style={{fontSize:36,fontWeight:700,color:"#111111"}}>{fmtKES(finalAmt)}</div>
          {discount>0&&<div style={{fontSize:16,color:"#CCCCCC",textDecoration:"line-through"}}>{fmtKES(amount)}</div>}
        </div>
        {discount>0&&<div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
          <span className="badge bg-g">🏷 {discount}% off</span>
          <span className="badge bg-g">You save {fmtKES(saving)}</span>
        </div>}
        <div style={{fontSize:13,color:"#888888",marginTop:6}}>{purpose}</div>
      </div>
      {allowVoucher&&<FF label="Voucher Code (optional)">
        <div style={{display:"flex",gap:8}}>
          <input className="inp" placeholder="e.g. WS-FREE50" value={vcode} onChange={e=>{setVcode(e.target.value);if(!e.target.value)setVoucherInfo(null);}} style={{flex:1}} onKeyDown={e=>e.key==="Enter"&&applyVoucher()}/>
          <button className="btn bs sm" onClick={applyVoucher}>Apply</button>
        </div>
        {voucherInfo&&<div className="alert ag" style={{marginTop:8,fontSize:12}}>✅ {voucherInfo.description||`${discount}% discount`} — Pay only {fmtKES(finalAmt)}{finalAmt===0?" (FREE!)":""}</div>}
      </FF>}
      {finalAmt===0
        ?<button className="btn bp lg" style={{width:"100%"}} onClick={startPayment}>🎉 Unlock for Free →</button>
        :<>
          <FF label="Your M-Pesa Number" required>
            <div style={{display:"flex"}}>
              <div style={{background:"#F5F5F5",border:"1.5px solid #E0E0E0",borderRight:"none",borderRadius:6,padding:"10px 12px",fontSize:13,color:"#888888",whiteSpace:"nowrap"}}>🇰🇪 +254</div>
              <input className="inp" style={{borderRadius:6}} value={phone} onChange={e=>setPhone(e.target.value.replace(/[^0-9]/g,""))} placeholder="0712345678" maxLength={10}/>
            </div>
          </FF>
          {/* Safety tip before payment */}
          <div style={{background:"#F8F8F8",border:"1px solid #E8E8E8",borderRadius:12,padding:"10px 13px",marginBottom:12,fontSize:12,color:"#333333",lineHeight:1.65}}>
            <strong>⚠️ Security reminder:</strong> This KSh 250 is paid to <strong>Weka Soko Till 5673935</strong> only. We will <strong>never</strong> ask you to send money to a seller's personal number before meeting. If anyone does, report it immediately.
          </div>
          <button className="btn bp lg" style={{width:"100%"}} onClick={startPayment} disabled={phone.length<10}>
            📱 Send M-Pesa Request → {fmtKES(finalAmt)}
          </button>
          <ManualInput/>
        </>}
    </>}
    {step==="pushing"&&<div style={{textAlign:"center",padding:"32px 0"}}>
      <div style={{marginBottom:18}}><Spin s="48px"/></div>
      <h3 style={{fontWeight:700,marginBottom:8}}>Sending M-Pesa Request...</h3>
      <p style={{color:"#888888",fontSize:14}}>Watch for a push notification on <strong>{phone}</strong></p>
    </div>}
    {step==="polling"&&<div style={{textAlign:"center",padding:"24px 0"}}>
      <div style={{fontSize:64,marginBottom:12}}>📱</div>
      <h3 style={{fontWeight:700,marginBottom:8}}>Enter Your M-Pesa PIN</h3>
      <p style={{color:"#888888",fontSize:14,marginBottom:16}}>Check your phone · Pay Till <strong>5673935</strong> · {fmtKES(finalAmt)}</p>
      <div style={{fontSize:48,fontWeight:700,color:"#111111",marginBottom:8}}>{cd}s</div>
      <div className="progress"><div className="progress-bar" style={{width:`${(cd/90)*100}%`}}/></div>
      <ManualInput/>
    </div>}
    {step==="timeout"&&<div style={{textAlign:"center",padding:"24px 0"}}>
      <div style={{fontSize:64,marginBottom:12}}>⏱</div>
      <h3 style={{fontWeight:700,marginBottom:8}}>Request Timed Out</h3>
      <p style={{color:"#888888",fontSize:14,marginBottom:14}}>Did you pay? Paste your M-Pesa code to verify:</p>
      <ManualInput/>
      <button className="btn bs" style={{width:"100%",marginTop:12}} onClick={()=>{setStep("form");if(pollRef.current)clearInterval(pollRef.current);}}>← Try Again</button>
    </div>}
    {step==="done"&&<div style={{textAlign:"center",padding:"32px 0"}}>
      <div style={{fontSize:64,marginBottom:14}}>✅</div>
      <h3 style={{color:"#1428A0",fontWeight:700,marginBottom:8}}>Unlocked!</h3>
      <p style={{color:"#888888",fontSize:14}}>Buyer contact details are now visible. Check your email for the receipt.</p>
    </div>}
    {step==="error"&&<div style={{textAlign:"center",padding:"32px 0"}}>
      <div style={{fontSize:64,marginBottom:14}}>❌</div>
      <h3 style={{color:"#333333",fontWeight:600,marginBottom:8}}>Payment Failed</h3>
      <p style={{color:"#888888",fontSize:14,marginBottom:18}}>{errMsg}</p>
      <button className="btn bp" onClick={()=>{setStep("form");setErrMsg("");}}>Try Again</button>
    </div>}
  </Modal>;
}



// ── CHAT MODAL ────────────────────────────────────────────────────────────────
function ChatModal({listing,user,token,onClose,notify}){
  const [messages,setMessages]=useState([]);
  const [text,setText]=useState("");
  const [loading,setLoading]=useState(true);
  const [connected,setConnected]=useState(false);
  const [typing,setTyping]=useState(false);
  const [otherPresence,setOtherPresence]=useState(null);
  const [otherUserId,setOtherUserId]=useState(null);
  const socketRef=useRef(null);
  const bottomRef=useRef(null);
  const typingTimer=useRef(null);

  // Format last seen time
  const fmtPresence=p=>{
    if(!p)return null;
    if(p.is_online)return{text:"Online",color:"#111111",dot:"#22c55e"};
    if(!p.last_seen)return{text:"Offline",color:"#CCCCCC",dot:"#CCCCCC"};
    return{text:"Last seen "+ago(p.last_seen),color:"#888888",dot:"#CCCCCC"};
  };
  const presence=fmtPresence(otherPresence);

  const loadPresence=useCallback(async(msgs)=>{
    const arr=Array.isArray(msgs)?msgs:[];
    const otherId=arr.find(m=>m.sender_id!==user.id)?.sender_id;
    if(!otherId)return;
    setOtherUserId(otherId);
    try{const p=await api(`/api/chat/presence/${otherId}`,{},token);setOtherPresence(p);}catch{}
  },[user.id,token]);

  useEffect(()=>{
    // Load history
    api(`/api/chat/${listing.id}`,{},token)
      .then(msgs=>{const arr=Array.isArray(msgs)?msgs:[];setMessages(arr);loadPresence(arr);})
      .catch(()=>{})
      .finally(()=>setLoading(false));

    const socket=io(API,{auth:{token},transports:["websocket","polling"]});
    socketRef.current=socket;

    socket.on("connect",()=>{setConnected(true);socket.emit("join_listing",listing.id);});
    socket.on("disconnect",()=>setConnected(false));
    socket.on("reconnect",()=>{socket.emit("join_listing",listing.id);});

    // message_sent = server confirming OUR sent message (replace optimistic placeholder)
    socket.on("message_sent",msg=>{
      setMessages(p=>{
        const optIdx=p.map((m,i)=>({m,i})).reverse().find(({m})=>typeof m.id==="string"&&m.id.startsWith("opt-"))?.i;
        if(optIdx!=null){const next=[...p];next[optIdx]={...msg,direction:"me"};return next;}
        if(p.some(m=>m.id===msg.id))return p;
        return [...p,{...msg,direction:"me"}];
      });
    });

    // new_message = always an INCOMING message from the other party
    socket.on("new_message",msg=>{
      setMessages(p=>{
        if(p.some(m=>m.id===msg.id))return p;
        return [...p,{...msg,direction:"them"}];
      });
      setTyping(false);
      setOtherUserId(msg.sender_id);
      setOtherPresence(p=>({...p,is_online:true}));
    });

    socket.on("user_typing",()=>{
      setTyping(true);
      if(typingTimer.current)clearTimeout(typingTimer.current);
      typingTimer.current=setTimeout(()=>setTyping(false),3000);
    });

    socket.on("user_online",({userId})=>{
      if(userId!==user.id)setOtherPresence(p=>p?{...p,is_online:true}:p);
    });
    socket.on("user_offline",({userId,lastSeen})=>{
      if(userId!==user.id)setOtherPresence(p=>p?{...p,is_online:false,last_seen:lastSeen}:null);
    });

    socket.on("message_blocked",({reason,severity,violationCount,systemMessage})=>{
      // Show system message bubble in the chat window
      const sysMsg = {
        id:"sys-"+Date.now(),
        sender_id:"system",
        body: systemMessage || `⚠️ Message blocked: ${reason}. Contact info must stay hidden until KSh 250 unlock is paid.`,
        created_at: new Date().toISOString(),
        direction: "system",
        is_system: true,
        severity,
      };
      setMessages(p=>[...p, sysMsg]);
      // Also show a toast for immediate attention
      if(severity==="suspended")notify("🚫 Your account has been suspended. Check your email.","error");
      else notify(`⚠️ Message blocked (${violationCount}/3 violations)`, "warning");
    });
    socket.on("error",e=>notify(typeof e==="string"?e:"Chat error","error"));

    return()=>{socket.disconnect();if(typingTimer.current)clearTimeout(typingTimer.current);};
  },[listing.id,token]);

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[messages,typing]);

  const send=()=>{
    const body=text.trim();
    if(!body||!socketRef.current||!connected)return;
    socketRef.current.emit("send_message",{listingId:listing.id,body});
    // Optimistic local message
    setMessages(p=>[...p,{id:"opt-"+Date.now(),sender_id:user.id,body,created_at:new Date().toISOString(),direction:"me"}]);
    setText("");
  };

  const onType=e=>{
    setText(e.target.value);
    if(socketRef.current&&connected)socketRef.current.emit("typing",listing.id);
  };

  return <Modal title={`💬 ${listing.title}`} onClose={onClose} large>
    {/* Presence bar */}
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,padding:"10px 14px",background:"#F5F5F5",borderRadius:6}}>
      <div style={{width:10,height:10,borderRadius:"50%",background:connected?"#111111":"#CCCCCC",flexShrink:0,boxShadow:connected?"0 0 0 3px rgba(0,0,0,.08)":"none",transition:"all .3s"}}/>
      <span style={{fontSize:12,color:"#888888"}}>{connected?"Connected":"Reconnecting..."}</span>
      {presence&&<>
        <div style={{width:1,height:14,background:"#E8E8E8"}}/>
        <div style={{width:8,height:8,borderRadius:"50%",background:presence.dot,flexShrink:0}}/>
        <span style={{fontSize:12,color:presence.color,fontWeight:500}}>{presence.text}</span>
      </>}
      <span style={{fontSize:11,color:"#CCCCCC",marginLeft:"auto"}}>🔒 Moderated</span>
    </div>

    <div className="chat-wrap">
      <div className="chat-msgs">
        {loading
          ?<div style={{textAlign:"center",padding:20}}><Spin/></div>
          :messages.length===0
            ?<div style={{textAlign:"center",padding:32,color:"#888888",fontSize:13}}>
                <div style={{fontSize:40,marginBottom:10,opacity:.3}}>💬</div>
                No messages yet. Start the conversation!
              </div>
            :messages.map((m,i)=>(
            <div key={m.id||i} style={{display:"flex",flexDirection:"column",alignItems:m.direction==="me"?"flex-end":"flex-start"}}>
              {m.sender_anon&&m.direction==="them"&&<div style={{fontSize:10,color:"#CCCCCC",marginBottom:3,marginLeft:4}}>{m.sender_anon}</div>}
              {m.is_system
                ?<div style={{margin:"8px auto",maxWidth:"90%",background:"#F0F0F0",border:"1px solid #CCCCCC",borderRadius:6,padding:"10px 14px",fontSize:12,lineHeight:1.6,color:"#333333",textAlign:"center"}}>{m.body}</div>
                :<div className={`chat-msg ${m.direction||"them"}${m.is_blocked?" blocked":""}`}>
                  <div>{m.is_blocked||!m.body?<em style={{opacity:.6}}>🚫 Message removed — contained contact info</em>:m.body}</div>
                  <div style={{fontSize:10,opacity:.5,marginTop:4,textAlign:m.direction==="me"?"right":"left"}}>{ago(m.created_at)}</div>
                </div>
              }
            </div>
          ))}
        {typing&&<div style={{alignSelf:"flex-start",padding:"8px 14px",background:"#FFFFFF",border:"1px solid #E8E8E8",borderRadius:"14px 14px 14px 3px",fontSize:13,color:"#888888"}}>
          <span style={{letterSpacing:2}}>•••</span>
        </div>}
        <div ref={bottomRef}/>
      </div>
      <div className="chat-input">
        <input className="inp" style={{flex:1}} placeholder={connected?"Type a message...":"Connecting..."}
          value={text} onChange={onType}
          onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),send())}
          disabled={!connected}/>
        <button className="btn bp sm" onClick={send} disabled={!text.trim()||!connected}>Send ↑</button>
      </div>
    </div>
    {!listing.is_unlocked&&<div className="alert ay" style={{marginTop:12,fontSize:12}}>🔒 Contact info hidden until unlocked. Phone/email in chat will be auto-blocked.</div>}
  </Modal>;
}



// ── POST AD ───────────────────────────────────────────────────────────────────
function PostAdModal({onClose,onSuccess,token,notify,listing=null}){
  const [step,setStep]=useState(1);
  const [loading,setLoading]=useState(false);
  const [images,setImages]=useState([]);
  const [f,setF]=useState(()=>listing?{
    title:listing.title||"",category:listing.category||"",subcat:listing.subcat||"",
    price:String(listing.price||""),description:listing.description||"",
    reason:listing.reason_for_sale||"",location:listing.location||"",county:listing.county||""
  }:{title:"",category:"",subcat:"",price:"",description:"",reason:"",location:"",county:""});
  const [existingPhotos,setExistingPhotos]=useState(()=>{
    if(!listing)return[];
    const ph=listing.photos||[];
    return ph.map((p,i)=>typeof p==="string"?{id:`ep-${i}`,url:p,existing:true}:{id:p.id||`ep-${i}`,url:p.url,public_id:p.public_id,existing:true});
  });
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const cat=CATS.find(c=>c.name===f.category);

  // Client-side contact info scan
  const [fieldErrors,setFieldErrors]=useState({});

  const checkContactInfo=(text,fieldName)=>{
    // Check for phone-like patterns: 10+ digits with optional separators
    const stripped=text.replace(/[\s.\-•*_,;]/g,"");
    const hasPhone=/\d{10,}/.test(stripped)||/(0[17]\d[.\-\s]*){1}(\d[.\-\s]*){7}/.test(text);
    const hasEmail=/[a-z0-9._%+\-]+\s*@\s*[a-z0-9.\-]+\s*\.\s*[a-z]{2,}/i.test(text);
    const hasSocial=/\b(whatsapp|telegram|instagram|facebook|snapchat|tiktok|wa\.me|dm me|call me|text me|reach me|my number|my phone|my email)\b/i.test(text);
    const hasWordDigits=/(zero|one|two|three|four|five|six|seven|eight|nine)[\s,\-]+(zero|one|two|three|four|five|six|seven|eight|nine)[\s,\-]+(zero|one|two|three|four|five|six|seven|eight|nine)[\s,\-]+(zero|one|two|three|four|five|six|seven|eight|nine)/i.test(text);
    return hasPhone||hasEmail||hasSocial||hasWordDigits;
  };

  const submit=async()=>{
    if(!f.reason.trim()||!f.location.trim()){notify("Please fill in all required fields.","warning");return;}
    const errs={};
    const fieldsToCheck=[["title",f.title],["description",f.description],["reason",f.reason],["location",f.location]];
    for(const [k,v] of fieldsToCheck){if(v&&checkContactInfo(v))errs[k]="Cannot contain phone numbers, emails, or social handles";}
    if(Object.keys(errs).length>0){setFieldErrors(errs);notify("⚠️ Remove contact info from the flagged fields","warning");return;}
    setFieldErrors({});
    setLoading(true);
    try{
      const isEdit=!!listing;
      const url=isEdit?`/api/listings/${listing.id}`:"/api/listings";
      const method=isEdit?"PATCH":"POST";
      const fd=new FormData();
      Object.entries({title:f.title,category:f.category,price:f.price,description:f.description,reason_for_sale:f.reason,location:f.location,county:f.county}).forEach(([k,v])=>v&&fd.append(k,v));
      if(f.subcat)fd.append("subcat",f.subcat);
      images.forEach(img=>img.file&&fd.append("photos",img.file));
      const result=await api(url,{method,body:fd},token);
      onSuccess(result);onClose();
      notify(isEdit?"✅ Ad updated!":"🚀 Ad is live!","success");
    }catch(err){
      if(err.violations){
        const msg=err.violations.map(v=>`${v.field}: ${v.reason}`).join(" | ");
        notify(`❌ Contact info detected — ${msg}`,"error");
      } else {
        notify(err.message||"Failed to save ad","error");
      }
    }
    finally{setLoading(false);}
  };

  return <Modal title={listing?`Edit Ad — Step ${step}/2`:`Post Ad — Step ${step}/2`} onClose={onClose} footer={
    <div style={{display:"flex",gap:8,width:"100%"}}>
      {step===2&&<button className="btn bs" onClick={()=>setStep(1)}>← Back</button>}
      <div style={{flex:1}}/>
      {step===1&&<button className="btn bp" onClick={()=>setStep(2)} disabled={!f.title.trim()||!f.category||!f.price||!f.description.trim()}>Continue →</button>}
      {step===2&&<button className="btn bp" onClick={submit} disabled={loading}>{loading?<Spin/>:"Publish Ad 🚀"}</button>}
    </div>
  }>
    <div className="alert ag" style={{marginBottom:16,fontSize:12}}>✅ Posting is 100% free. KSh 250 only when a buyer locks in.</div>
    {step===1&&<>
      <FF label="Item Title" required>
        <input className="inp" placeholder="e.g. iPhone 14 Pro 256GB" value={f.title} onChange={e=>{sf("title",e.target.value);setFieldErrors(p=>({...p,title:undefined}));}}/>
        {fieldErrors.title&&<div style={{color:"#dc2626",fontSize:11,marginTop:3}}>⚠️ {fieldErrors.title}</div>}
      </FF>
      <FF label="Category" required>
        <select className="inp" value={f.category} onChange={e=>{sf("category",e.target.value);sf("subcat","");}}>
          <option value="">Select category...</option>
          {CATS.map(c=><option key={c.name}>{c.name}</option>)}
        </select>
      </FF>
      {cat&&<FF label="Subcategory">
        <select className="inp" value={f.subcat} onChange={e=>sf("subcat",e.target.value)}>
          <option value="">Select subcategory...</option>
          {cat.sub.map(s=><option key={s}>{s}</option>)}
        </select>
      </FF>}
      <FF label="Price (KSh)" required><input className="inp" type="number" placeholder="5000" value={f.price} onChange={e=>sf("price",e.target.value)} min={1}/></FF>
      <FF label="Description" required hint="Condition, what's included, any defects...">
        <textarea className="inp" placeholder="Excellent condition, barely used..." value={f.description} onChange={e=>{sf("description",e.target.value);setFieldErrors(p=>({...p,description:undefined}));}}/>
        {fieldErrors.description&&<div style={{color:"#dc2626",fontSize:11,marginTop:3}}>⚠️ {fieldErrors.description}</div>}
      </FF>
      <FF label={listing?"Photos — click × to remove, or add more below":"Photos (up to 8 — first is cover)"}>
        {existingPhotos.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
          {existingPhotos.map((p,i)=><div key={p.id||i} style={{position:"relative",width:70,height:55,borderRadius:6,overflow:"hidden",flexShrink:0}}>
            <img src={p.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            <button onClick={()=>{
              if(listing&&p.id&&!p.id.startsWith("ep-"))
                api(`/api/listings/${listing.id}/photos/${p.id}`,{method:"DELETE"},token).catch(()=>{});
              setExistingPhotos(prev=>prev.filter((_,j)=>j!==i));
            }} style={{position:"absolute",top:2,right:2,background:"rgba(0,0,0,.7)",color:"#fff",border:"none",borderRadius:"50%",width:18,height:18,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>×</button>
          </div>)}
        </div>}
        <ImageUploader images={images} setImages={setImages}/>
      </FF>
    </>}
    {step===2&&<>
      <FF label="Reason for Selling" required><input className="inp" placeholder="e.g. Upgrading to newer model" value={f.reason} onChange={e=>sf("reason",e.target.value)}/></FF>
      <FF label="Collection Location" required hint="General area e.g. Westlands, Nairobi — exact address shared after unlock.">
        <input className="inp" placeholder="e.g. Westlands, Nairobi" value={f.location} onChange={e=>sf("location",e.target.value)}/>
      </FF>
      <FF label="County">
        <select className="inp" value={f.county} onChange={e=>sf("county",e.target.value)}>
          <option value="">Select county...</option>
          {["Nairobi","Mombasa","Kisumu","Nakuru","Eldoret","Thika","Kiambu","Machakos","Kajiado","Murang'a","Nyeri","Meru","Embu","Kirinyaga","Nyandarua","Laikipia","Nakuru","Baringo","Nandi","Uasin Gishu","Trans Nzoia","Elgeyo Marakwet","West Pokot","Turkana","Samburu","Isiolo","Marsabit","Mandera","Wajir","Garissa","Tana River","Lamu","Taita Taveta","Kilifi","Kwale","Mombasa","Vihiga","Bungoma","Busia","Kakamega","Siaya","Kisumu","Homabay","Migori","Kisii","Nyamira"].map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </FF>
      <div className="alert ay" style={{fontSize:12}}>🔒 Your phone/email are hidden until a buyer pays KSh 250 to unlock them.</div>
    </>}
  </Modal>;
}

// ── LISTING CARD ──────────────────────────────────────────────────────────────
function ListingCard({listing:l,onClick,listView}){
  const photo=Array.isArray(l.photos)?l.photos.find(p=>typeof p==="string")||l.photos[0]?.url||null:null;
  return <div className={`lcard${listView?" lcard-list":""}`} onClick={onClick}>
    <div className="lthumb">
      {photo?<WatermarkedImage src={photo} alt={l.title} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>:<span style={{fontSize:44,opacity:.15}}>📦</span>}
      {l.status==="sold"&&<div className="sold-badge">SOLD ✓</div>}
      {l.locked_buyer_id&&!l.is_unlocked&&<div style={{position:"absolute",bottom:0,left:0,right:0,background:"#1D1D1D",color:"#fff",fontSize:10,fontWeight:700,padding:"5px 10px",letterSpacing:".04em",textTransform:"uppercase"}}>🔥 Buyer Interested</div>}
    </div>
    <div style={{padding:"18px 20px",flex:1}}>
      <div style={{fontSize:12,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",color:"#888888",marginBottom:6}}>{l.category}</div>
      <h4 style={{fontSize:15,fontWeight:700,lineHeight:1.3,marginBottom:8,letterSpacing:"-.01em"}}>{l.title}</h4>
      <div style={{fontSize:22,fontWeight:700,color:"var(--a)",marginBottom:8,letterSpacing:"-.01em"}}>{fmtKES(l.price)}</div>
      {listView&&l.description&&<p style={{fontSize:13,color:"#888888",marginBottom:8,lineHeight:1.65}}>{l.description.slice(0,130)}...</p>}
      <div style={{display:"flex",gap:12,color:"#888888",fontSize:11,flexWrap:"wrap",borderTop:"1px solid #E8E8E8",paddingTop:8,marginTop:4}}>
        {l.location&&<span>📍 {l.location}</span>}
        <span>👁 {l.view_count||0}</span>
        {l.seller_avg_rating>0&&<span style={{color:"#8B6400",fontWeight:700}}>★ {Number(l.seller_avg_rating).toFixed(1)}</span>}
        <span style={{marginLeft:"auto"}}>{ago(l.created_at)}</span>
      </div>
    </div>
  </div>;
}

// ── DETAIL MODAL ──────────────────────────────────────────────────────────────
// ── LEAVE REVIEW BUTTON ──────────────────────────────────────────────────────
function LeaveReviewBtn({listing,user,token,notify}){
  const [open,setOpen]=useState(false);
  const [rating,setRating]=useState(0);
  const [comment,setComment]=useState("");
  const [loading,setLoading]=useState(false);
  const [done,setDone]=useState(false);

  const submit=async()=>{
    if(!rating){notify("Please select a rating","warning");return;}
    setLoading(true);
    try{
      await api(`/api/reviews/${listing.id}`,{method:"POST",body:JSON.stringify({rating,comment})},token);
      setDone(true);
      notify("⭐ Review submitted!","success");
      setTimeout(()=>setOpen(false),2000);
    }catch(e){notify(e.message||"Failed to submit","error");}
    finally{setLoading(false);}
  };

  const isSeller=listing.seller_id===user?.id;
  const label=isSeller?"⭐ Review Buyer":"⭐ Review Seller";

  if(!open)return<button className="btn bs sm" onClick={()=>setOpen(true)}>{label}</button>;

  return<div style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}}>
    <div style={{background:"#FFFFFF",borderRadius:6,padding:24,maxWidth:380,width:"100%"}}>
      <div style={{fontWeight:700,fontSize:17,marginBottom:4}}>{label}</div>
      <div style={{color:"#888888",fontSize:13,marginBottom:16}}>
        {isSeller?"How was the buyer? Did the transaction go smoothly?":"How was the seller? Was the item as described?"}
      </div>
      {done?<div style={{textAlign:"center",padding:"20px 0"}}>
        <div style={{fontSize:48}}>⭐</div>
        <div style={{fontWeight:600,marginTop:8}}>Review submitted!</div>
      </div>:<>
        <div style={{display:"flex",gap:8,marginBottom:16,justifyContent:"center"}}>
          {[1,2,3,4,5].map(i=><span key={i} onClick={()=>setRating(i)} style={{fontSize:36,cursor:"pointer",color:i<=rating?"#111111":"#E0E0E0",userSelect:"none",transition:"color .1s"}}>★</span>)}
        </div>
        {rating>0&&<div style={{textAlign:"center",fontSize:13,color:"#888888",marginBottom:12}}>
          {["","😞 Poor","😐 Fair","🙂 Good","😊 Very Good","🤩 Excellent"][rating]}
        </div>}
        <textarea className="inp" rows={3} placeholder="Share your experience (optional)..." value={comment} onChange={e=>setComment(e.target.value)} style={{marginBottom:14,resize:"vertical"}}/>
        <div style={{display:"flex",gap:8}}>
          <button className="btn bs" style={{flex:1}} onClick={()=>setOpen(false)}>Cancel</button>
          <button className="btn bp" style={{flex:1}} onClick={submit} disabled={loading||!rating}>{loading?<Spin/>:"Submit ⭐"}</button>
        </div>
      </>}
    </div>
  </div>;
}

// ── REPORT LISTING BUTTON ────────────────────────────────────────────────────
const REPORT_REASONS = [
  {value:"scam",label:"🚨 Scam / Fraud"},
  {value:"fake_item",label:"🎭 Fake or misleading item"},
  {value:"wrong_price",label:"💰 Wrong price"},
  {value:"offensive",label:"🚫 Offensive content"},
  {value:"spam",label:"📧 Spam"},
  {value:"wrong_category",label:"📂 Wrong category"},
  {value:"already_sold",label:"✅ Item already sold"},
  {value:"other",label:"❓ Other"},
];
function ReportListingBtn({listingId,token,notify}){
  const [open,setOpen]=useState(false);
  const [reason,setReason]=useState("");
  const [details,setDetails]=useState("");
  const [loading,setLoading]=useState(false);
  const [done,setDone]=useState(false);

  const submit=async()=>{
    if(!reason){notify("Please select a reason","warning");return;}
    setLoading(true);
    try{
      await api(`/api/listings/${listingId}/report`,{method:"POST",body:JSON.stringify({reason,details})},token);
      setDone(true);
      setTimeout(()=>setOpen(false),2000);
    }catch(e){notify(e.message||"Report failed","error");}
    finally{setLoading(false);}
  };

  if(!open)return <button className="btn bgh sm" style={{fontSize:11,color:"#CCCCCC"}} onClick={()=>setOpen(true)}>🚩 Report</button>;

  return <div style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}}>
    <div style={{background:"#FFFFFF",borderRadius:6,padding:24,maxWidth:400,width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
      <div style={{fontWeight:700,fontSize:17,marginBottom:4}}>🚩 Report this listing</div>
      <div style={{color:"#888888",fontSize:13,marginBottom:16}}>Help us keep Weka Soko safe. Reports are anonymous and reviewed by our team.</div>
      {done?<div style={{textAlign:"center",padding:"20px 0"}}>
        <div style={{fontSize:48}}>✅</div>
        <div style={{fontWeight:600,marginTop:8}}>Report submitted</div>
        <div style={{color:"#888888",fontSize:13}}>Our team will review it shortly.</div>
      </div>:<>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
          {REPORT_REASONS.map(r=><label key={r.value} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:6,border:`1.5px solid ${reason===r.value?"#111111":"#E0E0E0"}`,cursor:"pointer",background:reason===r.value?"#F5F5F5":"transparent",fontSize:13}}>
            <input type="radio" name="report_reason" value={r.value} checked={reason===r.value} onChange={()=>setReason(r.value)} style={{accentColor:"#111111"}}/>
            {r.label}
          </label>)}
        </div>
        <textarea className="inp" rows={3} placeholder="Additional details (optional)..." value={details} onChange={e=>setDetails(e.target.value)} style={{marginBottom:14,resize:"vertical"}}/>
        <div style={{display:"flex",gap:8}}>
          <button className="btn bs" style={{flex:1}} onClick={()=>setOpen(false)}>Cancel</button>
          <button className="btn bp" style={{flex:1}} onClick={submit} disabled={loading}>{loading?<Spin/>:"Submit Report"}</button>
        </div>
      </>}
    </div>
  </div>;
}

// ── EMAIL VERIFICATION BANNER ─────────────────────────────────────────────────
function VerificationBanner({user,token,notify}){
  const [sent,setSent]=useState(false);
  const [loading,setLoading]=useState(false);
  if(!user||user.is_verified)return null;
  const resend=async()=>{
    setLoading(true);
    try{
      await api("/api/auth/resend-verification",{method:"POST"},token);
      setSent(true);
      notify("Verification email sent! Check your inbox.","success");
    }catch(e){notify(e.message,"error");}
    finally{setLoading(false);}
  };
  return <div style={{background:"#F8F8F8",border:"1px solid #EBEBEB",borderRadius:6,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
    <span style={{fontSize:20}}>📧</span>
    <div style={{flex:1,minWidth:200}}>
      <div style={{fontWeight:600,fontSize:13,color:"rgba(180,90,0,1)"}}>Email not verified</div>
      <div style={{fontSize:12,color:"#888888"}}>Check your inbox for a verification link, or request a new one.</div>
    </div>
    {!sent
      ?<button className="btn by sm" onClick={resend} disabled={loading}>{loading?<Spin/>:"Resend Email"}</button>
      :<span style={{fontSize:12,color:"#111111",fontWeight:600}}>✓ Sent!</span>}
  </div>;
}

function DetailModal({listing:l,user,token,onClose,onShare,onChat,onLockIn,onUnlock,onEscrow,notify}){
  const isSeller=user?.id===l.seller_id;
  const isBuyer=user?.id===l.locked_buyer_id;
  const photos=Array.isArray(l.photos)?l.photos.map(p=>typeof p==="string"?p:p?.url).filter(Boolean):[];
  const [mainPhoto,setMainPhoto]=useState(photos[0]||null);
  const [lightbox,setLightbox]=useState(null); // {photos, idx}
  const escrowFee=Math.round(l.price*0.075);

  return <Modal title={l.title} onClose={onClose} large footer={
    <div style={{width:"100%",display:"flex",gap:8,flexWrap:"wrap"}}>
      <button className="btn bgh sm" onClick={onShare}>↗ Share</button>
      {user&&!isSeller&&<button className="btn bs sm" onClick={onChat}>💬 Chat with Seller</button>}
      {isSeller&&<button className="btn bs sm" onClick={onChat}>💬 View Messages</button>}
      {!isSeller&&l.status==="active"&&!l.locked_buyer_id&&user&&<button className="btn bg2 sm" onClick={onLockIn}>🔥 I'm Interested — Lock In</button>}
      {!isSeller&&l.status==="active"&&user&&<button className="btn bs sm" onClick={onEscrow}>🔐 Buy with Escrow</button>}
      {isSeller&&l.locked_buyer_id&&!l.is_unlocked&&<button className="btn bp" style={{flex:1}} onClick={onUnlock}>🔓 Pay KSh 250 to See Buyer Contact</button>}
      {!user&&<button className="btn bp" onClick={()=>{}}>Sign In to Contact Seller</button>}
    </div>
  }>
    {/* Photos */}
    <div style={{background:"#F5F5F5",borderRadius:6,aspectRatio:"16/9",overflow:"hidden",marginBottom:10,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
      {mainPhoto
        ?<WatermarkedImage src={mainPhoto} alt={l.title}
            style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
            onClick={()=>setLightbox({photos,idx:photos.indexOf(mainPhoto)<0?0:photos.indexOf(mainPhoto)})}/>
        :<span style={{fontSize:80,opacity:.15}}>📦</span>}
      {/* Zoom hint */}
      {mainPhoto&&<div style={{position:"absolute",bottom:10,right:10,background:"rgba(0,0,0,.45)",color:"#fff",fontSize:11,padding:"4px 10px",borderRadius:80,pointerEvents:"none"}}>🔍 Click to enlarge</div>}
      {l.status==="sold"&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}><div style={{background:"#111111",color:"#fff",padding:"8px 28px",borderRadius:6,fontWeight:600,fontSize:18,letterSpacing:".08em"}}>SOLD ✓</div></div>}
    </div>
    {photos.length>1&&<div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto"}}>
      {photos.map((p,i)=><img key={i} src={p} alt="" onClick={()=>setMainPhoto(p)} style={{width:70,height:55,objectFit:"cover",borderRadius:6,cursor:"pointer",opacity:mainPhoto===p?1:.55,border:mainPhoto===p?"2px solid #111111":"2px solid transparent",flexShrink:0}}/>)}
    </div>}
    {lightbox&&<Lightbox photos={lightbox.photos} startIdx={lightbox.idx} onClose={()=>setLightbox(null)}/>}

    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
      <div>
        <div style={{fontSize:32,fontWeight:600,color:"#1428A0",fontFamily:"var(--fn)"}}>{fmtKES(l.price)}</div>
        <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
          <span className="badge bg-m">{l.category}</span>
          {l.subcat&&<span className="badge bg-m">{l.subcat}</span>}
        </div>
      </div>
      <span className={`badge ${l.status==="active"||l.status==="locked"?"bg-g":l.status==="sold"?"bg-y":l.status==="pending_review"?"bg-b":l.status==="needs_changes"?"by2":l.status==="rejected"?"br2":"bg-m"}`}>{l.status==="pending_review"?"⏳ Under Review":l.status==="needs_changes"?"✏️ Needs Changes":l.status==="rejected"?"❌ Rejected":l.status}</span>
    </div>

    {l.description&&<div style={{marginBottom:16}}><div className="lbl">Description</div><p style={{color:"#888888",fontSize:14,lineHeight:1.8}}>{l.description}</p></div>}

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
      {l.reason_for_sale&&<div style={{background:"#F5F5F5",borderRadius:6,padding:"12px 14px"}}><div className="lbl">Reason for Sale</div><div style={{fontSize:13}}>{l.reason_for_sale}</div></div>}
      {(l.location||l.county)&&<div style={{background:"#F5F5F5",borderRadius:6,padding:"12px 14px"}}>
        <div className="lbl">Location</div>
        <div style={{fontSize:13}}>📍 {l.location}{l.county&&l.location&&l.location!==l.county?`, ${l.county}`:l.county||""}</div>
      </div>}
    </div>

    {/* Seller contact + response rate */}
    <div style={{marginBottom:16}}>
      <div className="lbl">Seller</div>
      {l.is_unlocked
        ?<div style={{background:"#F8F8F8",border:"1px solid #E8E8E8",borderRadius:12,padding:"16px 18px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <span style={{fontSize:18}}>🔓</span>
            <div>
              <div style={{fontWeight:700,fontSize:14,color:"#111111"}}>Contact Revealed</div>
              <div style={{fontSize:12,color:"#888888"}}>Share responsibly — do not post publicly</div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            {l.seller_name&&<div style={{display:"flex",alignItems:"center",gap:8,fontSize:13}}>
              <span style={{fontSize:16}}>👤</span>
              <span style={{fontWeight:600}}>{l.seller_name}</span>
            </div>}
            {l.seller_phone&&<div style={{display:"flex",alignItems:"center",gap:8,fontSize:13}}>
              <span style={{fontSize:16}}>📞</span>
              <span>{l.seller_phone}</span>
            </div>}
            {l.seller_email&&<div style={{display:"flex",alignItems:"center",gap:8,fontSize:13}}>
              <span style={{fontSize:16}}>✉️</span>
              <span>{l.seller_email}</span>
            </div>}
          </div>
          {l.seller_phone&&(()=>{
            // Convert Kenyan number to WhatsApp international format
            const raw=l.seller_phone.replace(/\D/g,"");
            const wa=raw.startsWith("254")?raw:raw.startsWith("0")?`254${raw.slice(1)}`:raw;
            const msg=encodeURIComponent(`Hi, I saw your listing "${l.title}" on Weka Soko for ${fmtKES(l.price)}. Is it still available?`);
            return <a
              href={`https://wa.me/${wa}?text=${msg}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:"#25D366",color:"#fff",padding:"12px 20px",fontWeight:700,fontSize:14,textDecoration:"none",fontFamily:"var(--fn)",letterSpacing:".01em",transition:"background .15s"}}
              onMouseOver={e=>e.currentTarget.style.background="#1EA952"}
              onMouseOut={e=>e.currentTarget.style.background="#111111"}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat on WhatsApp
            </a>;
          })()}
        </div>
        :<div style={{background:"#F5F5F5",borderRadius:6,padding:"14px",display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:30}}>🔒</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:600}}>{l.seller_anon||"Anonymous Seller"}</div>
            <div style={{fontSize:12,color:"#888888"}}>Pay KSh 250 to reveal contact details</div>
            <div style={{display:"flex",gap:6,marginTop:5,flexWrap:"wrap",alignItems:"center"}}>
              {l.seller_avg_rating>0&&<span style={{fontSize:11,background:"rgba(0,0,0,.05)",color:"#1428A0",padding:"2px 8px",borderRadius:80,fontWeight:700}}>
                ★ {Number(l.seller_avg_rating).toFixed(1)} ({l.seller_review_count||0} review{l.seller_review_count!==1?"s":""})
              </span>}
              {(!l.seller_avg_rating||l.seller_avg_rating===0)&&<span style={{fontSize:11,color:"#CCCCCC"}}>No reviews yet</span>}
              {l.response_rate!=null&&<span style={{fontSize:11,background:"#F0F0F0",color:"#1428A0",padding:"2px 8px",borderRadius:6,fontWeight:600}}>
                ⚡ {Math.round(l.response_rate)}% response rate
              </span>}
              {l.avg_response_hours!=null&&l.avg_response_hours<48&&<span style={{fontSize:11,color:"#888888"}}>
                Replies in ~{l.avg_response_hours<1?"under an hour":l.avg_response_hours<24?Math.round(l.avg_response_hours)+"h":Math.round(l.avg_response_hours/24)+"d"}
              </span>}
            </div>
          </div>
          {isSeller&&l.locked_buyer_id&&<button className="btn bp sm" style={{marginLeft:"auto"}} onClick={onUnlock}>Unlock → KSh 250</button>}
        </div>}
    </div>

    {/* ── Buyer safety tip ───────────────────────────────────────────── */}
    {!isSeller&&l.status==="active"&&<div style={{background:"#F8F8F8",border:"1px solid #E8E8E8",borderRadius:12,padding:"12px 14px",marginBottom:10}}>
      <div style={{fontSize:12,fontWeight:700,color:"#111111",marginBottom:4}}>🛡️ Stay Safe on Weka Soko</div>
      <div style={{fontSize:12,color:"#888888",lineHeight:1.7}}>
        • <strong>Never pay outside this platform.</strong> If a seller asks for M-Pesa directly before you've met, that's a scam.<br/>
        • <strong>Use Escrow</strong> for expensive items — your money is held safely until you confirm delivery.<br/>
        • <strong>Meet in a public place</strong> for physical item handovers. Bring someone if you can.<br/>
        • 🚩 <strong>Something feel off?</strong> Use the Report button below.
      </div>
    </div>}

    {/* Escrow info */}
    {!isSeller&&l.status==="active"&&<div className="alert ay" style={{fontSize:12}}>
      🔐 <strong>Safe Escrow:</strong> Pay {fmtKES(l.price+escrowFee)} (item {fmtKES(l.price)} + 7.5% fee). Funds held until you confirm you received the item.
    </div>}

    <div style={{display:"flex",gap:16,fontSize:12,color:"#888888",marginTop:10,flexWrap:"wrap",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",gap:12}}>
        <span>👁 {l.view_count||0} views</span>
        <span>🔥 {l.interest_count||0} interested</span>
        <span>🕒 {ago(l.created_at)}</span>
        {l.expires_at&&<span style={{color:new Date(l.expires_at)<new Date()?"#888888":"#CCCCCC"}}>⏰ {timeLeft(l.expires_at)}</span>}
      </div>
      {user&&!isSeller&&<ReportListingBtn listingId={l.id} token={token} notify={notify}/>}
      {user&&(isSeller||isBuyer)&&l.status==="sold"&&<LeaveReviewBtn listing={l} user={user} token={token} notify={notify}/>}
    </div>
  </Modal>;
}

// ── ROLE SWITCHER ─────────────────────────────────────────────────────────────
// ── MARK AS SOLD MODAL ────────────────────────────────────────────────────────
function MarkSoldModal({listing, token, notify, onClose, onSuccess}) {
  const [loading, setLoading] = useState(false);

  const confirm = async (channel) => {
    setLoading(true);
    try {
      await api(`/api/listings/${listing.id}/mark-sold`, {
        method: "POST",
        body: JSON.stringify({ channel })
      }, token);
      notify(
        channel === "platform"
          ? "🎉 Marked as sold via Weka Soko!"
          : "✅ Marked as sold outside platform.",
        "success"
      );
      onSuccess(listing.id, channel);
      onClose();
    } catch(e) { notify(e.message, "error"); }
    finally { setLoading(false); }
  };

  return <Modal title="✅ Mark as Sold" onClose={onClose}>
    <div style={{textAlign:"center", padding:"8px 0 16px"}}>
      <div style={{fontSize:48, marginBottom:12}}>🏷️</div>
      <div style={{fontWeight:700, fontSize:16, marginBottom:6}}>{listing.title}</div>
      <div style={{fontSize:13, color:"#888888", marginBottom:24}}>
        How did this item sell? This helps us improve Weka Soko.
      </div>

      <div style={{display:"flex", flexDirection:"column", gap:12}}>
        <button className="btn bp" style={{width:"100%", padding:"16px", flexDirection:"column", gap:4, height:"auto"}}
          onClick={()=>confirm("platform")} disabled={loading}>
          <div style={{fontSize:22}}>🛒</div>
          <div style={{fontWeight:700, fontSize:14}}>Sold via Weka Soko</div>
          <div style={{fontSize:12, opacity:.8, fontWeight:400}}>Buyer found me through this platform</div>
        </button>

        <button className="btn bs" style={{width:"100%", padding:"16px", flexDirection:"column", gap:4, height:"auto"}}
          onClick={()=>confirm("outside")} disabled={loading}>
          <div style={{fontSize:22}}>🤝</div>
          <div style={{fontWeight:700, fontSize:14}}>Sold Outside Platform</div>
          <div style={{fontSize:12, color:"#888888", fontWeight:400}}>I found the buyer elsewhere</div>
        </button>
      </div>

      {loading && <div style={{marginTop:16}}><Spin/></div>}
    </div>
  </Modal>;
}

function RoleSwitcher({user,token,notify,onSwitch}){
  const [loading,setLoading]=useState(false);
  const target=user.role==="seller"?"buyer":"seller";
  const switch_=async()=>{
    if(!window.confirm(`Switch to ${target} account? You can switch back anytime.`))return;
    setLoading(true);
    try{
      const data=await api("/api/auth/role",{method:"PATCH",body:JSON.stringify({role:target})},token);
      notify(`Switched to ${target} account ✓`,"success");
      onSwitch(data.user);
    }catch(err){notify(err.message,"error");}
    finally{setLoading(false);}
  };
  return <button className="btn bs" style={{justifyContent:"flex-start",gap:10}} onClick={switch_} disabled={loading}>
    {loading?<Spin/>:<>{target==="seller"?"🏷":"🛍"} Switch to {target==="seller"?"Seller":"Buyer"} Account</>}
  </button>;
}

// ── SOLD ITEMS SECTION ───────────────────────────────────────────────────────
// ── POST REQUEST MODAL ─────────────────────────────────────────────────────
function PostRequestModal({onClose,token,notify,onSuccess}){
  const [f,setF]=useState({title:"",description:"",budget:"",county:""});
  const [loading,setLoading]=useState(false);
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const COUNTIES=["Nairobi","Mombasa","Kisumu","Nakuru","Eldoret","Kiambu","Machakos","Kajiado","Meru","Nyeri","Kisii","Kakamega","Thika","Malindi","Nakuru","Garissa","Embu","Uasin Gishu","Trans Nzoia","Bungoma","Siaya","Homabay","Migori","Vihiga","Busia","Nandi","Kericho","Baringo","Laikipia","Samburu","West Pokot","Turkana","Marsabit","Mandera","Wajir","Tana River","Lamu","Taita Taveta","Kilifi","Kwale","Makueni","Kitui","Murang'a","Kirinyaga","Nyandarua","Isiolo","Naivasha"];
  const submit=async()=>{
    if(!f.title.trim()||!f.description.trim()){notify("Title and description are required","warning");return;}
    setLoading(true);
    try{
      const result=await api("/api/requests",{method:"POST",body:JSON.stringify({title:f.title.trim(),description:f.description.trim(),budget:f.budget||undefined,county:f.county||undefined})},token);
      notify("✅ Request posted! Sellers will be notified.","success");
      onSuccess(result);onClose();
    }catch(err){notify(err.message,"error");}
    finally{setLoading(false);}
  };
  return <Modal title="🛒 Post a Buyer Request" onClose={onClose} footer={
    <><button className="btn bs" onClick={onClose}>Cancel</button><button className="btn bp" onClick={submit} disabled={loading}>{loading?<Spin/>:"Post Request →"}</button></>
  }>
    <div className="alert ag" style={{marginBottom:16,fontSize:13}}>Tell sellers what you're looking for. They'll be notified when a matching item is listed.</div>
    <FF label="What are you looking for?" required>
      <input className="inp" placeholder="e.g. iPhone 13 Pro, good condition" value={f.title} onChange={e=>sf("title",e.target.value)} maxLength={120}/>
      <div style={{fontSize:11,color:"#888888",marginTop:3}}>{f.title.length}/120</div>
    </FF>
    <FF label="Description" required hint="Be specific — condition, colour, specs, anything important">
      <textarea className="inp" placeholder="e.g. Looking for iPhone 13 Pro 256GB in any colour, screen must be crack-free, battery health above 80%..." value={f.description} onChange={e=>sf("description",e.target.value)} rows={4}/>
    </FF>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <FF label="Max Budget (KSh)" hint="Optional">
        <input className="inp" type="number" placeholder="e.g. 80000" value={f.budget} onChange={e=>sf("budget",e.target.value)} min={0}/>
      </FF>
      <FF label="County" hint="Optional">
        <select className="inp" value={f.county} onChange={e=>sf("county",e.target.value)}>
          <option value="">Any county</option>
          {COUNTIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </FF>
    </div>
  </Modal>;
}

// ── WHAT BUYERS WANT SECTION ───────────────────────────────────────────────
function WhatBuyersWant({user,token,notify,onSignIn,compact=false}){
  const [pitchTarget,setPitchTarget]=useState(null);
  const [requests,setRequests]=useState([]);
  const [total,setTotal]=useState(0);
  const [loading,setLoading]=useState(true);
  const [showModal,setShowModal]=useState(false);
  const [search,setSearch]=useState("");
  const [county,setCounty]=useState("");
  const [expanded,setExpanded]=useState(null);

  const load=useCallback(()=>{
    setLoading(true);
    const p=new URLSearchParams({limit:12});
    if(search)p.set("search",search);
    if(county)p.set("county",county);
    api(`/api/requests?${p}`).then(d=>{
      setRequests(d.requests||[]);setTotal(d.total||0);
    }).catch(()=>{}).finally(()=>setLoading(false));
  },[search,county]);

  useEffect(()=>{load();},[load]);

  const deleteRequest=async(id)=>{
    if(!window.confirm("Delete this request?"))return;
    try{
      await api(`/api/requests/${id}`,{method:"DELETE"},token);
      setRequests(p=>p.filter(r=>r.id!==id));
      notify("Request deleted","success");
    }catch(err){notify(err.message,"error");}
  };

  if(compact) return <div style={{padding:"4px 0"}}>
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      {loading?<div style={{textAlign:"center",padding:20}}><Spin/></div>
        :requests.length===0?<div style={{textAlign:"center",padding:"20px 0",color:"#AAAAAA",fontSize:13}}>
          <div style={{fontSize:28,marginBottom:8,opacity:.3}}>🛒</div>
          No requests yet
        </div>
        :requests.slice(0,4).map(r=>(
          <div key={r.id} style={{padding:"12px 0",borderBottom:"1px solid #F0F0F0"}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:3,color:"#1A1A1A",lineHeight:1.3}}>{r.title}</div>
            <div style={{fontSize:12,color:"#777",lineHeight:1.5,marginBottom:6}}>{r.description?.slice(0,60)}{r.description?.length>60?"...":""}</div>
            <div style={{display:"flex",gap:6,alignItems:"center",justifyContent:"space-between"}}>
              {r.budget&&<span style={{fontSize:11,fontWeight:600,color:"#1428A0"}}>KSh {Number(r.budget).toLocaleString()}</span>}
              {user&&user.role==="seller"&&user.id!==r.user_id&&
                <button className="btn bp sm" style={{fontSize:11,padding:"4px 10px",borderRadius:6}} onClick={()=>setPitchTarget(r)}>📬 I Have This</button>}
            </div>
          </div>
        ))
      }
      <button style={{width:"100%",marginTop:12,padding:"10px",background:"#1428A0",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"var(--fn)"}}
        onClick={()=>{if(!user){onSignIn();return;}setShowModal(true);}}>+ Post a Request</button>
    </div>
    {pitchTarget&&<PitchModal request={pitchTarget} user={user} token={token} notify={notify} onClose={()=>setPitchTarget(null)} onOpenPostAd={(data)=>{onOpenPostAd(data);setPitchTarget(null);}}/>}
    {showModal&&<PostRequestModal token={token} notify={notify} onClose={()=>setShowModal(false)} onSuccess={r=>{setRequests(p=>[r,...p]);setTotal(t=>t+1);}}/>}
  </div>;

  return <div style={{background:"#FFFFFF",padding:"48px 40px",margin:"0 -48px",borderTop:"1px solid #EBEBEB",borderBottom:"1px solid #EBEBEB"}}>
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:28,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#767676",marginBottom:8}}>Community</div>
          <h2 style={{fontSize:"clamp(24px,3vw,36px)",fontWeight:500,letterSpacing:"-.01em",color:"#1D1D1D",fontFamily:"var(--fn)",lineHeight:1.1}}>🛒 What Buyers Want</h2>
          <p style={{fontSize:13,color:"#767676",marginTop:6}}>{total} active request{total!==1?"s":" "} from buyers looking for items</p>
        </div>
        <button style={{background:"#1D1D1D",color:"#fff",border:"none",padding:"12px 24px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"var(--fn)",borderRadius:8,whiteSpace:"nowrap"}}
          onClick={()=>{if(!user){onSignIn();return;}setShowModal(true);}}>
          + Post a Request
        </button>
      </div>

      {/* Search/filter */}
      <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
        <input style={{flex:1,minWidth:200,padding:"10px 14px",border:"1px solid #E0E0E0",outline:"none",fontSize:13,fontFamily:"var(--fn)",background:"#fff",color:"#1D1D1D"}}
          placeholder="Search requests..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <select style={{padding:"10px 14px",border:"1px solid #E0E0E0",outline:"none",fontSize:13,fontFamily:"var(--fn)",background:"#fff",cursor:"pointer",minWidth:140,color:"#1D1D1D"}}
          value={county} onChange={e=>setCounty(e.target.value)}>
          <option value="">All Counties</option>
          {["Nairobi","Mombasa","Kisumu","Nakuru","Eldoret","Kiambu","Machakos","Kajiado","Meru","Nyeri","Kisii","Kakamega"].map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        {(search||county)&&<button style={{padding:"10px 14px",border:"1px solid #E0E0E0",background:"#fff",cursor:"pointer",fontSize:12,fontFamily:"var(--fn)",color:"#636363"}} onClick={()=>{setSearch("");setCounty("");}}>✕ Clear</button>}
      </div>

      {/* Requests grid */}
      {loading?<div style={{textAlign:"center",padding:40}}><Spin s="32px"/></div>
        :requests.length===0?<div style={{textAlign:"center",padding:"40px 20px",color:"#767676"}}>
            <div style={{fontSize:40,marginBottom:12,opacity:.3}}>🛒</div>
            <div style={{fontWeight:700,fontSize:16,marginBottom:6}}>No requests yet</div>
            <div style={{fontSize:13}}>Be the first to post what you're looking for</div>
          </div>
        :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
          {requests.map(r=>(
            <div key={r.id} style={{background:"#fff",border:"1px solid #E5E5E5",padding:"18px 20px",position:"relative",transition:"border-color .15s",borderLeft:"3px solid #E0E0E0",borderRadius:12}}>
              {/* Header row */}
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8,gap:8}}>
                <div style={{fontWeight:700,fontSize:15,lineHeight:1.3,letterSpacing:"-.01em",flex:1}}>{r.title}</div>
                {user?.id===r.user_id&&<button onClick={()=>deleteRequest(r.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#AEAEB2",fontSize:14,padding:"0 2px",flexShrink:0}}>✕</button>}
              </div>
              {/* Description — expandable */}
              <div style={{fontSize:12,color:"#636363",lineHeight:1.65,marginBottom:10}}>
                {expanded===r.id||r.description.length<=120
                  ?r.description
                  :<>{r.description.slice(0,120)}... <button onClick={()=>setExpanded(r.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#111111",fontSize:12,fontWeight:600,padding:0}}>More</button></>
                }
                {expanded===r.id&&r.description.length>120&&<button onClick={()=>setExpanded(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#111111",fontSize:12,fontWeight:600,padding:"0 4px"}}>Less</button>}
              </div>
              {/* Tags */}
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                {r.budget&&<span style={{background:"rgba(0,0,0,.05)",color:"#111111",padding:"3px 10px",fontSize:11,fontWeight:700}}>Budget: {fmtKES(r.budget)}</span>}
                {r.county&&<span style={{background:"#F0F0F0",color:"#1428A0",padding:"3px 10px",fontSize:11,fontWeight:600}}>📍 {r.county}</span>}
              </div>
              {/* Footer */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:11,color:"#AEAEB2",borderTop:"1px solid #F0F0F0",paddingTop:10}}>
                <span>{r.requester_anon||"Anonymous"}</span>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  {parseInt(r.matching_listings)>0&&<span style={{color:"#1428A0",fontWeight:700}}>{r.matching_listings} listing{r.matching_listings!==1?"s":""} match</span>}
                  <span>{ago(r.created_at)}</span>
                  {user&&user.role==="seller"&&user.id!==r.user_id&&
                    <button className="btn bp sm" style={{fontSize:11,padding:"4px 10px"}} onClick={()=>setPitchTarget(r)}>📬 I Have This</button>
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      }

      {pitchTarget&&<PitchModal request={pitchTarget} user={user} token={token} notify={notify} onClose={()=>setPitchTarget(null)}/>}

      {total>12&&<div style={{textAlign:"center",marginTop:20}}>
        <button style={{background:"transparent",border:"1.5px solid #1D1D1D",color:"#1D1D1D",padding:"10px 28px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"var(--fn)"}} onClick={()=>{}}>
          View all {total} requests
        </button>
      </div>}
    </div>

    {showModal&&<PostRequestModal token={token} notify={notify} onClose={()=>setShowModal(false)} onSuccess={r=>{setRequests(p=>[r,...p]);setTotal(t=>t+1);}}/>}
  </div>;
}

function SoldSection({token,user}){
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [pg,setPg]=useState(1);
  const [total,setTotal]=useState(0);
  const [cat,setCat]=useState("");
  const PER=12;

  // How long from listing to sold
  const duration=(created,sold)=>{
    if(!created||!sold)return null;
    const ms=new Date(sold).getTime()-new Date(created).getTime();
    if(ms<0)return null;
    const days=Math.floor(ms/86400000);
    if(days===0)return"same day";
    if(days===1)return"1 day";
    if(days<7)return`${days} days`;
    if(days<30)return`${Math.floor(days/7)} week${Math.floor(days/7)>1?"s":""}`;
    return`${Math.floor(days/30)} month${Math.floor(days/30)>1?"s":""}`;
  };

  const fmtDate=ts=>{
    if(!ts)return"";
    return new Date(ts).toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"numeric"});
  };

  useEffect(()=>{
    setLoading(true);
    const params=new URLSearchParams({page:pg,limit:PER});
    if(cat)params.set("category",cat);
    api(`/api/listings/sold?${params}`).then(d=>{
      setItems(d.listings||[]);setTotal(d.total||0);
    }).catch(()=>{}).finally(()=>setLoading(false));
  },[pg,cat]);

  if(loading)return<div style={{textAlign:"center",padding:60}}><Spin s="36px"/></div>;

  if(items.length===0)return<div className="empty">
    <div style={{fontSize:56,marginBottom:16,opacity:.15}}>✅</div>
    <h3 style={{fontWeight:700,fontSize:20,marginBottom:8,letterSpacing:"-.02em"}}>No sold items yet</h3>
    <p style={{color:"#767676"}}>Completed sales will appear here</p>
  </div>;

  return<>
    {/* Stats bar */}
    <div style={{display:"flex",gap:0,border:"1px solid #E5E5E5",marginBottom:28,background:"#fff",borderRadius:12,overflow:"hidden",flexWrap:"wrap"}}>
      {[
        {label:"Total Sales",val:total},
        {label:"Categories",val:[...new Set(items.map(i=>i.category))].length},
        {label:"Avg Price",val:"KSh "+Math.round(items.reduce((a,l)=>a+(parseFloat(l.price)||0),0)/items.length).toLocaleString("en-KE")},
      ].map((s,i)=>(
        <div key={s.label} style={{flex:1,padding:"18px 20px",borderRight:i<2?"1px solid #E5E5E5":"none",textAlign:"center"}}>
          <div style={{fontSize:22,fontWeight:700,letterSpacing:"-.02em",color:"#111111"}}>{s.val}</div>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",color:"#767676",marginTop:3}}>{s.label}</div>
        </div>
      ))}
    </div>

    {/* Category filter */}
    {[...new Set(items.map(l=>l.category))].length>1&&<div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:24}}>
      <button onClick={()=>{setCat("");setPg(1);}} style={{padding:"7px 16px",background:cat===""?"#1D1D1D":"#F4F4F4",color:cat===""?"#fff":"#535353",border:"none",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"var(--fn)",transition:"all .15s"}}>All</button>
      {[...new Set(items.map(l=>l.category))].map(c=>(
        <button key={c} onClick={()=>{setCat(c);setPg(1);}} style={{padding:"7px 16px",background:cat===c?"#1D1D1D":"#F4F4F4",color:cat===c?"#fff":"#535353",border:"none",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"var(--fn)",transition:"all .15s"}}>{c}</button>
      ))}
    </div>}

    {/* Product grid */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:20}}>
      {items.map(l=>{
        const photo=Array.isArray(l.photos)?l.photos.find(p=>typeof p==="string")||l.photos[0]?.url||null:null;
        const dur=duration(l.created_at,l.sold_at);
        return<div key={l.id} style={{background:"#fff",border:"1px solid #E5E5E5",overflow:"hidden",borderRadius:12}}>
          {/* Image */}
          <div style={{aspectRatio:"4/3",background:"#F0F0F0",position:"relative",overflow:"hidden"}}>
            {photo?<img src={photo} alt={l.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              :<span style={{fontSize:40,position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",opacity:.15}}>📦</span>}
            {/* SOLD overlay */}
            <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{background:"#fff",color:"#1428A0",fontSize:11,fontWeight:700,padding:"5px 14px",letterSpacing:".08em",textTransform:"uppercase"}}>SOLD ✓</span>
            </div>
            {/* Sale channel badge */}
            {l.sold_channel&&<div style={{position:"absolute",top:8,left:8,background:"rgba(0,0,0,.75)",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 8px"}}>
              {l.sold_channel==="platform"?"🛒 Via WekaSoko":"🤝 Elsewhere"}
            </div>}
            {/* Rating */}
            {l.avg_rating>0&&<div style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,.65)",color:"#fff",fontSize:11,fontWeight:700,padding:"3px 8px",display:"flex",alignItems:"center",gap:3}}>
              <span style={{color:"#FFD700"}}>★</span>{Number(l.avg_rating).toFixed(1)}
            </div>}
          </div>

          {/* Info */}
          <div style={{padding:"14px 16px"}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"#767676",marginBottom:4}}>{l.category}</div>
            <div style={{fontWeight:700,fontSize:14,lineHeight:1.3,marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.title}</div>
            <div style={{fontSize:18,fontWeight:700,color:"#111111",letterSpacing:"-.02em",marginBottom:10}}>{fmtKES(l.price)}</div>

            {/* Timeline — listed → sold */}
            <div style={{background:"#F6F6F6",padding:"10px 12px",fontSize:11,lineHeight:1.8,borderRadius:8}}>
              <div style={{display:"flex",justifyContent:"space-between",color:"#1428A0"}}>
                <span>📅 Listed</span>
                <span style={{fontWeight:600}}>{fmtDate(l.created_at)}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",color:"#111111"}}>
                <span>✅ Sold</span>
                <span style={{fontWeight:600}}>{fmtDate(l.sold_at)}</span>
              </div>
              {dur&&<div style={{marginTop:4,paddingTop:6,borderTop:"1px solid #E5E5E5",color:"#636363",display:"flex",justifyContent:"space-between"}}>
                <span>⏱ Time to sell</span>
                <span style={{fontWeight:700,color:"#111111"}}>{dur}</span>
              </div>}
            </div>

            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:11,color:"#767676",marginTop:8}}>
              <span>📍 {l.county||l.location||"Kenya"}</span>
              {l.review_count>0&&<span style={{color:"#FFD700"}}>{"★".repeat(Math.round(l.avg_rating||0))}</span>}
            </div>
          </div>
        </div>;
      })}
    </div>

    {/* Pagination */}
    {Math.ceil(total/PER)>1&&<div style={{display:"flex",gap:6,justifyContent:"center",marginTop:32}}>
      {pg>1&&<button className="btn bs sm" onClick={()=>setPg(p=>p-1)}>← Prev</button>}
      <span style={{padding:"7px 14px",fontSize:13,color:"#767676",fontWeight:500}}>Page {pg} of {Math.ceil(total/PER)}</span>
      {pg<Math.ceil(total/PER)&&<button className="btn bs sm" onClick={()=>setPg(p=>p+1)}>Next →</button>}
    </div>}
  </>;
}
// ── REVIEWS SECTION ───────────────────────────────────────────────────────────
function StarPicker({value,onChange}){
  const [hover,setHover]=useState(0);
  return<div style={{display:"flex",gap:4,fontSize:28,cursor:"pointer"}}>
    {[1,2,3,4,5].map(s=><span key={s}
      style={{color:s<=(hover||value)?"#111111":"#E0E0E0",transition:"color .1s",userSelect:"none"}}
      onMouseEnter={()=>setHover(s)} onMouseLeave={()=>setHover(0)}
      onClick={()=>onChange(s)}>★</span>)}
  </div>;
}

function ReviewsSection({token,user,notify}){
  const [pending,setPending]=useState([]);
  const [myReviews,setMyReviews]=useState([]);
  const [reviewsAboutMe,setReviewsAboutMe]=useState(null);
  const [loading,setLoading]=useState(true);
  const [writing,setWriting]=useState(null); // listing object
  const [rating,setRating]=useState(0);
  const [comment,setComment]=useState("");
  const [submitting,setSubmitting]=useState(false);

  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const [pend,aboutMe]=await Promise.all([
        api("/api/reviews/my-pending",{},token).catch(()=>[]),
        api(`/api/reviews/user/${user.id}`,{},token).catch(()=>({reviews:[],stats:{}})),
      ]);
      setPending(Array.isArray(pend)?pend:[]);
      setReviewsAboutMe(aboutMe);
    }finally{setLoading(false);}
  },[token,user.id]);

  useEffect(()=>{load();},[load]);

  const submit=async()=>{
    if(!rating){notify("Please select a star rating","warning");return;}
    setSubmitting(true);
    try{
      await api("/api/reviews",{method:"POST",body:JSON.stringify({listing_id:writing.id,rating,comment})},token);
      notify("⭐ Review submitted!","success");
      setWriting(null);setRating(0);setComment("");
      load();
    }catch(e){notify(e.message||"Failed to submit","error");}
    finally{setSubmitting(false);}
  };

  if(loading)return<div style={{textAlign:"center",padding:40}}><Spin s="36px"/></div>;

  const stats=reviewsAboutMe?.stats;
  const reviews=reviewsAboutMe?.reviews||[];

  return<>
    {/* My rating summary */}
    {stats&&(stats.review_count>0)&&<div style={{background:"#F5F5F5",border:"1px solid #E8E8E8",borderRadius:6,padding:"18px 20px",marginBottom:18,display:"flex",gap:16,alignItems:"center"}}>
      <div style={{textAlign:"center",flexShrink:0}}>
        <div style={{fontSize:44,fontWeight:700,color:"#111111",lineHeight:1}}>{Number(stats.avg_rating||0).toFixed(1)}</div>
        <div style={{fontSize:16,color:"#1428A0",marginTop:2}}>{"★".repeat(Math.round(stats.avg_rating||0))}{"☆".repeat(5-Math.round(stats.avg_rating||0))}</div>
      </div>
      <div>
        <div style={{fontWeight:700,fontSize:16,marginBottom:2}}>Your Rating</div>
        <div style={{fontSize:13,color:"#888888"}}>{stats.review_count} review{stats.review_count!==1?"s":""} from transactions</div>
        <div style={{fontSize:12,color:"#CCCCCC",marginTop:4}}>Reviews are left by buyers and sellers after a completed sale</div>
      </div>
    </div>}

    {/* Pending reviews to write */}
    {pending.length>0&&<>
      <div className="lbl" style={{marginBottom:10}}>⭐ Leave a Review ({pending.length} pending)</div>
      <div className="alert ay" style={{fontSize:12,marginBottom:14}}>
        You can leave a review after a transaction is complete. Reviews help build trust on Weka Soko.
      </div>
      {pending.map(p=><div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 15px",background:"rgba(176,127,16,.06)",border:"1px solid rgba(176,127,16,.2)",borderRadius:6,marginBottom:10}}>
        <span style={{fontSize:24}}>⭐</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.title}</div>
          <div style={{fontSize:11,color:"#888888"}}>You were the {p.my_role} · Rate the {p.my_role==="buyer"?"seller":"buyer"}</div>
        </div>
        <button className="btn bp sm" onClick={()=>{setWriting(p);setRating(0);setComment("");}}>Write Review</button>
      </div>)}
    </>}

    {/* Review form */}
    {writing&&<div style={{background:"#F5F5F5",border:"1px solid #E8E8E8",borderRadius:6,padding:"18px 20px",marginBottom:18}}>
      <div style={{fontWeight:700,marginBottom:4}}>Review for: {writing.title}</div>
      <div style={{fontSize:12,color:"#888888",marginBottom:14}}>Rate the {writing.my_role==="buyer"?"seller":"buyer"} on this transaction</div>
      <div style={{marginBottom:14}}>
        <div className="lbl" style={{marginBottom:6}}>Rating *</div>
        <StarPicker value={rating} onChange={setRating}/>
        <div style={{fontSize:11,color:"#888888",marginTop:4}}>{["","Poor","Below average","Average","Good","Excellent"][rating]||""}</div>
      </div>
      <FF label="Comment (optional)" hint="Share your experience with this transaction">
        <textarea className="inp" rows={3} placeholder="Great seller, item exactly as described..." value={comment} onChange={e=>setComment(e.target.value)} style={{resize:"vertical"}}/>
      </FF>
      <div style={{display:"flex",gap:8}}>
        <button className="btn bs" onClick={()=>{setWriting(null);setRating(0);setComment("");}}>Cancel</button>
        <button className="btn bp" style={{flex:1}} onClick={submit} disabled={submitting||!rating}>{submitting?<Spin/>:"Submit Review ⭐"}</button>
      </div>
    </div>}

    {/* Reviews about me */}
    <div className="lbl" style={{marginBottom:10}}>Reviews About You ({reviews.length})</div>
    {reviews.length===0?<div style={{color:"#888888",fontSize:13,padding:"20px 0",textAlign:"center"}}>
      No reviews yet. Complete a transaction to start building your reputation.
    </div>:reviews.map((r,i)=><div key={r.id||i} style={{padding:"14px 16px",background:"#F5F5F5",borderRadius:6,marginBottom:10,border:"1px solid #E8E8E8"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:16,color:"#1428A0"}}>{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</span>
          <span style={{fontWeight:700,fontSize:14}}>{r.rating}/5</span>
          <span className={`badge ${r.reviewer_role==="buyer"?"bg-b":"bg-g"}`} style={{fontSize:10}}>{r.reviewer_role==="buyer"?"🛍 Buyer":"🏷 Seller"}</span>
        </div>
        <span style={{fontSize:11,color:"#CCCCCC"}}>{ago(r.created_at)}</span>
      </div>
      {r.comment&&<p style={{fontSize:13,color:"var(--txt)",lineHeight:1.7,marginBottom:4}}>"{r.comment}"</p>}
      <div style={{fontSize:11,color:"#CCCCCC"}}>Re: {r.listing_title} · From {r.reviewer_anon||"Anonymous"}</div>
    </div>)}
  </>;
}

// ── DASHBOARD (REVAMPED) ──────────────────────────────────────────────────────

// ── MY REQUESTS TAB ────────────────────────────────────────────────────────
function MyRequestsTab({token,notify,user}){
  const [requests,setRequests]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showModal,setShowModal]=useState(false);

  const load=useCallback(()=>{
    setLoading(true);
    api("/api/requests/mine",{},token).catch(()=>[]).then(r=>{setRequests(Array.isArray(r)?r:[]);setLoading(false);});
  },[token]);

  useEffect(()=>{load();},[load]);

  const deleteRequest=async(id)=>{
    if(!window.confirm("Delete this request?"))return;
    try{
      await api(`/api/requests/${id}`,{method:"DELETE"},token);
      setRequests(p=>p.filter(r=>r.id!==id));
      notify("Request deleted","success");
    }catch(err){notify(err.message,"error");}
  };

  if(loading)return<div style={{textAlign:"center",padding:40}}><Spin s="32px"/></div>;

  return<>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
      <div className="lbl" style={{margin:0}}>My Requests ({requests.length})</div>
      <button className="btn bp sm" onClick={()=>setShowModal(true)}>+ New Request</button>
    </div>
    {requests.length===0
      ?<div className="empty" style={{padding:"32px 0"}}>
          <div style={{fontSize:40,marginBottom:12,opacity:.2}}>🛒</div>
          <p style={{fontWeight:700,marginBottom:6}}>No requests yet</p>
          <p style={{fontSize:13,color:"#888888"}}>Post a request to let sellers know what you're looking for</p>
          <button className="btn bp" style={{marginTop:14}} onClick={()=>setShowModal(true)}>Post a Request →</button>
        </div>
      :requests.map(r=>(
        <div key={r.id} style={{padding:"14px 16px",background:"#F5F5F5",borderRadius:6,marginBottom:10,border:"1px solid #E8E8E8",borderLeft:"3px solid #E0E0E0"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:6}}>
            <div style={{fontWeight:700,fontSize:14}}>{r.title}</div>
            <button onClick={()=>deleteRequest(r.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#CCCCCC",fontSize:14,padding:"0 2px",flexShrink:0}}>✕</button>
          </div>
          <div style={{fontSize:12,color:"#888888",marginBottom:8,lineHeight:1.6}}>{r.description}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
            {r.budget&&<span className="badge bg-g">Budget: {fmtKES(r.budget)}</span>}
            {r.county&&<span className="badge bg-m">📍 {r.county}</span>}
            <span className={`badge ${r.status==="active"?"bg-g":"bg-m"}`}>{r.status}</span>
          </div>
          <div style={{fontSize:11,color:"#CCCCCC"}}>{ago(r.created_at)}</div>
        </div>
      ))
    }
    {showModal&&<PostRequestModal token={token} notify={notify} onClose={()=>setShowModal(false)} onSuccess={r=>{setRequests(p=>[r,...p]);}}/>}
  </>;
}

function Dashboard({user,token,notify,onPostAd,onClose}){
  const [tab,setTab]=useState("overview");
  const [listings,setListings]=useState([]);
  const [buyerInterests,setBuyerInterests]=useState([]);
  const [myRequests,setMyRequests]=useState([]);
  const [notifs,setNotifs]=useState([]);
  const [threads,setThreads]=useState([]);
  const [stats,setStats]=useState(null);
  const [loading,setLoading]=useState(true);
  const [selectedListing,setSelectedListing]=useState(null);
  const [showPayModal,setShowPayModal]=useState(null);
  const [editingListing,setEditingListing]=useState(null);
  const [markSoldListing,setMarkSoldListing]=useState(null);

  useEffect(()=>{
    const load=async(silent=false)=>{
      if(!silent)setLoading(true);
      try{
        const [ls,ns,th]=await Promise.all([
          user.role==="seller"?api("/api/listings/seller/mine",{},token).catch(()=>[]):Promise.resolve([]),
          api("/api/notifications",{},token).catch(()=>[]),
          api("/api/chat/threads/mine",{},token).catch(()=>[]),
        ]);
        if(user.role==="buyer"){
          api("/api/listings/buyer/interests",{},token).catch(()=>[]).then(r=>setBuyerInterests(Array.isArray(r)?r:[]));
        }
        api("/api/requests/mine",{},token).catch(()=>[]).then(r=>setMyRequests(Array.isArray(r)?r:[]));
        const lArr=Array.isArray(ls)?ls:(ls.listings||[]);
        setListings(lArr);
        setNotifs(Array.isArray(ns)?ns:[]);
        setThreads(Array.isArray(th)?th:[]);
        setStats({
          totalListings:lArr.length,
          activeListings:lArr.filter(l=>l.status==="active").length,
          soldListings:lArr.filter(l=>l.status==="sold").length,
          totalViews:lArr.reduce((a,l)=>a+(l.view_count||0),0),
          buyersWaiting:lArr.filter(l=>l.locked_buyer_id&&!l.is_unlocked).length,
          totalRevenue:lArr.filter(l=>l.status==="sold").length*250,
          unreadNotifs:(Array.isArray(ns)?ns:[]).filter(n=>!n.is_read).length,
          unreadMessages:(Array.isArray(th)?th:[]).reduce((a,t)=>a+parseInt(t.unread_count||0),0),
        });
      }finally{if(!silent)setLoading(false);}
    };
    load(false);
    // Silent background refresh: listings+notifs every 45s, threads every 30s
    const iv=setInterval(()=>load(true),45000);
    return()=>clearInterval(iv);
  },[token]);

  const markRead=async id=>{
    await api(`/api/notifications/${id}/read`,{method:"PATCH"},token).catch(()=>{});
    setNotifs(p=>p.map(n=>n.id===id?{...n,is_read:true}:n));
  };

  const deleteListing=async id=>{
    if(!window.confirm("Delete this listing permanently?"))return;
    try{await api(`/api/listings/${id}`,{method:"DELETE"},token);setListings(p=>p.filter(l=>l.id!==id));notify("Listing deleted.","success");}
    catch(err){notify(err.message,"error");}
  };

  const unreadCount=(notifs.filter(n=>!n.is_read).length||0)+(threads.reduce((a,t)=>a+parseInt(t.unread_count||0),0)||0);

  return <>
    {/* Dashboard Hero Header */}
    <div style={{background:"linear-gradient(135deg,#1428A0 0%,#0F1F8A 100%)",padding:"clamp(24px,4vw,48px) clamp(16px,4vw,40px) 0",marginBottom:0}}>
      <div>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:16,marginBottom:28}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"rgba(255,255,255,.6)",marginBottom:10}}>My Account</div>
            <div style={{display:"flex",alignItems:"center",gap:16}}>
              <div style={{width:64,height:64,borderRadius:"50%",background:"rgba(255,255,255,.2)",border:"3px solid rgba(255,255,255,.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,color:"#fff",fontWeight:700,flexShrink:0}}>
                {user.name?.charAt(0)?.toUpperCase()||"U"}
              </div>
              <div>
                <h1 style={{fontSize:"clamp(22px,3vw,32px)",fontWeight:500,color:"#fff",fontFamily:"var(--fn)",marginBottom:4,letterSpacing:"-.02em"}}>{user.name}</h1>
                <div style={{fontSize:13,color:"rgba(255,255,255,.7)",marginBottom:8}}>{user.email}</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <span style={{background:"rgba(255,255,255,.2)",color:"#fff",padding:"3px 12px",fontSize:11,fontWeight:700,letterSpacing:".04em"}}>{user.role==="seller"?"🏷 SELLER":"🛍 BUYER"}</span>
                  {user.is_verified&&<span style={{background:"rgba(255,255,255,.2)",color:"#fff",padding:"3px 12px",fontSize:11,fontWeight:700,letterSpacing:".04em"}}>✓ VERIFIED</span>}
                  {unreadCount>0&&<span style={{background:"#FF3B30",color:"#fff",padding:"3px 12px",fontSize:11,fontWeight:700,letterSpacing:".04em"}}>{unreadCount} UNREAD</span>}
                </div>
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {user.role==="seller"&&<button className="btn bp sm" style={{background:"#fff",color:"#1428A0",border:"none",fontWeight:700}} onClick={()=>{onClose();onPostAd();}}>+ Post Ad</button>}
            <button className="btn bs sm" style={{border:"1px solid rgba(255,255,255,.4)",color:"#fff",background:"transparent"}} onClick={onClose}>← Back to Home</button>
          </div>
        </div>

        {/* Tab row — flush to bottom of hero */}
        <div style={{display:"flex",gap:0,overflowX:"auto",borderBottom:"none",WebkitOverflowScrolling:"touch"}}>
          {(user.role==="seller"
            ?[["overview","Overview"],["notifications","Notifications"+(unreadCount>0?` (${unreadCount})`:"")] ,["ads","My Ads"],["sold","Sold"],["requests","Requests"],["reviews","Reviews"],["settings","Settings"]]
            :[["overview","Overview"],["notifications","Notifications"+(unreadCount>0?` (${unreadCount})`:"")] ,["interests","My Interests"],["requests","Requests"],["reviews","Reviews"],["settings","Settings"]]
          ).map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{padding:"14px 22px",border:"none",background:"transparent",cursor:"pointer",fontSize:13,fontWeight:700,letterSpacing:".04em",whiteSpace:"nowrap",color:tab===id?"#fff":"rgba(255,255,255,.55)",borderBottom:tab===id?"3px solid #fff":"3px solid transparent",transition:"all .15s",fontFamily:"var(--fn)"}}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* Dashboard Content */}
    <div style={{padding:"clamp(20px,4vw,40px) clamp(16px,4vw,48px) 80px"}}>

    {loading&&<div style={{textAlign:"center",padding:80}}><Spin s="40px"/></div>}

    {!loading&&tab==="overview"&&stats&&<>
      {/* Stats grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:12,marginBottom:28}}>
        {(user.role==="seller"
          ? [
              {icon:"📦",label:"Total Ads",val:stats.totalListings,color:"#1428A0",bg:"#F4F4F4"},
              {icon:"✅",label:"Active",val:stats.activeListings,color:"#16a34a",bg:"rgba(22,163,74,.06)"},
              {icon:"🏆",label:"Sold",val:stats.soldListings,color:"#1428A0",bg:"rgba(0,0,0,.04)"},
              {icon:"👁",label:"Total Views",val:stats.totalViews,color:"#1428A0",bg:"#F4F4F4"},
              {icon:"🔥",label:"Buyers Waiting",val:stats.buyersWaiting,color:"#444444",bg:"rgba(0,0,0,.04)"},
              {icon:"💬",label:"Unread Msgs",val:stats.unreadMessages,color:"#1428A0",bg:"#F4F4F4"},
            ]
          : [
              {icon:"🔔",label:"Unread",val:unreadCount||0,color:"#1428A0",bg:"#F4F4F4"},
            ]
        ).map(s=>(
          <div key={s.label} style={{background:s.bg,border:`1px solid ${s.color}22`,borderRadius:6,padding:"20px 22px",transition:"transform .15s",cursor:"default"}}
            onMouseOver={e=>e.currentTarget.style.transform="translateY(-2px)"}
            onMouseOut={e=>e.currentTarget.style.transform="translateY(0)"}>
            <div style={{fontSize:24,marginBottom:8}}>{s.icon}</div>
            <div style={{fontSize:32,fontWeight:700,color:s.color,letterSpacing:"-.02em",lineHeight:1}}>{s.val}</div>
            <div style={{fontSize:12,color:"#888888",marginTop:6,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Buyers waiting — action items */}
      {stats.buyersWaiting>0&&<>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <h3 style={{fontSize:15,fontWeight:700,letterSpacing:"-.01em"}}>🔥 Action Required — Buyers Waiting</h3>
          <span className="badge bg-r">{stats.buyersWaiting} waiting</span>
        </div>
        {listings.filter(l=>l.locked_buyer_id&&!l.is_unlocked).map(l=>(
          <div key={l.id} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px",background:"rgba(0,0,0,.04)",border:"1px solid rgba(0,0,0,.1)",borderLeft:"3px solid #888888",borderRadius:6,marginBottom:10}}>
            <span style={{fontSize:32}}>🔥</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:2}}>{l.title}</div>
              <div style={{fontSize:12,color:"#888888"}}>A buyer has locked in! Pay KSh 250 to reveal their contact details.</div>
            </div>
            <button className="btn bp sm" onClick={()=>setShowPayModal(l)}>Unlock → KSh 250</button>
          </div>
        ))}
        <div style={{height:8}}/>
      </>}

      {/* Recent listings */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <h3 style={{fontSize:15,fontWeight:700,letterSpacing:"-.01em"}}>Recent Ads</h3>
        {listings.length>4&&<button className="btn bgh sm" onClick={()=>setTab("ads")} style={{fontSize:12}}>View all →</button>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
        {listings.slice(0,4).map(l=>{
          const photo=Array.isArray(l.photos)?l.photos.find(p=>typeof p==="string")||l.photos[0]?.url||null:null;
          return <div key={l.id} style={{background:"#fff",border:"1px solid #EBEBEB",borderRadius:6,overflow:"hidden",transition:"box-shadow .2s"}}
            onMouseOver={e=>e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.08)"}
            onMouseOut={e=>e.currentTarget.style.boxShadow="none"}>
            <div style={{height:120,background:"#F5F5F5",overflow:"hidden",position:"relative"}}>
              {photo?<img src={photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:36,opacity:.15}}>📦</div>}
              <div style={{position:"absolute",top:8,right:8}}>
                <span className={`badge ${l.status==="active"||l.status==="locked"?"bg-g":l.status==="sold"?"bg-y":l.status==="pending_review"?"bg-b":l.status==="rejected"?"br2":"bg-m"}`} style={{fontSize:10}}>{l.status==="pending_review"?"⏳ Review":l.status==="rejected"?"❌ Rejected":l.status}</span>
              </div>
            </div>
            <div style={{padding:"12px 14px"}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.title}</div>
              <div style={{fontSize:12,color:"#1428A0",fontWeight:700}}>{fmtKES(l.price)}</div>
              <div style={{fontSize:11,color:"#888888",marginTop:4}}>👁 {l.view_count||0} views · 🔥 {l.interest_count||0} interested</div>
            </div>
          </div>;
        })}
      </div>
      {listings.length===0&&<div style={{textAlign:"center",padding:"60px 20px",background:"#f9f9f9",border:"1px dashed #E5E5E5"}}>
        <div style={{fontSize:48,marginBottom:12,opacity:.2}}>📦</div>
        <p style={{fontWeight:700,marginBottom:8}}>No ads yet</p>
        {user.role==="seller"&&<button className="btn bp" style={{marginTop:8}} onClick={()=>{onClose();onPostAd();}}>Post Your First Ad →</button>}
      </div>}
    </>}

    {!loading&&tab==="notifications"&&<>
      {/* Chat Threads */}
      {threads.length>0&&<>
        <h3 style={{fontSize:15,fontWeight:700,marginBottom:14,letterSpacing:"-.01em"}}>💬 Chat Threads</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:12,marginBottom:32}}>
          {threads.map((t,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:"#fffA0",border:"1px solid #EBEBEB",borderRadius:6,cursor:"pointer",transition:"border-color .15s"}}
              onMouseOver={e=>e.currentTarget.style.borderColor="#111111"}
              onMouseOut={e=>e.currentTarget.style.borderColor="#EBEBEB"}
              onClick={()=>setSelectedListing({id:t.listing_id,title:t.title,seller_id:t.seller_id,is_unlocked:t.is_unlocked||false,locked_buyer_id:t.locked_buyer_id})}>
              <div style={{position:"relative",flexShrink:0}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:"#1428A0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#fff",fontWeight:700}}>
                  {t.other_party_anon?.charAt(0)?.toUpperCase()||"?"}
                </div>
                {t.is_online&&<div style={{position:"absolute",bottom:1,right:1,width:11,height:11,background:"#22C55E",borderRadius:"50%",border:"2px solid #fff"}}/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                <div style={{fontSize:12,color:"#888888",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.last_message?.slice(0,45)||"No messages"}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:11,color:"#CCCCCC"}}>{ago(t.last_message_at)}</div>
                {parseInt(t.unread_count||0)>0&&<div style={{background:"#0F1F8A",color:"#fff",borderRadius:10,fontSize:10,fontWeight:700,padding:"2px 7px",marginTop:4,display:"inline-block"}}>{t.unread_count}</div>}
              </div>
            </div>
          ))}
        </div>
      </>}

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <h3 style={{fontSize:15,fontWeight:700,letterSpacing:"-.01em"}}>🔔 All Notifications</h3>
        {notifs.length>0&&<button className="btn bs sm" style={{fontSize:11}} onClick={async()=>{await api("/api/notifications/read-all",{method:"PATCH"},token).catch(()=>{});setNotifs(p=>p.map(n=>({...n,is_read:true})));notify("All marked as read.","success");}}>Mark All Read</button>}
      </div>
      {notifs.length===0&&threads.length===0&&<div style={{textAlign:"center",padding:"60px 20px",background:"#f9f9f9",border:"1px dashed #E5E5E5"}}>
        <div style={{fontSize:48,marginBottom:12,opacity:.2}}>🔔</div><p>No notifications yet</p>
      </div>}
      <div style={{maxWidth:680}}>
        {notifs.map((n,i)=>(
          <div key={i} onClick={()=>markRead(n.id)} style={{display:"flex",gap:14,padding:"16px 0",borderBottom:"1px solid #F5F5F5",cursor:"pointer",opacity:n.is_read?.7:1,transition:"opacity .15s"}}
            onMouseOver={e=>e.currentTarget.style.paddingLeft="8px"}
            onMouseOut={e=>e.currentTarget.style.paddingLeft="0"}>
            <div style={{width:40,height:40,borderRadius:"50%",background:n.is_read?"#F5F5F5":"#E8E8E8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
              {({new_message:"💬",buyer_locked_in:"🔥",escrow_released:"💰",payment_confirmed:"✅",warning:"⚠️",admin_edit:"🛠",suspension:"🚫",seller_pitch:"📬",pitch_accepted:"✅",request_match:"🛒"})[n.type]||"🔔"}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:n.is_read?500:700,fontSize:14,marginBottom:2}}>{n.title}</div>
              <div style={{fontSize:13,color:"#888888",lineHeight:1.6}}>{n.body}</div>
              <div style={{fontSize:11,color:"#CCCCCC",marginTop:4}}>{ago(n.created_at)}</div>
            </div>
            {!n.is_read&&<div style={{width:8,height:8,background:"#1428A0",borderRadius:"50%",flexShrink:0,marginTop:6}}/>}
          </div>
        ))}
      </div>
    </>}

    {!loading&&tab==="interests"&&<>
      <h3 style={{fontSize:15,fontWeight:700,marginBottom:16,letterSpacing:"-.01em"}}>🔥 Listings You're Interested In ({buyerInterests.length})</h3>
      {buyerInterests.length===0
        ?<div style={{textAlign:"center",padding:"60px 20px",background:"#f9f9f9",border:"1px dashed #E5E5E5"}}>
          <div style={{fontSize:48,marginBottom:12,opacity:.2}}>🔥</div>
          <p style={{fontWeight:700,marginBottom:6}}>No interests yet</p>
          <p style={{fontSize:13,color:"#888888"}}>Browse listings and click "I'm Interested — Lock In"</p>
          <button className="btn bp" style={{marginTop:14}} onClick={onClose}>Browse Listings →</button>
        </div>
        :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:14}}>
          {buyerInterests.map(l=>{
            const photo=Array.isArray(l.photos)?l.photos.find(p=>typeof p==="string")||l.photos[0]?.url||null:null;
            return <div key={l.id} style={{background:"#fff",border:"1px solid #EBEBEB",borderRadius:6,overflow:"hidden",transition:"box-shadow .2s"}}
              onMouseOver={e=>e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.08)"}
              onMouseOut={e=>e.currentTarget.style.boxShadow="none"}>
              <div style={{height:140,background:"#F5F5F5",overflow:"hidden",position:"relative"}}>
                {photo?<img src={photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:40,opacity:.15}}>📦</div>}
                <span className={`badge ${l.status==="active"||l.status==="locked"?"bg-g":l.status==="sold"?"bg-y":"bg-m"}`} style={{position:"absolute",top:8,right:8,fontSize:10}}>{l.status}</span>
              </div>
              <div style={{padding:"14px 16px"}}>
                <div style={{fontWeight:700,fontSize:14,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.title}</div>
                <div style={{fontSize:14,fontWeight:700,color:"#111111",marginBottom:8}}>{fmtKES(l.price)}</div>
                {l.is_unlocked
                  ?<div style={{fontSize:11,color:"#16a34a",fontWeight:600,marginBottom:8}}>✅ Contact revealed — {l.seller_name||"Seller"}</div>
                  :<div style={{fontSize:11,color:"#888888",marginBottom:8}}>🔒 Contact hidden</div>}
                <button className="btn bs sm" style={{width:"100%",fontSize:11}} onClick={()=>setSelectedListing(l)}>💬 Chat</button>
              </div>
            </div>;
          })}
        </div>}
    </>}

    {!loading&&tab==="ads"&&<>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <h3 style={{fontSize:15,fontWeight:700,letterSpacing:"-.01em"}}>Your Listings ({listings.length})</h3>
        {user.role==="seller"&&<button className="btn bp sm" onClick={()=>{onClose();onPostAd();}}>+ New Ad</button>}
      </div>
      {listings.length===0
        ?<div style={{textAlign:"center",padding:"60px 20px",background:"#f9f9f9",border:"1px dashed #E5E5E5"}}>
          <div style={{fontSize:48,marginBottom:12,opacity:.2}}>📦</div><p>No ads yet</p>
        </div>
        :<div style={{display:"flex",flexDirection:"column",gap:12}}>
          {listings.map(l=>(
            <div key={l.id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",background:"#fff",border:"1px solid #EBEBEB",borderRadius:6,transition:"border-color .15s"}}
              onMouseOver={e=>e.currentTarget.style.borderColor="#111111"}
              onMouseOut={e=>e.currentTarget.style.borderColor="#EBEBEB"}>
              <div style={{width:56,height:46,borderRadius:6,background:"#F5F5F5",overflow:"hidden",flexShrink:0}}>
                {Array.isArray(l.photos)&&l.photos[0]&&<img src={typeof l.photos[0]==="string"?l.photos[0]:l.photos[0]?.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.title}</div>
                <div style={{fontSize:12,color:"#888888",marginTop:2}}>{fmtKES(l.price)} · 👁 {l.view_count||0} · 🔥 {l.interest_count||0}</div>
                {l.status==="rejected"&&l.moderation_note&&<div style={{fontSize:11,color:"#dc2626",marginTop:2}}>❌ {l.moderation_note}</div>}
                {l.status==="pending_review"&&<div style={{fontSize:11,color:"#111111",marginTop:2}}>⏳ Awaiting review</div>}
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end",flexShrink:0}}>
                <span className={`badge ${l.status==="active"||l.status==="locked"?"bg-g":l.status==="sold"?"bg-y":l.status==="pending_review"?"bg-b":l.status==="rejected"?"br2":"bg-m"}`} style={{fontSize:10}}>{l.status==="pending_review"?"⏳ Review":l.status==="rejected"?"❌ Rejected":l.status}</span>
                {!l.is_unlocked&&l.status!=="sold"&&(l.free_unlock_approved
                  ?<button className="btn bg2 sm" onClick={async()=>{try{await api(`/api/payments/unlock`,{method:"POST",body:JSON.stringify({listing_id:l.id,phone:user.phone||"0700000000",voucher_code:"ADMIN-FREE"})},token);setListings(p=>p.map(x=>x.id===l.id?{...x,is_unlocked:true}:x));notify("🔓 Unlocked!","success");}catch{setShowPayModal(l);}}}>🎁 Free</button>
                  :<button className="btn bp sm" onClick={()=>setShowPayModal(l)}>🔓 Unlock</button>)}
                {(l.status==="active"||l.status==="locked")&&<button className="btn bp sm" onClick={()=>setMarkSoldListing(l)}>✅ Sold</button>}
                {l.status!=="sold"&&<button className="btn bs sm" onClick={()=>setEditingListing(l)}>✏️</button>}
                {(l.status==="rejected"||l.status==="needs_changes")&&<button className="btn bg2 sm" onClick={async()=>{try{await api(`/api/listings/${l.id}/resubmit`,{method:"POST"},token);setListings(p=>p.map(x=>x.id===l.id?{...x,status:"pending_review",moderation_note:null}:x));notify("⏳ Resubmitted","success");}catch(e){notify(e.message,"error");}}}>↺</button>}
                <button className="btn br2 sm" onClick={()=>deleteListing(l.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>}
    </>}

    {!loading&&tab==="sold"&&<SoldSection token={token} user={user}/>}
    {!loading&&tab==="reviews"&&<ReviewsSection token={token} user={user} notify={notify}/>}
    {!loading&&tab==="requests"&&<MyRequestsTab token={token} notify={notify} user={user}/>}

    {!loading&&tab==="settings"&&<>
      <div style={{maxWidth:520,display:"flex",flexDirection:"column",gap:12}}>
        <div style={{padding:"20px 22px",background:"#fff",border:"1px solid #EBEBEB",borderRadius:6}}>
          <div className="lbl" style={{marginBottom:12}}>Account Info</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:14,padding:"10px 0",borderBottom:"1px solid #F5F5F5"}}>
              <span style={{color:"#888888"}}>Name</span><span style={{fontWeight:600}}>{user.name}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:14,padding:"10px 0",borderBottom:"1px solid #F5F5F5"}}>
              <span style={{color:"#888888"}}>Email</span><span style={{fontWeight:600}}>{user.email}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:14,padding:"10px 0"}}>
              <span style={{color:"#888888"}}>Role</span>
              <span className={`badge ${user.role==="seller"?"bg-g":"bg-b"}`}>{user.role==="seller"?"🏷 Seller":"🛍 Buyer"}</span>
            </div>
          </div>
        </div>
        <RoleSwitcher user={user} token={token} notify={notify} onSwitch={newUser=>{localStorage.setItem("ws_user",JSON.stringify(newUser));window.location.reload();}}/>
        <button className="btn bs" style={{justifyContent:"flex-start",gap:10}} onClick={()=>{localStorage.removeItem("ws_token");localStorage.removeItem("ws_user");onClose();window.location.reload();}}>🚪 Sign Out</button>
        <button className="btn br2" style={{justifyContent:"flex-start",gap:10}} onClick={async()=>{
          if(!window.confirm("Permanently delete your account? ALL your listings and data will be removed forever. This CANNOT be undone."))return;
          try{await api("/api/auth/account",{method:"DELETE",body:JSON.stringify({})},token);localStorage.removeItem("ws_token");localStorage.removeItem("ws_user");onClose();window.location.reload();}
          catch(err){notify(err.message,"error");}
        }}>🗑 Delete My Account</button>
      </div>
    </>}

    {/* Modals */}
    {selectedListing&&<ChatModal listing={selectedListing} user={user} token={token} onClose={()=>setSelectedListing(null)} notify={notify}/>}
    {editingListing&&<PostAdModal listing={editingListing} token={token} notify={notify} onClose={()=>setEditingListing(null)} onSuccess={(updated)=>{setListings(p=>p.map(l=>l.id===updated.id?updated:l));setEditingListing(null);}}/>}
    {markSoldListing&&<MarkSoldModal listing={markSoldListing} token={token} notify={notify} onClose={()=>setMarkSoldListing(null)} onSuccess={(id,channel)=>setListings(p=>p.map(l=>l.id===id?{...l,status:"sold",sold_channel:channel}:l))}/>}
    {showPayModal&&<PayModal type="unlock" listingId={showPayModal.id} amount={250} purpose={`Unlock buyer contact for: ${showPayModal.title}`} token={token} user={user} allowVoucher={true}
      onSuccess={async(result)=>{
        const lid=showPayModal.id;setShowPayModal(null);
        try{const fresh=await api(`/api/listings/${lid}`,{},token);const ul=fresh.listing||fresh;setListings(p=>p.map(l=>l.id===lid?ul:l));}
        catch{setListings(p=>p.map(l=>l.id===lid?{...l,is_unlocked:true}:l));}
        notify("🔓 Buyer contact unlocked!","success");
      }}
      onClose={()=>setShowPayModal(null)} notify={notify}/>}
    </div>
  </>;
}


// ── PITCH MODAL — Seller pitches to a buyer request ─────────────────────────
function PitchModal({request, user, token, notify, onClose}) {
  const [msg, setMsg] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!msg.trim()) return notify("Please write a pitch message","error");
    if (msg.length > 200) return notify("Message must be 200 characters or less","error");
    setLoading(true);
    try {
      await api("/api/pitches", {method:"POST", body:JSON.stringify({
        request_id: request.id,
        message: msg.trim(),
        price: price ? parseFloat(price) : undefined
      })}, token);
      notify("📬 Pitch sent! The buyer will be notified.","success");
      onClose();
    } catch(e) { notify(e.message,"error"); }
    finally { setLoading(false); }
  };

  return <Modal title="📬 I Have This!" onClose={onClose} footer={
    <><button className="btn bs" onClick={onClose}>Cancel</button>
      <button className="btn bp" onClick={submit} disabled={loading||!msg.trim()}>{loading?<Spin/>:"Send Pitch →"}</button></>
  }>
    <div style={{marginBottom:16,padding:"12px 14px",background:"#F5F5F5",borderRadius:6}}>
      <div style={{fontWeight:600,fontSize:14,marginBottom:4}}>{request.title}</div>
      <div style={{fontSize:12,color:"#888888"}}>
        {request.description?.slice(0,100)}{request.description?.length>100?"...":""}
      </div>
      {request.budget&&<div style={{fontSize:12,color:"#1428A0",fontWeight:700,marginTop:6}}>Budget: {fmtKES(request.budget)}</div>}
    </div>

    <div style={{marginBottom:14}}>
      <label className="lbl">Your pitch <span style={{color:"#888888",fontWeight:400}}>({200-msg.length} chars left)</span></label>
      <textarea className="inp" rows={3} style={{resize:"vertical"}}
        placeholder="e.g. I have a Samsung Galaxy S23, barely used, 8GB RAM. Happy to share photos."
        value={msg} onChange={e=>setMsg(e.target.value)} maxLength={200}/>
      <div style={{fontSize:11,color:"#888888",marginTop:4}}>
        ⚠ Do not include phone numbers, emails or social media handles — your contact will be revealed after the buyer pays KSh 250.
      </div>
    </div>

    <div style={{marginBottom:14}}>
      <label className="lbl">Your price (KSh) <span style={{color:"#888888",fontWeight:400}}>— optional</span></label>
      <input className="inp" type="number" placeholder={request.budget?`Buyer budget: ${fmtKES(request.budget)}`:"e.g. 45000"} value={price} onChange={e=>setPrice(e.target.value)} min={0}/>
    </div>

    <div style={{background:"#F8F8F8",border:"1px solid #E8E8E8",borderRadius:12,padding:"12px 14px",fontSize:12,color:"#111111",lineHeight:1.6}}>
      💡 <strong>How it works:</strong> Your pitch is sent to the buyer anonymously. If they like it, they pay KSh 250 to unlock your contact info. You get notified when they connect.
    </div>
  </Modal>;
}

// ── PWA INSTALL BANNER ────────────────────────────────────────────────────────
function PWABanner({onDismiss}){
  const [deferredPrompt,setDeferredPrompt]=useState(null);
  useEffect(()=>{
    const h=e=>{e.preventDefault();setDeferredPrompt(e);};
    window.addEventListener("beforeinstallprompt",h);
    return()=>window.removeEventListener("beforeinstallprompt",h);
  },[]);
  if(!deferredPrompt)return null;
  const install=async()=>{deferredPrompt.prompt();const{outcome}=await deferredPrompt.userChoice;if(outcome==="accepted"){onDismiss();}setDeferredPrompt(null);};
  return <div className="pwa-banner">
    <span style={{fontSize:28}}>📱</span>
    <div style={{flex:1}}>
      <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:8}}><WekaSokoLogo size={22} iconOnly/>Install Weka Soko App</div>
      <div style={{fontSize:12,color:"#888888"}}>Get faster access & offline browsing</div>
    </div>
    <button className="btn bp sm" onClick={install}>Install</button>
    <button className="btn bgh sm" onClick={onDismiss}>✕</button>
  </div>;
}

// ── PAGER ─────────────────────────────────────────────────────────────────────
function Pager({total,perPage,page,onChange}){
  const tp=Math.ceil(total/perPage);if(tp<=1)return null;
  const pages=tp<=7?Array.from({length:tp},(_,i)=>i+1):[1,2,...(page>3?["..."]:[]),page-1,page,page+1,...(page<tp-2?["..."]:[]),(tp>2?tp-1:null),tp].filter((v,i,a)=>v&&v>0&&v<=tp&&a.indexOf(v)===i);
  return <div className="pg">
    <div className="pb" onClick={()=>page>1&&onChange(page-1)}>←</div>
    {pages.map((p,i)=>typeof p==="number"?<div key={i} className={`pb${p===page?" on":""}`} onClick={()=>onChange(p)}>{p}</div>:<div key={i} style={{color:"#CCCCCC",fontSize:13,padding:"0 4px"}}>…</div>)}
    <div className="pb" onClick={()=>page<tp&&onChange(page+1)}>→</div>
  </div>;
}

// ── MOBILE LAYOUT ─────────────────────────────────────────────────────────────
function MobileLayout({
  user,token,notify,page,setPage,
  listings,total,loading,filter,setFilter,pg,setPg,
  stats,counties,modal,setModal,notifCount,
  mobileFiltersOpen,setMobileFiltersOpen,mobileTab,setMobileTab,
  openListing,handleLockIn,WhatBuyersWant,onOpenPostAd
}){
  const photoMap={
    Electronics:"https://images.unsplash.com/photo-1498049794561-7780e7231661?w=140&h=140&fit=crop",
    Vehicles:"https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=140&h=140&fit=crop",
    Property:"https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=140&h=140&fit=crop",
    Fashion:"https://images.unsplash.com/photo-1483985988355-763728e1935b?w=140&h=140&fit=crop",
    Furniture:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=140&h=140&fit=crop",
    "Home & Garden":"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=140&h=140&fit=crop",
    Sports:"https://images.unsplash.com/photo-1517649763962-0c623066013b?w=140&h=140&fit=crop",
    "Baby & Kids":"https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=140&h=140&fit=crop",
    Books:"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=140&h=140&fit=crop",
    Agriculture:"https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=140&h=140&fit=crop",
    Services:"https://images.unsplash.com/photo-1504148455328-c376907d081c?w=140&h=140&fit=crop",
    Jobs:"https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=140&h=140&fit=crop",
    Food:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=140&h=140&fit=crop",
    "Health & Beauty":"https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=140&h=140&fit=crop",
    Pets:"https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=140&h=140&fit=crop",
    Other:"https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=140&h=140&fit=crop",
  };

  const postAd=()=>{
    if(!user){setModal({type:"auth",mode:"signup"});return;}
    if(user.role==="buyer"){
      if(window.confirm("Switch to Seller to post ads?"))
        fetch(`${(process.env.REACT_APP_API_URL||"https://weka-soko-backend-production.up.railway.app").replace(/\/$/,"")}/api/auth/role`,{method:"PATCH",headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},body:JSON.stringify({role:"seller"})})
          .then(r=>r.json()).then(d=>{localStorage.setItem("ws_user",JSON.stringify(d.user));window.location.reload();});
      return;
    }
    setModal({type:"post"});
  };

  return <div className="mob-root">

    {/* ── TOP BAR ── */}
    <div className="mob-topbar">
      <div className="mob-logo" onClick={()=>{setPage("home");setFilter({cat:"",q:"",county:"",minPrice:"",maxPrice:"",sort:"newest"});setPg(1);setMobileTab("home");}}>WekaSoko</div>
      <div className="mob-search">
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="#AAAAAA" strokeWidth="2"/><path d="M20 20l-3-3" stroke="#AAAAAA" strokeWidth="2" strokeLinecap="round"/></svg>
        <input placeholder="Search listings..." value={filter.q} onChange={e=>{setFilter(p=>({...p,q:e.target.value}));setPg(1);setMobileTab("home");}}/>
      </div>
      <div className="mob-notif" onClick={()=>{if(!user){setModal({type:"auth",mode:"login"});return;}setPage("dashboard");setMobileTab("dashboard");}}>
        {user
          ?<svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/></svg>
          :<svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/></svg>}
        {notifCount>0&&<span style={{position:"absolute",top:4,right:4,width:8,height:8,background:"#1428A0",borderRadius:"50%",border:"2px solid #fff"}}/>}
      </div>
    </div>

    {/* ── CONTENT ── */}
    {mobileTab==="home"&&<>

      {/* Hero banner */}
      {!filter.q&&!filter.cat&&pg===1&&<div className="mob-hero-banner">
        <div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"rgba(255,255,255,.6)",marginBottom:8}}>🇰🇪 Kenya's Resell Platform</div>
        <div style={{fontSize:22,fontWeight:800,color:"#fff",lineHeight:1.2,marginBottom:10}}>Buy & Sell<br/>Anything in Kenya</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,.75)",marginBottom:16}}>Post free. Pay KSh 250 only when a buyer locks in.</div>
        <button onClick={postAd} style={{background:"#fff",color:"#1428A0",border:"none",padding:"11px 22px",borderRadius:10,fontSize:14,fontWeight:700,fontFamily:"var(--fn)",cursor:"pointer"}}>+ Post an Ad for Free</button>
      </div>}

      {/* Categories */}
      <div className="mob-section">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px 4px"}}>
          <div className="mob-section-title" style={{padding:0}}>Categories</div>
          {filter.cat&&<button onClick={()=>{setFilter(p=>({...p,cat:""}));setPg(1);}} style={{fontSize:12,color:"#1428A0",background:"none",border:"none",cursor:"pointer",fontFamily:"var(--fn)",fontWeight:600}}>Clear ✕</button>}
        </div>
        <div className="mob-cats">
          {CATS.map(c=>(
            <div key={c.name} className={`mob-cat${filter.cat===c.name?" active":""}`}
              onClick={()=>{setFilter(p=>({...p,cat:p.cat===c.name?"":c.name}));setPg(1);}}>
              <img src={photoMap[c.name]||photoMap.Other} alt={c.name}/>
              <span>{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter row */}
      <div style={{display:"flex",gap:8,padding:"8px 12px",overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        <button onClick={()=>setMobileFiltersOpen(true)} style={{display:"flex",alignItems:"center",gap:6,background:"#fff",border:"1.5px solid #E0E0E0",borderRadius:20,padding:"8px 16px",fontSize:13,fontWeight:600,fontFamily:"var(--fn)",color:"#333",cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M3 6h18M7 12h10M11 18h2" stroke="#333" strokeWidth="2.5" strokeLinecap="round"/></svg>
          Filters {(filter.county||filter.minPrice||filter.maxPrice||filter.sort!=="newest")?`(${[filter.county,filter.minPrice,filter.maxPrice].filter(Boolean).length+(filter.sort!=="newest"?1:0)})`:""}</button>
        {["newest","price_asc","price_desc","popular"].map(s=>(
          <button key={s} onClick={()=>{setFilter(p=>({...p,sort:s}));setPg(1);}} style={{background:filter.sort===s?"#1428A0":"#fff",color:filter.sort===s?"#fff":"#555",border:`1.5px solid ${filter.sort===s?"#1428A0":"#E0E0E0"}`,borderRadius:20,padding:"8px 14px",fontSize:12,fontWeight:600,fontFamily:"var(--fn)",cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>
            {s==="newest"?"Latest":s==="price_asc"?"Price ↑":s==="price_desc"?"Price ↓":"Popular"}
          </button>
        ))}
      </div>

      {/* Listings */}
      <div className="mob-section" style={{marginTop:4}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px 8px"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#1A1A1A"}}>{filter.cat||"All Listings"} <span style={{color:"#AAAAAA",fontWeight:400,fontSize:13}}>({total})</span></div>
        </div>
        {loading
          ?<div style={{textAlign:"center",padding:"40px 0"}}><span className="spin"/></div>
          :listings.length===0
            ?<div style={{textAlign:"center",padding:"40px 20px",color:"#AAAAAA"}}>
                <div style={{fontSize:40,marginBottom:12,opacity:.3}}>🔍</div>
                <div style={{fontWeight:700,marginBottom:6}}>No listings found</div>
                <div style={{fontSize:13}}>Try different filters</div>
              </div>
            :<div className="mob-cards">
              {listings.map(l=>{
                const photo=Array.isArray(l.photos)?l.photos.find(p=>typeof p==="string")||l.photos[0]?.url||null:null;
                return <div key={l.id} className="mob-lcard" onClick={()=>openListing(l)}>
                  <div className="mob-lcard-img">
                    {photo?<img src={photo} alt={l.title}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,opacity:.15}}>📦</div>}
                  </div>
                  <div className="mob-lcard-body">
                    <div className="mob-lcard-cat">{l.category}</div>
                    <div className="mob-lcard-title">{l.title}</div>
                    <div className="mob-lcard-price">{fmtKES(l.price)}</div>
                    <div className="mob-lcard-meta">
                      {l.location&&<span>📍 {l.location}</span>}
                      <span>{ago(l.created_at)}</span>
                    </div>
                  </div>
                  {l.locked_buyer_id&&!l.is_unlocked&&<div style={{width:8,height:8,background:"#1428A0",borderRadius:"50%",flexShrink:0,marginTop:4}}/>}
                </div>;
              })}
            </div>}
        {/* Pagination */}
        {Math.ceil(total/PER_PAGE)>1&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderTop:"1px solid #F0F0F0"}}>
          <button onClick={()=>{if(pg>1){setPg(p=>p-1);window.scrollTo(0,0);}}} disabled={pg<=1} className="btn bs sm" style={{borderRadius:8,opacity:pg<=1?.4:1}}>← Prev</button>
          <span style={{fontSize:13,color:"#AAAAAA",fontWeight:500}}>Page {pg} of {Math.ceil(total/PER_PAGE)}</span>
          <button onClick={()=>{if(pg<Math.ceil(total/PER_PAGE)){setPg(p=>p+1);window.scrollTo(0,0);}}} disabled={pg>=Math.ceil(total/PER_PAGE)} className="btn bp sm" style={{borderRadius:8,opacity:pg>=Math.ceil(total/PER_PAGE)?.4:1}}>Next →</button>
        </div>}
      </div>

      {/* Trust strip */}
      <div className="mob-trust">
        {[["✓","Free to post"],["✓","Anonymous chat"],["✓","M-Pesa escrow"]].map(([icon,txt])=>(
          <span key={txt}><span style={{color:"#1428A0",fontWeight:800}}>{icon}</span>{txt}</span>
        ))}
      </div>

    </>}

    {/* ── BOTTOM TAB BAR ── */}
    <div className="mob-bottombar">
      {[
        {id:"home",icon:<svg viewBox="0 0 24 24" fill="none"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>,label:"Home"},
        {id:"search",icon:<svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,label:"Search"},
        {id:"post",icon:<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M12 8v8M8 12h8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>,label:"Post",isPost:true},
        {id:"dashboard",icon:<svg viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,label:user?user.name?.split(" ")[0]:"Account"},
        {id:"more",icon:<svg viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg>,label:"More"},
      ].map(t=>(
        <button key={t.id}
          className={`mob-tab${t.isPost?" post-btn":mobileTab===t.id?" on":" off"}`}
          onClick={()=>{
            if(t.isPost){postAd();return;}
            if(t.id==="dashboard"){if(!user){setModal({type:"auth",mode:"login"});return;}setPage("dashboard");}
            else if(t.id==="more"){setPage("sold");}
            else{setPage("home");}
            setMobileTab(t.id);
          }}>
          {t.icon}
          {!t.isPost&&<span>{t.label}{t.id==="dashboard"&&notifCount>0?` (${notifCount})`:""}</span>}
        </button>
      ))}
    </div>

    {/* ── FILTERS DRAWER ── */}
    {mobileFiltersOpen&&<div className="mob-drawer" onClick={e=>{if(e.target===e.currentTarget)setMobileFiltersOpen(false);}}>
      <div className="mob-drawer-bg" onClick={()=>setMobileFiltersOpen(false)}/>
      <div className="mob-drawer-panel">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontSize:17,fontWeight:700,color:"#1A1A1A"}}>Filters</div>
          <button onClick={()=>setMobileFiltersOpen(false)} style={{background:"#F5F5F5",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div className="mob-filter-row">
          <div className="mob-filter-label">County</div>
          <select className="inp" style={{borderRadius:10}} value={filter.county} onChange={e=>{setFilter(p=>({...p,county:e.target.value}));setPg(1);}}>
            <option value="">All Counties</option>
            {counties.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="mob-filter-row">
          <div className="mob-filter-label">Price Range (KSh)</div>
          <div style={{display:"flex",gap:10}}>
            <input className="inp" style={{borderRadius:10}} placeholder="Min" type="number" value={filter.minPrice} onChange={e=>{setFilter(p=>({...p,minPrice:e.target.value}));setPg(1);}}/>
            <input className="inp" style={{borderRadius:10}} placeholder="Max" type="number" value={filter.maxPrice} onChange={e=>{setFilter(p=>({...p,maxPrice:e.target.value}));setPg(1);}}/>
          </div>
        </div>
        <div className="mob-filter-row">
          <div className="mob-filter-label">Sort By</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["newest","Latest"],["oldest","Oldest"],["price_asc","Price ↑"],["price_desc","Price ↓"],["popular","Most Viewed"],["expiring","Expiring Soon"]].map(([val,lbl])=>(
              <button key={val} onClick={()=>{setFilter(p=>({...p,sort:val}));setPg(1);}} style={{padding:"10px",border:`1.5px solid ${filter.sort===val?"#1428A0":"#E0E0E0"}`,borderRadius:8,background:filter.sort===val?"#EEF2FF":"#fff",color:filter.sort===val?"#1428A0":"#555",fontSize:13,fontWeight:filter.sort===val?700:500,fontFamily:"var(--fn)",cursor:"pointer"}}>{lbl}</button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:8}}>
          <button onClick={()=>{setFilter({cat:"",q:"",county:"",minPrice:"",maxPrice:"",sort:"newest"});setPg(1);setMobileFiltersOpen(false);}} className="btn bs" style={{flex:1,borderRadius:10}}>Clear All</button>
          <button onClick={()=>setMobileFiltersOpen(false)} className="btn bp" style={{flex:1,borderRadius:10}}>Show Results ({total})</button>
        </div>
      </div>
    </div>}

  </div>;
}


// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App(){
  const [user,setUser]=useState(null);
  const [token,setToken]=useState(null);
  const [page,setPage]=useState("home");
  const [listings,setListings]=useState([]);
  const [total,setTotal]=useState(0);
  const [loading,setLoading]=useState(true);
  const [stats,setStats]=useState({users:0,activeAds:0,sold:0,revenue:0});
  const [filter,setFilter]=useState({cat:"",q:"",county:"",minPrice:"",maxPrice:"",sort:"newest"});
  const [counties,setCounties]=useState([]);
  useEffect(()=>{api("/api/listings/counties").then(setCounties).catch(()=>{});},[]);
  const [pg,setPg]=useState(1);
  const [vm,setVm]=useState("grid");
  const [toast,setToast]=useState(null);
  const [modal,setModal]=useState(null);
  const [showPWA,setShowPWA]=useState(true);
  const [notifCount,setNotifCount]=useState(0);
  const socketRef=useRef(null);

  const notify=useCallback((msg,type="info")=>setToast({msg,type,id:Date.now()}),[]);
  // Detect mobile vs desktop
  const [isMobile,setIsMobile]=useState(()=>window.innerWidth<768);
  useEffect(()=>{
    const check=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener('resize',check);
    return()=>window.removeEventListener('resize',check);
  },[]);
  const [mobileFiltersOpen,setMobileFiltersOpen]=useState(false);
  const [mobileTab,setMobileTab]=useState('home'); // home|search|post|dashboard|more
  const closeModal=useCallback(()=>setModal(null),[]);

  useEffect(()=>{let el=document.getElementById("ws-css");if(!el){el=document.createElement("style");el.id="ws-css";document.head.appendChild(el);}el.textContent=CSS;
    // Ensure viewport meta for mobile
    if(!document.querySelector('meta[name="viewport"]')){
      const mv=document.createElement('meta');
      mv.name='viewport';mv.content='width=device-width,initial-scale=1,maximum-scale=5';
      document.head.appendChild(mv);
    }},[]);

  // Handle Google OAuth callback + password reset token
  const [resetToken,setResetToken]=useState(null);
  useEffect(()=>{
    // Check both query params and hash (some redirects vary)
    const search=new URLSearchParams(window.location.search);
    const hash=new URLSearchParams(window.location.hash.replace(/^#/,""));
    const getParam=(k)=>search.get(k)||hash.get(k)||null;
    const t=getParam("auth_token");
    const u=getParam("auth_user");
    const err=getParam("auth_error");
    const rt=getParam("reset_token");
    if(t&&u){
      try{
        const parsed=JSON.parse(decodeURIComponent(u));
        localStorage.setItem("ws_token",t);
        localStorage.setItem("ws_user",JSON.stringify(parsed));
        setUser(parsed);setToken(t);
        // Verify the token is valid immediately
        api("/api/auth/me",{},t).then(fresh=>{setUser(fresh);localStorage.setItem("ws_user",JSON.stringify(fresh));}).catch(()=>{});
        notify("Welcome back, "+parsed.name.split(" ")[0]+"! 🎉","success");
        window.history.replaceState({},"",window.location.pathname);
      }catch(e){console.error("OAuth parse error",e);}
    }
    if(rt){
      setResetToken(rt);
      window.history.replaceState({},"",window.location.pathname);
    }
    const vt=search.get("verify_email");
    if(vt){
      api("/api/auth/verify-email?token="+vt).then(r=>{
        if(r.token&&r.user){
          // Auto-login the user after verification
          localStorage.setItem("ws_token",r.token);
          localStorage.setItem("ws_user",JSON.stringify(r.user));
          setUser(r.user);
          setToken(r.token);
          notify("✅ Email verified! Welcome to Weka Soko.","success");
        } else {
          notify("✅ Email verified! You can now sign in.","success");
        }
      }).catch(e=>notify(e.message||"Verification failed","error"));
      window.history.replaceState({},"",window.location.pathname);
    }
    if(err)notify("Google sign-in failed: "+decodeURIComponent(err),"error");
  },[]);

  // Session restore
  useEffect(()=>{
    const t=localStorage.getItem("ws_token");
    const u=localStorage.getItem("ws_user");
    if(t&&u){
      try{const parsed=JSON.parse(u);setUser(parsed);setToken(t);}catch{}
      api("/api/auth/me",{},t).then(u=>{setUser(u);localStorage.setItem("ws_user",JSON.stringify(u));}).catch(()=>{localStorage.removeItem("ws_token");localStorage.removeItem("ws_user");setUser(null);setToken(null);});
    }
  },[]);

  // Stats — fetch on load + poll every 30s
  useEffect(()=>{
    const fetchStats=()=>api("/api/stats").then(setStats).catch(()=>{});
    fetchStats();
    const iv=setInterval(fetchStats,30000);
    return()=>clearInterval(iv);
  },[]);

  // Listings — fetch on filter/page change + silent background refresh every 60s
  const listingsFilterRef=useRef(filter);
  const listingsPgRef=useRef(pg);
  useEffect(()=>{listingsFilterRef.current=filter;},[filter]);
  useEffect(()=>{listingsPgRef.current=pg;},[pg]);

  useEffect(()=>{
    const load=async(silent=false)=>{
      if(!silent)setLoading(true);
      try{
        const p=new URLSearchParams({page:pg,limit:PER_PAGE,sort:filter.sort||"newest"});
        if(filter.cat)p.set("category",filter.cat);
        if(filter.q)p.set("search",filter.q);
        if(filter.county)p.set("county",filter.county);
        if(filter.minPrice)p.set("minPrice",filter.minPrice);
        if(filter.maxPrice)p.set("maxPrice",filter.maxPrice);
        const data=await api(`/api/listings?${p}`);
        setListings(data.listings||[]);
        setTotal(data.total||0);
      }catch{if(!silent)setListings([]);}
      finally{if(!silent)setLoading(false);}
    };
    load(false);
    // Silent background refresh every 60s
    const iv=setInterval(()=>load(true),60000);
    return()=>clearInterval(iv);
  },[pg,filter]);

  // Real-time notifications for logged-in user
  useEffect(()=>{
    if(!token||!user)return;
    const s=io(API,{auth:{token},transports:["websocket","polling"]});
    socketRef.current=s;
    s.on("notification",(n)=>{
      setNotifCount(c=>c+1);
      // Handle warning/suspension notifications prominently
      if(n.type==="warning"||n.type==="suspension"){
        notify(n.title+(n.body?" — "+n.body:""),"error");
        // Re-fetch user to get current suspended status
        api("/api/auth/me",{},token).then(fresh=>{
          setUser(fresh);localStorage.setItem("ws_user",JSON.stringify(fresh));
          if(fresh.is_suspended){
            notify("⛔ Your account has been suspended. You will be logged out.","error");
            setTimeout(()=>{
              localStorage.removeItem("ws_token");localStorage.removeItem("ws_user");
              setUser(null);setToken(null);
              notify("Account suspended. Contact support@wekasoko.co.ke","error");
            },3000);
          }
        }).catch(()=>{});
      } else if(n.type==="admin_edit"){
        notify("ℹ️ Admin has updated your listing: "+(n.body||""),"info");
      } else {
        notify(n.body||n.title,"info");
      }
    });
    // New message arrived while chat modal is closed - update unread count
    s.on("new_message_inbox",(msg)=>{
      setNotifCount(c=>c+1);
    });
    return()=>s.disconnect();
  },[token,user]);

  // Fetch unread count on login + poll every 20s silently
  useEffect(()=>{
    if(!token)return;
    const fetchUnread=()=>api("/api/notifications",{},token).then(ns=>{
      if(Array.isArray(ns))setNotifCount(ns.filter(n=>!n.is_read).length);
    }).catch(()=>{});
    fetchUnread();
    const iv=setInterval(fetchUnread,20000);
    return()=>clearInterval(iv);
  },[token]);

  // ── Web Push subscription ─────────────────────────────────────────────────
  useEffect(()=>{
    if(!token||!user)return;
    // Only run once per session — skip if already subscribed
    if(!("serviceWorker" in navigator)||!("PushManager" in window))return;
    if(Notification.permission==="denied")return;

    const subscribe=async()=>{
      try{
        // Get VAPID public key from backend
        const {key} = await api("/api/push/vapid-public-key");
        const reg = await navigator.serviceWorker.ready;

        // Check if already subscribed
        const existing = await reg.pushManager.getSubscription();
        if(existing){
          // Re-send to backend in case it was lost
          await api("/api/push/subscribe",{method:"POST",body:JSON.stringify({subscription:existing})},token).catch(()=>{});
          return;
        }

        // Request permission if not already granted
        if(Notification.permission==="default"){
          const perm = await Notification.requestPermission();
          if(perm!=="granted")return;
        }

        // Subscribe
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly:true,
          applicationServerKey:urlBase64ToUint8Array(key)
        });
        await api("/api/push/subscribe",{method:"POST",body:JSON.stringify({subscription:sub})},token);
      }catch(e){console.warn("[Push] subscribe:",e.message);}
    };

    // Small delay so the page loads first before the permission prompt
    const t = setTimeout(subscribe, 3000);
    return ()=>clearTimeout(t);
  },[token,user]);

  const handleAuth=(u,t)=>{setUser(u);setToken(t);setNotifCount(0);};
  const logout=()=>{setUser(null);setToken(null);setNotifCount(0);localStorage.removeItem("ws_token");localStorage.removeItem("ws_user");notify("Signed out.","info");};

  const handleLockIn=async listing=>{
    if(!user){setModal({type:"auth",mode:"login"});return;}
    try{
      await api(`/api/listings/${listing.id}/lock-in`,{method:"POST"},token);
      setListings(p=>p.map(l=>l.id===listing.id?{...l,locked_buyer_id:user.id,interest_count:(l.interest_count||0)+1}:l));
      setModal({type:"detail",listing:{...listing,locked_buyer_id:user.id}});
      notify("🔥 Locked in! The seller has been notified.","success");
    }catch(err){notify(err.message,"error");}
  };

  const openListing=async l=>{
    setModal({type:"detail",listing:l}); // show immediately with what we have
    try{
      const fresh=await api(`/api/listings/${l.id}`,{},token);
      setModal({type:"detail",listing:fresh});
    }catch(e){/* keep showing cached version */}
  };

  // Mobile layout — completely separate, Jiji-style
  if(isMobile&&page!=="dashboard"&&page!=="sold") return <>
    <MobileLayout
      user={user} token={token} notify={notify}
      page={page} setPage={setPage}
      listings={listings} total={total} loading={loading}
      filter={filter} setFilter={setFilter} pg={pg} setPg={setPg}
      stats={stats} counties={counties}
      modal={modal} setModal={setModal}
      notifCount={notifCount}
      mobileFiltersOpen={mobileFiltersOpen} setMobileFiltersOpen={setMobileFiltersOpen}
      mobileTab={mobileTab} setMobileTab={setMobileTab}
      openListing={openListing} handleLockIn={handleLockIn}
    />
    {/* Modals still render on mobile */}
    {modal?.type==="auth"&&<AuthModal defaultMode={modal.mode} onClose={closeModal} onAuth={handleAuth} notify={notify}/>}
    {modal?.type==="post"&&token&&<PostAdModal onClose={closeModal} token={token} notify={notify} onSuccess={l=>{setListings(p=>[l,...p]);setTotal(t=>t+1);}}/>}
    {modal?.type==="detail"&&<DetailModal listing={modal.listing} user={user} token={token} onClose={closeModal} notify={notify}
      onShare={()=>setModal({type:"share",listing:modal.listing})}
      onChat={()=>{if(!user){notify("Sign in to chat","warning");setModal({type:"auth",mode:"login"});return;}setModal({type:"chat",listing:modal.listing});}}
      onLockIn={()=>handleLockIn(modal.listing)}
      onUnlock={()=>setModal({type:"pay",payType:"unlock",listing:modal.listing})}
      onEscrow={()=>{if(!user){notify("Sign in first","warning");setModal({type:"auth",mode:"login"});return;}setModal({type:"pay",payType:"escrow",listing:modal.listing});}}
    />}
    {modal?.type==="chat"&&user&&<ChatModal listing={modal.listing} user={user} token={token} onClose={closeModal} notify={notify}/>}
    {modal?.type==="share"&&<ShareModal listing={modal.listing} onClose={closeModal}/>}
    {modal?.type==="pay"&&user&&<PayModal type={modal.payType} listingId={modal.listing.id}
      amount={modal.payType==="unlock"?250:modal.listing.price+Math.round(modal.listing.price*0.075)}
      purpose={modal.payType==="unlock"?`Unlock buyer contact: ${modal.listing.title}`:`Escrow for: ${modal.listing.title}`}
      token={token} user={user} allowVoucher={true}
      onSuccess={async(result)=>{
        if(result.listing){const ul=result.listing;setListings(p=>p.map(l=>l.id===ul.id?ul:l));closeModal();setTimeout(()=>setModal({type:"detail",listing:ul}),200);notify("🔓 Contact details revealed!","success");return;}
        try{const fresh=await api(`/api/listings/${modal.listing.id}`,{},token);const ul=fresh.listing||fresh;setListings(p=>p.map(l=>l.id===ul.id?ul:l));closeModal();setTimeout(()=>setModal({type:"detail",listing:ul}),200);}catch{closeModal();}
        notify(modal.payType==="unlock"?"🔓 Buyer contact revealed!":"🔐 Escrow activated!","success");
      }}
      onClose={closeModal} notify={notify}/>}
    {toast&&<Toast key={toast.id} msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    {resetToken&&<ResetPasswordModal token={resetToken} notify={notify} onClose={()=>{setResetToken(null);setModal({type:"auth",mode:"login"});}}/>}
  </>;

  // Desktop layout — full design
  return <>
    {/* NAV */}
    <nav className="nav">
      <div className="logo" onClick={()=>{setPage("home");setFilter({cat:"",q:"",county:"",minPrice:"",maxPrice:"",sort:"newest"});setPg(1);}} style={{color:"#1428A0"}}><WekaSokoLogo size={38}/></div>
      {/* Desktop nav */}
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <button className="bgh" style={{color:"#636363",fontSize:13,background:"transparent",border:"none",cursor:"pointer",fontFamily:"var(--fn)",padding:"8px 14px",whiteSpace:"nowrap"}} onClick={()=>setPage(p=>p==="sold"?"home":"sold")}>Sold Items</button>
        {user?<>
          <button style={{background:"transparent",border:"none",color:"#1D1D1D",cursor:"pointer",fontSize:13,fontFamily:"var(--fn)",padding:"8px 14px",position:"relative",whiteSpace:"nowrap"}} onClick={()=>setPage("dashboard")}>
            {user.name?.split(" ")[0]}
            {notifCount>0&&<span className="notif-dot"/>}
          </button>
          <button style={{background:"#1428A0",color:"#FFFFFF",border:"none",padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"var(--fn)",borderRadius:8,whiteSpace:"nowrap"}} onClick={()=>{
            if(user.role==="buyer"){
              if(window.confirm("You're currently a Buyer. Switch to Seller to post ads?"))
                api("/api/auth/role",{method:"PATCH",body:JSON.stringify({role:"seller"})},token).then(d=>{const upd={...user,...d.user};setUser(upd);localStorage.setItem("ws_user",JSON.stringify(upd));notify("Switched to Seller!","success");setModal({type:"post"});}).catch(e=>notify(e.message,"error"));
              return;
            }
            setModal({type:"post"});
          }}>+ Post Ad</button>
        </>:<>
          <button style={{background:"transparent",color:"#1428A0",border:"1.5px solid #1428A0",padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"var(--fn)",borderRadius:8,whiteSpace:"nowrap"}} onClick={()=>setModal({type:"auth",mode:"login"})}>Sign In</button>
          <button style={{background:"#1428A0",color:"#FFFFFF",border:"none",padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"var(--fn)",borderRadius:8,whiteSpace:"nowrap"}} onClick={()=>setModal({type:"auth",mode:"signup"})}>Join Free</button>
        </>}
      </div>
    </nav>

    {/* ── HERO + CATEGORIES side by side ── */}
    {page!=="dashboard"&&page!=="sold"&&<div style={{background:"#FFFFFF",borderBottom:"1px solid #EBEBEB"}}>
      <div style={{display:"flex",alignItems:"stretch",minHeight:460,flexWrap:"wrap"}}>

        {/* LEFT — hero text */}
        <div style={{flex:"1 1 380px",minWidth:0,padding:"clamp(28px,5vw,60px) clamp(20px,5vw,56px)",display:"flex",flexDirection:"column",justifyContent:"center",borderRight:"1px solid #EBEBEB",background:"#fff"}}>
          <div style={{fontSize:13,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",marginBottom:18,color:"#1428A0"}}>
            🇰🇪 Kenya's Resell Platform
          </div>
          <h1 style={{fontSize:"clamp(32px,3.5vw,50px)",fontWeight:800,letterSpacing:"-.02em",lineHeight:1.12,marginBottom:20,color:"#1A1A1A",fontFamily:"var(--fn)"}}>
            Post Free.<br/>
            <span style={{color:"#1428A0"}}>Pay Only When</span><br/>
            You Get a Buyer.
          </h1>
          <p style={{fontSize:17,color:"#636363",lineHeight:1.8,marginBottom:34,fontWeight:400}}>
            List items in minutes with photos. Pay KSh 250 only when a serious buyer locks in to buy.
          </p>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:24}}>
            <button style={{background:"#1428A0",color:"#fff",border:"none",padding:"16px 34px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"var(--fn)",borderRadius:10,transition:"background .15s",boxShadow:"0 4px 14px rgba(20,40,160,.25)"}}
              onMouseOver={e=>e.currentTarget.style.background="#0F1F8A"} onMouseOut={e=>e.currentTarget.style.background="#1428A0"}
              onClick={()=>{
                if(!user){setModal({type:"auth",mode:"signup"});return;}
                if(user.role==="buyer"){
                  if(window.confirm("You're currently a Buyer. To post an ad, switch to a Seller account.\n\nSwitch to Seller now?")){
                    api("/api/auth/role",{method:"PATCH",body:JSON.stringify({role:"seller"})},token).then(d=>{
                      const upd={...user,...d.user};setUser(upd);localStorage.setItem("ws_user",JSON.stringify(upd));
                      notify("Switched to Seller! Now post your ad.","success");setModal({type:"post"});
                    }).catch(e=>notify(e.message,"error"));
                  }
                  return;
                }
                setModal({type:"post"});
              }}>+ Post an Ad for Free</button>
            <button style={{background:"#fff",color:"#1A1A1A",border:"1.5px solid #D0D0D0",padding:"16px 30px",fontSize:16,fontWeight:600,cursor:"pointer",fontFamily:"var(--fn)",borderRadius:10,transition:"all .15s"}}
              onMouseOver={e=>{e.currentTarget.style.borderColor="#1428A0";e.currentTarget.style.color="#1428A0";}} onMouseOut={e=>{e.currentTarget.style.borderColor="#D0D0D0";e.currentTarget.style.color="#1A1A1A";}}
              onClick={()=>document.getElementById("listings-section")?.scrollIntoView({behavior:"smooth"})}>Browse Listings</button>
          </div>
          <div style={{display:"flex",gap:22,fontSize:14,color:"#888",fontWeight:500,flexWrap:"wrap"}}>
            <span style={{display:"flex",alignItems:"center",gap:7}}><span style={{color:"#1428A0",fontWeight:800,fontSize:16}}>✓</span>Free to post</span>
            <span style={{display:"flex",alignItems:"center",gap:7}}><span style={{color:"#1428A0",fontWeight:800,fontSize:16}}>✓</span>Anonymous chat</span>
            <span style={{display:"flex",alignItems:"center",gap:7}}><span style={{color:"#1428A0",fontWeight:800,fontSize:16}}>✓</span>M-Pesa escrow</span>
          </div>
        </div>

        {/* RIGHT — OLX-style categories with real images */}
        <div style={{flex:"1 1 320px",minWidth:0,padding:"clamp(24px,4vw,40px) clamp(16px,4vw,48px) 32px",background:"#FAFAFA"}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#AAAAAA",marginBottom:6}}>Browse by Category</div>
          <h2 style={{fontSize:22,fontWeight:700,color:"#1A1A1A",marginBottom:24,letterSpacing:"-.01em",fontFamily:"var(--fn)"}}>What are you looking for?</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(72px,1fr))",gap:8}}>
            {CATS.map(c=>{
              const photoMap={
                Electronics:"https://images.unsplash.com/photo-1498049794561-7780e7231661?w=140&h=140&fit=crop&crop=center",
                Vehicles:"https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=140&h=140&fit=crop&crop=center",
                Property:"https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=140&h=140&fit=crop&crop=center",
                Fashion:"https://images.unsplash.com/photo-1483985988355-763728e1935b?w=140&h=140&fit=crop&crop=center",
                Furniture:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=140&h=140&fit=crop&crop=center",
                "Home & Garden":"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=140&h=140&fit=crop&crop=center",
                Sports:"https://images.unsplash.com/photo-1517649763962-0c623066013b?w=140&h=140&fit=crop&crop=center",
                "Baby & Kids":"https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=140&h=140&fit=crop&crop=center",
                Books:"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=140&h=140&fit=crop&crop=center",
                Agriculture:"https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=140&h=140&fit=crop&crop=center",
                Services:"https://images.unsplash.com/photo-1504148455328-c376907d081c?w=140&h=140&fit=crop&crop=center",
                Jobs:"https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=140&h=140&fit=crop&crop=center",
                Food:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=140&h=140&fit=crop&crop=center",
                "Health & Beauty":"https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=140&h=140&fit=crop&crop=center",
                Pets:"https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=140&h=140&fit=crop&crop=center",
                Other:"https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=140&h=140&fit=crop&crop=center",
              };
              const photo=photoMap[c.name]||photoMap.Other;
              const active=filter.cat===c.name;
              return <div key={c.name}
                onClick={()=>{setFilter(p=>({...p,cat:p.cat===c.name?"":c.name}));setPg(1);setTimeout(()=>document.getElementById("listings-section")?.scrollIntoView({behavior:"smooth"}),100);}}
                style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"12px 4px",cursor:"pointer",borderRadius:14,background:active?"#EEF2FF":"#fff",border:`1.5px solid ${active?"#1428A0":"#EBEBEB"}`,transition:"all .15s",boxShadow:active?"0 0 0 2px rgba(20,40,160,.1)":"none"}}>
                <div style={{width:62,height:62,borderRadius:"50%",overflow:"hidden",flexShrink:0,border:`2.5px solid ${active?"#1428A0":"#E5E5E5"}`,boxShadow:"0 2px 8px rgba(0,0,0,.1)"}}>
                  <img src={photo} alt={c.name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                </div>
                <div style={{fontSize:11,fontWeight:600,color:active?"#1428A0":"#333",textAlign:"center",lineHeight:1.3,wordBreak:"break-word"}}>{c.name}</div>
              </div>;
            })}
          </div>
        </div>
      </div>

      {/* Trust bar */}
      <div style={{background:"#1428A0",padding:"12px 20px",display:"flex",gap:20,alignItems:"center",justifyContent:"center",flexWrap:"wrap"}}>
        {["Free to list","Safe anonymous chat","M-Pesa escrow","Kenyan platform"].map(t=>(
          <span key={t} style={{fontSize:14,fontWeight:600,color:"rgba(255,255,255,.92)",display:"flex",alignItems:"center",gap:8}}>
            <span style={{color:"#fff",fontSize:16,fontWeight:800}}>✓</span>{t}
          </span>
        ))}
      </div>
    </div>}

    {page!=="dashboard"&&page!=="sold"&&<main style={{padding:"clamp(20px,4vw,40px) clamp(16px,4vw,48px) 80px"}}>
      {/* ── TWO-COLUMN LAYOUT: sidebar left, content right ── */}
      <div style={{display:"flex",gap:24,alignItems:"flex-start",flexWrap:"wrap",flexDirection:window.innerWidth<768?"column":"row"}}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{width:"min(240px,100%)",flexShrink:0,display:"flex",flexDirection:"column",gap:14,order:window.innerWidth<768?1:0}}>

          {/* Search */}
          <div style={{background:"#fff",border:"1px solid #EBEBEB",borderRadius:14,padding:"20px 18px"}}>
            <div style={{fontSize:12,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"#AAAAAA",marginBottom:12}}>Search</div>
            <input style={{width:"100%",padding:"11px 14px",border:"1.5px solid #E0E0E0",borderRadius:10,outline:"none",fontSize:14,fontFamily:"var(--fn)",color:"#1A1A1A",background:"#FAFAFA"}} placeholder="Search listings..." value={filter.q} onChange={e=>{setFilter(p=>({...p,q:e.target.value}));setPg(1);}}/>
          </div>

          {/* Price range */}
          <div style={{background:"#fff",border:"1px solid #EBEBEB",borderRadius:14,padding:"20px 18px"}}>
            <div style={{fontSize:12,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"#AAAAAA",marginBottom:12}}>Price Range (KSh)</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <input className="inp" style={{borderRadius:8,fontSize:14}} placeholder="Min price" type="number" value={filter.minPrice} onChange={e=>{setFilter(p=>({...p,minPrice:e.target.value}));setPg(1);}}/>
              <input className="inp" style={{borderRadius:8,fontSize:14}} placeholder="Max price" type="number" value={filter.maxPrice} onChange={e=>{setFilter(p=>({...p,maxPrice:e.target.value}));setPg(1);}}/>
            </div>
          </div>

          {/* County */}
          <div style={{background:"#fff",border:"1px solid #EBEBEB",borderRadius:14,padding:"20px 18px"}}>
            <div style={{fontSize:12,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"#AAAAAA",marginBottom:12}}>Location</div>
            <select className="inp" style={{borderRadius:8,fontSize:14}} value={filter.county} onChange={e=>{setFilter(p=>({...p,county:e.target.value}));setPg(1);}}>
              <option value="">All Counties</option>
              {counties.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Clear filters */}
          {(filter.cat||filter.county||filter.minPrice||filter.maxPrice||filter.q)&&
            <button className="btn bs" style={{width:"100%",borderRadius:10,fontSize:14}} onClick={()=>{setFilter({cat:"",q:"",county:"",minPrice:"",maxPrice:"",sort:"newest"});setPg(1);}}>✕ Clear All Filters</button>}

          {/* What Buyers Want — in sidebar */}
          <div style={{background:"#fff",border:"1px solid #EBEBEB",borderRadius:14,padding:"20px 18px"}}>
            <div style={{fontSize:12,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"#AAAAAA",marginBottom:4}}>Community</div>
            <div style={{fontSize:16,fontWeight:700,color:"#1A1A1A",marginBottom:12}}>🛒 Buyers Want</div>
            <WhatBuyersWant user={user} token={token} notify={notify} onSignIn={()=>setModal({type:"auth",mode:"login"})} onOpenPostAd={(data)=>{sessionStorage.setItem('prefilledFromRequest',JSON.stringify(data));setModal({type:'post'});}} compact={true}/>
          </div>

        </div>

        {/* ── RIGHT: main content ── */}
        <div style={{flex:1,minWidth:0}} id="listings-section">

          {/* Top bar: sort + view toggle + post ad */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:20,flexWrap:"wrap"}}>
            <h2 style={{fontSize:22,fontWeight:700,letterSpacing:"-.02em",color:"#1A1A1A"}}>
              {filter.cat||"All Listings"} <span style={{fontWeight:400,fontSize:15,color:"#AAAAAA"}}>{total} items</span>
            </h2>
            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <select style={{padding:"9px 14px",border:"1.5px solid #E0E0E0",borderRadius:8,outline:"none",fontSize:14,fontFamily:"var(--fn)",background:"#fff",color:"#444",cursor:"pointer"}} value={filter.sort} onChange={e=>{setFilter(p=>({...p,sort:e.target.value}));setPg(1);}}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="popular">Most Viewed</option>
                <option value="expiring">Expiring Soon</option>
              </select>
              <div style={{display:"flex",gap:2}}>
                <button onClick={()=>setVm("grid")} style={{background:vm==="grid"?"#1428A0":"#fff",color:vm==="grid"?"#fff":"#767676",border:"1.5px solid #E0E0E0",padding:"8px 14px",cursor:"pointer",fontSize:15,fontFamily:"var(--fn)",borderRadius:"8px 0 0 8px",transition:"all .15s"}}>⊞</button>
                <button onClick={()=>setVm("list")} style={{background:vm==="list"?"#1428A0":"#fff",color:vm==="list"?"#fff":"#767676",border:"1.5px solid #E0E0E0",borderLeft:"none",padding:"8px 14px",cursor:"pointer",fontSize:15,fontFamily:"var(--fn)",borderRadius:"0 8px 8px 0",transition:"all .15s"}}>☰</button>
              </div>
              {user&&<button className="btn bp" style={{borderRadius:9,fontSize:14,padding:"9px 20px"}} onClick={()=>{
                if(user.role==="buyer"){
                  if(window.confirm("You're currently a Buyer. Switch to Seller to post ads?"))
                    api("/api/auth/role",{method:"PATCH",body:JSON.stringify({role:"seller"})},token).then(d=>{const upd={...user,...d.user};setUser(upd);localStorage.setItem("ws_user",JSON.stringify(upd));notify("Switched to Seller!","success");setModal({type:"post"});}).catch(e=>notify(e.message,"error"));
                  return;
                }
                setModal({type:"post"});
              }}>+ Post Ad</button>}
            </div>
          </div>

          {loading?<div style={{textAlign:"center",padding:"80px 0"}}><Spin s="40px"/></div>
            :listings.length===0?<div className="empty"><div style={{fontSize:56,marginBottom:16,opacity:.15}}>🔍</div><h3 style={{fontWeight:700,fontSize:20,marginBottom:8}}>No listings found</h3><p style={{color:"#767676"}}>Try a different search or filter</p></div>
            :<div className={vm==="grid"?"g3":"lvc"}>{listings.map(l=><ListingCard key={l.id} listing={l} onClick={()=>openListing(l)} listView={vm==="list"}/>)}</div>}

          <Pager total={total} perPage={PER_PAGE} page={pg} onChange={p=>{setPg(p);window.scrollTo({top:400,behavior:"smooth"});}}/>

        </div>
      </div>{/* end two-column */}

      {/* PLATFORM STATS — bottom strip */}
      <div style={{background:"#1428A0",borderRadius:0,padding:"clamp(28px,4vw,40px) clamp(20px,4vw,48px)",marginBottom:64,margin:"0 clamp(-16px,-4vw,-48px)",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:0,textAlign:"center"}}>
        {[{label:"Active Listings",val:stats.activeAds||0},{label:"Items Sold",val:stats.sold||0},{label:"Registered Users",val:stats.users||0},{label:"Total Views",val:stats.views||0}].map((s,i)=>(
          <div key={s.label} style={{padding:"0 24px",borderRight:i<3?"1px solid rgba(255,255,255,.2)":"none"}}>
            <div style={{fontSize:40,fontWeight:800,color:"#fff",lineHeight:1,fontFamily:"var(--fn)"}}><Counter to={s.val}/></div>
            <div style={{fontSize:14,fontWeight:500,color:"rgba(255,255,255,.7)",marginTop:8,letterSpacing:".02em"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* HOW IT WORKS — Samsung Learn section style */}
      <div style={{marginTop:80,paddingTop:64,borderTop:"2px solid #CCCCCC"}}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#767676",marginBottom:12}}>How It Works</div>
          <h2 style={{fontSize:"clamp(24px,4vw,40px)",fontWeight:700,letterSpacing:"-.03em",color:"#111111",lineHeight:1.1}}>Simple. Safe.<br/>Built for Kenya.</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:20}}>
          {[["📝","Post for Free","No upfront cost. Photos, description, location — done in 2 minutes."],
            ["💬","Chat Safely","Anonymous, moderated chat. Contact info hidden until unlock."],
            ["🔥","Buyer Locks In","Serious buyers click 'I'm Interested'. You get notified instantly."],
            ["💳","Pay KSh 250","Seller pays once to see buyer contact. Till 5673935. Non-refundable."],
            ["🔐","Safe Escrow","Optional 7.5% escrow. Funds held until you confirm delivery."],
            ["🏆","Deal Done","Leave a review. Build your seller reputation on the platform."]].map(([icon,title,desc])=>(
            <div key={title} style={{background:"#F4F4F4",padding:"28px 24px"}}>
              <div style={{fontSize:28,marginBottom:14}}>{icon}</div>
              <div style={{fontWeight:700,fontSize:16,marginBottom:10,letterSpacing:"-.01em",color:"#1A1A1A"}}>{title}</div>
              <div style={{fontSize:15,color:"#636363",lineHeight:1.75}}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

    </main>}

    {/* MODALS */}
    {modal?.type==="auth"&&<AuthModal defaultMode={modal.mode} onClose={closeModal} onAuth={handleAuth} notify={notify}/>}
    {modal?.type==="post"&&token&&<PostAdModal onClose={closeModal} token={token} notify={notify} onSuccess={l=>{setListings(p=>[l,...p]);setTotal(t=>t+1);}}/>}
    {modal?.type==="detail"&&<DetailModal
      listing={modal.listing} user={user} token={token} onClose={closeModal} notify={notify}
      onShare={()=>setModal({type:"share",listing:modal.listing})}
      onChat={()=>{if(!user){notify("Sign in to chat","warning");setModal({type:"auth",mode:"login"});return;}setModal({type:"chat",listing:modal.listing});}}
      onLockIn={()=>handleLockIn(modal.listing)}
      onUnlock={()=>setModal({type:"pay",payType:"unlock",listing:modal.listing})}
      onEscrow={()=>{if(!user){notify("Sign in first","warning");setModal({type:"auth",mode:"login"});return;}setModal({type:"pay",payType:"escrow",listing:modal.listing});}}
    />}
    {modal?.type==="chat"&&user&&<ChatModal listing={modal.listing} user={user} token={token} onClose={closeModal} notify={notify}/>}
    {modal?.type==="share"&&<ShareModal listing={modal.listing} onClose={closeModal}/>}
    {modal?.type==="pay"&&user&&<PayModal
      type={modal.payType}
      listingId={modal.listing.id}
      amount={modal.payType==="unlock"?250:modal.listing.price+Math.round(modal.listing.price*0.075)}
      purpose={modal.payType==="unlock"?`Unlock buyer contact: ${modal.listing.title}`:`Escrow for: ${modal.listing.title}`}
      token={token} user={user} allowVoucher={true}
      onSuccess={async(result)=>{
        // If free/voucher unlock, result.listing already has contact info
        if(result.listing){
          const updatedListing=result.listing;
          setListings(p=>p.map(l=>l.id===updatedListing.id?updatedListing:l));
          closeModal();
          setTimeout(()=>setModal({type:"detail",listing:updatedListing}),200);
          notify("🔓 Contact details revealed!","success");
          return;
        }
        // Paid unlock — reload from API to get fresh contact info
        try{
          const fresh=await api(`/api/listings/${modal.listing.id}`,{},token);
          const updatedListing=fresh.listing||fresh;
          setListings(p=>p.map(l=>l.id===updatedListing.id?updatedListing:l));
          closeModal();
          setTimeout(()=>setModal({type:"detail",listing:updatedListing}),200);
        }catch{closeModal();}
        notify(modal.payType==="unlock"?"🔓 Buyer contact revealed!":"🔐 Escrow activated!","success");
      }}
      onClose={closeModal} notify={notify}
    />}
    {resetToken&&<ResetPasswordModal token={resetToken} notify={notify} onClose={()=>{setResetToken(null);setModal({type:"auth",mode:"login"});}}/>}

    {page==="sold"&&<div style={{minHeight:"100vh",background:"#F0F0F0"}}>
      {/* Hero banner */}
      <div style={{background:"#1D1D1D",padding:"clamp(28px,4vw,52px) clamp(16px,4vw,40px) clamp(28px,4vw,48px)"}}>
        <div>
          <button onClick={()=>setPage("home")} style={{background:"transparent",border:"1px solid rgba(255,255,255,.35)",color:"#fff",padding:"7px 16px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"var(--fn)",marginBottom:28,display:"inline-flex",alignItems:"center",gap:6,letterSpacing:".02em",borderRadius:8}}>← Back to Marketplace</button>
          <div style={{marginBottom:14,opacity:.9}}><WekaSokoLogo size={26}/></div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:"rgba(255,255,255,.55)",marginBottom:10}}>Sold Listings</div>
          <h1 style={{fontSize:"clamp(30px,5vw,54px)",fontWeight:700,letterSpacing:"-.03em",color:"#fff",lineHeight:1.05,marginBottom:14}}>Sold on Weka Soko</h1>
          <p style={{fontSize:15,color:"rgba(255,255,255,.7)",maxWidth:500,lineHeight:1.75}}>Real items. Real buyers. Every listing below found a home through Weka Soko.</p>
        </div>
      </div>
      {/* Content */}
      <div style={{padding:"44px 48px 80px"}}>
        <SoldSection token={token} user={user}/>
      </div>
    </div>}
    {user&&!user.is_verified&&page==="home"&&<div style={{position:"sticky",top:60,zIndex:99,padding:"0 16px"}}><VerificationBanner user={user} token={token} notify={notify}/></div>}
    {page==="dashboard"&&user&&<Dashboard user={user} token={token} notify={notify} onPostAd={()=>{setPage("home");setModal({type:"post"});}} onClose={()=>setPage("home")}/>}
    {toast&&<Toast key={toast.id} msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    {showPWA&&!localStorage.getItem("pwa-dismissed")&&<PWABanner onDismiss={()=>{setShowPWA(false);localStorage.setItem("pwa-dismissed","1");}}/>}
  </>;
}
