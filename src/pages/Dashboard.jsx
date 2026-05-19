import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  today, formatDate, isTodayOrPast, diffDays, addDays,
  canTreatToday, getConsecutiveMissedSlots, getHerbStatus,
  getWeekRange, getTreatmentZone, getWeekEncouragementStatus,
} from "../lib/dateUtils";

// =============================================
// 미니 달력
// =============================================
function MiniCalendar({ selectedDate, onSelect }) {
  const sel = new Date(selectedDate);
  const [viewYear, setViewYear] = useState(sel.getFullYear());
  const [viewMonth, setViewMonth] = useState(sel.getMonth());
  const DOW = ["일","월","화","수","목","금","토"];
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = today();

  const prevMonth = () => { if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11); } else setViewMonth(m => m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0); } else setViewMonth(m => m+1); };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ background:"var(--surface)", border:"1.5px solid var(--border)", borderRadius:"var(--r)", padding:16, minWidth:260 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <button onClick={prevMonth} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color:"var(--ink-muted)", padding:"2px 8px" }}>‹</button>
        <span style={{ fontWeight:700, fontSize:14 }}>{viewYear}년 {viewMonth+1}월</span>
        <button onClick={nextMonth} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color:"var(--ink-muted)", padding:"2px 8px" }}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
        {DOW.map((d,i) => (
          <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:i===0?"var(--warn)":i===6?"var(--info)":"var(--ink-muted)", padding:"2px 0" }}>{d}</div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} />;
          const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const isSelected = dateStr === selectedDate;
          const isTod = dateStr === todayStr;
          const dow = (firstDay + d - 1) % 7;
          return (
            <button key={dateStr} onClick={() => onSelect(dateStr)} style={{
              width:"100%", aspectRatio:"1", border:"none", borderRadius:6, cursor:"pointer",
              fontSize:12, fontWeight:isSelected||isTod?700:400,
              background:isSelected?"var(--accent)":isTod?"var(--accent-pale)":"transparent",
              color:isSelected?"#fff":dow===0?"var(--warn)":dow===6?"var(--info)":"var(--ink)",
              outline:isTod&&!isSelected?"1.5px solid var(--accent)":"none",
            }}>{d}</button>
          );
        })}
      </div>
      <div style={{ marginTop:10, textAlign:"center" }}>
        <button onClick={() => { onSelect(todayStr); setViewYear(new Date().getFullYear()); setViewMonth(new Date().getMonth()); }}
          style={{ fontSize:12, color:"var(--accent)", background:"none", border:"none", cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>
          오늘로 이동
        </button>
      </div>
    </div>
  );
}

// =============================================
// 미내원 전화 기록 모달
// =============================================
const CALL_STATUS = ["연락됨", "부재중", "예약변경", "내원예정", "합의", "기타"];

