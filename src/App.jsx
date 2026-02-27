import { useState, useEffect, useRef, useCallback } from "react";

// ── CATEGORIES (Jiji/OLX style) ────────────────────────────────────────────────
const CATEGORIES = [
  { name: "Electronics", icon: "📱", sub: ["Phones & Tablets", "Laptops & Computers", "TVs & Audio", "Cameras", "Gaming", "Accessories"] },
  { name: "Vehicles", icon: "🚗", sub: ["Cars", "Motorcycles", "Trucks", "Buses", "Boats", "Vehicle Parts"] },
  { name: "Property", icon: "🏠", sub: ["Houses for Sale", "Land", "Commercial Property", "Short Stays"] },
  { name: "Fashion", icon: "👗", sub: ["Men's Clothing", "Women's Clothing", "Shoes", "Bags", "Watches", "Jewellery"] },
  { name: "Furniture", icon: "🛋️", sub: ["Sofas & Chairs", "Beds & Mattresses", "Tables & Desks", "Wardrobes", "Office Furniture"] },
  { name: "Home & Garden", icon: "🏡", sub: ["Kitchen Appliances", "Home Décor", "Garden Tools", "Cleaning", "Lighting"] },
  { name: "Sports & Outdoors", icon: "⚽", sub: ["Fitness Equipment", "Bicycles", "Outdoor Gear", "Team Sports", "Water Sports"] },
  { name: "Baby & Kids", icon: "🍼", sub: ["Baby Gear", "Toys & Games", "Kids Clothing", "Kids Furniture", "School Supplies"] },
  { name: "Books & Education", icon: "📚", sub: ["Textbooks", "Fiction", "Non-Fiction", "Courses", "Musical Instruments"] },
  { name: "Agriculture", icon: "🌾", sub: ["Livestock", "Farm Equipment", "Seeds & Fertilizer", "Produce", "Irrigation"] },
  { name: "Services", icon: "🔧", sub: ["Home Services", "Business Services", "Tech Services", "Transport", "Events"] },
  { name: "Jobs", icon: "💼", sub: ["Full-time", "Part-time", "Freelance", "Internship"] },
  { name: "Food & Catering", icon: "🍽️", sub: ["Catering Equipment", "Food Products", "Restaurant Supplies"] },
  { name: "Health & Beauty", icon: "💊", sub: ["Health Products", "Beauty & Skincare", "Gym Equipment", "Medical Equipment"] },
  { name: "Pets", icon: "🐾", sub: ["Dogs", "Cats", "Birds", "Fish", "Pet Supplies"] },
  { name: "Other", icon: "📦", sub: ["Miscellaneous"] },
];

const CAT_NAMES = CATEGORIES.map(c => c.name);

// ── OFFENSIVE WORDS FILTER ────────────────────────────────────────────────────
const BANNED_WORDS = ["fuck","shit","bastard","bitch","asshole","damn","crap","idiot","stupid","moron","whore","slut","nigga","kihii","malaya","mavi","pumbavu"];
function hasBannedContent(text) {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some(w => lower.includes(w));
}

// ── CONTACT DETECTION ─────────────────────────────────────────────────────────
function detectContact(text) {
  return [/\b0[17]\d[\s.\-]*\d[\s.\-]*\d[\s.\-]*\d[\s.\-]*\d[\s.\-]*\d[\s.\-]*\d/gi,/\+\s*2\s*5\s*4/gi,/\b\d{9,}\b/g,/[a-z0-9._%+\-]+\s*@\s*[a-z0-9.\-]+\.[a-z]{2,}/gi,/https?:\/\//gi,/www\./gi,/wa\.me|whatsapp|telegram/gi].some(p=>{p.lastIndex=0;return p.test(text);});
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function fmtKES(n){return"KSh "+Number(n).toLocaleString("en-KE");}
function ago(ts){const d=Date.now()-ts;if(d<60000)return"just now";if(d<3600000)return Math.floor(d/60000)+"m ago";if(d<86400000)return Math.floor(d/3600000)+"h ago";return Math.floor(d/86400000)+"d ago";}
function genOTP(){return Math.floor(100000+Math.random()*900000).toString();}
function genVoucher(){return"WS-"+Math.random().toString(36).substring(2,8).toUpperCase();}

// ── DEMO VOUCHERS ─────────────────────────────────────────────────────────────
const VOUCHERS = { "WS-FREE50": { type:"unlock", discount:100, desc:"Free unlock" }, "WS-ESC25": { type:"escrow", discount:50, desc:"50% off escrow fee" } };

// ── DEMO DATA ─────────────────────────────────────────────────────────────────
const DEMO_LISTINGS = [
  {id:"l1",title:'Samsung 65" QLED TV',category:"Electronics",subcat:"TVs & Audio",price:72000,description:"2022 model, excellent condition. Wall mount, original remote included.",reason:"Upgrading",location:"Westlands, Nairobi",photos:["📺"],status:"active",sellerId:"s1",sellerAnon:"Seller #4821",unlocked:false,createdAt:Date.now()-86400000*2,views:143,interestedCount:3,lockedBuyerId:null,escrowActive:false,soldVia:null,negotiatedPrice:null,offerPrice:null,offerStatus:null},
  {id:"l2",title:"Trek Mountain Bike 29\"",category:"Sports & Outdoors",subcat:"Bicycles",price:28000,description:"Trek Marlin 7, 2021. Hydraulic brakes, 9-speed Shimano.",reason:"No longer cycling",location:"Karen, Nairobi",photos:["🚲"],status:"active",sellerId:"s2",sellerAnon:"Seller #2034",unlocked:false,createdAt:Date.now()-86400000,views:87,interestedCount:1,lockedBuyerId:null,escrowActive:false,soldVia:null,negotiatedPrice:null,offerPrice:null,offerStatus:null},
  {id:"l3",title:"MacBook Pro M1 16GB",category:"Electronics",subcat:"Laptops & Computers",price:120000,description:"2021, 16GB RAM, 512GB SSD. 89 battery cycles. Space gray.",reason:"Got work laptop",location:"Kilimani, Nairobi",photos:["💻"],status:"active",sellerId:"s3",sellerAnon:"Seller #7712",unlocked:true,createdAt:Date.now()-3600000*5,views:312,interestedCount:7,lockedBuyerId:"b1",escrowActive:false,soldVia:null,negotiatedPrice:null,offerPrice:null,offerStatus:null},
  {id:"l4",title:"Dining Table Set (6 Seater)",category:"Furniture",subcat:"Tables & Desks",price:35000,description:"Solid mahogany, 6 padded chairs. 180x90cm. 3 years old.",reason:"Moving house",location:"Lavington, Nairobi",photos:["🪑"],status:"active",sellerId:"s1",sellerAnon:"Seller #4821",unlocked:false,createdAt:Date.now()-86400000*5,views:56,interestedCount:0,lockedBuyerId:null,escrowActive:false,soldVia:null,negotiatedPrice:null,offerPrice:null,offerStatus:null},
  {id:"l5",title:"PS5 Disc Edition + 3 Games",category:"Electronics",subcat:"Gaming",price:65000,description:"PS5 Disc Edition. Elden Ring, FIFA 24, God of War. Perfect condition.",reason:"Switching to PC",location:"Ngong Road, Nairobi",photos:["🎮"],status:"active",sellerId:"s2",sellerAnon:"Seller #2034",unlocked:false,createdAt:Date.now()-86400000*3,views:228,interestedCount:5,lockedBuyerId:null,escrowActive:false,soldVia:null,negotiatedPrice:null,offerPrice:null,offerStatus:null},
  {id:"l6",title:"KTM Duke 390 2020",category:"Vehicles",subcat:"Motorcycles",price:480000,description:"12,000km, full service history. Single owner. Includes spare parts kit.",reason:"Upgrading to car",location:"Thika Road, Nairobi",photos:["🏍️"],status:"sold",sellerId:"s3",sellerAnon:"Seller #7712",unlocked:true,createdAt:Date.now()-86400000*10,views:521,interestedCount:9,lockedBuyerId:"b2",escrowActive:false,soldVia:"platform",negotiatedPrice:460000,offerPrice:null,offerStatus:null},
  {id:"l7",title:"Canon EOS R50 Camera Kit",category:"Electronics",subcat:"Cameras",price:78000,description:"EOS R50 with 18-45mm kit lens. 1,200 actuations. 2 batteries, 64GB card.",reason:"Upgrading",location:"Parklands, Nairobi",photos:["📷"],status:"active",sellerId:"s1",sellerAnon:"Seller #4821",unlocked:false,createdAt:Date.now()-86400000,views:189,interestedCount:4,lockedBuyerId:null,escrowActive:false,soldVia:null,negotiatedPrice:null,offerPrice:null,offerStatus:null},
  {id:"l8",title:"Baby Cot + Mattress",category:"Baby & Kids",subcat:"Baby Gear",price:8500,description:"Wooden cot with mattress, used 8 months. Excellent condition.",reason:"Baby outgrew it",location:"Ruaka, Nairobi",photos:["🛏️"],status:"active",sellerId:"s2",sellerAnon:"Seller #2034",unlocked:false,createdAt:Date.now()-86400000*4,views:34,interestedCount:2,lockedBuyerId:null,escrowActive:false,soldVia:null,negotiatedPrice:null,offerPrice:null,offerStatus:null},
  {id:"l9",title:"iPhone 14 Pro Max 256GB",category:"Electronics",subcat:"Phones & Tablets",price:145000,description:"Deep Purple, 256GB. Perfect condition, all accessories included.",reason:"Upgrading to 15",location:"Westlands, Nairobi",photos:["📱"],status:"sold",sellerId:"s3",sellerAnon:"Seller #9901",unlocked:true,createdAt:Date.now()-86400000*15,views:891,interestedCount:18,lockedBuyerId:"b3",escrowActive:false,soldVia:"platform",negotiatedPrice:138000,offerPrice:null,offerStatus:null},
];

const LIVE_STATS = { users: 1247, activeAds: 384, sold: 2891, revenue: 722750 };

// ── TERMS & CONDITIONS ────────────────────────────────────────────────────────
const TERMS = `WEKA SOKO PLATFORM — TERMS & CONDITIONS

Last updated: February 2026

1. ACCEPTANCE OF TERMS
By creating an account or using Weka Soko ("the Platform"), you agree to these Terms & Conditions. If you do not agree, do not use the Platform.

2. PLATFORM ROLE & DISCLAIMER
Weka Soko is a classified advertising platform that connects buyers and sellers. We are NOT a party to any transaction between users. We do not buy, sell, hold, inspect, or guarantee any item listed. ALL transactions are solely between the buyer and seller.

3. NO LIABILITY
Weka Soko, its owners, directors, employees, and agents shall NOT be liable for:
- The quality, safety, legality, or authenticity of any listed item
- Any loss, damage, injury, or dispute arising from transactions
- Fraudulent listings or misrepresentation by users
- Failed or disputed transactions, whether escrow is used or not
- Any indirect, incidental, or consequential damages

Users transact entirely at their own risk.

4. ESCROW SERVICE
The escrow service is provided as a convenience only. While we hold funds, Weka Soko is not a licensed financial institution. Disputes are handled on a best-effort basis. Our decisions are final. The 2.5% fee is non-refundable once the STK push is accepted.

5. UNLOCK FEE
The KSh 250 unlock fee is non-refundable. It is charged when a seller chooses to reveal their contact to a locked-in buyer. No refunds for change of mind.

6. PROHIBITED ITEMS
Users may not list: stolen goods, counterfeit items, drugs, weapons, adult content, or any item illegal under Kenyan law. Violators will be permanently banned and may be reported to authorities.

7. CONTENT POLICY
Users must not post offensive, hateful, discriminatory, or explicit content. Contact information in chat before unlock is strictly prohibited. Images must not contain nudity, hate symbols, or personal contact details.

8. ACCOUNT RESPONSIBILITY
You are responsible for all activity under your account. Keep your password secure. Report suspicious activity immediately at support@wekasoko.co.ke.

9. GOVERNING LAW
These Terms are governed by the laws of Kenya. Any disputes shall be resolved in Kenyan courts.

10. CHANGES
We may update these Terms at any time. Continued use of the Platform constitutes acceptance of updated Terms.

Contact: support@wekasoko.co.ke`;

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#FAFAF8;--surface:#FFFFFF;--sh:#F5F5F2;--border:#E8E8E4;--bl:#D8D8D2;
  --accent:#0F7B3F;--accent2:#1A9E52;--warm:#B8860B;--red:#CC2222;
  --text:#1A1A1A;--muted:#6B6B6B;--dim:#AAAAAA;--card:#FFFFFF;
  --r:10px;--rs:7px;--rl:16px;
}
body.dark{
  --bg:#0C0C0C;--surface:#141414;--sh:#1C1C1C;--border:#272727;--bl:#333;
  --accent:#00C853;--accent2:#00E060;--warm:#FFD600;--red:#FF4444;
  --text:#F2F2F2;--muted:#888;--dim:#555;--card:#161616;
}
body{background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;font-size:15px;line-height:1.6;min-height:100vh;overflow-x:hidden;transition:background .25s,color .25s;}
h1,h2,h3{font-family:'Playfair Display',serif;line-height:1.15;}
h4,h5,h6,.nav-logo,.btn,.tab,.chip,.lbl,.stat-lbl{font-family:'Inter',sans-serif;}
::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:var(--bg);}::-webkit-scrollbar-thumb{background:var(--bl);border-radius:2px;}

