import { useState, useEffect, useCallback } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =============================================
// CONFIGURATION - Supabase 연결 정보 입력 필요
// =============================================
const SUPABASE_URL = "https://agjwbhsrjhdhegtkoffy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnandiaHNyamhkaGVndGtvZmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDg5NzAsImV4cCI6MjA5MjM4NDk3MH0._wEMNazSLVebZblCLXLw1yEc8Exr0nYu3y4Rj7WMmc8";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =============================================
// 한국 공휴일 (2024-2026)
// =============================================
const HOLIDAYS = new Set([
  "2025-01-01","2025-01-28","2025-01-29","2025-01-30",
  "2025-03-01","2025-05-05","2025-05-06","2025-06-06",
  "2025-08-15","2025-10-03","2025-10-06","2025-10-07","2025-10-08","2025-10-09",
  "2025-12-25",
  "2026-01-01","2026-01-28","2026-01-29","2026-01-30",
  "2026-03-01","2026-05-05","2026-06-06",
  "2026-08-17","2026-09-24","2026-09-25","2026-09-26",
  "2026-10-03","2026-10-09","2026-12-25",
]);

function isBusinessDay(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=일, 6=토
  const str = d.toISOString().split("T")[0];
  return day !== 0 && !HOLIDAYS.has(str); // 월~토, 공휴일 제외
}

function addBusinessDays(dateStr, days) {
  let d = new Date(dateStr);
  let count = 0;
  while (count < days) {
    d.setDate(d.getDate() + 1);
    if (isBusinessDay(d)) count++;
  }
  return d.toISOString().split("T")[0];
}

