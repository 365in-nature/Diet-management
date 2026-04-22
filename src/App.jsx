import { useState, useEffect, useCallback } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =============================================
// CONFIGURATION - Supabase 연결 정보 입력 필요
// =============================================
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
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
function LineChart({ data, valueKey, color = "#52b788", label = "" }) {
  if (!data || data.length < 2) return <div className="empty" style={{height: 120}}>데이터가 부족합니다 (최소 2개)</div>;

  const values = data.map(d => d[valueKey]).filter(v => v != null);
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const w = 500, h = 160, padX = 40, padY = 20;

  const pts = data
    .filter(d => d[valueKey] != null)
    .map((d, i, arr) => {
      const x = padX + (i / (arr.length - 1)) * (w - padX * 2);
      const y = padY + ((max - d[valueKey]) / (max - min)) * (h - padY * 2);
      return { x, y, d };
    });

  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length-1].x} ${h} L ${pts[0].x} ${h} Z`;

  return (
    <div className="chart-wrap">
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
    setPatients(data || []);

    // 오늘 해피콜 알림 확인
    const { data: prescriptions } = await supabase.from("prescriptions")
      .select("*, prescription_updates(*)")
      .eq("is_completed", false);

    const alertMap = {};
    (prescriptions || []).forEach(p => {
      const latestUpdate = p.prescription_updates?.sort((a,b) => b.updated_at.localeCompare(a.updated_at))[0];
      const reservationDate = latestUpdate ? latestUpdate.new_reservation_happycall_date : p.reservation_happycall_date;
      const arrivalDate = p.arrival_happycall_date;

      const hasAlert = isTodayOrPast(arrivalDate) || isTodayOrPast(reservationDate);
      if (hasAlert) {
        alertMap[p.patient_id] = (alertMap[p.patient_id] || []);
        if (isTodayOrPast(arrivalDate)) alertMap[p.patient_id].push("도착");
        if (isTodayOrPast(reservationDate)) alertMap[p.patient_id].push("예약");
      }
    });
    setAlerts(alertMap);
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
                    <div className="patient-name">{p.name}</div>
                    <div className="patient-chart">차트 #{p.chart_number}</div>
                  </div>
                  <div style={{display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end"}}>
                    {todayAlerts.map(a => (
                      <span key={a} className={`badge ${a === "도착" ? "badge-info" : "badge-warn"}`}>
                        {a === "도착" ? "📦" : "📅"} {a} 해피콜
                      </span>
                    ))}
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
                      {pkg.package_months}개월 패키지 · 잔여 {pkg.remaining_months}개월
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

  return (
    <div>
      <button className="back-btn" onClick={onBack}>← 환자 목록으로</button>
      <div className="patient-detail-header">
        <div>
          <div className="detail-name">{patient.name}</div>
          <div className="detail-meta">차트 #{patient.chart_number} · {patient.gender === "female" ? "여성" : "남성"} · {patient.phone || "연락처 없음"}</div>
        </div>
      </div>

      <div className="tabs">
        {[
          { key: "measurement", label: "① 체형 측정" },
          { key: "inbody", label: "② 인바디 분석" },
          { key: "prescription", label: "③ 약 처방" },
          { key: "visit", label: "④ 내방 치료" },
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
function MeasurementTab({ patient, currentUser }) {
  const [measurements, setMeasurements] = useState([]);
  const [goal, setGoal] = useState(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showMeasureForm, setShowMeasureForm] = useState(false);
  const [mForm, setMForm] = useState({ measured_at: today(), weight: "", body_fat_percent: "" });
  const [gForm, setGForm] = useState({ target_weight: "", target_period_weeks: "", start_date: today() });

  const load = useCallback(async () => {
    const { data: m } = await supabase.from("measurements").select("*").eq("patient_id", patient.id).order("measured_at");
    const { data: g } = await supabase.from("goals").select("*").eq("patient_id", patient.id).order("created_at", { ascending: false }).limit(1);
    setMeasurements(m || []);
    setGoal(g?.[0] || null);
  }, [patient.id]);

  useEffect(() => { load(); }, [load]);

  const saveMeasurement = async () => {
    if (!mForm.weight && !mForm.body_fat_percent) return;
    await supabase.from("measurements").insert([{ ...mForm, patient_id: patient.id, created_by: currentUser.id }]);
    setMForm({ measured_at: today(), weight: "", body_fat_percent: "" });
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
    if (goal) setGForm({ target_weight: goal.target_weight || "", target_period_weeks: goal.target_period_weeks || "", start_date: goal.start_date || today() });
  }, [goal]);

  const latestWeight = measurements[measurements.length-1]?.weight;
  const startWeight = measurements[0]?.weight;
  const lost = startWeight && latestWeight ? (startWeight - latestWeight).toFixed(1) : null;

  return (
    <div>
      {/* 목표 카드 */}
      <div className="card" style={{marginBottom: 16}}>
        <div className="section-header">
          <div className="section-title">🎯 목표 설정</div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowGoalForm(!showGoalForm)}>
            {goal ? "수정" : "목표 등록"}
          </button>
        </div>
        {goal ? (
          <div style={{display:"flex", gap:24, flexWrap:"wrap"}}>
            <div><div className="form-label">목표 체중</div><div style={{fontSize:20,fontWeight:700,color:"var(--accent)"}}>{goal.target_weight} kg</div></div>
            <div><div className="form-label">목표 기간</div><div style={{fontSize:20,fontWeight:700}}>{goal.target_period_weeks}주</div></div>
            <div><div className="form-label">시작일</div><div style={{fontSize:14,fontWeight:600}}>{formatDate(goal.start_date)}</div></div>
            {lost && <div><div className="form-label">현재까지 감량</div><div style={{fontSize:20,fontWeight:700,color:"var(--info)"}}>-{lost} kg</div></div>}
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
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowGoalForm(false)}>취소</button>
              <button className="btn btn-primary btn-sm" onClick={saveGoal}>저장</button>
            </div>
          </div>
        )}
      </div>

      {/* 측정값 */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">📊 체형 측정 기록</div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowMeasureForm(!showMeasureForm)}>+ 측정값 입력</button>
        </div>

        {showMeasureForm && (
          <div style={{background:"var(--surface2)", borderRadius:8, padding:16, marginBottom:16}}>
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">측정일</label>
                <input className="form-input" type="date" value={mForm.measured_at} onChange={e => setMForm({...mForm, measured_at: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">체중 (kg)</label>
                <input className="form-input" type="number" step="0.1" placeholder="0.0" value={mForm.weight} onChange={e => setMForm({...mForm, weight: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">체지방률 (%)</label>
                <input className="form-input" type="number" step="0.1" placeholder="0.0" value={mForm.body_fat_percent} onChange={e => setMForm({...mForm, body_fat_percent: e.target.value})} />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowMeasureForm(false)}>취소</button>
              <button className="btn btn-primary btn-sm" onClick={saveMeasurement}>저장</button>
            </div>
          </div>
        )}

        {measurements.length >= 2 && (
          <div style={{marginBottom:16}}>
            <div className="form-label" style={{marginBottom:8}}>체중 추이 (kg)</div>
            <LineChart data={measurements} valueKey="weight" color="var(--accent)" />
            {measurements.some(m => m.body_fat_percent) && (
              <>
                <div className="form-label" style={{margin:"16px 0 8px"}}>체지방률 추이 (%)</div>
                <LineChart data={measurements} valueKey="body_fat_percent" color="var(--info)" />
              </>
            )}
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>측정일</th><th>체중 (kg)</th><th>체지방률 (%)</th><th>변화</th></tr>
            </thead>
            <tbody>
              {[...measurements].reverse().map((m, i, arr) => {
                const prev = arr[i+1];
                const diff = prev && m.weight && prev.weight ? (m.weight - prev.weight).toFixed(1) : null;
                return (
                  <tr key={m.id}>
                    <td>{formatDate(m.measured_at)}</td>
                    <td><strong>{m.weight || "-"}</strong></td>
                    <td>{m.body_fat_percent || "-"}</td>
                    <td>{diff ? <span style={{color: diff < 0 ? "var(--accent)" : "var(--warn)", fontWeight:600}}>{diff > 0 ? "+" : ""}{diff}</span> : "-"}</td>
                  </tr>
                );
              })}
              {measurements.length === 0 && <tr><td colSpan={4} className="empty">측정 기록이 없습니다</td></tr>}
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
function InbodyTab({ patient, currentUser }) {
  const [records, setRecords] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("inbody_records").select("*").eq("patient_id", patient.id).order("measured_at", { ascending: false });
    setRecords(data || []);
  }, [patient.id]);

  useEffect(() => { load(); }, [load]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") return alert("PDF 파일만 업로드 가능합니다.");

    setUploading(true);
    // Supabase Storage에 업로드
    const fileName = `inbody/${patient.id}/${Date.now()}.pdf`;
    const { data: uploadData, error: uploadErr } = await supabase.storage.from("inbody-pdfs").upload(fileName, file);
    if (uploadErr) { alert("업로드 실패: " + uploadErr.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("inbody-pdfs").getPublicUrl(fileName);

    // PDF를 base64로 변환 후 Claude API로 파싱
    setParsing(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result.split(",")[1];
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{
              role: "user",
              content: [
                { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
                { type: "text", text: `이 InBody 결과지에서 다음 수치를 추출해서 JSON으로만 응답해주세요 (단위 제외, 숫자만):
{
  "measured_date": "YYYY-MM-DD",
  "weight": 숫자,
  "body_fat_percent": 숫자,
  "muscle_mass": 숫자,
  "bmi": 숫자,
  "bmr": 숫자,
  "body_fat_mass": 숫자,
  "total_body_water": 숫자
}
없는 항목은 null로 표시. JSON만 응답, 설명 없이.` }
              ]
            }]
          })
        });
        const result = await res.json();
        const text = result.content?.[0]?.text || "{}";
        const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

        await supabase.from("inbody_records").insert([{
          patient_id: patient.id,
          measured_at: parsed.measured_date || today(),
          parsed_data: parsed,
          pdf_url: urlData.publicUrl,
          created_by: currentUser.id
        }]);
        load();
      } catch(err) {
        alert("파싱 실패. 수동으로 입력해주세요.");
      }
      setParsing(false);
      setUploading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const chartData = records.map(r => ({
    measured_at: r.measured_at,
    weight: r.parsed_data?.weight,
    body_fat_percent: r.parsed_data?.body_fat_percent,
    muscle_mass: r.parsed_data?.muscle_mass,
  })).reverse();

  const inbodyFields = [
    { key: "weight", label: "체중", unit: "kg" },
    { key: "body_fat_percent", label: "체지방률", unit: "%" },
    { key: "muscle_mass", label: "골격근량", unit: "kg" },
    { key: "bmi", label: "BMI", unit: "" },
    { key: "bmr", label: "기초대사량", unit: "kcal" },
    { key: "body_fat_mass", label: "체지방량", unit: "kg" },
    { key: "total_body_water", label: "체수분", unit: "L" },
  ];

  return (
    <div>
      <div className="card" style={{marginBottom:16}}>
        <div className="section-header">
          <div className="section-title">📄 인바디 PDF 업로드</div>
        </div>
        <label style={{display:"inline-flex",alignItems:"center",gap:8,cursor:"pointer"}}>
          <span className="btn btn-primary">
            {uploading ? (parsing ? "🤖 AI 분석 중..." : "업로드 중...") : "+ PDF 업로드"}
          </span>
          <input type="file" accept=".pdf" style={{display:"none"}} onChange={handleFileUpload} disabled={uploading} />
        </label>
        <div style={{fontSize:12, color:"var(--ink-muted)", marginTop:8}}>InBody 기기에서 출력한 PDF를 업로드하면 AI가 자동으로 수치를 분석합니다</div>
      </div>

      {chartData.length >= 2 && (
        <div className="card" style={{marginBottom:16}}>
          <div className="section-title" style={{marginBottom:12}}>📈 변화 추이</div>
          <div className="form-label" style={{marginBottom:8}}>체중 (kg)</div>
          <LineChart data={chartData} valueKey="weight" color="var(--accent)" />
          {chartData.some(d => d.muscle_mass) && (
            <>
              <div className="form-label" style={{margin:"16px 0 8px"}}>골격근량 (kg)</div>
              <LineChart data={chartData} valueKey="muscle_mass" color="var(--gold)" />
            </>
          )}
        </div>
      )}

      <div className="card">
        <div className="section-title" style={{marginBottom:16}}>🗂 측정 이력</div>
        {records.length === 0 ? <div className="empty">인바디 기록이 없습니다</div> : (
          <div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
              {records.map(r => (
                <button key={r.id} className={`btn btn-sm ${selected?.id === r.id ? "btn-primary" : "btn-secondary"}`} onClick={() => setSelected(selected?.id === r.id ? null : r)}>
                  {formatDate(r.measured_at)}
                </button>
              ))}
            </div>
            {selected && (
              <div style={{background:"var(--surface2)", borderRadius:8, padding:16}}>
                <div style={{fontWeight:700, marginBottom:12}}>{formatDate(selected.measured_at)} 측정 결과</div>
                {inbodyFields.map(f => selected.parsed_data?.[f.key] != null && (
                  <div key={f.key} className="inbody-item">
                    <span className="inbody-label">{f.label}</span>
                    <span className="inbody-value">{selected.parsed_data[f.key]} {f.unit}</span>
                  </div>
                ))}
                {selected.pdf_url && <a href={selected.pdf_url} target="_blank" rel="noreferrer" style={{display:"inline-block",marginTop:12,fontSize:12,color:"var(--info)"}}>📥 원본 PDF 보기</a>}
              </div>
            )}
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
  const [pkg, setPkg] = useState(null);
  const [prescriptions, setAllPrescriptions] = useState([]);
  const [showPkgForm, setShowPkgForm] = useState(false);
  const [showRxForm, setShowRxForm] = useState(false);
  const [pkgForm, setPkgForm] = useState({ package_months: 3, start_date: today() });
  const [rxForm, setRxForm] = useState({ prescribed_at: today(), medicine_type: "hwan", duration_days: 30 });
  const [happycalls, setHappycalls] = useState({});
  const [updates, setUpdates] = useState({});
  const [remainingInput, setRemainingInput] = useState({});

  const load = useCallback(async () => {
    const { data: pkgs } = await supabase.from("packages").select("*").eq("patient_id", patient.id).eq("is_active", true).order("created_at", { ascending: false }).limit(1);
    const { data: rxs } = await supabase.from("prescriptions").select("*").eq("patient_id", patient.id).order("prescribed_at", { ascending: false });
    const { data: hcs } = await supabase.from("happycall_logs").select("*").in("prescription_id", (rxs||[]).map(r => r.id));
    const { data: upds } = await supabase.from("prescription_updates").select("*").in("prescription_id", (rxs||[]).map(r => r.id)).order("updated_at", { ascending: false });

    setPkg(pkgs?.[0] || null);
    setAllPrescriptions(rxs || []);

    const hcMap = {};
    (hcs || []).forEach(h => { if (!hcMap[h.prescription_id]) hcMap[h.prescription_id] = []; hcMap[h.prescription_id].push(h); });
    setHappycalls(hcMap);

    const updMap = {};
    (upds || []).forEach(u => { if (!updMap[u.prescription_id]) updMap[u.prescription_id] = []; updMap[u.prescription_id].push(u); });
    setUpdates(updMap);
  }, [patient.id]);

  useEffect(() => { load(); }, [load]);

  const savePkg = async () => {
    if (pkg) await supabase.from("packages").update({ is_active: false }).eq("id", pkg.id);
    await supabase.from("packages").insert([{
      patient_id: patient.id,
      package_months: Number(pkgForm.package_months),
      start_date: pkgForm.start_date,
      remaining_months: Number(pkgForm.package_months),
      created_by: currentUser.id
    }]);
    setShowPkgForm(false);
    load();
  };

  const saveRx = async () => {
    if (!pkg) { alert("먼저 패키지를 등록해주세요."); return; }
    const expectedEnd = addDays(rxForm.prescribed_at, Number(rxForm.duration_days));
    const arrivalHappy = addBusinessDays(rxForm.prescribed_at, 3);
    const reservationHappy = subtractBusinessDays(expectedEnd, 3);
    await supabase.from("prescriptions").insert([{
      patient_id: patient.id,
      package_id: pkg.id,
      prescribed_at: rxForm.prescribed_at,
      medicine_type: rxForm.medicine_type,
      duration_days: Number(rxForm.duration_days),
      expected_end_date: expectedEnd,
      arrival_happycall_date: arrivalHappy,
      reservation_happycall_date: reservationHappy,
      created_by: currentUser.id
    }]);
    setShowRxForm(false);
    load();
  };

  const completeRx = async (rx) => {
    if (!window.confirm("복용 완료 처리하시겠습니까?")) return;
    await supabase.from("prescriptions").update({ is_completed: true, completed_at: today() }).eq("id", rx.id);
    if (pkg) {
      const newRemaining = Math.max(0, pkg.remaining_months - (rx.duration_days / 30));
      await supabase.from("packages").update({ remaining_months: Math.round(newRemaining * 2) / 2 }).eq("id", pkg.id);
    }
    load();
  };

  const saveRemainingUpdate = async (rxId, rx) => {
    const days = Number(remainingInput[rxId]);
    if (!days || days < 1) return;
    const newEnd = addDays(today(), days);
    const newHappy = subtractBusinessDays(newEnd, 3);
    await supabase.from("prescription_updates").insert([{
      prescription_id: rxId,
      remaining_days: days,
      new_expected_end_date: newEnd,
      new_reservation_happycall_date: newHappy,
      created_by: currentUser.id
    }]);
    setRemainingInput({...remainingInput, [rxId]: ""});
    load();
  };

  const toggleHappycall = async (rxId, callType, existing) => {
    if (existing) {
      await supabase.from("happycall_logs").update({ is_done: !existing.is_done }).eq("id", existing.id);
    } else {
      const memo = window.prompt("해피콜 메모 (선택사항):");
      await supabase.from("happycall_logs").insert([{
        prescription_id: rxId,
        call_type: callType,
        is_done: true,
        memo: memo || null,
        called_by: currentUser.id
      }]);
    }
    load();
  };

  const activePrescriptions = prescriptions.filter(r => !r.is_completed);
  const completedPrescriptions = prescriptions.filter(r => r.is_completed);

  // 패키지 시각화
  const renderPackageProgress = () => {
    if (!pkg) return null;
    const total = pkg.package_months;
    const used = total - pkg.remaining_months;
    return (
      <div className="pkg-status">
        {Array.from({length: total}).map((_, i) => (
          <div key={i} className={`pkg-month ${i < used ? "pkg-month-done" : "pkg-month-remaining"}`}>
            {i < used ? "✓" : `${i+1}M`}
          </div>
        ))}
        <div style={{marginLeft:8, fontSize:13, color:"var(--ink-muted)", alignSelf:"center"}}>
          잔여 <strong style={{color:"var(--accent)"}}>{pkg.remaining_months}개월</strong>
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
            <div style={{display:"flex", gap:8, alignItems:"center"}}>
              <span className="happycall-date">{formatDate(rx.arrival_happycall_date)}</span>
              {arrivalToday && !arrivalHC?.is_done && <span className="badge badge-info">오늘!</span>}
              <button className={`btn btn-xs ${arrivalHC?.is_done ? "btn-secondary" : "btn-primary"}`}
                onClick={() => toggleHappycall(rx.id, "arrival", arrivalHC)}>
                {arrivalHC?.is_done ? "✓ 완료" : "완료 처리"}
              </button>
            </div>
          </div>
          {arrivalHC?.memo && <div style={{fontSize:12, color:"var(--ink-muted)"}}>💬 {arrivalHC.memo}</div>}
        </div>

        {/* 예약 해피콜 */}
        <div className={`happycall-card ${reservationHC?.is_done ? "happycall-done" : "happycall-reservation"}`}>
          <div className="happycall-header">
            <span className="happycall-type">📅 예약 해피콜</span>
            <div style={{display:"flex", gap:8, alignItems:"center"}}>
              <span className="happycall-date">{formatDate(reservationDate)}</span>
              {reservationToday && !reservationHC?.is_done && <span className="badge badge-warn">오늘!</span>}
              <button className={`btn btn-xs ${reservationHC?.is_done ? "btn-secondary" : "btn-danger"}`}
                onClick={() => toggleHappycall(rx.id, "reservation", reservationHC)}>
                {reservationHC?.is_done ? "✓ 완료" : "완료 처리"}
              </button>
            </div>
          </div>
          {reservationHC?.memo && <div style={{fontSize:12, color:"var(--ink-muted)"}}>💬 {reservationHC.memo}</div>}

          {/* 잔여 일수 업데이트 */}
          {!reservationHC?.is_done && (
            <div className="remaining-input-row">
              <span style={{fontSize:12}}>잔여 한약 일수:</span>
              <input type="number" min="1" placeholder="5" value={remainingInput[rx.id] || ""} onChange={e => setRemainingInput({...remainingInput, [rx.id]: e.target.value})} />
              <span style={{fontSize:12}}>일</span>
              <button className="btn btn-sm btn-secondary" onClick={() => saveRemainingUpdate(rx.id, rx)}>날짜 재산출</button>
            </div>
          )}

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
            {pkg ? "패키지 변경" : "패키지 등록"}
          </button>
        </div>
        {pkg ? renderPackageProgress() : <div className="empty" style={{padding:12}}>등록된 패키지가 없습니다</div>}

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
            <div style={{fontSize:12, color:"var(--ink-muted)", marginTop:8}}>
              📦 도착 해피콜: {addBusinessDays(rxForm.prescribed_at, 3)} &nbsp;|&nbsp;
              📅 예약 해피콜: {subtractBusinessDays(addDays(rxForm.prescribed_at, Number(rxForm.duration_days)), 3)}
            </div>
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
                <button className="btn btn-sm btn-danger" onClick={() => completeRx(rx)}>복용 완료</button>
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
                <tr><th>처방일</th><th>종류</th><th>기간</th><th>완료일</th></tr>
              </thead>
              <tbody>
                {completedPrescriptions.map(rx => (
                  <tr key={rx.id}>
                    <td>{formatDate(rx.prescribed_at)}</td>
                    <td><span className={`badge badge-sm ${rx.medicine_type === "hwan" ? "badge-success" : "badge-gold"}`}>{rx.medicine_type === "hwan" ? "환약" : "탕약"}</span></td>
                    <td>{rx.duration_days}일</td>
                    <td>{formatDate(rx.completed_at)}</td>
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

  const TREATMENTS = [
    { key: "acupuncture", label: "침" },
    { key: "moxibustion", label: "뜸" },
    { key: "chuna", label: "추나" },
    { key: "cupping", label: "부항" },
    { key: "herbal_bath", label: "약탕" },
    { key: "other", label: "기타" },
  ];

  const load = useCallback(async () => {
    const { data } = await supabase.from("visits").select("*").eq("patient_id", patient.id).order("visited_at", { ascending: false });
    setVisits(data || []);
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
    await supabase.from("visits").insert([{ ...form, patient_id: patient.id, created_by: currentUser.id }]);
    setForm({ visited_at: today(), treatment_types: [], memo: "" });
    setShowForm(false);
    load();
  };

  const treatmentLabel = (key) => TREATMENTS.find(t => t.key === key)?.label || key;

  return (
    <div>
      <div className="card">
        <div className="section-header">
          <div className="section-title">🏥 내방 치료 기록</div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>+ 내방 기록</button>
        </div>

        {showForm && (
          <div style={{background:"var(--surface2)", borderRadius:8, padding:16, marginBottom:16}}>
            <div className="form-group" style={{marginBottom:12}}>
              <label className="form-label">내방일</label>
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

        {visits.length === 0 ? <div className="empty">내방 기록이 없습니다</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>내방일</th><th>치료</th><th>메모</th></tr>
              </thead>
              <tbody>
                {visits.map(v => (
                  <tr key={v.id}>
                    <td><strong>{formatDate(v.visited_at)}</strong></td>
                    <td>{(v.treatment_types || []).map(t => <span key={t} className="treatment-tag">{treatmentLabel(t)}</span>)}</td>
                    <td style={{maxWidth:200, color:"var(--ink-muted)", fontSize:12}}>{v.memo || "-"}</td>
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
