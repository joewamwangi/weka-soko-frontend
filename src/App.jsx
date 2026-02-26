import { useState, useEffect, useRef, useCallback } from "react";

const DARK = { bg:"#0A0A0A",surface:"#141414",surfaceHigh:"#1E1E1E",border:"#2A2A2A",borderLight:"#333",accent:"#00C853",accentWarm:"#FFD600",accentRed:"#FF3D3D",text:"#F0F0F0",textMuted:"#888",textDim:"#555",card:"#161616" };
const LIGHT = { bg:"#F4F4EF",surface:"#FFFFFF",surfaceHigh:"#EEEEE9",border:"#DDDDD5",borderLight:"#CCCCCC",accent:"#00A843",accentWarm:"#D4A800",accentRed:"#CC2222",text:"#111111",textMuted:"#555555",textDim:"#999999",card:"#FFFFFF" };
const CATEGORIES = ["Electronics","Furniture","Clothing","Vehicles","Books","Sports","Kitchen","Tools","Baby Items","Other"];
const PER_PAGE_OPTS = [25,50,80,100];

function detectContact(text) {
  return [/\b0[17]\d[\s.\-•*]*\d[\s.\-•*]*\d[\s.\-•*]*\d[\s.\-•*]*\d[\s.\-•*]*\d[\s.\-•*]*\d/gi,/\+\s*2\s*5\s*4/gi,/\b\d{9,}\b/g,/[a-z0-9._%+\-]+\s*@\s*[a-z0-9.\-]+\.\s*[a-z]{2,}/gi,/https?:\/\//gi,/www\./gi,/wa\.me|whatsapp|telegram/gi].some(p=>{p.lastIndex=0;return p.test(text);});
}
function fmtKES(n){return"KSh "+Number(n).toLocaleString("en-KE");}
function ago(ts){const d=Date.now()-ts;if(d<60000)return"just now";if(d<3600000)return Math.floor(d/60000)+"m ago";if(d<86400000)return Math.floor(d/3600000)+"h ago";return Math.floor(d/86400000)+"d ago";}

const DEMOS=[
  {id:"l1",title:'Samsung 55" QLED TV',category:"Electronics",price:45000,description:"Bought 2022, excellent condition. Original remote and wall mount included.",reason:"Upgrading screen",location:"Westlands, Nairobi",photos:["📺"],status:"active",sellerId:"s1",sellerAnon:"Seller #4821",unlocked:false,createdAt:Date.now()-86400000*2,views:143,interestedCount:3,lockedBuyerId:null,escrowActive:false},
  {id:"l2",title:'Trek Mountain Bike 29"',category:"Sports",price:28000,description:"Trek Marlin 7, 2021. Hydraulic brakes, 9-speed Shimano. Serviced 2 months ago.",reason:"No longer cycling",location:"Karen, Nairobi",photos:["🚲"],status:"active",sellerId:"s2",sellerAnon:"Seller #2034",unlocked:false,createdAt:Date.now()-86400000,views:87,interestedCount:1,lockedBuyerId:null,escrowActive:false},
  {id:"l3",title:"MacBook Pro M1 14\"",category:"Electronics",price:120000,description:"2021, 16GB RAM, 512GB SSD. Battery cycles: 89. Space gray with original box.",reason:"Got work laptop",location:"Kilimani, Nairobi",photos:["💻"],status:"active",sellerId:"s3",sellerAnon:"Seller #7712",unlocked:true,createdAt:Date.now()-3600000*5,views:312,interestedCount:7,lockedBuyerId:"b1",escrowActive:false},
  {id:"l4",title:"Dining Table Set (6 Seater)",category:"Furniture",price:35000,description:"Solid mahogany, 6 padded chairs, 180x90cm. 3 years old, good condition.",reason:"Moving house",location:"Lavington, Nairobi",photos:["🪑"],status:"active",sellerId:"s1",sellerAnon:"Seller #4821",unlocked:false,createdAt:Date.now()-86400000*5,views:56,interestedCount:0,lockedBuyerId:null,escrowActive:false},
  {id:"l5",title:"PS5 + 3 Games",category:"Electronics",price:65000,description:"PS5 Disc Edition. Elden Ring, FIFA 24, God of War included. Perfect condition.",reason:"Switching to PC",location:"Ngong Road, Nairobi",photos:["🎮"],status:"active",sellerId:"s2",sellerAnon:"Seller #2034",unlocked:false,createdAt:Date.now()-86400000*3,views:228,interestedCount:5,lockedBuyerId:null,escrowActive:false},
  {id:"l6",title:"Canon EOS R50 Camera Kit",category:"Electronics",price:78000,description:"EOS R50 with 18-45mm kit lens. 1,200 actuations. 2 batteries, 64GB card.",reason:"Upgrading to mirrorless",location:"Parklands, Nairobi",photos:["📷"],status:"active",sellerId:"s3",sellerAnon:"Seller #7712",unlocked:false,createdAt:Date.now()-86400000,views:189,interestedCount:4,lockedBuyerId:null,escrowActive:false},
  {id:"l7",title:"Baby Cot + Mattress",category:"Baby Items",price:8500,description:"Wooden cot with mattress, used 8 months. Excellent condition, folds for storage.",reason:"Baby outgrew it",location:"Ruaka, Nairobi",photos:["🛏️"],status:"active",sellerId:"s1",sellerAnon:"Seller #4821",unlocked:false,createdAt:Date.now()-86400000*4,views:34,interestedCount:2,lockedBuyerId:null,escrowActive:false},
  {id:"l8",title:"KTM Duke 390 2020",category:"Vehicles",price:480000,description:"12,000km, full service history. Single owner. Includes spare parts.",reason:"Upgrading to car",location:"Thika Road, Nairobi",photos:["🏍️"],status:"active",sellerId:"s2",sellerAnon:"Seller #2034",unlocked:false,createdAt:Date.now()-86400000*6,views:521,interestedCount:9,lockedBuyerId:null,escrowActive:false},
];

const STATS={users:1247,activeAds:384,sold:2891,revenue:722750};

// ── CSS ────────────────────────────────────────────────────────────────────────
function buildCSS(t){return`
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{--bg:${t.bg};--surface:${t.surface};--sh:${t.surfaceHigh};--border:${t.border};--bl:${t.borderLight};--accent:${t.accent};--warm:${t.accentWarm};--red:${t.accentRed};--text:${t.text};--muted:${t.textMuted};--dim:${t.textDim};--card:${t.card};--r:12px;--rs:8px;--rl:18px;}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;font-size:15px;line-height:1.6;min-height:100vh;overflow-x:hidden;transition:background .3s,color .3s;}
h1,h2,h3,h4{font-family:'Syne',sans-serif;line-height:1.2;}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--bl);border-radius:2px}
.badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;}
.bg{background:rgba(0,200,83,.15);color:var(--accent);border:1px solid rgba(0,200,83,.25);}
.bgo{background:rgba(255,214,0,.12);color:var(--warm);border:1px solid rgba(255,214,0,.2);}
.bgr{background:rgba(255,61,61,.12);color:var(--red);border:1px solid rgba(255,61,61,.2);}
.bgm{background:rgba(128,128,128,.1);color:var(--muted);border:1px solid var(--border);}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 22px;border-radius:var(--rs);font-family:'Syne',sans-serif;font-size:13px;font-weight:700;letter-spacing:.03em;cursor:pointer;border:none;transition:all .18s;white-space:nowrap;}
.btn:disabled{opacity:.4;cursor:not-allowed;}
.bp{background:var(--accent);color:#000;}.bp:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px);box-shadow:0 4px 20px rgba(0,168,67,.3);}
.bs{background:var(--sh);color:var(--text);border:1px solid var(--bl);}.bs:hover:not(:disabled){border-color:var(--accent);color:var(--accent);}
.bg2{background:var(--warm);color:#000;}.bg2:hover:not(:disabled){filter:brightness(1.08);transform:translateY(-1px);}
.bgh{background:transparent;color:var(--muted);}.bgh:hover:not(:disabled){color:var(--text);background:var(--sh);}
.sm{padding:7px 14px;font-size:12px;}.lg{padding:14px 28px;font-size:15px;}
.inp{width:100%;padding:11px 14px;background:var(--sh);border:1px solid var(--border);border-radius:var(--rs);color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;transition:border-color .15s;outline:none;}
.inp:focus{border-color:var(--accent);}.inp::placeholder{color:var(--dim);}
textarea.inp{resize:vertical;min-height:100px;}
select.inp{appearance:none;cursor:pointer;}
.lbl{display:block;font-size:12px;font-weight:600;color:var(--muted);letter-spacing:.05em;text-transform:uppercase;margin-bottom:6px;}
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;}
.ov{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);}
.mod{background:var(--surface);border:1px solid var(--bl);border-radius:var(--rl);width:100%;max-width:560px;max-height:90vh;overflow-y:auto;animation:su .2s ease;}
@keyframes su{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.mh{padding:24px 28px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
.mb{padding:24px 28px;}
.mf{padding:16px 28px 24px;border-top:1px solid var(--border);display:flex;gap:10px;justify-content:flex-end;}
.cb{max-width:75%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.5;}
.cs{background:var(--accent);color:#000;border-bottom-right-radius:4px;margin-left:auto;}
.cr{background:var(--sh);border-bottom-left-radius:4px;}
.cbl{background:rgba(255,61,61,.1);border:1px solid rgba(255,61,61,.2);color:var(--red);font-size:12px;font-style:italic;}
.lc{background:var(--card);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;transition:all .2s;cursor:pointer;}
.lc:hover{border-color:var(--bl);transform:translateY(-2px);box-shadow:0 8px 30px rgba(0,0,0,.15);}
.lc.lv{display:flex;flex-direction:row;}
.lc.lv .li{width:160px;min-width:160px;aspect-ratio:unset;height:130px;}
.li{width:100%;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;background:var(--sh);font-size:56px;}
.nav{position:sticky;top:0;z-index:100;background:${t.bg}ee;border-bottom:1px solid var(--border);backdrop-filter:blur(12px);padding:0 24px;height:60px;display:flex;align-items:center;justify-content:space-between;}
.logo{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;letter-spacing:-.02em;cursor:pointer;}
.logo span{color:var(--accent);}
.g3{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;}
.lvc{display:flex;flex-direction:column;gap:12px;}
.sc{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:20px;}
.sv{font-family:'Syne',sans-serif;font-size:32px;font-weight:800;}
.sl{font-size:12px;color:var(--muted);margin-top:4px;text-transform:uppercase;letter-spacing:.05em;}
.toast{position:fixed;bottom:24px;right:24px;z-index:2000;background:var(--sh);border:1px solid var(--bl);border-radius:var(--r);padding:14px 20px;font-size:14px;box-shadow:0 8px 30px rgba(0,0,0,.3);animation:ti .25s ease;display:flex;align-items:center;gap:10px;max-width:360px;}
@keyframes ti{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
.div{height:1px;background:var(--border);margin:20px 0;}
.chip{padding:5px 12px;border-radius:20px;font-size:12px;cursor:pointer;border:1px solid var(--border);color:var(--muted);transition:all .15s;}
.chip.on,.chip:hover{border-color:var(--accent);color:var(--accent);background:rgba(0,168,67,.08);}
.cg{display:flex;flex-wrap:wrap;gap:8px;}
.es{text-align:center;padding:60px 20px;color:var(--muted);}
.ei{font-size:48px;margin-bottom:16px;opacity:.5;}
.et{font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:var(--text);margin-bottom:8px;}
.otp{display:flex;gap:8px;justify-content:center;}
.ob{width:48px;height:56px;text-align:center;font-size:22px;font-weight:700;font-family:'Syne',sans-serif;background:var(--sh);border:2px solid var(--border);border-radius:var(--rs);color:var(--text);outline:none;transition:border-color .15s;}
.ob:focus{border-color:var(--accent);}
.tt{background:var(--sh);border:1px solid var(--border);border-radius:20px;padding:5px 12px;cursor:pointer;font-size:14px;display:flex;align-items:center;gap:6px;color:var(--muted);transition:all .15s;}
.tt:hover{border-color:var(--accent);color:var(--accent);}
.pg{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:32px;flex-wrap:wrap;}
.pb{width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:var(--rs);border:1px solid var(--border);background:var(--sh);color:var(--muted);cursor:pointer;font-size:13px;font-weight:600;transition:all .15s;}
.pb.on{background:var(--accent);color:#000;border-color:var(--accent);}
.pb:hover:not(.on){border-color:var(--accent);color:var(--accent);}
.vt{display:flex;gap:4px;background:var(--sh);border-radius:var(--rs);padding:3px;}
.vb{padding:6px 10px;border-radius:6px;cursor:pointer;color:var(--muted);transition:all .15s;font-size:16px;}
.vb.on{background:var(--bg);color:var(--accent);}
@media(max-width:768px){.g3{grid-template-columns:1fr}.mod{max-width:100%;margin:0;border-radius:var(--rl) var(--rl) 0 0;align-self:flex-end}.nav{padding:0 16px}.mb,.mh,.mf{padding-left:20px;padding-right:20px}.lc.lv{flex-direction:column}.lc.lv .li{width:100%;height:auto;aspect-ratio:4/3}}
`;}

// ── ANIMATED COUNTER ───────────────────────────────────────────────────────────
function Counter({to,prefix="",suffix=""}){
  const [n,setN]=useState(0);const ref=useRef(null);
  useEffect(()=>{
    const ob=new IntersectionObserver(([e])=>{
      if(e.isIntersecting){let s=0;const step=to/120;const iv=setInterval(()=>{s+=step;if(s>=to){setN(to);clearInterval(iv);}else setN(Math.floor(s));},16);ob.disconnect();}
    });
    if(ref.current)ob.observe(ref.current);return()=>ob.disconnect();
  },[to]);
  return <span ref={ref} style={{fontFamily:"Syne,sans-serif",fontWeight:800}}>{prefix}{n.toLocaleString()}{suffix}</span>;
}

function Toast({message,type,onClose}){
  useEffect(()=>{const t=setTimeout(onClose,3500);return()=>clearTimeout(t);},[]);
  return <div className="toast"><span>{type==="success"?"✅":type==="error"?"❌":type==="warning"?"⚠️":"ℹ️"}</span><span>{message}</span></div>;
}

function Modal({title,onClose,children,footer}){
  return(
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="mod">
        <div className="mh"><h3 style={{fontSize:18,fontWeight:800}}>{title}</h3><button className="btn bgh sm" onClick={onClose} style={{padding:"6px 10px",fontSize:16}}>✕</button></div>
        <div className="mb">{children}</div>
        {footer&&<div className="mf">{footer}</div>}
      </div>
    </div>
  );
}

function FF({label,children,hint}){
  return(
    <div style={{marginBottom:16}}>
      {label&&<label className="lbl">{label}</label>}
      {children}
      {hint&&<p style={{fontSize:11,color:"var(--dim)",marginTop:4}}>{hint}</p>}
    </div>
  );
}

// ── OTP MODAL ──────────────────────────────────────────────────────────────────
function OTPModal({method,contact,onVerify,onClose,onResend}){
  const [otp,setOtp]=useState(["","","","","",""]);
  const [timer,setTimer]=useState(60);
  const refs=useRef([]);
  useEffect(()=>{const iv=setInterval(()=>setTimer(t=>t>0?t-1:0),1000);return()=>clearInterval(iv);},[]);
  const change=(i,v)=>{
    if(!/^\d*$/.test(v))return;
    const n=[...otp];n[i]=v.slice(-1);setOtp(n);
    if(v&&i<5)refs.current[i+1]?.focus();
  };
  const keydn=(i,e)=>{if(e.key==="Backspace"&&!otp[i]&&i>0)refs.current[i-1]?.focus();};
  return(
    <Modal title="Verify Your Account" onClose={onClose}>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{fontSize:40,marginBottom:12}}>{method==="email"?"📧":"📱"}</div>
        <p style={{color:"var(--muted)",fontSize:14}}>We sent a 6-digit code to <strong style={{color:"var(--text)"}}>{contact}</strong></p>
        <p style={{color:"var(--dim)",fontSize:12,marginTop:4}}>(Demo mode: use <strong>123456</strong>)</p>
      </div>
      <div className="otp" style={{marginBottom:24}}>
        {otp.map((v,i)=><input key={i} ref={el=>refs.current[i]=el} className="ob" value={v} onChange={e=>change(i,e.target.value)} onKeyDown={e=>keydn(i,e)} maxLength={1} inputMode="numeric"/>)}
      </div>
      <button className="btn bp" style={{width:"100%",marginBottom:12}} onClick={()=>onVerify(otp.join(""))} disabled={otp.join("").length<6}>Verify →</button>
      <div style={{textAlign:"center",fontSize:13,color:"var(--muted)"}}>
        {timer>0?`Resend in ${timer}s`:<button className="btn bgh sm" onClick={()=>{onResend();setTimer(60);}}>Resend Code</button>}
      </div>
    </Modal>
  );
}

