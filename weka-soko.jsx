import { useState, useEffect, useRef, useCallback } from "react";

// ── DESIGN SYSTEM ──────────────────────────────────────────────────────────────
const theme = {
  bg: "#0A0A0A",
  surface: "#141414",
  surfaceHigh: "#1E1E1E",
  border: "#2A2A2A",
  borderLight: "#333",
  accent: "#00C853",       // Vibrant green - "go/sell"
  accentDark: "#009624",
  accentWarm: "#FFD600",   // Gold for premium/escrow
  accentRed: "#FF3D3D",
  text: "#F0F0F0",
  textMuted: "#888",
  textDim: "#555",
  card: "#161616",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: ${theme.bg};
    --surface: ${theme.surface};
    --surface-high: ${theme.surfaceHigh};
    --border: ${theme.border};
    --border-light: ${theme.borderLight};
    --accent: ${theme.accent};
    --accent-dark: ${theme.accentDark};
    --accent-warm: ${theme.accentWarm};
    --accent-red: ${theme.accentRed};
    --text: ${theme.text};
    --text-muted: ${theme.textMuted};
    --text-dim: ${theme.textDim};
    --card: ${theme.card};
    --radius: 12px;
    --radius-sm: 8px;
    --radius-lg: 18px;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    line-height: 1.6;
    min-height: 100vh;
    overflow-x: hidden;
  }

  h1, h2, h3, h4 { font-family: 'Syne', sans-serif; line-height: 1.2; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border-light); border-radius: 2px; }

  .grain {
    position: fixed; inset: 0; pointer-events: none; z-index: 9999; opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  }

  .badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
    letter-spacing: 0.04em; text-transform: uppercase;
  }
  .badge-green { background: rgba(0,200,83,0.15); color: var(--accent); border: 1px solid rgba(0,200,83,0.25); }
  .badge-gold { background: rgba(255,214,0,0.12); color: var(--accent-warm); border: 1px solid rgba(255,214,0,0.2); }
  .badge-red { background: rgba(255,61,61,0.12); color: var(--accent-red); border: 1px solid rgba(255,61,61,0.2); }
  .badge-gray { background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border); }
  .badge-blue { background: rgba(66,165,245,0.12); color: #42A5F5; border: 1px solid rgba(66,165,245,0.2); }

  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 11px 22px; border-radius: var(--radius-sm); font-family: 'Syne', sans-serif;
    font-size: 13px; font-weight: 700; letter-spacing: 0.03em; cursor: pointer;
    border: none; transition: all 0.18s ease; text-decoration: none; white-space: nowrap;
  }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-primary { background: var(--accent); color: #000; }
  .btn-primary:hover:not(:disabled) { background: #00E060; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,200,83,0.3); }
  .btn-secondary { background: var(--surface-high); color: var(--text); border: 1px solid var(--border-light); }
  .btn-secondary:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
  .btn-gold { background: var(--accent-warm); color: #000; }
  .btn-gold:hover:not(:disabled) { background: #FFE033; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(255,214,0,0.3); }
  .btn-danger { background: rgba(255,61,61,0.15); color: var(--accent-red); border: 1px solid rgba(255,61,61,0.25); }
  .btn-danger:hover:not(:disabled) { background: var(--accent-red); color: #fff; }
  .btn-ghost { background: transparent; color: var(--text-muted); }
  .btn-ghost:hover:not(:disabled) { color: var(--text); background: var(--surface-high); }
  .btn-sm { padding: 7px 14px; font-size: 12px; }
  .btn-lg { padding: 14px 28px; font-size: 15px; }

  .input {
    width: 100%; padding: 11px 14px; background: var(--surface-high);
    border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text);
    font-family: 'DM Sans', sans-serif; font-size: 14px; transition: border-color 0.15s;
    outline: none;
  }
  .input:focus { border-color: var(--accent); }
  .input::placeholder { color: var(--text-dim); }
  textarea.input { resize: vertical; min-height: 100px; }

  .label { display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 6px; }

  .card {
    background: var(--card); border: 1px solid var(--border); border-radius: var(--radius);
    overflow: hidden;
  }

  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 1000;
    display: flex; align-items: center; justify-content: center; padding: 20px;
    backdrop-filter: blur(4px);
  }
  .modal {
    background: var(--surface); border: 1px solid var(--border-light); border-radius: var(--radius-lg);
    width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto;
    animation: slideUp 0.2s ease;
  }
  @keyframes slideUp { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform: translateY(0); } }

  .modal-header {
    padding: 24px 28px 20px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .modal-body { padding: 24px 28px; }
  .modal-footer { padding: 16px 28px 24px; border-top: 1px solid var(--border); display: flex; gap: 10px; justify-content: flex-end; }

  .chat-bubble {
    max-width: 75%; padding: 10px 14px; border-radius: 16px; font-size: 14px; line-height: 1.5;
  }
  .chat-bubble.sent { background: var(--accent); color: #000; border-bottom-right-radius: 4px; margin-left: auto; }
  .chat-bubble.received { background: var(--surface-high); border-bottom-left-radius: 4px; }
  .chat-bubble.blocked { background: rgba(255,61,61,0.1); border: 1px solid rgba(255,61,61,0.2); color: var(--accent-red); font-size: 12px; font-style: italic; }

  .listing-card {
    background: var(--card); border: 1px solid var(--border); border-radius: var(--radius);
    overflow: hidden; transition: all 0.2s ease; cursor: pointer;
  }
  .listing-card:hover { border-color: var(--border-light); transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.4); }

  .listing-img {
    width: 100%; aspect-ratio: 4/3; object-fit: cover;
    background: var(--surface-high); display: flex; align-items: center; justify-content: center;
    color: var(--text-dim); font-size: 40px;
  }

  .nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(10,10,10,0.92); border-bottom: 1px solid var(--border);
    backdrop-filter: blur(12px);
    padding: 0 24px; height: 60px;
    display: flex; align-items: center; justify-content: space-between;
  }

  .nav-logo {
    font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800;
    letter-spacing: -0.02em;
  }
  .nav-logo span { color: var(--accent); }

  .tabs { display: flex; gap: 2px; background: var(--surface-high); border-radius: var(--radius-sm); padding: 3px; }
  .tab { padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; color: var(--text-muted); font-family: 'Syne', sans-serif; }
  .tab.active { background: var(--surface-high); background: var(--bg); color: var(--text); }

  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .section-title { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }

  .grid-3 { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
  .grid-2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px; }

  .stat-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
  .stat-value { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; }
  .stat-label { font-size: 12px; color: var(--text-muted); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }

  .progress-bar { height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.3s ease; }

  .toast {
    position: fixed; bottom: 24px; right: 24px; z-index: 2000;
    background: var(--surface-high); border: 1px solid var(--border-light);
    border-radius: var(--radius); padding: 14px 20px; font-size: 14px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.5); animation: toastIn 0.25s ease;
    display: flex; align-items: center; gap: 10px; max-width: 360px;
  }
  @keyframes toastIn { from { opacity:0; transform: translateX(20px); } to { opacity:1; transform: translateX(0); } }

  .divider { height: 1px; background: var(--border); margin: 20px 0; }

  .mpesa-input { display: flex; align-items: center; gap: 0; }
  .mpesa-prefix {
    background: var(--surface); border: 1px solid var(--border); border-right: none;
    border-radius: var(--radius-sm) 0 0 var(--radius-sm); padding: 11px 14px;
    color: var(--text-muted); font-size: 14px; white-space: nowrap;
  }
  .mpesa-input .input { border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }

  .hero-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 3px; border-radius: var(--radius); overflow: hidden;
  }
  .hero-cell { background: var(--surface-high); padding: 20px; }

  .chip-group { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip {
    padding: 5px 12px; border-radius: 20px; font-size: 12px; cursor: pointer;
    border: 1px solid var(--border); color: var(--text-muted); transition: all 0.15s;
  }
  .chip.active, .chip:hover { border-color: var(--accent); color: var(--accent); background: rgba(0,200,83,0.08); }

  .empty-state {
    text-align: center; padding: 60px 20px; color: var(--text-muted);
  }
  .empty-state-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
  .empty-state-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 8px; }

  @media (max-width: 768px) {
    .grid-3, .grid-2 { grid-template-columns: 1fr; }
    .modal { max-width: 100%; margin: 0; border-radius: var(--radius-lg) var(--radius-lg) 0 0; align-self: flex-end; }
    .nav { padding: 0 16px; }
    .modal-body, .modal-header, .modal-footer { padding-left: 20px; padding-right: 20px; }
  }

  select.input { appearance: none; cursor: pointer; }
