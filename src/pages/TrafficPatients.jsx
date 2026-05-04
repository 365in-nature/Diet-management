import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  today, formatDate, formatDateKo, diffDays,
  getTreatmentZone, getWeekRange, canTreatToday,
  getConsecutiveMissedSlots, getHerbStatus, addDays,
} from "../lib/dateUtils";

// =============================================
// 치료 구간 라벨
// =============================================
function ZoneBadge({ zone }) {
  const map = {
    daily:  { label: "매일 치료",  color: "var(--accent)",  bg: "var(--accent-pale)" },
    week3:  { label: "주 3회",     color: "var(--teal)",    bg: "var(--teal-pale)" },
    week2:  { label: "주 2회",     color: "var(--info)",    bg: "var(--info-pale)" },
    week1:  { label: "주 1회",     color: "var(--gold)",    bg: "var(--gold-pale)" },
    before: { label: "사고 전",    color: "var(--ink-muted)", bg: "var(--surface2)" },
  };
  const s = map[zone] || map.before;
  return (
    <span style={{background:s.bg, color:s.color, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700}}>
      {s.label}
    </span>
  );
}

// =============================================
// 내원 기록 탭
// =============================================
function VisitTab({ patient, visits, onVisitChange }) {
  const visitDates = visits.map(v => v.visit_date);
  const todayStr = today();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [addingVisit, setAddingVisit] = useState(false);

  // 최근 30건 내원 기록
  const recent = [...visits].sort((a,b) => b.visit_date.localeCompare(a.visit_date)).slice(0, 30);

  const { zone, maxPerWeek } = getTreatmentZone(patient.accident_date, todayStr, patient.is_severe);
  const { start: weekStart, end: weekEnd } = zone !== "before" ? getWeekRange(patient.accident_date, todayStr) : { start:null, end:null };
  const visitsThisWeek = weekStart ? visitDates.filter(d => d >= weekStart && d <= weekEnd).length : 0;
  const missedSlots = getConsecutiveMissedSlots(patient.accident_date, patient.is_severe, visitDates);
  const canTreat = canTreatToday(patient.accident_date, patient.is_severe, visitDates);
  const todayVisited = visitDates.includes(todayStr);

  // 오늘 내원 토글
  const handleToggle = async () => {
    if (todayVisited) {
      await supabase.from("traffic_visits").delete().eq("patient_id", patient.id).eq("visit_date", todayStr);
    } else {
      await supabase.from("traffic_visits").insert([{ patient_id: patient.id, visit_date: todayStr }]);
    }
    onVisitChange();
  };

  // 날짜 선택해서 내원 추가
  const handleAddVisitByDate = async () => {
    if (visitDates.includes(selectedDate)) {
      if (!window.confirm(`${formatDate(selectedDate)} 내원 기록을 삭제하시겠습니까?`)) return;
      await supabase.from("traffic_visits").delete().eq("patient_id", patient.id).eq("visit_date", selectedDate);
    } else {
      await supabase.from("traffic_visits").insert([{ patient_id: patient.id, visit_date: selectedDate }]);
    }
    setAddingVisit(false);
    onVisitChange();
  };

  // 날짜별 미니 달력 (인라인)
  const MiniCal = () => {
    const sel = new Date(selectedDate);
    const [vy, setVy] = useState(sel.getFullYear());
    const [vm, setVm] = useState(sel.getMonth());
    const DOW = ["일","월","화","수","목","금","토"];
    const firstDay = new Date(vy, vm, 1).getDay();
    const dim = new Date(vy, vm+1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= dim; d++) cells.push(d);
    return (
      <div style={{ background:"var(--surface)", border:"1.5px solid var(--border)", borderRadius:10, padding:14, marginTop:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <button onClick={() => { if(vm===0){setVy(y=>y-1);setVm(11);}else setVm(m=>m-1); }} style={{ background:"none",border:"none",cursor:"pointer",fontSize:15,color:"var(--ink-muted)" }}>‹</button>
          <span style={{ fontWeight:700, fontSize:13 }}>{vy}년 {vm+1}월</span>
          <button onClick={() => { if(vm===11){setVy(y=>y+1);setVm(0);}else setVm(m=>m+1); }} style={{ background:"none",border:"none",cursor:"pointer",fontSize:15,color:"var(--ink-muted)" }}>›</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
          {DOW.map((d,i) => <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:i===0?"var(--warn)":i===6?"var(--info)":"var(--ink-muted)" }}>{d}</div>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
          {cells.map((d,i) => {
            if (!d) return <div key={`e-${i}`} />;
            const ds = `${vy}-${String(vm+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const isSel = ds === selectedDate;
            const isVisited = visitDates.includes(ds);
            const dow = (firstDay+d-1)%7;
            return (
              <button key={ds} onClick={() => setSelectedDate(ds)} style={{
                width:"100%", aspectRatio:"1", border:"none", borderRadius:4, cursor:"pointer", fontSize:11,
                fontWeight: isSel||isVisited ? 700 : 400,
                background: isSel ? "var(--traffic)" : isVisited ? "var(--traffic-pale)" : "transparent",
                color: isSel ? "#fff" : isVisited ? "var(--traffic)" : dow===0?"var(--warn)":dow===6?"var(--info)":"var(--ink)",
                outline: ds===todayStr&&!isSel ? "1.5px solid var(--accent)" : "none",
              }}>{d}</button>
            );
          })}
        </div>
        <div style={{ marginTop:10, display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setAddingVisit(false)}>취소</button>
          <button className={`btn btn-sm ${visitDates.includes(selectedDate)?"btn-danger":"btn-primary"}`} onClick={handleAddVisitByDate}>
            {visitDates.includes(selectedDate) ? `${formatDate(selectedDate)} 내원 삭제` : `${formatDate(selectedDate)} 내원 추가`}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* 내원 처리 카드 */}
      <div className="card" style={{marginBottom:16}}>
        <div className="section-header">
          <div className="section-title">📅 내원 관리</div>
          <ZoneBadge zone={zone} />
        </div>

        <div style={{display:"flex", gap:16, flexWrap:"wrap", marginBottom:16, fontSize:13}}>
          <div>
            <div className="form-label">이번 주 내원</div>
            <div style={{fontSize:18, fontWeight:700, color:"var(--traffic)"}}>{visitsThisWeek} / {zone==="daily"?"매일":maxPerWeek}회</div>
          </div>
          <div>
            <div className="form-label">연속 미내원 슬롯</div>
            <div style={{fontSize:18, fontWeight:700, color:missedSlots>=3?"var(--warn)":"var(--ink)"}}>{missedSlots}회 {missedSlots>=3&&"⚠️"}</div>
          </div>
          <div>
            <div className="form-label">총 내원 횟수</div>
            <div style={{fontSize:18, fontWeight:700}}>{visits.length}회</div>
          </div>
        </div>

        {/* 오늘 내원 버튼 */}
        {canTreat ? (
          <button className={`visit-btn ${todayVisited?"visited":"not-visited"}`} style={{width:"100%", padding:"14px", fontSize:15}} onClick={handleToggle}>
            {todayVisited ? "✅ 오늘 내원 확인됨 — 취소하려면 클릭" : "○ 오늘 내원 확인 클릭"}
          </button>
        ) : (
          <div style={{ background:"var(--surface2)", borderRadius:"var(--r-sm)", padding:"14px", textAlign:"center", fontSize:14, color:"var(--ink-muted)", fontWeight:600 }}>
            오늘은 치료 횟수를 모두 사용했습니다
          </div>
        )}

        {missedSlots >= 3 && (
          <div className="alert-banner" style={{marginTop:12}}>
            ⚠️ 치료 가능 슬롯 {missedSlots}회 연속 미내원 — 환자 상태를 확인해주세요
          </div>
        )}

        {/* 날짜 선택 내원 추가/삭제 */}
        <div style={{marginTop:14, paddingTop:14, borderTop:"1px solid var(--border)"}}>
          <button className="btn btn-secondary btn-sm" onClick={() => setAddingVisit(!addingVisit)}>
            📅 다른 날짜 내원 추가/삭제
          </button>
          <div style={{fontSize:11, color:"var(--ink-muted)", marginTop:4}}>누락된 내원 기록을 소급 입력하거나 삭제할 수 있습니다</div>
          {addingVisit && <MiniCal />}
        </div>
      </div>

      {/* 내원 기록 */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">📋 최근 내원 기록</div>
          <span style={{fontSize:12, color:"var(--ink-muted)"}}>최근 30건</span>
        </div>
        {recent.length === 0 ? (
          <div className="empty">내원 기록이 없습니다</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>내원일</th><th>치료 구간</th><th>사고 후</th><th></th></tr></thead>
              <tbody>
                {recent.map(v => {
                  const { zone } = getTreatmentZone(patient.accident_date, v.visit_date, patient.is_severe);
                  const daysSince = diffDays(patient.accident_date, v.visit_date);
                  return (
                    <tr key={v.id}>
                      <td><strong>{formatDate(v.visit_date)}</strong></td>
                      <td><ZoneBadge zone={zone} /></td>
                      <td style={{fontSize:12, color:"var(--ink-muted)"}}>+{daysSince}일</td>
                      <td>
                        <button className="btn btn-xs btn-danger" onClick={async () => {
                          if (!window.confirm("이 내원 기록을 삭제하시겠습니까?")) return;
                          await supabase.from("traffic_visits").delete().eq("id", v.id);
                          onVisitChange();
                        }}>삭제</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// 환자 정보 탭 (기본 정보 + 자보 한약 + 중증 설정)
// =============================================
function InfoTab({ patient, onUpdate }) {
  const [form, setForm] = useState({
    chart_number: patient.chart_number || "",
    name: patient.name || "",
    accident_date: patient.accident_date || "",
    herb_prescribed_at: patient.herb_prescribed_at || "",
    is_severe: patient.is_severe || false,
  });
  const [herbForm, setHerbForm] = useState(patient.herb_prescribed_at || "");
  const [saving, setSaving] = useState(false);
  const [savingHerb, setSavingHerb] = useState(false);

  const herbStatus = getHerbStatus(patient.herb_prescribed_at);

  // 기본 정보 수정
  const saveInfo = async () => {
    setSaving(true);
    await supabase.from("traffic_patients").update({
      chart_number: form.chart_number,
      name: form.name,
      accident_date: form.accident_date,
    }).eq("id", patient.id);
    setSaving(false);
    onUpdate();
  };

  // 자보 한약 처방일 저장
  const saveHerb = async () => {
    setSavingHerb(true);
    await supabase.from("traffic_patients").update({
      herb_prescribed_at: herbForm || null,
    }).eq("id", patient.id);
    setSavingHerb(false);
    onUpdate();
  };

  // 중증 토글
  const toggleSevere = async () => {
    const newVal = !patient.is_severe;
    if (!window.confirm(newVal ? "골절 이상 중증 환자로 변경하시겠습니까?\n4주차부터 계속 주 3회 치료로 설정됩니다." : "일반 환자로 변경하시겠습니까?")) return;
    await supabase.from("traffic_patients").update({
      is_severe: newVal,
      severe_updated_at: new Date().toISOString(),
    }).eq("id", patient.id);
    onUpdate();
  };

  // 치료 구간 타임라인
  const accDate = patient.accident_date;
  const timeline = accDate ? [
    { label: "사고일", date: accDate, desc: "매일 치료 시작" },
    { label: "3주 후", date: addDays(accDate, 21), desc: patient.is_severe ? "주 3회 (중증 유지)" : "주 3회" },
    { label: "11주 후", date: addDays(accDate, 77), desc: patient.is_severe ? "주 3회 (중증 유지)" : "주 2회" },
    { label: "6개월 후", date: addDays(accDate, 182), desc: patient.is_severe ? "주 3회 (중증 유지)" : "주 1회" },
  ] : [];

  return (
    <div>
      {/* 기본 정보 */}
      <div className="card" style={{marginBottom:16}}>
        <div className="section-header">
          <div className="section-title">📋 기본 정보</div>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">차트번호</label>
            <input className="form-input" value={form.chart_number} onChange={e => setForm({...form, chart_number: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">이름</label>
            <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="form-group form-full">
            <label className="form-label">사고일</label>
            <input className="form-input" type="date" value={form.accident_date} onChange={e => setForm({...form, accident_date: e.target.value})} />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary btn-sm" onClick={saveInfo} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      {/* 중증 여부 */}
      <div className="card" style={{marginBottom:16}}>
        <div className="section-header">
          <div className="section-title">🦴 중증 환자 설정</div>
          {patient.severe_updated_at && (
            <span style={{fontSize:11, color:"var(--ink-muted)"}}>
              변경: {formatDate(patient.severe_updated_at?.split("T")[0])}
            </span>
          )}
        </div>
        <div style={{marginBottom:12, fontSize:13, color:"var(--ink-muted)"}}>
          골절 이상 중증 환자는 4주차부터 기간 제한 없이 주 3회 치료가 가능합니다.
        </div>
        <button
          className={`severe-toggle ${patient.is_severe ? "" : "off"}`}
          onClick={toggleSevere}
        >
          {patient.is_severe ? "🦴 중증 환자 (주 3회 유지 중)" : "□ 일반 환자 (클릭하여 중증으로 변경)"}
        </button>
      </div>

      {/* 치료 구간 타임라인 */}
      {accDate && (
        <div className="card" style={{marginBottom:16}}>
          <div className="section-title" style={{marginBottom:16}}>📅 치료 구간 타임라인</div>
          <div style={{display:"flex", flexDirection:"column", gap:12}}>
            {timeline.map((t, i) => {
              const isPast = t.date <= today();
              const isCurrent = i < timeline.length - 1
                ? t.date <= today() && timeline[i+1].date > today()
                : t.date <= today();
              return (
                <div key={i} style={{display:"flex", alignItems:"center", gap:12}}>
                  <div style={{
                    width:12, height:12, borderRadius:"50%", flexShrink:0,
                    background: isCurrent ? "var(--traffic)" : isPast ? "var(--accent)" : "var(--border)",
                    boxShadow: isCurrent ? "0 0 0 3px var(--traffic-pale)" : "none",
                  }} />
                  <div style={{flex:1}}>
                    <div style={{display:"flex", gap:10, alignItems:"center"}}>
                      <strong style={{fontSize:13}}>{t.label}</strong>
                      <span style={{fontSize:12, color:"var(--ink-muted)"}}>{formatDate(t.date)}</span>
                      {isCurrent && <span style={{background:"var(--traffic-pale)", color:"var(--traffic)", fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:10}}>현재</span>}
                    </div>
                    <div style={{fontSize:12, color: isCurrent ? "var(--traffic)" : "var(--ink-muted)", fontWeight: isCurrent ? 600 : 400}}>
                      {t.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 자보 한약 처방 */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">💊 자보 한약 처방</div>
          <div style={{display:"flex", gap:6, alignItems:"center"}}>
            {patient.herb_refused ? (
              <span className="badge badge-muted">🚫 거부</span>
            ) : patient.herb_prescribed_at ? (
              herbStatus.canPrescribe ? <span className="badge badge-info">처방 가능</span> : <span className="badge badge-muted">D-{herbStatus.dDay}</span>
            ) : null}
          </div>
        </div>

        {/* 한약 거부 토글 */}
        <div style={{marginBottom:16, padding:"12px 16px", background: patient.herb_refused ? "var(--warn-pale)" : "var(--surface2)", borderRadius:"var(--r-sm)", border:`1.5px solid ${patient.herb_refused?"#f5c6bd":"var(--border)"}`}}>
          <label className="form-check" style={{cursor:"pointer"}}>
            <input
              type="checkbox"
              checked={patient.herb_refused || false}
              onChange={async (e) => {
                const newVal = e.target.checked;
                if (!window.confirm(newVal ? "한약 거부로 설정하시겠습니까?" : "한약 거부를 해제하시겠습니까?")) return;
                await supabase.from("traffic_patients").update({ herb_refused: newVal }).eq("id", patient.id);
                onUpdate();
              }}
              style={{width:16, height:16, cursor:"pointer", accentColor:"var(--warn)"}}
            />
            <span style={{color: patient.herb_refused ? "var(--warn)" : "var(--ink-muted)", fontWeight: patient.herb_refused ? 700 : 400}}>
              🚫 한약 거부함
            </span>
            {patient.herb_refused && <span style={{fontSize:11, color:"var(--warn)", marginLeft:4}}>— 한약 처방 제외</span>}
          </label>
        </div>

        {/* 한약 거부 시 처방 섹션 비활성화 */}
        {!patient.herb_refused && (
          <>
            {patient.herb_prescribed_at ? (
              <div style={{marginBottom:16, padding:"12px 16px", background: herbStatus.canPrescribe ? "var(--info-pale)" : "var(--surface2)", borderRadius:"var(--r-sm)", border:`1.5px solid ${herbStatus.canPrescribe ? "var(--info)" : "var(--border)"}`}}>
                <div style={{fontSize:12, color:"var(--ink-muted)", marginBottom:4}}>마지막 처방일</div>
                <div style={{fontSize:16, fontWeight:700}}>{formatDate(patient.herb_prescribed_at)}</div>
                {herbStatus.canPrescribe ? (
                  <div style={{fontSize:13, color:"var(--info)", fontWeight:600, marginTop:6}}>💊 지금 처방 가능합니다 (7일 경과)</div>
                ) : (
                  <div style={{fontSize:13, color:"var(--ink-muted)", marginTop:6}}>다음 처방 가능일: <strong>{formatDate(addDays(patient.herb_prescribed_at, 7))}</strong> (D-{herbStatus.dDay})</div>
                )}
              </div>
            ) : (
              <div className="empty" style={{padding:12}}>처방 기록이 없습니다</div>
            )}

            <div style={{marginTop:12}}>
              <label className="form-label" style={{marginBottom:6, display:"block"}}>
                {patient.herb_prescribed_at ? "처방일 수정" : "처방일 입력"}
              </label>
              <div style={{display:"flex", gap:10, alignItems:"center"}}>
                <input className="form-input" type="date" value={herbForm} onChange={e => setHerbForm(e.target.value)} style={{flex:1}} />
                <button className="btn btn-primary btn-sm" onClick={saveHerb} disabled={savingHerb}>
                  {savingHerb ? "저장 중..." : "저장"}
                </button>
                {patient.herb_prescribed_at && (
                  <button className="btn btn-danger btn-sm" onClick={async () => {
                    if (!window.confirm("자보 한약 처방 기록을 삭제하시겠습니까?")) return;
                    await supabase.from("traffic_patients").update({ herb_prescribed_at: null }).eq("id", patient.id);
                    setHerbForm("");
                    onUpdate();
                  }}>삭제</button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// =============================================
// 전화 기록 탭
// =============================================
const CALL_STATUS = ["연락됨", "부재중", "예약변경", "내원예정", "합의", "기타"];

function CallTab({ patient, currentUser }) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState("연락됨");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCalls = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("traffic_missed_calls")
      .select("*")
      .eq("patient_id", patient.id)
      .order("called_at", { ascending: false });
    setCalls(data || []);
    setLoading(false);
  };

  useEffect(() => { loadCalls(); }, [patient.id]);

  const handleSave = async () => {
    if (!memo.trim()) { alert("메모를 입력해주세요."); return; }
    setSaving(true);
    await supabase.from("traffic_missed_calls").insert([{
      patient_id: patient.id,
      called_at: new Date().toISOString(),
      called_by: currentUser?.name || currentUser?.email || "Unknown",
      status,
      memo: memo.trim(),
    }]);
    setMemo("");
    setStatus("연락됨");
    setShowForm(false);
    setSaving(false);
    loadCalls();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("이 전화 기록을 삭제하시겠습니까?")) return;
    await supabase.from("traffic_missed_calls").delete().eq("id", id);
    loadCalls();
  };

  const statusColor = (s) => ({
    "연락됨": "var(--teal)", "부재중": "var(--warn)", "예약변경": "var(--info)",
    "내원예정": "var(--accent)", "합의": "var(--gold)", "기타": "var(--ink-muted)",
  }[s] || "var(--ink-muted)");

  return (
    <div>
      <div className="card" style={{marginBottom:16}}>
        <div className="section-header">
          <div className="section-title">📞 전화 기록</div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}>
            {showForm ? "취소" : "+ 전화 기록 추가"}
          </button>
        </div>

        {showForm && (
          <div style={{background:"var(--surface2)", borderRadius:"var(--r-sm)", padding:16, marginBottom:16}}>
            <div className="form-grid" style={{marginBottom:12}}>
              <div className="form-group">
                <label className="form-label">상태</label>
                <select className="form-input" value={status} onChange={e => setStatus(e.target.value)}>
                  {CALL_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{marginBottom:12}}>
              <label className="form-label">메모</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="통화 내용을 입력하세요..."
                value={memo}
                onChange={e => setMemo(e.target.value)}
                style={{resize:"vertical"}}
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="empty">불러오는 중...</div>
        ) : calls.length === 0 ? (
          <div className="empty">전화 기록이 없습니다</div>
        ) : (
          <div style={{display:"flex", flexDirection:"column", gap:10}}>
            {calls.map(c => (
              <div key={c.id} style={{background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", padding:"12px 16px"}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:6}}>
                      <span style={{background:"var(--surface2)", color:statusColor(c.status), fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20}}>
                        {c.status}
                      </span>
                      <span style={{fontSize:12, color:"var(--ink-muted)"}}>
                        {new Date(c.called_at).toLocaleDateString("ko-KR", {year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit"})}
                      </span>
                      <span style={{fontSize:12, color:"var(--ink-muted)"}}>· {c.called_by}</span>
                    </div>
                    <div style={{fontSize:13, color:"var(--ink)", lineHeight:1.6, whiteSpace:"pre-wrap"}}>{c.memo}</div>
                  </div>
                  <button className="btn btn-xs btn-danger" onClick={() => handleDelete(c.id)}>삭제</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// 환자 상세 페이지
// =============================================
function PatientDetail({ patient: initialPatient, visits: initialVisits, onBack, onUpdate, currentUser }) {
  const [tab, setTab] = useState("visit");
  const [patient, setPatient] = useState(initialPatient);
  const [visits, setVisits] = useState(initialVisits);

  const refreshPatient = async () => {
    const { data } = await supabase.from("traffic_patients").select("*").eq("id", patient.id).single();
    if (data) setPatient(data);
    onUpdate();
  };

  const refreshVisits = async () => {
    const { data } = await supabase.from("traffic_visits").select("*").eq("patient_id", patient.id).order("visit_date", { ascending: false });
    setVisits(data || []);
    onUpdate();
  };

  const visitDates = visits.map(v => v.visit_date);
  const { zone } = getTreatmentZone(patient.accident_date, today(), patient.is_severe);
  const missedSlots = getConsecutiveMissedSlots(patient.accident_date, patient.is_severe, visitDates);
  const herbStatus = getHerbStatus(patient.herb_prescribed_at);
  const daysSinceAccident = patient.accident_date ? diffDays(patient.accident_date, today()) : null;

  return (
    <div>
      <button className="back-btn" onClick={onBack}>← 목록으로</button>

      {/* 환자 헤더 */}
      <div style={{background:"var(--ink)", color:"#fff", borderRadius:"var(--r)", padding:24, marginBottom:24}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12}}>
          <div>
            <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:6}}>
              <span className="badge badge-traffic">🚗 교통사고</span>
              {patient.is_severe && <span className="badge badge-traffic">🦴 중증</span>}
            </div>
            <div style={{fontFamily:"'DM Serif Display', serif", fontSize:24}}>{patient.name}</div>
            <div style={{fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:4}}>
              차트 #{patient.chart_number} · 사고일 {formatDate(patient.accident_date)}
              {daysSinceAccident !== null && ` · 사고 후 ${daysSinceAccident}일`}
            </div>
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end"}}>
            <ZoneBadge zone={zone} />
            {missedSlots >= 3 && <span className="badge badge-warn">⚠️ {missedSlots}회 연속 미내원</span>}
            {herbStatus.canPrescribe && <span className="badge badge-info">💊 한약 처방 가능</span>}
            {!herbStatus.canPrescribe && herbStatus.dDay !== null && herbStatus.dDay > 0 && (
              <span className="badge badge-muted">💊 한약 D-{herbStatus.dDay}</span>
            )}
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="tabs">
        {[
          { key: "visit", label: "① 내원 관리" },
          { key: "info",  label: "② 환자 정보" },
          { key: "call",  label: "③ 전화 기록" },
        ].map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "visit" && <VisitTab patient={patient} visits={visits} onVisitChange={refreshVisits} />}
      {tab === "info"  && <InfoTab patient={patient} onUpdate={refreshPatient} />}
      {tab === "call"  && <CallTab patient={patient} currentUser={currentUser} />}
    </div>
  );
}

// =============================================
// 신규 환자 등록 모달
// =============================================
function NewPatientModal({ onClose }) {
  const [form, setForm] = useState({
    chart_number: "",
    name: "",
    accident_date: today(),
    herb_prescribed_at: "",
    is_severe: false,
    herb_refused: false,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async () => {
    if (!form.chart_number || !form.name) { setErr("차트번호와 이름은 필수입니다."); return; }
    if (!form.accident_date) { setErr("사고일은 필수입니다."); return; }
    setLoading(true);
    const { error } = await supabase.from("traffic_patients").insert([{
      chart_number: form.chart_number,
      name: form.name,
      accident_date: form.accident_date,
      herb_prescribed_at: form.herb_prescribed_at || null,
      is_severe: form.is_severe,
      herb_refused: form.herb_refused,
      severe_updated_at: form.is_severe ? new Date().toISOString() : null,
    }]);
    if (error) { setErr(error.message); setLoading(false); return; }
    onClose();
  };

  // 해피콜 미리보기
  const accDate = form.accident_date;
  const zone3w = accDate ? formatDate(addDays(accDate, 21)) : null;
  const zone11w = accDate ? formatDate(addDays(accDate, 77)) : null;
  const zone6m = accDate ? formatDate(addDays(accDate, 182)) : null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-title">신규 교통사고 환자 등록</div>
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
            <label className="form-label">사고일 *</label>
            <input className="form-input" type="date" value={form.accident_date} onChange={e => setForm({...form, accident_date: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">자보 한약 처방일 (선택)</label>
            <input className="form-input" type="date" value={form.herb_prescribed_at} onChange={e => setForm({...form, herb_prescribed_at: e.target.value})} />
          </div>
        </div>

        {/* 중증 체크박스 */}
        <div style={{margin:"16px 0", padding:"12px 16px", background:"var(--traffic-pale)", borderRadius:"var(--r-sm)", border:"1.5px solid var(--traffic)"}}>
          <label className="form-check">
            <input type="checkbox" checked={form.is_severe} onChange={e => setForm({...form, is_severe: e.target.checked})} style={{width:16, height:16, cursor:"pointer", accentColor:"var(--traffic)"}} />
            <span style={{color:"var(--traffic)", fontWeight:700}}>🦴 골절 이상 중증 환자</span>
            <span style={{fontSize:12, color:"var(--ink-muted)", marginLeft:4}}>(4주차부터 주 3회 유지)</span>
          </label>
        </div>

        {/* 한약 거부 체크박스 */}
        <div style={{margin:"0 0 16px", padding:"12px 16px", background: form.herb_refused ? "var(--warn-pale)" : "var(--surface2)", borderRadius:"var(--r-sm)", border:`1.5px solid ${form.herb_refused?"#f5c6bd":"var(--border)"}`}}>
          <label className="form-check">
            <input type="checkbox" checked={form.herb_refused} onChange={e => setForm({...form, herb_refused: e.target.checked})} style={{width:16, height:16, cursor:"pointer", accentColor:"var(--warn)"}} />
            <span style={{color: form.herb_refused ? "var(--warn)" : "var(--ink-muted)", fontWeight: form.herb_refused ? 700 : 400}}>🚫 한약 거부함</span>
          </label>
        </div>

        {/* 치료 구간 미리보기 */}
        {accDate && (
          <div style={{background:"var(--surface2)", borderRadius:"var(--r-sm)", padding:"12px 16px", marginBottom:16, fontSize:12}}>
            <div style={{fontWeight:700, marginBottom:8, color:"var(--traffic)"}}>📅 치료 구간 미리보기</div>
            <div style={{display:"flex", flexDirection:"column", gap:6}}>
              <div>🟢 <strong>사고일~3주</strong> ({formatDate(accDate)} ~ {zone3w}) — 매일 치료</div>
              <div>🔵 <strong>3주~11주</strong> ({zone3w} ~ {zone11w}) — 주 3회</div>
              {!form.is_severe && <>
                <div>🟡 <strong>11주~6개월</strong> ({zone11w} ~ {zone6m}) — 주 2회</div>
                <div>⚪ <strong>6개월 이후</strong> ({zone6m}~) — 주 1회</div>
              </>}
              {form.is_severe && (
                <div style={{color:"var(--traffic)", fontWeight:600}}>🦴 중증: 3주 이후 계속 주 3회 유지</div>
              )}
            </div>
          </div>
        )}

        {err && <div style={{color:"var(--warn)", fontSize:13, marginBottom:8}}>{err}</div>}
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>등록</button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// TRAFFIC PATIENTS PAGE
// =============================================
export default function TrafficPatients({ currentUser, selectPatientId, onMounted }) {
  const [patients, setPatients] = useState([]);
  const [visits, setVisits] = useState({});
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showClosed, setShowClosed] = useState(false);
  const [closedPatients, setClosedPatients] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: pts } = await supabase
      .from("traffic_patients")
      .select("*")
      .eq("is_closed", false)
      .order("created_at", { ascending: false });

    const { data: vs } = await supabase
      .from("traffic_visits")
      .select("*")
      .order("visit_date", { ascending: false });

    const visitMap = {};
    (vs || []).forEach(v => {
      if (!visitMap[v.patient_id]) visitMap[v.patient_id] = [];
      visitMap[v.patient_id].push(v);
    });

    // 정렬: 3회 연속 미내원 → 오늘 치료 가능 → 나머지
    const sorted = [...(pts || [])].sort((a, b) => {
      const aVisits = (visitMap[a.id] || []).map(v => v.visit_date);
      const bVisits = (visitMap[b.id] || []).map(v => v.visit_date);
      const aMissed = getConsecutiveMissedSlots(a.accident_date, a.is_severe, aVisits) >= 3 ? 0 : 1;
      const bMissed = getConsecutiveMissedSlots(b.accident_date, b.is_severe, bVisits) >= 3 ? 0 : 1;
      if (aMissed !== bMissed) return aMissed - bMissed;
      const aCanTreat = canTreatToday(a.accident_date, a.is_severe, aVisits) ? 0 : 1;
      const bCanTreat = canTreatToday(b.accident_date, b.is_severe, bVisits) ? 0 : 1;
      return aCanTreat - bCanTreat;
    });

    setPatients(sorted);
    setVisits(visitMap);

    // 종결 환자 별도 로드
    const { data: closed } = await supabase
      .from("traffic_patients")
      .select("*")
      .eq("is_closed", true)
      .order("created_at", { ascending: false });
    setClosedPatients(closed || []);

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // 대시보드에서 직접 환자 선택 시 처리 — 한 번만 실행 후 초기화
  useEffect(() => {
    if (selectPatientId && patients.length > 0) {
      const found = patients.find(p => p.id === selectPatientId);
      if (found) {
        setSelected(found);
        if (onMounted) onMounted();
      }
    }
  }, [selectPatientId, patients]);

  // 내원 토글 (목록에서 직접)
  const handleToggleVisit = async (patient, isVisited) => {
    if (isVisited) {
      await supabase.from("traffic_visits").delete().eq("patient_id", patient.id).eq("visit_date", today());
    } else {
      await supabase.from("traffic_visits").insert([{ patient_id: patient.id, visit_date: today() }]);
    }
    load();
  };

  const filtered = patients.filter(p =>
    p.name?.includes(search) || p.chart_number?.includes(search)
  );

  // 선택된 환자 상세
  if (selected) {
    return (
      <PatientDetail
        patient={selected}
        visits={visits[selected.id] || []}
        onBack={() => { setSelected(null); load(); }}
        onUpdate={load}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">교통사고 환자</div>
        <div className="page-sub">총 {patients.length}명 등록</div>
      </div>
      <div className="toolbar">
        <input className="search-input" placeholder="이름 또는 차트번호 검색" value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{display:"flex", gap:8}}>
          <button className="btn btn-secondary" onClick={() => setShowClosed(v => !v)}>
            {showClosed ? "▲ 종결 환자 숨기기" : `📁 종결 환자 (${closedPatients.length}명)`}
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 신규 환자 등록</button>
        </div>
      </div>

      {loading ? <div className="empty">불러오는 중...</div> : (
        <div className="patient-grid">
          {filtered.map(p => {
            const visitDates = (visits[p.id] || []).map(v => v.visit_date);
            const canTreat = canTreatToday(p.accident_date, p.is_severe, visitDates);
            const missedSlots = getConsecutiveMissedSlots(p.accident_date, p.is_severe, visitDates);
            const todayVisited = visitDates.includes(today());
            const { zone } = getTreatmentZone(p.accident_date, today(), p.is_severe);
            const herbStatus = getHerbStatus(p.herb_prescribed_at);
            const hasAlert = missedSlots >= 3;

            return (
              <div key={p.id} className={`patient-card ${hasAlert ? "alert" : ""}`} onClick={() => setSelected(p)}>
                <div className="patient-card-header">
                  <div>
                    <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:4}}>
                      <ZoneBadge zone={zone} />
                      {p.is_severe && <span className="badge badge-traffic">🦴 중증</span>}
                    </div>
                    <div className="patient-name">{p.name}</div>
                    <div className="patient-chart">차트 #{p.chart_number}</div>
                  </div>
                  <div style={{display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end"}}>
                    {hasAlert && <span className="badge badge-warn">⚠️ {missedSlots}회 연속 미내원</span>}
                    {p.herb_refused ? (
                      <span className="badge badge-muted">🚫 한약 거부</span>
                    ) : herbStatus.canPrescribe ? (
                      <span className="badge badge-info">💊 한약 처방 가능</span>
                    ) : !herbStatus.canPrescribe && herbStatus.dDay !== null && herbStatus.dDay > 0 ? (
                      <span className="badge badge-muted">💊 D-{herbStatus.dDay}</span>
                    ) : null}
                    <button className="btn btn-xs btn-secondary" onClick={async e => {
                      e.stopPropagation();
                      if (!window.confirm(`${p.name} 환자를 종결 처리하시겠습니까?\n종결 후 목록에서 숨겨지며 복원 가능합니다.`)) return;
                      await supabase.from("traffic_patients").update({ is_closed: true }).eq("id", p.id);
                      load();
                    }}>종결</button>
                    <button className="btn btn-xs btn-danger" onClick={async e => {
                      e.stopPropagation();
                      if (!window.confirm(`${p.name} 환자를 삭제하시겠습니까?`)) return;
                      await supabase.from("traffic_patients").delete().eq("id", p.id);
                      load();
                    }}>삭제</button>
                  </div>
                </div>

                <div style={{fontSize:12, color:"var(--ink-muted)", margin:"8px 0"}}>
                  사고일 {formatDate(p.accident_date)} · 총 내원 {(visits[p.id] || []).length}회
                </div>

                {/* 내원 버튼 */}
                {canTreat ? (
                  <button
                    className={`visit-btn ${todayVisited ? "visited" : "not-visited"}`}
                    style={{width:"100%"}}
                    onClick={e => { e.stopPropagation(); handleToggleVisit(p, todayVisited); }}
                  >
                    {todayVisited ? "✅ 내원 확인됨 (취소하려면 클릭)" : "○ 내원 확인"}
                  </button>
                ) : (
                  <div style={{fontSize:12, color:"var(--ink-muted)", padding:"6px 0", textAlign:"center"}}>
                    오늘 치료 횟수 완료
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && <div className="empty">등록된 환자가 없습니다</div>}
        </div>
      )}

      {/* 종결 환자 목록 */}
      {showClosed && (
        <div style={{marginTop:24}}>
          <div style={{fontSize:14, fontWeight:700, color:"var(--ink-muted)", marginBottom:12, paddingBottom:8, borderBottom:"2px solid var(--border)"}}>
            📁 종결 환자 ({closedPatients.length}명)
          </div>
          {closedPatients.length === 0 ? (
            <div className="empty">종결 처리된 환자가 없습니다</div>
          ) : (
            <div className="patient-grid">
              {closedPatients.map(p => (
                <div key={p.id} className="patient-card" style={{opacity:0.7}}>
                  <div className="patient-card-header">
                    <div>
                      <div className="patient-name">{p.name}</div>
                      <div className="patient-chart">차트 #{p.chart_number}</div>
                      <div style={{fontSize:12, color:"var(--ink-muted)", marginTop:4}}>
                        사고일 {formatDate(p.accident_date)}
                      </div>
                    </div>
                    <div style={{display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end"}}>
                      <span className="badge badge-muted">종결</span>
                      <button className="btn btn-xs btn-secondary" onClick={async () => {
                        if (!window.confirm(`${p.name} 환자를 복원하시겠습니까?`)) return;
                        await supabase.from("traffic_patients").update({ is_closed: false }).eq("id", p.id);
                        load();
                      }}>복원</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && <NewPatientModal onClose={() => { setShowModal(false); load(); }} />}
    </div>
  );
}