/* BADGES */
.badge{display:inline-flex;align-items:center;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:.03em;}
.bg{background:rgba(15,123,63,.1);color:var(--accent);border:1px solid rgba(15,123,63,.2);}
.bgo{background:rgba(184,134,11,.1);color:var(--warm);border:1px solid rgba(184,134,11,.2);}
.bgr{background:rgba(204,34,34,.1);color:var(--red);border:1px solid rgba(204,34,34,.2);}
.bgm{background:rgba(107,107,107,.08);color:var(--muted);border:1px solid var(--border);}
.bgb{background:rgba(59,130,246,.1);color:#3B82F6;border:1px solid rgba(59,130,246,.2);}

/* BUTTONS */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:10px 20px;border-radius:var(--rs);font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all .15s;white-space:nowrap;letter-spacing:.01em;}
.btn:disabled{opacity:.4;cursor:not-allowed;}
.bp{background:var(--accent);color:#fff;}.bp:hover:not(:disabled){background:var(--accent2);transform:translateY(-1px);box-shadow:0 4px 16px rgba(15,123,63,.25);}
.bs{background:var(--surface);color:var(--text);border:1px solid var(--border);}.bs:hover:not(:disabled){border-color:var(--accent);color:var(--accent);}
.bg2{background:var(--warm);color:#fff;}.bg2:hover:not(:disabled){filter:brightness(1.08);transform:translateY(-1px);}
.bgh{background:transparent;color:var(--muted);}.bgh:hover:not(:disabled){color:var(--text);background:var(--sh);}
.br2{background:rgba(204,34,34,.08);color:var(--red);border:1px solid rgba(204,34,34,.15);}.br2:hover:not(:disabled){background:rgba(204,34,34,.15);}
.sm{padding:6px 13px;font-size:12px;}.lg{padding:13px 26px;font-size:15px;}

/* INPUTS */
.inp{width:100%;padding:10px 13px;background:var(--sh);border:1px solid var(--border);border-radius:var(--rs);color:var(--text);font-family:'Inter',sans-serif;font-size:14px;outline:none;transition:border-color .15s;}
.inp:focus{border-color:var(--accent);background:var(--surface);}
.inp::placeholder{color:var(--dim);}
textarea.inp{resize:vertical;min-height:90px;}
select.inp{appearance:none;cursor:pointer;}
.lbl{display:block;font-size:11px;font-weight:600;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;margin-bottom:5px;}

/* CARDS */
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--r);}
.lc{background:var(--card);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;transition:all .18s;cursor:pointer;}
.lc:hover{border-color:var(--bl);transform:translateY(-2px);box-shadow:0 6px 24px rgba(0,0,0,.07);}
body.dark .lc:hover{box-shadow:0 6px 24px rgba(0,0,0,.3);}
.lc.lv{display:flex;flex-direction:row;}
.lc.lv .li{width:160px;min-width:160px;height:130px;aspect-ratio:unset;}
.li{width:100%;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;background:var(--sh);font-size:52px;}

/* NAV */
.nav{position:sticky;top:0;z-index:100;background:var(--bg);border-bottom:1px solid var(--border);padding:0 24px;height:58px;display:flex;align-items:center;justify-content:space-between;backdrop-filter:blur(12px);}
.nav-logo{font-family:'Playfair Display',serif;font-size:22px;font-weight:800;cursor:pointer;color:var(--text);}
.nav-logo span{color:var(--accent);}