// ── AUTH MODAL ─────────────────────────────────────────────────────────────────
function AuthModal({mode:im,onClose,onAuth,showToast}){
  const [mode,setMode]=useState(im||"login");
  const [step,setStep]=useState("form");
  const [via,setVia]=useState("email");
  const [f,setF]=useState({name:"",email:"",password:"",role:"buyer",phone:"",mpesa:"",mpesaSame:true});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const go=()=>{showToast(`OTP sent to your ${via}. Use 123456.`,"info");setStep("otp");};
  const verify=(code)=>{
    if(code!=="123456"){showToast("Invalid OTP. Try again.","error");return;}
    onAuth({id:"u_"+Date.now(),name:f.name||f.email.split("@")[0],email:f.email,role:f.role,phone:f.phone,mpesa:f.mpesaSame?f.phone:f.mpesa});
    onClose();showToast(`Welcome${f.name?", "+f.name:""}! 👋`,"success");
  };
  if(step==="otp")return <OTPModal method={via} contact={via==="email"?f.email:f.phone} onVerify={verify} onClose={onClose} onResend={()=>showToast("New OTP sent!","info")}/>;
  return(
    <Modal title={mode==="login"?"Sign In to Weka Soko":"Create Account"} onClose={onClose} footer={
      <><button className="btn bs" onClick={onClose}>Cancel</button><button className="btn bp" onClick={go} disabled={!f.email||!f.password}>{mode==="login"?"Sign In & Verify →":"Create & Verify →"}</button></>
    }>
      {mode==="signup"&&<>
        <FF label="Full Name"><input className="inp" placeholder="Your full name" value={f.name} onChange={e=>s("name",e.target.value)}/></FF>
        <FF label="I am a">
          <div style={{display:"flex",gap:8}}>
            <button className={`btn sm ${f.role==="buyer"?"bp":"bs"}`} style={{flex:1}} onClick={()=>s("role","buyer")}>🛍 Buyer</button>
            <button className={`btn sm ${f.role==="seller"?"bp":"bs"}`} style={{flex:1}} onClick={()=>s("role","seller")}>🏷 Seller</button>
          </div>
        </FF>
        <FF label="Phone Number"><input className="inp" placeholder="07XXXXXXXX" value={f.phone} onChange={e=>s("phone",e.target.value)}/></FF>
        <FF label="M-Pesa Number" hint="Used for receiving or sending funds via escrow">
          <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,cursor:"pointer",fontSize:13}}>
            <input type="checkbox" checked={f.mpesaSame} onChange={e=>s("mpesaSame",e.target.checked)}/>
            <span style={{color:"var(--muted)"}}>Same as my phone number above</span>
          </label>
          {!f.mpesaSame&&<input className="inp" placeholder="M-Pesa enabled number" value={f.mpesa} onChange={e=>s("mpesa",e.target.value)}/>}
        </FF>
      </>}
      <FF label="Email"><input className="inp" type="email" placeholder="you@example.com" value={f.email} onChange={e=>s("email",e.target.value)}/></FF>
      <FF label="Password"><input className="inp" type="password" placeholder="••••••••" value={f.password} onChange={e=>s("password",e.target.value)}/></FF>
      <FF label="Verify via">
        <div style={{display:"flex",gap:8}}>
          <button className={`btn sm ${via==="email"?"bp":"bs"}`} onClick={()=>setVia("email")}>📧 Email OTP</button>
          <button className={`btn sm ${via==="sms"?"bp":"bs"}`} onClick={()=>setVia("sms")}>📱 SMS OTP</button>
        </div>
      </FF>
      <div style={{textAlign:"center",marginTop:8,fontSize:13,color:"var(--muted)"}}>
        {mode==="login"?"No account? ":"Already have one? "}
        <button className="btn bgh sm" style={{display:"inline",padding:"0 4px",color:"var(--accent)"}} onClick={()=>setMode(mode==="login"?"signup":"login")}>
          {mode==="login"?"Create one":"Sign in"}
        </button>
      </div>
    </Modal>
  );
}

