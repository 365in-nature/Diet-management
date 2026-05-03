import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  today, formatDate, isTodayOrPast,
  addDays, addBusinessDays, subtractBusinessDays,
  calcTotalEndDate,
} from "../lib/dateUtils";

// =============================================
// 처방 기간 선택 버튼
// =============================================
function DoseSelector({ value, onChange }) {
  return (
    <div style={{display:"flex", gap:10}}>
      {[15, 30].map(d => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          style={{
            flex:1, padding:"10px 8px", borderRadius:10,
            border: `2px solid ${value === d ? "var(--teal)" : "var(--border)"}`,
            background: value === d ? "var(--teal)" : "white",
            color: value === d ? "white" : "var(--ink-muted)",
            fontSize:13, fontWeight:700, cursor:"pointer",
            fontFamily:"inherit", transition:"all 0.15s",
          }}
        >
          🌿{d === 30 ? "🌿" : ""} {d}일분
        </button>
      ))}
    </div>
  );
}

// =============================================
// 탕약 처방 탭
// =============================================
function TangPrescriptionTab({ patient }) {
  const [pkgs, setPkgs] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [happycalls, setHappycalls] = useState({});
  const [updates, setUpdates] = useState({});
  const [showPkgForm, setShowPkgForm] = useState(false);
  const [showRxForm, setShowRxForm] = useState(false);
  const [pkgForm, setPkgForm] = useState({ package_months: 3, start_date: today() });
  const [rxForm, setRxForm] = useState({ prescribed_at: today(), duration_days: 15 });
  const [remainingInput, setRemainingInput] = useState({});

  const load = useCallback(async () => {
    const { data: pkgData } = await supabase
      .from("tang_packages")
      .select("*")
      .eq("patient_id", patient.id)
      .eq("is_active", true)
      .order("start_date");
    const { data: rxs } = await supabase
      .from("tang_prescriptions")
      .select("*")
      .eq("patient_id", patient.id)
      .order("prescribed_at", { ascending: false });
    const rxIds = (rxs || []).map(r => r.id);
    const { data: hcs } = rxIds.length
      ? await supabase.from("tang_happycall_logs").select("*").in("prescription_id", rxIds)
      : { data: [] };
    const { data: upds } = rxIds.length
      ? await supabase.from("tang_prescription_updates").select("*").in("prescription_id", rxIds).order("created_at", { ascending: false })
      : { data: [] };

    setPkgs(pkgData || []);
    setPrescriptions(rxs || []);
    const hcMap = {};
    (hcs || []).forEach(h => { if (!hcMap[h.prescription_id]) hcMap[h.prescription_id] = []; hcMap[h.prescription_id].push(h); });
    setHappycalls(hcMap);
    const updMap = {};
    (upds || []).forEach(u => { if (!updMap[u.prescription_id]) updMap[u.prescription_id] = []; updMap[u.prescription_id].push(u); });
    setUpdates(updMap);
  }, [patient.id]);

  useEffect(() => { load(); }, [load]);

  const savePkg = async () => {
    if (!pkgForm.start_date) { alert("시작일을 입력해주세요."); return; }
    const endDate = calcTotalEndDate(pkgs, Number(pkgForm.package_months), pkgForm.start_date);
    await supabase.from("tang_packages").insert([{
      patient_id: patient.id,
      package_months: Number(pkgForm.package_months),
      start_date: pkgForm.start_date,
      end_date: endDate,
      remaining_months: Number(pkgForm.package_months),
      is_active: true,
    }]);
    setShowPkgForm(false);
    setPkgForm({ package_months: 3, start_date: today() });
    load();
  };

  const deletePkg = async (pkgId) => {
    if (!window.confirm("이 패키지를 삭제하시겠습니까?")) return;
    await supabase.from("tang_packages").delete().eq("id", pkgId);
    const remaining = pkgs.filter(p => p.id !== pkgId);
    if (remaining.length > 0) {
      const newEndDate = calcTotalEndDate(remaining);
      await Promise.all(remaining.map(p =>
        supabase.from("tang_packages").update({ end_date: newEndDate }).eq("id", p.id)
      ));
    }
    load();
  };

  const saveRx = async () => {
    if (!pkgs.length) { alert("먼저 패키지를 등록해주세요."); return; }
    if (!rxForm.prescribed_at) { alert("처방일을 입력해주세요."); return; }
    const expectedEnd = addDays(rxForm.prescribed_at, Number(rxForm.duration_days));
    const arrivalHappy = addBusinessDays(rxForm.prescribed_at, 3);
    const reservationHappy = subtractBusinessDays(expectedEnd, 3);
    await supabase.from("tang_prescriptions").insert([{
      patient_id: patient.id,
      package_id: pkgs[0]?.id,
      prescribed_at: rxForm.prescribed_at,
      duration_days: Number(rxForm.duration_days),
      expected_end_date: expectedEnd,
      arrival_happycall_date: arrivalHappy,
      reservation_happycall_date: reservationHappy,
    }]);
    setShowRxForm(false);
    load();
  };

  const toggleHappycall = async (rxId, callType, existing) => {
    if (existing) {
      await supabase.from("tang_happycall_logs").update({ is_done: !existing.is_done }).eq("id", existing.id);
    } else {
      await supabase.from("tang_happycall_logs").insert([{
        prescription_id: rxId, call_type: callType, is_done: true, no_answer_count: 0,
      }]);
    }
    load();
  };

  const recordNoAnswer = async (rxId, callType, existing) => {
    const newCount = (existing?.no_answer_count || 0) + 1;
    const memo = window.prompt(`미응답 ${newCount}회\n메모:`, existing?.memo || "");
    if (existing) {
      await supabase.from("tang_happycall_logs").update({ no_answer_count: newCount, memo: memo !== null ? memo : existing.memo }).eq("id", existing.id);
    } else {
      await supabase.from("tang_happycall_logs").insert([{
        prescription_id: rxId, call_type: callType, is_done: false, no_answer_count: 1, memo: memo || null,
      }]);
    }
    load();
  };

  const saveRemainingUpdate = async (rxId) => {
    const days = Number(remainingInput[rxId]);
    if (!days || days < 1) { alert("잔여 일수를 입력해주세요."); return; }
    const newEnd = addDays(today(), days);
    const newHappy = subtractBusinessDays(newEnd, 3);
    await supabase.from("tang_prescription_updates").insert([{
      prescription_id: rxId, remaining_days: days,
      new_expected_end_date: newEnd, new_reservation_happycall_date: newHappy,
    }]);
    setRemainingInput(prev => ({ ...prev, [rxId]: "" }));
    load();
  };

  const renderHappycallSection = (rx) => {
    const rxUpdates = updates[rx.id] || [];
    const latestUpdate = rxUpdates[0];
    const reservationDate = latestUpdate ? latestUpdate.new_reservation_happycall_date : rx.reservation_happycall_date;
    const arrivalHC = happycalls[rx.id]?.find(h => h.call_type === "arrival");
    const reservationHC = happycalls[rx.id]?.find(h => h.call_type === "reservation");

    return (
      <div style={{marginTop:12}}>
        {/* 도착 해피콜 */}
        <div className={`happycall-card ${arrivalHC?.is_done ? "happycall-done" : "happycall-arrival"}`}>
          <div className="happycall-header">
            <span className="happycall-type">📦 도착 해피콜</span>
            <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
              <span className="happycall-date">{formatDate(rx.arrival_happycall_date)}</span>
              {isTodayOrPast(rx.arrival_happycall_date) && !arrivalHC?.is_done && <span className="badge badge-info">오늘!</span>}
              {(arrivalHC?.no_answer_count > 0) && <span className="badge badge-warn">미응답 {arrivalHC.no_answer_count}회</span>}
              <button className="btn btn-xs btn-secondary" onClick={() => recordNoAnswer(rx.id, "arrival", arrivalHC)}>📵 미응답</button>
              <button className={`btn btn-xs ${arrivalHC?.is_done ? "btn-secondary" : "btn-primary"}`} onClick={() => toggleHappycall(rx.id, "arrival", arrivalHC)}>
                {arrivalHC?.is_done ? "✓ 완료" : "완료 처리"}
              </button>
            </div>
          </div>
          {arrivalHC?.memo && <div style={{fontSize:12, color:"var(--ink-muted)", marginTop:4}}>💬 {arrivalHC.memo}</div>}
        </div>

        {/* 예약 해피콜 */}
        <div className={`happycall-card ${reservationHC?.is_done ? "happycall-done" : "happycall-reservation"}`}>
          <div className="happycall-header">
            <span className="happycall-type">📅 예약 해피콜</span>
            <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
              <span className="happycall-date">{formatDate(reservationDate)}</span>
              {isTodayOrPast(reservationDate) && !reservationHC?.is_done && <span className="badge badge-warn">오늘!</span>}
              {(reservationHC?.no_answer_count > 0) && <span className="badge badge-warn">미응답 {reservationHC.no_answer_count}회</span>}
              <button className="btn btn-xs btn-secondary" onClick={() => recordNoAnswer(rx.id, "reservation", reservationHC)}>📵 미응답</button>
              <button className={`btn btn-xs ${reservationHC?.is_done ? "btn-secondary" : "btn-danger"}`} onClick={() => toggleHappycall(rx.id, "reservation", reservationHC)}>
                {reservationHC?.is_done ? "✓ 완료" : "완료 처리"}
              </button>
            </div>
          </div>
          {reservationHC?.memo && <div style={{fontSize:12, color:"var(--ink-muted)", marginTop:4}}>💬 {reservationHC.memo}</div>}
          <div className="remaining-input-row">
            <span style={{fontSize:12}}>잔여 탕약 일수:</span>
            <input type="number" min="1" placeholder="5" value={remainingInput[rx.id] || ""} onChange={e => setRemainingInput({...remainingInput, [rx.id]: e.target.value})} />
            <span style={{fontSize:12}}>일</span>
            <button className="btn btn-sm btn-secondary" onClick={() => saveRemainingUpdate(rx.id)}>날짜 재산출</button>
          </div>
          {latestUpdate && (
            <div style={{fontSize:11, color:"var(--ink-muted)", marginTop:4}}>
              마지막 업데이트: {formatDate(latestUpdate.created_at?.split("T")[0])} → 완료예정일 {formatDate(latestUpdate.new_expected_end_date)}
            </div>
          )}
        </div>
      </div>
    );
  };

  const activePrescriptions = prescriptions.filter(r => !r.is_completed);
  const completedPrescriptions = prescriptions.filter(r => r.is_completed);
  const totalMonths = pkgs.reduce((s, p) => s + Number(p.package_months), 0);
  const sortedPkgs = [...pkgs].sort((a,b) => a.start_date.localeCompare(b.start_date));
  const firstStart = sortedPkgs[0]?.start_date;
  const endDate = firstStart ? addDays(firstStart, totalMonths * 30) : null;
  const usedDays = prescriptions.reduce((sum, rx) => {
    const hcs = happycalls[rx.id] || [];
    const resDone = hcs.find(h => h.call_type === "reservation" && h.is_done);
    if (resDone || rx.is_completed) return sum + (rx.duration_days || 0);
    return sum;
  }, 0);
  const remainingDays = Math.max(0, totalMonths * 30 - usedDays);
  const remainingMonths = Math.round(remainingDays / 30 * 10) / 10;
  const usedMonths = Math.min(totalMonths, Math.floor(usedDays / 30));

  // 해피콜 미리보기
  const previewArrival = rxForm.prescribed_at ? addBusinessDays(rxForm.prescribed_at, 3) : null;
  const previewReservation = rxForm.prescribed_at && rxForm.duration_days
    ? subtractBusinessDays(addDays(rxForm.prescribed_at, Number(rxForm.duration_days)), 3)
    : null;

  return (
    <div>
      {/* 패키지 */}
      <div className="card" style={{marginBottom:16}}>
        <div className="section-header">
          <div className="section-title">📦 패키지 관리</div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowPkgForm(!showPkgForm)}>+ 패키지 추가/연장</button>
        </div>

        {pkgs.length > 0 ? (
          <div>
            <div className="pkg-status" style={{marginBottom:8}}>
              {Array.from({length: totalMonths}).map((_, i) => (
                <div key={i} className={`pkg-month ${i < usedMonths ? "pkg-month-done" : "pkg-month-remaining"}`}>
                  {i < usedMonths ? "✓" : `${i+1}M`}
                </div>
              ))}
              <div style={{marginLeft:8, fontSize:13, color:"var(--ink-muted)", alignSelf:"center"}}>
                잔여 <strong style={{color:"var(--teal)"}}>약 {remainingMonths}개월</strong>
                <span style={{color:"var(--ink-muted)", marginLeft:4}}>({remainingDays}일)</span>
              </div>
            </div>
            <div style={{display:"flex", gap:16, flexWrap:"wrap", fontSize:13, marginBottom:12}}>
              <div><span style={{color:"var(--ink-muted)"}}>시작일 </span><strong>{formatDate(firstStart)}</strong></div>
              <div><span style={{color:"var(--ink-muted)"}}>종료일 </span><strong style={{color:"var(--warn)"}}>{formatDate(endDate)}</strong></div>
              <div><span style={{color:"var(--ink-muted)"}}>총 </span><strong>{totalMonths}개월</strong></div>
            </div>
            {pkgs.map((p, i) => (
              <div key={p.id} style={{display:"flex", alignItems:"center", gap:10, fontSize:13, background:"var(--surface2)", borderRadius:8, padding:"8px 12px", border:"1px solid var(--border)", marginBottom:6}}>
                <span style={{fontWeight:700, color:"var(--ink-light)", minWidth:40}}>{i === 0 ? "기본" : `연장 ${i}`}</span>
                <span style={{color:"var(--ink-muted)"}}>시작일</span>
                <strong>{formatDate(p.start_date)}</strong>
                <span>·</span>
                <strong>{p.package_months}개월</strong>
                <button className="btn btn-xs btn-danger" style={{marginLeft:"auto"}} onClick={() => deletePkg(p.id)}>삭제</button>
              </div>
            ))}
          </div>
        ) : <div className="empty" style={{padding:12}}>등록된 패키지가 없습니다</div>}

        {showPkgForm && (
          <div style={{marginTop:16, paddingTop:16, borderTop:"1px solid var(--border)"}}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">패키지 종류</label>
                <select className="form-select" value={pkgForm.package_months} onChange={e => setPkgForm({...pkgForm, package_months: e.target.value})}>
                  {[1,2,3,4,5,6,9,12].map(m => <option key={m} value={m}>{m}개월</option>)}
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

      {/* 처방 */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">🌿 탕약 처방 관리</div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowRxForm(!showRxForm)}>+ 처방 추가</button>
        </div>

        {showRxForm && (
          <div style={{background:"var(--surface2)", borderRadius:8, padding:16, marginBottom:16}}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">처방일</label>
                <input className="form-input" type="date" value={rxForm.prescribed_at} onChange={e => setRxForm({...rxForm, prescribed_at: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">처방 기간</label>
                <DoseSelector value={rxForm.duration_days} onChange={v => setRxForm({...rxForm, duration_days: v})} />
              </div>
            </div>
            {/* 해피콜 미리보기 */}
            {previewArrival && (
              <div style={{background:"var(--teal-pale)", borderRadius:10, padding:"12px 16px", margin:"12px 0", fontSize:13}}>
                <div style={{fontWeight:700, color:"var(--teal)", marginBottom:8}}>📞 자동 계산된 해피콜 일정</div>
                <div style={{display:"flex", flexDirection:"column", gap:6}}>
                  <div style={{display:"flex", alignItems:"center", gap:10}}>
                    <span style={{background:"#fff3e0", color:"#e07000", padding:"3px 10px", borderRadius:10, fontSize:11, fontWeight:700, minWidth:80, textAlign:"center"}}>📦 도착 해피콜</span>
                    <strong>{formatDate(previewArrival)}</strong>
                    <span style={{fontSize:11, color:"var(--ink-muted)"}}>처방일 +3영업일</span>
                  </div>
                  {previewReservation && (
                    <div style={{display:"flex", alignItems:"center", gap:10}}>
                      <span style={{background:"#e8f5e9", color:"#388e3c", padding:"3px 10px", borderRadius:10, fontSize:11, fontWeight:700, minWidth:80, textAlign:"center"}}>📅 예약 해피콜</span>
                      <strong>{formatDate(previewReservation)}</strong>
                      <span style={{fontSize:11, color:"var(--ink-muted)"}}>종료예정일 -3영업일</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="form-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowRxForm(false)}>취소</button>
              <button className="btn btn-teal btn-sm" onClick={saveRx}>저장</button>
            </div>
          </div>
        )}

        {activePrescriptions.length === 0 && completedPrescriptions.length === 0 && (
          <div className="empty">처방 이력이 없습니다</div>
        )}

        {activePrescriptions.map(rx => (
          <div key={rx.id} style={{marginBottom:16, paddingBottom:16, borderBottom:"1px solid var(--border)"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
              <div>
                <span className="badge badge-teal" style={{marginRight:8}}>진행 중</span>
                <strong>{formatDate(rx.prescribed_at)}</strong>
                <span style={{fontSize:12, color:"var(--ink-muted)", marginLeft:8}}>탕약 {rx.duration_days}일분</span>
              </div>
              <button className="btn btn-xs btn-secondary" onClick={() => {
                if (window.confirm("복용 완료 처리하시겠습니까?"))
                  supabase.from("tang_prescriptions").update({ is_completed: true, completed_at: today() }).eq("id", rx.id).then(() => load());
              }}>완료 처리</button>
            </div>
            {renderHappycallSection(rx)}
          </div>
        ))}

        {completedPrescriptions.length > 0 && (
          <details style={{marginTop:8}}>
            <summary style={{cursor:"pointer", fontSize:13, color:"var(--ink-muted)", padding:"8px 0"}}>완료된 처방 {completedPrescriptions.length}건 보기</summary>
            {completedPrescriptions.map(rx => (
              <div key={rx.id} style={{marginTop:12, padding:12, background:"var(--surface2)", borderRadius:8, opacity:0.8}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  <div>
                    <span className="badge badge-muted" style={{marginRight:8}}>완료</span>
                    <strong>{formatDate(rx.prescribed_at)}</strong>
                    <span style={{fontSize:12, color:"var(--ink-muted)", marginLeft:8}}>탕약 {rx.duration_days}일분</span>
                  </div>
                  <button className="btn btn-xs btn-secondary" onClick={() => {
                    if (window.confirm("복원하시겠습니까?"))
                      supabase.from("tang_prescriptions").update({ is_completed: false, completed_at: null }).eq("id", rx.id).then(() => load());
                  }}>복원</button>
                </div>
              </div>
            ))}
          </details>
        )}
      </div>
    </div>
  );
}

// =============================================
// 환자 상세 페이지
// =============================================
function PatientDetail({ patient, onBack }) {
  return (
    <div>
      <button className="back-btn" onClick={onBack}>← 목록으로</button>
      <div style={{background:"var(--ink)", color:"#fff", borderRadius:"var(--r)", padding:24, marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div>
          <div style={{fontFamily:"'DM Serif Display', serif", fontSize:24}}>{patient.name}</div>
          <div style={{fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:4}}>
            차트 #{patient.chart_number}
            {patient.gender && ` · ${patient.gender === "female" ? "여성" : "남성"}`}
            {patient.birth_date && ` · ${patient.birth_date}`}
            {patient.phone && ` · ${patient.phone}`}
          </div>
        </div>
        <span className="badge badge-teal">🌿 탕약</span>
      </div>
      <TangPrescriptionTab patient={patient} />
    </div>
  );
}

// =============================================
// 신규 환자 등록 모달
// =============================================
function NewPatientModal({ onClose }) {
  const [form, setForm] = useState({ chart_number: "", name: "", gender: "female", birth_date: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async () => {
    if (!form.chart_number || !form.name) { setErr("차트번호와 이름은 필수입니다."); return; }
    setLoading(true);
    const { error } = await supabase.from("tang_patients").insert([form]);
    if (error) { setErr(error.message); setLoading(false); return; }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">신규 탕약 환자 등록</div>
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
        {err && <div style={{color:"var(--warn)", fontSize:13, marginTop:8}}>{err}</div>}
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={onClose}>취소</button>
          <button className="btn btn-teal" onClick={handleSubmit} disabled={loading}>등록</button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// TANG PATIENTS PAGE
// =============================================
export default function TangPatients({ currentUser, selectPatientId, selectTab }) {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState({});
  const [selected, setSelected] = useState(null);
  const [initialTab, setInitialTab] = useState("prescription");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tang_patients")
      .select("*, tang_packages(*)")
      .order("created_at", { ascending: false });

    const { data: prescriptions } = await supabase
      .from("tang_prescriptions")
      .select("*, tang_happycall_logs(*), tang_prescription_updates(*)")
      .eq("is_completed", false);

    const alertMap = {};
    (prescriptions || []).forEach(p => {
      const latestUpdate = (p.tang_prescription_updates || []).sort((a,b) => b.created_at.localeCompare(a.created_at))[0];
      const reservationDate = latestUpdate ? latestUpdate.new_reservation_happycall_date : p.reservation_happycall_date;
      const arrivalDone = (p.tang_happycall_logs || []).find(h => h.call_type === "arrival" && h.is_done);
      const reservationDone = (p.tang_happycall_logs || []).find(h => h.call_type === "reservation" && h.is_done);
      if (!alertMap[p.patient_id]) alertMap[p.patient_id] = [];
      if (isTodayOrPast(p.arrival_happycall_date) && !arrivalDone) alertMap[p.patient_id].push({ kind: "도착" });
      if (isTodayOrPast(reservationDate) && !reservationDone) alertMap[p.patient_id].push({ kind: "예약" });
    });
    setAlerts(alertMap);

    const sorted = [...(data || [])].sort((a, b) => {
      const aHas = (alertMap[a.id] || []).length > 0 ? 0 : 1;
      const bHas = (alertMap[b.id] || []).length > 0 ? 0 : 1;
      return aHas - bHas;
    });
    setPatients(sorted);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // 대시보드에서 직접 환자+탭 선택 시 처리
  useEffect(() => {
    if (selectPatientId && patients.length > 0) {
      const found = patients.find(p => p.id === selectPatientId);
      if (found) {
        setSelected(found);
        setInitialTab(selectTab || "prescription");
      }
    }
  }, [selectPatientId, patients, selectTab]);

  const filtered = patients.filter(p =>
    p.name?.includes(search) || p.chart_number?.includes(search)
  );

  if (selected) return <PatientDetail patient={selected} initialTab={initialTab} onBack={() => { setSelected(null); load(); }} />;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">탕약 환자</div>
        <div className="page-sub">총 {patients.length}명 등록</div>
      </div>
      <div className="toolbar">
        <input className="search-input" placeholder="이름 또는 차트번호 검색" value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn btn-teal" onClick={() => setShowModal(true)}>+ 신규 환자 등록</button>
      </div>

      {loading ? <div className="empty">불러오는 중...</div> : (
        <div className="patient-grid">
          {filtered.map(p => {
            const pkg = (p.tang_packages || []).find(pk => pk.is_active);
            const todayAlerts = alerts[p.id] || [];
            const hasAlert = todayAlerts.length > 0;

            return (
              <div key={p.id} className={`patient-card ${hasAlert ? "alert" : ""}`} onClick={() => setSelected(p)}>
                <div className="patient-card-header">
                  <div>
                    <div className="patient-name">{p.name}</div>
                    <div className="patient-chart">차트 #{p.chart_number}</div>
                  </div>
                  <div style={{display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end"}}>
                    {todayAlerts.map((a, i) => (
                      <span key={i} className={`badge ${a.kind === "도착" ? "badge-gold" : "badge-warn"}`}>
                        {a.kind === "도착" ? "📦" : "📅"} {a.kind} 해피콜
                      </span>
                    ))}
                    <button className="btn btn-xs btn-danger" onClick={async e => {
                      e.stopPropagation();
                      if (!window.confirm(`${p.name} 환자를 삭제하시겠습니까?`)) return;
                      await supabase.from("tang_patients").delete().eq("id", p.id);
                      load();
                    }}>삭제</button>
                  </div>
                </div>
                {pkg && (
                  <div style={{marginTop:8}}>
                    <span className="badge badge-teal">{pkg.package_months}개월 패키지</span>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && <div className="empty">등록된 환자가 없습니다</div>}
        </div>
      )}
      {showModal && <NewPatientModal onClose={() => { setShowModal(false); load(); }} />}
    </div>
  );
}
