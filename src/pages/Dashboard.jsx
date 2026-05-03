import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  today, formatDate, isTodayOrPast, diffDays,
  canTreatToday, getConsecutiveMissedSlots, getHerbStatus,
} from "../lib/dateUtils";

// =============================================
// 해피콜 카드
// =============================================
function HappycallCard({ item, onToggle, onNoAnswer, onNavigate }) {
  const isPast = item.callDate < today();
  const isToday = item.callDate === today();
  const daysDiff = diffDays(item.callDate, today()); // 양수면 지남

  const typeColor = item.patientType === "diet" ? "var(--accent)" : "var(--teal)";
  const typeBg   = item.patientType === "diet" ? "var(--accent-pale)" : "var(--teal-pale)";
  const typeLabel = item.patientType === "diet" ? "👥 다이어트" : "🌿 탕약";

  return (
    <div
      style={{
        borderRadius: "var(--r)", padding: "14px 18px",
        border: `1.5px solid ${isPast ? "#f5c6bd" : isToday ? "#b8d4f0" : "var(--border)"}`,
        background: isPast ? "#fffaf9" : isToday ? "#f0f7ff" : "var(--surface)",
        cursor: "pointer", transition: "all 0.2s",
      }}
      onClick={() => onNavigate(item)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ background: typeBg, color: typeColor, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
              {typeLabel}
            </span>
            <span style={{
              background: item.callKind === "도착" ? "#fff3e0" : "#fce4ec",
              color: item.callKind === "도착" ? "#e07000" : "#c2185b",
              fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
            }}>
              {item.callKind === "도착" ? "📦 도착 해피콜" : "📅 예약 해피콜"}
            </span>
            {isPast && <span className="badge badge-warn">⚠️ {daysDiff}일 지남</span>}
            {isToday && <span className="badge badge-info">오늘</span>}
            {item.noAnswerCount > 0 && <span className="badge badge-warn">📵 미응답 {item.noAnswerCount}회</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 17, fontWeight: 700 }}>{item.patientName}</span>
            <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>차트 #{item.chartNumber}</span>
            <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{formatDate(item.callDate)}</span>
          </div>
          {item.memo && <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 4 }}>💬 {item.memo}</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button className={`btn btn-sm ${item.isDone ? "btn-secondary" : "btn-primary"}`} onClick={() => onToggle(item)}>
            {item.isDone ? "✓ 완료" : "완료 처리"}
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
function TrafficTodayCard({ patient, visits, onToggle, onNavigate }) {
  const visitDates = visits.map(v => v.visit_date);
  const todayVisited = visitDates.includes(today());
  const missedSlots = getConsecutiveMissedSlots(patient.accident_date, patient.is_severe, visitDates);
  const herbStatus = getHerbStatus(patient.herb_prescribed_at);

  return (
    <div
      style={{
        background: missedSlots >= 3 ? "#fffaf9" : "var(--surface)",
        borderRadius: "var(--r)", padding: "12px 16px",
        border: `1.5px solid ${missedSlots >= 3 ? "#f5c6bd" : "var(--border)"}`,
        cursor: "pointer", transition: "all 0.2s",
      }}
      onClick={() => onNavigate(patient)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            {missedSlots >= 3 && <span className="badge badge-warn">⚠️ {missedSlots}회 연속 미내원</span>}
            {herbStatus.canPrescribe && <span className="badge badge-info">💊 한약 처방 가능</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{patient.name}</span>
            <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>차트 #{patient.chart_number}</span>
          </div>
        </div>
        <button
          className={`visit-btn ${todayVisited ? "visited" : "not-visited"}`}
          onClick={e => { e.stopPropagation(); onToggle(patient, todayVisited); }}
        >
          {todayVisited ? "✅ 내원" : "○ 내원 확인"}
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
  const [trafficToday, setTrafficToday] = useState([]);
  const [trafficVisits, setTrafficVisits] = useState({});

  const load = useCallback(async () => {
    setLoading(true);

    // 다이어트 처방
    const { data: dPrescriptions } = await supabase
      .from("prescriptions")
      .select("*, patients(id, name, chart_number), happycall_logs(*), prescription_updates(*)")
      .eq("is_completed", false);

    // 탕약 처방
    const { data: tPrescriptions } = await supabase
      .from("tang_prescriptions")
      .select("*, tang_patients(id, name, chart_number), tang_happycall_logs(*), tang_prescription_updates(*)")
      .eq("is_completed", false);

    // 교통사고 환자
    const { data: trPatients } = await supabase.from("traffic_patients").select("*").order("created_at", { ascending: false });
    const { data: trVisits } = await supabase.from("traffic_visits").select("*").order("visit_date", { ascending: false });

    const visitMap = {};
    (trVisits || []).forEach(v => {
      if (!visitMap[v.patient_id]) visitMap[v.patient_id] = [];
      visitMap[v.patient_id].push(v);
    });

    // 해피콜 통합 목록
    const allCalls = [];

    // 다이어트 해피콜
    (dPrescriptions || []).forEach(p => {
      const patient = p.patients;
      if (!patient) return;
      const latestUpdate = (p.prescription_updates || []).sort((a,b) => b.created_at.localeCompare(a.created_at))[0];
      const reservationDate = latestUpdate ? latestUpdate.new_reservation_happycall_date : p.reservation_happycall_date;
      const arrivalHC = (p.happycall_logs || []).find(h => h.call_type === "arrival");
      const reservationHC = (p.happycall_logs || []).find(h => h.call_type === "reservation");

      if (isTodayOrPast(p.arrival_happycall_date) && !arrivalHC?.is_done) {
        allCalls.push({
          id: `diet-arrival-${p.id}`,
          patientType: "diet", patientId: patient.id,
          patientName: patient.name, chartNumber: patient.chart_number,
          prescriptionId: p.id, callKind: "도착",
          callDate: p.arrival_happycall_date, isDone: false,
          noAnswerCount: arrivalHC?.no_answer_count || 0,
          memo: arrivalHC?.memo || null, hcRecord: arrivalHC || null,
          callType: "arrival", table: "happycall_logs",
        });
      }
      if (isTodayOrPast(reservationDate) && !reservationHC?.is_done) {
        allCalls.push({
          id: `diet-reservation-${p.id}`,
          patientType: "diet", patientId: patient.id,
          patientName: patient.name, chartNumber: patient.chart_number,
          prescriptionId: p.id, callKind: "예약",
          callDate: reservationDate, isDone: false,
          noAnswerCount: reservationHC?.no_answer_count || 0,
          memo: reservationHC?.memo || null, hcRecord: reservationHC || null,
          callType: "reservation", table: "happycall_logs",
        });
      }
    });

    // 탕약 해피콜
    (tPrescriptions || []).forEach(p => {
      const patient = p.tang_patients;
      if (!patient) return;
      const latestUpdate = (p.tang_prescription_updates || []).sort((a,b) => b.created_at.localeCompare(a.created_at))[0];
      const reservationDate = latestUpdate ? latestUpdate.new_reservation_happycall_date : p.reservation_happycall_date;
      const arrivalHC = (p.tang_happycall_logs || []).find(h => h.call_type === "arrival");
      const reservationHC = (p.tang_happycall_logs || []).find(h => h.call_type === "reservation");

      if (isTodayOrPast(p.arrival_happycall_date) && !arrivalHC?.is_done) {
        allCalls.push({
          id: `tang-arrival-${p.id}`,
          patientType: "tang", patientId: patient.id,
          patientName: patient.name, chartNumber: patient.chart_number,
          prescriptionId: p.id, callKind: "도착",
          callDate: p.arrival_happycall_date, isDone: false,
          noAnswerCount: arrivalHC?.no_answer_count || 0,
          memo: arrivalHC?.memo || null, hcRecord: arrivalHC || null,
          callType: "arrival", table: "tang_happycall_logs",
        });
      }
      if (isTodayOrPast(reservationDate) && !reservationHC?.is_done) {
        allCalls.push({
          id: `tang-reservation-${p.id}`,
          patientType: "tang", patientId: patient.id,
          patientName: patient.name, chartNumber: patient.chart_number,
          prescriptionId: p.id, callKind: "예약",
          callDate: reservationDate, isDone: false,
          noAnswerCount: reservationHC?.no_answer_count || 0,
          memo: reservationHC?.memo || null, hcRecord: reservationHC || null,
          callType: "reservation", table: "tang_happycall_logs",
        });
      }
    });

    // 날짜 오래된 순 → 오늘 순으로 정렬
    allCalls.sort((a, b) => a.callDate.localeCompare(b.callDate));
    setHappycalls(allCalls);

    // 교통사고 오늘 치료 가능
    const todayTraffic = (trPatients || []).filter(p => {
      const visits = (visitMap[p.id] || []).map(v => v.visit_date);
      return canTreatToday(p.accident_date, p.is_severe, visits);
    });
    setTrafficToday(todayTraffic);
    setTrafficVisits(visitMap);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // 해피콜 완료 토글
  const handleToggle = async (item) => {
    if (item.hcRecord) {
      await supabase.from(item.table).update({ is_done: !item.isDone }).eq("id", item.hcRecord.id);
    } else {
      await supabase.from(item.table).insert([{ prescription_id: item.prescriptionId, call_type: item.callType, is_done: true, no_answer_count: 0 }]);
    }
    load();
  };

  // 미응답 기록
  const handleNoAnswer = async (item) => {
    const newCount = (item.noAnswerCount || 0) + 1;
    const memo = window.prompt(`미응답 ${newCount}회\n메모:`, item.memo || "");
    if (item.hcRecord) {
      await supabase.from(item.table).update({ no_answer_count: newCount, memo: memo !== null ? memo : item.memo }).eq("id", item.hcRecord.id);
    } else {
      await supabase.from(item.table).insert([{ prescription_id: item.prescriptionId, call_type: item.callType, is_done: false, no_answer_count: 1, memo: memo || null }]);
    }
    load();
  };

  // 해피콜 카드 클릭 → 해당 환자 상세로 바로 이동
  const handleNavigateHappycall = (item) => {
    if (item.patientType === "diet") {
      onSelectDietPatient(item.patientId, "prescription");
    } else {
      onSelectTangPatient(item.patientId, "prescription");
    }
  };

  // 교통사고 내원 토글
  const handleToggleVisit = async (patient, isVisited) => {
    if (isVisited) {
      await supabase.from("traffic_visits").delete().eq("patient_id", patient.id).eq("visit_date", today());
    } else {
      await supabase.from("traffic_visits").insert([{ patient_id: patient.id, visit_date: today() }]);
    }
    load();
  };

  const pastCalls = happycalls.filter(h => h.callDate < today());
  const todayCalls = happycalls.filter(h => h.callDate === today());

  if (loading) return <div className="empty">불러오는 중...</div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">대시보드</div>
        <div className="page-sub">
          {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
        </div>
      </div>

      {happycalls.length === 0 && trafficToday.length === 0 && (
        <div className="card">
          <div className="empty">🎉 오늘 처리할 해피콜이 없습니다</div>
        </div>
      )}

      {/* 2컬럼 레이아웃 */}
      <div className="dashboard-cols" style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        alignItems: "start",
      }}>

        {/* 좌측 — 교통사고 환자 */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid var(--border)" }}>
            <span style={{ fontSize: 18 }}>🚗</span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>교통사고 환자</span>
            <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>
              {trafficToday.length > 0 ? `오늘 치료 가능 ${trafficToday.length}명` : "오늘 치료 가능 없음"}
            </span>
          </div>
          {trafficToday.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--ink-muted)", padding: "12px 0" }}>
              오늘 치료 가능한 교통사고 환자가 없습니다
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {trafficToday.map(p => (
                <TrafficTodayCard
                  key={p.id} patient={p}
                  visits={trafficVisits[p.id] || []}
                  onToggle={handleToggleVisit}
                  onNavigate={() => onSelectTrafficPatient(p.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* 우측 — 해피콜 (기한 지난 것 → 오늘) */}
        <div>
          {/* 기한 지난 해피콜 */}
          {pastCalls.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid var(--border)" }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--warn)" }}>기한 지난 해피콜</span>
                <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{pastCalls.length}건</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pastCalls.map(item => (
                  <HappycallCard key={item.id} item={item} onToggle={handleToggle} onNoAnswer={handleNoAnswer} onNavigate={handleNavigateHappycall} />
                ))}
              </div>
            </div>
          )}

          {/* 오늘 해피콜 */}
          {todayCalls.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid var(--border)" }}>
                <span style={{ fontSize: 18 }}>📞</span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>오늘 해피콜</span>
                <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{todayCalls.length}건</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {todayCalls.map(item => (
                  <HappycallCard key={item.id} item={item} onToggle={handleToggle} onNoAnswer={handleNoAnswer} onNavigate={handleNavigateHappycall} />
                ))}
              </div>
            </div>
          )}

          {/* 해피콜 없음 */}
          {happycalls.length === 0 && (
            <div style={{ fontSize: 13, color: "var(--ink-muted)", padding: "12px 0" }}>
              오늘 처리할 해피콜이 없습니다
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
