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
        const w = 500, h = 110, padX = 50, padY = showPctChange ? 30 : 16;
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
  .chart-block { margin-bottom: 10px; }
  .chart-label { font-size: 10px; font-weight: 600; color: #4a4a6a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .chart-wrap { background: #faf9f6; border-radius: 8px; padding: 6px 10px; border: 1px solid #e8e6e0; height: 90px; overflow: hidden; }
  .chart-wrap svg { display: block; width: 100%; height: 90px; }
  .chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px; }

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

  /* CHART SIZE — compact for print */

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
    @page :first { margin: 0; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .cover-page { page-break-after: always; break-after: page; }
    .section-block { page-break-inside: avoid; break-inside: avoid; }
    .no-break { page-break-inside: avoid; break-inside: avoid; }
    .section-block:last-child { page-break-after: avoid; break-after: avoid; }
    .footer { page-break-before: avoid; break-before: avoid; page-break-after: avoid; break-after: avoid; }
    .chart-wrap { overflow: visible; padding: 4px 8px; }
    .chart-wrap svg { width: 100%; height: 100%; }
    .chart-block { margin-bottom: 8px !important; }
  }
</style>
</head>
<body>

<!-- COVER PAGE: 밝은 톤, 인쇄 친화적 -->
<div class="cover-page" style="width:100%;height:100vh;min-height:297mm;background:#f5f8f5;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden;border-left:8px solid #2d6a4f;">

  <!-- 배경 장식: 연한 원 -->
  <div style="position:absolute;top:-60px;right:-60px;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle,rgba(45,106,79,0.07) 0%,transparent 70%);"></div>
  <div style="position:absolute;bottom:-80px;right:80px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(82,183,136,0.08) 0%,transparent 70%);"></div>
  <div style="position:absolute;top:40%;left:-40px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(45,106,79,0.05) 0%,transparent 70%);"></div>

  <!-- 상단: 한의원 로고 영역 -->
  <div style="padding:52px 60px 0;position:relative;z-index:1;">
    <div style="display:inline-flex;align-items:center;gap:14px;background:#fff;border:1px solid #d4e8d8;border-radius:40px;padding:10px 22px 10px 14px;box-shadow:0 2px 12px rgba(45,106,79,0.08);">
      <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCANAAdgDASIAAhEBAxEB/8QAHQABAAICAwEBAAAAAAAAAAAAAAcIBQYBBAkDAv/EAFsQAAEDAgIEBQ0JDAkDBAIDAAEAAgMEBQYRBwghMRI3QVFhExQiNnF0dYGRobKzwRgjMkJWYnOTsRUWFzVScoKDkpTD0SQzQ1NUlaLS0zRVhERjwuEloyYn8P/EABsBAQACAwEBAAAAAAAAAAAAAAAFBgMEBwIB/8QAOBEAAgIBAgMGBAUEAQQDAAAAAAECAwQFERIhMQYzNEFRcRMygbEUIlJhoRVCkdFTFiPB8CRD4f/aAAwDAQACEQMRAD8A1nEGJcRsvtwYy/3VrBVSAAVcgAAceldL758S/KK7fvsn818MR9sVy77l9MrHqyKEduhyqds+J82Zf758S/KK7fvsn80++fEvyiu377J/NYhF94V6Hn4s/VmX++fEvyiu377J/NPvnxL8ort++yfzWIROFeg+LP1Zl/vnxL8ort++yfzT758S/KK7fvsn81iEThXoPiz9WZf758S/KK7fvsn80++fEvyiu377J/NYhE4V6D4s/VmbixdiuHPqOJ73Fnv4FdIM/I5dmLHmNohkzFl7359lWyO+0la2i+cEfQ+q+xdJM3Kn0paQYDnHiq4b8+zId6QKylJps0jU+Wd8bNl/eQMP2AKOUXl01vrFGWOdkx6Tf+SX6LWFxzDl1zFbKkDngLT5is/b9ZW5AgV+G6Z7eeGdzT581AKLHLFqfkbENYzI9JstHbdZHDMuXX9kuVLz9TLZfaFtVq02aOa/IOvvWjz8Sogezz5EedUyRYpYFT6G5X2jy4/Nsy/lpxNh27DO2Xy21v0NSx58gKy7XAjMHMLztY5zCCCQRuIWw2XHGL7MR9zcRXGBo3M6sXN8jswsEtPf9siQq7Tr/wCyH+C+SKpNi1gcb0HBZWsobm0f3sfBd5W5KQcPayGH6ktZe7JX0LjsL4C2Zg6TnkQPKteWHbHy3JSnXcO3k5be5Oq5C1LDekbBWIOC22YionyO3RSP6m/9l2RW1Me1zA5jmuB3EbQteUHF7NEpXdXYt4S3P2iIvJlCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIDz6xH2xXLvuX0yseshiPtiuXfcvplY9WaPQ5NP5mS3oS0T27SBYq241l2qaJ9NVdRDYo2uBHBDszn3VIHuabLn2y3D6li7Gp32lXjwj/DYpxUPkZNkbGky76ZpeLbiwnOG7ZA3uabL8pbj9SxPc02X5S3H6hinrIJkFh/F3fqN7+jYX6PuQL7mmy/KW4/UMT3NNl+Utx+oYp6yCZBPxd36h/RsL9H3IF9zTZflLcfqGJ7mmy/KW4/UMU9ZBNifi7v1D+jYX6PuQIdWmy5Hg4muAPJnAwrqzastMQOo4vmZz8OgDvseFYQIn4u79R8ei4T/s+5Wup1Z69oPW2K6Z+/8ArKRze5ucViqvVxxdGC6C62ifmBe9p87clapcFe1nXLzMUtAwn0jt9SnldoI0h0+bmW+lqG/+3UtJ8hyWuXDRnjugaXVGGLgWj4zI+EPNmrzrjIcy9x1CxdUa0+zWM/lk0efFba7nQk9fW+rpcv76FzPtC6S9D5aeCZuU0Ecg+c0Fa7eNH+CruHdf4ZtkpO9zYAx/7Tcis0dRX90TSs7MSXyT/wAlEkVub1q+4Drc3UUdfbXZbOo1Be3yPzPnWi3zVsr2Eus2IYJhyNqYiw9zNuYWeObVLz2I67QMyvot/YgBFIGINDukC0cJ77E+rjHxqR4k8w2rRq2kq6KodT1lLPSyjfHNGWOHdByWzGyMujIu3Gtq5Ti0fEEg5hbJhvHuL8PPBtV+rIWD+zc/hsPda7MLWkSUVLkzzC2db3g9mTxhTWOvFMWQ4js0FdHuM1K7qUndLTm0nuZKXMJaX8DYj4EcF2bR1Dv7GsHUznzZnYfKqWItWzCrl05Evja/lU8pPiX7nohFIyWNr4nte0jMFpzB8a/aojhTHmLcMSA2a91UMYO2F7uqRnusOYUzYM1jWu4FPiq08A7Aamj3d0sd7CtKzBsjzXMsOL2gxruU/wAr/gsQnIsDhTF2HMT04msl2p6vZm5jX5Pb3WnaFn1puLi9mTkLI2LeL3QREXw9hERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREB59Yj7Yrl33L6ZWPWQxH2xXLvuX0yserNHocmn8zLR6nXaVd/CP8ADYpxUHanXaVd/CP8NinFQOV3rOjaR4KHscoiLXJMIiIAiIgCIiAIiIAiIgCIiAIiIDhdC7We1Xan6hdLbSV0R+JPC2QecFZDauF9Ta5o8yjGS2kiKcS6B8C3Rr30VNPapTudTyEtz/Ndmq/aY9HUmj25UUBuLa6GtY90TuBwXN4JAIPlV1wFWvXK/G2HPoJ/SYt/Dum7FFvkVzW9Px4Y0rYR2aK/rlcLOYDssWI8YWyxzTPhjrZxEZGDMtz5RmpWTUVuyl1wc5KMerMGuVLWM9AuMLKH1Fr6leqUZn3nsZQOljt/iJUWV9HV0FQ6mraaanmYcjHIwtI8RXmFsJr8rM2RiXY72si0fmjqqmjqGVNHUzU87DmySF5Y5p5wRtClrAunvFFl6nTXsMvVIMhw5OxnA/OG/wAaiBcJOqE+UkfcfMuxnvXLYu5gTShhLGDWQ2+4sgriNtJUEMk8Wex3iW8BedjHOY8OBIIOYI3hSho/02Yrwz1OmrZfuxQDIdSqH++NHzX7/Ko67Aa5wZZ8LtGn+W9bfui4YXK0bR/pQwrjKNsdBXCmrcuyo6jsJAejkcO4t5CjpQlF7SRZqb67o8Vb3QREXwyhERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQHn1iPtiuXfcvplY9ZDEfbFcu+5fTKx6s0ehyafzMtHqddpV38I/w2KcVB2p12lXfwj/DYpxUDld6zo2keCh7HKIi1yTCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAeRVq1yvxrhz6Cf0mKyp5FWrXK/GuHPoJ/SYtnC75EPr3gpfT7lf1uOhPjXw53632rTluOhPjXw53632qat7tlFwvEQ90Xj5s1g8U4Tw9iemMF6tVPVjLIOezJ47jhtCznIirqbi90dPnXGyO0luiueOtXM5yVWELlnvPWVWfM2QfYR41B+JsNX3DdYaW9Wyoo5AcgXs7F/cO4q/i6N4tNtvFI6kulDT1lO8bY5ow4edbtWdOHKXMgMzs9Rb+ar8r/g8+UVl9IOr1b6kSVuEKt1HLtPWc5Loj0NdvHcOagDFOGb5hmuNHfLbPRSbeAXjsX5crXbipKq+Fq5MquXpuRiP/ALkeXquhiopJIpGyRSPY9hzDwciDzghS/o3074gsHUqLEDH3m3jIcMnKeMdDj8LuH9pQ6uV7sqjYtpIw42XdjS4q5bF8sGYxw9i6gFXY7hHUbM3RHsZGdDmnaFsPKvPizXS42evjrrXWT0lTGc2yRP4JCsNot0/RVLorZjVrKeXY1lfGMmO/PaNx6RsUVdhShzhzRb9P7QV3bQu/K/4LBIuvRVVPW00dVSzRzQSNDmSRuDmuB5QQuxvC0SxJprdBERD6EREAREQBERAEREAREQBERAEREAREQBERAEREB59Yj7Yrl33L6ZWPWQxH2xXLvuX0yserNHocmn8zLR6nXaVd/CP8NinFQdqddpV38I/w2KcVA5Xes6NpHgoexyiItckwiIgCIiAIiIAiIgCIiAIiIAiIgCIiAHkVatcr8a4c+gn9JisqeRVq1yvxrhz6Cf0mLZwu+RD694KX0+5X9bjoT418Od+t9q05bjoT418Od+t9qmre7ZRcLxEPdF5BuRBuRVw6kgiIgOFjb7ZbVfbe6hu9BT1tM/eyZgcO6OY9IWSRE2uaPMoqS2kVx0k6vj2dVr8Fz8MbT1jO/b3GPP2FQHdLfXWuulorjST0lTEcpIpWFrge4V6FLWcc4Iw7jGiNNeqFkrwCI52djJH3Hexb9OdKPKfMrmf2ert3nRyfp5FEUUoaUNDOIcImWuoGPu1oG3q0Y98iHz2j7RsUYKVrsjYt4sqGRjW48+CxbM3TRtpKxHgipDaKpdUW9zs5aOUkxnnLfyT0hWs0b6RsPY4og631AgrWtzmo5XASM6R+UOkKjy7Furay3VsVbQVM1NURODo5Y3lrmkcxC178SFvNcmSOn6zdiPhfOPp/o9DEUC6ItO1NXmGzYxeymq3ZNirsso5DyB+XwT07lO8b2SMD2ODmuGYIOYIUPbVKp7SLxiZtWVDjrZ9ERFjNsIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiA8+sR9sVy77l9MrHrIYj7Yrl33L6ZWPVmj0OTT+Zlo9TvtKu/hH+GxTiN6p1og0tSaPrLV25libchU1PV+qGq6lwexDcsuCc9y3j3TU/wAjI/8AMT/xqIyMW2VjaRdNN1fEpxoQnLZr9mWOzTNVw903P8jY/wDMT/xJ7puf5Gx/5if+JYfwV3obv9dwv1/wyx+aZquHum5/kbH/AJif+JPdNz/I2P8AzE/8SfgrvQf13C/X/DLH5pmq4e6bn+Rsf+Yn/iT3Tc/yNj/zE/8AEn4K70H9dwv1/wAMsfmmarh7puf5Gx/5if8AiT3Tc/yNj/zE/wDEn4K70H9dwv1/wyx+aZquHum5/kbH/mJ/4k903P8AI2P/ADE/8SfgrvQf13C/X/DLH5pmq4e6bn+Rsf8AmJ/4k903P8jY/wDMT/xJ+Du9B/XcH9f8Mscirl7pqf5GR/5if+Jbxoc0tyaQb1WW51hbbut4BLwxVdVz25ZZcELzLFtit2jLTq+JfNQhLdv9mSsiIsBJhERADyKtWuV+NcOfQT+kxWVPIq1a5X41w59BP6TFs4XfIh9e8FL6fcr+tx0J8a+HO/W+1actx0J8a+HO/W+1TVvdsouF4iHui8g3Ig3Iq4dSQREQBERAEREB+XAOBBGYKhzSvoOtOIxLc8OmO13Q5uLMsoZj0gfBPSFMiL3XbKt7xZrZOLVkw4LFuigGJsP3bDd0ktt6oZKSoYdzxseOdp3EdKxSvpjbB9ixha3W+90TZmZHgSDZJEedruRVQ0raJ75gieSrja+4Wgu97qmDawHcHgbj07lL4+XG3k+TKTqWi24u84c4/YjpStog0xXTB8kVsuxkuFlJA4OeclOOdhO8fNUUrlbM642LaRF42TZjTU63sz0Aw5e7ZiC1RXO0VcdTSyjNrmnPI8xHIRzLJqi2jjHl9wNdRVWybh07yOuKWQnqco9h5ire6OcdWPHFobW2uYNnYB1emeffIj0jlHMVDZGNKp7roXvTNWrzFwy5S/8AehtqIi1SYCIiAIiIAiIgCIiAIiIAiIgCIiAIiIDz6xH2xXLvuX0yseshiPtiuXfcvplY9WaPQ5NP5mEWfw1g7E+I6WWqsdmqbhBE/qb3RAEB2WeRz6Csr+CzSF8k7h+yP5rw7YJ7NmWGLdNcUYNr2NLRbp+CvSF8k7h+yP5p+CvSF8k7h+yP5p8Wv1R6/BZH6H/g0tFun4LNIXyTuH7I/mupdtHmNbTb5rlcsOVtNSQt4UsrwMmjPLM7UVsG9kxLEvit3B/4NWREXs1gi22h0bY6rqSOrpMMV80EzA5kgAyc07iNq+/4LNIXyTuH7I/mvHxYepsLDva3UH/g0tFun4K9IXyTuH7I/mn4K9IXyTuH7I/mnxa/VH38Fkfof+DS0W6fgr0hfJO4fsj+afgr0hfJO4fsj+afFr9UPwWR+h/4NLU46nvbnd+8R6YWhfgs0hfJO4fsj+alvViwdifDmKLlU3uy1NBDLSBjHSgAF3Czy2LXybIOppMkdJxbo5cJSg0t/QsMiIoQ6CEREAPIq1a5X41w59BP6TFZU8irVrlfjXDn0E/pMWzhd8iH17wUvp9yv63HQnxr4c79b7Vpy3HQnxr4c79b7VNW92yi4XiIe6LyDciDcirh1JBERAEREAREQBERAcZr41MENTC6CoiZLFI0hzHtDmuB5CDvX2IQIfGk0Vt0y6DXU7Zr7guBz4Rm+a3DaW85j5x83yKv72ua4seC1wORB2EEL0SyUQaadDtFixkt4sTY6O9AEvG5lT0O5ndKkcbN2/LMq2qaEpb2465+n+ipSyuFr/dsM3iG6WasdTVUR3jaHDla4coPMurdrbXWm4zW+40stNUwuLZIpBkQQuopRpSRUU51T3XJouloh0nWrHdvbES2ju8Tc5qVzt/O5nO37FIS89rTcK21XGC4W6pkpquF4dFLGci0q22hLStR40pm2y5GOmvkTM3R55NnA3uZ7QojJxHD80ehddI1pZG1VvzfclRERaJYwiIgCIiAIiIAiIgCIiAIiIAiIgPPrEfbFcu+5fTKx6yGI+2K5d9y+mVj1Zo9Dk0/mZaPU67Srv4R/hsU4qDtTrtKu/hH+GxTioHK71nRtI8FD2OchzJkOZEWuSZwVounviixF3u302reytE098UWIu92+m1ZKe8Xuaub4efs/sUlREViOXrqXy0adoFi7xi9FbEFrujTtAsXeMXorYgq5Z8zOp4/dR9kc5DmTIcyIvBnGQ5kyHMiIBkOZERAEREAREQA8irVrlfjXDn0E/pMVlTyKtWuV+NcOfQT+kxbOF3yIfXvBS+n3K/rcdCfGvhzv1vtWnLcdCfGvhzv1vtU1b3bKLheIh7ovINyINyKuHUkEREAREQBERAEREAREQBERAR9pd0aWnHluL3BlJdoWkU9W0f6X5b2/Yqg4sw9dsMXqe03mlfT1ER7rXDkc08oPOr/AHKtQ0nYCs+O7MaO4N6lVRgmnqmDs4ne0c4W5jZTre0uhA6to8cpfEr5S+5RpfeiqqihrIqyjmfDPE8OjkYci0jcQVlca4Wu2Er3NarvA5kjSeBIPgSt5HNPKCsGppNSW66FFlCdU9nyaLc6CtLFPjClZZrxI2C+Qt5djalo+M3p5wpbXnlRVVTQ1kVZRzPhnicHxyMORaRygq3OgvSlT40tzbZc3NhvlOz3xu4TtHx29POFEZeLwfnh0Lno2sfGSpuf5vJ+pKqIi0CyhERAEREAREQBERAEREAREQHn1iPtiuXfcvplY9ZDEfbFcu+5fTKx6s0ehyafzMtHqddpV38I/wANinFQdqddpV38I/w2KcVA5Xes6NpHgoexyiItckwVomnviixF3u302reytE098UWIu92+m1ZKe8XujWzfDz9n9ikqIisRy5dS+WjTtAsXeMXorYgtd0adoFi7xi9FbEFW7PmZ1TH7qPsjlEReTMEREAREQBERAEREAPIq1a5X41w59BP6TFZU8irVrlfjXDn0E/pMWzhd8iH17wUvp9yv63HQnxr4c79b7Vpy3HQnxr4c79b7VNW92yi4XiIe6LyDciDcirh1JBERAEREARFw4gDMnYgOVx3Fq2ItIOC7A50d1xFQQys+FE2Tqkg7rW5kLSrjrCYFpnFtM241Z5HMgDWnxuIPmWWNNkuiNO3PxquU5pfUl5cqDTrH4Z6oALNcXMy2uzb9i71DrEYJmcBUU90ps+UwhwHdyK9PGtX9phjq2HJ7KxExrlaXh/SfgO9uayixLQtld8GKof1FxPMA/LM9xbix7JGhzHNcDuIOYWGUJR6o3a7q7VvCSZ+0RF8MpqukjBNoxvYZLdc4w2VoJp6hrezhfyEc45xyqmOOML3TCN/ntF0hIkjOccgHYys5HNPMVfZajpQwNbMdYffQVrWsqYwXUtSB2UT/AOR5QtvFyXU9n0IPV9Jjlx44fOv5KNLtWq4VtquMFwt9TJT1VO8SRSMORBC7uLsO3TC1+qLNdoDFUQu38HZI3kc08oKxCmk1JblDanVPZ8mi6OhfSPSY6sYbM6OG8UzQKqEbA757R+SfMpDXn/ha/XPDV9p7zaagwVVO8EczhytcOVp5QrqaMsbW7HOG4rnRlsc7cm1MHCzdE/m7h5CobKxvhvePQvOjaqsqPw7PmX8m2oiLTJ8IiIAiIgCIiAIiIAiIgPPrEfbFcu+5fTKx6yGI+2K5d9y+mVj1Zo9Dk0/mZaPU67Srv4R/hsU4qDtTrtKu/hH+GxTioHK71nRtI8FD2OURFrkmCtE098UWIu92+m1b2VomnviixF3u302rJT3i90a2b4efs/sUlREViOXLqXy0adoFi7xi9FbEFrujTtAsXeMXorYgq3Z8zOqY/dR9kcoiLyZgiIgCIiAIiIAiIgB5FWrXK/GuHPoJ/SYrKnkVatcr8a4c+gn9Ji2cLvkQ+veCl9PuV/W46E+NfDnfrfatOW46E+NfDnfrfapq3u2UXC8RD3ReQbkQbkVcOpIIiIDhcOIaCScgF17lW0tuoZq2tnjp6eFhfJI85BoHKVVfTJpouGJZpbNhySShtAJa6UHKSp6T+S3o8qzU0SteyI/P1CrDhvPr5IlbSVpww9hl8tBacrxc2bC2M+8xH5z+U9AVe8aaT8ZYqke2tustPSuJypqYmNmR5DltPjWlIpirFrrXJcykZmr5GU+b2XogiL6U8E87+BTwySv5mMLj5lsdCMScj5oskLBfSOE2y3Ijn61f/JdSppKqlPBqaaaE/wDuMLftXxNPzPrrmubR8FtGEMe4rwrK02e8TxQg7ad54cZ/ROzyLV1yvkoqXJnqu2dT4oPZlotG+n603Z8dvxRELXVnINqG7YHnp5W/YpsgliqIWTQyNkjeM2vYcwQeUELzwUkaJdLF6wTUR0dQ6Svsxd2dM49lGOUsJ3Ho3FR9+Cmt4Fm07tDJNQyOa9S5iLFYavlsxHZ4LraKplTTTNBDm7weYjkI5Qsqoxpp7Mt8Zqa4ovkaFpi0d0OO7CYwGw3SmaTSVGW47+AfmnzKml6ttbZ7pUWy4wOgqoHlkrHbwf5L0I8aiTWA0YsxfbXXm0xAXulZsA2dcMHxT0jkW7iZXA+CXQr+taSsiPxql+ZfyVGW1aMsaXDA2JorrRlz4HZNqqfPZNHyjujkK1iZj4pHRytLHsJDwRkQRvBX4UtKKmtmUquydM1OL2aPQDDN8t2IrJTXi1zialqGBzXco5wRyEcqyip9q/aSJMHX0Wu5Sk2WueBJwj/USHYJB0flK3scjJY2yxuD2OAII2gjnCgsil1S28joumZ8c2ri/uXU+qIiwEkEREAREQBERAEREB59Yj7Yrl33L6ZWPWQxH2xXLvuX0yserNHocmn8zLR6nXaVd/CP8NinFQdqddpV38I/w2KcVA5Xes6NpHgoexyiItckwVomnviixF3u302reytE098UWIu92+m1ZKe8XujWzfDz9n9ikqIisRy5dS+WjTtAsXeMXorYgtd0adoFi7xi9FbEFW7PmZ1TH7qPsjlEReTMEREAREQBERAEREAPIq1a5X41w59BP6TFZU8irVrlfjXDn0E/pMWzhd8iH17wUvp9yv63HQnxr4c79b7Vpy3HQnxr4c79b7VNW92yi4XiIe6LyDciDcirh1JBfN72xsc95AYASSdgAX0UHa0WO32eytwrbZ+BWV7CaksO1kJ2cHo4X2LJVW7JKKNXMyY4tTtl5Eb6f9J82LLo+x2mYsslM8jhNdl108fGPzRyKJFwin6641x2RzbKybMmx2TfNhbto70ZYnxs9stvpet6HPJ9ZPm2Pp4P5R7i3fQNofOIRHiLE8D2WvPOmpj2JqfnH5n2q0FHTU9HSx0tLBHTwxNDWRxtDWtaNwAG4LTyc1Q/LDqTml6E70rbuUfTzZFeDdA2DbKxk10ikvdWMiTOeDED0MG8d3NSXbrLabdC2K32yjpYxubFC1oHkCyCbVFztnN7tlupxKKFtXFI4DWgZcELq1ttoK2Mx1dFTzsO8SRh2flXbXK8btGdwi1s0Rhi3Qjga+sc+C3m01LgcpaM8FufSw9iR5FAWkrQ/iXBzJKyNn3Ttg/9TAw5xj57d47u5XLK/LmNewseA4EZEHaCFs1Zdlb5vdEVmaLjZK3S4X6o87UVjtO2hmF0FRiXCVK2KRoL6qhjbseBtL4wNx5wq5EEEtcNqmKbo2rdFHzcGzDs4J/R+pvmhvSJX4EvrCXvmtNQ8Crpujdw28zh51c21V9JdLdBcKCZk1NOwPikbuLSvPVT7qrY8fT15wXc584JuFJQOefgP3uj7h3jpWpm46a449Sa0HU3XNUWPk+n7MswiIokupXPWZ0ZAdWxrY6fZvuMLG//ALQB/q8qruvQ6eOOeF8MzBJG9pa5pGYIOwghU809aO34KxF11QxH7jVriYDyRO3mM9zk6FK4WTuuCRTNe0v4b+PWuT6kZqy+rFpHNbTMwZeZ86mFp6wledsjBtMZPO3k6FWhdi31lTb62Guo5nw1EDxJFIw5FrgcwQtu6lWx2ZCYGbPDuVkenn7HoYFytI0PY3p8c4Tirs2sr4AIqyIfFkA3j5p3hbtyKAnFxlszpNN0boKcHyZyiIvhlCIiAIiIAiIgPPrEfbFcu+5fTKx6yGI+2K5d9y+mVj1Zo9Dk0/mZaPU67Srv4R/hsU4qDtTrtKu/hH+GxTioHK71nRtI8FD2OURFrkmCtE098UWIu92+m1b2VomnviixF3u302rJT3i90a2b4efs/sUlREViOXLqXy0adoFi7xi9FbEFrujTtAsXeMXorYgq3Z8zOqY/dR9kcoiLyZgiIgCIiAIiIAiIgB5FWrXK/GuHPoJ/SYrKnkVatcr8a4c+gn9Ji2cLvkQ+veCl9PuQAtw0J8a+HO/W+1actj0aXejsWPLPd7g5zKWlqQ+UsHCIaOYDepq1NwaRRMWSjdBv1RfEdxPEor/D5o6/x1b+6PXP4fNHX+Orf3R6gfw9v6WdF/qWL/yL/JJdxq4KChnrKp4ZBBG6WR55GtGZKofjzEFRinFtyvlSXZ1M7jG139nGNjW+IKddL+mfDF6wHX2jDtVUvrKsCI8OBzAGE9ltKrepLBpcE3Jcyr9oM+F7jXXLdLm9vU4UkaAsAnGuKuq1kZ+5Nv4MlUeSRx+DH48tvQo4AJIDRwiTkArtaEsKx4U0f0FGYw2qqGCoqTltL3DPLxDZ4lky7fhw5dWaWi4Kysj83yrmbrBFHTwMhhY1kcbQ1jQMgANgAX1RFCHQ0tgiIgCIiAIiID8nzKq2s1o9ZYrsMUWmDgW+ueRUMYMhDMduYHIHfarVLC41sNLibDFfZKsN6nVQuYHEZ8B3xXeIrPj2uqe5H6lhRy6HF9fL3KCrs2ytqLdcaevpZHMnp5GyxvbvDgcwuLjST2+4VFBVRlk9PK6KRh5HNORC66nuTRzfnCX7ovxgW/Q4mwnbr3ARlVQNc4cz9zh4is4oF1RsQskw1dLDVTsZ1nUNmh4bwOwkG0DPmLc/0lOPX1Hl/wBVT/WBQF1bhNo6VgZUb8eE2+bR2Vg8b4bt+LMNVdkuTA6GZvYu5WPHwXDpBWT6+o/8VT/WBOvqP/F0/wBYFjjunujZn8OcXGW2zKGYxw9cMLYiq7LcoiyenfkDySNO5w6CFh1bLWPwZQ4qw792bfNTm7W1jiAJBnNFvcw9I3hVO3Kdx7fiw38znWp4X4S5xXR9DctEONqjA+LoLgC99DKRFWRD40ZO8dLd4V2aCrgrqOGspJWTQTMEkcjdzmkZgheeasfqq496qw4Juc2cjA6Wgc472ja6PxbwtbOo3XGiW7P6j8OfwJvk+nuWGREUSXQIiIAiIgCIiA8+sR9sVy77l9MrHrIYj7Yrl33L6ZWPVmj0OTT+Zlo9TrtKu/hH+GxTioO1Ou0q7+Ef4bFOKgcrvWdG0jwUPY5REWuSYK0TT3xRYi73b6bVvZWiae+KLEXe7fTaslPeL3NbN8PP2f2KSoiKxHLl1L5aNO0Cxd4xeitiC13Rp2gWLvGL0VsQVbs+ZnVMfuo+yOURF5MwREQBERAEREAREQA8irVrlfjXDn0E/pMVlTyKtWuV+NcOfQT+kxbOF3yIfXvBS+n3K/oiKdOeBERNz7wsIiIfDZNGFqbe9IFktj28KOasZ1RvzAeE7zBXvaA0ADcqbatEQl0yWhzv7OOdw7vUXD2q5W9RGoSbmkXbszWljyn6s5REWgWUIiIAiIgCIiAIiICmmslamWrSvcXRDJlYxlUByZuGR84zUaqbtb+NjcbWuUDsn0Rz8T1CKsGM3KqLZzPVIKGXNL1PpFLLESYpXsz38AkfYvp15V/4qf6wrros2yNFSa8zsdeVf+Kn+sKdeVf+Kn+sK66L5svQ+8cvU+/XlX/ip/rCvgiL6fG2+rC7lmuFXabpS3OhlMdTTStlicORwOa6aI0mtmIycXui+GjfFNNjDCNHe6ctDpG8GaMf2cg2OatkVR9WbGxw7i37iVs2VuuhDRmdjJviu8e4q3A51AZNTqnt5HR9KzVl46k+q5M5REWAkwiIgCIiA8+sR9sVy77l9MrHrIYj7Yrl33L6ZWPVmj0OTT+Zlo9TrtKu/hH+GxTioO1Ou0q7+Ef4bFOKgcrvWdG0jwUPY5REWuSYWiaeuKHEPe7fTat75VHmsRKItEN62kcNrG93N7Vkp7yPuamc9seb/ZlLURFYjmC6l8tGnaBYu8YvRWxcq1fRNP1xo4sE2Y7Khj3dAyW0hVuz5mdTxnvTF/sgiIvJnCIiAIiIAiIgCIiAHkVatcr8a4c+gn9JisqeRVq1yvxrhz6Cf0mLZwu+RD694KX0+5X9bfoZijm0o4ejmY2WN1Y0Fr25gjbvBWoLcdCfGthzv1vtU1b8jKLh9/D3RdMWOzf9pof3dn8k+4dm/wC00P7uz+SyI3Iq7xM6d8KHoVP1tKWmo8dW1lLTxQMNuBIjYGgnqj9uxQ0ps1v+362+DR6x6hNT2L3SOc6sksyaXqSdqxccNs+in9U5XHCpxqxccNs+in9U5XHCjc/vfoWns34R+/8AoIiLSLCEREAREQBERAEREBVvXA7crT3kfTUHKcdcDtytPeR9NQcp7F7qJzfWPGz9zatFGH6LFGO7fZLgZBS1DnBxjdk7YM9hVifc8YH/AL+6fXj+SrXgDEkmE8U0d+ipWVL6YkiJ54IOYy3hTD7pe4/Jil/eHfyWHJjdKX5OhuaXbgQqayVz39PI3P3PGB/7+5/Xj+Se54wP/f3T68fyWl+6WuPyYpf3l38k90tcfkxS/vLv5LB8PK9SU/E6N6L/AAzdPc8YH/v7p9eP5LCY60GYPsuD7rdqSa4melpnyxh8wIzA5diw3ul7j8mKX94d/JY3FOn+uv2Ha6zPw7TwsrIXRGQTklufLlkvsa8riW7Md2RpDg1FLfb0ZCSIilCoH6je+ORr2OLXtIILdhBHKrq6DsYtxlgWmqZng19L/R6tvLwwNju44bVShSXq74v+9bHcFPVScCguWVPNnuDiewd4itXLp+JDddUTGiZv4bISfSXIuUiA7EUGdDCIiAIiIDz6xH2xXLvuX0yseshiPtiuXfcvplY9WaPQ5NP5mWj1Ou0q7+Ef4bFOKg7U67Srv4R/hsU4qByu9Z0bSPBQ9jlERa5JgKIda2tbTaMetg7J9VVxsHcGbj9il3lVb9ca7g1VjsbHfBY+qkbzZngtPmctjFjxWoi9Yt+HhzfryK9oiKeOcF0dXWuFdojszs8zA18J6OC4hSGFBGp7d+r4Zu9me7sqSqbM0fMkbls8bCp3G1V/Jjw2yR0vTLVbiQl+xyiIsJIBERAEREAREQBERADyKtWuV+NcOfQT+kxWVPIq1a5X41w59BP6TFs4XfIh9e8FL6fcr+tx0J8a+HO/W+1actx0J8a+HO/W+1TVvdsouF4iHui8g3Ig3Iq4dSRVbW/7frb4NHrHqE1Nmt/2/W3waPWPUJqfxe6ic21fxk/ck7Vi44bZ9FP6pyuPyqm2rI5o0x2oE74pwOk9ScVcnlUbn979C09m/CP3f/gIiLSLAEREAREQBERAEREBVvXA7crT3kfTUHKcNcEj78rT3kfSUHqexe6ic31jxs/cIshYbNc77c47ZaKR9XVyg8GJjgCchmd+S2n8EWkf5K1f1sf+5ZpTjHk2aVePbYt4Rb9jRkW9fgi0kfJSr+sj/wByfgi0kfJSr+sj/wBy+fGr9UZPwWT+h/4ZoqLevwRaR/krV/WR/wC5da56Mce2ygnrq7DlTBTQML5ZHPZk1o3nY5fFbBvqj48PIS3cH/g05ERZDWC5BIILTkQv3PBNBwOrRlnVGCRmfK07ivmgaaZdbQZi377tH9FUTSZ11K0U1Vt2l7RkH/pDb3VvyqJqxYsNhx4y01EuVHdgIdu4Sj4B8e5W7zUDlVfDsaR0bR8z8VjJvquTOURFrkqEREB59Yj7Yrl33L6ZWPWQxH2xXLvuX0yserNHocmn8zLR6nXaVd/CP8NinFQdqddpV38I/wANinFQOV3rOjaR4KHscoiLXJM4JCpFpxxAMSaTrvWxycOnikFNTnPMcCMcHMdBPCP6StNppxVHhPANfXtk4NVM3qFKOUyOGWY7gzPiVI3uc9xe45uJzJ6SpPT6+s2VLtLlLaNC92cIiKTKiShqz4gFk0mU8E0nAp7lEaZ2Z2cL4TD5QriBeeNFUzUdZDWU7iyaCRskZHIQcwr26PcRQYqwfbr5A5p6vCOqD8mQbHtPcIKitQr2kpouXZrKUoSpflzRsSIiji0hERAEREAREQBERADyKtWuV+NcOfQT+kxWVPIq1a5X41w59BP6TFs4XfIh9e8FL6fcr+tx0J8a+HO/W+1actx0J8a+HO/W+1TVvdsouF4iHui8g3Ig3Iq4dSRWTXGoyzEFhrsuxlpZIielrgf/AJKBVa3Wzs767AVNc42hzrfVBzvzXjgnz5KqSnMKXFUjnuu1OGZJ+vM3LQlcm2rSrh+rc7JvXQiJ5hICw+krxDJeeFLM+CoiniPBfG8OYekHNXwwBfocTYQtt6hcD1xA0v6HjY4eVauoQe6kS/Zm9cM6n7mwIiKNLWEREAREQBERANyJyrqXOup7bb6ivq5BFT08bpJHnkaBmSi5nltJbsqbrT3JtZpSkpmO4TaOljiPQ49kftUTrK4tvE2IMTXK91GfDrKh0uR5ATsb4hsWKViqjwwSOX5t3xr52LzbJX1VqM1GlWGfLMU1JK8+McEfarfbOZV11OrM7g3y/wAjNhLKSF3P8Z/8NWKCiM2XFay76BVwYab83uERFqE2DuWq6W+LTEHeMn2LajuWq6W+LTEHeMn2L3X86NfK7mfsyiiIisZy3zJf0gYU660H4RxdSxe+UsHW9XkN8bnHgOPcOz9NRArk6LbRT37QJbLRVAOiqqB0Rz5Mycj4lUS/W2ps17rLXVNLJ6SZ0TgecHJauLbxOUX5MmdVxPhxruj0kl/nY6tPNJT1Ec8MhZJG4PY8HIgg5ghXs0a4jjxXgu3Xphb1SaICZo+LINjh5VQ9WE1Q8T8CpuOE6iT+sb11Sg842PA/0leM6rir4l5GXs9l/CyPhvpL7lkURFDF8CIiA8+sR9sVy77l9MrHrIYj7Yrl33L6ZWPVmj0OTT+Zlo9TrtKu/hH+GxTioO1Ou0q7+Ef4bFOKgcrvWdG0fwVfsE3bSiiXWJ0hNwph51ntsw+7FewtblvgjOwvPSdwWKuDnJRRt5OTDGqdk+iIc1lMbDE+MBbKKXhW21cKNpB2SSn4bvNkFFC5JJJJPCJOZK4Vgrgq4qKOaZWRLItdkurMvg6w1mJ8TUFiotktVKG8Pg5hjd7nHoA2rq3u21Vnu1XbK1vAqKWV0Ug6QctnQrF6qGCzR2+bGFfFwZqsGKjBHwYweycO6dniWF1r8FdbVsGMqCDKGciGu4PI/wCK493d3VrrKTu4P/dySlpM44KyPPrt+xAKnHVWxsLVe5cJ10vBpLg7qlMSdjZgMiP0gPKoOX1pppaaojqIJHxTRuD43sORa4HMELPdWrIOLI/DypYt0bY+R6Ib0UeaEsfQ44wvG+oext1pWtjrIxyncHgczvMVISr84OEnFnS6LoXVqcHyZyiIvJmCIiAIiIAiIgB5FWrXK/GuHPoJ/SYrKnkVatcr8a4c+gn9Ji2cLvkQ+veCl9PuV/W46E+NfDnfrfatOW46E+NfDnfrfapq3u2UXC8RD3ReQbkQbkVcOpIw2L7LDiHDVxss/B4FXA6PM/FcR2J8R2qhl0oqi2XKpt1XGYqimlfFKw7w5pyIXoXyqsWtXgl1Fd2YwoIsqerIjrOCPgyAZBx7oW/gWqMuB+ZW+0WE7KldFc4/YghTnqs48ba7nJhG5ThtLWv4dG5ztjJeVvcd9qgxfuGSSGVkkbyyRhBY8HIgjcQpO6tWQcWVLDypYtytj5HoiuVDWgbSxT4noobFfahsV6iaGske7IVQG4j5/OOVTIoCyuVctmdIxcqvKrVkHyOURF4NkIiIAiIgOFAmtRjttHbRgy2zf0qpAfWuafgR7ww9Lt/cW6aZtJtvwNbHQU7o6m9TNPW8HCz4Gfx38w5hyqnt2uFZdblUXK4TvqKmokMksj97nFSGHjOT45dCs67qka4Oit831/Y6i/TGue9rGBxJIAA5SV+VKmrfgl+J8ZsudZDwrZayJZCRsfL8RntPQpOyahFyZUsXHlkWxrj1ZY7Q3ho4V0e2y2PblUGPq1R9I/afJuW55ouCq7KTnJtnTqalVWoR6I5REXwyg7lqulvi0xB3jJ9i2o7lqulvi0xB3jJ9i91/Ovc18ruZ+zKKIiKxnLfMu3oH4pMP97e0qD9bPDP3OxfS4igj4MFzi4EuQ2CZmzP9JvB/ZU4aBh//AFLh7vb2ldfT9hwYj0a3GJjOFUUjeuoct+bNpHjHCULXZwZDf7l9ysb8TpqS6pJr6FLFn9Ht+lwzjS1XyMu/o1Q0yDhZcJh7F48YLlgFypmUVJbMolc3XNSXVHodSzxVNPFUQuD45WB7XDlBGYK+p51GmrjiH7v6NKRsjuFU0DjSS7dvY7WnyEKTOVVyyPBJpnUca5XVRsXmgiIvJnPPrEfbFcu+5fTKx6yGI+2K5d9y+mVj1Zo9Dk0/mZaPU77Sbx4R/hsU4qDtTvtKvHhH+GxbxpU0kWXAluJqHipuMjf6PRsd2Tuk/kt6VBXxc72kdC026FGBCc3skjsaVMd23AuH311UWy1koLaSmz2yvy5eZo5SqXYlvdxxDeqm8XWczVVQ8ucTuA5GgcgHIuxjLE12xXe5bteagzSvJ4DPixN5GtHIAsKpPGxlUufUqWq6pLMntHlFdAtx0SYKqscYtgtrA9lFGRJWSgfBjHJnzncFrlitNfe7tT2u2U7qirqHhsbRznlPQOVXU0TYIosDYXitsREtZJk+rny2ySfyG4JlZCqjsup60fTXl28UvlXX/RtVBR09BRQ0VHEyGngjEccbBkGtAyAHcXVxHaKK/wBkq7RcIhLTVUZjeD07iOkbwskihE2nuX9wi48DXIoZpCwvXYPxTV2Wtafe3ZxSZbJYz8FwWvq52m7R7DjvDmdM1jLvRgupJDs4XPG48x8xVN6+kqaCsmo6yB8FRA8xyRvGRa4bCCpzGvVsefU55qunyw7eXyvoZfAuKblhDEdPeLY/J0ZyliJ7GZnKx3QVdTAeLLTjLD8V2tUocHACWIns4n8rXD//AGaoctm0dY0u+CL+y52yThRuyFRTk9hMzmPTzHkXnKxlat11MukarLDlwz5wf8F7UWraO8b2TG1oFdapx1VgAnp37JIXcxHNzFbTyqFlFxezL7VZC2KnB7pnKIi+GQIiIAiIgB5FWrXK/GuHPoJ/SYrKnkVatcr8a4c+gn9Ji2cLvkQ+veCl9PuV/W46E+NfDnfrfatOW46E+NfDnfrfapq3u2UXC8RD3ReQbkQbkVcOpI4WNxDaKG/WeqtVyhbNSVMZjkaeY8o5iN4KyZK4RNp7o8yipLhfQotpPwVcMDYlltlY176Z5LqWoy2Ss5PGOULVFe7SHg20Y0sMlqukW3a6CZrezhf+U0/aOVU70i4FveCLu6hukBdA4nraqYPe5mjlB5DzhTeLlKxcMupQtW0mWLNzgt4P+DWIpJIpWyRSPZIwgtex2RBHKCFO2i/T7V2+KG2YwZLWQNAa2uZtlA+ePjd3eoGRZ7aY2LaSI7FzbsWXFU9i/eGsS2HElIKqy3Wmro8syI3jhN7rd48azIXnlRVdXQ1DamiqpqWdm6SF5Y4dwhbvZtMGkK1sayO/y1DBuFSwSec7VHT097/lZZqO00GtrY/4LrLkqoY1gNIPBI6rbc+frYfzWLu2mrSJcGuZ92xTA7+t4Ws8+1Y1gWb89jZl2kxUuSZb+9Xi12WjdWXWvpqOnbvknkDR3BnvPQoL0l6wFPFHJb8FxGWQ5g18rMmjpY07z0lV7ut0uV1qjU3Svqq2Y/2k8hefOuoturBhF7y5kPmdobrVw1LhX8n3uVdWXKtlrbhVS1NVK4uklkeXOcTzkrroszhDDN5xVd4rXZaN9RO47TuZGOVz3cgC3W1FbvoQEYztnsubZxg7DtzxVf6azWqF0s87tp4PYxt5XuPIAruYAwrb8H4ZprLb2jgxjOWTLIyvO9x7qw+ibR5bMB2bqMOVRcJgOuqojIvP5LeZo5lvChsrJ+K9l0L5o+lrEhxz+d/wcoiLTJwIiIAdy1XS3xaYg7xk+xbUdy1XS3xaYg7xk+xe6/nRr5Xcz9mUUREVjOW+ZdzQLxSYe729pW6ysbIxzHtDmkEEEZgg8i0rQLxSYf729pW8qu3fO/c6fhc8aHsihukywuw1jy8WbgObHBUudDwuWN3ZMPkK1xT5rf2EQ3i14jiYODPGaaY/Obtb5ioDU5jz460znmo4/wCHyZQ/f+CbtUa/mhxjX2CSTKG40/VI2n+9j27O60u/ZVphkqD4CvLrBjK1Xdjsutqlrn/m55HzK+kErJoI5oyHNkaHNPOCMwo3Phwz4vUtnZzI48d1v+37H1REWiWI8+sR9sVy77l9MrHrIYj7Yrl33L6ZWPVmj0OTT+Zkj6PdKNZgjBVfZ7TSh1wrKsyiok2tibwGt2N5XbO4Fod1uNddbhNcLlVSVNVM7hSSyHMkrqIvMa4xbaXNmWzJssgq5PkvILtWq31l0uMFvt1NJUVU7w2ONgzJJXcwth+7YmvEVrs1HJU1Eh5NzB+U48gCttod0WWvA1IKubg1l6lZlLUubsjB3sZzDnPKsN+TGlfubunaXZmT9I+bPloQ0X0uB7b17W8GovdS0dWk3iEfkM9p5VJqJyKDnOU5bs6Bj49ePWq4LZI5REXkznChrT9onbimF+ILDE1l5iYeqxAZCqaP/mOTnUzLhe67JVy3RrZWLXlVuua5HnfUQy088lPURviljcWOY8ZEEbCCF+FbfTVofocXsku9mEdHe2jM8jKjofzHmKqnebXcLNcZrfc6SSmqonZPjkGRH/0pyi+Ny5dTn2oabbhz2lzj6n3w5fLrh26x3Oz1klJUxnY5h3jmI5R0KzuizTpZsQMituIzHarnsaJC73mY84PxT0FVPRLseFvU+YOpXYct4vl6eR6IxvbIwPY4OaRmCDmCF+1SXAWlTF+ECyGjruu6Ib6SqzezL5pzBb4lPODtPuE7w1kN5ZNZaojb1Ts4s+hw9oUXbh2Q5rmXHD1zGvW0nwv9yYUXRtN2tt2p+r22vpqyL8qGUPHjy3LvLUaa5MmIyjJbpnKIiHoHkVatcr8a4c+gn9JisqeRVq1yvxrhz6Cf0mLZwu+RD694KX0+5X9bjoT418Od+t9q05bjoT418Od+t9qmre7ZRcLxEPdF5BuRBuRVw6kjhCoe026WrngHElJa6G1UlYyalE5dK9wIPCLctncWhe6UxB8nbb9a9bEMWycd0iKu1nFpscJy5os8sZiKyWvEFrltl3o46qmkG1j27jzg8h6VD+ibTVdsZY4pLBVWaipYZ2SOMkT3Fw4LC4b+4pzXiyudUtn1NrHyac2tyhzj0KuaS9AN2tkktwwk91yo9rjSv2TR9DeR486hWtpKqhqn01ZTTU8zDk+ORhaR4ivQ3asFifCOHMSwdTvdopazZkHPZk8dxwyIW3TnyjynzITN7OV2Pioe37eRQlFaHEWrhhuqc6Sy3ivtxO6OUCdjegbneUlaVcdXHFMLiaO72ypZyZlzHePZkt2GZVLzIG3Q8yt/Lv7EJIpaOr9j7P4Fv/eAu/Q6umMJiOubja6YcubnOPmC9vJqXmYI6TmSeyrZCy+kMUs0rY4Y3yyPOQYwZknoAVlbBq3WeFzX3zEFZV5HMxUsbYh3C48I5eRSnhPAWEsLtH3GslNBKBl1ZzeHIf0jmVgnn1rpzJHH7O5Nj3s2iit2jjQZiTET46y9h1ntxyPvgzmkHQ3k7pVm8F4UseErW23WSjZBHs4bztfIedzuUrPbkUbdkztfPoWjB0ujDW8Fu/VnKIiwEkEREAREQHC1bS3xa4g7xk+xbSVi8VWll+w5XWaSZ0LauF0RkaMy3PlyXqDSkmzDfFzqlFeaZ5/orK+5ntnyqq/3Vv8AuT3M9s+VVX+6t/3KZ/G0+pQ/6Dm7/L/KJG0DcUuH+9vaVvOSweCLCzC+FaCxRVDqllHH1MSubwS7bnnkFnCoeySlNtF6xYSrpjGXVIjzWHsX3c0WXQMbwp6Joq49n5G13+nhKly9Da2nirKSWlnYHxTMcx7TytIyIVA8SWyWy4guFpmz4dHUPhJPLwTkD41JadPdOJVe01G1kbV58jHK7eg2+fd/RhZqt7uFNFF1vLnv4UZ4PnAB8apIrJand5L7derA9/8AVStqoh0OHBd9jVlzocVe/oanZ2/4eVwP+5Fg0RFCl9PPrEfbFcu+5fTKx6yGI+2K5d9y+mVj1Zo9Dk0/mYUn6MNDWIsXGKurWPtdpdkerSs98lHzGn7TsW76qOE7DdLXX32426Grraas6lC+UcJsYDGuzDTszzJ2qx2WzIKOycxxbhEs2laHG6CutfJ+RruCcH2DCFrbQ2ShbCMh1SU7ZJDzudy/YtiTYgzyUW5OT3ZcK641xUYrZHKIi+HsIiIAiIgOFqGkbR/h/HFu6hdKYMqWD3mrjblJGe7yjoK29F9jJxe6MdtULYuE1umUp0l6LMSYJkfUVFOa22Z9jWQAlrR88fF8exaCvRGRjJWFkjQ5pGRBGYI5lEukHQThnEBkq7R/+FrnbfeW5xOPSzk8Sk6c/flYVPO7OSTcsd/QqQi3zGmifGuFnSSVNqfW0bM/6VSe+My53AbW+MLRHtcwkOBaRyFSELIz5platosplwzjszs2+419vnbPQV1RSTDc+GQsI8YW62XTHpFtQDI8RS1MY+JVxNm/1EcLzrQFykq4y6oVZN1XySa+pM1FrF4ziaBU0FpqOlsbmE/6ipC0O6ZLpjjGLbHWWikpYzTvl6pFI4nNuWzI91VXUsaqnGuzvKb2LUvx61W2kTGnanlTyYQlNtNlvDyKtWuV+NcOfQT+kxWU5lWvXK/GuHPoJ/SYo/C75Fl17wUvp9yv63HQnxr4c79b7Vpy3HQnxr4c79b7VNW92yi4XiIe6LyDciDcirh1JFVtb/t+tvg0eseoTU2a3/b9bfBo9Y9Qmp/F7qJzbV/GT9yTtWLjhtn0U/qnK44VONWLjhtn0U/qnK44Ubn979C0dm/CP3/0ERFpFhCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiA4VPNZ2zi16UqqpY3KO4RMnH52XBP2K4ar7ri2rhW+yXtjNscj6aR3QRwmjzOW3hT4bUvUhNfp+Jht+nMrapR1ZLt9zdKlJA5/Bjron05HOcuEPOFFyy2D7ibPiq13MO4PW1VHIT80O2+ZTFseODRSMO34V8J+jRf9F+IXiSJkg3OaCPGirh1FPdHn7iPtiuXfcvplY9ZDEfbFcu+5fTKx6s0ehyefzMtHqddpV38I/wANinFQdqddpV38I/w2KcVA5Xes6NpHgoexyiItckwiIgCIiAIiIAiIgCIiA4y5wtWxNo+wfiION1sVJJIf7VreA/u5tyW1J3F9UnF7pmOyqFi2mt0QXftXDDtSS+zXiut5O5sgEzR9h860m6auOLqdxNvutorGDcHufE4+LguHnVqSEWxHMtj5kZboeHY9+Hb2KbVWgzSRA48GywztHxo6uM+YkFbvq+6PcYYY0jNuF7s0lJSto5I+ql7XDhHLIbCVZNcBepZtk4uLMNOgY9NsbIt7o5PIq1a5X41w59BP6TFZU8irVrlfjXDn0E/pMXnC75GXXvBS+n3K/rcdCfGvhzv1vtWnLcdCfGvhzv1vtU1b3bKLheIh7ovINyINyKuHUkVW1v8At+tvg0eseoTU2a3/AG/W3waPWPUJqfxe6ic21fxk/ck7Vi44bZ9FP6pyuOFTjVi44bZ9FP6pyuOFG5/e/QtHZvwj9/8AQREWkWEIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiA4Wv45xZZ8HWSS63io4EYzEcbdr5XcjWjnWP0l6QLJga1GouEolq5Aet6VjuzlPsHSqf4/wAY3rGt8fc7xNnyQQMz6nC3maPtPKtvGxXa930ITVNXhiR4Ic5fYsdoh01UeLbtNZ7zFFbq2SUmjyd2EjORhJ+OPOszrJWsXPRHdXNHCko3R1LP0XAO/wBJcqbRvfFI2WJ5Y9hBBByII5QrHaMdJ0eNMJV+B8TTAXSoo5aemnfuqgWEAH5/2rYtxfhyU4dEReFq34qqWPf1aezK3ouXtc15Y8cFwORHMQuFJlU6MvfouuZvGj2xXJzuE+Whj4Z+eG8F3nBRadqs3E1miinpnb6Kqmhy6CeGPTRV22PDNo6fhWO3HhNeaRVHEfbFcu+5fTKx6yGI+2K5d9y+mVj1Yo9DmM/mZaPU67Srv4R/hsU4qDtTrtKu/hH+GxTioHK71nRtI8FD2OURFrkmEREAREQBERAEREAREQBERAEREAREQA8irVrlfjXDn0E/pMVlSq1a5X41w59BP6TFs4XfIh9e8FL6fcr+tx0J8a+HO/W+1actx0J8a+HO/W+1TVvdsouF4iHui8g3Ig3Iq4dSRVbW/wC362+DR6x6hNTZrf8Ab9bfBo9Y9Qmp/F7qJzbV/GT9yTtWLjhtn0U/qnK44VONWLjhtn0U/qnK44Ubn979C0dm/CP3/wBBERaRYQiIgCIiAIiIAiIgCIiAIiIAiIgOEQ86xOJL/Z8OW19wvVwho6do+FI7IuPM0byegL6k3yR5lOMFxSeyMsdiiLTBpntmFGy2uxuiuF52tO3OOA/OI3kcyjDStpzul+E1qwwZbbbjm11RnlNMO6Pgg9G1QwSSeE47VI4+E/mmVTU+0CSdeN/n/R38QXm53+5zXO71klXVynN0jz5gNwHQFj0WQsNnuV9ucNstNHLV1UrsmxxjPxnmA5SpPlFFU/PbP1bOpTQTVVTHTU0T5pZXBscbBm5zjsAAHKrS6DND8OHI4cQYijE14c3OKE7W0ufL0v6eRZfQxolt+C6dlyuIjrb29u2TLNsGe9rM+XnKlNRWTl8X5YdC5aToiq/7t65+S9Cg2PKH7nY0vNDlwRFWygDmHCJCwqkDWIousdLd4bll1ZzJv2mgqPlJ1PigmVLLr+HfOHo2WT1Oa7h22+25x+BLHKwd0EFFrWqDWGLG1yo89k9FwgPzXA+1FDZi2uZe9Bs4sKK9CIcR9sVy77l9MrHrIYj7Yrl33L6ZWPU5Hoc+n8zLR6nXaVd/CP8ADYpxUHanXaVd/CP8NinFQOV3rOjaR4KHscoiLXJMIiIAiIgCIiAIiIAiIgCIiAIiIAiIgOFgMU4Qw1iiSCS/2iCvfThwiMmfYA78siN+Sz6Im090eJwjNbSW6/c0b8E2jr5KUXld/Ndq06NcDWq4wXGgw5SU9XA8PikaXZsdzjMrb0Xt2za2bMSxKIvdQX+DlEReDYKra3/b9bfBo9Y9Qmps1v8At+tvg0eseoTU/i91E5tq/jJ+5J2rFxw2z6Kf1TlccKnGrFxw2z6Kf1TlccKNz+9+haOzfhH7/wCgiItIsIREQBERAEREAREQBERADmi4XVuNdRW6mdVV9VDTQsG2SV4aB4yiW55bUVuztL4VdTT0kD56maOGJgzc+Rwa0DpJUN471gbBaWyUuHIDeasZt6rmWU7Dz573dweVQBjfH+KcYTE3i5yOgzzZTR9hE39Eb/GtynDnPm+SITN17Ho5Q/M/4J60kafrPauq0OFGC61YzBqDsgjPRyuPmVdMV4mveKbk6vvlwlq5viNJ7GMczW7gFhkUpTjwqXIqWZqd+Y/zvl6LoEX1poJ6qoZBTQyTzSEBkbGkuJPIAFO2ivQHVVjobrjPOmptjm0DP6x/55+KOgbV9tuhUt5Mw4mFdlT4a19fQjTRvo8xBjivEdtg6lRMI64rJG5Rxjo/KdzAK2ujXAFjwPbBT22HqlS8Dq9XIPfJT7B0LZLTbqG1UEdDb6aKmpohkyOMZABdtRF+VK17eReNO0irDXE+cvX/AEcoiLVJgqZrbUnUNJEFTl/1NCx3kJb7FDqn7XJpuBecP1mX9ZBLF+y5p/8AkoCU9iveqJzfWIcGZNfuSbqx1XW2lugBOXVoZYv9OfsRYXQfUdbaWMPSZ5cKr4H7TS32otLNhvYmT+gXqGM0/X/RreI+2K5d9y+mVj1kMR9sVy77l9MrHqVj0KfP5mWj1Ou0q7+Ef4bFOKg7U67Srv4R/hsU4qByu9Z0bR/BV+w5ERYLFOLsOYXgEt8u9NR5jNrHvze7uNG0rAouXJEhOyNa3k9kZ3PJM1BeI9Y6xUpdHZLRU1zhufK4RNPi2laHdtYjGlS4ihpbZQsP/tmRw8ZPsWzHDtl5EVbruHW9uLf2LY7kVLKvTRpJnJ//AJI6Jp5I6aIefg5rrfhc0j/Kqs/YZ/tWX+n2eqNR9pcbyi/4Lt5rlUwo9NukqnIzv7ahoy2SUsR+xoK2S06xmLIMm3G2W2tA3uYHRE+crzLAtXQyQ7RYknz3RapFhMD3s4kwlbb4afrc1tO2UxZ58HPkzWb3rTaaezJyElOKkujOURF8PYREQBERAEREAREQBERAEREBVbW/7frb4NHrHqE1Nmt/2/W3waPWPUJqfxe6ic21fxk/ck7Vi44bZ9FP6pyuOFTjVi44bZ9FP6pyuOFG5/e/QtHZvwj9/wDQREWkWEIiIAiIgC4QrqXG5UFuhM9fW01JCN8k0rWN8pIRJs8uSjzZ21yVG+ItNOj+z8JgvHX8o+JRsMg/a2N86jTE2sjVScKPDtijh5pax/CPd4LcvtWeGNbPoiPv1bEp6z39uZZIkAbStPxbpJwbhhrm3K9U5nbn7xAeqSZjkybu8aqVinSTjbEge25X+r63fvggPUo8uYtbln481qJJJzJzK3K9P85shMntN5Ux+rJ+xnrG1swfT4VtTKZu4VNX2bu6GDZ5c1DOJsUYgxLUmpvl2qq1x3Ne7sR3GjIAdxYZFu10V1/KivZOo5GT3kv9BE3rf8B6JMYYsLJ4aA2+gfk7rqrBY0g8rRvd9iySsjBbtmvTj2Xy4YLdmgKRNHWiLFOMDHU9bm3W0nbU1DCMx8xu8qf9H+hTCeGOBVVkAvFwbkerVLAWNPzWbvGVKDWhoyAAA3AKPuz/ACrLRg9nP7sh/Q0jR1oywxgmBr6Cl64riOzrJwHSE9HI0dAW8bgi5UZKcpveTLTVTXTHggtkERF8MoREQFftcuDhWrDlTl/VzzR/tNaf/iq2K0euJFnga0z5DsLmG58u2KQ+xVbU3hPepHPu0Eds2T9jYNHE/W2kHD02YaGXOnzPQZACi6GGpDDiS2TAhpjrInZncMngovd1fFIw4V/w4NHGI+2K5d9y+mVj1kMR9sVy77l9MrHrYj0I2fzMtHqd9pV38I/w2KZbvc6C0W+a4XKqipaWFvCklkOQaFBuqvdKGy6NL/c7jOynpaevLpJHcgEbPOon0v6Sbnju7uaHPprRC4impc94Hx387j5lESx5XXy9C51anDCwK9+cmuSN50n6fa+4Plt2Dg6jpdrTWPHvrxztB+CPOoPrquqrqp9VWVM1RPIc3ySPLnE9JK+CKTrphWtooquVm3ZUuKx/6CLsW+hrLhUCnoaWeqmO5kbC4+Zb7YtC+kK6tbI2y9aRnlq5Gx+Y7fMvUrIx6sx1Yt1vKEWyOkU30erdit4Bqr1aIehnVHkf6WrWNKuimr0f2ilr6y9U1a+pn6kyGOFzTlwcy7MnkWOORXKWyZsWaXlVQc5w2SI3RF9IInzTshjHCfI4MYOcnYFmZorqXo0SRdS0Y4ZaQAfuXTuOXTG0+1bSF0bDRtt9loaBm6mpo4h3GtA9i7xVbm95NnVaY8NcY+iQREXkyhERAEREAREQBERAEREAREQFVtb/ALfrb4NHrHqE1Nmt/wBv1t8Gj1j1Can8XuonNtX8ZP3JN1Y+OC2fRT+qcrj5jLeF57Wu411qrW1ttq5qSoYCGSxv4LgCMjtCyU+McVzE9UxHdHZ7/wClOH2FYcnEd0+JM3tL1mGFS63HfnuX1fJGwdlI0d12S6tRdLbTt4U9wpYhzvlaPtKoPPe71N/XXevl/PqXn7SulJJJIeFLI955yc1hWnesjdl2oXlX/Jeuux/gm3giqxVaGOHxeumOd5ASVrdx04aOKMkMvklU8fEgpZD5y0DzqmqLItPgurNefaa9/LFItDddZHDcX4tslyqnchlLYh5iVqF41j8RT8Jtss1BSN5HSOdI72BQaizRw6o+Ro265mT/ALtvY3y96XtIN1DmyYgnp4zvZStEY8o2+daZX11bXzmauq6iqmPxppC93ldmusizKuEeiI6zJut5zk39QuVwspZcPXy9SiO1WitrXHd1GEuHlXptJbsxxhKb2itzFopdwvq/41ujmSXJ1JaIDv6s7hyZdDG8vdIUrYU1f8H2rgSXSSqvM7d/VT1OPP8ANb7SVrTy6oee5K4+iZd3Ph2X7lWbRabndqltNbLfVVsxOQZBGXnzKWcF6vuKLoWT3+aKzU5yPU8xJMR3BsHjKs9ZrParNTdb2u301HF+RDGG593LesgtOzPnLlFbE/i9m6Yc7Xv9jQcFaJcGYW4E0FubWVjMj1zV5SOBHKAdgW/AAbNy5RaMpym92yfqorpXDXHZBEReTMEREAREQBERAQxrdsD9GtG7P+rukbh445B7VVFWy1uOLOn8JRehIqmqawO6KD2i8Z9Edi2/jCm+lZ9qLrottrchYy4UZDEfbFcu+5fTKx6yGI+2K5d9y+mVj19j0Pk/mZlGX24x4Ydh2KbgUElUaqVo2GR/BDRwugZbAsWiL4kl0EpuXUAElTdol0F1d8iiu+KnTUNA8BzKVmyWUfOJ+C3zrt6tOjSK6SsxhfacSUkT/wCgwyN7F7x8cg7wDu6VZsZDIDJR2VltPggWjR9FVkVdeuXkjDYZwxYcN0raay2qmo4wN7Gdke647SszkiKMbbe7LdCEYLaK2QVWtbm/CsxfQWON+bKCAvkb89+37A1WXvlypbRZ6u6VrxHTUsLppHHkDRn5VQ7Ft6qMQ4luF7qv6ysndJlzA7h4hsW9gV8U+J+RXu0eUoUqpdZfYxS27Q9aDe9JVjouBwmCqbLJ+azszn5FqSnrVBw+ai83TEcsfvdNGKeE/Pdtdl3AP9SksifBW2VbTKHflQh+/wBizQ3IiKvHTQiIgCIiAIiIAiIgCIiAIiIAiIgKra3+3H1s8Gj1j1CauRpY0SUOP7xT3Oou89DLBTiECOIPBAcXZ7SOdaRLq0UefveKp8vn0o9jlLUZVca1FspWo6PlXZEpwjum/Urcisd7miD5VSfuo/mvrHqz0HBHVMVVJPRSNy9JZvxtPqaK0LNf9v8AKK2IrQ02rbhxp9/vtyl3fBa1v81k6XV5wLFk6Wa6znlDqhoB8jV5edUjJHs9mPqkvqVLRXOo9CWjemyJsHV3D40tVK7zcLJbBb8AYKt+Ro8K2iJw+P1oxzv2iCV4lqEPJGzDsze/mkkUZo6GtrX8CjpKiofzQxl58y2e06NMdXPgupcM1/APx5Y+pj/VkrvU9JSwMDIKeKJo3NYwNy8i++wcgWGWoy8kblfZiC+eb+hUyz6vWNaoh1bNb6Bp38OYvOXcaCt4smrZZoiH3jEFdVc8dNG2IeV3Cz8ynspksEsy2XmSNWhYdfNx39zRMPaJcA2Xgmmw9BNIP7SqJmdnz9lmB4lutLS09LEIqaCOGMbmxsDR5l9kWvKcpdWSdePVVyhFL6HKIi8mYIiIAiIgCIiAIiIAiIgCIiAhzW44s6fwlF6EiqarZa3HFnT+EovQkVTVNYHdFC7ReL+iCIi3CBMhiPtiuXfcvplY9ZDEfbFcu+5fTKx6R6HqfzMLPYAw5UYrxdb7HBwh1xKOqOb/AGcY2ud4gsCrD6oGHWvkuuJpo/gZUkB6fhPI/wBKw5Fnw62zc03G/E5Ma/L/AMFgrTQUtrttNbqKFsNNTRtiiY3c1oGQC7YRcqvt7s6YkktkcJyL8SvZHG6SV4YxozJJyACgvTLpvo7dDPY8ITtqq4gtlrWbY4ehh+M7p3BZKqpWS2ia2XmVYsOOx/8A6YbWk0gx1B+8q0zB7WODrg9h2cIbRH4t5VfF+pZJJpXzSPc+R7i97icySdpJX4U7TUqo8KOdZ2ZLLudkvp+x+4Y5JpWQxML5JHBjGDeSdgAV4ND2FxhDAVutD2tFSWmaqI5ZXbT5N36KgDVjwK+/YlGI66E/c22uBjzbsmn5AOcN3n9FWw6Ao/Pu3fAizdncFwi8iS69PY5REUcWkIiIAiIgCIiAIiIAiIgCIiAIiIDjPn2JmOcKrutXerxbtJFJT0F1uFJE61xPdHBUPY0kySjPJpG3Yol++jE3yivH77J/Nb1eE5xUtyu5XaCGPbKpw32L95jPev0qj6uF9vddpZt9NW3m41UBhmJjmqnvacoyRmCSFbda99Lqlwtknp+cs2r4iW3PY5REWE3wiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAhzW44sqfwlF6Eiqcrn6fcJXjGeCobTZRAallYyY9Vk4A4Ia4Hbt51A/uftIX91bP3r/6Urh2whXs2UzXMLIuyeKuLa2InRSx7n7SH/dWz96/+kW3+Iq/UQv9My/+Nkb4j7Yrl33L6ZWPWUxZH1HFN2hz4XArpm58+TyFi1mj0NOxbSZyrOaEtIOAsK6OLba669RQ13Zy1LepuPZucTyDkHBCrGEWG6lWx2Zt4ObPDnxwSb28y4Ffp60e0zT1KtrKl3NFSu+05BaZf9ZSAMcyw4ckkfyS1soaB+i3PPyhVxRYY4VUepv29oMua2TS9jc8baTcYYtDorndHxUp/wDTU46nH4wNp8a0xEW1CEYLZIiLbrLpcU3uwtr0Z4JueOMRR22iY5lOwh9VUkdjCznPSeQLNaLdE+Ica1EVS+J9vtGYL6uRnwx/7YPwj07lbLBeFbNhGyx2qy0ohhbtc47XyO/KceUrUycuNa4Y9SZ0vRp5MlZYto/c++F7Fb8N2Ols1rhEdNTsDQOUnlcecnlWXC4RQ7bb3Ze4RUIqMehyiIvh6CIiAIiIAiIgCIiAIiIAiIgCIiAqdre8Z1F4Ii9dKobUya3vGdReCIvXSqG1P4vdROa6t4yz3JO1YuOG2fRT+qcrjhU41YuOG2fRT+qcrjhRuf3v0LT2b8I/f/QREWkWEIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiICg2kGIQ49xBCAcmXOpAz35CV+Swa2zS/CYNJ+I4zn/18j9vSeF7VqaskHvFM5VkR4bZL9winnVIt1quk+IYLnbaOtLWwOj64hbIW7ZAcswcs89qnyPBmEmO4TcM2jhd6MPsWpdmqubi0TOHoUsqlWxmluUMDHP8AgtLu4FlLRhnEV3cBa7FcqzP40VK9w8ZAyCvZSWCx0ZBpbNb6cjd1OmY37AsiGgDIBYZaj6RN+vswt/z2f4RUXDGgTHF0e19yjprPAd5nkD35fmtz85Uy4F0G4Sw6+OquEZvNYzbwqgDqYPQzcfGpWTuLVsy7J8t9iXxtFxcd7pbv9z8xsbGxrGNDWgZAAZABftEWsSwREQBERAEREAREQBERAEREAREQBERAEREBU7W94zqLwRF66VQ2pk1veM6i8EReulUNqfxe6ic11bxlnuSdqxccNs+in9U5XHCpxqxccNs+in9U5XHCjc/vfoWns34R+/8AoIiLSLCEREAREQBERAEREAREQBERAEREAREQBERAcbUWpYx0iYRwlcIqDEF2NFUSxCZjOt5JM2EkZ5saRvCwv4cNGPyjd+41H+xe1TOS3SNWebjwlwymk/ckdFo+G9KmBcRXqG0Wa9OqaybPgR9aTMzyGZ2uaBuC3heZRlHk0Zarq7VvCSa/YIsJjHFFkwlbG3K/VhpKR0giEnUnydkQSBk0E8i1P8OGjH5Rn9xqP9i9RqnJbpHi3Loqlwzmk/ckjNFG/wCHDRj8o3fuNR/sRffgWfpZj/qGL/yL/KK46wtMabS7fMxkJJI5B42BaApZ1q6XqGlN8wbsno4nd0jMFRMp2h71Rf7HPdRjwZVi/dk46n1TwcZXelJ2S0If42vH+5WkCqBqr1XW+laCEnIVFLLH5Bwh9it+orOW1u5cez0+LD29GERFpk6EREAREQBERAcIupdrjQ2qglr7jUxU1NE3OSWR2QaFXvSTrBzOfLb8FRBg2h1wnZmf0GHZ4z5Flqpna9oo0svPoxI72P6eZYC83i12elNTdLhTUcI+PNIG+TPeo0xDp8wLbHuio5Ky6yD/AA0eTc/znEeZVUvd5ut7q3VV2uFTWTOOZdLIXfaugpGvT4r5mVfJ7S2ye1MdkWGuGsxIXFtBhJgGex81bmT4gzZ5VjTrJ4j4WzD9ryz3cOTPLu5qC0WdYlS8iOlrWbJ78f2LC0GsxUBwbX4SjcOV0NaQR4iw5+Vbjh/WAwPcXNjrevrXIf7+PhNz/OaT51UlF5lg1S6Iy1a/mQfN7noDY75aL3TCptNypq2IjPhQyB3lHIsmM158Wm63O0Vbaq2V9RRTtOYkhkLD5lOOjfWDrad8dBjSEVMOwCugYA9v57RsPdC07cGUeceZPYfaKq18Nq4X/BZZF0LHdrdebdFcLXVxVVNKM2SRuzHc6D0LvrRaaezLDGSkt4nKIi+HoIiICp2t7xnUXgiL10qhtTJre8Z1F4Ii9dKobU/i91E5rq3jLPck7Vi44bZ9FP6pyuOFTjVi44bZ9FP6pyuOFG5/e/QtPZzwj9/9BERaRYQiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiICq2uD2/2vwY31r1CamzXB7f7X4Mb616hNT2L3MTm+seNsJF1cOOCzfrfVlXPVMNW/jgs3631ZVz1H6h3i9izdmvDS9yHdbjizp/CUXoSKpqtlrccWdP4Si9CRVNW5gd0QnaLxf0QREW4QJPGuJRlmI7LXBuySlfGT0h2ftUDqz2uJQmXC1muAGyCrdGT+e3MegqwrWw5b1Il9chwZsv35m7aDa0UGlawTF3BY+pEZ7jgQrvcma8/MMVht+I7bXZ8HqFVHIT0BwJXoBA8SQskbuc0ELT1GP5kyc7MWb1Th6Pc+iIiji0BERAEREBwsHjXFFpwjYprveJxFDGMmtz7KR3I1o5SV373c6KzWqoudwmENLTRmSR55AFSrSzjqvx1iSStmc+OhhJbR0+eyNnOfnHlK2cbHd0ufQidV1OOFXy5yfQ/WlDSLe8dXN0lZK6nt0bj1CjYewaOd3O7pWlov01rnODWguJOQA5VNxgoLZHP7rrLpuc3u2flfprXPdwQCTzBTJov0E3e/siueI3vtdvdk5sGXv0o58viju7VYTB+AMKYWjYLRaKdkrR/XyDhynp4R3eJatubCD2XMl8LQcjIXFL8q/kp3Z8BY0u0bZKDDF0kjfukdTljT3HOyCzH4HNJWXatP9fF/vV1gByBCtV6jPyRNR7M0Jfmkyid20fY3tTHSVuFrqyMb3MgMjR3S3MBay9rmvIewgjeCMivRIgcq1rFmB8LYoicLzZ6ed5H9cGcGQfpDavcNR5/mRr39mVtvVP8AyUQRTfpO0CXS0NluOFHvuVG3NzqV39cwfN/K+1QlIx8cjmPYWPByIIyIIW/XbGxbxZW8rDtxZcNq2Nr0a4+vmBrsKq3TukpHEdcUbyepyjucjuYq4mAsX2jGdgjutpma5vwZonHs4X8rXD7OdUOW06M8aXLA+JIrnQuc+A5MqafhdjKzmPSOQrBlYqsXFHqSWk6vPFkoT5w+xetFi8NXq34hsdJebZM2alqWB8bubkIPMQdhWUUK009mX2MlNKUehyiIvh6Kna3vGdReCIvXSqG1Mmt7xnUXgiL10qhtT+L3UTmureMs9yTdWPZpgtn0U/qnK42Y5wvPW311bb6ptVQVdRSVDAQJYJCxwz2HItyO1ZP78MW/Km+f5hL/ALlgycR3T4kzf0vWYYVLrcd+e5fjMc4TMc4VB/vwxb8qb5/mEv8AuT78MW/Km+f5hL/uWD+nS/USX/U9f6H/AJL8ZjnCZjnCoP8Afhi35U3z/MJf9yffhi35U3z/ADCX/cn9Ol+of9T1/of+S/GY5wioZR4vxYayFrsUXtwMjcx90Jef85XupSTTxEnMlg+xa2Rjunbd9SU03U453Fwx22PsiItclQiIgCIiAIiIAiIgCIiAIiICq2uD2/2vwY31r1CamzXB7f7X4Mb616hNT2L3MTm+seNsJF1b+OCzfrfVlXPVMNW/jgs3631ZVz1H6h3i9izdmvDS9yHdbjizp/CUXoSKpqtlrccWdP4Si9CRVNW5gd0QnaLxf0QREW4QJcfWZt/X2iO5vAzfSSRVDfE8NP8Apc5U4V+MeW0XjBd5tnLU0U0behxacj4iqDkEHIqP0+W8HEsvaara+M/VfYK+ejq4i7YEsdx4WZnoYnO/O4IzHiKoYrgar1y6/wBFFJTl2b6GolgPPlwuGPM/JfdQjvBM+dmbeG+UPVfYlVERRBdwiIgOE5UWHxleoMO4YuV6qCOBR07pO6R8EeM7F9S3eyPE5qEXJ9EV+1rMcPq7kzBtBMRT02UtcWn4ch+CzuAbT0qBF2rvX1N0udTcayQvnqZXSyHpJzXVVgpqVcFFHM87KllXysf09jljXOeGMBcScgBvJKtDoE0Pw2WGDEuJqZslyeA6npntzFODuLgfj/YtM1XcAx3i7OxXc4eHR0L+DSseNkkw28LuN+1Wl8S0czJafBEsOhaVFxWRavZf+TlERRhbgiIgCIiA48ShnTtoigxNTTX3D0DIbzGC6SINybVAb+4/mPKpmTlXuuyVct0a2Vi15VbhYjzunikhlfDNG5kjHFr2OGRBG8FflT3rTYCZQ1TcZ2uHgwVDwyvawbGyH4MncO49OSgNT1NqtgpI5xm4ksS51SJu1WscOtN+OFK+X+h3B2dNmdkc3MPzvtVpl54UlRNSVUVXTSGKaJ7ZI3jYWuBzBCvZo7xCzFODbXfG8Hh1MDeqtG5sg2PHlByUdn08MuNeZaezma7IOiT6dPY2RERR5Zyp2t7xnUXgiL10qhtTJre8Z1F4Ii9dKobU/i91E5rqvjLPcIts0TYWpsZY3pLBVVM1NFPHI4yRgFw4LCRv7inH3NVg+Udz+rYluTXW+GTGLpeRlw46lyKxIrO+5qsPyjuf1bE9zVYflHc/2GLH+Oq9TZ/6fzf0/wAlYkVnfc1WH5R3P9hie5qsPyjuf1bE/HVeo/6fzf0/yVoov+ug+kb9q9CaT/pYfzB9ig+LVusMUrJBiK5lzXB3wGcinKJgZG1gOxoA8i0cy6Nu3CWDQ9PuxOP4q232PoiItIsIREQBERAEREAREQBERAEREBVbXB7f7X4Mb616hNTZrg9v9r8GN9a9Qmp7F7mJzfWPG2Ei6t/HBZv1vqyrnqmGrfxwWb9b6sq56j9Q7xexZuzXhpe5DutxxZ0/hKL0JFU1Wy1uOLOn8JRehIqmrcwO6ITtF4v6IIiLcIE9EntDmlp3EZFUL0h2w2bHF6tuXBbDWSBg5mk5jzFX2PMqia1Fq+5+k11YG5R19MyUd1vYn7FEafLabRd+0lXFRGxeT+5EysPqc3XKW+WV7t4ZUMH+k5eVV4Ukat94Fp0rW5r3ZR1rXUzubNwzHnCkMqPHU0VnSbvg5cJfvsXNRORFAHSgiIgODzKE9bm8uo8EUNnjdwX3GqBkHPHGOFl+0WKbFV3XBrTLjC00Qd2ENEXEdLnH2BbOHHitRE63a68OW3nyINX1pIJaqpipoGl80r2xxsHK4nIBfJb1oGtjbrpWskLm8JsUxqHDoYM/tU3OXDFs5/j1fFtjBebRbzAOH4ML4Rt1kpw3KmgaHlvxn73u8ZzWeQbkVck3J7s6nXBVxUV0RyiIvh7CIiAIiIAiIgMRiyzU2IcN11nq2h0NVC6M58hI2Hugqhd2oprZc6q3VALZqeV0Tx0g5L0KyVMtY+2Ntmlm6dTZwWVIZUN6S5vZefhKR0+bUnEq3aXHTrjcvJ7EcKzep/enT4futjlfn1rM2aMczXjI+cKsqmTVJrXU+kaqpM+wqaB3jLXAj7VuZcOKpkFotrrzIfvyLYIiKCOjFTtb3jOovBEXrpVDamTW94zqLwRF66VQ2p/F7qJzXVvGWe5J2rFxw2z6Kf1TlccKnGrFxw2z6Kf1TlccKNz+9+haezfhH7/6CIi0iwhERAEREAREzHOgCJmOdEAREQBERAEREAREQBERAVW1we3+1+DG+teoTU2a4Pb/AGvwY31r1CansXuYnN9Y8bYSLq38cFm/W+rKueqYat/HBZv1vqyrnqP1DvF7Fm7NeGl7kO63HFnT+EovQkVTVbLW44s6fwlF6EiqatzA7ohO0Xi/ogiItwgT0U2KBtcKzdWw5Z76xvZUtS6nkPzZG5gnoBb/AKlPK0/TJZPvg0bXq3hucnW5li/PZ2Q+xV6ifBYmdN1Kj42LOH7FG127PXTWu60lypzwZqSdk0fdaeEPsXURWFrdbHNItwe/oehVprILjbKW4UzuFDUxMlYedrhmPtXaUZatl7+7Gi6hie/Oe3udTP58gc2+YgeJSbsVcsjwyaOo4tyupjZ6o5REXg2DhVI1sCTpPDc9goosvOrbqpGtfxof+FF7VuYPekD2i8J9UREpZ1VIg7SrG8/2dJKR4xkomUu6qHGj/wCFL7FKZPdMqOl+Lr90W4REVfOmBERAEREAREQBERAOVVP1u4wzSVRPb8e1xud4pJB7Fa/nVU9b/jHt3glnrZVuYPeog+0C/wDhv3RC6lHVeJGl2i276eb0VFylDVe43KHveb0VK393L2Kbp3iq/dFxURFXjpxU7W94zqLwRF66VQ2pk1veM6i8EReulUNqfxe6ic11bxlnuSdqxccNs+in9U5XHCpxqxccNs+in9U5XHCjc/vfoWns34R+/wDoIiLSLCcLlflxABJOQG8qEtLWnShsL5bThYRXC4DNslSdsMJ6MvhO8yyV1Sse0Ua2Tl1YsOKx7Eu3292mx0ZrLvcKejgHx5nhufc51EGK9YrD1E+SDD9tqrrIDl1aT3mLxZ5uPkCrhiXEN6xHcHV95uE9ZOTvedg6GjcAsWpOrAguc+ZUsvtHdPlStl/JLN60/wCOq8uFG6ht0Z5IoeEfK7NazVaVNINQ/hOxTXt255MIaPMFpaLajRXHpEhp6hk2PeU2bhHpPx+x4ezFVyz/ADwftCzlr05aQqIjh3SGrZyieBrs/GMlGaL66a31ifI52TF7qb/yWLwzrJtL2R4jsDg3lmoX55foOPtUx4Px3hbFkXCsl3hnkyzMLuwkb3WnIqiK+tJU1FJUMqaWaSGZhzZJGS0g9BC1rMGuXy8iVxe0ORU9rPzL+T0P5kKq/os093G3SRWzF4dXUewNrW/1sf5w+MPOrKWa6UF4t0VwttVHU0szeFHJG7MFRltE6nsy2YWo05kd4Pn6eZ3URFhN8IiIAiIgKra4Pb/a/BjfWvUJqbNcHt/tfgxvrXqE1PYvcxOb6x42wkXVv44LN+t9WVc9Uw1b+OCzfrfVlXPUfqHeL2LN2a8NL3Id1uOLOn8JRehIqmq2WtxxZ0/hKL0JFU1bmB3RCdovF/RBERbhAnoqvxKxskbo3gFrgQRzgr9oqydbZQ3SXZHYex3eLSWcFkFS7qfSw9k0+QrXFO2t9YDSYltuIoWZR1sJgmcP7xm4nutP+lQSrDRPjrTOY6jj/h8mUP3J11Qr/wBa4luWH5H5MrYRNEPns3+Yqz+zNUJ0f3uTDeNLTemOcBS1TXSBvKwngvHjaXBXxp5I54I5onNeyRoc1w3EHaCozPr4Z8XqWzs5k/Ex3W/7X/B9kRFoliOFUjWv40P/AAovarbqpGtfxof+FF7VuYPekD2i8J9UREpd1UONH/wpfYoiUu6qHGj/AOFL7FKZPdMqOleLr90W4REVfOmBERAEREAREQBERAOVVT1v+Mi3eCWetlVrOVVT1v8AjIt3glnrZVt4PfIhO0Hg37ohZShqvcblD3vN6Ki9ShqvcblD3vN6Klr+7l7FM07xVfui4qIirx04qdre8Z1F4Ii9dKobUya3vGdReCIvXSqG1P4vdROa6t4yz3JO1YuOG2fRT+qcrjhU41YuOG2fRT+qcrjhRuf3v0LT2b8I/f8A0cHyr8ucGtLiQANpJX63KAtZ7SO6hgfgyy1GVTOz+nyMO2Nh/s9nK4b+ha1VTtlwolszLhi1OyZrmnrTDNdZp8N4WqjHb2ksqqqM5Gcg7WtPIzpG9QWiKeqqjXHZHOcvMsy7HOb/APwL9xRSTStihY+WR5yaxjcyTzABb5op0X3vHNR1dgdRWlj8pat7dhI3tYPjH7FafAej7DGDKVrbVb43VPBykq5QHSu5+yO4dAWG7LhVy6s38DRbsv8AM+USr+GdC+Pb21kv3K+58DtvCq39TOX5u9bvQ6tV0e0GuxHSxHmhhc7Ly5Ky4CLQlnWyfLkWSrs9iQX5t2Vwq9WioDf6JieJxy/tKYjb4iVql/0AY5tzHy0Qo7mwckEnBce4HZK3SFeY5tq6s92dn8OS5Jr6nnzebRdLNVmku1vqKKcfEmjLSe5nvC6K9AMQ2Kz4ht76C8W6nrqd3xJWZ5HnB3g9IVcdLmgqrs8U14wj1Wuom5ukoz2UsY5S38oDm3rdpzYze0uTK/n6BbjpzrfEv5INW9aJtI92wJdWuje6otUrh1zSE7CPym8zgtGIIJDgWkbwuFtzhGa2ZCU3zompwezRf/DN8tmI7LT3e01Daiknbm1w3g8rSOQjlCyoVN9AukSXBeI2UdbK42WteGTg7RC47BIO5y9CuJFJHNE2SNwexwBa4HMEHcQVCZFDplt5HQ9L1CObVxf3LqfVERa5JhERAVW1we3+1+DG+teoTU2a4Pb/AGvwY31r1CansXuYnN9Y8bYSLq38cFm/W+rKueqYat/HBZv1vqyrnqP1DvF7Fm7NeGl7kO63HFnT+EovQkVTVbLW44s6fwlF6EiqatzA7ohO0Xi/ogiItwgT0VREVZOtkd6wOHvvi0Z3CONnCqKMCrh582b/ACjhKl69D542TQvjkaHMe0tcDuIOwhUT0mWB+GMd3WyvDuBDOXRHnjd2TD5CpTT7OTgyn9pcbaUbl58ma2rmau+IxiHRrRCWThVNBnSy8/Y/BPkVM1Muqlif7lY3msU8nBprrFkzPcJmbW+UcIfsrYza+OvdeRHaFk/Aykn0lyLYIiKDOgnHKqk617XDSe1xacjRR5Hn3q2yq/rhULosV2ivA7CejdGT85rv5FbmC9rSD7QxcsNteTRBaljVVlDNKsTDvko5R5BmonW7aDbq20aUrHUyP4Mck/UXHoeOD9pUrenKuSKZp81DJhJ+qLvog3Iq8dPCIiAIiIAiIgCIiA4O1VP1u5A/SVRtbvjtkbXfWSH2q2HSqXaxNzbdNLN3fG7hR05bTj9BoB8/CW7gR3s3K/2jmo4m3qyPFKOq60nS3RZDdTzE9HYqLlM+qPQun0hVldl2FNQEdwvcAPsUnkvaplT0uPHl1pepa5ERV86YVO1veM6i8EReulUNqZNb3jOovBEXrpVDan8XuonNdW8ZZ7knasXHDbPop/VOVxwqcasXHDbPop/VOVxwo3P736Fp7N+Efv8A6Nc0i4lp8JYQr75ORnBGRC0/HkOxo8qovda+qulyqblWymWoqZXSyuO8uJzKnXW8xK+W527CsEnYQs67qADvc7NrAe4AT+koAW3g1KMOJ+ZCdoMx3ZHwl0j9zlSPoM0cT45vpnrGPjstI4GpeNnVXckbek8vMFothtlVer1R2miYX1FVM2JgHOTl5lenAuHKLCmGKOyUIHAgYOE/LIyPPwnHulesu91R2XVnjRNO/FW8c/lX8mTtlDSW2hhoaKBkFNCwNjjYMg0BdpchNyhS+pJLZBERD0EREAQ7kRAV21jNFDDBPi/DlOGvZm+vpWDY4csjRz84Vc16IyxsljdHI0PY4EEHaCOZUv09YL+8zHE0VK3g22vBqKT5oJ7Jn6J83BUrhZHF+RlM1/TY1P49a5PqR8rXaruNHX3DEmH62XhV1rADCTtfAdjfIdiqkty0L4kdhbSLa7g5/Bp5JOt6kchjfsPkO39FbOVUrK2iK0jMeNkRb6Pky8SLgEEZrlQJ0gIiICq2uD2/2vwY31r1CamzXB7f7X4Mb616hNT2L3MTm+seNsJF1b+OCzfrfVlXPVMNW/jgs3631ZVz1H6h3i9izdmvDS9yHdbjizp/CUXoSKpqtlrccWdP4Si9CRVNW5gd0QnaLxf0QREW4QJ6KoiKsnWzhV11vcMZi3Yrp49o/olSQOTewn/UFYrPasBpAw9DinB9xskobnUwuEbnfFeNrT4istFnw5pmjqOL+Jx5V+fl7lCl3LPcKi1XWluVI8snppWyxkchBzXxrKeakq5qWpjdFPBI6ORh2FrgciD3CvirByaOaLeEt11Rf7CV5gxDhqgvNM4dTq4GybOQkbR4issq+6o2K+r0VdhKrk7OA9dUYcfiHY9o7h2/pOVglX763XNxOmafkrJx42L/ANYIUM62tlNfo/prvGzhSWyqaXdEcnYHz8FTMVi8UWiC/YduFmqgDDVwOiPRmNh8RXyqfBNSPebR+Ix51+qPP9fSCWSCeOaF5ZJG4PY8bwQcwV2b7bKiz3mrtVYwsnpZXRSA7NoOS6asKaa3OYNOEtn1Re/RxiOLFeDLbe4y3hzwgTNHxJRsePLu6Fsiqbq04/bh2+Ow7dJ+Bbrg8dTc85NhmOwE8wduKtlnmFA5NTqm15HR9LzVl46l5rkzlERYCSCIiAIiIAiIdyAweNr7T4awrcb1UuAZSwueOl25o8ZVDrjVzV9fUV1Q7hTTyOkeeknMqaNaHHzLxc2YTtU/Do6KThVbmO2STDYG9Ib9qg9TODS4Q4n5lD17NWRd8OD5R+5yrP6oNlNLhe5XuRgBrJxEw/NYNvnKrPb6OouFfBRUcRlqKiRsUTBvLicgFfDAlghwzhG22OHIilgaxzh8Z+9zvGV8z7FGHD6mTs5jcd7tfSP3M6iIocvBU7W94zqLwRF66VQ2pk1veM6i8EReulUNqfxe6ic11bxlnuSdqxccNs+in9U5XGOwKnOrFxw2z6Kf1Tlb25zdb2+onH9nE9/kGajs/vUWjs69sNv92Ui0x3Z170mX2vc7hM66dFH+YzsW+YLUV2LhIZq+omPx5Xv8pzXXUtBKMUkUu+x2Wym/Nsm3VJw6yvxfWX+dmbLZDwIc93VJMxn4m8L9pWnyUNapFCyDR1UVgHZVNa/hH80AKZeVQmXPitZ0DRaVVhx28+ZyiItYlgiIgCIiAIiIDhRLrR4eZdtHT7myPOotcjZgeXgHsXDzqW1hcaUIuWEbvQFgcZ6OVgG/aWHLzrJVLhmmauZSrqJwfmigi5Y5zHh7TwSDmD0hCMiW8xXCsRy/oy+Wje6/drAlmuZOZnpGF35wGR+xbEqu6LtOFBhHBdFYK2zVdXLSl3vscrWgguJAyPMCto90tZc+1m4fXMUJPEt4nsjoGPrOJ8GPHPnsievGnjUDe6WsvyZuH17E90tZfkzcPr2Lx+Eu/SZv61hfr+5qGuD2/wBr8GN9a9Qmt80146pMfYjpLrR0M9GyClEBZI4OJIe457PzloamMeLjWkyj6nbC7KnOD3TJF1b+OCzfrfVlXPVMNW/jgs3631ZVz1G6h3i9i1dmvDS9yHdbjizp/CUXoSKpqtlrccWdP4Si9CRVNW5gd0QnaLxf0QREW4QJ6KoiKsnWwiIgKk60mFDZcbi900WVJdml7iBsEw2OHj3qIFdvTbhL78MA11DDGHVsLeuKQ/8AuN28HxjZ41SV7XNeWPBa4HIg7wQpvDt469n5HPtdw/w+S5LpLmZzAWIZ8K4tt98gJ/o0oMjB8dh2OHjCvba66nudtprhRyCWnqYmyxuHK0jMLz2Vn9VLGIuNglwpWS51FBm+l4R2uhJzLf0T5liz6uKPGvI3Ozub8Ox0S6Pp7k6oiKJLqVw1rMCyCaPGluhzYQIrgGjcRsZJ3OQqvS9CrlRUtyt89BWxNmp52GOSN24tOwqmOmXR5W4ExC9jGPmtNS4upJ8uT8h3zh51LYWRxLgkUvX9NcJ/HrXJ9fc0JWR0CaY4pooMMYsqxFMwCOkrZHbJMtgY88h5id6rci27qY2x2ZCYOdZh2ccP8ep6JtIc0EHMHcVyqf6MdNWIcJsjoLi113tbcgGSPykiHzXewqwuD9K2CcTsjFJd46SpdvpqvKJ4PNt2HxFQ1uLZW+nIvWHq+PkrbfZ+jN8RfOOWOVgfHIx7TuLTmCvpmOda5KboLhfiR7I2F8j2taN5JyAWmYu0pYLwwx4rrxFPM3dBS++yE82Q2DxleowlJ7JGK2+upbzkkjdj3VA+njTFBbKefDeFqpstweDHU1UbsxANxa08runkUf6TNON+xMyW3WVj7RbnZg5OzmlHS4bs+YKI1JY+E1+aZVdU15Si68f6v/Ry9xeS5xLiTmSeVcIt00TYCr8dYiZSwh8VBCQ6rqctjG8w+ceQKQlJQW7KzTTO6xQhzbJE1VsDPrbo7GNfD/RqUmOi4Q+HJuc4dA+1WcXRsdrorPaaa2W+EQ01NGI4mDkAXfyUBfa7Z7s6Rp+HHEoVa6+fuERFiN4qdre8Z1F4Ii9dKobUya3vGdReCIvXSqG1P4vdROa6t4yz3JO1YuOG2fRT+qcrcYg/EVw72k9Eqo+rFxw2z6Kf1Tlbm/NLrJXAbzTyAfslR+d3yLN2f8FL3f2PPyf+vk/OP2r5r6VAIqJGneHn7V81LroUqXzMuJqwcU1F9PL9qlEKKNViZsuimBo3xVcrD5QVK+Sr9/eS9zpemvfFr9kERFhN4IiIAiIgCIiALr3D/oaj6J32LsBdO8ytp7RWVDvgxwPc7uBpK+rqjxPlFnnxJ/WO7pX5X6kOcju6V+VZV0OUS6hFkaKxXqtp21NHaq2ohJIEkcLnNOWw7QF2PvXxJ/2G5fuzv5L5xL1Papm1uomGRZn718Sf9huX7s7+SfeviT/sNy/dnfyXzjj6n34Fn6WYZF2rlb663Sthr6Selke3hBkzC0kbs9q6q9JpmNpp7MkXVv44LN+t9WVc9Uw1b+OCzfrfVlXPUPqHeL2Lx2a8NL3Id1uOLOn8JRehIqmq2WtxxZ0/hKL0JFU1bmB3RCdovF/RBERbhAnoqiIqydbCIiA4O5U91kcHHDOOZK+mjyoLqXTxZN2Nf8dvl2/pK4XKtG014OZjLA1XQxsBracdcUjuUSNHwe4RsWzi2/DsT8iK1fC/FY7S6rmikqzuAsSVWEsWUN8pc3GnkHVI88uqMOxzfGFhJY3xSvjkY5j2OIeDvBGwhflTkoqS2ZzyE5VTUl1R6D2a40t2tVNc6KVstNUxNlieOVpGa7irzqo426pDNguul7OPOah4R+LvewdzeF2dO2lbFeDsbfcmzvoW03W7JPfoOG7M79uYUG8WXxHBHQYatV+FjkT9vqT6sTiiw2vEtlntF3pmz007ciOVp5HNPIRyFVa90DpC/Ltf7t/9rftBOlbFmMcbfcm8vojTdbvk95g4BzG7bmV6liWVri9DHVrWJkzVOz58uZFWlnRbecDVj5mMfW2d7veqtjPgA7mvA3HzFR6vQ2spqesppKaqhjmhkaWvjkaHNcOUEHeoJ0kav1JWF9wwbK2jmdmTRTOPUyfmu3juFbVGamuGZD6l2fnFuzH5r08ytCLNYpwtiHDNX1tfLVVURzyY97Owd+a4bCsKpBSUluitTrlXLaS2ZlbZiO/2z8X3mvpfo53D2rLfhHx5ll9914y75ctURfHXBvmj3HItitlJr6mXueJsRXP/AK+93Gq+kncfasQSS7aiL6kl0Mc5yn8zCLLYbw5fcR1gpbJa6quk5epsza38524eNTzo41fIYHx1+NJxMW5EUMDux7j3Dae4FjtyIVrmzcxNOyMp7Vx5evkRVos0aXvHde0wsfSWyN3v9Y5uwDlDPynK4GDcM2nClihtFopxFBGNp+NI7lc48pKyNvoqS30cdHRU0VNTxNDY4o2BrWgcwC7Kh8jJlc/2Lxpul14Ud+svU5REWsSoREQFTtb3jOovBEXrpVDamTW94zqLwRF66VQ2p/F7qJzXVvGWe5J2rFxw2z6Kf1TlcSRrXxuY4cIEEEdBVO9WLjhtn0U/qnK44Ubn979C09nF/wDEfu//AAUAxhQPteKrrb3jgvp6uSM+JxWJUq60FidadJ81bHHwae5wtqGnk4Y7F47uYzP5yipStMuKCZTs2p03zg/JlktTy8Nfb7zYnuHDjkbUxj5pHBOXjCsEOlUg0K4p+9LSFb7lK/g0kpNNVfRv2Z+I8E/oq7kb2yRtkY4Oa4AgjaCDyhRObW42b+pdez+SrcXg84n0REWmToREQBERAEREBwtK03Xhll0Y3upLwHSwGCPpdJ2OXkK3VVr1t8Wtnr6PCFK/MU+VTWZflEdg0+Las+NXx2JEdqmQsfFlLz6Ir+iLIYctk15v1Ba4Gl8lXUMiAHSclPNpLdnN4xc5JLzLlaBbd9zdFFihc3Jz4TM4dL3F3tW85DmC69rpIqC301FCMo4Imxt7gGS7Srk5cUmzqWPUq6ow9EcZDmCZDmC5ReTNsiq2uBsx/a8v+2N9a9Qmps1we3+1+DG+teoTU9i9zE5vrHjLCRdW/jgs3631ZVz1TDVv44LN+t9WVc9R+od4vYs/Zrw0vch3W44s6fwlF6EiqarZa3HFnT+EovQkVTVuYHdEJ2i8X9EERFuECeiqIirJ1sIiIAh3IiAqZrP4JNgxUMQUUOVvupJfwRsjnG1w/S3j9JQ6r56Q8M0mL8J1tjqwG9WZnE8/2cg2td4iqM3u21dnu9Va66Ix1NLK6J7TyEKawruOHC+qKFruB+Hu+JFfll9zmxXOss15pLtQymKqpJmyxuHODnkeg7itx04Ylo8W4lor5RuAbPb4uqR/3cgzDmnuFaAi2nWnJSIiN841OryYUu6qHGj/AOFL7FESl3VQ40f/AApfYseT3TNnS/F1+5bhERV86WdespKasp309ZTxVELxk5krA5p7oOxR9iDQrgC7udKLSaCQ/GpJCwZ/m7vIpJ2pkvUbJR6MwW41Vy2simQJcNWuzPeXUWIa2IcjJImuA8YyWNOrRJw9mKW8DP8Awu3LyqxqeJZ1l2rzNCWiYTe/B9yAqDVrtDHh1biOtlHNHE1uflzW5Yf0I4AtJa99sfXyD41XIXDP80ZBSUm1eZZNsurM1WlYlXOMF9zrUNFSW+mbTUNLDTQs+DFDGGNHcAyC7SIsJvJJckERF8PQREQBERAaZjLRvhTF12Zc75QvnqY4Wwte2Ut7AFzgMh0ucsN+A7R3/wBpl/eHKS02rJG2aWyZqTwsecnKUE37GkYV0XYOwxeorxZ7fJDWRBzWOMznABwyOw9BW7oudi8SlKT3bM1VNdMeGC2RE+sxhQ4hwG+4U0XDrbU4zsyG0xnY8e39FVCXojJG2SNzHgOa4ZEHaCOZUw064DmwVi2XqEZ+5Na50tI/kYN5jPS3k6FJ4F3/ANbKr2jwWmsiK9yPVaXVn0jR3i1R4Tu04Fyo2f0Z7j/XxDkHzm83MqtLs26tqrdXQV9FM+GpgeJI5GHItcNxW5fSro7MgtOzp4VqmunmehfIiiDQ1pit+KoIrTfZY6K9tAAz2R1HS08juceRS/sUFZXKt7M6HjZNeTBTre6OURF4NkIiIAi4Wo6RsfWHA1sdU3KcPqXj3ikjIMkp7nIOclfYxc3sjHbbCqLnN7JHOlHGdvwRhia51UjXVDgW0sOe2WTLYMuYbyqR3m41V3u1Tc66Uy1NTK6WVx5STms1pDxld8bX591ucmQGYp6cO7CFnM32nlWtqcxcdUx59SgavqbzLNo/Kuhwpx1TcJOr8TVGKaqI9b25pjpyRsdM8ZEj81vpKIMN2evxBe6Sz22Iy1VVKI4xyDPeTzAbyVePAOGqPCOFaKx0eREDPfH5ZdUedrnHulY825QhwrqzY0HBd1/xZL8sfubAiIoYvYREQFVtcHt/tfgxvrXqE1NmuD2/2vwY31r1CansXuYnN9Y8bYSLq38cFm/W+rKueqYat/HBZv1vqyrnqP1DvF7Fm7NeGl7kO63HFnT+EovQkVTVbLW44s6fwlF6EiqatzA7ohO0Xi/ogiItwgT0VREVZOthERAEREBwq/a1GAjU04xrbIffYGhlexg+Ezc2TujcehWB5V8K2lgraSWkqo2SwTMMcjHDMOaRkQVkptdU1JGnm4kcql1y/wDWeeSLdtMeCJ8D4umomhzrfUEy0cp5WE/BJ527itJVhhNTipI5rdTOmbhNc0FLuqhxo/8AhS+xREpd1UONH/wpfYsWT3TNrS/F1+6LcIiKvnTAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIDha5pAwjbMZYdns9ybk14zilaOyifyOb/LlWxovsZOL3R4shGyLjJbplCccYVu2EL5LabtDwJGnOOQfAlbyOaeZYFXm0o4Tw7inDU8OIOBBHAx0kdZnwXU5A+EDzc4Owqkl1gp6W51NNS1Qq4I5HMjmDS0SNB2OyPOpzFyPix59Tn2rab+Cs5PeL6ep1WOcx4ewlpBzBGwhSto+05Yow0yKiuIF7oGAANlfwZWjoft8hzUUIs06ozW0kaGPlXY8uKqWzLi4Z044EvLGtqK+S1znfHVs4IH6QzC3eixRhusjD6W+22UEZ9jVM+zNUDXIcQexJb3FpS0+DfJk7V2muitpxT/g9AJcQWKJhdLebewDldUsHtWs3/SzgKzNcKjEFNNIP7Onzld/pVJi95GTnF3jX5RadFPmz1Z2mta2hBInzHOsVXVTJKTCdt6zYQR13VZOk7rWDYPHmoPu9yr7tXyV1yq5quokOb5JHlxPlXTRbddEK/lRCZWfflPe2W/7eQX1poJqmojp6eJ8ssjg1jGDMuJ3ABdzD1kumILpFbLPRS1dVIdjWDPIc5PIBzq1WhjRBb8Hsju12EdZeyNjss2U+fIznPOV5vyI1L9zNp+m25k9o8o+bOdAWjFmDrYLtdYw691TBwxv63YfiDp5ypYRclQdlkpy4mdBxsaGNWq4LkgiIvBsBERAVW1we3+1+DG+teoTU2a4Pb/a/BjfWvUJqexe5ic31jxthIurfxwWb9b6sq56phq38cFm/W+rKueo/UO8XsWbs14aXuQ7rccWdP4Si9CRVNVstbjizp/CUXoSKpq3MDuiE7ReL+iCIi3CBPRVERVk62EREAREQBERAaXpdwTTY4wlPbnNaytiBlo5T8WTLceg7iqT3KiqrbcJ6CthfDVU7zHLG8ZFrhsIXoWoF1ndHJuNI7GNmp+FV07R19EwbZIx/aDnLeXoW/hZHA+B9Ct69pvxofHrXNdf3RWVb1oNxVR4Rx/S3K4j+iSMMEr/7sO2cLuDlWirlSs4qcWmU2i6VNinHqj0PgkjnhZNE8Pje0Oa4HMEHaCCvpkq66s2kwZQ4KvlR0W2Z7v8A9RPo+RWK6VAW1OqWzOlYWZDLqVkPr+xyiIsRuBERAEREAREQBERAEREAREQBERAEREBwsRijEFow1aZbpeayOmpoxvedrj+S0byTzLU9KOlXD+CKd1O6QVt2c33ujidtHS8/FHnVUcd4yvuMrs6uvNU57Wk9ShZsjiHM0e1bePiSt5vkiD1LWasVOEOcvt7mz6YNK1zxxO6hpuqUdlY7NkAO2U8jn5b+5uCjVcopmEIwjsij35FmRNzse7OFkzYL4LTHd/uNX/c+Qng1XW7upnkPZZZKVdB2hypxG+K/YkifT2gHOKF2x9Tl9jOnlVpKSlp6WkjpKaGOKCJgYyNrcmtaBkABzLTvzVXLaPMmtP0GeRDjsfCvI89CCDkQuFe69YBwbeC51ww5b5Xne4Qhrj425LWKvQXo7qSSLXPDn/dVDmr5HUIeaPdnZm9P8skynCK4UWgXR3G/M0FY/ofVOIWctOivAFtIkgwzRvePjTAyH/USF9eoVromeY9mslvnJIpnZLFeb3Uims9qrK6U8kELn5dJy3DpKmHAurzeq58dTiqrbboN5p4SHynoJGwedWZoqOlooGwUlNDTxN3MiYGtHiC7C1rM+cltFbEtjdnKa3va+L7GBwdhKwYSt/WVjt8dMw5dUfvfIRyucdpWeRBnktGTcnuywVwjXFRitkcoiL4ewiIgCIiAqtrg9v8Aa/BjfWvUJqbNcHt/tfgxvrXqE1PYvcxOb6x42wkXVv44LN+t9WVc9Uw1b+OCzfrfVlXPUfqHeL2LN2a8NL3Id1uOLOn8JRehIqmq2WtxxZ0/hKL0JFU1bmB3RCdovF/RBERbhAnoqiIqydbCIiAIiIAiIgC/EjGyRuY9ocxwIIO4gr9ogKg6wmjd+Eb4bvbIibLXSEt4I/qJDtLD0HkUUL0BxHZbff7LU2e5wNmpahha5pG7mI5iORUq0o4KuGBsTS2yqDn0z85KWoy2Sx/zHKFMYeTxrhfUout6W8efxq1+V/wzVopHxSslic5kjHBzHg5EEbQQrcaAdJ0eMLWLRdJWtvdKwZ5n/qGD446Ryqoq7lkuldZrrTXS2VDqerp3h8b28hHs5ws+RQro8+poabqE8K3iXyvqehBRaHoe0hUWPLCJs2Q3KABtXT5/BP5Q+aVvigZRcHszolN0L4KcHumERF8MoREQBERAEREAREQBERAcbEXwraqmoqZ9TV1EUEMYzfJI8NaB0kqFtIesBaLWJKLC8DbpWDMdXfmIGHzF3mWSuqdj2ijVycynGjxWy2Jgvt5tljt76+7VsNHTRjspJH5DuDnKrppS0+1df1W24Na+kp9rXV0g98f+YPijp3qIcXYrv+K7gay+XGWrfn2DDsZGOZrRsAWEUpRhRjznzZUNQ1+27eFP5Y/yfWpnmqah888r5ZpCS57zmSTyklfJFnsFYRv2Lrm2hslC+Y5jqkp2MiHO53It1yUVuyAhCdstordsw1PDNUzMgp4nyzSODWMYMySeQAKxWhbQeIHw37GUIfJsfT2925vKHSc5+b5VvmibRNZMEQsrJmtuF5c3s6p7dkee8MB3Dp3lSTyKKyc1y/LWXHS9CVe1l/N+nofljWxsDGNDWgZADYAF+0RR5ZwiIgCIiAIiIAiIgCIiAIiIAiIgKra4Pb/a/BjfWvUJqbNcHt/tfgxvrXqE1PYvcxOb6x42wkXVv44LN+t9WVc9Uw1b+OCzfrfVlXPUfqHeL2LN2a8NL3Id1uOLOn8JRehIqmq2WtxxZ0/hKL0JFU1bmB3RCdovF/RBERbhAnoqiIqydbCIiAIiIAiIgCIiALVNJeC7djjDktrrWtZKAX00+W2GTkPc5wtqQZr7GTi90Y7ao2wcJrdMoBiqwXPDN8qbNdoDDU07sjzPHI5p5QeRYpXR00aOaPHVjJhDIbvStJpZjsB+Y4/knzKnN3t1babjPbbhTPp6uneY5Y37wQpzGyFbH9znmqabPCs9Yvod7B+I7phS/U95tM5iniO1ufYyNO9rhygq6GjPG9rxxh1lzoHBkzewqKcu7KF/Meg8h5VRZZ/AuK7tg6/RXa0zZOGyWI/BlZytcF8ysZWrddTJpWqSw58MucGX1Razo9xlaMaWCO62qUZ5ATwOPZwv5WuH2HlWzKElFxezL/XZG2KnB7pnKIi+GQIiIAm5cLr1lXS0cLpqqpigjaMy+R4aAO6UPLaS3Z2M9iZqMcVab8CWMvhhr3XWpZ/Z0TeE3P8APOTfISogxhrCYouYfDY6aCzwOzAf/WS5d07AfEtmvFsn0RGZOsYtHJy3f7Fmr9fLPYaM1l4uVNQwD400gbn0AHaT0BQzjrWItdIH02FKJ9fNtHXM4LIx0hu8+ZVxvF1ud4q3Vd1r6itnP9pNIXHxZ7gumt6rAhHnLmVzL7RXWcqVwr+TYsZY2xNi2qM18us8zM8207TwYo/zWDZ4961xEAJOQW7GKitkQE7Z2y4pvdhfuKOSWRsUUb3vecgxgzJJ5AApC0d6IMWYtfHUGm+5lsO+qqBlwh8xm93d3KymjrRdhfBUTZqOl67uGXZVdQA5+fzeRviWvdlwr5LmyUwdFvytm1wx9WQlov0D3a89SuWKzJbKE5EU26eQdP5I7u1WUw5YrTh22R22zUENHTRjYyNuWZ5yd5J5ysp4kUTbfO18y54Wm0YcdoLn6+ZyiIsJIBERAEREAREQBERAEREAREQBERAEREBVbXB7f7X4Mb616hNTZrg9v9r8GN9a9Qmp7F7mJzfWPG2Ei6t/HBZv1vqyrnqmGrfxwWb9b6sq56j9Q7xexZuzXhpe5DutxxZ0/hKL0JFU1Wy1uOLOn8JRehIqmrcwO6ITtF4v6IIiLcIE9FURFWTrYREQBERAEREAREQBERAcFRZpz0WwY1t5uVsDIL5Tt97flkJ2j4jvYVKaeJe4TcHujBk49eRW65rdM88q+kqaGslo6yF8E8Ty2SN4yLSN4K+Ktxp20T0+MKR95s7GwXyFvJsbUtHxXdPMVU2vpKmhrJaOshkgnicWyRvGRaRyEKcovjdHddTnmo6dZhWbPp5MzGBMWXfB18iulpmyIIEsR+BM3la4K5WjbHFmxxZm19sk4EzABUU7z2cLuY845iqLLM4RxLeMK3iK62WqNPURnshvZIOVrhygrxk4qtW66mfS9Wnhy4Zc4Mv3yL5yyxQxl8sjGNG8uOQ86ptd9NekW4gt+7QpGH4lNA2PLx5E+dabdcR3+6vL7lea+rJ/vJ3O9q04afN9WTtvaald3FsurfdImCrLwhcMR0DHj4jJOG7yNzUeYh1jMLUvCZZ7ZcLm8bnOygjPjObv9KqyuFsQwK49eZF3do8mfKCSJexLrAY1uQdHbmUdqjP903hvy/Odnt7ijW+4hvl9nM14utXWvJ/tpCR4huWLRbUKYQ6IiL86+9/9ybYRFnsM4PxLiWUMs1mq6tpOXVAzJg7rjsXuUlFbswQrnY9ordmBX7ijklkbFFG97ycgAMye4Ap7wfq5V07mT4pu7aSPe6npMnv7hedg8hU04O0d4Swmxv3ItELZwNtRL75Kf0ju8S07M2uPJcybxez+Tbzs/Kv5Ky4F0KYxxLwJ54G2ihdkerVYIcR81g2nx5BT/gLQ3hDCwjnfS/dSvZtNTVNBAPzWbgpIyyTao+3Lss5dEWfD0bGxue279WGgAAAbFyiLWJYIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiICq2uD2/2vwY31r1CamzXB7f7X4Mb616hNT2L3MTm+seNsJF1b+OCzfrfVlXPVMNW/jgs3631ZVz1H6h3i9izdmvDS9yHdbjizp/CUXoSKpqtlrccWdP4Si9CRVNW5gd0QnaLxf0QREW4QJ6KoiKsnWwiIgCIiAIiIAiIgCIiAIiIDhRXps0U0WNaV1ztojpr5EzJsmWQnA3Nd7CpURe4WOD3iYMjGryK3Cxbo89btbq21XGe33GmkpquF5bLFIMi0rqq6Ol/RjasdW90wDKS7xMyhqmt38zX87fsVQsT2C74avE1qvNG6mqYjuO5w5HNPKDzqax8mNy/c5/qWl2Yc/WPkzFoiLZIsL9RsfI8MYwveTkABmSVIehqr0eC5dZY3tfD6o73qrfK4RNJ5HNGWQ6VbfD1jw9a4Gvsdrt9NE9oIfTwtHCHPwhvWpflfCeziTWn6P+NjxKaX7eZTfDui7HV94LqTDtXFE/8AtakdRb3eyyOXcUlYa1b6+XgyYgvcUA5YqVnDd3OEcgrLZZcgRaE86yXTkWKjs9i1857yI9wtobwDYeA9tnZX1DdvVa13VTn+aex8y32CGGCMRwxMiYBkGtaAB4gvsuFqynKT3kyZqx6qVtCKRyiIvJmCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgKra4Pb/a/BjfWvUJqbNcHt/tfgxvrXqE1PYvcxOb6x42wkXVv44LN+t9WVc9Uw1b+OCzfrfVlXPUfqHeL2LN2a8NL3Id1uOLOn8JRehIqmq2WtxxZ0/hKL0JFU1bmB3RCdovF/RBERbhAnoqiIqydbCIiAIiIAiIgCIiAIiIAiIgCIiA4Wp6R8DWTHFodRXOIMnYD1CpYPfIj0HlHOFti5X2MnF7ox21Qti4TW6ZRXSLgS+4Gupo7rDw4Hk9Qqo2nqco6DyHnC1RegGJLJa8QWmW13ijjqaWUdk14zyPODyEc6qppg0PXXB80lytTZbhZSc+qBuckHQ4Dk+cpfGzFZyl1KRqmiTx27Kucf5RFSkzRPpdvWCpI6GqL7jZs+ygceyiHOwnd3NyjRFuThGxbNENRkWY81Ot7Mvvg7FNkxZamXKyVrKiIgcJp2PYeZzeQrODcqB4SxLesLXVlysldJSzjfltbIOZw3EK0OirTXZcVCO3Xkx2u7bBwXH3qY87HHcegqHvw5V8480XXTtcrydoW8pfwyXEQEEZ5otMnwiIgCIiAIiIAiIgCIiAIiIAiIgC4X5e5rGlzyGgDMk7gok0i6c8N4bklorS37tV7NhEb+DEw9L9ufcC9wrlN7RRr5GVVjR4rZbIl3PYsRd8S2C0MLrreaCjA39Wna0+TNVBxbpexziQyMmupoaV2fvFF723I8hO8+MrRJ5pZ5DLNK+V53veSSfGVvQ09v5mV3I7TQi9qY7+5cu46atHFC4g4hbO7mggkk84GSw0+sNgGM5MZd5ullKPa4KpKLOsCtddyOl2kyn0SRbWPWGwG92To7vGOc0rcvM4rLW7Tfo4rJAz7uOp3nknppGjy5ZKmiI8Ct+oj2kyk+aTL8WXFmGb09rLVfbfVudubHO0k+JZxUk0ERdV0s2BvBz4FRwvICc1dtR+TSqZbJln0rPlm1OcltszlERa5KFVtcHt/tfgxvrXqE1NmuD2/2vwY31r1CansXuYnN9Y8bYSLq38cFm/W+rKueqYat/HBZv1vqyrnqP1DvF7Fm7NeGl7kO63HFnT+EovQkVTVbLW44s6fwlF6EiqatzA7ohO0Xi/ogiItwgT0VREVZOthERAEREAREQBERAEREAREQBERAEREAX4lYySN0cjQ9jhkQRmCOlftEBAOl7QRBWma84MjZT1JzdLQZ5RyHnZ+Sejcq4XCjq7fWS0ddTSU9RE4tkikYWuaRzgr0MWlaStG+Hsc0RFfAKeua3KKtiaBI3oP5Q6Ct/HzHDlPoVrUtBhdvZRyfp5MpAuQSCHA5ELc9I+jfEWB6s/dCndUUD3ZRVkQJjdzA/ku6CtLUrGUZrdFOtpspnwzWzJZ0Xabb7hcRW688O7WtuQAeffoR81x3joKs5g3F1hxdbhW2OvjqG5Dhx7nxk8jm7wqFLvWS73OyXGO4WmtnoqqM5tkheWnuHnHOCtW/DhZzjyZMafrl2NtCz80f5R6DLlV60bawcE3U6DGkPUX7AK6Bube69o3d0KebTcqG60UdbbayCrp5BmyWJ4e0+MKKtpnU9pIuWJnUZUd65fTzO4iIsRuBERAEREAREQBERAcLqXa40dqt09wuE7KemgYXyyPOQaAuy4hrS5xAAGZJ5FUnWG0ky4rvL7FaqhwstHIQeAdlTINnCPO0cnlWail3S2RHajnwwquJ9X0R+NMemG64rqZbXZZpKGxsJGTDk+p6XnkbzN8qiZcrhTtdca47I57k5VmTNzse7CLeNHmi/FWNHNnoaTra3k5GsqAWs6eDyu8SnbCur3hO3tZLe56m7TgbWl3U48+43b51ityq6+W5uYmkZOTzjHZerKpLhXwtWBMHWtjRQ4ZtcRbueaZrn/tEErPRU9PFHwIoY2M5mtAHmWq9RXlElodl5bfms/g88lwts0vXdt80k324RuBhNU6KIjcWM7AEd3LNaopGDckmys2wVc3FPfYkrVopOutLltcRm2GOWU9GTDl51clVi1PLYZsT3q7OZ2NLSMhB+dI7PZ4o1Z3lUNnS3t2L12er4MTd+bOURFpk6VW1we3+1+DG+teoTU2a4Pb/a/BjfWvUJqexe5ic31jxthIurfxwWb9b6sq56phq38cFm/W+rKueo/UO8XsWbs14aXuQ7rccWdP4Si9CRVNVstbjizp/CUXoSKpq3MDuiE7ReL+iCIi3CBPRVERVk62EREAREQBERAEREAREQBERAEREAREQBERAEREB1q6kpq6lkpaunjqIJW8GSORgc1w5iCoC0paAI6h0lzwUWxSHNzqCR2TT+Y47u4VYVFkqunW94s08vBpy48Ni+vmee12ttfaK6WhudHPSVMRydFKwtIPjXUV8Ma4Kw7jGi62vlAyYgdhM3sZI/zXBVr0j6C8RYd6rW2VzrzbxmewZlMwdLRv7oUtRmQnylyZTc/QrsfeVf5o/wAkSLPYOxhiHCNb1zY7jNT5kGSLPON+X5TTsKwUjHxyOZI0seDkQRkQelflbcoqS2ZCwnOqXFF7MtFo+1grLcTHR4qgNrqTkOuGZugcenlb9imm31tHcKVlVQ1UVTBIM2SRvDmkd0Lz1WewnjDEmFasT2O6T023bHnwmO7rTsK0LcCMucORY8LtHZD8t63Xr5l9lwoAwJrFUNQY6XF1vdSSbuu6XN0Z6XMO0eLhKasP4gsuIKUVdnuVPWxEZ5xPBI7o3hR1lM63+ZFoxs/HyVvXL/ZlkRFiN0IiIAiLhxABJOxARDrNY2dh3CYstBMWXG6AtLgcjHD8Y907gqkrcdMWKXYux9cbk2QupWSGGl5upsOQI7u9acp7Fp+HWvU5xq+a8rIbXRckFOer/oibfGRYnxNAfufnnS0zhl1f5zvm83OtG0J4LdjXGkFHM0/c+mymq3fMB2N/SOxXUpoYaWmjp4I2xxRNDWNAyAA2ABYM3JcPyR6kjoWlq9/HtXJdP3P1BDDTQMhhjZHGxoa1rBkABuAAX1RFEF2S2C1LSziRuFcB3S69U4EwiMVPz9Vd2Lcu5vW2KqutLjZt5xGzDNBNw6S2kmdzTsfPyj9EbO6s+NU7LEiN1TMWLjSl5vkiFiSXEu3krhFksM2movuIaC0UrSZaydsQ6MztPiU82kt2c4jFzkkvMtRqt2I2nRqytlj4M10ndUHPfwB2LfFsz/SUtro2S3wWm0UltpxlDTQtiZybAMl3d6rts+ObkdQw6PgURrXkjlEReDZKra4Pb/a/BjfWvUJqbNcHt/tfgxvrXqE1PYvcxOb6x42wkXVv44LN+t9WVc9Uw1b+OCzfrfVlXPUfqHeL2LN2a8NL3Id1uOLOn8JRehIqmq2WtxxZ0/hKL0JFU1bmB3RCdovF/RBERbhAnoqiIqydbCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAmXQiIDQNIWivCuM2PlqqLrK4HdWUwDX5/OG5w7u1V20gaF8WYX4dTSwfdagGZ6tTglzR85m8eJXHTLYtmrKsr6dCJzdHx8rnts/VHnYQQ4tIyI3hcK6+PNFOEMXGSeqtzaKvd/6ymAY8nncBsd49qgLHegnFlh6pU2lovdGMz7wMpgOlnL4lJ1Zlc+T5FUzNDycfnFcS/YiZdu03W5WerbVWyvqKKdhzEkMhafMvhUQT0074KmGSGZhyfHIwtcCOQgr5LZaTRDpyrfLkyaMGawmJrYGU+IKaG8wDIdVHvUwHdGw+TxqaMIaYsEYiDI23JtBVOy95q/e9p5A7cVS9Fq2YVc+a5Exja7lU8m+JfueiMUjJY2vie17SMwWnMEdBX7VDcL42xVhmQOst8rKZmeZi4fCjPdY7MeZSvhfWPu0HBjxDaIKxvLLTHqbvIcwtGeBZHpzLBj9osezlYuF/wWbWk6bb67D2jW71sb+BPJD1vCfnSdjmOkDhHxLGYZ004BvQax92Ntnd/Z1rOpjP8AO2t8pWia2uIaapw7Y7fQ1cNRBVTOnLopA9rg0ZDIjZvKx1Uy+KlJG5m59X4Sc6pJ8vuVvRFkcN2593xBQWyMcI1NQyLLunJTjey3ZzuMXKSXqWt1ZMLtsOjuK4ys4NZdndcyEjaI90be5lt/SUrhdW3UsNFQU9JAA2KGNrGgcwGS7BIG8hV2ybnNyZ1DFpjRTGteSOVytVxRj7CWGmuF3vlJFKzfCx/Dlz5uAMyPGoM0kawFbXwvt+EIJKGN2YdWzZdVy+aNze6vdWPZY+SMGXqeNjL80ufoupv+nrSrTYToJLJZ5myXudhBIOYpmn4x+dzBVLlkfLK+WR7nveSXk7SSd5K/VTPNU1D56mWSaWRxc+R5LnOJ5SSvkpqiiNMdiiajqFmbZxS6eSCsHqm4ML6moxnXQjgsDqehDh8Y/DeO4OxH6SiXRlg24Y2xPDaqJjmQAh9VPl2MMYO0npPIFdyw2qjstoprXb4RDTU0YjjaOYcp6TyrWzb1GPAurJTs/p7ss+PNcl0/dmQREUQXcIiICq2uD2/2vwY31sihNXG0r6JKLSBfKW61F4qKF8FMIA2OIOBAc52eZI/KWo+5ptPyorf3dv8ANS2PlVwrUWyl6lo+VfkynCPJ/uRZq38cFm/W+rKueog0f6Drfg/FdJiCnvtVVSU3CyifC1oObS3eD0qXwtPLtjZNOJN6Jh24tDhatnuQ7rccWdP4Si9CRVNVstbjizp/CUXoSKpqkMDuit9ovF/RBERbhAnoqiIqydbCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIDW8XYJwziuEsvVqgqH5ZCYN4Mje44bVCeNdXKVvDqMJ3UP3ltLW7D3A8e0Kx4TxrNXkWV9GaGVpuNk/PHn6+ZQvFODMUYZmMd6stXSN5JCzhRnuPbmD5VgF6HVEENRE6GeJksbhkWvAcD3QVHmLNDGBb+Xyfc026odmeq0TuBtPLwdo8y3q9QT5TRXcrs1Nc6Zb/symaKccVaumIaLhzYfudNc4+SKb3mXubc2nytUWYhwdifD7yy8WStpmj45jJaf0hsW7C+ufRkDfp+Rjv8A7kGjAoiLKafNBdu03CstVyguNvnNPV07w+KUNBLXDcRnmuoiNJrZn1Nxe6N2l0saRZG8B2KqzL5rWD7AsLdMXYougLa/EN0qGHex9U7g+TPJYNF4VcF0RmllXT5Sm39QiIvZg33C2PAODL7jO7st9opy4Ajq1Q/ZHC3ncfZyrX43NZI1z4w9oIJY7MAjm2KYsH6dpcNW2K3UWDrTDTR7208j4y485JzzPSViulNR/It2bmFCiVn/AH5bL7lhtHOC7TgiwMttuYDIcnTzuHZyv5z7AtpVeKfWZhyHXGD5GnLfHXg+YsCyEGsrh8/12HbozZ8SRjvtIURLGvk92i706tp9cFCE9kvcnfxJ4lCcWsjg8s98s1+DuYRxOHlMgX690jgz/tN/+ph/5V4/DW/pM39Ww/8AkRNXiTxKFfdI4M/7Tf8A6mH/AJU90jgz/tN/+ph/5U/DW/pH9Ww/+RE1eJPEoV90jgz/ALTf/qYf+VPdI4M/7Tf/AKmH/lT8Nb+kf1bD/wCRE1eJcqFPdI4M/wC03/6mH/lT3SODP+03/wCph/5U/DW/pH9Ww/8AkR2Nbjizp/CUXoSKpymzTjpcw/jrB8VmtVBdKeZlWycuqo42t4Ia8Edi8nPaoSUrhwlCvZop2uX135PHW91sERFtEOeiqIirJ1sIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAvnLFHNGWSxse07w9uYPiK+iIGtzSMS6LMC3/hPrcPUzJXb5afOF+fPm3LPxqNsQ6tlsk4T7DiGrgOWyKrjbIP2m8EgeIqf0WaGRZDozQu0zFu+eCKf37QPj22cJ1NS0tyiHLTTbT+i7IrRL1hbElmJFzslfS5by+B3B8u5X8X4exjxk9jSOYjNbMNQmuqIm3s1RLnXJr+TzuXCvleME4RvGbrlhu11Dz8c0zQ/9oDNafdNA2jytzMNBV0BP+HqXfY/hLYjqEH1RG29mb4/JJMp8uFZe5atdqcC634jq4uZksLXDygha3cNW/EUWZor3b6jmD2uYfas0cyqXmaM9DzYf2b+xBiKU63QLpCpySykoqhv/t1A9uSwtVoj0iU+fDwxVPA5Y3sd9hzWRX1vpJGpLT8mPWD/AMGjLlbJUYAxvBn1TCd52fkUj3eiCujPhjEkPC6th+7xcDfw6KQZd3ML2pxfRmF02R6xZiEXektF2jYXvtdc0DeTA4D7F8esqz/CT/VletzG4SXVHXRdjrKs/wAJP9WU6yrP8JP9WU3Q4WddF2Osqz/CT/VlOsqz/CT/AFZTdDhZ10XY6yrP8JP9WU6yrP8ACT/VlN0OFnXRdjrKs/wk/wBWU6yrP8JP9WU3Q4WddF2Osqz/AAk/1ZRN0OFn/9k=" style="width:40px;height:40px;object-fit:contain;flex-shrink:0;" />
      <div>
        <div style="font-size:14px;font-weight:700;color:#1a1a2e;letter-spacing:-0.3px;">365자연안에 한의원 양산점</div>
        <div style="font-size:9px;color:#9090b0;letter-spacing:1.5px;margin-top:1px;">365 NATURE KOREAN MEDICINE CLINIC YANGSAN</div>
      </div>
    </div>
    <div style="height:1px;background:linear-gradient(90deg,#2d6a4f,rgba(45,106,79,0.1));margin-top:32px;"></div>
  </div>

  <!-- 중앙: 환자 정보 -->
  <div style="padding:0 60px;position:relative;z-index:1;">
    <div style="font-size:10px;letter-spacing:3px;color:#52b788;margin-bottom:16px;font-weight:600;text-transform:uppercase;">건강관리 리포트 · Health Management Report</div>

    <div style="font-size:52px;font-weight:700;color:#1a1a2e;line-height:1.1;margin-bottom:6px;letter-spacing:-1px;">
      ${patient.name}
      <span style="font-size:26px;font-weight:400;color:#4a4a6a;">님</span>
    </div>
    <div style="font-size:18px;font-weight:300;color:#4a4a6a;margin-bottom:36px;">건강관리 기록</div>

    <div style="width:48px;height:3px;background:linear-gradient(90deg,#2d6a4f,#52b788);border-radius:2px;margin-bottom:36px;"></div>

    <!-- 환자 정보 가로 카드 -->
    <div style="display:flex;gap:0;border:1px solid #d4e8d8;border-radius:12px;overflow:hidden;background:#fff;max-width:480px;box-shadow:0 2px 12px rgba(45,106,79,0.06);">
      <div style="flex:1;padding:18px 20px;border-right:1px solid #d4e8d8;">
        <div style="font-size:9px;letter-spacing:1.5px;color:#9090b0;margin-bottom:5px;text-transform:uppercase;">차트번호</div>
        <div style="font-size:17px;font-weight:700;color:#1a1a2e;">#${patient.chart_number}</div>
      </div>
      <div style="flex:1;padding:18px 20px;border-right:1px solid #d4e8d8;">
        <div style="font-size:9px;letter-spacing:1.5px;color:#9090b0;margin-bottom:5px;text-transform:uppercase;">성별</div>
        <div style="font-size:17px;font-weight:700;color:#1a1a2e;">${patient.gender === "female" ? "여성" : "남성"}</div>
      </div>
      <div style="flex:1;padding:18px 20px;">
        <div style="font-size:9px;letter-spacing:1.5px;color:#9090b0;margin-bottom:5px;text-transform:uppercase;">${goal ? "관리 시작일" : "출력일"}</div>
        <div style="font-size:14px;font-weight:700;color:#1a1a2e;">${goal ? formatDate(goal.start_date) : formatDate(today())}</div>
      </div>
    </div>
  </div>

  <!-- 하단 푸터 -->
  <div style="padding:0 60px 44px;position:relative;z-index:1;">
    <div style="height:1px;background:linear-gradient(90deg,rgba(45,106,79,0.3),transparent);margin-bottom:18px;"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div style="font-size:10px;color:#9090b0;">출력일 · ${formatDate(today())}</div>
      <div style="font-size:10px;color:#9090b0;">본 문서는 개인 건강정보가 포함되어 있습니다</div>
    </div>
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
  <div class="chart-row">
    <div class="chart-block">
      <div class="chart-label">체중 추이 (kg)</div>
      <div class="chart-wrap" style="height:225px;">${makeSVG(ms, "weight", "#2d6a4f", "체중", "kg", true)}</div>
    </div>
    ${ms.some(m => m.bmi) ? `
    <div class="chart-block">
      <div class="chart-label">BMI 추이</div>
      <div class="chart-wrap" style="height:225px;">${makeSVG(ms, "bmi", "#c9a94e", "BMI", "")}</div>
    </div>` : "<div></div>"}
  </div>
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
  <div class="chart-row" style="grid-template-columns:1fr 1fr 1fr;">
    <div class="chart-block">
      <div class="chart-label">골격근량 추이 (kg)</div>
      <div class="chart-wrap" style="height:180px;">${makeSVG(ib.map(r => ({measured_at: r.measured_at, muscle_mass: r.parsed_data?.muscle_mass})), "muscle_mass", "#2d6a4f", "골격근량", "kg")}</div>
    </div>
    <div class="chart-block">
      <div class="chart-label">체지방량 추이 (kg)</div>
      <div class="chart-wrap" style="height:180px;">${makeSVG(ib.map(r => ({measured_at: r.measured_at, body_fat_mass: r.parsed_data?.body_fat_mass})), "body_fat_mass", "#c9a94e", "체지방량", "kg")}</div>
    </div>
    <div class="chart-block">
      <div class="chart-label">체지방률 추이 (%)</div>
      <div class="chart-wrap" style="height:180px;">${makeSVG(ib.map(r => ({measured_at: r.measured_at, body_fat_percent: r.parsed_data?.body_fat_percent})), "body_fat_percent", "#e07a5f", "체지방률", "%")}</div>
    </div>
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

<div class="footer" style="page-break-before:avoid;break-before:avoid;">
  <span>건강관리 리포트</span>
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
