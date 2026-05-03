import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { daysSinceBackup } from "./lib/dateUtils";
import Dashboard from "./pages/Dashboard";
import DietPatients from "./pages/DietPatients";
import TangPatients from "./pages/TangPatients";
import TrafficPatients from "./pages/TrafficPatients";
import NewPatients from "./pages/NewPatients";
import VisitStats from "./pages/VisitStats";
import Notices from "./pages/Notices";
import Plants from "./pages/Plants";
import Admin from "./pages/Admin";

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
    --gold-pale: #fef9ec;
    --teal: #0097a7;
    --teal-pale: #e0f7fa;
    --traffic: #7b5ea7;
    --traffic-pale: #f3eeff;
    --shadow-sm: 0 1px 3px rgba(26,26,46,0.08);
    --shadow-md: 0 4px 16px rgba(26,26,46,0.10);
    --shadow-lg: 0 8px 32px rgba(26,26,46,0.13);
    --r: 12px;
    --r-sm: 8px;
  }

  body { font-family: 'Noto Sans KR', sans-serif; background: var(--cream); color: var(--ink); }

  .app { min-height: 100vh; }

  /* ── LOGIN ── */
  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--ink); }
  .login-card { background: var(--surface); border-radius: 20px; padding: 48px 40px; width: 100%; max-width: 400px; box-shadow: var(--shadow-lg); }
  .login-logo { font-family: 'DM Serif Display', serif; font-size: 28px; color: var(--accent); margin-bottom: 4px; }
  .login-clinic { font-size: 13px; font-weight: 700; color: var(--ink-light); margin-bottom: 4px; }
  .login-sub { color: var(--ink-muted); font-size: 12px; margin-bottom: 32px; }
  .login-card input { width: 100%; padding: 12px 16px; border: 1.5px solid var(--border); border-radius: var(--r-sm); font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.2s; margin-bottom: 12px; }
  .login-card input:focus { border-color: var(--accent); }
  .btn-login { width: 100%; padding: 13px; background: var(--accent); color: #fff; border: none; border-radius: var(--r-sm); font-size: 15px; font-weight: 600; font-family: inherit; cursor: pointer; transition: background 0.2s; }
  .btn-login:hover { background: #235c42; }
  .login-err { color: var(--warn); font-size: 13px; margin-top: 8px; }

  /* ── LAYOUT ── */
  .layout { display: flex; min-height: 100vh; }
  .sidebar { width: 220px; background: var(--ink); color: #fff; padding: 24px 0; display: flex; flex-direction: column; position: fixed; top: 0; left: 0; height: 100vh; z-index: 100; overflow-y: auto; }
  .sidebar-logo { font-family: 'DM Serif Display', serif; font-size: 18px; color: var(--accent-light); padding: 0 24px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .sidebar-logo span { display: block; font-family: 'Noto Sans KR', sans-serif; font-size: 10px; color: rgba(255,255,255,0.4); font-weight: 300; margin-top: 2px; }
  .sidebar-section { padding: 12px 24px 4px; font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.25); text-transform: uppercase; letter-spacing: 1px; }
  .sidebar-nav { flex: 1; padding: 8px 0; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 24px; font-size: 13px; cursor: pointer; color: rgba(255,255,255,0.6); transition: all 0.2s; border-left: 3px solid transparent; }
  .nav-item:hover { color: #fff; background: rgba(255,255,255,0.05); }
  .nav-item.active { color: var(--accent-light); border-left-color: var(--accent-light); background: rgba(82,183,136,0.08); }
  .nav-item.disabled { opacity: 0.4; cursor: default; }
  .nav-badge { font-size: 9px; background: var(--warn); color: #fff; border-radius: 10px; padding: 1px 6px; margin-left: auto; font-weight: 700; }

  .sidebar-bottom { padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.08); margin-top: auto; }
  .sidebar-user { font-size: 12px; color: rgba(255,255,255,0.5); }
  .sidebar-user strong { display: block; color: rgba(255,255,255,0.85); font-size: 13px; margin-bottom: 2px; }
  .sidebar-user span { font-size: 10px; }
  .btn-logout { margin-top: 10px; background: transparent; border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.5); font-size: 12px; font-family: inherit; padding: 6px 12px; border-radius: 6px; cursor: pointer; width: 100%; transition: all 0.2s; }
  .btn-logout:hover { border-color: var(--warn); color: var(--warn); }
  .btn-backup { margin-top: 8px; background: rgba(82,183,136,0.15); border: 1px solid rgba(82,183,136,0.3); color: var(--accent-light); font-size: 12px; font-family: inherit; padding: 6px 12px; border-radius: 6px; cursor: pointer; width: 100%; transition: all 0.2s; }
  .btn-backup:hover { background: rgba(82,183,136,0.25); }

  .main { margin-left: 220px; flex: 1; padding: 32px; max-width: calc(100vw - 220px); }

  /* ── 백업 알림 배너 ── */
  .backup-alert { background: var(--warn-pale); border: 1.5px solid #f5c6bd; border-radius: var(--r-sm); padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .backup-alert-text { font-size: 13px; color: var(--warn); font-weight: 600; }
  .backup-alert-sub { font-size: 11px; color: var(--warn); opacity: 0.8; margin-top: 2px; }
  .btn-backup-now { background: var(--warn); color: #fff; border: none; border-radius: 6px; padding: 7px 14px; font-size: 12px; font-weight: 600; font-family: inherit; cursor: pointer; white-space: nowrap; transition: background 0.2s; }
  .btn-backup-now:hover { background: #c96a4f; }

  /* ── 공통 컴포넌트 (pages에서 재사용) ── */
  .page-header { margin-bottom: 28px; }
  .page-title { font-family: 'DM Serif Display', serif; font-size: 26px; color: var(--ink); }
  .page-sub { color: var(--ink-muted); font-size: 13px; margin-top: 4px; }

  .card { background: var(--surface); border-radius: var(--r); padding: 24px; box-shadow: var(--shadow-sm); border: 1px solid var(--border); }
  .card + .card { margin-top: 16px; }

  .toolbar { display: flex; gap: 12px; margin-bottom: 20px; align-items: center; flex-wrap: wrap; }
  .search-input { flex: 1; min-width: 180px; padding: 10px 16px; border: 1.5px solid var(--border); border-radius: var(--r-sm); font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.2s; background: var(--surface); }
  .search-input:focus { border-color: var(--accent); }

  .btn { padding: 10px 18px; border-radius: var(--r-sm); font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; border: none; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }
  .btn-primary { background: var(--accent); color: #fff; }
  .btn-primary:hover { background: #235c42; }
  .btn-secondary { background: var(--surface2); color: var(--ink-light); border: 1px solid var(--border); }
  .btn-secondary:hover { background: var(--border); }
  .btn-danger { background: var(--warn-pale); color: var(--warn); border: 1px solid #f5c6bd; }
  .btn-danger:hover { background: var(--warn); color: #fff; }
  .btn-teal { background: var(--teal); color: #fff; }
  .btn-teal:hover { background: #00838f; }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .btn-xs { padding: 4px 8px; font-size: 11px; border-radius: 5px; }

  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-warn { background: var(--warn-pale); color: var(--warn); }
  .badge-info { background: var(--info-pale); color: var(--info); }
  .badge-success { background: var(--accent-pale); color: var(--accent); }
  .badge-gold { background: var(--gold-pale); color: var(--gold); }
  .badge-muted { background: var(--surface2); color: var(--ink-muted); }
  .badge-teal { background: var(--teal-pale); color: var(--teal); }
  .badge-traffic { background: var(--traffic-pale); color: var(--traffic); }

  .tabs { display: flex; gap: 4px; border-bottom: 2px solid var(--border); margin-bottom: 24px; }
  .tab { padding: 10px 18px; font-size: 13px; font-weight: 500; font-family: inherit; background: none; border: none; cursor: pointer; color: var(--ink-muted); border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s; }
  .tab.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }
  .tab:hover:not(.active) { color: var(--ink); }

  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  .form-full { grid-column: 1 / -1; }
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-label { font-size: 12px; font-weight: 600; color: var(--ink-light); }
  .form-input { padding: 10px 12px; border: 1.5px solid var(--border); border-radius: var(--r-sm); font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.2s; background: var(--surface); }
  .form-input:focus { border-color: var(--accent); }
  .form-select { padding: 10px 12px; border: 1.5px solid var(--border); border-radius: var(--r-sm); font-size: 14px; font-family: inherit; outline: none; background: var(--surface); cursor: pointer; }
  .form-select:focus { border-color: var(--accent); }
  .form-actions { display: flex; gap: 10px; margin-top: 16px; justify-content: flex-end; }
  .form-check { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: var(--ink-light); }
  .form-check input { width: 16px; height: 16px; cursor: pointer; accent-color: var(--accent); }

  .modal-overlay { position: fixed; inset: 0; background: rgba(26,26,46,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(2px); }
  .modal { background: var(--surface); border-radius: 16px; padding: 28px; width: 100%; max-width: 520px; box-shadow: var(--shadow-lg); max-height: 90vh; overflow-y: auto; }
  .modal-title { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
  .modal-lg { max-width: 680px; }

  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 700; color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid var(--border); }
  td { padding: 12px; border-bottom: 1px solid var(--border); color: var(--ink); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--surface2); }

  .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
  .section-title { font-size: 15px; font-weight: 700; }

  .empty { text-align: center; padding: 40px; color: var(--ink-muted); font-size: 14px; }
  .divider { height: 1px; background: var(--border); margin: 20px 0; }

  .progress-bar { background: var(--surface2); border-radius: 20px; height: 6px; margin: 8px 0 4px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 20px; background: linear-gradient(90deg, var(--accent-light), var(--accent)); transition: width 0.5s; }
  .progress-label { display: flex; justify-content: space-between; font-size: 11px; color: var(--ink-muted); }

  .happycall-card { border-radius: var(--r-sm); padding: 14px 16px; margin-bottom: 10px; border: 1.5px solid; }
  .happycall-arrival { border-color: #b8d4f0; background: #f0f7ff; }
  .happycall-reservation { border-color: #f5c6bd; background: #fff5f3; }
  .happycall-done { border-color: var(--border); background: var(--surface2); opacity: 0.7; }
  .happycall-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .happycall-type { font-size: 12px; font-weight: 700; }
  .happycall-date { font-size: 13px; font-weight: 600; }

  .back-btn { display: inline-flex; align-items: center; gap: 6px; color: var(--ink-muted); font-size: 13px; cursor: pointer; margin-bottom: 16px; background: none; border: none; font-family: inherit; }
  .back-btn:hover { color: var(--ink); }

  .alert-banner { background: var(--warn-pale); border: 1.5px solid #f5c6bd; border-radius: var(--r-sm); padding: 10px 14px; font-size: 13px; color: var(--warn); font-weight: 600; display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .alert-banner.urgent { background: #fde8e8; border-color: #f5a0a0; }

  .pkg-status { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
  .pkg-month { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
  .pkg-month-done { background: var(--accent); color: #fff; }
  .pkg-month-remaining { background: var(--surface2); color: var(--ink-muted); border: 2px dashed var(--border); }

  .remaining-input-row { display: flex; gap: 8px; align-items: center; margin-top: 8px; }
  .remaining-input-row input { width: 80px; padding: 6px 10px; border: 1.5px solid var(--border); border-radius: 6px; font-size: 13px; font-family: inherit; outline: none; }
  .remaining-input-row input:focus { border-color: var(--accent); }

  /* ── 환자 카드 공통 ── */
  .patient-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
  .patient-card { background: var(--surface); border-radius: var(--r); padding: 20px; border: 1.5px solid var(--border); cursor: pointer; transition: all 0.2s; position: relative; }
  .patient-card:hover { border-color: var(--accent-light); box-shadow: var(--shadow-md); transform: translateY(-2px); }
  .patient-card.alert { border-color: #f5c6bd; background: #fffaf9; }
  .patient-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .patient-name { font-size: 17px; font-weight: 600; }
  .patient-chart { font-size: 11px; color: var(--ink-muted); margin-top: 2px; }
  .alert-dots { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }

  /* ── 교통사고 환자 전용 ── */
  .visit-btn { padding: 8px 16px; border-radius: var(--r-sm); font-size: 13px; font-weight: 700; font-family: inherit; cursor: pointer; border: 1.5px solid; transition: all 0.2s; }
  .visit-btn.visited { background: var(--accent); color: #fff; border-color: var(--accent); }
  .visit-btn.not-visited { background: var(--surface); color: var(--ink-muted); border-color: var(--border); }
  .visit-btn.not-visited:hover { border-color: var(--accent); color: var(--accent); }
  .severe-toggle { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: var(--r-sm); background: var(--traffic-pale); border: 1.5px solid var(--traffic); cursor: pointer; font-size: 13px; color: var(--traffic); font-weight: 600; font-family: inherit; transition: all 0.2s; }
  .severe-toggle.off { background: var(--surface2); border-color: var(--border); color: var(--ink-muted); }

  /* ── 반응형 ── */
  @media (max-width: 768px) {
    .sidebar { width: 100%; height: auto; position: relative; flex-direction: row; flex-wrap: wrap; padding: 12px 16px; }
    .sidebar-logo { padding: 0; border: none; font-size: 16px; }
    .sidebar-nav { display: flex; padding: 0; gap: 4px; overflow-x: auto; }
    .nav-item { padding: 8px 12px; font-size: 12px; border-left: none; border-bottom: 2px solid transparent; white-space: nowrap; }
    .nav-item.active { border-left-color: transparent; border-bottom-color: var(--accent-light); }
    .sidebar-bottom { display: none; }
    .main { margin-left: 0; padding: 16px; max-width: 100%; }
    .form-grid { grid-template-columns: 1fr; }
    .form-grid-3 { grid-template-columns: 1fr 1fr; }
    .patient-grid { grid-template-columns: 1fr; }
    .layout { flex-direction: column; }
    .dashboard-cols { grid-template-columns: 1fr !important; }
  }
`;

// =============================================
// LOGIN PAGE
// =============================================
function LoginPage() {
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
        <div className="login-logo">自然韓醫</div>
        <div className="login-clinic">365 자연안에 한의원</div>
        <div className="login-sub">통합 환자 관리 시스템</div>
        <input
          type="email" placeholder="이메일" value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
        />
        <input
          type="password" placeholder="비밀번호" value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
        />
        {err && <div className="login-err">{err}</div>}
        <button className="btn-login" style={{marginTop: 8}} onClick={handleLogin} disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
        </button>
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
  const [page, setPage] = useState("dashboard");
  const [currentUser, setCurrentUser] = useState(null);
  const [lastBackupAt, setLastBackupAt] = useState(null);
  const [selectDietPatientId, setSelectDietPatientId] = useState(null);
  const [selectDietTab, setSelectDietTab] = useState(null);
  const [selectTangPatientId, setSelectTangPatientId] = useState(null);
  const [selectTangTab, setSelectTangTab] = useState(null);
  const [selectTrafficPatientId, setSelectTrafficPatientId] = useState(null);

  // 세션 초기화
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

  // 유저 정보 및 마지막 백업 시각 로드
  useEffect(() => {
    if (!session?.user) { setCurrentUser(null); return; }
    const loadUser = async () => {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();
      setCurrentUser(data || { id: session.user.id, email: session.user.email, role: "staff" });

      // 마지막 백업 시각 조회
      const { data: backupData } = await supabase
        .from("backup_logs")
        .select("backed_up_at")
        .order("backed_up_at", { ascending: false })
        .limit(1)
        .single();
      setLastBackupAt(backupData?.backed_up_at || null);
    };
    loadUser();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPage("dashboard");
    setCurrentUser(null);
  };

  // 백업 실행
  const handleBackup = async () => {
    try {
      // 전체 데이터 조회
      const [
        { data: patients },
        { data: packages },
        { data: prescriptions },
        { data: happycall_logs },
        { data: prescription_updates },
        { data: tang_patients },
        { data: tang_packages },
        { data: tang_prescriptions },
        { data: tang_happycall_logs },
        { data: tang_prescription_updates },
        { data: traffic_patients },
        { data: traffic_visits },
        { data: notices },
        { data: notice_logs },
        { data: plants },
      ] = await Promise.all([
        supabase.from("patients").select("*"),
        supabase.from("packages").select("*"),
        supabase.from("prescriptions").select("*"),
        supabase.from("happycall_logs").select("*"),
        supabase.from("prescription_updates").select("*"),
        supabase.from("tang_patients").select("*"),
        supabase.from("tang_packages").select("*"),
        supabase.from("tang_prescriptions").select("*"),
        supabase.from("tang_happycall_logs").select("*"),
        supabase.from("tang_prescription_updates").select("*"),
        supabase.from("traffic_patients").select("*"),
        supabase.from("traffic_visits").select("*"),
        supabase.from("notices").select("*"),
        supabase.from("notice_logs").select("*"),
        supabase.from("plants").select("*"),
      ]);

      const now = new Date();
      const fileName = `backup_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}_${String(now.getHours()).padStart(2,"0")}${String(now.getMinutes()).padStart(2,"0")}.json`;

      const backupData = {
        version: "2.0",
        createdAt: now.toISOString(),
        fileName,
        data: {
          patients, packages, prescriptions, happycall_logs, prescription_updates,
          tang_patients, tang_packages, tang_prescriptions, tang_happycall_logs, tang_prescription_updates,
          traffic_patients, traffic_visits,
          notices, notice_logs, plants,
        }
      };

      // JSON 파일 다운로드
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);

      // 백업 이력 기록
      await supabase.from("backup_logs").insert([{
        backed_up_by: currentUser?.id,
        file_name: fileName,
      }]);
      setLastBackupAt(now.toISOString());
      alert("✅ 백업이 완료되었습니다.");
    } catch (e) {
      alert("백업 중 오류가 발생했습니다: " + e.message);
    }
  };

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"Noto Sans KR, sans-serif",color:"#9090b0"}}>
      로딩 중...
    </div>
  );

  const backupDays = daysSinceBackup(lastBackupAt);
  const showBackupAlert = currentUser?.role === "admin" && backupDays >= 30;

  const navItems = [
    { key: "dashboard",   icon: "🏠", label: "대시보드" },
    { key: "diet",        icon: "👥", label: "다이어트 환자" },
    { key: "tang",        icon: "🌿", label: "탕약 환자" },
    { key: "traffic",     icon: "🚗", label: "교통사고 환자" },
    { key: "newpatients", icon: "🆕", label: "신환 관리" },
    { key: "visitstats",  icon: "📊", label: "내원 현황" },
    { key: "notices",     icon: "📋", label: "공지사항" },
    { key: "plants",      icon: "🌱", label: "식물 관리" },
    { key: "admin",       icon: "⚙️", label: "계정 관리" },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {!session ? (
          <LoginPage />
        ) : (
          <div className="layout">
            {/* ── 사이드바 ── */}
            <aside className="sidebar">
              <div className="sidebar-logo">
                自然韓醫
                <span>365 자연안에 한의원</span>
              </div>

              <nav className="sidebar-nav">
                <div className="sidebar-section">메뉴</div>
                {navItems.map(item => (
                  <div
                    key={item.key}
                    className={`nav-item ${page === item.key ? "active" : ""}`}
                    onClick={() => setPage(item.key)}
                  >
                    {item.icon} {item.label}
                  </div>
                ))}
              </nav>

              <div className="sidebar-bottom">
                <div className="sidebar-user">
                  <strong>{currentUser?.name || currentUser?.email || "사용자"}</strong>
                  <span>{currentUser?.role === "admin" ? "관리자" : "스태프"}</span>
                </div>
                <button className="btn-backup" onClick={handleBackup}>
                  💾 백업
                </button>
                <button className="btn-logout" onClick={handleLogout}>
                  로그아웃
                </button>
              </div>
            </aside>

            {/* ── 메인 콘텐츠 ── */}
            <main className="main">
              {/* 30일 미백업 알림 (관리자만) */}
              {showBackupAlert && (
                <div className="backup-alert">
                  <div>
                    <div className="backup-alert-text">
                      ⚠️ 마지막 백업으로부터 {backupDays === 999 ? "백업 기록이 없습니다" : `${backupDays}일이 지났어요`}
                    </div>
                    <div className="backup-alert-sub">
                      데이터 보호를 위해 정기적인 백업을 권장합니다
                    </div>
                  </div>
                  <button className="btn-backup-now" onClick={handleBackup}>
                    지금 백업하기
                  </button>
                </div>
              )}

              {page === "dashboard" && (
                <Dashboard
                  currentUser={currentUser}
                  onNavigate={setPage}
                  onSelectDietPatient={(id, tab) => {
                    setSelectDietPatientId(id);
                    setSelectDietTab(tab);
                    setPage("diet");
                  }}
                  onSelectTangPatient={(id, tab) => {
                    setSelectTangPatientId(id);
                    setSelectTangTab(tab);
                    setPage("tang");
                  }}
                  onSelectTrafficPatient={(id) => {
                    setSelectTrafficPatientId(id);
                    setPage("traffic");
                  }}
                />
              )}
              {page === "diet" && (
                <DietPatients
                  currentUser={currentUser}
                  selectPatientId={selectDietPatientId}
                  selectTab={selectDietTab}
                  onMounted={() => { setSelectDietPatientId(null); setSelectDietTab(null); }}
                />
              )}
              {page === "tang" && (
                <TangPatients
                  currentUser={currentUser}
                  selectPatientId={selectTangPatientId}
                  selectTab={selectTangTab}
                  onMounted={() => { setSelectTangPatientId(null); setSelectTangTab(null); }}
                />
              )}
              {page === "traffic" && (
                <TrafficPatients
                  currentUser={currentUser}
                  selectPatientId={selectTrafficPatientId}
                  onMounted={() => setSelectTrafficPatientId(null)}
                />
              )}
              {page === "newpatients" && (
                <NewPatients currentUser={currentUser} />
              )}
              {page === "visitstats" && (
                <VisitStats currentUser={currentUser} />
              )}
              {page === "notices" && (
                <Notices currentUser={currentUser} />
              )}
              {page === "plants" && (
                <Plants currentUser={currentUser} />
              )}
              {page === "admin" && (
                <Admin
                  currentUser={currentUser}
                  lastBackupAt={lastBackupAt}
                  onBackup={handleBackup}
                />
              )}
            </main>
          </div>
        )}
      </div>
    </>
  );
}