/* MODAL */
.ov{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px);}
body.dark .ov{background:rgba(0,0,0,.8);}
.mod{background:var(--surface);border:1px solid var(--border);border-radius:var(--rl);width:100%;max-width:560px;max-height:92vh;overflow-y:auto;animation:su .2s ease;}
.mod-lg{max-width:740px;}
@keyframes su{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.mh{padding:22px 26px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
.mb{padding:22px 26px;}
.mf{padding:14px 26px 22px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end;}

/* CHAT */
.cb{max-width:76%;padding:9px 13px;border-radius:14px;font-size:14px;line-height:1.5;}
.cs{background:var(--accent);color:#fff;border-bottom-right-radius:3px;margin-left:auto;}
.cr{background:var(--sh);border-bottom-left-radius:3px;}
.cbl{background:rgba(204,34,34,.08);border:1px solid rgba(204,34,34,.15);color:var(--red);font-size:12px;font-style:italic;}
.coffer{background:rgba(184,134,11,.08);border:1px solid rgba(184,134,11,.2);border-radius:10px;padding:12px;margin:4px 0;}

/* LAYOUT */
.g3{display:grid;grid-template-columns:repeat(auto-fill,minmax(278px,1fr));gap:18px;}
.g4{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;}
.lvc{display:flex;flex-direction:column;gap:10px;}
.two-col{display:grid;grid-template-columns:260px 1fr;gap:24px;}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;}
.sc{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:18px 20px;}
.sv{font-size:28px;font-weight:800;font-family:'Inter',sans-serif;}
.sl{font-size:11px;color:var(--muted);margin-top:3px;text-transform:uppercase;letter-spacing:.05em;}

/* MISC */
.toast{position:fixed;bottom:24px;right:24px;z-index:2000;background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:13px 18px;font-size:14px;box-shadow:0 8px 28px rgba(0,0,0,.12);animation:ti .2s ease;display:flex;align-items:center;gap:10px;max-width:340px;}
body.dark .toast{box-shadow:0 8px 28px rgba(0,0,0,.5);}
@keyframes ti{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
.div{height:1px;background:var(--border);margin:18px 0;}
.chip{padding:5px 12px;border-radius:20px;font-size:12px;cursor:pointer;border:1px solid var(--border);color:var(--muted);transition:all .15s;font-weight:500;}
.chip.on,.chip:hover{border-color:var(--accent);color:var(--accent);background:rgba(15,123,63,.06);}
.cg{display:flex;flex-wrap:wrap;gap:7px;}
.es{text-align:center;padding:56px 20px;color:var(--muted);}
.ei{font-size:44px;margin-bottom:14px;opacity:.4;}
.et{font-family:'Playfair Display',serif;font-size:20px;color:var(--text);margin-bottom:8px;}
.otp{display:flex;gap:8px;justify-content:center;}
.ob{width:46px;height:54px;text-align:center;font-size:20px;font-weight:700;background:var(--sh);border:2px solid var(--border);border-radius:var(--rs);color:var(--text);outline:none;transition:border-color .15s;}
.ob:focus{border-color:var(--accent);}
.tt{background:var(--sh);border:1px solid var(--border);border-radius:20px;padding:5px 12px;cursor:pointer;font-size:13px;display:flex;align-items:center;gap:5px;color:var(--muted);transition:all .15s;font-weight:500;}
.tt:hover{border-color:var(--accent);color:var(--accent);}
.pg{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:30px;flex-wrap:wrap;}
.pb{width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:var(--rs);border:1px solid var(--border);background:var(--sh);color:var(--muted);cursor:pointer;font-size:13px;font-weight:600;transition:all .14s;}
.pb.on{background:var(--accent);color:#fff;border-color:var(--accent);}
.pb:hover:not(.on){border-color:var(--accent);color:var(--accent);}
.vt{display:flex;gap:3px;background:var(--sh);border-radius:var(--rs);padding:3px;}
.vb{padding:5px 9px;border-radius:5px;cursor:pointer;color:var(--muted);transition:all .14s;font-size:15px;}
.vb.on{background:var(--surface);color:var(--accent);}
.inbox-item{padding:14px 18px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .12s;}
.inbox-item:hover{background:var(--sh);}
.inbox-item.unread{border-left:3px solid var(--accent);}
.profile-section{background:var(--sh);border-radius:var(--r);padding:20px;}
.sold-badge{position:absolute;top:10px;right:10px;background:var(--accent);color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;}
.alert{padding:12px 14px;border-radius:var(--rs);font-size:13px;line-height:1.5;}
.alert-g{background:rgba(15,123,63,.08);border:1px solid rgba(15,123,63,.2);color:var(--accent);}
.alert-y{background:rgba(184,134,11,.08);border:1px solid rgba(184,134,11,.2);color:var(--warm);}
.alert-r{background:rgba(204,34,34,.08);border:1px solid rgba(204,34,34,.2);color:var(--red);}
.voucher-box{background:repeating-linear-gradient(45deg,var(--sh),var(--sh) 8px,var(--surface) 8px,var(--surface) 16px);border:2px dashed var(--accent);border-radius:var(--r);padding:20px;text-align:center;}
@media(max-width:900px){.two-col{grid-template-columns:1fr}.g3{grid-template-columns:repeat(auto-fill,minmax(160px,1fr))}}
@media(max-width:640px){.nav{padding:0 14px}.mod{max-width:100%;margin:0;border-radius:var(--rl) var(--rl) 0 0;align-self:flex-end}.mb,.mh,.mf{padding-left:18px;padding-right:18px}.lc.lv{flex-direction:column}.lc.lv .li{width:100%;height:auto;aspect-ratio:4/3}}
`;

// ── COUNTER ───────────────────────────────────────────────────────────────────
function Counter({to,prefix="",suffix=""}){
  const [n,setN]=useState(0);const ref=useRef(null);
  useEffect(()=>{
    const ob=new IntersectionObserver(([e])=>{
      if(e.isIntersecting){let s=0;const step=to/100;const iv=setInterval(()=>{s+=step;if(s>=to){setN(to);clearInterval(iv);}else setN(Math.floor(s));},16);ob.disconnect();}
    });
    if(ref.current)ob.observe(ref.current);return()=>ob.disconnect();
  },[to]);
  return <span ref={ref}>{prefix}{n.toLocaleString()}{suffix}</span>;
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function Toast({message,type,onClose}){
  useEffect(()=>{const t=setTimeout(onClose,4000);return()=>clearTimeout(t);},[]);
  return <div className="toast"><span>{type==="success"?"✅":type==="error"?"❌":type==="warning"?"⚠️":"ℹ️"}</span><span>{message}</span></div>;
}

// ── MODAL ─────────────────────────────────────────────────────────────────────
function Modal({title,onClose,children,footer,large}){
  return(
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className={`mod${large?" mod-lg":""}`}>
        <div className="mh"><h3 style={{fontSize:17,fontFamily:"Inter",fontWeight:700}}>{title}</h3><button className="btn bgh sm" onClick={onClose} style={{padding:"5px 9px",fontSize:15}}>✕</button></div>
        <div className="mb">{children}</div>
        {footer&&<div className="mf">{footer}</div>}
      </div>
    </div>
  );
}
function FF({label,children,hint}){return(<div style={{marginBottom:14}}>{label&&<label className="lbl">{label}</label>}{children}{hint&&<p style={{fontSize:11,color:"var(--dim)",marginTop:4}}>{hint}</p>}</div>);}

// ── OTP MODAL ─────────────────────────────────────────────────────────────────
function OTPModal({method,contact,onVerify,onClose,onResend}){
  const [otp,setOtp]=useState(["","","","","",""]);const [timer,setTimer]=useState(60);const refs=useRef([]);
  useEffect(()=>{const iv=setInterval(()=>setTimer(t=>t>0?t-1:0),1000);return()=>clearInterval(iv);},[]);
  const ch=(i,v)=>{if(!/^\d*$/.test(v))return;const n=[...otp];n[i]=v.slice(-1);setOtp(n);if(v&&i<5)refs.current[i+1]?.focus();};
  const kd=(i,e)=>{if(e.key==="Backspace"&&!otp[i]&&i>0)refs.current[i-1]?.focus();};
  return(
    <Modal title="Verify Your Identity" onClose={onClose}>
      <div style={{textAlign:"center",marginBottom:22}}>
        <div style={{fontSize:38,marginBottom:10}}>{method==="email"?"📧":"📱"}</div>
        <p style={{color:"var(--muted)",fontSize:14}}>Code sent to <strong style={{color:"var(--text)"}}>{contact}</strong></p>
        <p style={{color:"var(--dim)",fontSize:12,marginTop:3}}>Demo: use <strong>123456</strong></p>
      </div>
      <div className="otp" style={{marginBottom:22}}>
        {otp.map((v,i)=><input key={i} ref={el=>refs.current[i]=el} className="ob" value={v} onChange={e=>ch(i,e.target.value)} onKeyDown={e=>kd(i,e)} maxLength={1} inputMode="numeric"/>)}
      </div>
      <button className="btn bp" style={{width:"100%",marginBottom:10}} onClick={()=>onVerify(otp.join(""))} disabled={otp.join("").length<6}>Verify →</button>
      <div style={{textAlign:"center",fontSize:13,color:"var(--muted)"}}>
        {timer>0?`Resend in ${timer}s`:<button className="btn bgh sm" onClick={()=>{onResend();setTimer(60);}}>Resend Code</button>}
      </div>
    </Modal>
  );
}

// ── TERMS MODAL ───────────────────────────────────────────────────────────────
function TermsModal({onClose,onAccept}){
  const [read,setRead]=useState(false);const ref=useRef(null);
  const onScroll=()=>{const el=ref.current;if(el&&el.scrollTop+el.clientHeight>=el.scrollHeight-20)setRead(true);};
  return(
    <Modal title="Terms & Conditions" onClose={onClose} large footer={
      <><button className="btn bs" onClick={onClose}>Decline</button><button className="btn bp" onClick={onAccept} disabled={!read}>I Accept →</button></>
    }>
      {!read&&<div className="alert alert-y" style={{marginBottom:14}}>📖 Please scroll to the bottom to accept.</div>}
      <div ref={ref} onScroll={onScroll} style={{maxHeight:400,overflowY:"auto",background:"var(--sh)",borderRadius:"var(--rs)",padding:"18px 20px",fontSize:13,lineHeight:1.8,color:"var(--muted)",whiteSpace:"pre-wrap"}}>{TERMS}</div>
    </Modal>
  );
}

// ── AUTH MODAL ────────────────────────────────────────────────────────────────
function AuthModal({mode:im,onClose,onAuth,showToast}){
  const [mode,setMode]=useState(im||"login");
  const [step,setStep]=useState("form");
  const [showTerms,setShowTerms]=useState(false);
  const [agreedTerms,setAgreedTerms]=useState(false);
  const [via,setVia]=useState("email");
  const [f,setF]=useState({name:"",email:"",pass:"",role:"buyer",phone:"",mpesa:"",mpesaSame:true,voucher:""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const go=()=>{
    if(mode==="signup"&&!agreedTerms){showToast("Please accept the Terms & Conditions.","warning");return;}
    showToast(`OTP sent to your ${via}. Use 123456.`,"info");setStep("otp");
  };
  const verify=(code)=>{
    if(code!=="123456"){showToast("Invalid OTP.","error");return;}
    const mpesa=f.mpesaSame?f.phone:f.mpesa;
    onAuth({id:"u_"+Date.now(),name:f.name||f.email.split("@")[0],email:f.email,role:f.role,phone:f.phone,mpesa,avatar:"👤",bio:"",listings:[],inbox:[],joined:new Date().toLocaleDateString()});
    onClose();showToast(`Welcome${f.name?", "+f.name:""}! 🎉`,"success");
  };
  if(showTerms)return <TermsModal onClose={()=>setShowTerms(false)} onAccept={()=>{setAgreedTerms(true);setShowTerms(false);showToast("Terms accepted ✓","success");}}/>;
  if(step==="otp")return <OTPModal method={via} contact={via==="email"?f.email:f.phone} onVerify={verify} onClose={onClose} onResend={()=>showToast("New OTP sent!","info")}/>;
  return(
    <Modal title={mode==="login"?"Welcome Back":"Create Account"} onClose={onClose} footer={
      <><button className="btn bs" onClick={onClose}>Cancel</button><button className="btn bp" onClick={go} disabled={!f.email||!f.pass}>{mode==="login"?"Sign In →":"Create Account →"}</button></>
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
        <FF label="M-Pesa Number" hint="Used to receive/send funds. Goes to Till No. 5673935">
          <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,cursor:"pointer",fontSize:13}}>
            <input type="checkbox" checked={f.mpesaSame} onChange={e=>s("mpesaSame",e.target.checked)}/>
            <span style={{color:"var(--muted)"}}>Same as phone number above</span>
          </label>
          {!f.mpesaSame&&<input className="inp" placeholder="M-Pesa enabled number" value={f.mpesa} onChange={e=>s("mpesa",e.target.value)}/>}
        </FF>
      </>}
      <FF label="Email"><input className="inp" type="email" placeholder="you@example.com" value={f.email} onChange={e=>s("email",e.target.value)}/></FF>
      <FF label="Password"><input className="inp" type="password" placeholder="••••••••" value={f.pass} onChange={e=>s("pass",e.target.value)}/></FF>
      <FF label="Verify via">
        <div style={{display:"flex",gap:8}}>
          <button className={`btn sm ${via==="email"?"bp":"bs"}`} onClick={()=>setVia("email")}>📧 Email OTP</button>
          <button className={`btn sm ${via==="whatsapp"?"bp":"bs"}`} onClick={()=>setVia("whatsapp")}>💬 WhatsApp OTP</button>
        </div>
      </FF>
      {mode==="signup"&&(
        <div style={{marginTop:14,padding:"12px 14px",background:"var(--sh)",borderRadius:"var(--rs)",fontSize:13}}>
          <label style={{display:"flex",alignItems:"flex-start",gap:8,cursor:"pointer"}}>
            <input type="checkbox" checked={agreedTerms} onChange={e=>setAgreedTerms(e.target.checked)} style={{marginTop:2}}/>
            <span style={{color:"var(--muted)",lineHeight:1.5}}>
              I have read and agree to the{" "}
              <button className="btn bgh sm" style={{display:"inline",padding:"0 3px",color:"var(--accent)",fontWeight:600}} onClick={()=>setShowTerms(true)}>Terms & Conditions</button>
              {" "}and{" "}
              <button className="btn bgh sm" style={{display:"inline",padding:"0 3px",color:"var(--accent)",fontWeight:600}} onClick={()=>setShowTerms(true)}>Privacy Policy</button>
            </span>
          </label>
        </div>
      )}
      <div style={{textAlign:"center",marginTop:12,fontSize:13,color:"var(--muted)"}}>
        {mode==="login"?"No account? ":"Already have one? "}
        <button className="btn bgh sm" style={{display:"inline",padding:"0 4px",color:"var(--accent)",fontWeight:600}} onClick={()=>setMode(mode==="login"?"signup":"login")}>
          {mode==="login"?"Sign up":"Sign in"}
        </button>
      </div>
    </Modal>
  );
}

// ── LISTING CARD ──────────────────────────────────────────────────────────────
function LCard({listing:l,onClick,vm}){
  const isList=vm==="list";
  const isSold=l.status==="sold";
  return(
    <div className={`lc ${isList?"lv":""}`} onClick={onClick} style={{position:"relative",opacity:isSold?.85:1}}>
      <div className="li" style={{position:"relative"}}>
        {l.photos[0]}
        {isSold&&<div className="sold-badge">SOLD</div>}
      </div>
      <div style={{padding:14,flex:1}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:6}}>
          <h4 style={{fontSize:14,fontWeight:600,lineHeight:1.3,fontFamily:"Inter"}}>{l.title}</h4>
        </div>
        <div style={{fontSize:18,fontWeight:800,color:"var(--accent)",marginBottom:6}}>
          {l.negotiatedPrice?<><span style={{textDecoration:"line-through",fontSize:13,color:"var(--muted)",fontWeight:400,marginRight:6}}>{fmtKES(l.price)}</span>{fmtKES(l.negotiatedPrice)}</>:fmtKES(l.price)}
        </div>
        {isList&&<p style={{fontSize:13,color:"var(--muted)",marginBottom:8,lineHeight:1.5}}>{l.description.slice(0,110)}...</p>}
        <div style={{display:"flex",gap:10,color:"var(--muted)",fontSize:12,flexWrap:"wrap"}}>
          <span>📍{l.location}</span><span>👁{l.views}</span><span>🕒{ago(l.createdAt)}</span>
        </div>
        <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
          <span className="badge bgm">{l.category}</span>
          {l.unlocked&&<span className="badge bgo">🔓 Unlocked</span>}
          {l.offerStatus==="pending"&&<span className="badge bgb">💬 Offer Pending</span>}
          {l.negotiatedPrice&&!isSold&&<span className="badge bg">🤝 Price Agreed</span>}
        </div>
      </div>
    </div>
  );
}

// ── SHARE MODAL ───────────────────────────────────────────────────────────────
function ShareModal({listing,onClose}){
  const url=`https://weka-soko.vercel.app/listing/${listing.id}`;
  const text=`Check out "${listing.title}" for ${fmtKES(listing.price)} on Weka Soko!`;
  const [copied,setCopied]=useState(false);
  const copy=()=>{navigator.clipboard?.writeText(url);setCopied(true);setTimeout(()=>setCopied(false),2000);};
  const share=(platform)=>{
    const urls={whatsapp:`https://wa.me/?text=${encodeURIComponent(text+" "+url)}`,twitter:`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,facebook:`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`};
    window.open(urls[platform],"_blank");
  };
  return(
    <Modal title="Share This Ad" onClose={onClose}>
      <div style={{background:"var(--sh)",borderRadius:"var(--rs)",padding:"14px 16px",marginBottom:18,display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:22}}>{listing.photos[0]}</span>
        <div><div style={{fontWeight:600,fontSize:14}}>{listing.title}</div><div style={{fontSize:12,color:"var(--muted)"}}>{fmtKES(listing.price)}</div></div>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:18}}>
        {[{id:"whatsapp",icon:"💬",label:"WhatsApp"},{id:"facebook",icon:"📘",label:"Facebook"},{id:"twitter",icon:"🐦",label:"Twitter/X"}].map(p=>(
          <button key={p.id} className="btn bs" style={{flex:1,flexDirection:"column",gap:5,padding:"12px 8px"}} onClick={()=>share(p.id)}>
            <span style={{fontSize:22}}>{p.icon}</span><span style={{fontSize:11}}>{p.label}</span>
          </button>
        ))}
      </div>
      <div style={{display:"flex",gap:8}}>
        <input className="inp" value={url} readOnly style={{flex:1,fontSize:12,color:"var(--muted)"}}/>
        <button className="btn bp sm" onClick={copy}>{copied?"✓ Copied!":"Copy Link"}</button>
      </div>
    </Modal>
  );
}

// ── MPESA MODAL ───────────────────────────────────────────────────────────────
function Mpesa({amount,purpose,onSuccess,onClose,showVoucher,vouchers}){
  const [phone,setPhone]=useState("07");const [step,setStep]=useState("input");const [cd,setCd]=useState(30);
  const [vcode,setVcode]=useState("");const [discount,setDiscount]=useState(0);
  const applyVoucher=()=>{
    const v=VOUCHERS[vcode.toUpperCase()]||vouchers?.[vcode.toUpperCase()];
    if(v){setDiscount(Math.min(v.discount,100));return "applied";}
    return "invalid";
  };
  const finalAmt=Math.max(0,Math.round(amount*(1-discount/100)));
  const pay=()=>{
    setStep("waiting");let c=30;
    const iv=setInterval(()=>{c--;setCd(c);if(c<=0){clearInterval(iv);setStep("done");setTimeout(()=>onSuccess({receipt:"QH"+Math.floor(Math.random()*90000000+10000000),amount:finalAmt}),1200);}},1000);
  };
  return(
    <Modal title="M-Pesa Payment" onClose={onClose}>
      {step==="input"&&<>
        <div style={{background:"rgba(15,123,63,.06)",border:"1px solid rgba(15,123,63,.15)",borderRadius:"var(--r)",padding:"14px 18px",marginBottom:18}}>
          <div style={{fontSize:11,color:"var(--muted)",marginBottom:3}}>Paying to Till No. <strong>5673935</strong></div>
          <div style={{fontSize:26,fontWeight:800,color:"var(--accent)"}}>{fmtKES(finalAmt)}</div>
          {discount>0&&<div style={{fontSize:12,color:"var(--accent)",marginTop:2}}>✓ Voucher applied — {discount}% off!</div>}
          <div style={{fontSize:13,color:"var(--muted)",marginTop:2}}>{purpose}</div>
        </div>
        {showVoucher&&<FF label="Voucher Code (Optional)">
          <div style={{display:"flex",gap:8}}>
            <input className="inp" placeholder="e.g. WS-FREE50" value={vcode} onChange={e=>setVcode(e.target.value)} style={{flex:1}}/>
            <button className="btn bs sm" onClick={()=>{const r=applyVoucher();showToast&&showToast(r==="applied"?"Voucher applied!":"Invalid voucher code.",r==="applied"?"success":"error");}}>Apply</button>
          </div>
        </FF>}
        <FF label="M-Pesa Phone Number">
          <div style={{display:"flex"}}>
            <div style={{background:"var(--sh)",border:"1px solid var(--border)",borderRight:"none",borderRadius:"var(--rs) 0 0 var(--rs)",padding:"10px 12px",color:"var(--muted)",fontSize:13,whiteSpace:"nowrap"}}>🇰🇪 +254</div>
            <input className="inp" style={{borderRadius:"0 var(--rs) var(--rs) 0"}} value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,""))} placeholder="07XXXXXXXX" maxLength={10}/>
          </div>
        </FF>
        {finalAmt===0?<button className="btn bp lg" style={{width:"100%"}} onClick={()=>onSuccess({receipt:"VOUCHER-"+Date.now(),amount:0})}>Redeem for Free →</button>
        :<button className="btn bp lg" style={{width:"100%"}} onClick={pay} disabled={phone.length<10}>Send STK Push to 5673935 →</button>}
      </>}
      {step==="waiting"&&<div style={{textAlign:"center",padding:"28px 0"}}>
        <div style={{fontSize:46,marginBottom:14}}>📱</div>
        <h3 style={{marginBottom:8,fontFamily:"Inter",fontWeight:700}}>Check Your Phone</h3>
        <p style={{color:"var(--muted)",marginBottom:18,fontSize:14}}>Enter M-Pesa PIN. Paying to <strong>Till 5673935</strong></p>
        <div style={{fontSize:34,fontWeight:800,color:"var(--accent)"}}>{cd}s</div>
      </div>}
      {step==="done"&&<div style={{textAlign:"center",padding:"28px 0"}}>
        <div style={{fontSize:52,marginBottom:14}}>✅</div>
        <h3 style={{color:"var(--accent)",fontFamily:"Inter",fontWeight:700}}>Payment Confirmed!</h3>
        <p style={{color:"var(--muted)",marginTop:8,fontSize:14}}>Confirmation sent to your email, WhatsApp and inbox.</p>
      </div>}
    </Modal>
  );
}

// ── NEGOTIATE MODAL ───────────────────────────────────────────────────────────
function NegotiateModal({listing,currentUser,onClose,onOffer,showToast}){
  const [offer,setOffer]=useState(Math.round(listing.price*.9));
  const [msg,setMsg]=useState("");
  const pct=Math.round((1-offer/listing.price)*100);
  return(
    <Modal title="Make an Offer" onClose={onClose} footer={
      <><button className="btn bs" onClick={onClose}>Cancel</button><button className="btn bp" onClick={()=>{if(offer<listing.price*.5){showToast("Offer too low. Minimum 50% of asking price.","warning");return;}onOffer(offer,msg);onClose();}}>Send Offer →</button></>
    }>
      <div style={{background:"var(--sh)",borderRadius:"var(--rs)",padding:"14px 16px",marginBottom:18,display:"flex",justifyContent:"space-between"}}>
        <div><div style={{fontSize:12,color:"var(--muted)"}}>Asking Price</div><div style={{fontSize:20,fontWeight:700}}>{fmtKES(listing.price)}</div></div>
        <div style={{textAlign:"right"}}><div style={{fontSize:12,color:"var(--muted)"}}>Your Offer</div><div style={{fontSize:20,fontWeight:700,color:"var(--accent)"}}>{fmtKES(offer)}</div></div>
      </div>
      <FF label="Your Offer (KSh)">
        <input className="inp" type="number" value={offer} onChange={e=>setOffer(parseInt(e.target.value)||0)} min={Math.round(listing.price*.5)} max={listing.price}/>
        <div style={{marginTop:8}}>
          <input type="range" style={{width:"100%",accentColor:"var(--accent)"}} min={Math.round(listing.price*.5)} max={listing.price} value={offer} onChange={e=>setOffer(parseInt(e.target.value))}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--muted)"}}>
            <span>-50%</span><span style={{color:pct>20?"var(--red)":pct>10?"var(--warm)":"var(--accent)"}}>Discount: {pct}%</span><span>Full price</span>
          </div>
        </div>
      </FF>
      <FF label="Message to Seller (Optional)">
        <textarea className="inp" placeholder="Why should the seller accept your offer?" value={msg} onChange={e=>setMsg(e.target.value)} style={{minHeight:70}}/>
      </FF>
    </Modal>
  );
}

// ── CHAT MODAL ────────────────────────────────────────────────────────────────
function Chat({listing,currentUser,onClose,onLockIn,chats,setChats,showToast,onNegotiate,onMarkSold}){
  const [msg,setMsg]=useState("");const [warns,setWarns]=useState(0);const end=useRef(null);
  const msgs=chats[listing.id]||[];
  const isSeller=currentUser?.id===listing.sellerId||currentUser?.role==="seller";
  const isBuyer=!isSeller;
  useEffect(()=>end.current?.scrollIntoView({behavior:"smooth"}),[msgs]);
  const send=()=>{
    if(!msg.trim())return;
    if(hasBannedContent(msg)){showToast("Message contains offensive language. Please be respectful.","warning");return;}
    if(detectContact(msg)&&!listing.unlocked){
      const nw=warns+1;setWarns(nw);
      setChats(p=>({...p,[listing.id]:[...(p[listing.id]||[]),{id:Date.now()+"b",type:"text",senderId:isBuyer?"buyer":"seller",text:msg,ts:Date.now(),blocked:true}]}));
      showToast(nw>=2?"⛔ Account flagged for review.":"⚠️ Contact info blocked. Not allowed before unlock.","warning");setMsg("");return;
    }
    setChats(p=>({...p,[listing.id]:[...(p[listing.id]||[]),{id:Date.now()+"",type:"text",senderId:isBuyer?"buyer":"seller",text:msg,ts:Date.now(),blocked:false}]}));setMsg("");
  };
  const handleOffer=(offer,offerMsg)=>{
    setChats(p=>({...p,[listing.id]:[...(p[listing.id]||[]),{id:Date.now()+"o",type:"offer",senderId:"buyer",offer,offerMsg,ts:Date.now(),status:"pending"}]}));
    showToast("Offer sent to seller!","success");
  };
  const respondOffer=(msgId,accept,counterOffer)=>{
    setChats(p=>({...p,[listing.id]:p[listing.id].map(m=>m.id===msgId?{...m,status:accept?"accepted":"declined",counterOffer}:m)}));
    if(accept){showToast("Offer accepted! Price updated.","success");}
    else{showToast("Offer declined.","info");}
  };
  const [showNeg,setShowNeg]=useState(false);
  return(<>
    <Modal title={`💬 ${listing.title}`} onClose={onClose} large>
      <div style={{background:"rgba(184,134,11,.05)",border:"1px solid rgba(184,134,11,.15)",borderRadius:"var(--rs)",padding:"9px 13px",marginBottom:14,fontSize:12,color:"var(--muted)"}}>
        🤖 Moderated chat — no contact info before unlock. No offensive language.
        {isSeller&&listing.lockedBuyerId&&!listing.unlocked&&<button className="btn bp sm" style={{marginLeft:10}} onClick={()=>onMarkSold&&onMarkSold(listing)}>Mark as Sold</button>}
      </div>
      <div style={{minHeight:260,maxHeight:300,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,padding:"4px 0",marginBottom:14}}>
        {msgs.length===0&&<div style={{textAlign:"center",color:"var(--dim)",padding:"50px 0",fontSize:14}}>No messages yet.</div>}
        {msgs.map(m=>{
          const isMe=m.senderId===(isBuyer?"buyer":"seller");
          if(m.type==="offer"){return(
            <div key={m.id} className="coffer">
              <div style={{fontSize:12,color:"var(--muted)",marginBottom:6}}>💰 Offer from Buyer</div>
              <div style={{fontSize:18,fontWeight:700,color:"var(--accent)",marginBottom:4}}>{fmtKES(m.offer)}</div>
              {m.offerMsg&&<div style={{fontSize:13,color:"var(--muted)",marginBottom:8}}>{m.offerMsg}</div>}
              {m.status==="pending"&&isSeller&&(
                <div style={{display:"flex",gap:8"}}>
                  <button className="btn bp sm" onClick={()=>respondOffer(m.id,true,null)}>✓ Accept</button>
                  <button className="btn br2 sm" onClick={()=>respondOffer(m.id,false,null)}>✗ Decline</button>
                </div>
              )}
              {m.status==="accepted"&&<span className="badge bg">✓ Accepted — Price Updated</span>}
              {m.status==="declined"&&<span className="badge bgr">✗ Declined</span>}
            </div>
          );}
          return(
            <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:m.blocked?"stretch":isMe?"flex-end":"flex-start"}}>
              {m.blocked?<div className="cb cbl" style={{textAlign:"center"}}>🚫 Blocked — contact info detected</div>
              :<><div className={`cb ${isMe?"cs":"cr"}`}>{m.text}</div><div style={{fontSize:10,color:"var(--dim)",marginTop:2}}>{ago(m.ts)}</div></>}
            </div>
          );
        })}
        <div ref={end}/>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <input className="inp" value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Type a message..." style={{flex:1}}/>
        {isBuyer&&<button className="btn bs sm" onClick={()=>setShowNeg(true)} title="Make offer">💰</button>}
        <button className="btn bp" onClick={send} disabled={!msg.trim()}>Send</button>
      </div>
      {isBuyer&&!listing.lockedBuyerId&&(
        <div style={{borderTop:"1px solid var(--border)",paddingTop:14}}>
          <button className="btn bg2 lg" style={{width:"100%"}} onClick={onLockIn}>🔒 I'm Ready to Buy — Lock In</button>
          <p style={{fontSize:11,color:"var(--muted)",textAlign:"center",marginTop:7}}>No payment required from you at this stage.</p>
        </div>
      )}
    </Modal>
    {showNeg&&<NegotiateModal listing={listing} currentUser={currentUser} onClose={()=>setShowNeg(false)} onOffer={handleOffer} showToast={showToast}/>}
  </>);
}

// ── MARK SOLD MODAL ───────────────────────────────────────────────────────────
function MarkSoldModal({listing,onClose,onConfirm}){
  const [via,setVia]=useState("platform");
  return(
    <Modal title="Mark Item as Sold" onClose={onClose} footer={
      <><button className="btn bs" onClick={onClose}>Cancel</button><button className="btn bp" onClick={()=>onConfirm(via)}>Confirm →</button></>
    }>
      <p style={{color:"var(--muted)",fontSize:14,marginBottom:20}}>Congratulations! 🎉 Was this item sold through Weka Soko?</p>
      {[{v:"platform",label:"Yes, sold via Weka Soko",desc:"Helps us show buyers successful transactions on the platform",icon:"✅"},{v:"elsewhere",label:"No, sold elsewhere",desc:"We'll remove it from active listings",icon:"📍"}].map(o=>(
        <div key={o.v} onClick={()=>setVia(o.v)} style={{cursor:"pointer",padding:"14px 16px",borderRadius:"var(--rs)",border:`2px solid ${via===o.v?"var(--accent)":"var(--border)"}`,background:via===o.v?"rgba(15,123,63,.04)":"var(--sh)",marginBottom:10,transition:"all .15s"}}>
          <div style={{fontWeight:600,marginBottom:3}}>{o.icon} {o.label}</div>
          <div style={{fontSize:12,color:"var(--muted)"}}>{o.desc}</div>
        </div>
      ))}
    </Modal>
  );
}

// ── LISTING DETAIL ────────────────────────────────────────────────────────────
function Detail({listing:l,currentUser,onClose,onChat,onUnlock,onEscrow,onShare,onNegotiate}){
  const isSeller=currentUser?.id===l.sellerId;
  const fee=Math.round(l.price*.025);
  const displayPrice=l.negotiatedPrice||l.price;
  return(
    <Modal title={l.title} onClose={onClose} large footer={
      <div style={{width:"100%",display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <button className="btn bs sm" onClick={onShare} title="Share">↗ Share</button>
        {!isSeller&&l.status==="active"&&<button className="btn bp" style={{flex:1}} onClick={onChat}>💬 Chat</button>}
        {!isSeller&&l.status==="active"&&!l.lockedBuyerId&&<button className="btn bs sm" onClick={onNegotiate}>💰 Negotiate</button>}
        {!isSeller&&l.status==="active"&&!l.escrowActive&&<button className="btn bg2 sm" onClick={onEscrow}>🔐 Escrow</button>}
        {isSeller&&l.lockedBuyerId&&!l.unlocked&&<button className="btn bp" style={{flex:1}} onClick={onUnlock}>🔓 Unlock — KSh 250</button>}
      </div>
    }>
      <div style={{background:"var(--sh)",borderRadius:"var(--rs)",aspectRatio:"16/9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:76,marginBottom:18,position:"relative"}}>
        {l.photos[0]}
        {l.status==="sold"&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"var(--rs)"}}><span style={{background:"var(--accent)",color:"#fff",padding:"8px 20px",borderRadius:20,fontWeight:700,fontSize:16}}>SOLD ✓</span></div>}
      </div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
        <div>
          {l.negotiatedPrice&&<div style={{fontSize:12,color:"var(--muted)",textDecoration:"line-through"}}>{fmtKES(l.price)}</div>}
          <div style={{fontSize:26,fontWeight:800,color:"var(--accent)"}}>{fmtKES(displayPrice)}</div>
          {l.negotiatedPrice&&<div style={{fontSize:12,color:"var(--accent)",marginTop:2}}>🤝 Agreed price</div>}
          <div style={{marginTop:6,display:"flex",gap:6,flexWrap:"wrap"}}>
            <span className="badge bgm">{l.category}</span>
            {l.subcat&&<span className="badge bgm">{l.subcat}</span>}
          </div>
        </div>
        <span className={`badge ${l.status==="active"?"bg":l.status==="sold"?"bgm":"bgr"}`}>{l.status}</span>
      </div>
      <div style={{marginBottom:14}}><div className="lbl">Description</div><p style={{color:"var(--muted)",fontSize:14,lineHeight:1.7}}>{l.description}</p></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        <div style={{background:"var(--sh)",borderRadius:"var(--rs)",padding:"12px 14px"}}><div className="lbl">Reason for Selling</div><div style={{fontSize:13}}>{l.reason}</div></div>
        <div style={{background:"var(--sh)",borderRadius:"var(--rs)",padding:"12px 14px"}}><div className="lbl">Collection Area</div><div style={{fontSize:13}}>📍{l.location}</div></div>
      </div>
      <div style={{marginBottom:14}}><div className="lbl">Seller</div>
        {l.unlocked
          ?<div style={{background:"rgba(15,123,63,.06)",border:"1px solid rgba(15,123,63,.2)",borderRadius:"var(--rs)",padding:"12px 14px"}}><span className="badge bg">🔓 Contact Revealed</span><div style={{fontSize:13,marginTop:8}}>📞 0712 345 678 · 📧 seller@example.com</div></div>
          :<div style={{background:"var(--sh)",borderRadius:"var(--rs)",padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}><div style={{fontSize:22}}>🔒</div><div><div style={{fontSize:13,fontWeight:600}}>{l.sellerAnon}</div><div style={{fontSize:12,color:"var(--muted)"}}>Contact revealed after KSh 250 unlock</div></div></div>
        }
      </div>
      <div style={{display:"flex",gap:14,fontSize:12,color:"var(--muted)"}}>
        <span>👁{l.views} views</span><span>🔥{l.interestedCount} interested</span><span>🕒{ago(l.createdAt)}</span>
      </div>
      {!isSeller&&l.status==="active"&&<div style={{marginTop:14,background:"rgba(184,134,11,.05)",border:"1px solid rgba(184,134,11,.15)",borderRadius:"var(--rs)",padding:"10px 13px",fontSize:12,color:"var(--muted)"}}>
        🔐 Escrow available — Pay {fmtKES(displayPrice+fee)} total (2.5% fee). Funds held until you confirm receipt.
      </div>}
    </Modal>
  );
}

// ── POST AD MODAL ─────────────────────────────────────────────────────────────
function PostAd({onClose,onSubmit}){
  const [f,setF]=useState({title:"",category:"",subcat:"",price:"",description:"",reason:"",location:"",contact:""});
  const [step,setStep]=useState(1);const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const selectedCat=CATEGORIES.find(c=>c.name===f.category);
  const submit=()=>{onSubmit({...f,price:parseInt(f.price),id:"l"+Date.now(),photos:["📦"],status:"active",sellerId:"s_me",sellerAnon:"Seller #"+Math.floor(Math.random()*9000+1000),unlocked:false,createdAt:Date.now(),views:0,interestedCount:0,lockedBuyerId:null,escrowActive:false,soldVia:null,negotiatedPrice:null,offerPrice:null,offerStatus:null});onClose();};
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
        <div className="alert alert-g" style={{marginBottom:14,fontSize:12}}>✓ Free to post. Pay KSh 250 only when a buyer locks in.</div>
        <FF label="Item Name"><input className="inp" placeholder="e.g. Samsung 55 inch TV" value={f.title} onChange={e=>s("title",e.target.value)}/></FF>
        <FF label="Category">
          <select className="inp" value={f.category} onChange={e=>{s("category",e.target.value);s("subcat","");}}>
            <option value="">Select category...</option>
            {CATEGORIES.map(c=><option key={c.name}>{c.name}</option>)}
          </select>
        </FF>
        {selectedCat&&selectedCat.sub.length>1&&<FF label="Subcategory">
          <select className="inp" value={f.subcat} onChange={e=>s("subcat",e.target.value)}>
            <option value="">Select subcategory...</option>
            {selectedCat.sub.map(s=><option key={s}>{s}</option>)}
          </select>
        </FF>}
        <FF label="Price (KSh)"><input className="inp" type="number" placeholder="45000" value={f.price} onChange={e=>s("price",e.target.value)}/></FF>
        <FF label="Description"><textarea className="inp" placeholder="Describe your item in detail..." value={f.description} onChange={e=>s("description",e.target.value)}/></FF>
        <FF label="Photos" hint="Up to 8 photos. System will scan for contact info.">
          <div style={{border:"2px dashed var(--border)",borderRadius:"var(--r)",padding:22,textAlign:"center",color:"var(--dim)",fontSize:14}}>📷 Drag & drop photos here<br/><span style={{fontSize:11,marginTop:4,display:"block",color:"var(--dim)"}}>Images are automatically scanned for contact information</span></div>
        </FF>
      </>}
      {step===2&&<>
        <FF label="Reason for Selling"><input className="inp" placeholder="e.g. Upgrading to newer model" value={f.reason} onChange={e=>s("reason",e.target.value)}/></FF>
        <FF label="Collection Area" hint="Neighbourhood only — exact address shown after unlock"><input className="inp" placeholder="e.g. Westlands, Nairobi" value={f.location} onChange={e=>s("location",e.target.value)}/></FF>
        <FF label="Your Contact Info" hint="🔒 Private — shown only after KSh 250 is paid"><input className="inp" placeholder="07XXXXXXXX" value={f.contact} onChange={e=>s("contact",e.target.value)}/></FF>
      </>}
    </Modal>
  );
}

// ── ESCROW MODAL ──────────────────────────────────────────────────────────────
function EscrowModal({listing:l,onClose,onConfirm}){
  const price=l.negotiatedPrice||l.price;const fee=Math.round(price*.025);const total=price+fee;const [ok,setOk]=useState(false);
  return(
    <Modal title="🔐 Escrow Service" onClose={onClose} footer={<><button className="btn bs" onClick={onClose}>Cancel</button><button className="btn bg2" onClick={onConfirm} disabled={!ok}>Proceed to Payment</button></>}>
      <div style={{background:"rgba(184,134,11,.05)",border:"1px solid rgba(184,134,11,.2)",borderRadius:"var(--r)",padding:18,marginBottom:18}}>
        <div className="lbl" style={{marginBottom:10}}>Payment Breakdown</div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:14}}><span style={{color:"var(--muted)"}}>Item Price</span><span>{fmtKES(price)}</span></div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10,fontSize:14}}><span style={{color:"var(--muted)"}}>Weka Soko Fee (2.5%)</span><span style={{color:"var(--warm)"}}>+{fmtKES(fee)}</span></div>
        <div style={{height:1,background:"var(--border)",margin:"10px 0"}}/>
        <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:17}}><span>Total</span><span style={{color:"var(--warm)"}}>{fmtKES(total)}</span></div>
        <div style={{marginTop:8,fontSize:11,color:"var(--muted)"}}>Paid to Till No. <strong>5673935</strong></div>
      </div>
      <div style={{marginBottom:18}}>
        {[["1","You pay the full amount to Till 5673935"],["2","Seller delivers the item to you"],["3","48hrs to confirm item is as described"],["4","Funds auto-released to seller after 48hrs or on your confirmation"],["5","Raise a dispute within 48hrs if item not as advertised — email, WhatsApp and inbox notification sent"]].map(([n,t])=>(
          <div key={n} style={{display:"flex",gap:10,fontSize:13,marginBottom:8}}>
            <div style={{width:20,height:20,borderRadius:"50%",background:"rgba(184,134,11,.15)",color:"var(--warm)",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{n}</div>
            <span style={{color:"var(--muted)",lineHeight:1.5}}>{t}</span>
          </div>
        ))}
      </div>
      <div className="alert alert-y" style={{marginBottom:14,fontSize:12}}>📧 Both parties receive email + WhatsApp + inbox notification when escrow activates and when funds move.</div>
      <label style={{display:"flex",gap:10,cursor:"pointer",alignItems:"flex-start"}}>
        <input type="checkbox" checked={ok} onChange={e=>setOk(e.target.checked)} style={{marginTop:2}}/>
        <span style={{fontSize:13,color:"var(--muted)"}}>I agree to the escrow terms and will honestly report the item's condition.</span>
      </label>
    </Modal>
  );
}

// ── USER PROFILE/DASHBOARD ────────────────────────────────────────────────────
function ProfilePage({user,listings,inbox,onClose,onEditProfile,onPostNew,onViewListing,onDeleteAccount,onSuspendAccount,showToast}){
  const [tab,setTab]=useState("dashboard");
  const mine=listings.filter(l=>l.sellerId==="s_me"||l.sellerId===user?.id);
  const [showDeleteConfirm,setShowDeleteConfirm]=useState(false);
  const [editMode,setEditMode]=useState(false);
  const [bio,setBio]=useState(user?.bio||"");
  const INBOX=[
    {id:"i1",from:"System",subject:"Welcome to Weka Soko!",body:"Thank you for joining. Start posting or browsing today.",ts:Date.now()-3600000,read:false},
    {id:"i2",from:"Weka Soko",subject:"Payment Confirmed — KSh 250",body:"Your unlock payment of KSh 250 for Samsung TV was confirmed. M-Pesa ID: QH12345678. Seller contact revealed.",ts:Date.now()-86400000,read:true},
    {id:"i3",from:"Weka Soko",subject:"Escrow Activated",body:"Escrow for MacBook Pro M1 is now active. Funds of KSh 123,000 held securely. You have 48hrs to confirm receipt.",ts:Date.now()-86400000*2,read:true},
  ];
  return(
    <Modal title="My Account" onClose={onClose} large>
      {/* PROFILE HEADER */}
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20,padding:"16px 0",borderBottom:"1px solid var(--border)"}}>
        <div style={{width:60,height:60,borderRadius:"50%",background:"var(--sh)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>{user?.avatar||"👤"}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:18,fontWeight:700}}>{user?.name}</div>
          <div style={{fontSize:13,color:"var(--muted)"}}>{user?.email} · {user?.role}</div>
          <div style={{fontSize:12,color:"var(--dim)"}}>Member since {user?.joined}</div>
        </div>
        <button className="btn bs sm" onClick={()=>setEditMode(!editMode)}>{editMode?"Done":"Edit Profile"}</button>
      </div>
      {editMode&&<div style={{marginBottom:18}}>
        <FF label="Bio"><textarea className="inp" value={bio} onChange={e=>setBio(e.target.value)} placeholder="Tell buyers about yourself..." style={{minHeight:70}}/></FF>
        <button className="btn bp sm" onClick={()=>{setEditMode(false);showToast("Profile updated!","success");}}>Save Changes</button>
      </div>}

      {/* TABS */}
      <div style={{display:"flex",gap:2,background:"var(--sh)",borderRadius:"var(--rs)",padding:3,marginBottom:20,overflowX:"auto"}}>
        {[["dashboard","📊 Dashboard"],["inbox","📬 Inbox"],["listings","📦 My Ads"],["settings","⚙️ Settings"]].map(([id,label])=>(
          <div key={id} style={{padding:"7px 14px",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .14s",color:tab===id?"var(--text)":"var(--muted)",background:tab===id?"var(--surface)":"transparent",whiteSpace:"nowrap"}} onClick={()=>setTab(id)}>{label}</div>
        ))}
      </div>

      {tab==="dashboard"&&<>
        <div className="stat-grid" style={{marginBottom:18}}>
          <div className="sc"><div className="sv">{mine.length}</div><div className="sl">My Ads</div></div>
          <div className="sc"><div className="sv" style={{color:"var(--red)"}}>{mine.filter(l=>l.lockedBuyerId&&!l.unlocked).length}</div><div className="sl">Pending Unlocks</div></div>
          <div className="sc"><div className="sv">{mine.reduce((a,l)=>a+l.views,0)}</div><div className="sl">Total Views</div></div>
          <div className="sc"><div className="sv" style={{color:"var(--warm)"}}>KSh {(mine.filter(l=>l.unlocked).length*250).toLocaleString()}</div><div className="sl">Spent on Unlocks</div></div>
        </div>
        <button className="btn bp" style={{width:"100%"}} onClick={()=>{onClose();onPostNew();}}>+ Post New Ad</button>
      </>}

      {tab==="inbox"&&<div>
        {INBOX.map(m=>(
          <div key={m.id} className="inbox-item" style={{borderLeft:m.read?"none":"3px solid var(--accent)"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <div style={{fontWeight:m.read?400:700,fontSize:14}}>{m.subject}</div>
              <div style={{fontSize:11,color:"var(--dim)"}}>{ago(m.ts)}</div>
            </div>
            <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.5}}>{m.body}</div>
            <div style={{fontSize:11,color:"var(--dim)",marginTop:4}}>From: {m.from}</div>
          </div>
        ))}
        {inbox.map(m=>(
          <div key={m.id} className="inbox-item">
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <div style={{fontWeight:700,fontSize:14}}>{m.subject}</div>
              <div style={{fontSize:11,color:"var(--dim)"}}>{ago(m.ts)}</div>
            </div>
            <div style={{fontSize:12,color:"var(--muted)"}}>{m.body}</div>
          </div>
        ))}
      </div>}

      {tab==="listings"&&<div>
        {mine.length===0?<div className="es"><div className="ei">📦</div><div className="et">No ads yet</div><button className="btn bp" onClick={()=>{onClose();onPostNew();}}>Post First Ad</button></div>
        :<div style={{display:"flex",flexDirection:"column",gap:10}}>
          {mine.map(l=>(
            <div key={l.id} className="lc" style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",cursor:"default"}}>
              <div style={{fontSize:28,width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",background:"var(--sh)",borderRadius:"var(--rs)"}}>{l.photos[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14}}>{l.title}</div>
                <div style={{fontSize:12,color:"var(--muted)"}}>{fmtKES(l.price)} · {l.category}</div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <span className={`badge ${l.status==="active"?"bg":l.status==="sold"?"bgm":"bgr"}`}>{l.status}</span>
                <button className="btn br2 sm" onClick={()=>{if(window.confirm("Delete this ad?"))showToast("Ad deleted.","success");}}>Delete</button>
              </div>
            </div>
          ))}
        </div>}
      </div>}

      {tab==="settings"&&<div>
        <div style={{marginBottom:16}}><div className="lbl" style={{marginBottom:10}}>Account Actions</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <button className="btn bs" style={{justifyContent:"flex-start"}} onClick={()=>{showToast("Account suspended. Contact support to reactivate.","warning");onSuspendAccount();}}>⏸ Suspend My Account</button>
            <button className="btn br2" style={{justifyContent:"flex-start"}} onClick={()=>setShowDeleteConfirm(true)}>🗑 Delete Account Permanently</button>
          </div>
        </div>
        {showDeleteConfirm&&<div className="alert alert-r" style={{marginTop:14}}>
          <div style={{fontWeight:700,marginBottom:8}}>⚠️ This is permanent and cannot be undone.</div>
          <p style={{fontSize:13,marginBottom:12}}>All your ads, messages and data will be deleted. Are you absolutely sure?</p>
          <div style={{display:"flex",gap:8}}>
            <button className="btn br2 sm" onClick={()=>{showToast("Account deleted permanently.","error");onDeleteAccount();}}>Yes, Delete Everything</button>
            <button className="btn bs sm" onClick={()=>setShowDeleteConfirm(false)}>Cancel</button>
          </div>
        </div>}
        <div className="div"/>
        <div className="lbl" style={{marginBottom:10}}>Notifications</div>
        {["Email notifications","WhatsApp notifications","Follow-up reminders","New message alerts"].map(n=>(
          <label key={n} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--border)",cursor:"pointer"}}>
            <span style={{fontSize:14}}>{n}</span>
            <input type="checkbox" defaultChecked style={{accentColor:"var(--accent)",width:16,height:16}}/>
          </label>
        ))}
      </div>}
    </Modal>
  );
}

// ── SELLER DASHBOARD ──────────────────────────────────────────────────────────
function Dashboard({listings,currentUser,onPostNew,onView,onMarkSold,showToast}){
  const mine=listings.filter(l=>l.sellerId==="s_me"||l.sellerId===currentUser?.id);
  const locked=mine.filter(l=>l.lockedBuyerId&&!l.unlocked).length;
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:26}}>
        <div><h2 style={{fontSize:24}}>My Dashboard</h2><p style={{color:"var(--muted)",fontSize:14,marginTop:3}}>Hello, {currentUser?.name||"Seller"} 👋</p></div>
        <button className="btn bp" onClick={onPostNew}>+ Post New Ad</button>
      </div>
      <div className="stat-grid" style={{marginBottom:24}}>
        <div className="sc"><div className="sv">{mine.length}</div><div className="sl">Total Ads</div></div>
        <div className="sc"><div className="sv" style={{color:"var(--red)"}}>{locked}</div><div className="sl">Pending Unlocks</div></div>
        <div className="sc"><div className="sv">{mine.reduce((a,l)=>a+l.views,0)}</div><div className="sl">Total Views</div></div>
        <div className="sc"><div className="sv" style={{color:"var(--warm)"}}>KSh {(mine.filter(l=>l.unlocked).length*250).toLocaleString()}</div><div className="sl">Unlock Fees Paid</div></div>
      </div>
      {locked>0&&<div style={{background:"rgba(184,134,11,.06)",border:"1px solid rgba(184,134,11,.2)",borderRadius:"var(--r)",padding:"14px 18px",marginBottom:22,display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:26}}>🔥</span>
        <div><div style={{fontWeight:700,color:"var(--warm)"}}>{locked} buyer{locked>1?"s":""} locked in!</div><div style={{fontSize:13,color:"var(--muted)"}}>Pay KSh 250 per ad to reveal contact details.</div></div>
      </div>}
      {mine.length===0?<div className="es"><div className="ei">📦</div><div className="et">No ads yet</div><button className="btn bp" onClick={onPostNew}>Post First Ad</button></div>
      :<div className="g3">{mine.map(l=>(
        <div key={l.id} style={{position:"relative"}}>
          <LCard listing={l} onClick={()=>onView(l)} vm="grid"/>
          {l.status==="active"&&<button className="btn bs sm" style={{position:"absolute",bottom:12,right:12,fontSize:11}} onClick={e=>{e.stopPropagation();onMarkSold(l);}}>Mark Sold</button>}
        </div>
      ))}</div>}
    </div>
  );
}

// ── SOLD ITEMS SHOWCASE ───────────────────────────────────────────────────────
function SoldShowcase({listings,onView}){
  const [cat,setCat]=useState("All");
  const sold=listings.filter(l=>l.status==="sold"&&l.soldVia==="platform");
  const filtered=cat==="All"?sold:sold.filter(l=>l.category===cat);
  const soldCats=[...new Set(sold.map(l=>l.category))];
  return(
    <div>
      <div style={{textAlign:"center",marginBottom:32}}>
        <h2 style={{fontSize:28,marginBottom:8}}>Successfully Sold on Weka Soko</h2>
        <p style={{color:"var(--muted)",fontSize:15}}>Real transactions by real Kenyans. Join {LIVE_STATS.users.toLocaleString()}+ users already on the platform.</p>
      </div>
      <div className="cg" style={{marginBottom:22,justifyContent:"center"}}>
        <div className={`chip ${cat==="All"?"on":""}`} onClick={()=>setCat("All")}>All ({sold.length})</div>
        {soldCats.map(c=><div key={c} className={`chip ${cat===c?"on":""}`} onClick={()=>setCat(c)}>{c}</div>)}
      </div>
      {filtered.length===0?<div className="es"><div className="ei">🏆</div><div className="et">Be the first to sell here!</div></div>
      :<div className="g3">
        {filtered.map(l=>(
          <div key={l.id} className="lc" style={{position:"relative"}} onClick={()=>onView(l)}>
            <div className="li">{l.photos[0]}</div>
            <div style={{position:"absolute",top:10,right:10,background:"var(--accent)",color:"#fff",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700}}>SOLD ✓</div>
            <div style={{padding:14}}>
              <div style={{fontWeight:600,marginBottom:4,fontSize:14}}>{l.title}</div>
              <div style={{fontSize:13,color:"var(--muted)",marginBottom:6}}>{l.category} · {l.location}</div>
              {l.negotiatedPrice&&<div style={{fontSize:12,color:"var(--accent)"}}>🤝 Sold for {fmtKES(l.negotiatedPrice)} <span style={{color:"var(--dim)",textDecoration:"line-through"}}>{fmtKES(l.price)}</span></div>}
              <div style={{fontSize:11,color:"var(--dim)",marginTop:6}}>{ago(l.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
}

// ── PAGINATION ────────────────────────────────────────────────────────────────
function Pager({total,pp,page,onChange}){
  const tp=Math.ceil(total/pp);if(tp<=1)return null;
  return(
    <div className="pg">
      <div className="pb" onClick={()=>page>1&&onChange(page-1)}>←</div>
      {Array.from({length:Math.min(tp,7)},(_,i)=>i+1).map(p=><div key={p} className={`pb ${p===page?"on":""}`} onClick={()=>onChange(p)}>{p}</div>)}
      {tp>7&&<div className="pb" style={{width:"auto",padding:"0 10px"}}>...{tp}</div>}
      <div className="pb" onClick={()=>page<tp&&onChange(page+1)}>→</div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function WekaSoko(){
  const [dark,setDark]=useState(()=>{try{return localStorage.getItem("ws-theme")==="dark";}catch{return false;}});
  const [page,setPage]=useState("home");
  const [listings,setListings]=useState(DEMO_LISTINGS);
  const [chats,setChats]=useState({});
  const [user,setUser]=useState(null);
  const [toast,setToast]=useState(null);
  const [filter,setFilter]=useState({cat:"All",subcat:"All",q:""});
  const [vm,setVm]=useState("grid");
  const [pp,setPp]=useState(25);
  const [pg,setPg]=useState(1);
  const [inbox]=useState([]);
  const [selL,setSelL]=useState(null);
  const [chatL,setChatL]=useState(null);
  const [shareL,setShareL]=useState(null);
  const [showPost,setShowPost]=useState(false);
  const [showAuth,setShowAuth]=useState(null);
  const [showMpesa,setShowMpesa]=useState(null);
  const [showEscrow,setShowEscrow]=useState(null);
  const [showMarkSold,setShowMarkSold]=useState(null);
  const [showProfile,setShowProfile]=useState(false);
  const [showNeg,setShowNeg]=useState(null);

  useEffect(()=>{document.body.className=dark?"dark":"";try{localStorage.setItem("ws-theme",dark?"dark":"light");}catch{};},[dark]);
  useEffect(()=>{let el=document.getElementById("ws-css");if(!el){el=document.createElement("style");el.id="ws-css";document.head.appendChild(el);}el.textContent=CSS;},[]);

  const notify=useCallback((msg,type="info")=>setToast({msg,type,id:Date.now()}),[]);

  const filtered=listings.filter(l=>{
    if(page==="sold")return l.status==="sold";
    const mc=filter.cat==="All"||l.category===filter.cat;
    const mq=!filter.q||l.title.toLowerCase().includes(filter.q.toLowerCase())||l.location.toLowerCase().includes(filter.q.toLowerCase());
    return mc&&mq&&l.status==="active";
  });

  const catCounts=CATEGORIES.reduce((a,c)=>{a[c.name]=listings.filter(l=>l.category===c.name&&l.status==="active").length;return a;},{});
  const paginated=filtered.slice((pg-1)*pp,pg*pp);

  const lockIn=(l)=>{setListings(p=>p.map(x=>x.id===l.id?{...x,lockedBuyerId:user?.id||"guest",interestedCount:x.interestedCount+1}:x));setChatL(null);notify("🔒 Locked in! Seller notified via email, WhatsApp and inbox.","success");};

  const unlock=(l)=>setShowMpesa({amount:250,purpose:`Unlock contact for: ${l.title}`,showVoucher:true,
    onSuccess:({receipt})=>{
      setListings(p=>p.map(x=>x.id===l.id?{...x,unlocked:true}:x));
      setSelL(p=>p?{...p,unlocked:true}:p);
      notify(`🔓 Contact revealed! M-Pesa ID: ${receipt} sent to email, WhatsApp & inbox.`,"success");
      setShowMpesa(null);
    }
  });

  const escrowConfirm=()=>{
    if(showEscrow){const l=showEscrow;setShowEscrow(null);
      const price=l.negotiatedPrice||l.price;
      setShowMpesa({amount:Math.round(price*1.025),purpose:`Escrow for: ${l.title} (Till 5673935)`,showVoucher:true,
        onSuccess:({receipt})=>{
          setListings(p=>p.map(x=>x.id===l.id?{...x,escrowActive:true}:x));
          notify(`🔐 Escrow activated! M-Pesa ID: ${receipt}. Email, WhatsApp & inbox notified.`,"success");
          setShowMpesa(null);
        }
      });
    }
  };

  const handleMarkSold=(l,via)=>{
    setListings(p=>p.map(x=>x.id===l.id?{...x,status:"sold",soldVia:via}:x));
    setShowMarkSold(null);
    notify(via==="platform"?"✅ Marked as sold via Weka Soko!":"✅ Ad removed from active listings.","success");
  };

  const handleOffer=(l,offer,msg)=>{
    setListings(p=>p.map(x=>x.id===l.id?{...x,offerPrice:offer,offerStatus:"pending"}:x));
    notify("💰 Offer sent to seller!","success");
  };

  return(<>
    <nav className="nav">
      <div className="nav-logo" onClick={()=>setPage("home")}>Weka<span>Soko</span></div>
      <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <button className={`btn bgh sm ${page==="home"?"":""}`} onClick={()=>setPage("home")}>Browse</button>
        <button className="btn bgh sm" onClick={()=>setPage("sold")}>🏆 Sold</button>
        {user?.role==="seller"&&<button className="btn bgh sm" onClick={()=>setPage("dashboard")}>Dashboard</button>}
        <button className="tt" onClick={()=>setDark(d=>!d)}>{dark?"☀️":"🌙"}</button>
        {user?<>
          <button className="btn bs sm" onClick={()=>setShowProfile(true)}>👤 {user.name.split(" ")[0]}</button>
          <button className="btn bgh sm" onClick={()=>{setUser(null);setPage("home");}}>Sign Out</button>
        </>:<>
          <button className="btn bgh sm" onClick={()=>setShowAuth("login")}>Sign In</button>
          <button className="btn bp sm" onClick={()=>setShowAuth("signup")}>Sign Up</button>
        </>}
      </div>
    </nav>

    <main style={{maxWidth:1180,margin:"0 auto",padding:"28px 22px"}}>
      {page==="home"&&<>
        {/* HERO */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:24,marginBottom:40}}>
          <div style={{maxWidth:500}}>
            <div className="badge bg" style={{marginBottom:12,fontSize:11}}>🇰🇪 Kenya's Smartest Resell Platform</div>
            <h1 style={{fontSize:"clamp(28px,5vw,48px)",fontWeight:800,letterSpacing:"-.02em",lineHeight:1.1,marginBottom:14}}>
              Post Free.<br/><span style={{color:"var(--accent)"}}>Pay Only When</span><br/>You Get a Buyer.
            </h1>
            <p style={{fontSize:15,color:"var(--muted)",lineHeight:1.7,marginBottom:22}}>List items for free. Pay KSh 250 only when a real buyer locks in. Safe, moderated, and proudly Kenyan.</p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button className="btn bp lg" onClick={()=>user?setShowPost(true):setShowAuth("signup")}>Post an Ad for Free →</button>
              <button className="btn bs lg" onClick={()=>document.getElementById("ls")?.scrollIntoView({behavior:"smooth"})}>Browse Listings</button>
            </div>
          </div>
          {/* LIVE STATS */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3,flex:"0 0 auto",width:"min(300px,100%)",borderRadius:"var(--rl)",overflow:"hidden",border:"1px solid var(--border)"}}>
            {[{icon:"👥",label:"Users",val:LIVE_STATS.users},{icon:"📦",label:"Active Ads",val:LIVE_STATS.activeAds},{icon:"✅",label:"Sold",val:LIVE_STATS.sold},{icon:"💰",label:"KSh Transacted",val:LIVE_STATS.revenue}].map(s=>(
              <div key={s.label} style={{background:"var(--sh)",padding:"16px 14px"}}>
                <div style={{fontSize:20,marginBottom:5}}>{s.icon}</div>
                <div style={{fontSize:20,fontWeight:800,color:"var(--accent)"}}><Counter to={s.val}/></div>
                <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CATEGORY GRID */}
        <div style={{marginBottom:24}}>
          <h3 style={{fontSize:13,fontWeight:700,color:"var(--muted)",marginBottom:12,textTransform:"uppercase",letterSpacing:".06em"}}>Browse by Category</h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:8,marginBottom:14}}>
            {CATEGORIES.map(c=>(
              <div key={c.name} onClick={()=>{setFilter(p=>({...p,cat:c.name}));setPg(1);document.getElementById("ls")?.scrollIntoView({behavior:"smooth"});}} style={{background:"var(--sh)",border:`1px solid ${filter.cat===c.name?"var(--accent)":"var(--border)"}`,borderRadius:"var(--rs)",padding:"10px 8px",textAlign:"center",cursor:"pointer",transition:"all .14s",color:filter.cat===c.name?"var(--accent)":"var(--text)"}}>
                <div style={{fontSize:22,marginBottom:4}}>{c.icon}</div>
                <div style={{fontSize:11,fontWeight:600,lineHeight:1.3}}>{c.name}</div>
                {catCounts[c.name]>0&&<div style={{fontSize:10,color:"var(--dim)",marginTop:2}}>{catCounts[c.name]} ads</div>}
              </div>
            ))}
          </div>
        </div>

        {/* SEARCH + CONTROLS */}
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",padding:"12px 16px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--r)",marginBottom:26}}>
          <input className="inp" style={{flex:1,minWidth:180}} placeholder="🔍 Search listings..." value={filter.q} onChange={e=>{setFilter(p=>({...p,q:e.target.value}));setPg(1);}}/>
          {filter.cat!=="All"&&<button className="btn bs sm" onClick={()=>setFilter(p=>({...p,cat:"All"}))}>✕ {filter.cat}</button>}
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <span style={{fontSize:12,color:"var(--muted)",whiteSpace:"nowrap"}}>Show:</span>
            <select className="inp" style={{width:"auto",padding:"8px 10px"}} value={pp} onChange={e=>{setPp(parseInt(e.target.value));setPg(1);}}>
              {[25,50,80,100].map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="vt">
            <div className={`vb ${vm==="grid"?"on":""}`} onClick={()=>setVm("grid")} title="Grid">⊞</div>
            <div className={`vb ${vm==="list"?"on":""}`} onClick={()=>setVm("list")} title="List">☰</div>
          </div>
        </div>

        {/* LISTINGS */}
        <div id="ls">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
            <h2 style={{fontSize:20}}>
              {filter.cat==="All"?"Latest Listings":filter.cat}
              <span style={{fontFamily:"Inter",fontWeight:400,fontSize:14,color:"var(--muted)",marginLeft:8}}>({filtered.length})</span>
            </h2>
            <button className="btn bp sm" onClick={()=>user?setShowPost(true):setShowAuth("signup")}>+ Post Ad</button>
          </div>
          {paginated.length===0?<div className="es"><div className="ei">🔍</div><div className="et">No listings found</div></div>
          :<div className={vm==="grid"?"g3":"lvc"}>{paginated.map(l=><LCard key={l.id} listing={l} onClick={()=>setSelL(l)} vm={vm}/>)}</div>}
          <Pager total={filtered.length} pp={pp} page={pg} onChange={setPg}/>
        </div>

        {/* HOW IT WORKS */}
        <div style={{marginTop:56,padding:"36px 0",borderTop:"1px solid var(--border)"}}>
          <h2 style={{fontSize:22,textAlign:"center",marginBottom:28}}>How Weka Soko Works</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:14}}>
            {[["📝","Post for Free","No fees upfront. Add photos and description."],["💬","Safe Chat","Moderated anonymous chat. No contact until unlock."],["💰","Negotiate","Buyers can make offers. Sellers accept or decline."],["🔒","Lock In","Serious buyer clicks Ready to Buy. You're notified."],["💳","Pay KSh 250","Seller pays once to reveal contacts and close the deal."],["🔐","Escrow","Optional 2.5% protection. Funds held until confirmed."]].map(([icon,title,desc])=>(
              <div key={title} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:18}}>
                <div style={{fontSize:28,marginBottom:10}}>{icon}</div>
                <div style={{fontWeight:700,marginBottom:5,fontSize:14,fontFamily:"Inter"}}>{title}</div>
                <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.6}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </>}

      {page==="sold"&&<SoldShowcase listings={listings} onView={l=>setSelL(l)}/>}
      {page==="dashboard"&&<Dashboard listings={listings} currentUser={user} onPostNew={()=>setShowPost(true)} onView={l=>setSelL(l)} onMarkSold={l=>setShowMarkSold(l)} showToast={notify}/>}
    </main>

    {/* MODALS */}
    {selL&&<Detail listing={selL} currentUser={user} onClose={()=>setSelL(null)}
      onChat={()=>{setSelL(null);setChatL(selL);}}
      onUnlock={()=>unlock(selL)}
      onEscrow={()=>{setSelL(null);setShowEscrow(selL);}}
      onShare={()=>{setShareL(selL);setSelL(null);}}
      onNegotiate={()=>{setShowNeg(selL);setSelL(null);}}
    />}
    {chatL&&<Chat listing={chatL} currentUser={user} onClose={()=>setChatL(null)} onLockIn={()=>lockIn(chatL)} chats={chats} setChats={setChats} showToast={notify}
      onMarkSold={l=>setShowMarkSold(l)}
    />}
    {showNeg&&<NegotiateModal listing={showNeg} currentUser={user} onClose={()=>setShowNeg(null)} onOffer={(offer,msg)=>handleOffer(showNeg,offer,msg)} showToast={notify}/>}
    {showPost&&<PostAd onClose={()=>setShowPost(false)} onSubmit={l=>{setListings(p=>[l,...p]);notify("🚀 Your ad is live!","success");}}/>}
    {showAuth&&<AuthModal mode={showAuth} onClose={()=>setShowAuth(null)} onAuth={u=>setUser(u)} showToast={notify}/>}
    {showMpesa&&<Mpesa amount={showMpesa.amount} purpose={showMpesa.purpose} onSuccess={showMpesa.onSuccess} onClose={()=>setShowMpesa(null)} showVoucher={showMpesa.showVoucher} vouchers={VOUCHERS}/>}
    {showEscrow&&<EscrowModal listing={showEscrow} onClose={()=>setShowEscrow(null)} onConfirm={escrowConfirm}/>}
    {showMarkSold&&<MarkSoldModal listing={showMarkSold} onClose={()=>setShowMarkSold(null)} onConfirm={(via)=>handleMarkSold(showMarkSold,via)}/>}
    {shareL&&<ShareModal listing={shareL} onClose={()=>setShareL(null)}/>}
    {showProfile&&user&&<ProfilePage user={user} listings={listings} inbox={inbox} onClose={()=>setShowProfile(false)} onPostNew={()=>setShowPost(true)} onViewListing={l=>setSelL(l)} showToast={notify} onDeleteAccount={()=>{setUser(null);setShowProfile(false);}} onSuspendAccount={()=>{setUser(null);setShowProfile(false);}}/>}
    {toast&&<Toast key={toast.id} message={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
  </>);
}
