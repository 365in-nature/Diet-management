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

  const filteredData = data.filter(d => d[valueKey] != null);
  const firstVal = filteredData.length > 0 ? parseFloat(filteredData[0][valueKey]) : null;
  const pts = filteredData
    .map((d, i, arr) => {
      const x = padX + (i / (arr.length - 1)) * (w - padX * 2);
      const y = padY + ((max - d[valueKey]) / (max - min)) * (h - padY * 2);
      const prev = arr[i - 1];
      const diff = prev && prev[valueKey] != null
        ? (parseFloat(d[valueKey]) - parseFloat(prev[valueKey])).toFixed(1)
        : null;
      // 최초 값 대비 변화율
      const diffPct = firstVal != null && i > 0
        ? ((parseFloat(d[valueKey]) - firstVal) / firstVal * 100).toFixed(1)
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
            {showDiff && p.diffPct !== null && (
              <text x={p.x} y={p.y - 20} textAnchor="middle" fontSize="9" fill={parseFloat(p.diffPct) < 0 ? "#2d6a4f" : "#e07a5f"}>
                최초 대비 {parseFloat(p.diffPct) > 0 ? "+" : ""}{p.diffPct}%
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
  .footer { background: #f4f3ef; padding: 20px 48px; font-size: 11px; color: #9090b0; display: flex; justify-content: space-between; margin-top: 0; }

  /* INBODY GRID */
  .ib-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .ib-card { background: #faf9f6; border: 1px solid #e8e6e0; border-radius: 10px; padding: 14px 16px; }
  .ib-label { font-size: 10px; color: #9090b0; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .ib-val { font-size: 20px; font-weight: 700; }
  .ib-warn { color: #e07a5f; }
  .ib-ok { color: #2d6a4f; }
  .ib-warn-msg { font-size: 10px; color: #e07a5f; margin-top: 2px; font-weight: 600; }

  @media print {
    @page {
      margin: 15mm 12mm 20mm;
      size: A4 portrait;
      @bottom-center {
        content: counter(page) " / " counter(pages);
        font-family: 'Noto Sans KR', sans-serif;
        font-size: 10px;
        color: #9090b0;
      }
    }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 0; }
    .no-break { page-break-inside: avoid; break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div style="page-break-after:always;height:100vh;min-height:297mm;background:#f4f3ef;display:flex;flex-direction:column;justify-content:space-between;padding:0;margin:0;position:relative;overflow:hidden;">
  <!-- Decorative elements -->
  <div style="position:absolute;top:-40px;right:-40px;width:200px;height:200px;border-radius:50%;background:rgba(26,26,46,0.06);"></div>
  <div style="position:absolute;bottom:80px;left:-60px;width:240px;height:240px;border-radius:50%;background:rgba(82,183,136,0.08);"></div>

  <!-- Top section -->
  <div style="padding:48px 48px 0;">
    <div style="font-size:10px;letter-spacing:3px;color:#9090b0;text-transform:uppercase;margin-bottom:4px">365 Nature Korean Medicine Clinic</div>
    <div style="width:40px;height:2px;background:#52b788;margin-top:8px;"></div>
  </div>

  <!-- Center section -->
  <div style="padding:0 48px;flex:1;display:flex;flex-direction:column;justify-content:center;">
    <div style="font-size:11px;letter-spacing:2px;color:#52b788;margin-bottom:14px;text-transform:uppercase">韓醫 Diet · 건강관리 리포트</div>
    <div style="font-size:36px;font-weight:300;color:#1a1a2e;line-height:1.2;margin-bottom:6px">${patient.name} 님의</div>
    <div style="font-size:36px;font-weight:700;color:#1a1a2e;line-height:1.2;margin-bottom:32px">다이어트 관리 기록</div>
    <div style="width:60px;height:3px;background:#1a1a2e;margin-bottom:32px;"></div>
    <div style="font-size:12px;color:#6a6a8a;line-height:2.0;">
      <div>차트번호 &nbsp;<span style="color:#1a1a2e;font-weight:600">#${patient.chart_number}</span> &nbsp;·&nbsp; ${patient.gender === "female" ? "여성" : "남성"}</div>
      ${goal ? '<div>관리 시작일 &nbsp;<span style="color:#1a1a2e;font-weight:600">' + formatDate(goal.start_date) + '</span></div>' : ''}
      <div>출력일 &nbsp;<span style="color:#1a1a2e;font-weight:600">${formatDate(today())}</span></div>
    </div>
  </div>

  <!-- Bottom section: logo centered -->
  <div style="padding:32px 48px;border-top:1px solid rgba(26,26,46,0.1);display:flex;justify-content:center;align-items:center;">
    <img src="data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAQ8FAADASIAAhEBAxEB/8QAHQABAAMBAQEBAQEAAAAAAAAAAAcICQYFBAMCAf/EAGkQAQABAwICBAUIERAHBgUCBwABAgMEBQYHEQgSITEJE0FRYRgiN3F1gbO0FBUXMjY4Vld0dpGSlaWy0dIWIzVCUlViZ3KChJOUodPkM0NHhbHE1CRUY3ODoiVTo8HDNETC8CZk8eGk/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ALlgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//Z" alt="365자연안에 한의원 양산점" style="height:36px;opacity:0.85;" />
  </div>
</div>

<div class="body">

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
            {!showGoalForm && goal.target_weight && (() => {
              const startDateWeight = (() => {
                if (!measurements.length) return null;
                const sorted = [...measurements].sort((a,b) => a.measured_at.localeCompare(b.measured_at));
                const startDate = goal.start_date;
                if (!startDate) return sorted[0]?.weight;
                const closest = sorted.reduce((a, b) =>
                  Math.abs(new Date(a.measured_at) - new Date(startDate)) <= Math.abs(new Date(b.measured_at) - new Date(startDate)) ? a : b
                );
                return closest?.weight;
              })();
              const chartHeight = measurements.find(m => m.height) ? measurements.find(m => m.height).height : null;
              if (!startDateWeight) return null;
              return <WeightProjectionChart
                currentWeight={startDateWeight}
                targetWeight={goal.target_weight}
                height={chartHeight}
              />;
            })()}
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
            {gForm.target_weight && (() => {
              const startDateWeight = (() => {
                if (!measurements.length) return latestWeight;
                const sorted = [...measurements].sort((a,b) => a.measured_at.localeCompare(b.measured_at));
                const startDate = gForm.start_date;
                if (!startDate) return sorted[0]?.weight;
                const closest = sorted.reduce((a, b) =>
                  Math.abs(new Date(a.measured_at) - new Date(startDate)) <= Math.abs(new Date(b.measured_at) - new Date(startDate)) ? a : b
                );
                return closest?.weight;
              })();
              const chartHeight = measurements.find(m => m.height)?.height;
              if (!startDateWeight) return null;
              return <WeightProjectionChart
                currentWeight={startDateWeight}
                targetWeight={gForm.target_weight}
                height={chartHeight}
              />;
            })()}
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
                const firstWeight = arr[arr.length - 1]?.weight; // reversed이므로 마지막이 최초
                const diff = prev && m.weight && prev.weight ? (m.weight - prev.weight).toFixed(1) : null;
                const diffPct = firstWeight && m.weight && i < arr.length - 1
                  ? ((parseFloat(m.weight) - parseFloat(firstWeight)) / parseFloat(firstWeight) * 100).toFixed(1) : null;
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