`;

// ── DATA & HELPERS ──────────────────────────────────────────────────────────────

const CATEGORIES = ["Electronics","Furniture","Clothing","Vehicles","Books","Sports","Kitchen","Tools","Baby Items","Other"];

const CONTACT_PATTERNS = [
  /\b0\s*[17]\s*\d[\s\-\.\•\*]*\d[\s\-\.\•\*]*\d[\s\-\.\•\*]*\d[\s\-\.\•\*]*\d[\s\-\.\•\*]*\d[\s\-\.\•\*]*\d/gi,
  /\b(?:zero\s*(?:one|seven))[\s\w]*\d/gi,
  /\+\s*2\s*5\s*4/gi,
  /\b\d{9,}\b/g,
  /[a-z0-9._%+\-]+\s*@\s*[a-z0-9.\-]+\s*\.\s*[a-z]{2,}/gi,
  /https?:\/\//gi,
  /www\./gi,
  /wa\.me|whatsapp|telegram|signal/gi,
  /\b(?:0ne|z3ro|thr33|f0ur|f1ve|s1x|s3ven|3ight|n1ne)\b/gi,
];

function detectContactInfo(text) {
  return CONTACT_PATTERNS.some(p => p.test(text));
}

function formatKES(n) {
  return "KSh " + Number(n).toLocaleString("en-KE");
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return Math.floor(diff/60000) + "m ago";
  if (diff < 86400000) return Math.floor(diff/3600000) + "h ago";
  return Math.floor(diff/86400000) + "d ago";
}

const DEMO_LISTINGS = [
  { id: "l1", title: "Samsung 55\" QLED TV", category: "Electronics", price: 45000, description: "Bought in 2022, excellent condition. Comes with original remote and wall mount bracket. No dead pixels. Selling because I'm upgrading to a bigger screen.", reason: "Upgrading to larger screen", location: "Westlands, Nairobi", photos: ["📺"], status: "active", sellerId: "s1", sellerAnon: "Seller #4821", unlocked: false, createdAt: Date.now() - 86400000 * 2, views: 143, interestedCount: 3, lockedBuyerId: null, escrowActive: false },
  { id: "l2", title: "Trek Mountain Bike 29\"", category: "Sports", price: 28000, description: "Trek Marlin 7, 2021 model. Hydraulic disc brakes, 9-speed Shimano gears. Minor scratches on frame but mechanically perfect. Serviced 2 months ago.", reason: "No longer cycling", location: "Karen, Nairobi", photos: ["🚲"], status: "active", sellerId: "s2", sellerAnon: "Seller #2034", unlocked: false, createdAt: Date.now() - 86400000, views: 87, interestedCount: 1, lockedBuyerId: null, escrowActive: false },
  { id: "l3", title: "Apple MacBook Pro M1 14\"", category: "Electronics", price: 120000, description: "2021 MacBook Pro M1 Pro chip, 16GB RAM, 512GB SSD. Space gray. Battery cycles: 89. Comes with original charger and box.", reason: "Got a work laptop", location: "Kilimani, Nairobi", photos: ["💻"], status: "active", sellerId: "s3", sellerAnon: "Seller #7712", unlocked: true, createdAt: Date.now() - 3600000 * 5, views: 312, interestedCount: 7, lockedBuyerId: "b1", escrowActive: false },
  { id: "l4", title: "Dining Table Set (6 Seater)", category: "Furniture", price: 35000, description: "Solid mahogany dining table with 6 padded chairs. Used for 3 years. Very good condition, minor wear on one chair. Dimensions: 180cm x 90cm.", reason: "Moving to a smaller house", location: "Lavington, Nairobi", photos: ["🪑"], status: "active", sellerId: "s1", sellerAnon: "Seller #4821", unlocked: false, createdAt: Date.now() - 86400000 * 5, views: 56, interestedCount: 0, lockedBuyerId: null, escrowActive: false },
  { id: "l5", title: "Sony PlayStation 5 + 3 Games", category: "Electronics", price: 65000, description: "PS5 Disc Edition, 825GB. Bought December 2022. Comes with Elden Ring, FIFA 24, and God of War Ragnarok. All original, controllers in perfect condition.", reason: "Switching to PC gaming", location: "Ngong Road, Nairobi", photos: ["🎮"], status: "active", sellerId: "s2", sellerAnon: "Seller #2034", unlocked: false, createdAt: Date.now() - 86400000 * 3, views: 228, interestedCount: 5, lockedBuyerId: null, escrowActive: false },
  { id: "l6", title: "Canon EOS R50 Camera Kit", category: "Electronics", price: 78000, description: "Canon EOS R50 with 18-45mm kit lens. Only 1,200 shutter actuations. Comes with 2 batteries, charger, 64GB card, and original box.", reason: "Professional upgrade", location: "Parklands, Nairobi", photos: ["📷"], status: "sold", sellerId: "s3", sellerAnon: "Seller #7712", unlocked: true, createdAt: Date.now() - 86400000 * 10, views: 489, interestedCount: 12, lockedBuyerId: "b2", escrowActive: false },
];

const DEMO_CHATS = {
  l1: [
    { id: "m1", senderId: "buyer", text: "Hi, is the TV still available?", ts: Date.now() - 3600000, blocked: false },
    { id: "m2", senderId: "seller", text: "Yes it is! Feel free to ask any questions.", ts: Date.now() - 3540000, blocked: false },
    { id: "m3", senderId: "buyer", text: "Is the price negotiable?", ts: Date.now() - 3480000, blocked: false },
    { id: "m4", senderId: "seller", text: "I can do KSh 43,000 for a serious buyer.", ts: Date.now() - 3420000, blocked: false },
  ],
};

// ── COMPONENTS ──────────────────────────────────────────────────────────────────

function Toast({ message, type = "info", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  const icon = type === "success" ? "✅" : type === "error" ? "❌" : type === "warning" ? "⚠️" : "ℹ️";
  return (
    <div className="toast">
      <span>{icon}</span>
      <span>{message}</span>
    </div>
  );
}

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 style={{ fontSize: 18, fontWeight: 800 }}>{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: "6px 10px", fontSize: 16 }}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

function FormField({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && <p style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

function ListingCard({ listing, onClick }) {
  const statusColor = listing.status === "active" ? "badge-green" : listing.status === "sold" ? "badge-red" : "badge-gray";
  return (
    <div className="listing-card" onClick={onClick}>
      <div className="listing-img" style={{ fontSize: 56, background: "var(--surface-high)" }}>
        <div style={{ textAlign: "center" }}>
          <div>{listing.photos[0]}</div>
        </div>
      </div>
      <div style={{ padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
          <h4 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{listing.title}</h4>
          <span className={`badge ${statusColor}`}>{listing.status}</span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)", fontFamily: "Syne, sans-serif", marginBottom: 8 }}>
          {formatKES(listing.price)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text-muted)", fontSize: 12 }}>
          <span>📍 {listing.location}</span>
          <span>👁 {listing.views}</span>
          <span>🕒 {timeAgo(listing.createdAt)}</span>
        </div>
        {listing.unlocked && (
          <div style={{ marginTop: 10 }}>
            <span className="badge badge-gold">🔓 Unlocked</span>
          </div>
        )}
        {listing.interestedCount > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
            🔥 {listing.interestedCount} interested buyer{listing.interestedCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

// ── MPESA MODAL ──────────────────────────────────────────────────────────────────
function MpesaPaymentModal({ amount, purpose, onSuccess, onClose }) {
  const [phone, setPhone] = useState("07");
  const [step, setStep] = useState("input"); // input | waiting | success
  const [countdown, setCountdown] = useState(30);

  const handlePay = () => {
    if (phone.length < 10) return;
    setStep("waiting");
    let c = 30;
    const iv = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(iv);
        setStep("success");
        setTimeout(onSuccess, 1500);
      }
    }, 1000);
  };

  return (
    <Modal title="M-Pesa Payment" onClose={onClose}>
      {step === "input" && (
        <>
          <div style={{ background: "rgba(0,200,83,0.08)", border: "1px solid rgba(0,200,83,0.2)", borderRadius: "var(--radius)", padding: "16px 20px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Amount to pay</div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "Syne", color: "var(--accent)" }}>{formatKES(amount)}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{purpose}</div>
          </div>
          <FormField label="M-Pesa Phone Number">
            <div className="mpesa-input">
              <div className="mpesa-prefix">🇰🇪 +254</div>
              <input className="input" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,""))} placeholder="07XXXXXXXX" maxLength={10} />
            </div>
          </FormField>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
            An STK Push will be sent to your phone. Enter your M-Pesa PIN to confirm.
          </p>
          <button className="btn btn-primary btn-lg" style={{ width: "100%" }} onClick={handlePay} disabled={phone.length < 10}>
            Send STK Push →
          </button>
        </>
      )}
      {step === "waiting" && (
        <div style={{ textAlign: "center", padding: "30px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
          <h3 style={{ marginBottom: 8 }}>Check Your Phone</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>Enter your M-Pesa PIN on the prompt sent to <strong>{phone}</strong></p>
          <div style={{ fontSize: 36, fontWeight: 800, color: "var(--accent)", fontFamily: "Syne" }}>{countdown}s</div>
          <div className="progress-bar" style={{ maxWidth: 200, margin: "12px auto 0" }}>
            <div className="progress-fill" style={{ width: `${(countdown/30)*100}%` }} />
          </div>
        </div>
      )}
      {step === "success" && (
        <div style={{ textAlign: "center", padding: "30px 0" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h3 style={{ color: "var(--accent)" }}>Payment Confirmed!</h3>
          <p style={{ color: "var(--text-muted)", marginTop: 8 }}>{formatKES(amount)} received. Processing...</p>
        </div>
      )}
    </Modal>
  );
}

// ── CHAT MODAL ──────────────────────────────────────────────────────────────────
function ChatModal({ listing, currentUser, onClose, onLockIn, chats, setChats, showToast }) {
  const [msg, setMsg] = useState("");
  const [warnings, setWarnings] = useState(0);
  const messagesEnd = useRef(null);
  const listingChats = chats[listing.id] || [];
  const isBuyer = currentUser?.role === "buyer" || !currentUser;
  const isLocked = !!listing.lockedBuyerId;
  const alreadyLocked = listing.lockedBuyerId === (currentUser?.id || "guest");

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [listingChats]);

  const sendMessage = () => {
    if (!msg.trim()) return;
    if (detectContactInfo(msg)) {
      const newWarning = warnings + 1;
      setWarnings(newWarning);
      const blocked = { id: Date.now()+"b", senderId: isBuyer ? "buyer" : "seller", text: msg, ts: Date.now(), blocked: true, blockReason: "Contact info detected and blocked" };
      setChats(prev => ({ ...prev, [listing.id]: [...(prev[listing.id] || []), blocked] }));
      showToast(newWarning >= 2 ? "⛔ Repeated violation — account flagged for review." : "⚠️ Message blocked: contact info not allowed before locking in.", "warning");
      setMsg("");
      return;
    }
    const newMsg = { id: Date.now()+"", senderId: isBuyer ? "buyer" : "seller", text: msg, ts: Date.now(), blocked: false };
    setChats(prev => ({ ...prev, [listing.id]: [...(prev[listing.id] || []), newMsg] }));
    setMsg("");
  };

  return (
    <Modal title={`💬 Chat — ${listing.title}`} onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "10px 14px", background: "var(--surface-high)", borderRadius: "var(--radius-sm)" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{listing.title}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Seller: {listing.sellerAnon}</div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--accent)", fontFamily: "Syne" }}>{formatKES(listing.price)}</div>
      </div>

      <div style={{ background: "rgba(255,214,0,0.06)", border: "1px solid rgba(255,214,0,0.15)", borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "var(--text-muted)" }}>
        🤖 <strong style={{ color: "var(--accent-warm)" }}>Moderated Chat</strong> — Sharing contact info, phone numbers, emails, or links before locking in is <strong style={{ color: "var(--accent-red)" }}>not allowed</strong> and will be automatically blocked.
      </div>

      <div style={{ minHeight: 280, maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, padding: "4px 0", marginBottom: 16 }}>
        {listingChats.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--text-dim)", padding: "60px 0", fontSize: 14 }}>No messages yet. Start the conversation!</div>
        )}
        {listingChats.map(m => (
          <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: m.blocked ? "stretch" : m.senderId === (isBuyer ? "buyer" : "seller") ? "flex-end" : "flex-start" }}>
            {m.blocked ? (
              <div className="chat-bubble blocked" style={{ textAlign: "center" }}>
                🚫 Message blocked — contact info detected. ({m.senderId === "buyer" ? "Buyer" : "Seller"})
              </div>
            ) : (
              <>
                <div className={`chat-bubble ${m.senderId === (isBuyer ? "buyer" : "seller") ? "sent" : "received"}`}>
                  {m.text}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3, paddingLeft: 4, paddingRight: 4 }}>{timeAgo(m.ts)}</div>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEnd} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input className="input" value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Type a message..." style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={sendMessage} disabled={!msg.trim()}>Send</button>
      </div>

      {isBuyer && !isLocked && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          <button className="btn btn-gold btn-lg" style={{ width: "100%" }} onClick={onLockIn}>
            🔒 I'm Ready to Buy — Lock In
          </button>
          <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 8 }}>This notifies the seller. No payment required from you.</p>
        </div>
      )}
      {isBuyer && alreadyLocked && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, textAlign: "center" }}>
          <span className="badge badge-green" style={{ fontSize: 13 }}>✅ You've locked in! Waiting for seller to unlock contact details.</span>
        </div>
      )}
      {isBuyer && isLocked && !alreadyLocked && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, textAlign: "center" }}>
          <span className="badge badge-red">🔒 Another buyer has already locked in on this item.</span>
        </div>
      )}
    </Modal>
  );
}

// ── LISTING DETAIL MODAL ──────────────────────────────────────────────────────────────────
function ListingDetailModal({ listing, currentUser, onClose, onChat, onUnlock, onEscrow }) {
  const isSeller = currentUser?.id === listing.sellerId;
  const isLocked = !!listing.lockedBuyerId;
  const showSellerDetails = listing.unlocked;

  return (
    <Modal title={listing.title} onClose={onClose} footer={
      <div style={{ width: "100%", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {!isSeller && listing.status === "active" && (
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onChat}>💬 Chat with Seller</button>
        )}
        {!isSeller && listing.status === "active" && !listing.escrowActive && (
          <button className="btn btn-gold btn-sm" onClick={onEscrow}>🔐 Use Escrow (7.5%)</button>
        )}
        {isSeller && isLocked && !listing.unlocked && (
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onUnlock}>🔓 Unlock Contact — KSh 250</button>
        )}
      </div>
    }>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, borderRadius: "var(--radius)", overflow: "hidden", marginBottom: 20 }}>
        <div style={{ background: "var(--surface-high)", aspectRatio: "4/3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72, gridColumn: "1 / -1" }}>
          {listing.photos[0]}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent)", fontFamily: "Syne" }}>{formatKES(listing.price)}</div>
          <span className="badge badge-gray" style={{ marginTop: 6 }}>{listing.category}</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <span className={`badge ${listing.status === "active" ? "badge-green" : "badge-red"}`}>{listing.status}</span>
          {listing.escrowActive && <div style={{ marginTop: 6 }}><span className="badge badge-gold">🔐 Escrow Active</span></div>}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div className="label">Description</div>
        <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7 }}>{listing.description}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ background: "var(--surface-high)", borderRadius: "var(--radius-sm)", padding: "12px 14px" }}>
          <div className="label">Reason for Selling</div>
          <div style={{ fontSize: 13 }}>{listing.reason}</div>
        </div>
        <div style={{ background: "var(--surface-high)", borderRadius: "var(--radius-sm)", padding: "12px 14px" }}>
          <div className="label">Collection Location</div>
          <div style={{ fontSize: 13 }}>📍 {listing.location}</div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div className="label">Seller</div>
        {showSellerDetails ? (
          <div style={{ background: "rgba(0,200,83,0.08)", border: "1px solid rgba(0,200,83,0.2)", borderRadius: "var(--radius-sm)", padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span className="badge badge-green">🔓 Unlocked</span>
            </div>
            <div style={{ fontSize: 13 }}>
              <div>📞 <strong>0712 345 678</strong></div>
              <div>📧 <strong>seller@example.com</strong></div>
            </div>
          </div>
        ) : (
          <div style={{ background: "var(--surface-high)", borderRadius: "var(--radius-sm)", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 24 }}>🔒</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{listing.sellerAnon}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Contact revealed after KSh 250 unlock</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)" }}>
        <span>👁 {listing.views} views</span>
        <span>🔥 {listing.interestedCount} interested</span>
        <span>🕒 Posted {timeAgo(listing.createdAt)}</span>
      </div>

      {isLocked && !listing.unlocked && isSeller && (
        <div style={{ marginTop: 16, background: "rgba(255,214,0,0.08)", border: "1px solid rgba(255,214,0,0.25)", borderRadius: "var(--radius)", padding: "14px 16px" }}>
          <div style={{ fontWeight: 700, color: "var(--accent-warm)", marginBottom: 4 }}>🔥 A buyer has locked in!</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Pay KSh 250 to reveal their contact details and yours will be shared with them.</div>
        </div>
      )}
    </Modal>
  );
}

// ── POST LISTING MODAL ──────────────────────────────────────────────────────────
function PostListingModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ title: "", category: "", price: "", description: "", reason: "", location: "", contact: "", contactType: "phone" });
  const [step, setStep] = useState(1);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const valid1 = form.title && form.category && form.price && form.description;
  const valid2 = form.reason && form.location && form.contact;

  const submit = () => {
    onSubmit({
      ...form,
      price: parseInt(form.price),
      id: "l" + Date.now(),
      photos: ["📦"],
      status: "active",
      sellerId: "s_me",
      sellerAnon: "Seller #" + Math.floor(Math.random() * 9000 + 1000),
      unlocked: false,
      createdAt: Date.now(),
      views: 0,
      interestedCount: 0,
      lockedBuyerId: null,
      escrowActive: false,
    });
    onClose();
  };

  return (
    <Modal title={`Post an Ad — Step ${step} of 2`} onClose={onClose} footer={
      <div style={{ display: "flex", gap: 8, width: "100%" }}>
        {step === 2 && <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>}
        {step === 1 && <button className="btn btn-secondary" onClick={onClose}>Cancel</button>}
        <div style={{ flex: 1 }} />
        {step === 1 && <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!valid1}>Continue →</button>}
        {step === 2 && <button className="btn btn-primary" onClick={submit} disabled={!valid2}>Post for Free 🚀</button>}
      </div>
    }>
      {step === 1 && (
        <>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>It's free to post. You only pay KSh 250 when a real buyer locks in.</p>
          <FormField label="Item Name"><input className="input" placeholder="e.g. Samsung 55 inch TV" value={form.title} onChange={e => set("title", e.target.value)} /></FormField>
          <FormField label="Category">
            <select className="input" value={form.category} onChange={e => set("category", e.target.value)}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Price (KSh)"><input className="input" type="number" placeholder="e.g. 45000" value={form.price} onChange={e => set("price", e.target.value)} /></FormField>
          <FormField label="Detailed Description" hint="Be as descriptive as possible — condition, specs, accessories included">
            <textarea className="input" placeholder="Describe your item in detail..." value={form.description} onChange={e => set("description", e.target.value)} />
          </FormField>
          <FormField label="Photos" hint="Photo upload will be enabled in the full version">
            <div style={{ border: "2px dashed var(--border)", borderRadius: "var(--radius)", padding: "24px", textAlign: "center", color: "var(--text-dim)", fontSize: 14 }}>
              📷 Drag and drop photos here or click to browse
            </div>
          </FormField>
        </>
      )}
      {step === 2 && (
        <>
          <FormField label="Reason for Selling"><input className="input" placeholder="e.g. Upgrading to a newer model" value={form.reason} onChange={e => set("reason", e.target.value)} /></FormField>
          <FormField label="Collection Location" hint="Area/neighbourhood only — exact address shown only after unlock"><input className="input" placeholder="e.g. Westlands, Nairobi" value={form.location} onChange={e => set("location", e.target.value)} /></FormField>
          <FormField label="Your Contact Info" hint="🔒 This is private. Only shown to buyer after you pay KSh 250.">
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button className={`btn btn-sm ${form.contactType === "phone" ? "btn-primary" : "btn-secondary"}`} onClick={() => set("contactType","phone")}>📞 Phone</button>
              <button className={`btn btn-sm ${form.contactType === "whatsapp" ? "btn-primary" : "btn-secondary"}`} onClick={() => set("contactType","whatsapp")}>💬 WhatsApp</button>
            </div>
            <input className="input" placeholder="07XXXXXXXX" value={form.contact} onChange={e => set("contact", e.target.value)} />
          </FormField>
          <div style={{ background: "rgba(0,200,83,0.06)", border: "1px solid rgba(0,200,83,0.15)", borderRadius: "var(--radius-sm)", padding: "12px 14px", fontSize: 12, color: "var(--text-muted)" }}>
            ✅ <strong style={{ color: "var(--text)" }}>Zero upfront cost.</strong> Your ad goes live immediately. You only pay KSh 250 when a buyer is confirmed and ready to purchase.
          </div>
        </>
      )}
    </Modal>
  );
}

// ── ESCROW MODAL ──────────────────────────────────────────────────────────────────
function EscrowModal({ listing, onClose, onConfirm }) {
  const fee = Math.round(listing.price * 0.075);
  const total = listing.price + fee;
  const [agreed, setAgreed] = useState(false);

  return (
    <Modal title="🔐 Escrow Service" onClose={onClose} footer={
      <>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-gold" onClick={onConfirm} disabled={!agreed}>Proceed to Payment</button>
      </>
    }>
      <div style={{ marginBottom: 20 }}>
        <div style={{ background: "rgba(255,214,0,0.06)", border: "1px solid rgba(255,214,0,0.2)", borderRadius: "var(--radius)", padding: "20px" }}>
          <div className="label" style={{ marginBottom: 12 }}>Escrow Breakdown</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
            <span style={{ color: "var(--text-muted)" }}>Item Price</span>
            <span>{formatKES(listing.price)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
            <span style={{ color: "var(--text-muted)" }}>Weka Soko Escrow Fee (7.5%)</span>
            <span style={{ color: "var(--accent-warm)" }}>+{formatKES(fee)}</span>
          </div>
          <div className="divider" style={{ margin: "12px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 18 }}>
            <span>Total to Pay</span>
            <span style={{ color: "var(--accent-warm)", fontFamily: "Syne" }}>{formatKES(total)}</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="label" style={{ marginBottom: 10 }}>How Escrow Works</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            ["1", "You pay the full amount into Weka Soko's secure escrow hold"],
            ["2", "Seller ships/hands over the item to you"],
            ["3", "You have 48 hours to confirm the item is as described"],
            ["4", "Funds are automatically released to seller after 48hrs, or earlier if you confirm"],
            ["5", "Raise a dispute within 48hrs if item is not as advertised — we investigate"],
          ].map(([n, t]) => (
            <div key={n} style={{ display: "flex", gap: 10, fontSize: 13 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,214,0,0.15)", color: "var(--accent-warm)", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{n}</div>
              <span style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <label style={{ display: "flex", gap: 10, cursor: "pointer", alignItems: "flex-start" }}>
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2 }} />
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>I understand and agree to the Weka Soko escrow terms. I will honestly report the item's condition after receiving it.</span>
      </label>
    </Modal>
  );
}

// ── AUTH MODAL ──────────────────────────────────────────────────────────────────
function AuthModal({ mode: initMode, onClose, onAuth }) {
  const [mode, setMode] = useState(initMode || "login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "buyer" });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = () => {
    onAuth({ id: "u_" + Date.now(), name: form.name || form.email.split("@")[0], email: form.email, role: form.role });
    onClose();
  };

  return (
    <Modal title={mode === "login" ? "Sign In to Weka Soko" : "Create Account"} onClose={onClose} footer={
      <>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={!form.email || !form.password}>{mode === "login" ? "Sign In" : "Create Account"}</button>
      </>
    }>
      {mode === "signup" && (
        <>
          <FormField label="Full Name"><input className="input" placeholder="Your name" value={form.name} onChange={e => set("name", e.target.value)} /></FormField>
          <FormField label="I am a">
            <div style={{ display: "flex", gap: 8 }}>
              <button className={`btn btn-sm ${form.role === "buyer" ? "btn-primary" : "btn-secondary"}`} style={{ flex: 1 }} onClick={() => set("role", "buyer")}>🛍 Buyer</button>
              <button className={`btn btn-sm ${form.role === "seller" ? "btn-primary" : "btn-secondary"}`} style={{ flex: 1 }} onClick={() => set("role", "seller")}>🏷 Seller</button>
            </div>
          </FormField>
        </>
      )}
      <FormField label="Email"><input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => set("email", e.target.value)} /></FormField>
      <FormField label="Password"><input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => set("password", e.target.value)} /></FormField>
      <div style={{ textAlign: "center", marginTop: 8, fontSize: 13, color: "var(--text-muted)" }}>
        {mode === "login" ? "No account? " : "Already have one? "}
        <button className="btn btn-ghost btn-sm" style={{ display: "inline", padding: "0 4px", color: "var(--accent)" }} onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Create one" : "Sign in"}
        </button>
      </div>
    </Modal>
  );
}

// ── ADMIN PANEL ──────────────────────────────────────────────────────────────────
function AdminPanel({ listings, setListings, showToast, onClose }) {
  const [tab, setTab] = useState("overview");
  const flagged = [
    { id: "f1", user: "Buyer #3821", reason: "Attempted to share phone number", offense: 2, listing: "Samsung TV" },
    { id: "f2", user: "Seller #1122", reason: "Shared WhatsApp link via symbol tricks", offense: 1, listing: "Trek Bike" },
  ];
  const escrows = listings.filter(l => l.escrowActive);
  const totalRevenue = listings.filter(l => l.unlocked).length * 250;

  const releaseEscrow = (id) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, escrowActive: false, status: "sold" } : l));
    showToast("✅ Escrow released to seller.", "success");
  };

  return (
    <Modal title="⚙️ Admin Dashboard" onClose={onClose}>
      <div className="tabs" style={{ marginBottom: 20 }}>
        {["overview", "flags", "escrow", "listings"].map(t => (
          <div key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)} style={{ textTransform: "capitalize" }}>{t}</div>
        ))}
      </div>

      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--accent)" }}>{listings.filter(l => l.status === "active").length}</div>
            <div className="stat-label">Active Listings</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--accent-warm)" }}>KSh {totalRevenue.toLocaleString()}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{listings.filter(l => l.lockedBuyerId).length}</div>
            <div className="stat-label">Pending Unlocks</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--accent-red)" }}>{flagged.length}</div>
            <div className="stat-label">Flagged Accounts</div>
          </div>
        </div>
      )}

      {tab === "flags" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {flagged.map(f => (
            <div key={f.id} style={{ background: "var(--surface-high)", border: "1px solid rgba(255,61,61,0.2)", borderRadius: "var(--radius-sm)", padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <strong style={{ fontSize: 14 }}>{f.user}</strong>
                <span className={`badge ${f.offense >= 2 ? "badge-red" : "badge-gold"}`}>{f.offense} offense{f.offense > 1 ? "s" : ""}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>{f.reason} · Listing: {f.listing}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-sm btn-danger" onClick={() => showToast("Account suspended.", "success")}>Suspend</button>
                <button className="btn btn-sm btn-secondary" onClick={() => showToast("Warning sent.", "info")}>Warn</button>
                <button className="btn btn-sm btn-ghost" onClick={() => showToast("Dismissed.", "info")}>Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "escrow" && (
        <div>
          {escrows.length === 0 && <div className="empty-state"><div className="empty-state-icon">🔐</div><div className="empty-state-title">No active escrows</div></div>}
          {escrows.map(l => (
            <div key={l.id} style={{ background: "var(--surface-high)", borderRadius: "var(--radius-sm)", padding: "14px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <strong>{l.title}</strong>
                <span style={{ color: "var(--accent-warm)", fontWeight: 700, fontFamily: "Syne" }}>{formatKES(Math.round(l.price * 1.075))}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>Including 7.5% escrow fee</div>
              <button className="btn btn-sm btn-gold" onClick={() => releaseEscrow(l.id)}>⚡ Force Release Funds</button>
            </div>
          ))}
        </div>
      )}

      {tab === "listings" && (
        <div>
          {listings.map(l => (
            <div key={l.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{l.title}</div>
                <div style={{ color: "var(--text-muted)", fontSize: 11 }}>{l.sellerAnon} · {formatKES(l.price)}</div>
              </div>
              <span className={`badge ${l.status === "active" ? "badge-green" : "badge-red"}`}>{l.status}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ── SELLER DASHBOARD ──────────────────────────────────────────────────────────────
function SellerDashboard({ listings, currentUser, onPostNew, onViewListing, showToast }) {
  const myListings = listings.filter(l => l.sellerId === "s_me" || l.sellerId === currentUser?.id);
  const lockedCount = myListings.filter(l => l.lockedBuyerId && !l.unlocked).length;
  const totalViews = myListings.reduce((a, l) => a + l.views, 0);
  const totalRevenue = myListings.filter(l => l.unlocked).length * 250;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800 }}>My Dashboard</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>Hello, {currentUser?.name || "Seller"} 👋</p>
        </div>
        <button className="btn btn-primary" onClick={onPostNew}>+ Post New Ad</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
        <div className="stat-card"><div className="stat-value">{myListings.length}</div><div className="stat-label">Total Ads</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: "var(--accent-red)" }}>{lockedCount}</div><div className="stat-label">Pending Unlocks</div></div>
        <div className="stat-card"><div className="stat-value">{totalViews}</div><div className="stat-label">Total Views</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: "var(--accent-warm)" }}>KSh {totalRevenue.toLocaleString()}</div><div className="stat-label">Spent on Unlocks</div></div>
      </div>

      {lockedCount > 0 && (
        <div style={{ background: "rgba(255,214,0,0.08)", border: "1px solid rgba(255,214,0,0.25)", borderRadius: "var(--radius)", padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>🔥</span>
          <div>
            <div style={{ fontWeight: 700, color: "var(--accent-warm)" }}>You have {lockedCount} buyer{lockedCount > 1 ? "s" : ""} locked in!</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Pay KSh 250 per ad to reveal contact details and close the deal.</div>
          </div>
        </div>
      )}

      {myListings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-title">No ads posted yet</div>
          <p style={{ color: "var(--text-muted)", marginBottom: 20, fontSize: 14 }}>Post your first ad for free — you only pay when a buyer locks in.</p>
          <button className="btn btn-primary" onClick={onPostNew}>Post Your First Ad</button>
        </div>
      ) : (
        <div className="grid-3">
          {myListings.map(l => <ListingCard key={l.id} listing={l} onClick={() => onViewListing(l)} />)}
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────────
export default function WekaSoko() {
  const [page, setPage] = useState("home"); // home | dashboard | admin
  const [listings, setListings] = useState(DEMO_LISTINGS);
  const [chats, setChats] = useState(DEMO_CHATS);
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState({ category: "All", search: "" });

  // Modals
  const [selectedListing, setSelectedListing] = useState(null);
  const [chatListing, setChatListing] = useState(null);
  const [showPost, setShowPost] = useState(false);
  const [showAuth, setShowAuth] = useState(null);
  const [showMpesa, setShowMpesa] = useState(null); // { amount, purpose, onSuccess }
  const [showEscrow, setShowEscrow] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);

  const showToast = useCallback((msg, type = "info") => {
    setToast({ msg, type, id: Date.now() });
  }, []);

  const filtered = listings.filter(l => {
    const matchCat = filter.category === "All" || l.category === filter.category;
    const matchSearch = !filter.search || l.title.toLowerCase().includes(filter.search.toLowerCase()) || l.location.toLowerCase().includes(filter.search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleLockIn = (listing) => {
    setListings(prev => prev.map(l => l.id === listing.id ? { ...l, lockedBuyerId: currentUser?.id || "guest", interestedCount: l.interestedCount + 1 } : l));
    setChatListing(null);
    showToast("🔒 Locked in! The seller has been notified.", "success");
  };

  const handleUnlock = (listing) => {
    setShowMpesa({
      amount: 250,
      purpose: `Unlock contact for: ${listing.title}`,
      onSuccess: () => {
        setListings(prev => prev.map(l => l.id === listing.id ? { ...l, unlocked: true } : l));
        setSelectedListing(prev => prev ? { ...prev, unlocked: true } : prev);
        showToast("🔓 Contact details revealed! Both parties can now connect.", "success");
        setShowMpesa(null);
      }
    });
  };

  const handlePostListing = (listing) => {
    setListings(prev => [listing, ...prev]);
    showToast("🚀 Your ad is live! You'll be notified when a buyer locks in.", "success");
  };

  const handleEscrowConfirm = () => {
    if (showEscrow) {
      const listing = showEscrow;
      setShowEscrow(null);
      setShowMpesa({
        amount: Math.round(listing.price * 1.075),
        purpose: `Escrow for: ${listing.title}`,
        onSuccess: () => {
          setListings(prev => prev.map(l => l.id === listing.id ? { ...l, escrowActive: true } : l));
          showToast("🔐 Escrow activated! Funds held securely.", "success");
          setShowMpesa(null);
        }
      });
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="grain" />

      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo" onClick={() => setPage("home")} style={{ cursor: "pointer" }}>
          Weka<span>Soko</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {currentUser?.role === "seller" && (
            <button className="btn btn-ghost btn-sm" onClick={() => setPage("dashboard")}>Dashboard</button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => setShowAdmin(true)}>⚙️ Admin</button>
          {currentUser ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{currentUser.name}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => { setCurrentUser(null); setPage("home"); }}>Sign Out</button>
            </div>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAuth("login")}>Sign In</button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAuth("signup")}>Sign Up</button>
            </>
          )}
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {page === "home" && (
          <>
            {/* HERO */}
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 20, marginBottom: 28 }}>
                <div style={{ maxWidth: 520 }}>
                  <div className="badge badge-green" style={{ marginBottom: 14, fontSize: 11 }}>🇰🇪 Kenya's Smartest Resell Platform</div>
                  <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 16 }}>
                    Post Free.<br /><span style={{ color: "var(--accent)" }}>Pay Only When</span><br />You Get a Buyer.
                  </h1>
                  <p style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 24 }}>
                    List your items for free. Your contact is hidden until a real buyer locks in and you pay KSh 250 — once. No monthly fees, no wasted listings.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button className="btn btn-primary btn-lg" onClick={() => currentUser ? setShowPost(true) : setShowAuth("signup")}>
                      Post an Ad for Free →
                    </button>
                    <button className="btn btn-secondary btn-lg" onClick={() => document.getElementById("listings-section")?.scrollIntoView({ behavior: "smooth" })}>
                      Browse Listings
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, flex: "0 0 auto", width: "min(340px, 100%)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                  {[
                    ["🆓", "Free to Post", "Zero upfront cost"],
                    ["🔒", "Pay on Interest", "KSh 250 when locked in"],
                    ["🤖", "Chat Moderated", "Safe & anonymous until paid"],
                    ["🔐", "Escrow Option", "7.5% for secure transactions"],
                  ].map(([icon, title, sub]) => (
                    <div key={title} style={{ background: "var(--surface-high)", padding: "18px 16px" }}>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "Syne, sans-serif", marginBottom: 2 }}>{title}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SEARCH & FILTER */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", padding: "16px 20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
                <input
                  className="input"
                  style={{ flex: 1, minWidth: 200 }}
                  placeholder="🔍 Search listings..."
                  value={filter.search}
                  onChange={e => setFilter(p => ({ ...p, search: e.target.value }))}
                />
                <div className="chip-group">
                  {["All", ...CATEGORIES.slice(0,5)].map(c => (
                    <div key={c} className={`chip ${filter.category === c ? "active" : ""}`} onClick={() => setFilter(p => ({ ...p, category: c }))}>{c}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* LISTINGS */}
            <div id="listings-section">
              <div className="section-header">
                <h2 className="section-title">Latest Listings <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: 16 }}>({filtered.length})</span></h2>
                <button className="btn btn-primary btn-sm" onClick={() => currentUser ? setShowPost(true) : setShowAuth("signup")}>+ Post Ad</button>
              </div>
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <div className="empty-state-title">No listings found</div>
                  <p style={{ color: "var(--text-muted)" }}>Try a different search or category.</p>
                </div>
              ) : (
                <div className="grid-3">
                  {filtered.map(l => (
                    <ListingCard key={l.id} listing={l} onClick={() => setSelectedListing(l)} />
                  ))}
                </div>
              )}
            </div>

            {/* HOW IT WORKS */}
            <div style={{ marginTop: 60, padding: "40px 0", borderTop: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, textAlign: "center", marginBottom: 32 }}>How Weka Soko Works</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                {[
                  ["📝", "Post for Free", "List your item with photos, description, price, and location. No fees."],
                  ["💬", "Buyers Chat", "Interested buyers chat with you anonymously through our moderated platform."],
                  ["🔒", "Buyer Locks In", "A serious buyer clicks 'Ready to Buy' to lock in. You get notified."],
                  ["💳", "Pay KSh 250", "Pay once to reveal each other's contact details and close the deal."],
                ].map(([icon, title, desc]) => (
                  <div key={title} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px" }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
                    <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, marginBottom: 6 }}>{title}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {page === "dashboard" && (
          <SellerDashboard
            listings={listings}
            currentUser={currentUser}
            onPostNew={() => setShowPost(true)}
            onViewListing={l => setSelectedListing(l)}
            showToast={showToast}
          />
        )}
      </main>

      {/* MODALS */}
      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          currentUser={currentUser}
          onClose={() => setSelectedListing(null)}
          onChat={() => { setSelectedListing(null); setChatListing(selectedListing); }}
          onUnlock={() => handleUnlock(selectedListing)}
          onEscrow={() => { setSelectedListing(null); setShowEscrow(selectedListing); }}
        />
      )}

      {chatListing && (
        <ChatModal
          listing={chatListing}
          currentUser={currentUser}
          onClose={() => setChatListing(null)}
          onLockIn={() => handleLockIn(chatListing)}
          chats={chats}
          setChats={setChats}
          showToast={showToast}
        />
      )}

      {showPost && <PostListingModal onClose={() => setShowPost(false)} onSubmit={handlePostListing} />}

      {showAuth && <AuthModal mode={showAuth} onClose={() => setShowAuth(null)} onAuth={user => { setCurrentUser(user); showToast(`Welcome, ${user.name}! 👋`, "success"); }} />}

      {showMpesa && <MpesaPaymentModal amount={showMpesa.amount} purpose={showMpesa.purpose} onSuccess={showMpesa.onSuccess} onClose={() => setShowMpesa(null)} />}

      {showEscrow && <EscrowModal listing={showEscrow} onClose={() => setShowEscrow(null)} onConfirm={handleEscrowConfirm} />}

      {showAdmin && <AdminPanel listings={listings} setListings={setListings} showToast={showToast} onClose={() => setShowAdmin(false)} />}

      {toast && <Toast key={toast.id} message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