// ── LISTING CARD ───────────────────────────────────────────────────────────────
function LCard({listing:l,onClick,vm}){
  const isList=vm==="list";
  return(
    <div className={`lc ${isList?"lv":""}`} onClick={onClick}>
      <div className="li">{l.photos[0]}</div>
      <div style={{padding:16,flex:1}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:8}}>
          <h4 style={{fontSize:15,fontWeight:700,lineHeight:1.3}}>{l.title}</h4>
          <span className={`badge ${l.status==="active"?"bg":"bgr"}`}>{l.status}</span>
        </div>
        <div style={{fontSize:20,fontWeight:800,color:"var(--accent)",fontFamily:"Syne,sans-serif",marginBottom:8}}>{fmtKES(l.price)}</div>
        {isList&&<p style={{fontSize:13,color:"var(--muted)",marginBottom:8,lineHeight:1.5}}>{l.description.slice(0,120)}...</p>}
        <div style={{display:"flex",gap:12,color:"var(--muted)",fontSize:12,flexWrap:"wrap"}}>
          <span>📍{l.location}</span><span>👁{l.views}</span><span>🕒{ago(l.createdAt)}</span><span>🏷{l.category}</span>
        </div>
        {l.unlocked&&<div style={{marginTop:8}}><span className="badge bgo">🔓 Unlocked</span></div>}
        {l.interestedCount>0&&<div style={{marginTop:8,fontSize:12,color:"var(--muted)"}}>🔥{l.interestedCount} interested</div>}
      </div>
    </div>
  );
}

