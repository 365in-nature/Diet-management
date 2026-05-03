import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { formatDate, daysSinceBackup } from "../lib/dateUtils";

// =============================================
// ADMIN PAGE
// =============================================
export default function Admin({ currentUser, lastBackupAt, onBackup }) {
  const [users, setUsers] = useState([]);
  const [backupLogs, setBackupLogs] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({ email: "", password: "", name: "", role: "staff" });
  const [err, setErr] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [tab, setTab] = useState("backup");

  const load = useCallback(async () => {
    const { data: u } = await supabase.from("users").select("*").order("created_at");
    setUsers(u || []);
    const { data: b } = await supabase
      .from("backup_logs")
      .select("*")
      .order("backed_up_at", { ascending: false })
      .limit(20);
    setBackupLogs(b || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (currentUser?.role !== "admin") {
    return (
      <div>
        <div className="page-header">
          <div className="page-title">계정 관리</div>
        </div>
        <div className="card">
          <div className="empty">관리자만 접근 가능합니다</div>
        </div>
      </div>
    );
  }

  // 계정 생성
  const createUser = async () => {
    setErr("");
    if (!userForm.email || !userForm.password || !userForm.name) {
      setErr("모든 항목을 입력해주세요."); return;
    }
    const { data, error } = await supabase.auth.admin.createUser({
      email: userForm.email,
      password: userForm.password,
      email_confirm: true,
    });
    if (error) { setErr(error.message); return; }
    await supabase.from("users").insert([{
      id: data.user.id,
      name: userForm.name,
      email: userForm.email,
      role: userForm.role,
    }]);
    setUserForm({ email: "", password: "", name: "", role: "staff" });
    setShowUserForm(false);
    load();
  };

  // 구버전 HTML 앱 백업 마이그레이션
  const handleLegacyMigrate = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm("구버전 백업 파일을 가져오시겠습니까?\n신환, 탕약, 식물, 공지사항, 내원현황 데이터가 추가됩니다.")) {
      e.target.value = ""; return;
    }
    setRestoring(true);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      // 신환 마이그레이션 (patients → new_patients)
      if (backup.patients && backup.patients.length > 0) {
        const newPts = backup.patients.map(p => ({
          route: p.route || "기타",
          jiin_name: p.jiinName || null,
          partner_name: p.partnerName || null,
          etc_memo: p.etcMemo || null,
          registered_at: p.date || new Date().toISOString().split("T")[0],
        }));
        const { error } = await supabase.from("new_patients").insert(newPts);
        if (error) console.error("신환 마이그레이션 오류:", error.message);
      }

      // 탕약 환자 마이그레이션 (tangPts → tang_patients)
      if (backup.tangPts && backup.tangPts.length > 0) {
        for (const p of backup.tangPts) {
          const { data: inserted, error } = await supabase.from("tang_patients").insert([{
            chart_number: p.chart || null,
            name: p.name || "이름없음",
          }]).select().single();
          if (error || !inserted) continue;

          // 처방 정보 마이그레이션
          if (p.dose && p.regDate) {
            await supabase.from("tang_prescriptions").insert([{
              patient_id: inserted.id,
              prescribed_at: p.regDate,
              duration_days: p.dose,
              expected_end_date: p.resvDate || null,
              arrival_happycall_date: p.arriveDate || null,
              reservation_happycall_date: p.resvDate || null,
              is_completed: (p.arriveDone && p.resvDone) || false,
            }]);
          }
        }
      }

      // 식물 마이그레이션 (plants → plants)
      if (backup.plants && backup.plants.length > 0) {
        const plantData = backup.plants.map(p => ({
          name: p.name || "식물",
          location: p.location || null,
          memo: p.memo || null,
          last_watered_at: p.lastWatered || null,
        }));
        await supabase.from("plants").insert(plantData);
      }

      // 공지사항 마이그레이션 (notices → notices)
      if (backup.notices && backup.notices.length > 0) {
        for (const n of backup.notices) {
          const { data: inserted, error } = await supabase.from("notices").insert([{
            title: n.title || "제목없음",
            content: n.content || null,
            created_at: n.date ? new Date(n.date).toISOString() : new Date().toISOString(),
          }]).select().single();
          if (error || !inserted) continue;

          // 공지 로그 마이그레이션
          if (backup.noticeLogs) {
            const logs = Object.values(backup.noticeLogs).flat().filter(l => l.noticeId === n.id);
            for (const log of logs) {
              await supabase.from("notice_logs").insert([{
                notice_id: inserted.id,
                content: log.content || null,
                created_at: log.date ? new Date(log.date).toISOString() : new Date().toISOString(),
              }]);
            }
          }
        }
      }

      // 내원 현황 마이그레이션 (visitData → visit_stats)
      if (backup.visitData && Object.keys(backup.visitData).length > 0) {
        const visitRows = Object.entries(backup.visitData).map(([date, d]) => ({
          stat_date: date,
          reserved: d.reserved || 0,
          visited: d.visited || 0,
        }));
        await supabase.from("visit_stats").upsert(visitRows, { onConflict: "stat_date" });
      }

      alert(`✅ 마이그레이션 완료!\n신환 ${backup.patients?.length || 0}건, 탕약 ${backup.tangPts?.length || 0}건, 식물 ${backup.plants?.length || 0}건, 공지사항 ${backup.notices?.length || 0}건, 내원현황 ${Object.keys(backup.visitData || {}).length}건`);
      load();
    } catch (err) {
      alert("마이그레이션 중 오류가 발생했습니다: " + err.message);
    } finally {
      setRestoring(false);
      e.target.value = "";
    }
  };

  // 복원 처리
  const handleRestore = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm("백업 파일로 복원하시겠습니까?\n⚠️ 현재 데이터가 백업 데이터로 덮어씌워집니다.\n복원 전 현재 상태를 먼저 백업하는 것을 권장합니다.")) {
      e.target.value = "";
      return;
    }
    setRestoring(true);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      if (!backup.data) { alert("올바른 백업 파일이 아닙니다."); setRestoring(false); return; }
      const d = backup.data;

      // 각 테이블 순서대로 upsert
      const tables = [
        { name: "patients",                data: d.patients },
        { name: "packages",                data: d.packages },
        { name: "prescriptions",           data: d.prescriptions },
        { name: "happycall_logs",          data: d.happycall_logs },
        { name: "prescription_updates",    data: d.prescription_updates },
        { name: "tang_patients",           data: d.tang_patients },
        { name: "tang_packages",           data: d.tang_packages },
        { name: "tang_prescriptions",      data: d.tang_prescriptions },
        { name: "tang_happycall_logs",     data: d.tang_happycall_logs },
        { name: "tang_prescription_updates", data: d.tang_prescription_updates },
        { name: "traffic_patients",        data: d.traffic_patients },
        { name: "traffic_visits",          data: d.traffic_visits },
        { name: "notices",                 data: d.notices },
        { name: "notice_logs",             data: d.notice_logs },
        { name: "plants",                  data: d.plants },
      ];

      for (const t of tables) {
        if (t.data && t.data.length > 0) {
          const { error } = await supabase.from(t.name).upsert(t.data, { onConflict: "id" });
          if (error) console.error(`${t.name} 복원 오류:`, error.message);
        }
      }

      alert(`✅ 복원 완료!\n백업 일시: ${new Date(backup.createdAt).toLocaleString("ko-KR")}`);
      load();
    } catch (err) {
      alert("복원 중 오류가 발생했습니다: " + err.message);
    } finally {
      setRestoring(false);
      e.target.value = "";
    }
  };

  const backupDays = daysSinceBackup(lastBackupAt);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">계정 관리</div>
        <div className="page-sub">관리자 전용 페이지</div>
      </div>

      <div className="tabs">
        {[
          { key: "backup", label: "💾 백업 & 복원" },
          { key: "users",  label: "👤 의료진 계정" },
        ].map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 백업 & 복원 탭 ── */}
      {tab === "backup" && (
        <div>
          {/* 백업 상태 */}
          <div className="card" style={{marginBottom:16}}>
            <div className="section-header">
              <div className="section-title">💾 데이터 백업</div>
              {backupDays < 30 ? (
                <span className="badge badge-success">정상</span>
              ) : (
                <span className="badge badge-warn">백업 필요</span>
              )}
            </div>

            <div style={{display:"flex", gap:24, flexWrap:"wrap", marginBottom:20}}>
              <div>
                <div className="form-label">마지막 백업</div>
                <div style={{fontSize:16, fontWeight:700}}>
                  {lastBackupAt
                    ? new Date(lastBackupAt).toLocaleString("ko-KR")
                    : "백업 기록 없음"}
                </div>
              </div>
              <div>
                <div className="form-label">경과 일수</div>
                <div style={{fontSize:16, fontWeight:700, color: backupDays >= 30 ? "var(--warn)" : "var(--accent)"}}>
                  {backupDays === 999 ? "-" : `${backupDays}일`}
                </div>
              </div>
            </div>

            {backupDays >= 30 && (
              <div className="alert-banner urgent" style={{marginBottom:16}}>
                ⚠️ {backupDays === 999 ? "백업 기록이 없습니다." : `마지막 백업으로부터 ${backupDays}일이 지났습니다.`} 지금 백업하세요!
              </div>
            )}

            <button className="btn btn-primary" onClick={onBackup}>
              💾 지금 백업하기
            </button>
            <div style={{fontSize:12, color:"var(--ink-muted)", marginTop:8}}>
              전체 데이터를 JSON 파일로 다운로드합니다. 정기적으로 백업하는 것을 권장합니다.
            </div>
          </div>

          {/* 복원 */}
          <div className="card" style={{marginBottom:16}}>
            <div className="section-title" style={{marginBottom:12}}>📂 데이터 복원</div>
            <div style={{fontSize:13, color:"var(--warn)", fontWeight:600, marginBottom:12}}>
              ⚠️ 복원 시 현재 데이터에 백업 데이터가 덮어씌워집니다. 복원 전 반드시 현재 상태를 백업해 두세요.
            </div>
            <div style={{display:"flex", flexDirection:"column", gap:10}}>
              <label style={{
                display:"inline-flex", alignItems:"center", gap:8,
                padding:"10px 18px", background:"var(--surface2)", border:"1.5px solid var(--border)",
                borderRadius:"var(--r-sm)", cursor:"pointer", fontSize:13, fontWeight:600,
                color: restoring ? "var(--ink-muted)" : "var(--ink-light)",
                transition:"all 0.2s",
              }}>
                {restoring ? "복원 중..." : "📂 통합 백업 파일 선택 (.json)"}
                <input type="file" accept=".json" style={{display:"none"}} onChange={handleRestore} disabled={restoring} />
              </label>

              {/* 구버전 HTML 앱 백업 마이그레이션 */}
              <div style={{borderTop:"1px solid var(--border)", paddingTop:12}}>
                <div style={{fontSize:13, fontWeight:700, marginBottom:6}}>📦 구버전 원내 관리 앱 데이터 가져오기</div>
                <div style={{fontSize:12, color:"var(--ink-muted)", marginBottom:10}}>
                  기존 HTML 앱(365자연안에한의원)의 백업 JSON 파일을 Supabase로 가져옵니다.
                  신환, 탕약, 식물, 공지사항, 내원현황 데이터가 마이그레이션됩니다.
                </div>
                <label style={{
                  display:"inline-flex", alignItems:"center", gap:8,
                  padding:"10px 18px", background:"var(--teal-pale)", border:"1.5px solid var(--teal)",
                  borderRadius:"var(--r-sm)", cursor:"pointer", fontSize:13, fontWeight:600,
                  color: restoring ? "var(--ink-muted)" : "var(--teal)",
                  transition:"all 0.2s",
                }}>
                  {restoring ? "가져오는 중..." : "📥 구버전 백업 파일 선택"}
                  <input type="file" accept=".json" style={{display:"none"}} onChange={handleLegacyMigrate} disabled={restoring} />
                </label>
              </div>
            </div>
          </div>

          {/* 백업 이력 */}
          <div className="card">
            <div className="section-header">
              <div className="section-title">📋 백업 이력</div>
              <span style={{fontSize:12, color:"var(--ink-muted)"}}>최근 20건</span>
            </div>
            {backupLogs.length === 0 ? (
              <div className="empty">백업 이력이 없습니다</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>백업 일시</th>
                      <th>파일명</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backupLogs.map(b => (
                      <tr key={b.id}>
                        <td>{new Date(b.backed_up_at).toLocaleString("ko-KR")}</td>
                        <td style={{fontSize:12, color:"var(--ink-muted)"}}>{b.file_name || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 의료진 계정 탭 ── */}
      {tab === "users" && (
        <div className="card">
          <div className="section-header">
            <div className="section-title">의료진 목록</div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowUserForm(!showUserForm)}>
              + 계정 추가
            </button>
          </div>

          {showUserForm && (
            <div style={{background:"var(--surface2)", borderRadius:8, padding:16, marginBottom:16}}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">이름 *</label>
                  <input className="form-input" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">이메일 *</label>
                  <input className="form-input" type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">임시 비밀번호 *</label>
                  <input className="form-input" type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">역할</label>
                  <select className="form-select" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                    <option value="staff">스태프</option>
                    <option value="admin">관리자 (원장)</option>
                  </select>
                </div>
              </div>
              {err && <div style={{color:"var(--warn)", fontSize:13, marginTop:8}}>{err}</div>}
              <div className="form-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => { setShowUserForm(false); setErr(""); }}>취소</button>
                <button className="btn btn-primary btn-sm" onClick={createUser}>계정 생성</button>
              </div>
            </div>
          )}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>역할</th>
                  <th>등록일</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === "admin" ? "badge-gold" : "badge-muted"}`}>
                        {u.role === "admin" ? "관리자" : "스태프"}
                      </span>
                    </td>
                    <td style={{fontSize:12}}>{formatDate(u.created_at?.split("T")[0])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
