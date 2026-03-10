import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const API = (process.env.REACT_APP_API_URL || "https://weka-soko-backend-production.up.railway.app").replace(/\/$/, "");
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
const lastSeen = ts => { if(!ts)return""; const d=Date.now()-new Date(ts).getTime(); if(d<30000)return"online"; if(d<60000)return"last seen just now"; if(d<3600000)return"last seen "+Math.floor(d/60000)+"m ago"; if(d<86400000)return"last seen "+Math.floor(d/3600000)+"h ago"; if(d<172800000)return"last seen yesterday"; return"last seen "+new Date(ts).toLocaleDateString("en-KE",{day:"numeric",month:"short"}); };

async function api(path, opts={}, token=null) {
  const isForm = opts.body instanceof FormData;
  const headers = {...(token?{Authorization:`Bearer ${token}`}:{}), ...(!isForm?{"Content-Type":"application/json"}:{}), ...(opts.headers||{})};
  const res = await fetch(`${API}${path}`, {...opts, headers});
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.error||data.message||"Request failed");
  return data;
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,800;1,9..144,700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{--bg:#F7F6F2;--surf:#FFF;--sh:#F0EDE6;--border:#E2DED5;--a:#1A6B38;--a2:#228B44;--gold:#B07F10;--red:#C03030;--blue:#2563EB;--txt:#1C1B18;--mut:#6A6960;--dim:#AAAA9E;--r:12px;--rs:8px;--fn:'DM Sans',system-ui,sans-serif;--fs:'Fraunces',Georgia,serif;}
.dark{--bg:#0E0E0C;--surf:#17170F;--sh:#1C1C18;--border:#2C2C28;--a:#2ECC71;--a2:#27AE60;--gold:#F0C040;--red:#E05050;--blue:#60A5FA;--txt:#F0EFE9;--mut:#888880;--dim:#555548;}
body{background:var(--bg);color:var(--txt);font-family:var(--fn);font-size:15px;line-height:1.6;min-height:100vh;overflow-x:hidden;transition:background .2s,color .2s;}
::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px;}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:10px 20px;border-radius:var(--rs);font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all .15s;white-space:nowrap;font-family:var(--fn);}
.btn:disabled{opacity:.4;cursor:not-allowed;}
.bp{background:var(--a);color:#fff;}.bp:hover:not(:disabled){background:var(--a2);transform:translateY(-1px);box-shadow:0 4px 16px rgba(26,107,56,.3);}
.bs{background:var(--surf);color:var(--txt);border:1.5px solid var(--border);}.bs:hover:not(:disabled){border-color:var(--a);color:var(--a);}
.bg2{background:var(--gold);color:#fff;}.bg2:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px);}
.bgh{background:transparent;color:var(--mut);border:none;padding:7px 11px;}.bgh:hover:not(:disabled){color:var(--txt);background:var(--sh);}
.br2{background:rgba(192,48,48,.07);color:var(--red);border:1px solid rgba(192,48,48,.18);}.br2:hover:not(:disabled){background:rgba(192,48,48,.14);}
.sm{padding:6px 13px;font-size:12px;}.lg{padding:13px 28px;font-size:15px;}
.inp{width:100%;padding:10px 13px;background:var(--sh);border:1.5px solid var(--border);border-radius:var(--rs);color:var(--txt);font-family:var(--fn);font-size:14px;outline:none;transition:border-color .15s,background .15s;}
.inp:focus{border-color:var(--a);background:var(--surf);}
.inp::placeholder{color:var(--dim);}
textarea.inp{resize:vertical;min-height:90px;}
select.inp{appearance:none;cursor:pointer;}
.lbl{display:block;font-size:11px;font-weight:700;color:var(--mut);letter-spacing:.07em;text-transform:uppercase;margin-bottom:5px;}
.badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700;}
.bg-g{background:rgba(26,107,56,.1);color:var(--a);border:1px solid rgba(26,107,56,.2);}
.bg-y{background:rgba(184,134,11,.1);color:var(--gold);border:1px solid rgba(184,134,11,.2);}
.bg-r{background:rgba(192,48,48,.1);color:var(--red);border:1px solid rgba(192,48,48,.2);}
.bg-b{background:rgba(37,99,235,.1);color:var(--blue);border:1px solid rgba(37,99,235,.2);}
.bg-m{background:rgba(100,100,90,.08);color:var(--mut);border:1px solid var(--border);}
.ov{position:fixed;inset:0;background:rgba(0,0,0,.52);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(5px);}
.mod{background:var(--surf);border:1px solid var(--border);border-radius:20px;width:100%;max-width:520px;max-height:94vh;overflow-y:auto;animation:su .2s ease;}
.mod.lg{max-width:720px;}
.mod.xl{max-width:900px;}
@keyframes su{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.mh{padding:22px 26px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--surf);z-index:2;border-radius:20px 20px 0 0;}
.mb{padding:22px 26px;}
.mf{padding:14px 26px 22px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end;}
.nav{position:sticky;top:0;z-index:100;background:rgba(247,246,242,.93);border-bottom:1px solid var(--border);padding:0 26px;height:60px;display:flex;align-items:center;justify-content:space-between;backdrop-filter:blur(18px);}
.dark .nav{background:rgba(14,14,12,.93);}
.logo{font-family:var(--fs);font-size:22px;font-weight:800;cursor:pointer;letter-spacing:-.02em;}
.logo span{color:var(--a);}
.alert{padding:12px 15px;border-radius:var(--rs);font-size:13px;line-height:1.7;}
.ag{background:rgba(26,107,56,.06);border:1px solid rgba(26,107,56,.18);color:var(--a);}
.ay{background:rgba(184,134,11,.06);border:1px solid rgba(184,134,11,.18);color:var(--gold);}
.ar{background:rgba(192,48,48,.06);border:1px solid rgba(192,48,48,.18);color:var(--red);}
.card{background:var(--surf);border:1px solid var(--border);border-radius:var(--r);}
.lcard{background:var(--surf);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;transition:all .18s;cursor:pointer;}
.lcard:hover{transform:translateY(-3px);box-shadow:0 8px 28px rgba(0,0,0,.09);border-color:rgba(26,107,56,.2);}
.lcard-list{display:flex;flex-direction:row;}
.lcard-list .lthumb{width:170px;min-width:170px;height:140px;aspect-ratio:unset;}
.lthumb{width:100%;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;background:var(--sh);position:relative;overflow:hidden;}
.lthumb img{width:100%;height:100%;object-fit:cover;}
.g3{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:20px;}
.lvc{display:flex;flex-direction:column;gap:14px;}
.spin{display:inline-block;width:20px;height:20px;border:2.5px solid var(--border);border-top-color:var(--a);border-radius:50%;animation:sp .7s linear infinite;}
@keyframes sp{to{transform:rotate(360deg)}}
.empty{text-align:center;padding:64px 20px;color:var(--mut);}
.pg{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:36px;flex-wrap:wrap;}
.pb{width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:var(--rs);border:1.5px solid var(--border);background:var(--sh);color:var(--mut);cursor:pointer;font-size:13px;font-weight:700;transition:all .14s;}
.pb.on{background:var(--a);color:#fff;border-color:var(--a);}
.toast{position:fixed;bottom:24px;right:24px;z-index:2000;background:var(--surf);border:1px solid var(--border);border-radius:var(--r);padding:14px 18px;font-size:14px;box-shadow:0 8px 36px rgba(0,0,0,.14);animation:ti .22s ease;display:flex;align-items:center;gap:10px;max-width:340px;}
@keyframes ti{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
.sold-badge{position:absolute;top:10px;right:10px;background:var(--a);color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;}
.img-upload{border:2px dashed var(--border);border-radius:var(--r);padding:24px;text-align:center;cursor:pointer;transition:all .15s;}
.img-upload:hover{border-color:var(--a);background:rgba(26,107,56,.03);}
.img-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px;}
.img-thumb{aspect-ratio:1;border-radius:var(--rs);overflow:hidden;position:relative;background:var(--sh);}
.img-thumb img{width:100%;height:100%;object-fit:cover;}
.img-del{position:absolute;top:4px;right:4px;background:rgba(0,0,0,.65);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;}
.chat-wrap{display:flex;flex-direction:column;height:480px;}
.chat-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:var(--sh);border-radius:var(--rs) var(--rs) 0 0;}
.chat-msg{max-width:75%;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.6;}
.chat-msg.me{align-self:flex-end;background:var(--a);color:#fff;border-radius:14px 14px 3px 14px;}
.chat-msg.them{align-self:flex-start;background:var(--surf);border:1px solid var(--border);border-radius:14px 14px 14px 3px;}
.chat-msg.blocked{opacity:.5;font-style:italic;}
.chat-input{display:flex;gap:8px;padding:12px;border-top:1px solid var(--border);background:var(--surf);border-radius:0 0 var(--rs) var(--rs);}
.tab-row{display:flex;gap:2px;background:var(--sh);border-radius:var(--rs);padding:3px;overflow-x:auto;margin-bottom:20px;}
.tab{padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;transition:all .13s;color:var(--mut);white-space:nowrap;}
.tab.on{background:var(--surf);color:var(--txt);box-shadow:0 1px 4px rgba(0,0,0,.07);}
.notif-dot{position:absolute;top:-3px;right:-3px;width:9px;height:9px;background:var(--red);border-radius:50%;border:2px solid var(--surf);}
.stat-card{background:var(--sh);border:1px solid var(--border);border-radius:var(--r);padding:20px;}
.progress{height:6px;background:var(--border);border-radius:3px;overflow:hidden;margin-top:8px;}
.progress-bar{height:100%;background:var(--a);border-radius:3px;transition:width .6s ease;}
.timeline-item{display:flex;gap:14px;padding:14px 0;border-bottom:1px solid var(--border);}
.timeline-dot{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;margin-top:2px;}
.pwa-banner{position:fixed;bottom:0;left:0;right:0;background:var(--surf);border-top:1px solid var(--border);padding:14px 20px;display:flex;align-items:center;gap:14px;z-index:500;box-shadow:0 -4px 20px rgba(0,0,0,.1);}
@media(max-width:640px){
  .nav{padding:0 14px;}
  .mod{max-width:100%;border-radius:20px 20px 0 0;align-self:flex-end;max-height:95vh;}
  .mh{border-radius:20px 20px 0 0;}
  .mh,.mb,.mf{padding-left:16px;padding-right:16px;}
  .lcard-list{flex-direction:column;}
  .lcard-list .lthumb{width:100%;height:auto;aspect-ratio:16/9;}
  .g3{grid-template-columns:1fr 1fr;}
  .img-grid{grid-template-columns:repeat(3,1fr);}
}
`;

// ── COMPONENTS ────────────────────────────────────────────────────────────────
function Spin({s}){return <span className="spin" style={s?{width:s,height:s}:{}}/>;}

function Toast({msg,type,onClose}){
  useEffect(()=>{const t=setTimeout(onClose,5000);return()=>clearTimeout(t);},[]);
  const c={success:"#1A6B38",error:"#C03030",warning:"#B07F10",info:"#2563EB"}[type]||"#1A6B38";
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
    {label&&<label className="lbl">{label}{required&&<span style={{color:"var(--red)",marginLeft:3}}>*</span>}</label>}
    {children}
    {hint&&<p style={{fontSize:11,color:"var(--dim)",marginTop:4}}>{hint}</p>}
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
      <div style={{fontSize:12,color:"var(--mut)"}}>Or drag & drop · up to 8 photos · First = cover</div>
      <input ref={ref} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>add(e.target.files)}/>
    </div>
    {images.length>0&&<div className="img-grid">{images.map((img,i)=>(
      <div key={i} className="img-thumb">
        <img src={img.preview} alt=""/>
        {i===0&&<div style={{position:"absolute",bottom:4,left:4,background:"var(--a)",color:"#fff",fontSize:9,padding:"2px 7px",borderRadius:8,fontWeight:700}}>COVER</div>}
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
    <div ref={r} onScroll={()=>{const el=r.current;if(el&&el.scrollTop+el.clientHeight>=el.scrollHeight-30)setOk(true);}} style={{maxHeight:380,overflowY:"auto",background:"var(--sh)",borderRadius:"var(--rs)",padding:"16px 18px",fontSize:13,lineHeight:1.9,color:"var(--mut)",whiteSpace:"pre-wrap"}}>{TERMS}</div>
  </Modal>;
}

// ── AUTH MODAL ────────────────────────────────────────────────────────────────
function AuthModal({defaultMode,onClose,onAuth,notify}){
  const [mode,setMode]=useState(defaultMode||"login");
  const [loading,setLoading]=useState(false);
  const [showTerms,setShowTerms]=useState(false);
  const [agreed,setAgreed]=useState(false);
  const [f,setF]=useState({name:"",email:"",password:"",role:"buyer",phone:""});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));

  const submit=async()=>{
    if(!f.email||!f.password){notify("Please fill in all fields.","warning");return;}
    if(mode==="signup"){
      if(!f.name.trim()){notify("Please enter your name.","warning");return;}
      if(f.password.length<8){notify("Password needs 8+ characters.","warning");return;}
      if(!agreed){notify("Please accept the Terms & Conditions.","warning");return;}
    }
    setLoading(true);
    try{
      const data=mode==="login"
        ?await api("/api/auth/login",{method:"POST",body:JSON.stringify({email:f.email.trim(),password:f.password})})
        :await api("/api/auth/register",{method:"POST",body:JSON.stringify({name:f.name.trim(),email:f.email.trim(),password:f.password,role:f.role,phone:f.phone||undefined})});
      localStorage.setItem("ws_token",data.token);
      localStorage.setItem("ws_user",JSON.stringify(data.user));
      onAuth(data.user,data.token);onClose();
      notify(`Welcome${data.user.name?", "+data.user.name.split(" ")[0]:""}! 🎉`,"success");
    }catch(err){notify(err.message,"error");}
    finally{setLoading(false);}
  };

  if(showTerms)return <TermsModal onClose={()=>setShowTerms(false)} onAccept={()=>{setAgreed(true);setShowTerms(false);notify("Terms accepted ✓","success");}}/>;

  return <Modal title={mode==="login"?"Sign In":"Create Account"} onClose={onClose} footer={
    <><button className="btn bs" onClick={onClose}>Cancel</button><button className="btn bp" onClick={submit} disabled={loading}>{loading?<Spin/>:mode==="login"?"Sign In →":"Create Account →"}</button></>
  }>
    {/* Google OAuth placeholder */}
    <button className="btn bs" style={{width:"100%",marginBottom:16,gap:10}} onClick={()=>window.location.href=`${API}/api/auth/google`}>
      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8.1 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.9 1.1 8.1 3l5.7-5.7C34.5 6.5 29.5 4 24 4c-7.8 0-14.5 4.4-17.7 10.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10.1-2 13.7-5.2l-6.3-5.3C29.5 35.5 26.9 36.5 24 36.5c-5.2 0-9.6-3.5-11.2-8.2l-6.5 5C9.4 39.5 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6.1 0 .1 0 0 0l6.3 5.3C37.5 38.7 44 34 44 24c0-1.3-.1-2.7-.4-3.9z"/></svg>
      Continue with Google
    </button>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
      <div style={{flex:1,height:1,background:"var(--border)"}}/>
      <span style={{fontSize:12,color:"var(--dim)"}}>or with email</span>
      <div style={{flex:1,height:1,background:"var(--border)"}}/>
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
    <FF label="Password" required hint={mode==="signup"?"Minimum 8 characters":""}>
      <input className="inp" type="password" placeholder="••••••••" value={f.password} onChange={e=>sf("password",e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
    </FF>
    {mode==="signup"&&<div style={{background:"var(--sh)",borderRadius:"var(--rs)",padding:"12px 14px"}}>
      <label style={{display:"flex",alignItems:"flex-start",gap:9,cursor:"pointer",fontSize:13,color:"var(--mut)"}}>
        <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} style={{marginTop:3,width:15,height:15}}/>
        <span>I have read and accept the <button className="btn bgh" style={{display:"inline",padding:"0 2px",color:"var(--a)",fontWeight:700,fontSize:13}} onClick={()=>setShowTerms(true)}>Terms & Conditions</button></span>
      </label>
    </div>}
    <p style={{textAlign:"center",marginTop:14,fontSize:13,color:"var(--mut)"}}>
      {mode==="login"?"No account? ":"Already have one? "}
      <button className="btn bgh" style={{display:"inline",padding:"0 3px",color:"var(--a)",fontWeight:700,fontSize:13}} onClick={()=>setMode(m=>m==="login"?"signup":"login")}>{mode==="login"?"Sign up free →":"Sign in"}</button>
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
    <div style={{background:"var(--sh)",borderRadius:"var(--rs)",padding:14,marginBottom:18,display:"flex",gap:12,alignItems:"center"}}>
      <span style={{fontSize:28}}>🔗</span>
      <div><div style={{fontWeight:600}}>{listing.title}</div><div style={{fontSize:12,color:"var(--mut)"}}>{fmtKES(listing.price)}</div></div>
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

  const ManualInput=()=><div style={{marginTop:14,borderTop:"1px solid var(--border)",paddingTop:14}}>
    <div className="lbl" style={{marginBottom:8}}>Paid directly? Enter M-Pesa Transaction Code</div>
    <div style={{display:"flex",gap:8}}>
      <input className="inp" placeholder="e.g. RJK2X4ABCD" value={manualCode} onChange={e=>setManualCode(e.target.value.toUpperCase())} style={{flex:1,fontFamily:"monospace",letterSpacing:".05em"}} maxLength={12}/>
      <button className="btn bg2 sm" onClick={verifyManual} disabled={verifying||manualCode.length<8}>{verifying?<Spin/>:"Verify"}</button>
    </div>
    <p style={{fontSize:11,color:"var(--dim)",marginTop:5}}>We confirm the code was paid to Till 5673935 before unlocking.</p>
  </div>;

  return <Modal title={type==="unlock"?"🔓 Unlock Buyer Contact":"🔐 Escrow Payment"} onClose={onClose}>
    {step==="form"&&<>
      <div style={{background:"rgba(26,107,56,.06)",border:"1px solid rgba(26,107,56,.2)",borderRadius:"var(--r)",padding:"18px 20px",marginBottom:18}}>
        <div style={{fontSize:11,color:"var(--mut)",marginBottom:4}}>Till Number <strong style={{color:"var(--txt)"}}>5673935</strong> · Weka Soko</div>
        <div style={{display:"flex",alignItems:"baseline",gap:12,flexWrap:"wrap"}}>
          <div style={{fontSize:36,fontWeight:800,color:"var(--a)"}}>{fmtKES(finalAmt)}</div>
          {discount>0&&<div style={{fontSize:16,color:"var(--dim)",textDecoration:"line-through"}}>{fmtKES(amount)}</div>}
        </div>
        {discount>0&&<div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
          <span className="badge bg-g">🏷 {discount}% off</span>
          <span className="badge bg-g">You save {fmtKES(saving)}</span>
        </div>}
        <div style={{fontSize:13,color:"var(--mut)",marginTop:6}}>{purpose}</div>
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
              <div style={{background:"var(--sh)",border:"1.5px solid var(--border)",borderRight:"none",borderRadius:"var(--rs) 0 0 var(--rs)",padding:"10px 12px",fontSize:13,color:"var(--mut)",whiteSpace:"nowrap"}}>🇰🇪 +254</div>
              <input className="inp" style={{borderRadius:"0 var(--rs) var(--rs) 0"}} value={phone} onChange={e=>setPhone(e.target.value.replace(/[^0-9]/g,""))} placeholder="0712345678" maxLength={10}/>
            </div>
          </FF>
          <button className="btn bp lg" style={{width:"100%"}} onClick={startPayment} disabled={phone.length<10}>
            📱 Send M-Pesa Request → {fmtKES(finalAmt)}
          </button>
          <ManualInput/>
        </>}
    </>}
    {step==="pushing"&&<div style={{textAlign:"center",padding:"32px 0"}}>
      <div style={{marginBottom:18}}><Spin s="48px"/></div>
      <h3 style={{fontWeight:700,marginBottom:8}}>Sending M-Pesa Request...</h3>
      <p style={{color:"var(--mut)",fontSize:14}}>Watch for a push notification on <strong>{phone}</strong></p>
    </div>}
    {step==="polling"&&<div style={{textAlign:"center",padding:"24px 0"}}>
      <div style={{fontSize:64,marginBottom:12}}>📱</div>
      <h3 style={{fontWeight:700,marginBottom:8}}>Enter Your M-Pesa PIN</h3>
      <p style={{color:"var(--mut)",fontSize:14,marginBottom:16}}>Check your phone · Pay Till <strong>5673935</strong> · {fmtKES(finalAmt)}</p>
      <div style={{fontSize:48,fontWeight:800,color:"var(--a)",marginBottom:8}}>{cd}s</div>
      <div className="progress"><div className="progress-bar" style={{width:`${(cd/90)*100}%`}}/></div>
      <ManualInput/>
    </div>}
    {step==="timeout"&&<div style={{textAlign:"center",padding:"24px 0"}}>
      <div style={{fontSize:64,marginBottom:12}}>⏱</div>
      <h3 style={{fontWeight:700,marginBottom:8}}>Request Timed Out</h3>
      <p style={{color:"var(--mut)",fontSize:14,marginBottom:14}}>Did you pay? Paste your M-Pesa code to verify:</p>
      <ManualInput/>
      <button className="btn bs" style={{width:"100%",marginTop:12}} onClick={()=>{setStep("form");if(pollRef.current)clearInterval(pollRef.current);}}>← Try Again</button>
    </div>}
    {step==="done"&&<div style={{textAlign:"center",padding:"32px 0"}}>
      <div style={{fontSize:64,marginBottom:14}}>✅</div>
      <h3 style={{color:"var(--a)",fontWeight:700,marginBottom:8}}>Unlocked!</h3>
      <p style={{color:"var(--mut)",fontSize:14}}>Buyer contact details are now visible. Check your email for the receipt.</p>
    </div>}
    {step==="error"&&<div style={{textAlign:"center",padding:"32px 0"}}>
      <div style={{fontSize:64,marginBottom:14}}>❌</div>
      <h3 style={{color:"var(--red)",fontWeight:700,marginBottom:8}}>Payment Failed</h3>
      <p style={{color:"var(--mut)",fontSize:14,marginBottom:18}}>{errMsg}</p>
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
    if(p.is_online)return{text:"Online",color:"var(--a)",dot:"#22c55e"};
    if(!p.last_seen)return{text:"Offline",color:"var(--dim)",dot:"var(--dim)"};
    return{text:"Last seen "+ago(p.last_seen),color:"var(--mut)",dot:"var(--dim)"};
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

    socket.on("new_message",msg=>{
      setMessages(p=>{
        // Don't duplicate optimistic messages
        if(p.some(m=>m.id===msg.id))return p;
        return [...p,{...msg,direction:msg.sender_id===user.id?"me":"them"}];
      });
      setTyping(false);
      // Update other user presence on message
      if(msg.sender_id!==user.id){
        setOtherUserId(msg.sender_id);
        setOtherPresence(p=>({...p,is_online:true}));
      }
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

    socket.on("message_blocked",({reason})=>notify(`Message blocked: ${reason}`,"warning"));
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
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,padding:"10px 14px",background:"var(--sh)",borderRadius:"var(--rs)"}}>
      <div style={{width:10,height:10,borderRadius:"50%",background:connected?"var(--a)":"var(--dim)",flexShrink:0,boxShadow:connected?"0 0 0 3px rgba(26,107,56,.2)":"none",transition:"all .3s"}}/>
      <span style={{fontSize:12,color:"var(--mut)"}}>{connected?"Connected":"Reconnecting..."}</span>
      {presence&&<>
        <div style={{width:1,height:14,background:"var(--border)"}}/>
        <div style={{width:8,height:8,borderRadius:"50%",background:presence.dot,flexShrink:0}}/>
        <span style={{fontSize:12,color:presence.color,fontWeight:500}}>{presence.text}</span>
      </>}
      <span style={{fontSize:11,color:"var(--dim)",marginLeft:"auto"}}>🔒 Moderated</span>
    </div>

    <div className="chat-wrap">
      <div className="chat-msgs">
        {loading
          ?<div style={{textAlign:"center",padding:20}}><Spin/></div>
          :messages.length===0
            ?<div style={{textAlign:"center",padding:32,color:"var(--mut)",fontSize:13}}>
                <div style={{fontSize:40,marginBottom:10,opacity:.3}}>💬</div>
                No messages yet. Start the conversation!
              </div>
            :messages.map((m,i)=>(
            <div key={m.id||i} style={{display:"flex",flexDirection:"column",alignItems:m.direction==="me"?"flex-end":"flex-start"}}>
              {m.sender_anon&&m.direction==="them"&&<div style={{fontSize:10,color:"var(--dim)",marginBottom:3,marginLeft:4}}>{m.sender_anon}</div>}
              <div className={`chat-msg ${m.direction||"them"}${m.is_blocked?" blocked":""}`}>
                <div>{m.is_blocked?<em style={{opacity:.6}}>🚫 {m.block_reason||"Removed"}</em>:m.body}</div>
                <div style={{fontSize:10,opacity:.5,marginTop:4,textAlign:m.direction==="me"?"right":"left"}}>{ago(m.created_at)}</div>
              </div>
            </div>
          ))}
        {typing&&<div style={{alignSelf:"flex-start",padding:"8px 14px",background:"var(--surf)",border:"1px solid var(--border)",borderRadius:"14px 14px 14px 3px",fontSize:13,color:"var(--mut)"}}>
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
function PostAdModal({onClose,onSuccess,token,notify}){
  const [step,setStep]=useState(1);
  const [loading,setLoading]=useState(false);
  const [images,setImages]=useState([]);
  const [f,setF]=useState({title:"",category:"",subcat:"",price:"",description:"",reason:"",location:""});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const cat=CATS.find(c=>c.name===f.category);

  const submit=async()=>{
    if(!f.reason.trim()||!f.location.trim()){notify("Please fill in all required fields.","warning");return;}
    setLoading(true);
    try{
      const fd=new FormData();
      Object.entries({title:f.title,category:f.category,price:f.price,description:f.description,reason_for_sale:f.reason,location:f.location}).forEach(([k,v])=>fd.append(k,v));
      if(f.subcat)fd.append("subcat",f.subcat);
      images.forEach(img=>fd.append("photos",img.file));
      const result=await api("/api/listings",{method:"POST",body:fd},token);
      onSuccess(result);onClose();
      notify("🚀 Ad is live!","success");
    }catch(err){notify(err.message,"error");}
    finally{setLoading(false);}
  };

  return <Modal title={`Post Ad — Step ${step}/2`} onClose={onClose} footer={
    <div style={{display:"flex",gap:8,width:"100%"}}>
      {step===2&&<button className="btn bs" onClick={()=>setStep(1)}>← Back</button>}
      <div style={{flex:1}}/>
      {step===1&&<button className="btn bp" onClick={()=>setStep(2)} disabled={!f.title.trim()||!f.category||!f.price||!f.description.trim()}>Continue →</button>}
      {step===2&&<button className="btn bp" onClick={submit} disabled={loading}>{loading?<Spin/>:"Publish Ad 🚀"}</button>}
    </div>
  }>
    <div className="alert ag" style={{marginBottom:16,fontSize:12}}>✅ Posting is 100% free. KSh 250 only when a buyer locks in.</div>
    {step===1&&<>
      <FF label="Item Title" required><input className="inp" placeholder="e.g. iPhone 14 Pro 256GB" value={f.title} onChange={e=>sf("title",e.target.value)}/></FF>
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
      <FF label="Description" required hint="Condition, what's included, any defects..."><textarea className="inp" placeholder="Excellent condition, barely used..." value={f.description} onChange={e=>sf("description",e.target.value)}/></FF>
      <FF label="Photos (up to 8 — first is cover)"><ImageUploader images={images} setImages={setImages}/></FF>
    </>}
    {step===2&&<>
      <FF label="Reason for Selling" required><input className="inp" placeholder="e.g. Upgrading to newer model" value={f.reason} onChange={e=>sf("reason",e.target.value)}/></FF>
      <FF label="Collection Location" required hint="General area. Exact address shared after unlock."><input className="inp" placeholder="e.g. Westlands, Nairobi" value={f.location} onChange={e=>sf("location",e.target.value)}/></FF>
      <div className="alert ay" style={{fontSize:12}}>🔒 Your phone/email are hidden until a buyer pays KSh 250 to unlock them.</div>
    </>}
  </Modal>;
}

// ── LISTING CARD ──────────────────────────────────────────────────────────────
function ListingCard({listing:l,onClick,listView}){
  const photo=Array.isArray(l.photos)?l.photos.find(p=>typeof p==="string")||l.photos[0]?.url||null:null;
  return <div className={`lcard${listView?" lcard-list":""}`} onClick={onClick}>
    <div className="lthumb">
      {photo?<img src={photo} alt={l.title}/>:<span style={{fontSize:44,opacity:.2}}>📦</span>}
      {l.status==="sold"&&<div className="sold-badge">SOLD ✓</div>}
      {l.locked_buyer_id&&!l.is_unlocked&&<div style={{position:"absolute",bottom:8,left:8,background:"var(--gold)",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20}}>🔥 Buyer Interested</div>}
    </div>
    <div style={{padding:"14px 15px",flex:1}}>
      <h4 style={{fontSize:14,fontWeight:600,lineHeight:1.35,marginBottom:6}}>{l.title}</h4>
      <div style={{fontSize:22,fontWeight:800,color:"var(--a)",marginBottom:6}}>{fmtKES(l.price)}</div>
      {listView&&l.description&&<p style={{fontSize:13,color:"var(--mut)",marginBottom:8,lineHeight:1.65}}>{l.description.slice(0,130)}...</p>}
      <div style={{display:"flex",gap:10,color:"var(--mut)",fontSize:12,flexWrap:"wrap"}}>
        {l.location&&<span>📍 {l.location}</span>}<span>👁 {l.view_count||0}</span><span>{ago(l.created_at)}</span>
      </div>
      <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
        <span className="badge bg-m">{l.category}</span>
        {l.locked_buyer_id&&!l.is_unlocked&&<span className="badge bg-y">Buyer Waiting</span>}
      </div>
    </div>
  </div>;
}

// ── DETAIL MODAL ──────────────────────────────────────────────────────────────
function DetailModal({listing:l,user,token,onClose,onShare,onChat,onLockIn,onUnlock,onEscrow,notify}){
  const isSeller=user?.id===l.seller_id;
  const isBuyer=user?.id===l.locked_buyer_id;
  const photos=Array.isArray(l.photos)?l.photos.map(p=>typeof p==="string"?p:p?.url).filter(Boolean):[];
  const [mainPhoto,setMainPhoto]=useState(photos[0]||null);
  const escrowFee=Math.round(l.price*0.075);

  return <Modal title={l.title} onClose={onClose} large footer={
    <div style={{width:"100%",display:"flex",gap:8,flexWrap:"wrap"}}>
      <button className="btn bgh sm" onClick={onShare}>↗ Share</button>
      {(isSeller||isBuyer||user?.role==="admin")&&<button className="btn bs sm" onClick={onChat}>💬 Chat</button>}
      {!isSeller&&l.status==="active"&&!l.locked_buyer_id&&user&&<button className="btn bg2 sm" onClick={onLockIn}>🔥 I'm Interested — Lock In</button>}
      {!isSeller&&l.status==="active"&&user&&<button className="btn bs sm" onClick={onEscrow}>🔐 Buy with Escrow</button>}
      {isSeller&&l.locked_buyer_id&&!l.is_unlocked&&<button className="btn bp" style={{flex:1}} onClick={onUnlock}>🔓 Pay KSh 250 to See Buyer Contact</button>}
      {!user&&<button className="btn bp" onClick={()=>{}}>Sign In to Contact Seller</button>}
    </div>
  }>
    {/* Photos */}
    <div style={{background:"var(--sh)",borderRadius:"var(--rs)",aspectRatio:"16/9",overflow:"hidden",marginBottom:10,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
      {mainPhoto?<img src={mainPhoto} alt={l.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:80,opacity:.15}}>📦</span>}
      {l.status==="sold"&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{background:"var(--a)",color:"#fff",padding:"8px 28px",borderRadius:30,fontWeight:800,fontSize:20}}>SOLD ✓</div></div>}
    </div>
    {photos.length>1&&<div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto"}}>
      {photos.map((p,i)=><img key={i} src={p} alt="" onClick={()=>setMainPhoto(p)} style={{width:70,height:55,objectFit:"cover",borderRadius:"var(--rs)",cursor:"pointer",opacity:mainPhoto===p?1:.55,border:mainPhoto===p?"2px solid var(--a)":"2px solid transparent",flexShrink:0}}/>)}
    </div>}

    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
      <div>
        <div style={{fontSize:32,fontWeight:800,color:"var(--a)"}}>{fmtKES(l.price)}</div>
        <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
          <span className="badge bg-m">{l.category}</span>
          {l.subcat&&<span className="badge bg-m">{l.subcat}</span>}
        </div>
      </div>
      <span className={`badge ${l.status==="active"?"bg-g":l.status==="sold"?"bg-y":"bg-m"}`}>{l.status}</span>
    </div>

    {l.description&&<div style={{marginBottom:16}}><div className="lbl">Description</div><p style={{color:"var(--mut)",fontSize:14,lineHeight:1.8}}>{l.description}</p></div>}

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
      {l.reason_for_sale&&<div style={{background:"var(--sh)",borderRadius:"var(--rs)",padding:"12px 14px"}}><div className="lbl">Reason for Sale</div><div style={{fontSize:13}}>{l.reason_for_sale}</div></div>}
      {l.location&&<div style={{background:"var(--sh)",borderRadius:"var(--rs)",padding:"12px 14px"}}><div className="lbl">Location</div><div style={{fontSize:13}}>📍 {l.location}</div></div>}
    </div>

    {/* Seller contact */}
    <div style={{marginBottom:16}}>
      <div className="lbl">Seller</div>
      {l.is_unlocked
        ?<div className="alert ag"><strong>🔓 Unlocked</strong> · {l.seller_name} · 📞 {l.seller_phone||"—"} · ✉️ {l.seller_email||"—"}</div>
        :<div style={{background:"var(--sh)",borderRadius:"var(--rs)",padding:"14px",display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:30}}>🔒</span>
          <div><div style={{fontWeight:600}}>{l.seller_anon||"Anonymous Seller"}</div><div style={{fontSize:12,color:"var(--mut)"}}>Pay KSh 250 to reveal contact details</div></div>
          {isSeller&&l.locked_buyer_id&&<button className="btn bp sm" style={{marginLeft:"auto"}} onClick={onUnlock}>Unlock → KSh 250</button>}
        </div>}
    </div>

    {/* Escrow info */}
    {!isSeller&&l.status==="active"&&<div className="alert ay" style={{fontSize:12}}>
      🔐 <strong>Safe Escrow:</strong> Pay {fmtKES(l.price+escrowFee)} (item {fmtKES(l.price)} + 7.5% fee). Funds held until you confirm you received the item.
    </div>}

    <div style={{display:"flex",gap:16,fontSize:12,color:"var(--mut)",marginTop:10}}>
      <span>👁 {l.view_count||0} views</span><span>🔥 {l.interest_count||0} interested</span><span>🕒 {ago(l.created_at)}</span>
    </div>
  </Modal>;
}

// ── ROLE SWITCHER ─────────────────────────────────────────────────────────────
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

// ── DASHBOARD (REVAMPED) ──────────────────────────────────────────────────────
function Dashboard({user,token,notify,onPostAd,onClose}){
  const [tab,setTab]=useState("overview");
  const [listings,setListings]=useState([]);
  const [notifs,setNotifs]=useState([]);
  const [threads,setThreads]=useState([]);
  const [stats,setStats]=useState(null);
  const [loading,setLoading]=useState(true);
  const [selectedListing,setSelectedListing]=useState(null);
  const [showPayModal,setShowPayModal]=useState(null);

  useEffect(()=>{
    const load=async()=>{
      setLoading(true);
      try{
        const [ls,ns,th]=await Promise.all([
          api("/api/listings/seller/mine",{},token).catch(()=>[]),
          api("/api/notifications",{},token).catch(()=>[]),
          api("/api/chat/threads/mine",{},token).catch(()=>[]),
        ]);
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
      }finally{setLoading(false);}
    };
    load();
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

  return <Modal title="My Account" onClose={onClose} xl>
    {/* Profile header */}
    <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:22,padding:"16px 20px",background:"linear-gradient(135deg,rgba(26,107,56,.08),rgba(26,107,56,.02))",borderRadius:"var(--r)",border:"1px solid rgba(26,107,56,.12)"}}>
      <div style={{width:56,height:56,borderRadius:"50%",background:"var(--a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#fff",fontWeight:700,flexShrink:0}}>
        {user.name?.charAt(0)?.toUpperCase()||"U"}
      </div>
      <div style={{flex:1}}>
        <div style={{fontWeight:800,fontSize:18,marginBottom:2}}>{user.name}</div>
        <div style={{fontSize:13,color:"var(--mut)"}}>{user.email}</div>
        <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
          <span className={`badge ${user.role==="seller"?"bg-g":"bg-b"}`}>{user.role==="seller"?"🏷 Seller":"🛍 Buyer"}</span>
          {user.is_verified&&<span className="badge bg-g">✓ Verified</span>}
          {unreadCount>0&&<span className="badge bg-r">{unreadCount} unread</span>}
        </div>
      </div>
      {user.role==="seller"&&<button className="btn bp sm" onClick={()=>{onClose();onPostAd();}}>+ Post Ad</button>}
    </div>

    {/* Tabs */}
    <div className="tab-row">
      {[["overview","📊 Overview"],["inbox","💬 Messages"+(unreadCount>0?` (${unreadCount})`:"")],["ads","📦 My Ads"],["activity","🔔 Activity"],["settings","⚙️ Settings"]].map(([id,label])=>(
        <div key={id} className={`tab${tab===id?" on":""}`} onClick={()=>setTab(id)}>{label}</div>
      ))}
    </div>

    {loading&&<div style={{textAlign:"center",padding:48}}><Spin s="40px"/></div>}

    {!loading&&tab==="overview"&&stats&&<>
      {/* Stats grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10,marginBottom:22}}>
        {[
          {icon:"📦",label:"Total Ads",val:stats.totalListings,color:"var(--a)"},
          {icon:"✅",label:"Active",val:stats.activeListings,color:"var(--a)"},
          {icon:"🏆",label:"Sold",val:stats.soldListings,color:"var(--gold)"},
          {icon:"👁",label:"Total Views",val:stats.totalViews,color:"var(--blue)"},
          {icon:"🔥",label:"Buyers Waiting",val:stats.buyersWaiting,color:"var(--red)"},
          {icon:"💬",label:"Unread Msgs",val:stats.unreadMessages,color:"var(--blue)"},
        ].map(s=>(
          <div key={s.label} className="stat-card">
            <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
            <div style={{fontSize:28,fontWeight:800,color:s.color}}>{s.val}</div>
            <div style={{fontSize:11,color:"var(--mut)",marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Buyers waiting — action items */}
      {stats.buyersWaiting>0&&<>
        <div className="lbl" style={{marginBottom:10}}>🔥 Action Required — Buyers Waiting</div>
        {listings.filter(l=>l.locked_buyer_id&&!l.is_unlocked).map(l=>(
          <div key={l.id} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:"rgba(176,127,16,.07)",border:"1px solid rgba(176,127,16,.2)",borderRadius:"var(--rs)",marginBottom:10}}>
            <span style={{fontSize:28}}>🔥</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,marginBottom:2}}>{l.title}</div>
              <div style={{fontSize:12,color:"var(--mut)"}}>A buyer has locked in! Pay KSh 250 to see their contact.</div>
            </div>
            <button className="btn bp sm" onClick={()=>setShowPayModal(l)}>Unlock → KSh 250</button>
          </div>
        ))}
        <div style={{height:10}}/>
      </>}

      {/* Recent listings */}
      <div className="lbl" style={{marginBottom:10}}>Recent Ads</div>
      {listings.slice(0,4).map(l=>(
        <div key={l.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"var(--sh)",borderRadius:"var(--rs)",marginBottom:8,border:"1px solid var(--border)"}}>
          <div style={{width:48,height:40,borderRadius:"var(--rs)",background:"var(--border)",overflow:"hidden",flexShrink:0}}>
            {Array.isArray(l.photos)&&l.photos[0]&&<img src={typeof l.photos[0]==="string"?l.photos[0]:l.photos[0]?.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
          </div>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,fontSize:14}}>{l.title}</div>
            <div style={{fontSize:12,color:"var(--mut)"}}>{fmtKES(l.price)} · {l.view_count||0} views</div>
          </div>
          <span className={`badge ${l.status==="active"?"bg-g":l.status==="sold"?"bg-y":"bg-m"}`}>{l.status}</span>
        </div>
      ))}
      {listings.length===0&&<div className="empty" style={{padding:"32px 0"}}>
        <div style={{fontSize:48,marginBottom:12,opacity:.3}}>📦</div>
        <p>You haven't posted any ads yet.</p>
        {user.role==="seller"&&<button className="btn bp" style={{marginTop:14}} onClick={()=>{onClose();onPostAd();}}>Post Your First Ad →</button>}
      </div>}
    </>}

    {!loading&&tab==="inbox"&&<>
      <div className="lbl" style={{marginBottom:12}}>Chat Threads</div>
      {threads.length===0?<div className="empty"><div style={{fontSize:48,marginBottom:12,opacity:.3}}>💬</div><p>No conversations yet</p></div>
        :threads.map((t,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:"var(--sh)",borderRadius:"var(--rs)",marginBottom:8,border:"1px solid var(--border)",cursor:"pointer"}} onClick={()=>setSelectedListing({id:t.listing_id,title:t.title,seller_id:t.seller_id,is_unlocked:t.is_unlocked||false,locked_buyer_id:t.locked_buyer_id})}>
            <div style={{position:"relative",flexShrink:0}}>
              <div style={{width:44,height:44,borderRadius:"50%",background:"var(--a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#fff"}}>
                {t.other_party_anon?.charAt(0)?.toUpperCase()||"?"}
              </div>
              {t.is_online&&<div style={{position:"absolute",bottom:1,right:1,width:11,height:11,background:"#22C55E",borderRadius:"50%",border:"2px solid var(--surf)"}}/>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,fontSize:14}}>{t.title}</div>
              <div style={{fontSize:12,color:"var(--mut)",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.last_message?.slice(0,55)||"No messages"}</div>
              {!t.is_online&&t.last_seen&&<div style={{fontSize:11,color:"var(--dim)",marginTop:2}}>{lastSeen(t.last_seen)}</div>}
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:11,color:"var(--dim)"}}>{ago(t.last_message_at)}</div>
              {parseInt(t.unread_count||0)>0&&<div style={{background:"var(--red)",color:"#fff",borderRadius:10,fontSize:10,fontWeight:700,padding:"2px 7px",marginTop:4,display:"inline-block"}}>{t.unread_count}</div>}
            </div>
          </div>
        ))}
      <div className="lbl" style={{margin:"18px 0 12px"}}>Notifications</div>
      {notifs.filter(n=>n.type==="new_message").map((n,i)=>(
        <div key={i} style={{padding:"12px 14px",background:n.is_read?"var(--sh)":"rgba(26,107,56,.06)",borderRadius:"var(--rs)",marginBottom:8,border:`1px solid ${n.is_read?"var(--border)":"rgba(26,107,56,.18)"}`,cursor:"pointer"}} onClick={()=>markRead(n.id)}>
          <div style={{fontWeight:n.is_read?400:700,fontSize:13}}>{n.title}</div>
          <div style={{fontSize:12,color:"var(--mut)",marginTop:3}}>{n.body}</div>
          <div style={{fontSize:11,color:"var(--dim)",marginTop:4}}>{ago(n.created_at)}</div>
        </div>
      ))}
      {threads.length===0&&notifs.filter(n=>n.type==="new_message").length===0&&<div className="empty"><p>No messages yet</p></div>}
    </>}

    {!loading&&tab==="ads"&&<>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div className="lbl" style={{margin:0}}>Your Listings ({listings.length})</div>
        {user.role==="seller"&&<button className="btn bp sm" onClick={()=>{onClose();onPostAd();}}>+ New Ad</button>}
      </div>
      {listings.length===0?<div className="empty"><div style={{fontSize:48,marginBottom:12,opacity:.3}}>📦</div><p>No ads yet</p></div>
        :listings.map(l=>(
          <div key={l.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"var(--sh)",borderRadius:"var(--rs)",marginBottom:10,border:"1px solid var(--border)"}}>
            <div style={{width:54,height:44,borderRadius:"var(--rs)",background:"var(--border)",overflow:"hidden",flexShrink:0}}>
              {Array.isArray(l.photos)&&l.photos[0]&&<img src={typeof l.photos[0]==="string"?l.photos[0]:l.photos[0]?.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.title}</div>
              <div style={{fontSize:12,color:"var(--mut)"}}>{fmtKES(l.price)} · 👁 {l.view_count||0} · 🔥 {l.interest_count||0}</div>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end"}}>
              <span className={`badge ${l.status==="active"?"bg-g":l.status==="sold"?"bg-y":"bg-m"}`}>{l.status}</span>
              {l.locked_buyer_id&&!l.is_unlocked&&<button className="btn bp sm" onClick={()=>setShowPayModal(l)}>Unlock</button>}
              <button className="btn br2 sm" onClick={()=>deleteListing(l.id)}>Delete</button>
            </div>
          </div>
        ))}
    </>}

    {!loading&&tab==="activity"&&<>
      <div className="lbl" style={{marginBottom:14}}>All Notifications</div>
      {notifs.length===0?<div className="empty"><div style={{fontSize:48,marginBottom:12,opacity:.3}}>🔔</div><p>No notifications</p></div>
        :notifs.map((n,i)=>(
          <div key={i} className="timeline-item" onClick={()=>markRead(n.id)} style={{cursor:"pointer"}}>
            <div className="timeline-dot" style={{background:n.is_read?"var(--sh)":"rgba(26,107,56,.12)"}}>
              {({new_message:"💬",buyer_locked_in:"🔥",escrow_released:"💰",payment_confirmed:"✅",warning:"⚠️"})[n.type]||"🔔"}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:n.is_read?500:700,fontSize:14}}>{n.title}</div>
              <div style={{fontSize:13,color:"var(--mut)",marginTop:2,lineHeight:1.6}}>{n.body}</div>
              <div style={{fontSize:11,color:"var(--dim)",marginTop:4}}>{ago(n.created_at)}</div>
            </div>
            {!n.is_read&&<div style={{width:8,height:8,background:"var(--a)",borderRadius:"50%",flexShrink:0,marginTop:6}}/>}
          </div>
        ))}
      {notifs.length>0&&<button className="btn bs" style={{width:"100%",marginTop:10}} onClick={async()=>{await api("/api/notifications/read-all",{method:"PATCH"},token).catch(()=>{});setNotifs(p=>p.map(n=>({...n,is_read:true})));notify("All marked as read.","success");}}>Mark All Read</button>}
    </>}

    {!loading&&tab==="settings"&&<>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <div style={{padding:"16px",background:"var(--sh)",borderRadius:"var(--rs)",border:"1px solid var(--border)"}}>
          <div className="lbl">Account Info</div>
          <div style={{fontSize:14,marginBottom:4}}><strong>Name:</strong> {user.name}</div>
          <div style={{fontSize:14,marginBottom:4}}><strong>Email:</strong> {user.email}</div>
          <div style={{fontSize:14,marginBottom:4}}><strong>Role:</strong> <span className={`badge ${user.role==="seller"?"bg-g":"bg-b"}`}>{user.role==="seller"?"🏷 Seller":"🛍 Buyer"}</span></div>
        </div>
        <RoleSwitcher user={user} token={token} notify={notify} onSwitch={newUser=>{localStorage.setItem("ws_user",JSON.stringify(newUser));window.location.reload();}}/>
        <button className="btn bs" style={{justifyContent:"flex-start",gap:10}} onClick={()=>{localStorage.removeItem("ws_token");localStorage.removeItem("ws_user");onClose();window.location.reload();}}>🚪 Sign Out</button>
        <button className="btn br2" style={{justifyContent:"flex-start",gap:10}} onClick={async()=>{
          if(!window.confirm("Permanently delete your account? ALL your listings and data will be removed forever. This CANNOT be undone."))return;
          try{
            await api("/api/auth/account",{method:"DELETE",body:JSON.stringify({})},token);
            localStorage.removeItem("ws_token");localStorage.removeItem("ws_user");
            onClose();window.location.reload();
          }catch(err){notify(err.message,"error");}
        }}>🗑 Delete My Account</button>
      </div>
    </>}

    {/* Chat thread opener */}
    {selectedListing&&<ChatModal listing={selectedListing} user={user} token={token} onClose={()=>setSelectedListing(null)} notify={notify}/>}

    {/* Pay to unlock */}
    {showPayModal&&<PayModal
      type="unlock"
      listingId={showPayModal.id}
      amount={250}
      purpose={`Unlock buyer contact for: ${showPayModal.title}`}
      token={token}
      user={user}
      allowVoucher={true}
      onSuccess={async(result)=>{
        const lid=showPayModal.id;
        setShowPayModal(null);
        try{
          const fresh=await api(`/api/listings/${lid}`,{},token);
          const ul=fresh.listing||fresh;
          setListings(p=>p.map(l=>l.id===lid?ul:l));
        }catch{setListings(p=>p.map(l=>l.id===lid?{...l,is_unlocked:true}:l));}
        notify("🔓 Buyer contact unlocked! Check Notifications for their details.","success");
      }}
      onClose={()=>setShowPayModal(null)}
      notify={notify}
    />}
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
      <div style={{fontWeight:700,fontSize:14}}>Install Weka Soko App</div>
      <div style={{fontSize:12,color:"var(--mut)"}}>Get faster access & offline browsing</div>
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
    {pages.map((p,i)=>typeof p==="number"?<div key={i} className={`pb${p===page?" on":""}`} onClick={()=>onChange(p)}>{p}</div>:<div key={i} style={{color:"var(--dim)",fontSize:13,padding:"0 4px"}}>…</div>)}
    <div className="pb" onClick={()=>page<tp&&onChange(page+1)}>→</div>
  </div>;
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App(){
  const [dark,setDark]=useState(()=>{try{return localStorage.getItem("ws-theme")==="dark";}catch{return false;}});
  const [user,setUser]=useState(null);
  const [token,setToken]=useState(null);
  const [page,setPage]=useState("home");
  const [listings,setListings]=useState([]);
  const [total,setTotal]=useState(0);
  const [loading,setLoading]=useState(true);
  const [stats,setStats]=useState({users:0,activeAds:0,sold:0,revenue:0});
  const [filter,setFilter]=useState({cat:"",q:""});
  const [pg,setPg]=useState(1);
  const [vm,setVm]=useState("grid");
  const [toast,setToast]=useState(null);
  const [modal,setModal]=useState(null);
  const [showPWA,setShowPWA]=useState(true);
  const [notifCount,setNotifCount]=useState(0);
  const socketRef=useRef(null);

  const notify=useCallback((msg,type="info")=>setToast({msg,type,id:Date.now()}),[]);
  const closeModal=useCallback(()=>setModal(null),[]);

  useEffect(()=>{document.documentElement.className=dark?"dark":"";try{localStorage.setItem("ws-theme",dark?"dark":"light");}catch{};},[dark]);
  useEffect(()=>{let el=document.getElementById("ws-css");if(!el){el=document.createElement("style");el.id="ws-css";document.head.appendChild(el);}el.textContent=CSS;},[]);

  // Handle Google OAuth callback
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const t=params.get("auth_token");
    const u=params.get("auth_user");
    const err=params.get("auth_error");
    if(t&&u){
      try{
        const parsed=JSON.parse(decodeURIComponent(u));
        localStorage.setItem("ws_token",t);
        localStorage.setItem("ws_user",JSON.stringify(parsed));
        setUser(parsed);setToken(t);
        notify("Welcome, "+parsed.name.split(" ")[0]+"! 🎉","success");
        window.history.replaceState({},"",window.location.pathname);
      }catch{}
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

  // Stats
  useEffect(()=>{api("/api/stats").then(setStats).catch(()=>{});},[]);

  // Listings
  useEffect(()=>{
    const load=async()=>{
      setLoading(true);
      try{
        const p=new URLSearchParams({page:pg,limit:PER_PAGE});
        if(filter.cat)p.set("category",filter.cat);
        if(filter.q)p.set("search",filter.q);
        const data=await api(`/api/listings?${p}`);
        setListings(data.listings||[]);
        setTotal(data.total||0);
      }catch{setListings([]);}
      finally{setLoading(false);}
    };
    load();
  },[pg,filter]);

  // Real-time notifications for logged-in user
  useEffect(()=>{
    if(!token||!user)return;
    const s=io(API,{auth:{token},transports:["websocket","polling"]});
    socketRef.current=s;
    s.on("notification",(n)=>{
      setNotifCount(c=>c+1);
      notify(n.body||n.title,"info");
    });
    // New message arrived while chat modal is closed - update unread count
    s.on("new_message_inbox",(msg)=>{
      setNotifCount(c=>c+1);
    });
    return()=>s.disconnect();
  },[token,user]);

  // Fetch unread count on login
  useEffect(()=>{
    if(!token)return;
    api("/api/notifications",{},token).then(ns=>{
      if(Array.isArray(ns))setNotifCount(ns.filter(n=>!n.is_read).length);
    }).catch(()=>{});
  },[token]);

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

  const openListing=l=>setModal({type:"detail",listing:l});

  return <>
    {/* NAV */}
    <nav className="nav">
      <div className="logo" onClick={()=>{setPage("home");setFilter({cat:"",q:""});setPg(1);}}>Weka<span>Soko</span></div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        <button className="btn bgh sm" onClick={()=>setDark(d=>!d)} style={{fontSize:16,padding:"6px 10px"}}>{dark?"☀️":"🌙"}</button>
        {user?<>
          <button className="btn bs sm" style={{position:"relative"}} onClick={()=>setModal({type:"dashboard"})}>
            👤 {user.name?.split(" ")[0]}
            {notifCount>0&&<span className="notif-dot"/>}
          </button>
          {user.role==="seller"&&<button className="btn bp sm" onClick={()=>setModal({type:"post"})}>+ Post Ad</button>}
          <button className="btn bgh sm" onClick={logout} style={{display:"none"}}>Out</button>
        </>:<>
          <button className="btn bgh sm" onClick={()=>setModal({type:"auth",mode:"login"})}>Sign In</button>
          <button className="btn bp sm" onClick={()=>setModal({type:"auth",mode:"signup"})}>Join Free</button>
        </>}
      </div>
    </nav>

    <main style={{maxWidth:1180,margin:"0 auto",padding:"32px 22px 80px"}}>
      {/* HERO */}
      <div style={{display:"flex",alignItems:"flex-start",gap:40,flexWrap:"wrap",marginBottom:52}}>
        <div style={{flex:"1 1 380px"}}>
          <div className="badge bg-g" style={{marginBottom:16}}>🇰🇪 Kenya's Smartest Resell Platform</div>
          <h1 style={{fontSize:"clamp(30px,5vw,54px)",fontWeight:800,letterSpacing:"-.03em",lineHeight:1.06,marginBottom:16,fontFamily:"var(--fs)"}}>
            Post Free.<br/><em style={{fontStyle:"italic",color:"var(--a)"}}>Pay Only When</em><br/>You Get a Buyer.
          </h1>
          <p style={{fontSize:15,color:"var(--mut)",lineHeight:1.85,marginBottom:26,maxWidth:430}}>
            List items in minutes — with photos. Pay KSh 250 only when a serious buyer locks in to buy.
          </p>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <button className="btn bp lg" onClick={()=>user?setModal({type:"post"}):setModal({type:"auth",mode:"signup"})}>Post an Ad for Free →</button>
            <button className="btn bs lg" onClick={()=>document.getElementById("listings-section")?.scrollIntoView({behavior:"smooth"})}>Browse Listings</button>
          </div>
          <div style={{display:"flex",gap:18,marginTop:20,fontSize:12,color:"var(--mut)"}}>
            <span>✓ 100% free to post</span><span>✓ Safe anonymous chat</span><span>✓ M-Pesa escrow</span>
          </div>
        </div>
        <div style={{flex:"0 0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:2,width:"min(260px,100%)",borderRadius:"var(--rl)",overflow:"hidden",border:"1px solid var(--border)"}}>
          {[{icon:"👥",label:"Users",val:stats.users||0},{icon:"📦",label:"Active Ads",val:stats.activeAds||0},{icon:"✅",label:"Sold",val:stats.sold||0},{icon:"💰",label:"Revenue (KSh)",val:stats.revenue||0}].map(s=>(
            <div key={s.label} style={{background:"var(--sh)",padding:"16px 14px",borderBottom:"1px solid var(--border)"}}>
              <div style={{fontSize:22,marginBottom:4}}>{s.icon}</div>
              <div style={{fontSize:22,fontWeight:800,color:"var(--a)"}}><Counter to={s.val}/></div>
              <div style={{fontSize:11,color:"var(--mut)",marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="lbl" style={{marginBottom:12}}>Browse by Category</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(88px,1fr))",gap:8,marginBottom:32}}>
        {CATS.map(c=>(
          <div key={c.name} onClick={()=>{setFilter(p=>({...p,cat:p.cat===c.name?"":c.name}));setPg(1);document.getElementById("listings-section")?.scrollIntoView({behavior:"smooth"});}}
            style={{background:"var(--sh)",border:`1.5px solid ${filter.cat===c.name?"var(--a)":"var(--border)"}`,color:filter.cat===c.name?"var(--a)":"inherit",borderRadius:"var(--rs)",padding:"12px 6px",textAlign:"center",cursor:"pointer",transition:"all .14s"}}>
            <div style={{fontSize:22,marginBottom:5}}>{c.icon}</div>
            <div style={{fontSize:11,fontWeight:600,lineHeight:1.3}}>{c.name}</div>
          </div>
        ))}
      </div>

      {/* SEARCH & FILTER BAR */}
      <div id="listings-section" style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",background:"var(--surf)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:"13px 16px",marginBottom:22}}>
        <input className="inp" style={{flex:1,minWidth:160}} placeholder="🔍 Search listings..." value={filter.q} onChange={e=>{setFilter(p=>({...p,q:e.target.value}));setPg(1);}}/>
        {filter.cat&&<button className="btn bs sm" onClick={()=>setFilter(p=>({...p,cat:""}))}>✕ {filter.cat}</button>}
        <div style={{display:"flex",gap:2,background:"var(--sh)",borderRadius:"var(--rs)",padding:3}}>
          <button className={`btn sm${vm==="grid"?" bp":" bgh"}`} style={{padding:"5px 10px",fontSize:16}} onClick={()=>setVm("grid")}>⊞</button>
          <button className={`btn sm${vm==="list"?" bp":" bgh"}`} style={{padding:"5px 10px",fontSize:16}} onClick={()=>setVm("list")}>☰</button>
        </div>
        <button className="btn bp sm" onClick={()=>user?setModal({type:"post"}):setModal({type:"auth",mode:"signup"})}>+ Post Ad</button>
      </div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:8}}>
        <h2 style={{fontSize:20}}>{filter.cat||"All Listings"} <span style={{fontFamily:"var(--fn)",fontWeight:400,fontSize:14,color:"var(--mut)"}}>{total} items</span></h2>
        <div style={{fontSize:12,color:"var(--mut)"}}>Page {pg} of {Math.ceil(total/PER_PAGE)||1}</div>
      </div>

      {loading?<div style={{textAlign:"center",padding:"80px 0"}}><Spin s="40px"/></div>
        :listings.length===0?<div className="empty"><div style={{fontSize:56,marginBottom:16,opacity:.25}}>🔍</div><h3 style={{fontFamily:"var(--fs)",marginBottom:8}}>No listings found</h3><p>Try a different search or category</p></div>
        :<div className={vm==="grid"?"g3":"lvc"}>{listings.map(l=><ListingCard key={l.id} listing={l} onClick={()=>openListing(l)} listView={vm==="list"}/>)}</div>}

      <Pager total={total} perPage={PER_PAGE} page={pg} onChange={p=>{setPg(p);window.scrollTo({top:400,behavior:"smooth"});}}/>

      {/* HOW IT WORKS */}
      <div style={{marginTop:64,paddingTop:44,borderTop:"1px solid var(--border)"}}>
        <h2 style={{fontSize:28,textAlign:"center",marginBottom:8,fontFamily:"var(--fs)"}}>How It Works</h2>
        <p style={{textAlign:"center",color:"var(--mut)",marginBottom:36,fontSize:14}}>Simple, safe, and built for Kenya.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))",gap:14}}>
          {[["📝","Post for Free","No upfront cost. Photos, description, location — done in 2 minutes."],
            ["💬","Chat Safely","Anonymous, moderated chat. Contact info hidden until unlock."],
            ["🔥","Buyer Locks In","Serious buyers click 'I'm Interested'. You get notified instantly."],
            ["💳","Pay KSh 250","Seller pays once to see buyer contact. Till 5673935. Non-refundable."],
            ["🔐","Safe Escrow","Optional 7.5% escrow. Funds held until you confirm delivery."],
            ["🏆","Deal Done","Leave a review. Build your seller reputation on the platform."]].map(([icon,title,desc])=>(
            <div key={title} style={{background:"var(--surf)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:"20px 18px"}}>
              <div style={{fontSize:32,marginBottom:10}}>{icon}</div>
              <div style={{fontWeight:700,marginBottom:6,fontSize:14}}>{title}</div>
              <div style={{fontSize:13,color:"var(--mut)",lineHeight:1.75}}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>

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
    {modal?.type==="dashboard"&&user&&<Dashboard user={user} token={token} notify={notify} onPostAd={()=>setModal({type:"post"})} onClose={closeModal}/>}

    {toast&&<Toast key={toast.id} msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    {showPWA&&!localStorage.getItem("pwa-dismissed")&&<PWABanner onDismiss={()=>{setShowPWA(false);localStorage.setItem("pwa-dismissed","1");}}/>}
  </>;
}