// ── MPESA MODAL ────────────────────────────────────────────────────────────────
function Mpesa({amount,purpose,onSuccess,onClose}){
  const [phone,setPhone]=useState("07");
  const [step,setStep]=useState("input");
  const [cd,setCd]=useState(30);
  const pay=()=>{
    setStep("waiting");let c=30;
    const iv=setInterval(()=>{c--;setCd(c);if(c<=0){clearInterval(iv);setStep("done");setTimeout(onSuccess,1500);}},1000);
  };
  return(
    <Modal title="M-Pesa Payment" onClose={onClose}>
      {step==="input"&&<>
        <div style={{background:"rgba(0,200,83,.08)",border:"1px solid rgba(0,200,83,.2)",borderRadius:"var(--r)",padding:"16px 20px",marginBottom:20}}>
          <div style={{fontSize:12,color:"var(--muted)",marginBottom:4}}>Amount</div>
          <div style={{fontSize:28,fontWeight:800,fontFamily:"Syne",color:"var(--accent)"}}>{fmtKES(amount)}</div>
          <div style={{fontSize:13,color:"var(--muted)",marginTop:2}}>{purpose}</div>
        </div>
        <FF label="M-Pesa Phone Number">
          <div style={{display:"flex"}}>
            <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRight:"none",borderRadius:"var(--rs) 0 0 var(--rs)",padding:"11px 14px",color:"var(--muted)",fontSize:14}}>🇰🇪 +254</div>
            <input className="inp" style={{borderRadius:"0 var(--rs) var(--rs) 0"}} value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,""))} placeholder="07XXXXXXXX" maxLength={10}/>
          </div>
        </FF>
        <button className="btn bp lg" style={{width:"100%"}} onClick={pay} disabled={phone.length<10}>Send STK Push →</button>
      </>}
      {step==="waiting"&&<div style={{textAlign:"center",padding:"30px 0"}}>
        <div style={{fontSize:48,marginBottom:16}}>📱</div>
        <h3 style={{marginBottom:8}}>Check Your Phone</h3>
        <p style={{color:"var(--muted)",marginBottom:20}}>Enter M-Pesa PIN on prompt sent to <strong>{phone}</strong></p>
        <div style={{fontSize:36,fontWeight:800,color:"var(--accent)",fontFamily:"Syne"}}>{cd}s</div>
      </div>}
      {step==="done"&&<div style={{textAlign:"center",padding:"30px 0"}}>
        <div style={{fontSize:56,marginBottom:16}}>✅</div>
        <h3 style={{color:"var(--accent)"}}>Payment Confirmed!</h3>
      </div>}
    </Modal>
  );
}