function subtractBusinessDays(dateStr, days) {
  let d = new Date(dateStr);
  let count = 0;
  while (count < days) {
    d.setDate(d.getDate() - 1);
    if (isBusinessDay(d)) count++;
  }
  return d.toISOString().split("T")[0];
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function isToday(dateStr) {
  return dateStr === today();
}

function isTodayOrPast(dateStr) {
  return dateStr && dateStr <= today();
}

// =============================================
// STYLES
// =============================================
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: #1a1a2e;
    --ink-light: #4a4a6a;
    --ink-muted: #9090b0;
    --cream: #faf9f6;
    --surface: #ffffff;
    --surface2: #f4f3ef;
    --border: #e8e6e0;
    --accent: #2d6a4f;
    --accent-light: #52b788;
    --accent-pale: #d8f3dc;
    --warn: #e07a5f;
    --warn-pale: #fdecea;
    --info: #3d7ebf;
    --info-pale: #deeaf8;
    --gold: #c9a94e;
    --shadow-sm: 0 1px 3px rgba(26,26,46,0.08);
    --shadow-md: 0 4px 16px rgba(26,26,46,0.10);
    --shadow-lg: 0 8px 32px rgba(26,26,46,0.13);
    --r: 12px;
    --r-sm: 8px;
  }

  body { font-family: 'Noto Sans KR', sans-serif; background: var(--cream); color: var(--ink); }

  .app { min-height: 100vh; }

  /* LOGIN */
  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--ink); }
  .login-card { background: var(--surface); border-radius: 20px; padding: 48px 40px; width: 100%; max-width: 400px; box-shadow: var(--shadow-lg); }
  .login-logo { font-family: 'DM Serif Display', serif; font-size: 28px; color: var(--accent); margin-bottom: 6px; }
  .login-sub { color: var(--ink-muted); font-size: 13px; margin-bottom: 32px; }
  .login-card input { width: 100%; padding: 12px 16px; border: 1.5px solid var(--border); border-radius: var(--r-sm); font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.2s; margin-bottom: 12px; }
  .login-card input:focus { border-color: var(--accent); }
  .btn-login { width: 100%; padding: 13px; background: var(--accent); color: #fff; border: none; border-radius: var(--r-sm); font-size: 15px; font-weight: 600; font-family: inherit; cursor: pointer; transition: background 0.2s; }
  .btn-login:hover { background: #235c42; }
  .login-err { color: var(--warn); font-size: 13px; margin-top: 8px; }

  /* LAYOUT */
  .layout { display: flex; min-height: 100vh; }
  .sidebar { width: 220px; background: var(--ink); color: #fff; padding: 24px 0; display: flex; flex-direction: column; position: fixed; top: 0; left: 0; height: 100vh; z-index: 100; }
  .sidebar-logo { font-family: 'DM Serif Display', serif; font-size: 20px; color: var(--accent-light); padding: 0 24px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .sidebar-logo span { display: block; font-family: 'Noto Sans KR', sans-serif; font-size: 10px; color: rgba(255,255,255,0.4); font-weight: 300; margin-top: 2px; }
  .sidebar-nav { flex: 1; padding: 16px 0; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 24px; font-size: 13px; cursor: pointer; color: rgba(255,255,255,0.6); transition: all 0.2s; border-left: 3px solid transparent; }
  .nav-item:hover { color: #fff; background: rgba(255,255,255,0.05); }
  .nav-item.active { color: var(--accent-light); border-left-color: var(--accent-light); background: rgba(82,183,136,0.08); }
  .sidebar-bottom { padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.08); }
  .sidebar-user { font-size: 12px; color: rgba(255,255,255,0.5); }
  .sidebar-user strong { display: block; color: rgba(255,255,255,0.85); font-size: 13px; margin-bottom: 2px; }
  .btn-logout { margin-top: 10px; background: transparent; border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.5); font-size: 12px; font-family: inherit; padding: 6px 12px; border-radius: 6px; cursor: pointer; width: 100%; transition: all 0.2s; }
  .btn-logout:hover { border-color: var(--warn); color: var(--warn); }

  .main { margin-left: 220px; flex: 1; padding: 32px; max-width: 1100px; }

  /* HEADER */
  .page-header { margin-bottom: 28px; }
  .page-title { font-family: 'DM Serif Display', serif; font-size: 26px; color: var(--ink); }
  .page-sub { color: var(--ink-muted); font-size: 13px; margin-top: 4px; }

  /* CARDS */
  .card { background: var(--surface); border-radius: var(--r); padding: 24px; box-shadow: var(--shadow-sm); border: 1px solid var(--border); }
  .card + .card { margin-top: 16px; }

  /* PATIENT LIST */
  .toolbar { display: flex; gap: 12px; margin-bottom: 20px; align-items: center; }
  .search-input { flex: 1; padding: 10px 16px; border: 1.5px solid var(--border); border-radius: var(--r-sm); font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.2s; background: var(--surface); }
  .search-input:focus { border-color: var(--accent); }
  .btn { padding: 10px 18px; border-radius: var(--r-sm); font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; border: none; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }
  .btn-primary { background: var(--accent); color: #fff; }
  .btn-primary:hover { background: #235c42; }
  .btn-secondary { background: var(--surface2); color: var(--ink-light); border: 1px solid var(--border); }
  .btn-secondary:hover { background: var(--border); }
  .btn-danger { background: var(--warn-pale); color: var(--warn); border: 1px solid #f5c6bd; }
  .btn-danger:hover { background: var(--warn); color: #fff; }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .btn-xs { padding: 4px 8px; font-size: 11px; border-radius: 5px; }

  .patient-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
  .patient-card { background: var(--surface); border-radius: var(--r); padding: 20px; border: 1.5px solid var(--border); cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden; }
  .patient-card:hover { border-color: var(--accent-light); box-shadow: var(--shadow-md); transform: translateY(-2px); }
  .patient-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
  .patient-name { font-size: 17px; font-weight: 600; }
  .patient-chart { font-size: 11px; color: var(--ink-muted); margin-top: 2px; }
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-warn { background: var(--warn-pale); color: var(--warn); }
  .badge-info { background: var(--info-pale); color: var(--info); }
  .badge-success { background: var(--accent-pale); color: var(--accent); }
  .badge-gold { background: #fef9ec; color: var(--gold); }
  .badge-muted { background: var(--surface2); color: var(--ink-muted); }

  .progress-bar { background: var(--surface2); border-radius: 20px; height: 6px; margin: 10px 0 6px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 20px; background: linear-gradient(90deg, var(--accent-light), var(--accent)); transition: width 0.5s; }
  .progress-label { display: flex; justify-content: space-between; font-size: 11px; color: var(--ink-muted); }
  .alert-dots { display: flex; gap: 6px; margin-top: 12px; flex-wrap: wrap; }

  /* TABS */
  .tabs { display: flex; gap: 4px; border-bottom: 2px solid var(--border); margin-bottom: 24px; }
  .tab { padding: 10px 18px; font-size: 13px; font-weight: 500; font-family: inherit; background: none; border: none; cursor: pointer; color: var(--ink-muted); border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s; }
  .tab.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }
  .tab:hover:not(.active) { color: var(--ink); }

  /* FORMS */
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  .form-full { grid-column: 1 / -1; }
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-label { font-size: 12px; font-weight: 600; color: var(--ink-light); }
  .form-input { padding: 10px 12px; border: 1.5px solid var(--border); border-radius: var(--r-sm); font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.2s; background: var(--surface); }
  .form-input:focus { border-color: var(--accent); }
  .form-select { padding: 10px 12px; border: 1.5px solid var(--border); border-radius: var(--r-sm); font-size: 14px; font-family: inherit; outline: none; background: var(--surface); cursor: pointer; }
  .form-select:focus { border-color: var(--accent); }
  .form-row { display: flex; gap: 10px; align-items: flex-end; }
  .form-actions { display: flex; gap: 10px; margin-top: 16px; justify-content: flex-end; }

  /* MODAL */
  .modal-overlay { position: fixed; inset: 0; background: rgba(26,26,46,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(2px); }
  .modal { background: var(--surface); border-radius: 16px; padding: 28px; width: 100%; max-width: 520px; box-shadow: var(--shadow-lg); max-height: 90vh; overflow-y: auto; }
  .modal-title { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
  .modal-lg { max-width: 680px; }

  /* PATIENT DETAIL */
  .back-btn { display: inline-flex; align-items: center; gap: 6px; color: var(--ink-muted); font-size: 13px; cursor: pointer; margin-bottom: 16px; background: none; border: none; font-family: inherit; }
  .back-btn:hover { color: var(--ink); }
  .patient-detail-header { background: var(--ink); color: #fff; border-radius: var(--r); padding: 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
  .detail-name { font-family: 'DM Serif Display', serif; font-size: 24px; }
  .detail-meta { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 4px; }
  .detail-badges { display: flex; gap: 8px; flex-wrap: wrap; }

  /* TABLE */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 700; color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid var(--border); }
  td { padding: 12px; border-bottom: 1px solid var(--border); color: var(--ink); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--surface2); }

  /* HAPPYCALL */
  .happycall-card { border-radius: var(--r-sm); padding: 14px 16px; margin-bottom: 10px; border: 1.5px solid; }
  .happycall-arrival { border-color: #b8d4f0; background: #f0f7ff; }
  .happycall-reservation { border-color: #f5c6bd; background: #fff5f3; }
  .happycall-done { border-color: var(--border); background: var(--surface2); opacity: 0.7; }
  .happycall-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .happycall-type { font-size: 12px; font-weight: 700; }
  .happycall-date { font-size: 13px; font-weight: 600; }

  /* CHART */
  .chart-wrap { position: relative; height: 200px; }
  svg.chart { width: 100%; height: 100%; }

  /* PACKAGE STATUS */
  .pkg-status { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
  .pkg-month { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
  .pkg-month-done { background: var(--accent); color: #fff; }
  .pkg-month-remaining { background: var(--surface2); color: var(--ink-muted); border: 2px dashed var(--border); }

  /* SECTION HEADER */
  .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .section-title { font-size: 15px; font-weight: 700; }

  /* EMPTY */
  .empty { text-align: center; padding: 40px; color: var(--ink-muted); font-size: 14px; }

  /* DIVIDER */
  .divider { height: 1px; background: var(--border); margin: 20px 0; }

  /* TREATMENT TAGS */
  .treatment-tag { display: inline-flex; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: var(--accent-pale); color: var(--accent); margin-right: 4px; }

  /* ALERT TODAY */
  .alert-today { background: var(--warn-pale); border: 1.5px solid #f5c6bd; border-radius: var(--r-sm); padding: 8px 12px; font-size: 12px; color: var(--warn); font-weight: 600; display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }

  /* REMAINING UPDATE */
  .remaining-input-row { display: flex; gap: 8px; align-items: center; margin-top: 8px; }
  .remaining-input-row input { width: 80px; padding: 6px 10px; border: 1.5px solid var(--border); border-radius: 6px; font-size: 13px; font-family: inherit; outline: none; }
  .remaining-input-row input:focus { border-color: var(--accent); }

  /* INBODY */
  .inbody-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border); }
  .inbody-label { font-size: 12px; color: var(--ink-muted); }
  .inbody-value { font-size: 14px; font-weight: 600; }

  /* RESPONSIVE */
  @media (max-width: 768px) {
    .sidebar { width: 100%; height: auto; position: relative; flex-direction: row; flex-wrap: wrap; padding: 12px 16px; }
    .sidebar-logo { padding: 0; border: none; font-size: 16px; }
    .sidebar-nav { display: flex; padding: 0; gap: 4px; }
    .nav-item { padding: 8px 12px; font-size: 12px; border-left: none; border-bottom: 2px solid transparent; }
    .nav-item.active { border-left-color: transparent; border-bottom-color: var(--accent-light); }
    .sidebar-bottom { display: none; }
    .main { margin-left: 0; padding: 16px; }
    .form-grid { grid-template-columns: 1fr; }
    .form-grid-3 { grid-template-columns: 1fr 1fr; }
    .patient-grid { grid-template-columns: 1fr; }
    .layout { flex-direction: column; }
  }
`;

// =============================================
// MINI CHART COMPONENT
// =============================================
function LineChart({ data, valueKey, color = "#52b788", label = "", showDiff = false }) {
  if (!data || data.length < 2) return <div className="empty" style={{height: 120}}>데이터가 부족합니다 (최소 2개)</div>;

  const values = data.map(d => d[valueKey]).filter(v => v != null);
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const w = 500, h = 180, padX = 40, padY = showDiff ? 36 : 20;

  const pts = data
    .filter(d => d[valueKey] != null)
    .map((d, i, arr) => {
      const x = padX + (i / (arr.length - 1)) * (w - padX * 2);
      const y = padY + ((max - d[valueKey]) / (max - min)) * (h - padY * 2);
      const prev = arr[i - 1];
      const diff = prev && prev[valueKey] != null
        ? (parseFloat(d[valueKey]) - parseFloat(prev[valueKey])).toFixed(1)
        : null;
      const diffPct = prev && prev[valueKey] != null
        ? ((parseFloat(d[valueKey]) - parseFloat(prev[valueKey])) / parseFloat(prev[valueKey]) * 100).toFixed(1)
        : null;
      return { x, y, d, diff, diffPct };
    });

  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length-1].x} ${h} L ${pts[0].x} ${h} Z`;

  return (
    <div className="chart-wrap" style={{height: showDiff ? 200 : 180}}>
      <svg className="chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`g-${valueKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#g-${valueKey})`}/>
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill={color} stroke="#fff" strokeWidth="2"/>
            <text x={p.x} y={h - 4} textAnchor="middle" fontSize="9" fill="#9090b0">
              {formatDate(p.d.measured_at || p.d.date).slice(5)}
            </text>
            <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="10" fontWeight="600" fill={color}>
              {p.d[valueKey]}
            </text>
            {showDiff && p.diff !== null && (
              <text x={p.x} y={p.y - 20} textAnchor="middle" fontSize="9" fill={parseFloat(p.diff) < 0 ? "#2d6a4f" : "#e07a5f"}>
                {parseFloat(p.diff) > 0 ? "+" : ""}{p.diff}kg ({parseFloat(p.diffPct) > 0 ? "+" : ""}{p.diffPct}%)
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

// =============================================
// LOGIN PAGE
// =============================================
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true); setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) setErr("이메일 또는 비밀번호가 올바르지 않습니다.");
    setLoading(false);
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">韓醫 Diet</div>
        <div className="login-sub">한의원 다이어트 환자 관리 시스템</div>
        <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
        <input type="password" placeholder="비밀번호" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
        {err && <div className="login-err">{err}</div>}
        <button className="btn-login" style={{marginTop: 8}} onClick={handleLogin} disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </div>
    </div>
  );
}

// =============================================
// PATIENT LIST PAGE
// =============================================
function PatientListPage({ onSelectPatient, currentUser }) {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState({});

  const loadPatients = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("patients").select("*, goals(*), packages(*), measurements(*)").order("registered_at", { ascending: false });
    const { data: allPrescriptions } = await supabase.from("prescriptions").select("id, patient_id, duration_days, is_completed").order("prescribed_at");
    const patientList = data || [];

    // 해피콜 알림 확인 (happycall_logs 포함)
    const { data: prescriptions } = await supabase.from("prescriptions")
      .select("*, prescription_updates(*), happycall_logs(*)")
      .eq("is_completed", false);

    // 프리미엄 관리 방문 데이터
    const { data: allVisits } = await supabase.from("visits").select("patient_id, visited_at, treatment_types").order("visited_at", { ascending: false });

    const alertMap = {};
    const premiumAlertSet = new Set();

    (prescriptions || []).forEach(p => {
      const latestUpdate = p.prescription_updates?.sort((a,b) => b.updated_at.localeCompare(a.updated_at))[0];
      const reservationDate = latestUpdate ? latestUpdate.new_reservation_happycall_date : p.reservation_happycall_date;
      const arrivalDate = p.arrival_happycall_date;
      const type = p.medicine_type;
      const arrivalDone = p.happycall_logs?.find(h => h.call_type === "arrival" && h.is_done);
      const reservationDone = p.happycall_logs?.find(h => h.call_type === "reservation" && h.is_done);
      if (!alertMap[p.patient_id]) alertMap[p.patient_id] = [];
      if (isTodayOrPast(arrivalDate) && !arrivalDone) alertMap[p.patient_id].push({ kind: "도착", type });
      if (isTodayOrPast(reservationDate) && !reservationDone) alertMap[p.patient_id].push({ kind: "예약", type });
    });

    // 프리미엄 관리 13일 초과 체크
    const premiumByPatient = {};
    (allVisits || []).forEach(v => {
      if ((v.treatment_types || []).includes("premium")) {
        if (!premiumByPatient[v.patient_id] || v.visited_at > premiumByPatient[v.patient_id]) {
          premiumByPatient[v.patient_id] = v.visited_at;
        }
      }
    });
    Object.entries(premiumByPatient).forEach(([pid, lastDate]) => {
      const diff = Math.floor((new Date(today()) - new Date(lastDate)) / (1000*60*60*24));
      if (diff > 13) premiumAlertSet.add(pid);
    });

    setAlerts(alertMap);

    // 정렬: 해피콜 대상자 → 프리미엄 알림 → 나머지
    const sorted = [...patientList].sort((a, b) => {
      const aScore = (alertMap[a.id] || []).length > 0 ? 0 : premiumAlertSet.has(a.id) ? 1 : 2;
      const bScore = (alertMap[b.id] || []).length > 0 ? 0 : premiumAlertSet.has(b.id) ? 1 : 2;
      return aScore - bScore;
    });

    // 실제 잔여 기간 계산 (처방 기반)
    const rxByPatient = {};
    (allPrescriptions || []).forEach(rx => {
      if (!rxByPatient[rx.patient_id]) rxByPatient[rx.patient_id] = [];
      rxByPatient[rx.patient_id].push(rx);
    });

    setPatients(sorted.map(p => {
      const patientPkgs = (p.packages || []).filter(pk => pk.is_active);
      const patientRxs = rxByPatient[p.id] || [];
      const patientHCs = (prescriptions || []).filter(pr => pr.patient_id === p.id);
      let realRemainingMonths = null;
      if (patientPkgs.length > 0) {
        const totalDays = patientPkgs.reduce((s, pk) => s + Number(pk.package_months) * 30, 0);
        const usedDays = patientRxs.reduce((sum, rx) => {
          const hcs = patientHCs.find(pr => pr.id === rx.id)?.happycall_logs || [];
          const resDone = hcs.find(h => h.call_type === "reservation" && h.is_done);
          if (resDone || rx.is_completed) return sum + (rx.duration_days || 0);
          return sum;
        }, 0);
        const remainingDays = Math.max(0, totalDays - usedDays);
        realRemainingMonths = Math.round(remainingDays / 30 * 10) / 10;
      }
      return { ...p, _premiumAlert: premiumAlertSet.has(p.id), _realRemainingMonths: realRemainingMonths };
    }));
    setLoading(false);
  }, []);

  useEffect(() => { loadPatients(); }, [loadPatients]);

  const filtered = patients.filter(p =>
    p.name.includes(search) || p.chart_number.includes(search)
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-title">환자 목록</div>
        <div className="page-sub">총 {patients.length}명의 환자가 등록되어 있습니다</div>
      </div>
      <div className="toolbar">
        <input className="search-input" placeholder="이름 또는 차트번호 검색" value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 신규 환자 등록</button>
      </div>

      {loading ? <div className="empty">불러오는 중...</div> : (
        <div className="patient-grid">
          {filtered.map(p => {
            const goal = p.goals?.[0];
            const pkg = p.packages?.find(pk => pk.is_active);
            const measurements = p.measurements || [];
            const latestWeight = measurements.sort((a,b) => b.measured_at.localeCompare(a.measured_at))[0]?.weight;
            const progress = goal && latestWeight
              ? Math.max(0, Math.min(100, Math.round((goal.target_weight - latestWeight) / (goal.target_weight - (measurements[measurements.length-1]?.weight || latestWeight)) * 100)))
              : null;
            const todayAlerts = alerts[p.id] || [];

            return (
              <div key={p.id} className="patient-card" onClick={() => onSelectPatient(p)}>
                <div className="patient-card-header">
                  <div>
                    <div className="patient-name">
                      {p.name}
                      {p.goals?.[0]?.constitution && (
                        <span style={{fontSize:13, fontWeight:500, color:"var(--info)", marginLeft:6}}>({p.goals[0].constitution})</span>
                      )}
                    </div>
                    <div className="patient-chart">차트 #{p.chart_number}</div>
                  </div>
                  <div style={{display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end"}}>
                    {todayAlerts.map((a, i) => (
                      <span key={i} className={`badge ${
                        a.type === "tang"
                          ? (a.kind === "도착" ? "badge-gold" : "badge-warn")
                          : (a.kind === "도착" ? "badge-info" : "badge-success")
                      }`}>
                        {a.kind === "도착" ? "📦" : "📅"} {a.type === "tang" ? "탕약" : "환약"} {a.kind} 해피콜
                      </span>
                    ))}
                    {p._premiumAlert && (
                      <span className="badge badge-warn">🏥 프리미엄 재내원 필요</span>
                    )}
                    <button className="btn btn-xs btn-danger" onClick={async e => {
                      e.stopPropagation();
                      if (!window.confirm(`${p.name} 환자를 삭제하시겠습니까?\n모든 데이터(처방, 측정값 등)가 함께 삭제됩니다.`)) return;
                      await supabase.from("patients").delete().eq("id", p.id);
                      loadPatients();
                    }}>삭제</button>
                  </div>
                </div>

                {goal && (
                  <div>
                    <div className="progress-label">
                      <span>목표: {goal.target_weight}kg</span>
                      <span>현재: {latestWeight ? `${latestWeight}kg` : "-"}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width: `${progress || 0}%`}}/>
                    </div>
                  </div>
                )}

                {pkg && (
                  <div style={{marginTop: 8}}>
                    <span className="badge badge-gold">
                      {pkg.package_months}개월 패키지 · 잔여 약 {p._realRemainingMonths != null ? p._realRemainingMonths : pkg.remaining_months}개월
                    </span>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && <div className="empty">등록된 환자가 없습니다</div>}
        </div>
      )}

      {showModal && <NewPatientModal onClose={() => { setShowModal(false); loadPatients(); }} />}
    </div>
  );
}

// =============================================
// NEW PATIENT MODAL
// =============================================
function NewPatientModal({ onClose }) {
  const [form, setForm] = useState({ chart_number: "", name: "", gender: "female", birth_date: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async () => {
    if (!form.chart_number || !form.name) { setErr("차트번호와 이름은 필수입니다."); return; }
    setLoading(true);
    const { error } = await supabase.from("patients").insert([form]);
    if (error) { setErr(error.message); setLoading(false); return; }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">신규 환자 등록</div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">차트번호 *</label>
            <input className="form-input" value={form.chart_number} onChange={e => setForm({...form, chart_number: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">이름 *</label>
            <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">성별</label>
            <select className="form-select" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
              <option value="female">여성</option>
              <option value="male">남성</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">생년월일</label>
            <input className="form-input" type="date" value={form.birth_date} onChange={e => setForm({...form, birth_date: e.target.value})} />
          </div>
          <div className="form-group form-full">
            <label className="form-label">연락처</label>
            <input className="form-input" placeholder="010-0000-0000" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
        </div>
        {err && <div style={{color: "var(--warn)", fontSize: 13, marginTop: 8}}>{err}</div>}
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>등록</button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// PATIENT DETAIL PAGE
// =============================================
function PatientDetailPage({ patient, onBack, currentUser }) {
  const [tab, setTab] = useState("measurement");
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    setGenerating(true);
    try {
      // 모든 데이터 불러오기
      const [{ data: measurements }, { data: goals }, { data: inbodyRecords }] = await Promise.all([
        supabase.from("measurements").select("*").eq("patient_id", patient.id).order("measured_at"),
        supabase.from("goals").select("*").eq("patient_id", patient.id).order("created_at", { ascending: false }).limit(1),
        supabase.from("inbody_records").select("*").eq("patient_id", patient.id).order("measured_at"),
      ]);

      const goal = goals?.[0];
      const ms = measurements || [];
      const ib = inbodyRecords || [];
      const latestWeight = ms[ms.length-1]?.weight;
      const startWeight = ms[0]?.weight;
      const lost = startWeight && latestWeight ? (startWeight - latestWeight).toFixed(1) : null;

      // SVG 그래프 생성 함수
      const makeSVG = (data, valueKey, color, label, unit, showPctChange = false) => {
        if (!data || data.length < 2) return `<div style="color:#9090b0;font-size:12px;padding:20px 0">데이터가 부족합니다 (최소 2개)</div>`;
        const values = data.map(d => parseFloat(d[valueKey])).filter(v => !isNaN(v));
        if (values.length < 2) return `<div style="color:#9090b0;font-size:12px;padding:20px 0">데이터가 부족합니다</div>`;
        const min = Math.min(...values) - 1;
        const max = Math.max(...values) + 1;
        const w = 500, h = 160, padX = 50, padY = showPctChange ? 36 : 20;
        const firstVal = values[0];
        const pts = data.filter(d => !isNaN(parseFloat(d[valueKey]))).map((d, i, arr) => ({
          x: padX + (i / (arr.length - 1)) * (w - padX * 2),
          y: padY + ((max - parseFloat(d[valueKey])) / (max - min)) * (h - padY * 2),
          val: parseFloat(d[valueKey]),
          date: (d.measured_at || "").slice(5),
          isLast: i === arr.length - 1,
        }));
        const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
        const areaD = `${pathD} L ${pts[pts.length-1].x} ${h} L ${pts[0].x} ${h} Z`;
        return `<svg width="100%" viewBox="0 0 ${w} ${h}" style="display:block;max-width:100%">
          <defs><linearGradient id="g${valueKey}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color}" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
          </linearGradient></defs>
          <path d="${areaD}" fill="url(#g${valueKey})"/>
          <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          ${pts.map(p => {
            const pctChange = (showPctChange && p.isLast && firstVal) ? ((p.val - firstVal) / firstVal * 100).toFixed(1) : null;
            const pctColor = pctChange && parseFloat(pctChange) < 0 ? "#2d6a4f" : "#e07a5f";
            return `
            <circle cx="${p.x}" cy="${p.y}" r="4" fill="${color}" stroke="white" stroke-width="2"/>
            <text x="${p.x}" y="${h - 4}" text-anchor="middle" font-size="9" fill="#9090b0">${p.date}</text>
            <text x="${p.x}" y="${p.y - 8}" text-anchor="middle" font-size="10" font-weight="600" fill="${color}">${p.val}</text>
            ${pctChange ? `<text x="${p.x}" y="${p.y - 22}" text-anchor="middle" font-size="9" font-weight="700" fill="${pctColor}">${parseFloat(pctChange) > 0 ? "+" : ""}${pctChange}%</text>` : ""}
          `}).join("")}
        </svg>`;
      };

      // BMI 카테고리
      const bmiCat = (bmi) => {
        if (!bmi) return "";
        const b = parseFloat(bmi);
        if (b < 18.5) return "저체중";
        if (b < 23) return "정상";
        if (b < 25) return "과체중";
        return "비만";
      };

      // 체지방률 경고
      const fatWarn = (pct, gender) => {
        if (!pct) return "";
        const p = parseFloat(pct);
        if (gender === "female") {
          if (p >= 35) return "⚠️ 고도비만 수준";
          if (p >= 28) return "⚠️ 마른 비만 가능성";
        } else {
          if (p >= 30) return "⚠️ 고도비만 수준";
          if (p >= 25) return "⚠️ 마른 비만 가능성";
        }
        return "";
      };

      const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>건강관리 리포트 — ${patient.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Noto Sans KR', sans-serif; color: #1a1a2e; background: #fff; }

  /* COVER */
  .cover { background: #1a1a2e; color: #fff; padding: 60px 48px 48px; min-height: 180px; position: relative; overflow: hidden; }
  .cover::before { content: ""; position: absolute; top: -40px; right: -40px; width: 200px; height: 200px; border-radius: 50%; background: rgba(45,106,79,0.3); }
  .cover::after { content: ""; position: absolute; bottom: -60px; left: 40%; width: 280px; height: 280px; border-radius: 50%; background: rgba(82,183,136,0.1); }
  .cover-clinic { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #52b788; margin-bottom: 12px; }
  .cover-title { font-size: 28px; font-weight: 300; margin-bottom: 6px; }
  .cover-title strong { font-weight: 700; }
  .cover-sub { font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 20px; }
  .cover-meta { display: flex; gap: 32px; margin-top: 8px; }
  .cover-meta span { font-size: 12px; color: rgba(255,255,255,0.7); }
  .cover-meta strong { color: #52b788; }

  /* BODY */
  .body { padding: 40px 48px; }

  /* SECTION */
  .section-block { margin-bottom: 40px; }
  .section-head { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #1a1a2e; }
  .section-num { width: 28px; height: 28px; border-radius: 50%; background: #1a1a2e; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
  .section-title { font-size: 16px; font-weight: 700; }

  /* GOAL BOX */
  .goal-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
  .goal-card { background: #f4f3ef; border-radius: 10px; padding: 16px; }
  .goal-label { font-size: 10px; color: #9090b0; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .goal-value { font-size: 22px; font-weight: 700; color: #1a1a2e; }
  .goal-value.accent { color: #2d6a4f; }
  .goal-value.info { color: #3d7ebf; }

  /* PROGRESS BAR */
  .progress-wrap { margin-bottom: 20px; }
  .progress-label { display: flex; justify-content: space-between; font-size: 12px; color: #9090b0; margin-bottom: 6px; }
  .progress-bar { height: 8px; background: #e8e6e0; border-radius: 20px; overflow: hidden; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, #52b788, #2d6a4f); border-radius: 20px; }

  /* CHART */
  .chart-block { margin-bottom: 20px; }
  .chart-label { font-size: 11px; font-weight: 600; color: #4a4a6a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .chart-wrap { background: #faf9f6; border-radius: 10px; padding: 16px; border: 1px solid #e8e6e0; }

  /* TABLE */
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 16px; }
  th { background: #1a1a2e; color: #fff; padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 600; letter-spacing: 0.5px; }
  td { padding: 10px 12px; border-bottom: 1px solid #e8e6e0; }
  tr:nth-child(even) td { background: #faf9f6; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; }
  .badge-down { background: #d8f3dc; color: #2d6a4f; }
  .badge-up { background: #fdecea; color: #e07a5f; }
  .badge-warn { background: #fdecea; color: #e07a5f; }
  .badge-ok { background: #d8f3dc; color: #2d6a4f; }

  /* INSIGHT BOX */
  .insight { background: #f0f7ff; border-left: 4px solid #3d7ebf; border-radius: 0 8px 8px 0; padding: 14px 16px; margin-top: 16px; font-size: 12px; line-height: 1.7; color: #1a1a2e; }
  .insight strong { color: #3d7ebf; }
  .insight-warn { background: #fff5f3; border-left-color: #e07a5f; }
  .insight-warn strong { color: #e07a5f; }

  /* DIVIDER */
  .divider { height: 1px; background: #e8e6e0; margin: 32px 0; }

  /* FOOTER */
  .footer { background: #f4f3ef; padding: 20px 48px; font-size: 11px; color: #9090b0; display: flex; justify-content: space-between; margin-top: 40px; }

  /* INBODY GRID */
  .ib-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .ib-card { background: #faf9f6; border: 1px solid #e8e6e0; border-radius: 10px; padding: 14px 16px; }
  .ib-label { font-size: 10px; color: #9090b0; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .ib-val { font-size: 20px; font-weight: 700; }
  .ib-warn { color: #e07a5f; }
  .ib-ok { color: #2d6a4f; }
  .ib-warn-msg { font-size: 10px; color: #e07a5f; margin-top: 2px; font-weight: 600; }

  @media print {
    @page { margin: 16mm 14mm; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-break { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<div class="body">
<div style="border-bottom:2px solid #1a1a2e;padding-bottom:12px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:flex-end;">
  <div>
    <div style="font-size:11px;letter-spacing:2px;color:#52b788;margin-bottom:4px">韓醫 DIET · 건강관리 리포트</div>
    <div style="font-size:22px;font-weight:700;color:#1a1a2e">${patient.name} 님의 다이어트 관리 기록</div>
  </div>
  <div style="font-size:11px;color:#9090b0;text-align:right;line-height:1.8">
    <div>차트번호 #${patient.chart_number} &nbsp;·&nbsp; ${patient.gender === "female" ? "여성" : "남성"}</div>
    <div>출력일 ${formatDate(today())}${goal ? " &nbsp;·&nbsp; 관리 시작일 " + formatDate(goal.start_date) : ""}</div>
  </div>
</div>

<!-- SECTION 1: 목표 & 체형 측정 -->
<div class="section-block no-break">
  <div class="section-head">
    <div class="section-num">1</div>
    <div class="section-title">목표 설정 및 체형 측정</div>
  </div>

  ${goal ? `
  <div class="goal-grid">
    <div class="goal-card">
      <div class="goal-label">목표 체중</div>
      <div class="goal-value accent">${goal.target_weight} <span style="font-size:14px;font-weight:400">kg</span></div>
    </div>
    <div class="goal-card">
      <div class="goal-label">목표 기간</div>
      <div class="goal-value">${goal.target_period_weeks} <span style="font-size:14px;font-weight:400">주</span></div>
    </div>
    <div class="goal-card">
      <div class="goal-label">현재 체중</div>
      <div class="goal-value">${latestWeight || "-"} <span style="font-size:14px;font-weight:400">kg</span></div>
    </div>
    <div class="goal-card">
      <div class="goal-label">총 감량</div>
      <div class="goal-value info">${lost ? `-${lost}` : "-"} <span style="font-size:14px;font-weight:400">kg</span></div>
    </div>
  </div>
  ${goal.target_weight && latestWeight && startWeight ? `
  <div class="progress-wrap">
    <div class="progress-label">
      <span>시작 ${startWeight}kg → 현재 ${latestWeight}kg</span>
      <span>목표 ${goal.target_weight}kg</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width:${Math.max(0,Math.min(100,Math.round((startWeight-latestWeight)/(startWeight-goal.target_weight)*100)))}%"></div>
    </div>
  </div>` : ""}
  ` : '<div style="color:#9090b0;font-size:13px;padding:16px 0">목표가 등록되지 않았습니다</div>'}

  ${ms.length >= 2 ? `
  <div class="chart-block">
    <div class="chart-label">체중 추이 (kg)</div>
    <div class="chart-wrap">${makeSVG(ms, "weight", "#2d6a4f", "체중", "kg", true)}</div>
  </div>
  ${ms.some(m => m.bmi) ? `
  <div class="chart-block">
    <div class="chart-label">BMI 추이</div>
    <div class="chart-wrap">${makeSVG(ms, "bmi", "#c9a94e", "BMI", "")}</div>
  </div>` : ""}
  ` : '<div style="color:#9090b0;font-size:12px;padding:8px 0">체형 측정 데이터가 2개 이상이어야 그래프가 표시됩니다</div>'}

  ${ms.length > 0 ? (() => {
    const first = ms[0];
    const last = ms[ms.length - 1];
    const rows = ms.length === 1 ? [first] : [first, last];
    const startW = first.weight;
    return `<table>
    <thead><tr><th>구분</th><th>측정일</th><th>키 (cm)</th><th>체중 (kg)</th><th>BMI</th><th>최초 대비 변화</th><th>메모</th></tr></thead>
    <tbody>
      ${rows.map((m, i) => {
        const isLast = i === rows.length - 1 && rows.length > 1;
        const diff = isLast && startW && m.weight ? (m.weight - startW).toFixed(1) : null;
        const diffPct = isLast && startW && m.weight ? ((m.weight - startW) / startW * 100).toFixed(1) : null;
        const cat = bmiCat(m.bmi);
        return `<tr>
          <td><strong style="color:${isLast ? "#3d7ebf" : "#2d6a4f"}">${isLast ? "최근" : "최초"}</strong></td>
          <td>${formatDate(m.measured_at)}</td>
          <td>${m.height || "-"}</td>
          <td><strong>${m.weight || "-"}</strong></td>
          <td>${m.bmi ? `${m.bmi} <span class="badge ${["정상"].includes(cat) ? "badge-ok" : "badge-warn"}">${cat}</span>` : "-"}</td>
          <td>${diff ? `<span class="badge ${parseFloat(diff) < 0 ? "badge-down" : "badge-up"}">${parseFloat(diff) > 0 ? "+" : ""}${diff}kg (${parseFloat(diffPct) > 0 ? "+" : ""}${diffPct}%)</span>` : "-"}</td>
          <td style="color:#9090b0">${m.memo || "-"}</td>
        </tr>`;
      }).join("")}
    </tbody>
  </table>`;
  })() : ""}

  <div class="insight">
    <strong>BMI 해석 기준 (아시아인)</strong><br>
    저체중: BMI &lt; 18.5 &nbsp;|&nbsp; 정상: 18.5 ~ 22.9 &nbsp;|&nbsp; 과체중: 23 ~ 24.9 &nbsp;|&nbsp; 비만: ≥ 25<br>
    <span style="color:#9090b0">※ BMI는 체중과 키로만 계산되므로 근육량이 많은 경우 실제 체성분과 다를 수 있습니다.</span>
  </div>
</div>

<div class="divider"></div>

<!-- SECTION 2: 인바디 분석 -->
<div class="section-block no-break">
  <div class="section-head">
    <div class="section-num">2</div>
    <div class="section-title">인바디 체성분 분석</div>
  </div>

  ${ib.length === 0 ? '<div style="color:#9090b0;font-size:13px;padding:16px 0">인바디 측정 기록이 없습니다</div>' : `
  ${(() => {
    if (ib.length < 2) return "";
    const latestM = ib[ib.length-1]?.parsed_data?.muscle_mass;
    const prevM = ib[ib.length-2]?.parsed_data?.muscle_mass;
    if (!latestM || !prevM) return "";
    const drop = (parseFloat(prevM) - parseFloat(latestM)) / parseFloat(prevM) * 100;
    if (drop < 5) return "";
    return String.raw`<div style="background:#fff3e0;border:2px solid #ff9800;border-radius:8px;padding:14px 16px;margin-bottom:16px;display:flex;align-items:flex-start;gap:12px"><span style="font-size:22px">💧</span><div><div style="font-weight:700;color:#e65100;font-size:14px;margin-bottom:4px">수분 섭취를 늘리세요</div><div style="font-size:12px;color:#bf360c">골격근량이 이전 측정 대비 ` + drop.toFixed(1) + `% 감소하였습니다 (` + prevM + `kg → ` + latestM + `kg). 충분한 수분 섭취와 단백질 보충이 필요합니다.</div></div></div>`;
  })()}

  

  ${ib.length >= 2 ? `
  <div class="chart-block">
    <div class="chart-label">골격근량 추이 (kg)</div>
    <div class="chart-wrap">${makeSVG(ib.map(r => ({measured_at: r.measured_at, muscle_mass: r.parsed_data?.muscle_mass})), "muscle_mass", "#2d6a4f", "골격근량", "kg")}</div>
  </div>
  <div class="chart-block">
    <div class="chart-label">체지방량 추이 (kg)</div>
    <div class="chart-wrap">${makeSVG(ib.map(r => ({measured_at: r.measured_at, body_fat_mass: r.parsed_data?.body_fat_mass})), "body_fat_mass", "#c9a94e", "체지방량", "kg")}</div>
  </div>
  <div class="chart-block">
    <div class="chart-label">체지방률 추이 (%)</div>
    <div class="chart-wrap">${makeSVG(ib.map(r => ({measured_at: r.measured_at, body_fat_percent: r.parsed_data?.body_fat_percent})), "body_fat_percent", "#e07a5f", "체지방률", "%")}</div>
  </div>
  ` : ""}

  <!-- 인바디 이력 비교 테이블 (처음·마지막만) -->
  ${(() => {
    if (ib.length === 0) return "";
    const ibRows = ib.length === 1 ? [ib[0]] : [ib[0], ib[ib.length-1]];
    const firstIb = ib[0]?.parsed_data || {};
    const lastIb = ib[ib.length-1]?.parsed_data || {};
    const fields = [
      { key: "muscle_mass", label: "골격근량 (kg)" },
      { key: "body_fat_mass", label: "체지방량 (kg)" },
      { key: "body_fat_percent", label: "체지방률 (%)" },
      { key: "bmi", label: "BMI" },
      { key: "bmr", label: "기초대사량 (kcal)" },
      { key: "total_body_water", label: "체수분 (L)" },
    ];
    return `<table>
      <thead>
        <tr>
          <th>항목</th>
          <th>최초 (${formatDate(ib[0].measured_at)})</th>
          ${ib.length > 1 ? `<th>최근 (${formatDate(ib[ib.length-1].measured_at)})</th><th>변화</th>` : ""}
        </tr>
      </thead>
      <tbody>
        ${fields.map(f => {
          const firstVal = firstIb[f.key];
          const lastVal = ib.length > 1 ? lastIb[f.key] : null;
          const diff = firstVal && lastVal ? (parseFloat(lastVal) - parseFloat(firstVal)).toFixed(1) : null;
          const isWarn = f.key === "body_fat_percent" && fatWarn(lastVal || firstVal, patient.gender);
          const muscleDrop = f.key === "muscle_mass" && diff && ((parseFloat(firstVal) - parseFloat(lastVal)) / parseFloat(firstVal) * 100) >= 5;
          return `<tr>
            <td><strong>${f.label}</strong></td>
            <td>${firstVal != null ? firstVal : "-"}</td>
            ${ib.length > 1 ? `
            <td style="${isWarn ? "color:#e07a5f;font-weight:600" : ""}">
              ${lastVal != null ? lastVal : "-"}
              ${muscleDrop ? `<div style="font-size:10px;color:#e07a5f;font-weight:700">💧 수분 섭취를 늘리세요</div>` : ""}
            </td>
            <td>${diff ? `<span style="font-size:11px;font-weight:600;color:${parseFloat(diff) < 0 ? "#2d6a4f" : "#e07a5f"}">${parseFloat(diff) > 0 ? "+" : ""}${diff}</span>` : "-"}</td>
            ` : ""}
          </tr>`;
        }).join("")}
      </tbody>
    </table>`;
  })()}

  <div class="insight insight-warn" style="margin-top:16px">
    <strong>체지방률 해석 기준</strong><br>
    여성: 정상 18~27% &nbsp;|&nbsp; <strong>28% 이상</strong> → BMI 정상이어도 마른 비만 가능성<br>
    남성: 정상 10~24% &nbsp;|&nbsp; <strong>25% 이상</strong> → BMI 정상이어도 마른 비만 가능성<br>
    <span style="color:#9090b0">※ 마른 비만은 근육량이 적고 체지방이 내장에 축적된 상태로 대사 질환 위험이 높습니다.</span>
  </div>

  <div class="insight" style="margin-top:12px">
    <strong>골격근량 해석</strong><br>
    골격근량이 증가하면 기초대사량이 높아져 체중 감량 효과가 지속됩니다.<br>
    다이어트 중 골격근량 유지 또는 증가는 매우 긍정적인 신호입니다.
  </div>
  `}
</div>

</div><!-- /body -->

<div class="footer">
  <span>韓醫 Diet 건강관리 리포트</span>
  <span>${patient.name} 님 · 출력일 ${formatDate(today())}</span>
</div>

</body>
</html>`;

      const w = window.open("", "_blank");
      if (!w) { alert("팝업이 차단됐습니다. 브라우저에서 팝업을 허용해주세요."); setGenerating(false); return; }
      w.document.write(html);
      w.document.close();
      setTimeout(() => { w.print(); setGenerating(false); }, 800);
    } catch(err) {
      alert("PDF 생성 실패: " + err.message);
      setGenerating(false);
    }
  };

  return (
    <div>
      <button className="back-btn" onClick={onBack}>← 환자 목록으로</button>
      <div className="patient-detail-header">
        <div>
          <div className="detail-name">{patient.name}</div>
          <div className="detail-meta">차트 #{patient.chart_number} · {patient.gender === "female" ? "여성" : "남성"} · {patient.phone || "연락처 없음"}</div>
        </div>
        <button className="btn btn-secondary" onClick={generatePDF} disabled={generating} style={{background:"rgba(255,255,255,0.15)", color:"#fff", border:"1px solid rgba(255,255,255,0.3)"}}>
          {generating ? "생성 중..." : "🖨️ 리포트 PDF 출력"}
        </button>
      </div>

      <div className="tabs">
        {[
          { key: "measurement", label: "① 체형 측정" },
          { key: "inbody", label: "② 인바디 분석" },
          { key: "prescription", label: "③ 약 처방" },
          { key: "visit", label: "④ 침구실 치료" },
        ].map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "measurement" && <MeasurementTab patient={patient} currentUser={currentUser} />}
      {tab === "inbody" && <InbodyTab patient={patient} currentUser={currentUser} />}
      {tab === "prescription" && <PrescriptionTab patient={patient} currentUser={currentUser} />}
      {tab === "visit" && <VisitTab patient={patient} currentUser={currentUser} />}
    </div>
  );
}

// =============================================
// TAB 1: MEASUREMENT
// =============================================
function calcBMI(weight, height) {
  if (!weight || !height) return null;
  const h = height / 100;
  return (weight / (h * h)).toFixed(1);
}

function bmiCategory(bmi) {
  if (!bmi) return null;
  const b = parseFloat(bmi);
  if (b < 18.5) return { label: "저체중", color: "var(--info)" };
  if (b < 23)   return { label: "정상", color: "var(--accent)" };
  if (b < 25)   return { label: "과체중", color: "var(--gold)" };
  return { label: "비만", color: "var(--warn)" };
}


// =============================================
// WEIGHT PROJECTION GRAPH (목표 체중 예상 기간)
// =============================================
function WeightProjectionChart({ currentWeight, targetWeight, height }) {
  if (!currentWeight || !targetWeight || !height) return null;
  const cw = parseFloat(currentWeight);
  const tw = parseFloat(targetWeight);
  const h = parseFloat(height) / 100;
  if (cw <= tw) return null;

  // BMI 기준 동적 감량률 (매월 체중 기준으로 재계산)
  const getRates = (w) => {
    const bmi = w / (h * h);
    if (bmi >= 25) return { min: 0.08, max: 0.10, cat: "비만" };
    if (bmi >= 23) return { min: 0.06, max: 0.08, cat: "과체중" };
    return { min: 0.04, max: 0.06, cat: "정상체중" };
  };

  // 월별 예상 체중 계산 — 매월 BMI 재계산 후 감량률 적용
  const rows = [];
  let wMin = cw, wMax = cw;
  const initialCat = getRates(cw).cat;
  for (let m = 0; m <= 36; m++) {
    rows.push({ month: m, min: parseFloat(wMin.toFixed(1)), max: parseFloat(wMax.toFixed(1)) });
    if (wMin <= tw && wMax <= tw) break;
    const rMin = getRates(wMin);
    const rMax = getRates(wMax);
    wMin = Math.max(tw, wMin * (1 - rMin.max));
    wMax = Math.max(tw, wMax * (1 - rMax.min));
  }

  const reachMin = rows.find(r => r.min <= tw)?.month;
  const reachMax = rows.find(r => r.max <= tw)?.month;
  const category = initialCat;
  const { min: minRate, max: maxRate } = getRates(cw);

  // SVG chart
  const display = rows.slice(0, Math.min(rows.length, 13));
  const allVals = display.flatMap(r => [r.min, r.max]);
  const minV = Math.min(...allVals) - 1;
  const maxV = Math.max(...allVals) + 1;
  const W = 500, H = 160, PX = 40, PY = 20;
  const px = (i) => PX + (i / (display.length - 1)) * (W - PX * 2);
  const py = (v) => PY + ((maxV - v) / (maxV - minV)) * (H - PY * 2);

  const pathMax = display.map((r, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${py(r.max)}`).join(" ");
  const pathMin = display.map((r, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${py(r.min)}`).join(" ");
  const areaPath = pathMin + " " + [...display].reverse().map((r, i, arr) => `${i === 0 ? "L" : "L"} ${px(arr.length - 1 - i)} ${py(r.max)}`).join(" ") + " Z";
  const targetY = py(tw);

  return (
    <div style={{marginTop:16, padding:16, background:"var(--surface2)", borderRadius:10, border:"1px solid var(--border)"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
        <div style={{fontSize:13, fontWeight:700}}>📉 목표 체중 도달 예상 기간 ({category})</div>
        <div style={{fontSize:12, color:"var(--ink-muted)"}}>월 {Math.round(minRate*100)}~{Math.round(maxRate*100)}% 감량 기준</div>
      </div>
      <div style={{fontSize:12, color:"var(--accent)", fontWeight:600, marginBottom:10}}>
        예상 기간: <strong>{reachMin}~{reachMax}개월</strong> 후 목표 체중 {tw}kg 도달
      </div>
      <div style={{overflowX:"auto"}}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block", minWidth:300}}>
          <defs>
            <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15"/>
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02"/>
            </linearGradient>
          </defs>
          {/* target line */}
          <line x1={PX} y1={targetY} x2={W-PX} y2={targetY} stroke="var(--warn)" strokeWidth="1.5" strokeDasharray="6,4"/>
          <text x={W-PX+4} y={targetY+4} fontSize="9" fill="var(--warn)">{tw}kg</text>
          {/* area */}
          <path d={areaPath} fill="url(#projGrad)"/>
          {/* lines */}
          <path d={pathMax} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeDasharray="5,3"/>
          <path d={pathMin} fill="none" stroke="#2d6a4f" strokeWidth="2" strokeLinecap="round"/>
          {/* points & labels */}
          {display.map((r, i) => (
            <g key={i}>
              <circle cx={px(i)} cy={py(r.min)} r="3" fill="#2d6a4f" stroke="#fff" strokeWidth="1.5"/>
              <text x={px(i)} y={H-4} textAnchor="middle" fontSize="9" fill="#9090b0">{r.month}M</text>
              {i % 2 === 0 && <text x={px(i)} y={py(r.min)-7} textAnchor="middle" fontSize="9" fill="#2d6a4f">{r.min}</text>}
            </g>
          ))}
        </svg>
      </div>
      <div style={{display:"flex", gap:16, fontSize:11, color:"var(--ink-muted)", marginTop:6}}>
        <span><span style={{color:"#2d6a4f", fontWeight:700}}>—</span> 최대 감량 시나리오 (월 {Math.round(maxRate*100)}%)</span>
        <span><span style={{color:"var(--accent)", fontWeight:700}}>- -</span> 최소 감량 시나리오 (월 {Math.round(minRate*100)}%)</span>
        <span><span style={{color:"var(--warn)", fontWeight:700}}>- -</span> 목표 체중</span>
      </div>
    </div>
  );
}

function MeasurementTab({ patient, currentUser }) {
  const [measurements, setMeasurements] = useState([]);
  const [goal, setGoal] = useState(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showMeasureForm, setShowMeasureForm] = useState(false);
  const [mForm, setMForm] = useState({ measured_at: today(), height: "", weight: "", memo: "" });
  const [gForm, setGForm] = useState({ target_weight: "", target_period_weeks: "", start_date: today(), constitution: "" });

  const load = useCallback(async () => {
    const { data: m } = await supabase.from("measurements").select("*").eq("patient_id", patient.id).order("measured_at");
    const { data: g } = await supabase.from("goals").select("*").eq("patient_id", patient.id).order("created_at", { ascending: false }).limit(1);
    setMeasurements(m || []);
    setGoal(g?.[0] || null);
  }, [patient.id]);

  useEffect(() => { load(); }, [load]);

  const saveMeasurement = async () => {
    if (!mForm.weight) { alert("체중은 필수 입력항목입니다."); return; }
    const bmi = calcBMI(mForm.weight, mForm.height);
    const { error } = await supabase.from("measurements").insert([{
      patient_id: patient.id,
      measured_at: mForm.measured_at,
      height: mForm.height || null,
      weight: mForm.weight,
      bmi: bmi || null,
      memo: mForm.memo || null,
    }]);
    if (error) { alert("저장 실패: " + error.message); return; }
    setMForm({ measured_at: today(), height: "", weight: "", memo: "" });
    setShowMeasureForm(false);
    load();
  };

  const saveGoal = async () => {
    if (goal) await supabase.from("goals").update(gForm).eq("id", goal.id);
    else await supabase.from("goals").insert([{ ...gForm, patient_id: patient.id }]);
    setShowGoalForm(false);
    load();
  };

  useEffect(() => {
    if (goal) setGForm({ target_weight: goal.target_weight || "", target_period_weeks: goal.target_period_weeks || "", start_date: goal.start_date || today(), constitution: goal.constitution || "" });
  }, [goal]);

  const latestWeight = measurements[measurements.length-1]?.weight;
  const startWeight = measurements[0]?.weight;
  const lost = startWeight && latestWeight ? (startWeight - latestWeight).toFixed(1) : null;
  const previewBMI = calcBMI(mForm.weight, mForm.height);
  const previewCat = bmiCategory(previewBMI);


  return (
    <div>
      <div className="card" style={{marginBottom: 16}}>
        <div className="section-header">
          <div className="section-title">🎯 목표 설정</div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowGoalForm(!showGoalForm)}>
            {goal ? "수정" : "목표 등록"}
          </button>
        </div>
        {goal ? (
          <div>
            <div style={{display:"flex", gap:24, flexWrap:"wrap"}}>
              <div><div className="form-label">목표 체중</div><div style={{fontSize:20,fontWeight:700,color:"var(--accent)"}}>{goal.target_weight} kg</div></div>
              <div><div className="form-label">목표 기간</div><div style={{fontSize:20,fontWeight:700}}>{goal.target_period_weeks}주</div></div>
              <div><div className="form-label">시작일</div><div style={{fontSize:14,fontWeight:600}}>{formatDate(goal.start_date)}</div></div>
              {goal.constitution && <div><div className="form-label">체질</div><div style={{fontSize:16,fontWeight:700,color:"var(--info)"}}>{goal.constitution}</div></div>}
              {lost && <div><div className="form-label">현재까지 감량</div><div style={{fontSize:20,fontWeight:700,color:"var(--info)"}}>-{lost} kg</div></div>}
            </div>
            {!showGoalForm && latestWeight && goal.target_weight && (
              <WeightProjectionChart
                currentWeight={latestWeight}
                targetWeight={goal.target_weight}
                height={measurements[measurements.length-1]?.height || measurements[0]?.height}
              />
            )}
          </div>
        ) : <div className="empty" style={{padding:16}}>목표를 등록해주세요</div>}
        {showGoalForm && (
          <div style={{marginTop:16, paddingTop:16, borderTop:"1px solid var(--border)"}}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">목표 체중 (kg)</label>
                <input className="form-input" type="number" step="0.1" value={gForm.target_weight} onChange={e => setGForm({...gForm, target_weight: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">목표 기간 (주)</label>
                <input className="form-input" type="number" value={gForm.target_period_weeks} onChange={e => setGForm({...gForm, target_period_weeks: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">시작일</label>
                <input className="form-input" type="date" value={gForm.start_date} onChange={e => setGForm({...gForm, start_date: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">체질</label>
                <select className="form-select" value={gForm.constitution} onChange={e => setGForm({...gForm, constitution: e.target.value})}>
                  <option value="">— 선택 —</option>
                  {["금양","금음","토양","토음","목양","목음","수양","수음"].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* 실시간 목표 체중 예측 그래프 */}
            {gForm.target_weight && latestWeight && (
              <WeightProjectionChart
                currentWeight={latestWeight}
                targetWeight={gForm.target_weight}
                height={measurements[measurements.length-1]?.height || measurements[0]?.height}
              />
            )}
            <div className="form-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowGoalForm(false)}>취소</button>
              <button className="btn btn-primary btn-sm" onClick={saveGoal}>저장</button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-header">
          <div className="section-title">📊 체형 측정 기록</div>
<button className="btn btn-primary btn-sm" onClick={() => setShowMeasureForm(!showMeasureForm)}>+ 측정값 입력</button>
        </div>
        {showMeasureForm && (
          <div style={{background:"var(--surface2)", borderRadius:8, padding:16, marginBottom:16}}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">측정일</label>
                <input className="form-input" type="date" value={mForm.measured_at} onChange={e => setMForm({...mForm, measured_at: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">키 (cm)</label>
                <input className="form-input" type="number" step="0.1" placeholder="000.0" value={mForm.height} onChange={e => setMForm({...mForm, height: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">체중 (kg) *</label>
                <input className="form-input" type="number" step="0.1" placeholder="00.0" value={mForm.weight} onChange={e => setMForm({...mForm, weight: e.target.value})} />
              </div>
              <div className="form-group" style={{display:"flex", flexDirection:"column", justifyContent:"flex-end"}}>
                {previewBMI && previewCat ? (
                  <div style={{background:"var(--surface)", borderRadius:8, padding:"10px 14px", border:"1.5px solid var(--border)"}}>
                    <div style={{fontSize:11, color:"var(--ink-muted)", marginBottom:2}}>BMI 자동 계산</div>
                    <div style={{display:"flex", alignItems:"center", gap:8}}>
                      <span style={{fontSize:20, fontWeight:700}}>{previewBMI}</span>
                      <span style={{fontSize:12, fontWeight:700, color:previewCat.color, background:previewCat.color+"20", padding:"2px 8px", borderRadius:20}}>{previewCat.label}</span>
                    </div>
                  </div>
                ) : <div style={{fontSize:11, color:"var(--ink-muted)"}}>키와 체중을 입력하면<br/>BMI가 자동 계산됩니다</div>}
              </div>
              <div className="form-group form-full">
                <label className="form-label">메모 / 특이사항</label>
                <textarea className="form-input" rows={2} style={{resize:"vertical"}} placeholder="특이사항을 입력하세요" value={mForm.memo} onChange={e => setMForm({...mForm, memo: e.target.value})} />
              </div>
            </div>
            <div style={{fontSize:11, color:"var(--ink-muted)", marginTop:4}}>
              아시아인 기준 — 저체중: BMI &lt;18.5 / 정상: 18.5~22.9 / 과체중: 23~24.9 / 비만: ≥25
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowMeasureForm(false)}>취소</button>
              <button className="btn btn-primary btn-sm" onClick={saveMeasurement}>저장</button>
            </div>
          </div>
        )}
        {measurements.length >= 2 && (() => {
          // Flat 구간 감지: 15일 이상 체중 변화 없는 구간
          const sorted = [...measurements].sort((a,b) => a.measured_at.localeCompare(b.measured_at));
          let flatAlert = null;
          for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i-1], cur = sorted[i];
            if (prev.weight && cur.weight && Math.abs(parseFloat(cur.weight) - parseFloat(prev.weight)) < 0.5) {
              const days = Math.floor((new Date(cur.measured_at) - new Date(prev.measured_at)) / (1000*60*60*24));
              if (days >= 15) { flatAlert = { from: prev.measured_at, to: cur.measured_at, days }; }
            }
          }
          return (
            <div style={{marginBottom:16}}>
              {flatAlert && (
                <div style={{background:"#fff8e1", border:"1.5px solid #f9a825", borderRadius:8, padding:"10px 14px", marginBottom:12, fontSize:13, color:"#7a5f00", display:"flex", alignItems:"center", gap:8}}>
                  <span style={{fontSize:16}}>📊</span>
                  <span><strong>Flat 구간 감지 (Set Point 조정 요망)</strong> — {formatDate(flatAlert.from)} ~ {formatDate(flatAlert.to)} ({flatAlert.days}일간 체중 변화 없음)</span>
                </div>
              )}
              <div className="form-label" style={{marginBottom:8}}>체중 추이 (kg)</div>
              <LineChart data={measurements} valueKey="weight" color="var(--accent)" showDiff={true} />
              {measurements.some(m => m.bmi) && (
                <>
                  <div className="form-label" style={{margin:"16px 0 8px"}}>BMI 추이</div>
                  <LineChart data={measurements} valueKey="bmi" color="var(--gold)" />
                </>
              )}
            </div>
          );
        })()}
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>측정일</th><th>키(cm)</th><th>체중(kg)</th><th>BMI</th><th>변화(kg)</th><th>변화(%)</th><th>메모</th><th></th></tr>
            </thead>
            <tbody>
              {[...measurements].reverse().map((m, i, arr) => {
                const prev = arr[i+1];
                const diff = prev && m.weight && prev.weight ? (m.weight - prev.weight).toFixed(1) : null;
                const diffPct = prev && m.weight && prev.weight ? ((m.weight - prev.weight) / prev.weight * 100).toFixed(1) : null;
                const cat = bmiCategory(m.bmi);
                return (
                  <tr key={m.id}>
                    <td>{formatDate(m.measured_at)}</td>
                    <td>{m.height || "-"}</td>
                    <td><strong>{m.weight || "-"}</strong></td>
                    <td>{m.bmi ? (<span style={{display:"inline-flex",alignItems:"center",gap:4}}>{m.bmi}{cat && <span style={{fontSize:10,fontWeight:700,color:cat.color,background:cat.color+"20",padding:"1px 6px",borderRadius:20}}>{cat.label}</span>}</span>) : "-"}</td>
                    <td>{diff ? <span style={{color: parseFloat(diff) < 0 ? "var(--accent)" : "var(--warn)", fontWeight:600}}>{parseFloat(diff) > 0 ? "+" : ""}{diff}</span> : "-"}</td>
                    <td>{diffPct ? <span style={{color: parseFloat(diffPct) < 0 ? "var(--accent)" : "var(--warn)", fontWeight:600, fontSize:12}}>{parseFloat(diffPct) > 0 ? "+" : ""}{diffPct}%</span> : "-"}</td>
                    <td style={{maxWidth:150, fontSize:12, color:"var(--ink-muted)"}}>{m.memo || "-"}</td>
                    <td><button className="btn btn-xs btn-danger" onClick={async () => {
                      if (!window.confirm("이 측정 기록을 삭제하시겠습니까?")) return;
                      await supabase.from("measurements").delete().eq("id", m.id);
                      load();
                    }}>삭제</button></td>
                  </tr>
                );
              })}
              {measurements.length === 0 && <tr><td colSpan={7} className="empty">측정 기록이 없습니다</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =============================================
// TAB 2: INBODY
// =============================================
function bodyFatAlert(bodyFatPercent, gender) {
  if (!bodyFatPercent) return null;
  const pct = parseFloat(bodyFatPercent);
  if (gender === "female") {
    if (pct >= 35) return { msg: "고도비만 수준의 체지방률입니다.", color: "var(--warn)" };
    if (pct >= 28) return { msg: "BMI 정상이어도 체지방률 28% 이상은 마른 비만 가능성이 있습니다.", color: "var(--warn)" };
    if (pct < 18) return { msg: "체지방률이 너무 낮습니다. 건강에 주의가 필요합니다.", color: "var(--info)" };
  } else {
    if (pct >= 30) return { msg: "고도비만 수준의 체지방률입니다.", color: "var(--warn)" };
    if (pct >= 25) return { msg: "BMI 정상이어도 체지방률 25% 이상은 마른 비만 가능성이 있습니다.", color: "var(--warn)" };
    if (pct < 10) return { msg: "체지방률이 너무 낮습니다. 건강에 주의가 필요합니다.", color: "var(--info)" };
  }
  return null;
}

const INBODY_FIELDS = [
  { key: "height", label: "신장", unit: "cm" },
  { key: "weight", label: "체중", unit: "kg" },
  { key: "body_fat_percent", label: "체지방률", unit: "%" },
  { key: "muscle_mass", label: "골격근량", unit: "kg" },
  { key: "body_fat_mass", label: "체지방량", unit: "kg" },
  { key: "bmi", label: "BMI", unit: "" },
  { key: "bmr", label: "기초대사량", unit: "kcal" },
  { key: "total_body_water", label: "체수분", unit: "L" },
];

const COMPARE_FIELDS = [
  { key: "muscle_mass", label: "골격근량", unit: "kg", color: "var(--accent)" },
  { key: "body_fat_mass", label: "체지방량", unit: "kg", color: "var(--gold)" },
  { key: "body_fat_percent", label: "체지방률", unit: "%", color: "var(--warn)" },
];

function InbodyEditForm({ initialData, onSave, onCancel, title }) {
  const [form, setForm] = useState({
    measured_date: initialData?.measured_date || initialData?.measured_at || today(),
    height: initialData?.height || "",
    weight: initialData?.weight || "",
    body_fat_percent: initialData?.body_fat_percent || "",
    muscle_mass: initialData?.muscle_mass || "",
    body_fat_mass: initialData?.body_fat_mass || "",
    bmi: initialData?.bmi || "",
    bmr: initialData?.bmr || "",
    total_body_water: initialData?.total_body_water || "",
  });

  return (
    <div className="card" style={{marginBottom:16, border:"2px solid var(--accent)"}}>
      <div className="section-title" style={{marginBottom:12, color:"var(--accent)"}}>{title}</div>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">측정일</label>
          <input className="form-input" type="date" value={form.measured_date} onChange={e => setForm({...form, measured_date: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">신장 (cm)</label>
          <input className="form-input" type="number" step="0.1" value={form.height} onChange={e => setForm({...form, height: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">체중 (kg)</label>
          <input className="form-input" type="number" step="0.1" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">체지방률 (%)</label>
          <input className="form-input" type="number" step="0.1" value={form.body_fat_percent} onChange={e => setForm({...form, body_fat_percent: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">골격근량 (kg)</label>
          <input className="form-input" type="number" step="0.1" value={form.muscle_mass} onChange={e => setForm({...form, muscle_mass: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">체지방량 (kg)</label>
          <input className="form-input" type="number" step="0.1" value={form.body_fat_mass} onChange={e => setForm({...form, body_fat_mass: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">BMI</label>
          <input className="form-input" type="number" step="0.1" value={form.bmi} onChange={e => setForm({...form, bmi: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">기초대사량 (kcal)</label>
          <input className="form-input" type="number" value={form.bmr} onChange={e => setForm({...form, bmr: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">체수분 (L)</label>
          <input className="form-input" type="number" step="0.1" value={form.total_body_water} onChange={e => setForm({...form, total_body_water: e.target.value})} />
        </div>
      </div>
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onCancel}>취소</button>
        <button className="btn btn-primary" onClick={() => onSave(form)}>저장</button>
      </div>
    </div>
  );
}

function InbodyTab({ patient, currentUser }) {
  const [records, setRecords] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [ageGroup, setAgeGroup] = useState("adult");
  const [editingRecord, setEditingRecord] = useState(null); // 수정 중인 기존 기록

  const load = useCallback(async () => {
    const { data } = await supabase.from("inbody_records").select("*").eq("patient_id", patient.id).order("measured_at", { ascending: true });
    setRecords(data || []);
  }, [patient.id]);

  useEffect(() => { load(); }, [load]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") return alert("PDF 파일만 업로드 가능합니다.");
    setUploading(true);
    const fileName = `inbody/${patient.id}/${Date.now()}.pdf`;
    const { data: uploadData, error: uploadErr } = await supabase.storage.from("inbody-pdfs").upload(fileName, file);
    if (uploadErr) { alert("업로드 실패: " + uploadErr.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("inbody-pdfs").getPublicUrl(fileName);

    setParsing(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result.split(",")[1];
      try {
        const res = await fetch("/api/parse-inbody", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64, mediaType: "application/pdf", ageGroup }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "파싱 실패");
        await saveInbodyRecord(result.parsed, urlData.publicUrl);
      } catch(err) {
        alert("AI 파싱 실패: " + err.message + "\n수동으로 기록을 추가해주세요.");
      }
      setParsing(false);
      setUploading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const saveInbodyRecord = async (data, pdfUrl) => {
    const measuredAt = data.measured_date || data.measured_at || today();
    await supabase.from("inbody_records").insert([{
      patient_id: patient.id,
      measured_at: measuredAt,
      parsed_data: data,
      pdf_url: pdfUrl || null,
    }]);
    // 체형 측정 자동 저장
    if (data.weight) {
      await supabase.from("measurements").insert([{
        patient_id: patient.id,
        measured_at: measuredAt,
        height: data.height || null,
        weight: data.weight || null,
        bmi: data.bmi || null,
        memo: "인바디 자동 입력",
      }]);
    }
    load();
  };

  const updateInbodyRecord = async (record, formData) => {
    const measuredAt = formData.measured_date || today();
    await supabase.from("inbody_records").update({
      measured_at: measuredAt,
      parsed_data: formData,
    }).eq("id", record.id);
    // 체형 측정 — 날짜 기준으로 기존 기록 검색 후 upsert (memo 조건 제거)
    if (formData.weight) {
      const { data: existing } = await supabase.from("measurements")
        .select("id").eq("patient_id", patient.id).eq("measured_at", measuredAt).limit(1);
      if (existing && existing.length > 0) {
        await supabase.from("measurements").update({
          height: formData.height || null,
          weight: formData.weight || null,
          bmi: formData.bmi || null,
        }).eq("id", existing[0].id);
      } else {
        // 해당 날짜에 체형 측정 기록이 없으면 새로 생성
        await supabase.from("measurements").insert([{
          patient_id: patient.id,
          measured_at: measuredAt,
          height: formData.height || null,
          weight: formData.weight || null,
          bmi: formData.bmi || null,
          memo: "인바디 자동 입력",
        }]);
      }
    }
    setEditingRecord(null);
    if (selected?.id === record.id) setSelected(null);
    load();
  };

  const deleteRecord = async (record) => {
    if (!window.confirm("이 인바디 기록을 삭제하시겠습니까?")) return;
    await supabase.from("inbody_records").delete().eq("id", record.id);
    if (selected?.id === record.id) setSelected(null);
    load();
  };

  const chartData = records.map(r => ({
    measured_at: r.measured_at,
    muscle_mass: r.parsed_data?.muscle_mass,
    body_fat_mass: r.parsed_data?.body_fat_mass,
    body_fat_percent: r.parsed_data?.body_fat_percent,
  }));

  return (
    <div>
      {/* 업로드 카드 */}
      <div className="card" style={{marginBottom:16}}>
        <div className="section-header">
          <div className="section-title">📄 인바디 (InBody J50)</div>
        </div>
        <div style={{display:"flex", gap:12, alignItems:"center", flexWrap:"wrap"}}>
          <div style={{display:"flex", gap:8}}>
            <button className={`btn btn-sm ${ageGroup === "adult" ? "btn-primary" : "btn-secondary"}`} onClick={() => setAgeGroup("adult")}>성인용</button>
            <button className={`btn btn-sm ${ageGroup === "child" ? "btn-primary" : "btn-secondary"}`} onClick={() => setAgeGroup("child")}>아동용</button>
          </div>
          <label style={{cursor:"pointer"}}>
            <span className="btn btn-primary">
              {uploading ? (parsing ? "🤖 AI 분석 중..." : "업로드 중...") : "+ PDF 업로드"}
            </span>
            <input type="file" accept=".pdf" style={{display:"none"}} onChange={handleFileUpload} disabled={uploading} />
          </label>
          <button className="btn btn-secondary" onClick={() => setEditingRecord({ id: null, isNew: true })}>+ 수동 입력</button>
        </div>
        <div style={{fontSize:12, color:"var(--ink-muted)", marginTop:8}}>PDF 업로드 시 AI가 자동 파싱 후 즉시 저장됩니다. 오류 시 수동 입력을 이용해주세요.</div>
      </div>

      {/* 수동 입력 / 신규 등록 폼 */}
      {editingRecord?.isNew && (
        <InbodyEditForm
          initialData={{ measured_date: today() }}
          title="✏️ 인바디 수동 입력"
          onSave={(formData) => { saveInbodyRecord(formData, null); setEditingRecord(null); }}
          onCancel={() => setEditingRecord(null)}
        />
      )}

      {/* 기존 기록 수정 폼 */}
      {editingRecord && !editingRecord.isNew && (
        <InbodyEditForm
          initialData={{ ...editingRecord.parsed_data, measured_date: editingRecord.measured_at }}
          title="✏️ 인바디 기록 수정"
          onSave={(formData) => updateInbodyRecord(editingRecord, formData)}
          onCancel={() => setEditingRecord(null)}
        />
      )}

      {/* 변화 추이 차트 */}
      {chartData.length >= 2 && (
        <div className="card" style={{marginBottom:16}}>
          <div className="section-title" style={{marginBottom:12}}>📈 변화 추이</div>
          {COMPARE_FIELDS.map(f => chartData.some(d => d[f.key]) && (
            <div key={f.key} style={{marginBottom:16}}>
              <div className="form-label" style={{marginBottom:8}}>{f.label} ({f.unit})</div>
              <LineChart data={chartData} valueKey={f.key} color={f.color} />
            </div>
          ))}
        </div>
      )}

      {/* 측정 이력 */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">🗂 측정 이력</div>
        </div>
        {records.length === 0 ? <div className="empty">인바디 기록이 없습니다</div> : (
          <div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
              {records.map(r => (
                <button key={r.id} className={`btn btn-sm ${selected?.id === r.id ? "btn-primary" : "btn-secondary"}`} onClick={() => setSelected(selected?.id === r.id ? null : r)}>
                  {formatDate(r.measured_at)}
                </button>
              ))}
            </div>

            <div id="inbody-print-area">
              <h2 style={{fontFamily:"serif", marginBottom:4}}>인바디 분석 결과</h2>
              <div className="sub">{patient.name} · 차트 #{patient.chart_number} · 출력일: {formatDate(today())}</div>

              <div className="section">전체 측정 이력 비교</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>항목</th>
                      {records.map(r => <th key={r.id}>{formatDate(r.measured_at)}</th>)}
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE_FIELDS.map(f => (
                      <tr key={f.key}>
                        <td><strong>{f.label}</strong></td>
                        {records.map((r, i) => {
                          const val = r.parsed_data?.[f.key];
                          const prev = records[i-1]?.parsed_data?.[f.key];
                          const diff = val && prev ? (parseFloat(val) - parseFloat(prev)).toFixed(1) : null;
                          const isBad = f.key === "body_fat_percent" && bodyFatAlert(val, patient.gender);
                          const muscleDrop = f.key === "muscle_mass" && val && prev
                            ? ((parseFloat(prev) - parseFloat(val)) / parseFloat(prev) * 100) >= 5
                            : false;
                          return (
                            <td key={r.id} style={{color: isBad ? "var(--warn)" : muscleDrop ? "var(--warn)" : "inherit"}}>
                              {val != null ? `${val} ${f.unit}` : "-"}
                              {diff && <span style={{fontSize:11, marginLeft:4, color: parseFloat(diff) < 0 ? "var(--accent)" : "var(--warn)"}}>({parseFloat(diff) > 0 ? "+" : ""}{diff})</span>}
                              {muscleDrop && <div style={{fontSize:10, color:"var(--warn)", fontWeight:700, marginTop:2}}>💧 수분 섭취를 늘리세요</div>}
                            </td>
                          );
                        })}
                        <td></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 선택된 측정 상세 */}
              {selected && (
                <div>
                  <div className="section">{formatDate(selected.measured_at)} 상세 결과</div>
                  <div style={{display:"flex", gap:8, marginBottom:12}}>
                    <button className="btn btn-sm btn-secondary" onClick={() => setEditingRecord(selected)}>✏️ 수정</button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteRecord(selected)}>삭제</button>
                    {selected.pdf_url && <a href={selected.pdf_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">📥 원본 PDF</a>}
                  </div>
                  {INBODY_FIELDS.map(f => {
                    const val = selected.parsed_data?.[f.key];
                    if (val == null || val === "") return null;
                    const alert = f.key === "body_fat_percent" ? bodyFatAlert(val, patient.gender) : null;
                    return (
                      <div key={f.key} className="inbody-item">
                        <span className="inbody-label">{f.label}</span>
                        <div style={{display:"flex", alignItems:"center", gap:8, flexWrap:"wrap"}}>
                          <span className="inbody-value" style={{color: alert ? alert.color : "inherit"}}>{val} {f.unit}</span>
                          {alert && <span style={{fontSize:11, color:alert.color, fontWeight:600}}>⚠️ {alert.msg}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// TAB 3: PRESCRIPTION
// =============================================
function PrescriptionTab({ patient, currentUser }) {
  const [pkgs, setPkgs] = useState([]); // 전체 패키지 이력
  const [prescriptions, setAllPrescriptions] = useState([]);
  const [showPkgForm, setShowPkgForm] = useState(false);
  const [showRxForm, setShowRxForm] = useState(false);
  const [pkgForm, setPkgForm] = useState({ package_months: 3, start_date: today() });
  const [rxForm, setRxForm] = useState({ prescribed_at: today(), medicine_type: "hwan", duration_days: 30 });
  const [happycalls, setHappycalls] = useState({});
  const [updates, setUpdates] = useState({});
  const [remainingInput, setRemainingInput] = useState({});

  const load = useCallback(async () => {
    const { data: pkgData } = await supabase.from("packages").select("*").eq("patient_id", patient.id).eq("is_active", true).order("start_date", { ascending: true });
    const { data: rxs } = await supabase.from("prescriptions").select("*").eq("patient_id", patient.id).order("prescribed_at", { ascending: false });
    const { data: hcs } = await supabase.from("happycall_logs").select("*").in("prescription_id", (rxs||[]).map(r => r.id));
    const { data: upds } = await supabase.from("prescription_updates").select("*").in("prescription_id", (rxs||[]).map(r => r.id)).order("created_at", { ascending: false });

    setPkgs(pkgData || []);
    setAllPrescriptions(rxs || []);

    const hcMap = {};
    (hcs || []).forEach(h => { if (!hcMap[h.prescription_id]) hcMap[h.prescription_id] = []; hcMap[h.prescription_id].push(h); });
    setHappycalls(hcMap);

    const updMap = {};
    (upds || []).forEach(u => { if (!updMap[u.prescription_id]) updMap[u.prescription_id] = []; updMap[u.prescription_id].push(u); });
    setUpdates(updMap);
  }, [patient.id]);

  useEffect(() => { load(); }, [load]);

  // 전체 패키지 합산 종료일 계산
  const calcTotalEndDate = (allPkgs, extraMonths = 0, extraStart = null) => {
    const list = [...(allPkgs || [])];
    if (extraMonths && extraStart) list.push({ start_date: extraStart, package_months: extraMonths });
    if (list.length === 0) return null;
    // 가장 이른 시작일
    const firstStart = list.slice().sort((a,b) => a.start_date.localeCompare(b.start_date))[0].start_date;
    const totalDays = list.reduce((s, p) => s + Number(p.package_months) * 30, 0);
    return addDays(firstStart, totalDays);
  };

  const savePkg = async () => {
    if (!pkgForm.start_date) { alert("시작일을 입력해주세요."); return; }
    // 연장: 기존 패키지 유지, 새 패키지 추가
    const endDate = calcTotalEndDate(pkgs, Number(pkgForm.package_months), pkgForm.start_date);
    const { error } = await supabase.from("packages").insert([{
      patient_id: patient.id,
      package_months: Number(pkgForm.package_months),
      start_date: pkgForm.start_date,
      end_date: endDate,
      remaining_months: Number(pkgForm.package_months),
      is_active: true,
    }]);
    if (error) { alert("저장 실패: " + error.message); return; }
    setShowPkgForm(false);
    setPkgForm({ package_months: 3, start_date: today() });
    load();
  };

  const deletePkg = async (pkgId) => {
    if (!window.confirm("이 패키지를 삭제하시겠습니까?\n삭제 후 종료일이 자동으로 재계산됩니다.")) return;
    await supabase.from("packages").delete().eq("id", pkgId);
    // 남은 패키지로 종료일 재계산
    const remaining = pkgs.filter(p => p.id !== pkgId);
    if (remaining.length > 0) {
      const sorted = [...remaining].sort((a,b) => a.start_date.localeCompare(b.start_date));
      const firstStart = sorted[0].start_date;
      const totalDays = remaining.reduce((s, p) => s + Number(p.package_months) * 30, 0);
      const newEndDate = addDays(firstStart, totalDays);
      // 모든 남은 패키지의 end_date 업데이트
      await Promise.all(remaining.map(p =>
        supabase.from("packages").update({ end_date: newEndDate }).eq("id", p.id)
      ));
    }
    load();
  };

  const saveRx = async () => {
    if (!pkgs || pkgs.length === 0) { alert("먼저 패키지를 등록해주세요."); return; }
    if (!rxForm.prescribed_at) { alert("처방일을 입력해주세요."); return; }
    if (!rxForm.duration_days || Number(rxForm.duration_days) < 1) { alert("처방 기간을 입력해주세요."); return; }
    const expectedEnd = addDays(rxForm.prescribed_at, Number(rxForm.duration_days));
    const arrivalHappy = addBusinessDays(rxForm.prescribed_at, 3);
    const reservationHappy = subtractBusinessDays(expectedEnd, 3);
    await supabase.from("prescriptions").insert([{
      patient_id: patient.id,
      package_id: pkgs[0]?.id,
      prescribed_at: rxForm.prescribed_at,
      medicine_type: rxForm.medicine_type,
      duration_days: Number(rxForm.duration_days),
      expected_end_date: expectedEnd,
      arrival_happycall_date: arrivalHappy,
      reservation_happycall_date: reservationHappy,
    }]);
    setShowRxForm(false);
    load();
  };

  const completeRx = async (rx) => {
    if (!window.confirm("복용 완료 처리하시겠습니까?")) return;
    await supabase.from("prescriptions").update({ is_completed: true, completed_at: today() }).eq("id", rx.id);
    load();
  };

  const restoreRx = async (rx) => {
    if (!window.confirm("처방을 진행 중으로 복원하시겠습니까?")) return;
    await supabase.from("prescriptions").update({ is_completed: false, completed_at: null }).eq("id", rx.id);
    load();
  };

  const saveRemainingUpdate = async (rxId) => {
    const days = Number(remainingInput[rxId]);
    if (!days || days < 1) { alert("잔여 일수를 입력해주세요."); return; }
    const newEnd = addDays(today(), days);
    const newHappy = subtractBusinessDays(newEnd, 3);
    await supabase.from("prescription_updates").insert([{
      prescription_id: rxId,
      remaining_days: days,
      new_expected_end_date: newEnd,
      new_reservation_happycall_date: newHappy,
    }]);
    // 입력값 초기화 후 재로드 (반복 입력 가능)
    setRemainingInput(prev => ({ ...prev, [rxId]: "" }));
    await load();
  };

  const toggleHappycall = async (rxId, callType, existing) => {
    if (existing) {
      await supabase.from("happycall_logs").update({ is_done: !existing.is_done }).eq("id", existing.id);
    } else {
      await supabase.from("happycall_logs").insert([{
        prescription_id: rxId,
        call_type: callType,
        is_done: true,
        memo: null,
        no_answer_count: 0,
      }]);
    }
    load();
  };

  const recordNoAnswer = async (rxId, callType, existing) => {
    if (existing) {
      const newCount = (existing.no_answer_count || 0) + 1;
      const memo = window.prompt(
        `미응답 횟수: ${newCount}회\n메모를 입력하세요 (예: 오후 전화 요망, 문자 연락 요망):`,
        existing.memo || ""
      );
      await supabase.from("happycall_logs").update({
        no_answer_count: newCount,
        memo: memo !== null ? memo : existing.memo,
      }).eq("id", existing.id);
    } else {
      const memo = window.prompt(
        "미응답 1회 기록\n메모를 입력하세요 (예: 오후 전화 요망, 문자 연락 요망):"
      );
      await supabase.from("happycall_logs").insert([{
        prescription_id: rxId,
        call_type: callType,
        is_done: false,
        no_answer_count: 1,
        memo: memo || null,
      }]);
    }
    load();
  };

  const activePrescriptions = prescriptions.filter(r => !r.is_completed);
  const completedPrescriptions = prescriptions.filter(r => r.is_completed);

  // 패키지 시각화 (누적 합산)
  const renderPackageProgress = () => {
    if (!pkgs || pkgs.length === 0) return null;
    const totalMonths = pkgs.reduce((s, p) => s + Number(p.package_months), 0);
    const totalDays = totalMonths * 30;
    // 가장 이른 시작일 기준 종료일
    const sortedPkgs = [...pkgs].sort((a,b) => a.start_date.localeCompare(b.start_date));
    const firstStart = sortedPkgs[0].start_date;
    const endDate = addDays(firstStart, totalDays);

    // 복용 완료된 처방의 duration_days 합산
    const usedDays = prescriptions.reduce((sum, rx) => {
      const rxHCs = happycalls[rx.id] || [];
      const reservationDone = rxHCs.find(h => h.call_type === "reservation" && h.is_done);
      if (reservationDone || rx.is_completed) return sum + (rx.duration_days || 0);
      return sum;
    }, 0);

    const remainingDays = Math.max(0, totalDays - usedDays);
    const remainingMonths = Math.round(remainingDays / 30 * 10) / 10;
    const usedMonths = Math.min(totalMonths, Math.floor(usedDays / 30));

    return (
      <div>
        <div className="pkg-status" style={{marginBottom:8}}>
          {Array.from({length: totalMonths}).map((_, i) => (
            <div key={i} className={`pkg-month ${i < usedMonths ? "pkg-month-done" : "pkg-month-remaining"}`}>
              {i < usedMonths ? "✓" : `${i+1}M`}
            </div>
          ))}
          <div style={{marginLeft:8, fontSize:13, color:"var(--ink-muted)", alignSelf:"center"}}>
            잔여 <strong style={{color:"var(--accent)"}}>약 {remainingMonths}개월</strong>
            <span style={{color:"var(--ink-muted)", marginLeft:4}}>({remainingDays}일)</span>
          </div>
        </div>
        <div style={{display:"flex", gap:16, flexWrap:"wrap", fontSize:13}}>
          <div>
            <span style={{color:"var(--ink-muted)"}}>시작일 </span>
            <strong>{formatDate(firstStart)}</strong>
          </div>
          <div>
            <span style={{color:"var(--ink-muted)"}}>침구실 치료 종료일 </span>
            <strong style={{color:"var(--warn)"}}>{formatDate(endDate)}</strong>
          </div>
          <div>
            <span style={{color:"var(--ink-muted)"}}>총 패키지 </span>
            <strong>{totalMonths}개월 ({totalDays}일)</strong>
          </div>
        </div>
        <div style={{marginTop:12, display:"flex", flexDirection:"column", gap:6}}>
          {pkgs.map((p, i) => (
            <div key={p.id} style={{display:"flex", alignItems:"center", gap:10, fontSize:13, background:"var(--surface2)", borderRadius:8, padding:"8px 12px", border:"1px solid var(--border)"}}>
              <span style={{fontWeight:700, color:"var(--ink-light)", minWidth:40}}>
                {i === 0 ? "기본" : `연장 ${i}`}
              </span>
              <span style={{color:"var(--ink-muted)"}}>시작일</span>
              <strong>{formatDate(p.start_date)}</strong>
              <span style={{color:"var(--ink-muted)"}}>·</span>
              <strong>{p.package_months}개월</strong>
              <button
                className="btn btn-xs btn-danger"
                style={{marginLeft:"auto"}}
                onClick={() => deletePkg(p.id)}>
                삭제
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHappycallSection = (rx) => {
    const rxUpdates = updates[rx.id] || [];
    const latestUpdate = rxUpdates[0];
    const reservationDate = latestUpdate ? latestUpdate.new_reservation_happycall_date : rx.reservation_happycall_date;

    const arrivalHC = happycalls[rx.id]?.find(h => h.call_type === "arrival");
    const reservationHC = happycalls[rx.id]?.find(h => h.call_type === "reservation");

    const arrivalToday = isTodayOrPast(rx.arrival_happycall_date);
    const reservationToday = isTodayOrPast(reservationDate);

    return (
      <div style={{marginTop:12}}>
        {/* 도착 해피콜 */}
        <div className={`happycall-card ${arrivalHC?.is_done ? "happycall-done" : "happycall-arrival"}`}>
          <div className="happycall-header">
            <span className="happycall-type">📦 도착 해피콜</span>
            <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
              <span className="happycall-date">{formatDate(rx.arrival_happycall_date)}</span>
              {arrivalToday && !arrivalHC?.is_done && <span className="badge badge-info">오늘!</span>}
              {(arrivalHC?.no_answer_count > 0) && (
                <span className="badge badge-warn">미응답 {arrivalHC.no_answer_count}회</span>
              )}
              <button className="btn btn-xs btn-secondary"
                onClick={() => recordNoAnswer(rx.id, "arrival", arrivalHC)}>
                📵 미응답
              </button>
              <button className={`btn btn-xs ${arrivalHC?.is_done ? "btn-secondary" : "btn-primary"}`}
                onClick={() => toggleHappycall(rx.id, "arrival", arrivalHC)}>
                {arrivalHC?.is_done ? "✓ 완료" : "완료 처리"}
              </button>
            </div>
          </div>
          {arrivalHC?.memo && (
            <div style={{fontSize:12, color:"var(--ink-muted)", marginTop:4}}>
              💬 {arrivalHC.memo}
            </div>
          )}
        </div>

        {/* 예약 해피콜 */}
        <div className={`happycall-card ${reservationHC?.is_done ? "happycall-done" : "happycall-reservation"}`}>
          <div className="happycall-header">
            <span className="happycall-type">📅 예약 해피콜</span>
            <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
              <span className="happycall-date">{formatDate(reservationDate)}</span>
              {reservationToday && !reservationHC?.is_done && <span className="badge badge-warn">오늘!</span>}
              {(reservationHC?.no_answer_count > 0) && (
                <span className="badge badge-warn">미응답 {reservationHC.no_answer_count}회</span>
              )}
              <button className="btn btn-xs btn-secondary"
                onClick={() => recordNoAnswer(rx.id, "reservation", reservationHC)}>
                📵 미응답
              </button>
              <button className={`btn btn-xs ${reservationHC?.is_done ? "btn-secondary" : "btn-danger"}`}
                onClick={() => toggleHappycall(rx.id, "reservation", reservationHC)}>
                {reservationHC?.is_done ? "✓ 완료" : "완료 처리"}
              </button>
            </div>
          </div>
          {reservationHC?.memo && (
            <div style={{fontSize:12, color:"var(--ink-muted)", marginTop:4}}>
              💬 {reservationHC.memo}
            </div>
          )}

          {/* 잔여 일수 업데이트 */}
          {/* 잔여 일수 업데이트 - 항상 표시 */}
          <div className="remaining-input-row">
            <span style={{fontSize:12}}>잔여 한약 일수:</span>
            <input type="number" min="1" placeholder="5" value={remainingInput[rx.id] || ""} onChange={e => setRemainingInput({...remainingInput, [rx.id]: e.target.value})} />
            <span style={{fontSize:12}}>일</span>
            <button className="btn btn-sm btn-secondary" onClick={() => saveRemainingUpdate(rx.id)}>날짜 재산출</button>
          </div>

          {latestUpdate && (
            <div style={{fontSize:11, color:"var(--ink-muted)", marginTop:4}}>
              마지막 업데이트: {formatDate(latestUpdate.updated_at)} → 완료예정일 {formatDate(latestUpdate.new_expected_end_date)}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* 패키지 */}
      <div className="card" style={{marginBottom:16}}>
        <div className="section-header">
          <div className="section-title">📦 패키지 관리</div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowPkgForm(!showPkgForm)}>
"+ 패키지 추가 / 연장"
          </button>
        </div>
        {pkgs && pkgs.length > 0 ? renderPackageProgress() : <div className="empty" style={{padding:12}}>등록된 패키지가 없습니다</div>}

        {showPkgForm && (
          <div style={{marginTop:16, paddingTop:16, borderTop:"1px solid var(--border)"}}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">패키지 종류</label>
                <select className="form-select" value={pkgForm.package_months} onChange={e => setPkgForm({...pkgForm, package_months: e.target.value})}>
                  <option value={1}>1개월</option>
                  <option value={3}>3개월</option>
                  <option value={6}>6개월</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">시작일</label>
                <input className="form-input" type="date" value={pkgForm.start_date} onChange={e => setPkgForm({...pkgForm, start_date: e.target.value})} />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowPkgForm(false)}>취소</button>
              <button className="btn btn-primary btn-sm" onClick={savePkg}>저장</button>
            </div>
          </div>
        )}
      </div>

      {/* 처방 등록 */}
      <div className="card" style={{marginBottom:16}}>
        <div className="section-header">
          <div className="section-title">💊 처방 등록</div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowRxForm(!showRxForm)}>+ 처방 입력</button>
        </div>
        {showRxForm && (
          <div style={{background:"var(--surface2)", borderRadius:8, padding:16}}>
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">처방일</label>
                <input className="form-input" type="date" value={rxForm.prescribed_at} onChange={e => setRxForm({...rxForm, prescribed_at: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">약 종류</label>
                <select className="form-select" value={rxForm.medicine_type} onChange={e => setRxForm({...rxForm, medicine_type: e.target.value})}>
                  <option value="hwan">환약</option>
                  <option value="tang">탕약</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">처방 기간 (일)</label>
                <input className="form-input" type="number" min="1" value={rxForm.duration_days} onChange={e => setRxForm({...rxForm, duration_days: e.target.value})} />
              </div>
            </div>
            {rxForm.prescribed_at && rxForm.duration_days && (
              <div style={{fontSize:12, color:"var(--ink-muted)", marginTop:8}}>
                📦 도착 해피콜: {addBusinessDays(rxForm.prescribed_at, 3)} &nbsp;|&nbsp;
                📅 예약 해피콜: {subtractBusinessDays(addDays(rxForm.prescribed_at, Number(rxForm.duration_days)), 3)}
              </div>
            )}
            <div className="form-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowRxForm(false)}>취소</button>
              <button className="btn btn-primary btn-sm" onClick={saveRx}>처방 저장</button>
            </div>
          </div>
        )}
      </div>

      {/* 진행 중인 처방 */}
      {activePrescriptions.length > 0 && (
        <div className="card" style={{marginBottom:16}}>
          <div className="section-title" style={{marginBottom:16}}>🔄 진행 중인 처방</div>
          {activePrescriptions.map(rx => (
            <div key={rx.id} style={{padding:"16px 0", borderBottom:"1px solid var(--border)"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
                <div>
                  <span className={`badge ${rx.medicine_type === "hwan" ? "badge-success" : "badge-gold"}`} style={{marginRight:8}}>
                    {rx.medicine_type === "hwan" ? "환약" : "탕약"}
                  </span>
                  <strong>{formatDate(rx.prescribed_at)}</strong> 처방
                  <span style={{color:"var(--ink-muted)", fontSize:13, marginLeft:8}}>({rx.duration_days}일분)</span>
                </div>
                <div style={{display:"flex", gap:8}}>
                  <button className="btn btn-sm btn-danger" onClick={() => completeRx(rx)}>복용 완료</button>
                  <button className="btn btn-sm btn-secondary" onClick={async () => {
                    if (!window.confirm("이 처방 기록을 삭제하시겠습니까?")) return;
                    await supabase.from("prescriptions").delete().eq("id", rx.id);
                    load();
                  }}>삭제</button>
                </div>
              </div>
              {renderHappycallSection(rx)}
            </div>
          ))}
        </div>
      )}

      {/* 완료된 처방 이력 */}
      {completedPrescriptions.length > 0 && (
        <div className="card">
          <div className="section-title" style={{marginBottom:12}}>✅ 처방 완료 이력</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>처방일</th><th>종류</th><th>기간</th><th>완료일</th><th></th></tr>
              </thead>
              <tbody>
                {completedPrescriptions.map(rx => (
                  <tr key={rx.id}>
                    <td>{formatDate(rx.prescribed_at)}</td>
                    <td><span className={`badge badge-sm ${rx.medicine_type === "hwan" ? "badge-success" : "badge-gold"}`}>{rx.medicine_type === "hwan" ? "환약" : "탕약"}</span></td>
                    <td>{rx.duration_days}일</td>
                    <td>{formatDate(rx.completed_at)}</td>
                    <td style={{display:"flex", gap:6}}>
                      <button className="btn btn-xs btn-secondary" onClick={() => restoreRx(rx)}>복원</button>
                      <button className="btn btn-xs btn-danger" onClick={async () => {
                        if (!window.confirm("이 처방 기록을 삭제하시겠습니까?")) return;
                        await supabase.from("prescriptions").delete().eq("id", rx.id);
                        load();
                      }}>삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {prescriptions.length === 0 && <div className="empty">처방 이력이 없습니다</div>}
    </div>
  );
}

// =============================================
// TAB 4: VISIT
// =============================================
function VisitTab({ patient, currentUser }) {
  const [visits, setVisits] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ visited_at: today(), treatment_types: [], memo: "" });
  const [treatmentEndDate, setTreatmentEndDate] = useState(null);

  const TREATMENTS = [
    { key: "general", label: "일반 관리" },
    { key: "premium", label: "프리미엄 관리" },
    { key: "herbal_injection", label: "약침" },
    { key: "highfrequency", label: "고주파" },
    { key: "coolsculpting", label: "쿨쎄라" },
    { key: "other", label: "기타" },
  ];

  const load = useCallback(async () => {
    const { data } = await supabase.from("visits").select("*").eq("patient_id", patient.id).order("visited_at", { ascending: false });
    setVisits(data || []);
    // 패키지 종료일 계산
    const { data: pkgData } = await supabase.from("packages").select("*").eq("patient_id", patient.id).eq("is_active", true).order("start_date", { ascending: true });
    if (pkgData && pkgData.length > 0) {
      const totalDays = pkgData.reduce((s, p) => s + Number(p.package_months) * 30, 0);
      const sortedPkgs = [...pkgData].sort((a,b) => a.start_date.localeCompare(b.start_date));
      const firstStart = sortedPkgs[0].start_date;
      setTreatmentEndDate(addDays(firstStart, totalDays));
    } else {
      setTreatmentEndDate(null);
    }
  }, [patient.id]);

  useEffect(() => { load(); }, [load]);

  const toggleTreatment = (key) => {
    setForm(f => ({
      ...f,
      treatment_types: f.treatment_types.includes(key)
        ? f.treatment_types.filter(t => t !== key)
        : [...f.treatment_types, key]
    }));
  };

  const saveVisit = async () => {
    await supabase.from("visits").insert([{ ...form, patient_id: patient.id }]);
    setForm({ visited_at: today(), treatment_types: [], memo: "" });
    setShowForm(false);
    load();
  };

  const treatmentLabel = (key) => TREATMENTS.find(t => t.key === key)?.label || key;

  return (
    <div>
      <div className="card">
        <div className="section-header">
          <div className="section-title">🏥 침구실 치료 기록</div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>+ 치료 기록</button>
        </div>
        {treatmentEndDate && (
          <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:16, padding:"10px 14px", background:"var(--warn-pale)", borderRadius:8, border:"1px solid #f5c6bd"}}>
            <span style={{fontSize:13}}>📅 패키지 침구실 치료 종료일</span>
            <strong style={{color:"var(--warn)", fontSize:15}}>{formatDate(treatmentEndDate)}</strong>
            <span style={{fontSize:12, color:"var(--ink-muted)"}}>
              ({Math.max(0, Math.ceil((new Date(treatmentEndDate) - new Date(today())) / (1000*60*60*24)))}일 남음)
            </span>
          </div>
        )}

        {showForm && (
          <div style={{background:"var(--surface2)", borderRadius:8, padding:16, marginBottom:16}}>
            <div className="form-group" style={{marginBottom:12}}>
              <label className="form-label">치료일</label>
              <input className="form-input" type="date" value={form.visited_at} style={{maxWidth:200}} onChange={e => setForm({...form, visited_at: e.target.value})} />
            </div>
            <div className="form-group" style={{marginBottom:12}}>
              <label className="form-label">치료 종류 (복수 선택)</label>
              <div style={{display:"flex", gap:8, flexWrap:"wrap", marginTop:6}}>
                {TREATMENTS.map(t => (
                  <button key={t.key} className={`btn btn-sm ${form.treatment_types.includes(t.key) ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => toggleTreatment(t.key)}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">메모 / 특이사항</label>
              <textarea className="form-input" rows={3} style={{resize:"vertical"}} value={form.memo} onChange={e => setForm({...form, memo: e.target.value})} />
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>취소</button>
              <button className="btn btn-primary btn-sm" onClick={saveVisit}>저장</button>
            </div>
          </div>
        )}

        {visits.length === 0 ? <div className="empty">치료 기록이 없습니다</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>치료일</th><th>치료</th><th>메모</th><th></th></tr>
              </thead>
              <tbody>
                {visits.map(v => (
                  <tr key={v.id}>
                    <td><strong>{formatDate(v.visited_at)}</strong></td>
                    <td>{(v.treatment_types || []).map(t => <span key={t} className="treatment-tag">{treatmentLabel(t)}</span>)}</td>
                    <td style={{maxWidth:200, color:"var(--ink-muted)", fontSize:12}}>{v.memo || "-"}</td>
                    <td><button className="btn btn-xs btn-danger" onClick={async () => {
                      if (!window.confirm("이 치료 기록을 삭제하시겠습니까?")) return;
                      await supabase.from("visits").delete().eq("id", v.id);
                      load();
                    }}>삭제</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// ADMIN PAGE
// =============================================
function AdminPage({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "staff" });
  const [err, setErr] = useState("");

  const load = async () => {
    const { data } = await supabase.from("users").select("*").order("created_at");
    setUsers(data || []);
  };

  useEffect(() => { load(); }, []);

  const createUser = async () => {
    setErr("");
    const { data, error } = await supabase.auth.admin.createUser({
      email: form.email,
      password: form.password,
      email_confirm: true,
    });
    if (error) { setErr(error.message); return; }
    await supabase.from("users").insert([{ id: data.user.id, name: form.name, email: form.email, role: form.role }]);
    setForm({ email: "", password: "", name: "", role: "staff" });
    setShowForm(false);
    load();
  };

  if (currentUser?.role !== "admin") return <div className="empty">관리자만 접근 가능합니다</div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">계정 관리</div>
        <div className="page-sub">의료진 계정을 관리합니다</div>
      </div>

      <div className="card">
        <div className="section-header">
          <div className="section-title">의료진 목록</div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>+ 계정 추가</button>
        </div>

        {showForm && (
          <div style={{background:"var(--surface2)", borderRadius:8, padding:16, marginBottom:16}}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">이름</label>
                <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">이메일</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">임시 비밀번호</label>
                <input className="form-input" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">역할</label>
                <select className="form-select" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="staff">스태프</option>
                  <option value="admin">관리자(원장)</option>
                </select>
              </div>
            </div>
            {err && <div style={{color:"var(--warn)", fontSize:13, marginTop:8}}>{err}</div>}
            <div className="form-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>취소</button>
              <button className="btn btn-primary btn-sm" onClick={createUser}>계정 생성</button>
            </div>
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead><tr><th>이름</th><th>이메일</th><th>역할</th><th>등록일</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td><span className={`badge ${u.role === "admin" ? "badge-gold" : "badge-muted"}`}>{u.role === "admin" ? "관리자" : "스태프"}</span></td>
                  <td style={{fontSize:12}}>{formatDate(u.created_at?.split("T")[0])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =============================================
// MAIN APP
// =============================================
export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("patients");
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSelectedPatient(null);
    setPage("patients");
  };

  // session.user를 currentUser로 사용 (id, email 포함)
  const currentUser = session?.user ? { id: session.user.id, email: session.user.email } : null;

  if (loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"Noto Sans KR, sans-serif"}}>로딩 중...</div>;

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {!session ? (
          <LoginPage onLogin={() => {}} />
        ) : (
          <div className="layout">
            <aside className="sidebar">
              <div className="sidebar-logo">
                韓醫 Diet
                <span>한의원 환자 관리</span>
              </div>
              <nav className="sidebar-nav">
                <div className={`nav-item ${page === "patients" ? "active" : ""}`} onClick={() => { setPage("patients"); setSelectedPatient(null); }}>
                  👥 환자 목록
                </div>
              </nav>
              <div className="sidebar-bottom">
                <div className="sidebar-user">
                  <strong>{currentUser?.email || "사용자"}</strong>
                </div>
                <button className="btn-logout" onClick={handleLogout}>로그아웃</button>
              </div>
            </aside>

            <main className="main">
              {page === "patients" && !selectedPatient && (
                <PatientListPage onSelectPatient={setSelectedPatient} currentUser={currentUser} />
              )}
              {page === "patients" && selectedPatient && (
                <PatientDetailPage patient={selectedPatient} onBack={() => setSelectedPatient(null)} currentUser={currentUser} />
              )}
            </main>
          </div>
        )}
      </div>
    </>
  );
}