function MissedCallModal({ patient, currentUser, onClose }) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("연락됨");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCalls = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("traffic_missed_calls")
      .select("*")
      .eq("patient_id", patient.id)
      .order("called_at", { ascending: false })
      .limit(5);
    setCalls(data || []);
    setLoading(false);
  };

  useEffect(() => { loadCalls(); }, [patient.id]);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from("traffic_missed_calls").insert([{
      patient_id: patient.id,
      called_at: new Date().toISOString(),
      called_by: currentUser?.name || currentUser?.email || "Unknown",
      status,
      memo: memo.trim() || null,
    }]);
    setMemo("");
    setStatus("연락됨");
    setSaving(false);
    loadCalls();
  };

  const statusColor = (s) => ({
    "연락됨": "var(--teal)", "부재중": "var(--warn)", "예약변경": "var(--info)",
    "내원예정": "var(--accent)", "합의": "var(--gold)", "기타": "var(--ink-muted)",
  }[s] || "var(--ink-muted)");

  return (
    <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:16}}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{background:"var(--surface)", borderRadius:"var(--r)", padding:24, width:"100%", maxWidth:480, maxHeight:"80vh", overflowY:"auto", boxShadow:"0 8px 32px rgba(0,0,0,0.2)"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
          <div>
            <div style={{fontSize:16, fontWeight:700}}>📞 전화 기록</div>
            <div style={{fontSize:13, color:"var(--ink-muted)"}}>{patient.name} · 차트 #{patient.chart_number}</div>
          </div>
          <button onClick={onClose} style={{background:"none", border:"none", fontSize:20, cursor:"pointer", color:"var(--ink-muted)"}}>✕</button>
        </div>

        {/* 새 기록 입력 */}
        <div style={{background:"var(--surface2)", borderRadius:"var(--r-sm)", padding:16, marginBottom:16}}>
          <div style={{marginBottom:10}}>
            <div className="form-label" style={{marginBottom:6}}>상태</div>
            <select className="form-input" value={status} onChange={e => setStatus(e.target.value)}>
              {CALL_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{marginBottom:10}}>
            <div className="form-label" style={{marginBottom:6}}>메모</div>
            <textarea
              className="form-input"
              rows={3}
              placeholder="통화 내용을 입력하세요..."
              value={memo}
              onChange={e => setMemo(e.target.value)}
              style={{resize:"vertical"}}
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving} style={{width:"100%"}}>
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>

        {/* 최근 기록 */}
        <div style={{fontSize:12, fontWeight:700, color:"var(--ink-muted)", marginBottom:8}}>최근 전화 기록</div>
        {loading ? (
          <div style={{fontSize:13, color:"var(--ink-muted)", textAlign:"center", padding:12}}>불러오는 중...</div>
        ) : calls.length === 0 ? (
          <div style={{fontSize:13, color:"var(--ink-muted)", textAlign:"center", padding:12}}>전화 기록이 없습니다</div>
        ) : (
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            {calls.map(c => (
              <div key={c.id} style={{background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", padding:"10px 14px"}}>
                <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:4}}>
                  <span style={{color:statusColor(c.status), fontSize:11, fontWeight:700, background:"var(--surface2)", padding:"2px 8px", borderRadius:20}}>
                    {c.status}
                  </span>
                  <span style={{fontSize:11, color:"var(--ink-muted)"}}>
                    {new Date(c.called_at).toLocaleDateString("ko-KR", {month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit"})}
                  </span>
                  <span style={{fontSize:11, color:"var(--ink-muted)"}}>· {c.called_by}</span>
                </div>
                <div style={{fontSize:13, color:"var(--ink)", whiteSpace:"pre-wrap"}}>{c.memo}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// 해피콜 카드
// =============================================
function HappycallCard({ item, onToggle, onNoAnswer, onNavigate }) {
  const isPast = item.callDate < today();
  const isToday = item.callDate === today();
  const daysDiff = diffDays(item.callDate, today());
  const typeColor = item.patientType === "diet" ? "var(--accent)" : "var(--teal)";
  const typeBg   = item.patientType === "diet" ? "var(--accent-pale)" : "var(--teal-pale)";
  const typeLabel = item.patientType === "diet" ? "👥 다이어트" : "🌿 탕약";

  // 프리미엄 알림 카드
  if (item.isPremiumAlert) {
    return (
      <div style={{
        borderRadius:"var(--r)", padding:"14px 18px", cursor:"pointer", transition:"all 0.2s",
        border:"1.5px solid #f5c6bd", background:"#fffaf9",
      }} onClick={() => onNavigate(item)}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
              <span style={{ background:"var(--accent-pale)", color:"var(--accent)", fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>{typeLabel}</span>
              <span style={{ background:"#fff3e0", color:"#e07000", fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>🏥 프리미엄 재내원 필요</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:17, fontWeight:700 }}>{item.patientName}</span>
              <span style={{ fontSize:12, color:"var(--ink-muted)" }}>차트 #{item.chartNumber}</span>
              <span style={{ fontSize:12, color:"var(--warn)" }}>마지막 프리미엄 관리 13일 초과</span>
            </div>
          </div>
          <div style={{ flexShrink:0 }} onClick={e => e.stopPropagation()}>
            <button className="btn btn-sm btn-secondary" onClick={() => onNavigate(item)}>상세 보기</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      borderRadius:"var(--r)", padding:"14px 18px", cursor:"pointer", transition:"all 0.2s",
      border:`1.5px solid ${isPast?"#f5c6bd":isToday?"#b8d4f0":"var(--border)"}`,
      background:isPast?"#fffaf9":isToday?"#f0f7ff":"var(--surface)",
    }} onClick={() => onNavigate(item)}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
            <span style={{ background:typeBg, color:typeColor, fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>{typeLabel}</span>
            <span style={{ background:item.callKind==="도착"?"#fff3e0":"#fce4ec", color:item.callKind==="도착"?"#e07000":"#c2185b", fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>
              {item.callKind==="도착"?"📦 도착 해피콜":"📅 예약 해피콜"}
            </span>
            {isPast && <span className="badge badge-warn">⚠️ {daysDiff}일 지남</span>}
            {isToday && <span className="badge badge-info">오늘</span>}
            {item.noAnswerCount > 0 && <span className="badge badge-warn">📵 미응답 {item.noAnswerCount}회</span>}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:17, fontWeight:700 }}>{item.patientName}</span>
            <span style={{ fontSize:12, color:"var(--ink-muted)" }}>차트 #{item.chartNumber}</span>
            <span style={{ fontSize:12, color:"var(--ink-muted)" }}>{formatDate(item.callDate)}</span>
          </div>
          {item.memo && <div style={{ fontSize:12, color:"var(--ink-muted)", marginTop:4 }}>💬 {item.memo}</div>}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }} onClick={e => e.stopPropagation()}>
          <button className={`btn btn-sm ${item.isDone?"btn-secondary":"btn-primary"}`} onClick={() => onToggle(item)}>
            {item.isDone?"✓ 완료":"완료 처리"}
          </button>
          <button className="btn btn-sm btn-secondary" onClick={() => onNoAnswer(item)}>📵 미응답</button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// 교통사고 내원 카드
// =============================================
function TrafficTodayCard({ patient, visits, targetDate, onToggle, onNavigate, onCallLog }) {
  const visitDates = visits.map(v => v.visit_date);
  const dateVisited = visitDates.includes(targetDate);
  const missedSlots = getConsecutiveMissedSlots(patient.accident_date, patient.is_severe, visitDates);
  const herbStatus = getHerbStatus(patient.herb_prescriptions || []);
  const isRefused = patient.herb_refused;

  // 주기 및 이번 주 내원 횟수 계산
  const { zone, maxPerWeek } = getTreatmentZone(patient.accident_date, targetDate, patient.is_severe);
  const { start: weekStart, end: weekEnd } = getWeekRange(patient.accident_date, targetDate);
  const visitsThisWeek = visitDates.filter(d => d >= weekStart && d <= weekEnd).length;

  // 독려 알림 상태 (오늘 기준)
  const encourage = getWeekEncouragementStatus(patient.accident_date, patient.is_severe, visitDates);

  // 주기 요일 표시 (사고일 기준 주 시작~끝 요일)
  const DOW = ["일","월","화","수","목","금","토"];
  const weekStartDow = DOW[new Date(weekStart).getDay()];
  const weekEndDow = DOW[new Date(weekEnd).getDay()];
  const weekLabel = `${weekStartDow}~${weekEndDow}`;

  // 횟수 배지 색상: 0회=빨강, 진행중=파랑
  const countBadgeStyle = visitsThisWeek === 0
    ? { background:"var(--color-background-danger,#FCEBEB)", color:"var(--color-text-danger,#A32D2D)" }
    : { background:"var(--color-background-success,#EAF3DE)", color:"var(--color-text-success,#3B6D11)" };

  // 카드 테두리: 미내원 경고 > 독려 > 기본
  const borderColor = missedSlots >= 3 ? "#f5c6bd" : encourage.shouldEncourage ? "#b8d4f0" : "var(--border)";
  const bgColor     = missedSlots >= 3 ? "#fffaf9"  : encourage.shouldEncourage ? "#f0f7ff"  : "var(--surface)";

  return (
    <div style={{
      background: bgColor,
      borderRadius:"var(--r)", padding:"12px 16px", cursor:"pointer", transition:"all 0.2s",
      border:`1.5px solid ${borderColor}`,
    }} onClick={() => onNavigate(patient)}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
            {/* 미내원 경고 */}
            {missedSlots >= 3 && (
              <div style={{display:"flex", alignItems:"center", gap:6}}>
                <span className="badge badge-warn">⚠️ {missedSlots}회 연속 미내원</span>
                <button className="btn btn-xs btn-secondary" onClick={e => { e.stopPropagation(); onCallLog(patient); }}>📞 전화기록</button>
              </div>
            )}
            {/* 독려 알림 (미내원 경고가 없을 때만 표시) */}
            {!(missedSlots >= 3) && encourage.shouldEncourage && (
              <span className="badge badge-info">
                📢 이번 주 {encourage.remaining}회 가능 (남은 날 {encourage.daysLeft}일)
              </span>
            )}
            {/* 한약 배지 */}
            {isRefused ? (
              <span className="badge badge-muted">🚫 한약 거부</span>
            ) : herbStatus.canPrescribe ? (
              <span className="badge badge-info">💊 한약 처방 가능</span>
            ) : herbStatus.dDay !== null && herbStatus.dDay > 0 ? (
              <span className="badge badge-muted">💊 D-{herbStatus.dDay}</span>
            ) : null}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <span style={{ fontSize:16, fontWeight:700 }}>{patient.name}</span>
            <span style={{ fontSize:12, color:"var(--ink-muted)" }}>차트 #{patient.chart_number}</span>
            <span style={{ fontSize:11, color:"var(--ink-muted)" }}>|</span>
            <span style={{ fontSize:12, color:"var(--ink-muted)" }}>{weekLabel}</span>
            {/* 매일 구간 포함 전 구간 이번 주 내원 현황 표시 */}
            <span style={{ fontSize:12, fontWeight:700, padding:"1px 8px", borderRadius:20, ...countBadgeStyle }}>
              {visitsThisWeek}/{zone === "daily" ? 7 : maxPerWeek}
            </span>
          </div>
        </div>
        <button
          className={`visit-btn ${dateVisited?"visited":"not-visited"}`}
          onClick={e => { e.stopPropagation(); onToggle(patient, dateVisited); }}
        >
          {dateVisited ? "✅ 내원" : "○ 내원 확인"}
        </button>
      </div>
    </div>
  );
}

// =============================================
// DASHBOARD
// =============================================
export default function Dashboard({
  currentUser, onNavigate,
  onSelectDietPatient, onSelectTangPatient, onSelectTrafficPatient,
}) {
  const [loading, setLoading] = useState(true);
  const [happycalls, setHappycalls] = useState([]);
  const [trafficPatients, setTrafficPatients] = useState([]);
  const [trafficVisits, setTrafficVisits] = useState({});
  const [selectedDate, setSelectedDate] = useState(today());
  const [showCalendar, setShowCalendar] = useState(false);
  const [callModalPatient, setCallModalPatient] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);

    // 다이어트 처방
    const { data: dPrescriptions } = await supabase
      .from("prescriptions")
      .select("*, patients(id, name, chart_number), happycall_logs(*), prescription_updates(*)")
      .eq("is_completed", false);

    // 프리미엄 치료 방문 데이터
    const { data: allVisits } = await supabase
      .from("visits")
      .select("patient_id, visited_at, treatment_types")
      .order("visited_at", { ascending: false });

    // 탕약 처방
    const { data: tPrescriptions } = await supabase
      .from("tang_prescriptions")
      .select("*, tang_patients(id, name, chart_number), tang_happycall_logs(*), tang_prescription_updates(*)")
      .eq("is_completed", false);

    // 교통사고 환자 (종결 제외)
    const { data: trPatients } = await supabase.from("traffic_patients").select("*, herb_prescriptions(*)").eq("is_closed", false).order("created_at", { ascending: false });
    const { data: trVisits } = await supabase.from("traffic_visits").select("*").order("visit_date", { ascending: false });

    const visitMap = {};
    (trVisits || []).forEach(v => {
      if (!visitMap[v.patient_id]) visitMap[v.patient_id] = [];
      visitMap[v.patient_id].push(v);
    });

    // 해피콜 통합 목록
    const allCalls = [];

    (dPrescriptions || []).forEach(p => {
      const patient = p.patients;
      if (!patient) return;
      const latestUpdate = (p.prescription_updates || []).sort((a,b) => b.created_at.localeCompare(a.created_at))[0];
      const reservationDate = latestUpdate ? latestUpdate.new_reservation_happycall_date : p.reservation_happycall_date;
      const arrivalHC = (p.happycall_logs || []).find(h => h.call_type === "arrival");
      const reservationHC = (p.happycall_logs || []).find(h => h.call_type === "reservation");
      if (isTodayOrPast(p.arrival_happycall_date) && !arrivalHC?.is_done) {
        allCalls.push({ id:`diet-arrival-${p.id}`, patientType:"diet", patientId:patient.id, patientName:patient.name, chartNumber:patient.chart_number, prescriptionId:p.id, callKind:"도착", callDate:p.arrival_happycall_date, isDone:false, noAnswerCount:arrivalHC?.no_answer_count||0, memo:arrivalHC?.memo||null, hcRecord:arrivalHC||null, callType:"arrival", table:"happycall_logs" });
      }
      if (isTodayOrPast(reservationDate) && !reservationHC?.is_done) {
        allCalls.push({ id:`diet-reservation-${p.id}`, patientType:"diet", patientId:patient.id, patientName:patient.name, chartNumber:patient.chart_number, prescriptionId:p.id, callKind:"예약", callDate:reservationDate, isDone:false, noAnswerCount:reservationHC?.no_answer_count||0, memo:reservationHC?.memo||null, hcRecord:reservationHC||null, callType:"reservation", table:"happycall_logs" });
      }
    });

    (tPrescriptions || []).forEach(p => {
      const patient = p.tang_patients;
      if (!patient) return;
      const latestUpdate = (p.tang_prescription_updates || []).sort((a,b) => b.created_at.localeCompare(a.created_at))[0];
      const reservationDate = latestUpdate ? latestUpdate.new_reservation_happycall_date : p.reservation_happycall_date;
      const arrivalHC = (p.tang_happycall_logs || []).find(h => h.call_type === "arrival");
      const reservationHC = (p.tang_happycall_logs || []).find(h => h.call_type === "reservation");
      if (isTodayOrPast(p.arrival_happycall_date) && !arrivalHC?.is_done) {
        allCalls.push({ id:`tang-arrival-${p.id}`, patientType:"tang", patientId:patient.id, patientName:patient.name, chartNumber:patient.chart_number, prescriptionId:p.id, callKind:"도착", callDate:p.arrival_happycall_date, isDone:false, noAnswerCount:arrivalHC?.no_answer_count||0, memo:arrivalHC?.memo||null, hcRecord:arrivalHC||null, callType:"arrival", table:"tang_happycall_logs" });
      }
      if (isTodayOrPast(reservationDate) && !reservationHC?.is_done) {
        allCalls.push({ id:`tang-reservation-${p.id}`, patientType:"tang", patientId:patient.id, patientName:patient.name, chartNumber:patient.chart_number, prescriptionId:p.id, callKind:"예약", callDate:reservationDate, isDone:false, noAnswerCount:reservationHC?.no_answer_count||0, memo:reservationHC?.memo||null, hcRecord:reservationHC||null, callType:"reservation", table:"tang_happycall_logs" });
      }
    });

    // 프리미엄 관리 13일 초과 알림
    const premiumAlertSet = new Set();
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

    // 프리미엄 알림 해피콜 목록에 추가
    premiumAlertSet.forEach(pid => {
      const patient = (dPrescriptions || []).find(p => p.patients?.id === pid)?.patients;
      if (!patient) return;
      allCalls.push({
        id: `premium-${pid}`,
        patientType: "diet",
        patientId: pid,
        patientName: patient.name,
        chartNumber: patient.chart_number,
        prescriptionId: null,
        callKind: "프리미엄",
        callDate: today(),
        isDone: false,
        noAnswerCount: 0,
        memo: null,
        hcRecord: null,
        callType: null,
        table: null,
        isPremiumAlert: true,
      });
    });

    allCalls.sort((a, b) => a.callDate.localeCompare(b.callDate));
    setHappycalls(allCalls);
    setTrafficPatients(trPatients || []);
    setTrafficVisits(visitMap);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // 선택 날짜 기준 교통사고 치료 가능 환자 — 미내원 많은 순 정렬
  const trafficToday = trafficPatients
    .filter(p => {
      const visits = (trafficVisits[p.id] || []).map(v => v.visit_date);
      return canTreatToday(p.accident_date, p.is_severe, visits, selectedDate);
    })
    .sort((a, b) => {
      const aVisits = (trafficVisits[a.id] || []).map(v => v.visit_date);
      const bVisits = (trafficVisits[b.id] || []).map(v => v.visit_date);
      const aMissed = getConsecutiveMissedSlots(a.accident_date, a.is_severe, aVisits);
      const bMissed = getConsecutiveMissedSlots(b.accident_date, b.is_severe, bVisits);
      const aAlert = aMissed >= 3 ? 1 : 0;
      const bAlert = bMissed >= 3 ? 1 : 0;
      // 1순위: 미내원 알림(3회↑) 환자 먼저
      if (bAlert !== aAlert) return bAlert - aAlert;
      // 2순위: 알림 환자끼리는 미내원 많은 순
      if (bAlert && aAlert && bMissed !== aMissed) return bMissed - aMissed;
      // 3순위: 독려 대상 환자 (미내원 경고 없는 환자 중)
      const aEnc = getWeekEncouragementStatus(a.accident_date, a.is_severe, aVisits).shouldEncourage ? 1 : 0;
      const bEnc = getWeekEncouragementStatus(b.accident_date, b.is_severe, bVisits).shouldEncourage ? 1 : 0;
      if (bEnc !== aEnc) return bEnc - aEnc;
      // 4순위: 나머지는 차트번호 높은 순
      return Number(b.chart_number) - Number(a.chart_number);
    });

  // 해피콜 완료 토글
  const handleToggle = async (item) => {
    if (item.hcRecord) {
      await supabase.from(item.table).update({ is_done: !item.isDone }).eq("id", item.hcRecord.id);
    } else {
      await supabase.from(item.table).insert([{ prescription_id:item.prescriptionId, call_type:item.callType, is_done:true, no_answer_count:0 }]);
    }
    load();
  };

  // 미응답 기록
  const handleNoAnswer = async (item) => {
    const newCount = (item.noAnswerCount || 0) + 1;
    const memo = window.prompt(`미응답 ${newCount}회\n메모:`, item.memo || "");
    if (item.hcRecord) {
      await supabase.from(item.table).update({ no_answer_count:newCount, memo:memo!==null?memo:item.memo }).eq("id", item.hcRecord.id);
    } else {
      await supabase.from(item.table).insert([{ prescription_id:item.prescriptionId, call_type:item.callType, is_done:false, no_answer_count:1, memo:memo||null }]);
    }
    load();
  };

  const handleNavigateHappycall = (item) => {
    if (item.patientType === "diet") onSelectDietPatient(item.patientId, "prescription");
    else onSelectTangPatient(item.patientId, "prescription");
  };

  // 교통사고 내원 토글 — 선택된 날짜 기준
  const handleToggleVisit = async (patient, isVisited) => {
    if (isVisited) {
      await supabase.from("traffic_visits").delete().eq("patient_id", patient.id).eq("visit_date", selectedDate);
    } else {
      await supabase.from("traffic_visits").insert([{ patient_id:patient.id, visit_date:selectedDate }]);
    }
    load();
  };

  const pastCalls = happycalls.filter(h => h.callDate < today());
  const todayCalls = happycalls.filter(h => h.callDate === today());
  const isToday = selectedDate === today();

  if (loading) return <div className="empty">불러오는 중...</div>;

  return (
    <div>
      {/* 헤더 + 달력 */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div className="page-header" style={{ margin:0 }}>
          <div className="page-title">대시보드</div>
          <div className="page-sub">
            {new Date().toLocaleDateString("ko-KR", { year:"numeric", month:"long", day:"numeric", weekday:"long" })}
          </div>
        </div>

        {/* 날짜 선택 버튼 */}
        <div style={{ position:"relative" }}>
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            style={{
              display:"flex", alignItems:"center", gap:8,
              padding:"8px 16px", borderRadius:"var(--r-sm)",
              border:`1.5px solid ${isToday?"var(--border)":"var(--accent)"}`,
              background:isToday?"var(--surface)":"var(--accent-pale)",
              color:isToday?"var(--ink)":"var(--accent)",
              cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:600,
            }}
          >
            📅 {isToday ? "오늘" : formatDate(selectedDate)}
            {!isToday && <span style={{ fontSize:11, color:"var(--accent)" }}>← 날짜 선택됨</span>}
          </button>
          {showCalendar && (
            <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, zIndex:200 }}>
              <MiniCalendar selectedDate={selectedDate} onSelect={(d) => { setSelectedDate(d); setShowCalendar(false); }} />
            </div>
          )}
          {/* 달력 외부 클릭 닫기 */}
          {showCalendar && (
            <div style={{ position:"fixed", inset:0, zIndex:199 }} onClick={() => setShowCalendar(false)} />
          )}
        </div>
      </div>

      {happycalls.length === 0 && trafficToday.length === 0 && (
        <div className="card">
          <div className="empty">🎉 처리할 해피콜이 없습니다</div>
        </div>
      )}

      {/* 2컬럼 레이아웃 */}
      <div className="dashboard-cols" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, alignItems:"start" }}>

        {/* 좌측 — 교통사고 환자 */}
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, paddingBottom:8, borderBottom:"2px solid var(--border)" }}>
            <span style={{ fontSize:18 }}>🚗</span>
            <span style={{ fontSize:16, fontWeight:700 }}>교통사고 환자</span>
            <span style={{ fontSize:12, color:"var(--ink-muted)" }}>
              {isToday ? "오늘" : formatDate(selectedDate)} 치료 가능 {trafficToday.length}명
            </span>
          </div>
          {!isToday && (
            <div style={{ fontSize:12, color:"var(--accent)", fontWeight:600, marginBottom:10, padding:"6px 10px", background:"var(--accent-pale)", borderRadius:6 }}>
              📅 {formatDate(selectedDate)} 기준으로 표시 중
            </div>
          )}
          {trafficToday.length === 0 ? (
            <div style={{ fontSize:13, color:"var(--ink-muted)", padding:"12px 0" }}>
              {isToday ? "오늘" : formatDate(selectedDate)} 치료 가능한 교통사고 환자가 없습니다
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {trafficToday.map(p => (
                <TrafficTodayCard
                  key={p.id} patient={p}
                  visits={trafficVisits[p.id] || []}
                  targetDate={selectedDate}
                  onToggle={handleToggleVisit}
                  onNavigate={() => onSelectTrafficPatient(p.id)}
                  onCallLog={setCallModalPatient}
                />
              ))}
            </div>
          )}
        </div>

        {/* 우측 — 해피콜 */}
        <div>
          {pastCalls.length > 0 && (
            <div style={{ marginBottom:24 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, paddingBottom:8, borderBottom:"2px solid var(--border)" }}>
                <span style={{ fontSize:18 }}>⚠️</span>
                <span style={{ fontSize:16, fontWeight:700, color:"var(--warn)" }}>기한 지난 해피콜</span>
                <span style={{ fontSize:12, color:"var(--ink-muted)" }}>{pastCalls.length}건</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {pastCalls.map(item => (
                  <HappycallCard key={item.id} item={item} onToggle={handleToggle} onNoAnswer={handleNoAnswer} onNavigate={handleNavigateHappycall} />
                ))}
              </div>
            </div>
          )}
          {todayCalls.length > 0 && (
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, paddingBottom:8, borderBottom:"2px solid var(--border)" }}>
                <span style={{ fontSize:18 }}>📞</span>
                <span style={{ fontSize:16, fontWeight:700 }}>오늘 해피콜</span>
                <span style={{ fontSize:12, color:"var(--ink-muted)" }}>{todayCalls.length}건</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {todayCalls.map(item => (
                  <HappycallCard key={item.id} item={item} onToggle={handleToggle} onNoAnswer={handleNoAnswer} onNavigate={handleNavigateHappycall} />
                ))}
              </div>
            </div>
          )}
          {happycalls.length === 0 && (
            <div style={{ fontSize:13, color:"var(--ink-muted)", padding:"12px 0" }}>오늘 처리할 해피콜이 없습니다</div>
          )}
        </div>

      </div>
      {callModalPatient && (
        <MissedCallModal
          patient={callModalPatient}
          currentUser={currentUser}
          onClose={() => setCallModalPatient(null)}
        />
      )}
    </div>
  );
}