// ── CHAT MODAL ─────────────────────────────────────────────────────────────────
function Chat({listing,currentUser,onClose,onLockIn,chats,setChats,showToast}){
  const [msg,setMsg]=useState("");
  const [warns,setWarns]=useState(0);
  const end=useRef(null);
  const msgs=chats[listing.id]||[];
  const isBuyer=currentUser?.role==="buyer"||!currentUser;
  useEffect(()=>end.current?.scrollIntoView({behavior:"smooth"}),[msgs]);
  const send=()=>{
    if(!msg.trim())return;
    if(detectContact(msg)){
      const nw=warns+1;setWarns(nw);
      setChats(p=>({...p,[listing.id]:[...(p[listing.id]||[]),{id:Date.now()+"b",senderId:isBuyer?"buyer":"seller",text:msg,ts:Date.now(),blocked:true}]}));
      showToast(nw>=2?"⛔ Account flagged.":"⚠️ Message blocked — contact info not allowed before locking in.","warning");
      setMsg("");return;
    }
    setChats(p=>({...p,[listing.id]:[...(p[listing.id]||[]),{id:Date.now()+"",senderId:isBuyer?"buyer":"seller",text:msg,ts:Date.now(),blocked:false}]}));
    setMsg("");
  };
  return(
    <Modal title={`💬 ${listing.title}`} onClose={onClose}>
      <div style={{background:"rgba(255,214,0,.06)",border:"1px solid rgba(255,214,0,.15)",borderRadius:"var(--rs)",padding:"10px 14px",marginBottom:16,fontSize:12,color:"var(--muted)"}}>
        🤖 <strong style={{color:"var(--warm)"}}>Moderated Chat</strong> — No contact info allowed before locking in.
      </div>
      <div style={{minHeight:280,maxHeight:320,overflowY:"auto",display:"flex",flexDirection:"column",gap:12,padding:"4px 0",marginBottom:16}}>
        {msgs.length===0&&<div style={{textAlign:"center",color:"var(--dim)",padding:"60px 0",fontSize:14}}>No messages yet.</div>}
        {msgs.map(m=>(
          <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:m.blocked?"stretch":m.senderId===(isBuyer?"buyer":"seller")?"flex-end":"flex-start"}}>
            {m.blocked?<div className="cb cbl" style={{textAlign:"center"}}>🚫 Message blocked — contact info detected.</div>
            :<><div className={`cb ${m.senderId===(isBuyer?"buyer":"seller")?"cs":"cr"}`}>{m.text}</div><div style={{fontSize:11,color:"var(--dim)",marginTop:3}}>{ago(m.ts)}</div></>}
          </div>
        ))}
        <div ref={end}/>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <input className="inp" value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Type a message..." style={{flex:1}}/>
        <button className="btn bp" onClick={send} disabled={!msg.trim()}>Send</button>
      </div>
      {isBuyer&&!listing.lockedBuyerId&&(
        <div style={{borderTop:"1px solid var(--border)",paddingTop:16}}>
          <button className="btn bg2 lg" style={{width:"100%"}} onClick={onLockIn}>🔒 I'm Ready to Buy — Lock In</button>
          <p style={{fontSize:11,color:"var(--muted)",textAlign:"center",marginTop:8}}>No payment required from you at this stage.</p>
        </div>
      )}
    </Modal>
  );
}

// ── LISTING DETAIL ─────────────────────────────────────────────────────────────
function Detail({listing:l,currentUser,onClose,onChat,onUnlock,onEscrow}){
  const isSeller=currentUser?.id===l.sellerId;
  const fee=Math.round(l.price*.025);
  return(
    <Modal title={l.title} onClose={onClose} footer={
      <div style={{width:"100%",display:"flex",gap:8,flexWrap:"wrap"}}>
        {!isSeller&&l.status==="active"&&<button className="btn bp" style={{flex:1}} onClick={onChat}>💬 Chat with Seller</button>}
        {!isSeller&&l.status==="active"&&!l.escrowActive&&<button className="btn bg2 sm" onClick={onEscrow}>🔐 Escrow ({fmtKES(fee)} fee)</button>}
        {isSeller&&l.lockedBuyerId&&!l.unlocked&&<button className="btn bp" style={{flex:1}} onClick={onUnlock}>🔓 Unlock Contact — KSh 250</button>}
      </div>
    }>
      <div style={{background:"var(--sh)",borderRadius:"var(--r)",aspectRatio:"16/9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:80,marginBottom:20}}>{l.photos[0]}</div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
        <div><div style={{fontSize:28,fontWeight:800,color:"var(--accent)",fontFamily:"Syne"}}>{fmtKES(l.price)}</div><span className="badge bgm" style={{marginTop:6}}>{l.category}</span></div>
        <span className={`badge ${l.status==="active"?"bg":"bgr"}`}>{l.status}</span>
      </div>
      <div style={{marginBottom:16}}><div className="lbl">Description</div><p style={{color:"var(--muted)",fontSize:14,lineHeight:1.7}}>{l.description}</p></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        <div style={{background:"var(--sh)",borderRadius:"var(--rs)",padding:"12px 14px"}}><div className="lbl">Reason for Selling</div><div style={{fontSize:13}}>{l.reason}</div></div>
        <div style={{background:"var(--sh)",borderRadius:"var(--rs)",padding:"12px 14px"}}><div className="lbl">Collection Area</div><div style={{fontSize:13}}>📍{l.location}</div></div>
      </div>
      <div style={{marginBottom:16}}><div className="lbl">Seller</div>
        {l.unlocked
          ?<div style={{background:"rgba(0,200,83,.08)",border:"1px solid rgba(0,200,83,.2)",borderRadius:"var(--rs)",padding:"12px 14px"}}><span className="badge bg">🔓 Contact Revealed</span><div style={{fontSize:13,marginTop:8}}>📞 0712 345 678 · 📧 seller@example.com</div></div>
          :<div style={{background:"var(--sh)",borderRadius:"var(--rs)",padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}><div style={{fontSize:24}}>🔒</div><div><div style={{fontSize:13,fontWeight:600}}>{l.sellerAnon}</div><div style={{fontSize:12,color:"var(--muted)"}}>Contact revealed after KSh 250 unlock</div></div></div>
        }
      </div>
      <div style={{display:"flex",gap:16,fontSize:12,color:"var(--muted)"}}>
        <span>👁{l.views} views</span><span>🔥{l.interestedCount} interested</span><span>🕒{ago(l.createdAt)}</span>
      </div>
    </Modal>
  );
}

// ── POST AD MODAL ──────────────────────────────────────────────────────────────
function PostAd({onClose,onSubmit}){
  const [f,setF]=useState({title:"",category:"",price:"",description:"",reason:"",location:"",contact:""});
  const [step,setStep]=useState(1);
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const submit=()=>{onSubmit({...f,price:parseInt(f.price),id:"l"+Date.now(),photos:["📦"],status:"active",sellerId:"s_me",sellerAnon:"Seller #"+Math.floor(Math.random()*9000+1000),unlocked:false,createdAt:Date.now(),views:0,interestedCount:0,lockedBuyerId:null,escrowActive:false});onClose();};
  return(
    <Modal title={`Post Ad — Step ${step}/2`} onClose={onClose} footer={
      <div style={{display:"flex",gap:8,width:"100%"}}>
        {step===2&&<button className="btn bs" onClick={()=>setStep(1)}>← Back</button>}
        {step===1&&<button className="btn bs" onClick={onClose}>Cancel</button>}
        <div style={{flex:1}}/>
        {step===1&&<button className="btn bp" onClick={()=>setStep(2)} disabled={!f.title||!f.category||!f.price||!f.description}>Continue →</button>}
        {step===2&&<button className="btn bp" onClick={submit} disabled={!f.reason||!f.location||!f.contact}>Post for Free 🚀</button>}
      </div>
    }>
      {step===1&&<>
        <p style={{fontSize:13,color:"var(--muted)",marginBottom:20}}>Free to post. Pay KSh 250 only when a buyer locks in.</p>
        <FF label="Item Name"><input className="inp" placeholder="e.g. Samsung 55 inch TV" value={f.title} onChange={e=>s("title",e.target.value)}/></FF>
        <FF label="Category"><select className="inp" value={f.category} onChange={e=>s("category",e.target.value)}><option value="">Select...</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></FF>
        <FF label="Price (KSh)"><input className="inp" type="number" placeholder="45000" value={f.price} onChange={e=>s("price",e.target.value)}/></FF>
        <FF label="Description"><textarea className="inp" placeholder="Describe your item..." value={f.description} onChange={e=>s("description",e.target.value)}/></FF>
        <FF label="Photos" hint="Full upload in production"><div style={{border:"2px dashed var(--border)",borderRadius:"var(--r)",padding:24,textAlign:"center",color:"var(--dim)",fontSize:14}}>📷 Drag & drop photos</div></FF>
      </>}
      {step===2&&<>
        <FF label="Reason for Selling"><input className="inp" placeholder="e.g. Upgrading" value={f.reason} onChange={e=>s("reason",e.target.value)}/></FF>
        <FF label="Collection Area" hint="Neighbourhood only — exact address shown after unlock"><input className="inp" placeholder="e.g. Westlands, Nairobi" value={f.location} onChange={e=>s("location",e.target.value)}/></FF>
        <FF label="Your Contact" hint="🔒 Private until KSh 250 paid"><input className="inp" placeholder="07XXXXXXXX" value={f.contact} onChange={e=>s("contact",e.target.value)}/></FF>
        <div style={{background:"rgba(0,200,83,.06)",border:"1px solid rgba(0,200,83,.15)",borderRadius:"var(--rs)",padding:"12px 14px",fontSize:12,color:"var(--muted)"}}>✅ <strong style={{color:"var(--text)"}}>Zero upfront cost.</strong> Your ad goes live immediately.</div>
      </>}
    </Modal>
  );
}

// ── ESCROW MODAL ───────────────────────────────────────────────────────────────
function EscrowModal({listing:l,onClose,onConfirm}){
  const fee=Math.round(l.price*.025);
  const total=l.price+fee;
  const [ok,setOk]=useState(false);
  return(
    <Modal title="🔐 Escrow Service" onClose={onClose} footer={<><button className="btn bs" onClick={onClose}>Cancel</button><button className="btn bg2" onClick={onConfirm} disabled={!ok}>Proceed to Payment</button></>}>
      <div style={{background:"rgba(255,214,0,.06)",border:"1px solid rgba(255,214,0,.2)",borderRadius:"var(--r)",padding:20,marginBottom:20}}>
        <div className="lbl" style={{marginBottom:12}}>Breakdown</div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:14}}><span style={{color:"var(--muted)"}}>Item Price</span><span>{fmtKES(l.price)}</span></div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:12,fontSize:14}}><span style={{color:"var(--muted)"}}>Weka Soko Fee (2.5%)</span><span style={{color:"var(--warm)"}}>+{fmtKES(fee)}</span></div>
        <div className="div" style={{margin:"12px 0"}}/>
        <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:18}}><span>Total</span><span style={{color:"var(--warm)",fontFamily:"Syne"}}>{fmtKES(total)}</span></div>
      </div>
      <div style={{marginBottom:20}}>
        {[["1","You pay the full amount into secure escrow"],["2","Seller delivers the item"],["3","48hrs to confirm item is as described"],["4","Funds auto-released to seller — or earlier if you confirm"],["5","Raise a dispute within 48hrs if item not as advertised"]].map(([n,t])=>(
          <div key={n} style={{display:"flex",gap:10,fontSize:13,marginBottom:8}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:"rgba(255,214,0,.15)",color:"var(--warm)",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{n}</div>
            <span style={{color:"var(--muted)",lineHeight:1.5}}>{t}</span>
          </div>
        ))}
      </div>
      <div style={{background:"rgba(255,214,0,.06)",border:"1px solid rgba(255,214,0,.15)",borderRadius:"var(--rs)",padding:"12px 14px",fontSize:12,color:"var(--muted)",marginBottom:16}}>
        📧 Both parties receive email notifications when escrow is activated and when funds are released or reversed.
      </div>
      <label style={{display:"flex",gap:10,cursor:"pointer",alignItems:"flex-start"}}>
        <input type="checkbox" checked={ok} onChange={e=>setOk(e.target.checked)} style={{marginTop:2}}/>
        <span style={{fontSize:13,color:"var(--muted)"}}>I agree to the escrow terms and will honestly report the item's condition on receipt.</span>
      </label>
    </Modal>
  );
}

// ── SELLER DASHBOARD ───────────────────────────────────────────────────────────
function Dashboard({listings,currentUser,onPostNew,onView}){
  const mine=listings.filter(l=>l.sellerId==="s_me"||l.sellerId===currentUser?.id);
  const locked=mine.filter(l=>l.lockedBuyerId&&!l.unlocked).length;
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28}}>
        <div><h2 style={{fontSize:26,fontWeight:800}}>My Dashboard</h2><p style={{color:"var(--muted)",fontSize:14,marginTop:4}}>Hello, {currentUser?.name||"Seller"} 👋</p></div>
        <button className="btn bp" onClick={onPostNew}>+ Post New Ad</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:28}}>
        <div className="sc"><div className="sv">{mine.length}</div><div className="sl">Total Ads</div></div>
        <div className="sc"><div className="sv" style={{color:"var(--red)"}}>{locked}</div><div className="sl">Pending Unlocks</div></div>
        <div className="sc"><div className="sv">{mine.reduce((a,l)=>a+l.views,0)}</div><div className="sl">Total Views</div></div>
        <div className="sc"><div className="sv" style={{color:"var(--warm)"}}>KSh {(mine.filter(l=>l.unlocked).length*250).toLocaleString()}</div><div className="sl">Spent on Unlocks</div></div>
      </div>
      {locked>0&&<div style={{background:"rgba(255,214,0,.08)",border:"1px solid rgba(255,214,0,.25)",borderRadius:"var(--r)",padding:"16px 20px",marginBottom:24,display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:28}}>🔥</span>
        <div><div style={{fontWeight:700,color:"var(--warm)"}}>{locked} buyer{locked>1?"s":""} locked in!</div><div style={{fontSize:13,color:"var(--muted)"}}>Pay KSh 250 per ad to reveal contact details.</div></div>
      </div>}
      {mine.length===0?<div className="es"><div className="ei">📦</div><div className="et">No ads yet</div><p style={{color:"var(--muted)",marginBottom:20,fontSize:14}}>Post for free.</p><button className="btn bp" onClick={onPostNew}>Post First Ad</button></div>
      :<div className="g3">{mine.map(l=><LCard key={l.id} listing={l} onClick={()=>onView(l)} vm="grid"/>)}</div>}
    </div>
  );
}

// ── PAGINATION ─────────────────────────────────────────────────────────────────
function Pager({total,perPage,page,onChange}){
  const tp=Math.ceil(total/perPage);if(tp<=1)return null;
  const pages=Array.from({length:Math.min(tp,7)},(_,i)=>i+1);
  return(
    <div className="pg">
      <div className="pb" onClick={()=>page>1&&onChange(page-1)}>←</div>
      {pages.map(p=><div key={p} className={`pb ${p===page?"on":""}`} onClick={()=>onChange(p)}>{p}</div>)}
      {tp>7&&<div className="pb" style={{width:"auto",padding:"0 10px"}}>...{tp}</div>}
      <div className="pb" onClick={()=>page<tp&&onChange(page+1)}>→</div>
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────────────────────
export default function WekaSoko(){
  const [dark,setDark]=useState(()=>{try{return localStorage.getItem("ws-theme")!=="light";}catch{return true;}});
  const [page,setPage]=useState("home");
  const [listings,setListings]=useState(DEMOS);
  const [chats,setChats]=useState({});
  const [user,setUser]=useState(null);
  const [toast,setToast]=useState(null);
  const [filter,setFilter]=useState({cat:"All",q:""});
  const [vm,setVm]=useState("grid");
  const [pp,setPp]=useState(25);
  const [pg,setPg]=useState(1);
  const [selListing,setSelListing]=useState(null);
  const [chatL,setChatL]=useState(null);
  const [showPost,setShowPost]=useState(false);
  const [showAuth,setShowAuth]=useState(null);
  const [showMpesa,setShowMpesa]=useState(null);
  const [showEscrow,setShowEscrow]=useState(null);
  const t=dark?DARK:LIGHT;

  useEffect(()=>{try{localStorage.setItem("ws-theme",dark?"dark":"light");}catch{};},[dark]);
  useEffect(()=>{let el=document.getElementById("ws-css");if(!el){el=document.createElement("style");el.id="ws-css";document.head.appendChild(el);}el.textContent=buildCSS(t);},[dark]);

  const notify=useCallback((msg,type="info")=>setToast({msg,type,id:Date.now()}),[]);

  const filtered=listings.filter(l=>{
    const mc=filter.cat==="All"||l.category===filter.cat;
    const mq=!filter.q||l.title.toLowerCase().includes(filter.q.toLowerCase())||l.location.toLowerCase().includes(filter.q.toLowerCase());
    return mc&&mq&&l.status!=="deleted";
  });

  const catCounts=CATEGORIES.reduce((a,c)=>{a[c]=listings.filter(l=>l.category===c&&l.status==="active").length;return a;},{});
  const paginated=filtered.slice((pg-1)*pp,pg*pp);

  const lockIn=(l)=>{setListings(p=>p.map(x=>x.id===l.id?{...x,lockedBuyerId:user?.id||"guest",interestedCount:x.interestedCount+1}:x));setChatL(null);notify("🔒 Locked in! Seller notified.","success");};
  const unlock=(l)=>setShowMpesa({amount:250,purpose:`Unlock: ${l.title}`,onSuccess:()=>{setListings(p=>p.map(x=>x.id===l.id?{...x,unlocked:true}:x));setSelListing(p=>p?{...p,unlocked:true}:p);notify("🔓 Contact details revealed!","success");setShowMpesa(null);}});
  const escrowConfirm=()=>{if(showEscrow){const l=showEscrow;setShowEscrow(null);setShowMpesa({amount:Math.round(l.price*1.025),purpose:`Escrow: ${l.title}`,onSuccess:()=>{setListings(p=>p.map(x=>x.id===l.id?{...x,escrowActive:true}:x));notify("🔐 Escrow activated! Both parties emailed.","success");setShowMpesa(null);}});}};

  return(<>
    <nav className="nav">
      <div className="logo" onClick={()=>setPage("home")}>Weka<span>Soko</span></div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        {user?.role==="seller"&&<button className="btn bgh sm" onClick={()=>setPage("dashboard")}>Dashboard</button>}
        <button className="tt" onClick={()=>setDark(d=>!d)}>{dark?"☀️ Light":"🌙 Dark"}</button>
        {user?<>
          <span style={{fontSize:12,color:"var(--muted)"}}>{user.name}</span>
          <button className="btn bgh sm" onClick={()=>{setUser(null);setPage("home");}}>Sign Out</button>
        </>:<>
          <button className="btn bgh sm" onClick={()=>setShowAuth("login")}>Sign In</button>
          <button className="btn bp sm" onClick={()=>setShowAuth("signup")}>Sign Up</button>
        </>}
      </div>
    </nav>

    <main style={{maxWidth:1200,margin:"0 auto",padding:"32px 24px"}}>
      {page==="home"&&<>
        {/* HERO */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:20,marginBottom:36}}>
          <div style={{maxWidth:520}}>
            <div className="badge bg" style={{marginBottom:14,fontSize:11}}>🇰🇪 Kenya's Smartest Resell Platform</div>
            <h1 style={{fontSize:"clamp(30px,5vw,50px)",fontWeight:800,letterSpacing:"-.03em",lineHeight:1.1,marginBottom:16}}>
              Post Free.<br/><span style={{color:"var(--accent)"}}>Pay Only When</span><br/>You Get a Buyer.
            </h1>
            <p style={{fontSize:16,color:"var(--muted)",lineHeight:1.7,marginBottom:24}}>List items for free. Pay KSh 250 only when a real buyer locks in. Safe, moderated, and proudly Kenyan.</p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button className="btn bp lg" onClick={()=>user?setShowPost(true):setShowAuth("signup")}>Post an Ad for Free →</button>
              <button className="btn bs lg" onClick={()=>document.getElementById("ls")?.scrollIntoView({behavior:"smooth"})}>Browse Listings</button>
            </div>
          </div>

          {/* ANIMATED STATS */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3,flex:"0 0 auto",width:"min(320px,100%)",borderRadius:"var(--rl)",overflow:"hidden"}}>
            {[{icon:"👥",label:"Users",val:STATS.users},{icon:"📦",label:"Active Ads",val:STATS.activeAds},{icon:"✅",label:"Ads Sold",val:STATS.sold},{icon:"💰",label:"KSh Transacted",val:STATS.revenue}].map(s=>(
              <div key={s.label} style={{background:"var(--sh)",padding:"18px 16px"}}>
                <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
                <div style={{fontSize:20,fontWeight:800,color:"var(--accent)"}}><Counter to={s.val}/></div>
                <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CATEGORY FILTER */}
        <div style={{marginBottom:20}}>
          <h3 style={{fontSize:13,fontWeight:700,color:"var(--muted)",marginBottom:10,textTransform:"uppercase",letterSpacing:".05em"}}>Browse by Category</h3>
          <div className="cg">
            <div className={`chip ${filter.cat==="All"?"on":""}`} onClick={()=>{setFilter(p=>({...p,cat:"All"}));setPg(1);}}>All ({listings.filter(l=>l.status==="active").length})</div>
            {CATEGORIES.map(c=><div key={c} className={`chip ${filter.cat===c?"on":""}`} onClick={()=>{setFilter(p=>({...p,cat:c}));setPg(1);}}>{c}{catCounts[c]>0?` (${catCounts[c]})`:""}</div>)}
          </div>
        </div>

        {/* SEARCH + CONTROLS */}
        <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center",padding:"14px 18px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--r)",marginBottom:28}}>
          <input className="inp" style={{flex:1,minWidth:180}} placeholder="🔍 Search listings..." value={filter.q} onChange={e=>{setFilter(p=>({...p,q:e.target.value}));setPg(1);}}/>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12,color:"var(--muted)",whiteSpace:"nowrap"}}>Show:</span>
            <select className="inp" style={{width:"auto",padding:"8px 12px"}} value={pp} onChange={e=>{setPp(parseInt(e.target.value));setPg(1);}}>
              {PER_PAGE_OPTS.map(n=><option key={n} value={n}>{n} per page</option>)}
            </select>
          </div>
          <div className="vt">
            <div className={`vb ${vm==="grid"?"on":""}`} onClick={()=>setVm("grid")} title="Grid">⊞</div>
            <div className={`vb ${vm==="list"?"on":""}`} onClick={()=>setVm("list")} title="List">☰</div>
          </div>
        </div>

        {/* LISTINGS */}
        <div id="ls">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <h2 style={{fontSize:22,fontWeight:800}}>Latest Listings <span style={{color:"var(--muted)",fontWeight:400,fontSize:16}}>({filtered.length})</span></h2>
            <button className="btn bp sm" onClick={()=>user?setShowPost(true):setShowAuth("signup")}>+ Post Ad</button>
          </div>
          {paginated.length===0?<div className="es"><div className="ei">🔍</div><div className="et">No listings found</div></div>
          :<div className={vm==="grid"?"g3":"lvc"}>{paginated.map(l=><LCard key={l.id} listing={l} onClick={()=>setSelListing(l)} vm={vm}/>)}</div>}
          <Pager total={filtered.length} perPage={pp} page={pg} onChange={setPg}/>
        </div>

        {/* HOW IT WORKS */}
        <div style={{marginTop:56,padding:"40px 0",borderTop:"1px solid var(--border)"}}>
          <h2 style={{fontSize:24,fontWeight:800,textAlign:"center",marginBottom:32}}>How Weka Soko Works</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16}}>
            {[["📝","Post for Free","List with photos. Zero fees upfront."],["💬","Buyers Chat","Moderated anonymous chat keeps everyone safe."],["🔒","Buyer Locks In","Serious buyer clicks Ready to Buy. You're notified."],["💳","Pay KSh 250","Pay once to reveal contacts and close the deal."]].map(([icon,title,desc])=>(
              <div key={title} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:20}}>
                <div style={{fontSize:32,marginBottom:12}}>{icon}</div>
                <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,marginBottom:6}}>{title}</div>
                <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.6}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </>}

      {page==="dashboard"&&<Dashboard listings={listings} currentUser={user} onPostNew={()=>setShowPost(true)} onView={l=>setSelListing(l)}/>}
    </main>

    {selListing&&<Detail listing={selListing} currentUser={user} onClose={()=>setSelListing(null)} onChat={()=>{setSelListing(null);setChatL(selListing);}} onUnlock={()=>unlock(selListing)} onEscrow={()=>{setSelListing(null);setShowEscrow(selListing);}}/>}
    {chatL&&<Chat listing={chatL} currentUser={user} onClose={()=>setChatL(null)} onLockIn={()=>lockIn(chatL)} chats={chats} setChats={setChats} showToast={notify}/>}
    {showPost&&<PostAd onClose={()=>setShowPost(false)} onSubmit={l=>{setListings(p=>[l,...p]);notify("🚀 Ad is live!","success");}}/>}
    {showAuth&&<AuthModal mode={showAuth} onClose={()=>setShowAuth(null)} onAuth={u=>setUser(u)} showToast={notify}/>}
    {showMpesa&&<Mpesa amount={showMpesa.amount} purpose={showMpesa.purpose} onSuccess={showMpesa.onSuccess} onClose={()=>setShowMpesa(null)}/>}
    {showEscrow&&<EscrowModal listing={showEscrow} onClose={()=>setShowEscrow(null)} onConfirm={escrowConfirm}/>}
    {toast&&<Toast key={toast.id} message={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
  </>);
}
