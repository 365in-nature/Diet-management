import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  today, isTodayOrPast, formatDate,
  canTreatToday, getConsecutiveMissedSlots, getHerbStatus,
  calcRemainingMonths,
} from "../lib/dateUtils";

// =============================================
// 환자 타입 배지
// =============================================
function TypeBadge({ type }) {
  if (type === "diet")    return <span className="badge badge-success">👥 다이어트</span>;
  if (type === "tang")    return <span className="badge badge-teal">🌿 탕약</span>;
  if (type === "traffic") return <span className="badge badge-traffic">🚗 교통사고</span>;
  return null;
}

// =============================================
// 다이어트 환자 카드
// =============================================
function DietCard({ patient, alerts, onSelect }) {
  const pkg = (patient.packages || []).find(pk => pk.is_active);
  const goal = patient.goals?.[0];
  const measurements = patient.measurements || [];
  const latestWeight = [...measurements].sort((a,b) => b.measured_at.localeCompare(a.measured_at))[0]?.weight;
  const hasAlert = (alerts || []).length > 0;

  return (
    <div className={`patient-card ${hasAlert ? "alert" : ""}`} onClick={() => onSelect("diet", patient)}>
      <div className="patient-card-header">
        <div>
          <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:4}}>
            <TypeBadge type="diet" />
          </div>
          <div className="patient-name">{patient.name}</div>
          <div className="patient-chart">차트 #{patient.chart_number}</div>
        </div>
        <div style={{display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end"}}>
          {(alerts || []).map((a, i) => (
            <span key={i} className={`badge ${a.kind === "도착" ? "badge-info" : "badge-warn"}`}>
              {a.kind === "도착" ? "📦" : "📅"} {a.kind} 해피콜
            </span>
          ))}
        </div>
      </div>

      {goal && latestWeight && (
        <div>
          <div className="progress-label">
            <span>목표 {goal.target_weight}kg</span>
            <span>현재 {latestWeight}kg</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{width: `${Math.min(100, Math.max(0, Math.round((goal.start_weight - latestWeight) / (goal.start_weight - goal.target_weight) * 100)))}%`}} />
          </div>
        </div>
      )}

      {pkg && (
        <div style={{marginTop:8}}>
          <span className="badge badge-gold">
            {pkg.package_months}개월 패키지 · 잔여 약 {patient._remainingMonths ?? pkg.remaining_months}개월
          </span>
        </div>
      )}
    </div>
  );
}

// =============================================
// 탕약 환자 카드
// =============================================
function TangCard({ patient, alerts, onSelect }) {
  const pkg = (patient.tang_packages || []).find(pk => pk.is_active);
  const hasAlert = (alerts || []).length > 0;

  return (
    <div className={`patient-card ${hasAlert ? "alert" : ""}`} onClick={() => onSelect("tang", patient)}>
      <div className="patient-card-header">
        <div>
          <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:4}}>
            <TypeBadge type="tang" />
          </div>
          <div className="patient-name">{patient.name}</div>
          <div className="patient-chart">차트 #{patient.chart_number}</div>
        </div>
        <div style={{display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end"}}>
          {(alerts || []).map((a, i) => (
            <span key={i} className={`badge ${a.kind === "도착" ? "badge-gold" : "badge-warn"}`}>
              {a.kind === "도착" ? "📦" : "📅"} {a.kind} 해피콜
            </span>
          ))}
        </div>
      </div>

      {pkg && (
        <div style={{marginTop:8}}>
          <span className="badge badge-teal">
            {pkg.package_months}개월 패키지 · 잔여 약 {patient._remainingMonths ?? pkg.remaining_months}개월
          </span>
        </div>
      )}
    </div>
  );
}

// =============================================
// 교통사고 환자 카드
// =============================================
function TrafficCard({ patient, visits, onSelect, onToggleVisit }) {
  const visitDates = (visits || []).map(v => v.visit_date);
  const canTreat = canTreatToday(patient.accident_date, patient.is_severe, visitDates);
  const missedSlots = getConsecutiveMissedSlots(patient.accident_date, patient.is_severe, visitDates);
  const hasAlert = missedSlots >= 3;
  const todayVisit = visitDates.includes(today());
  const herbStatus = getHerbStatus(patient.herb_prescribed_at);

  return (
    <div className={`patient-card ${hasAlert ? "alert" : ""}`} onClick={() => onSelect("traffic", patient)}>
      <div className="patient-card-header">
        <div>
          <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:4}}>
            <TypeBadge type="traffic" />
            {patient.is_severe && (
              <span className="badge badge-traffic">🦴 중증</span>
            )}
          </div>
          <div className="patient-name">{patient.name}</div>
          <div className="patient-chart">차트 #{patient.chart_number}</div>
        </div>
        <div style={{display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end"}}>
          {hasAlert && (
            <span className="badge badge-warn">⚠️ 3회 연속 미내원</span>
          )}
          {herbStatus.canPrescribe && (
            <span className="badge badge-info">💊 한약 처방 가능</span>
          )}
          {!herbStatus.canPrescribe && herbStatus.dDay !== null && herbStatus.dDay > 0 && (
            <span className="badge badge-muted">💊 한약 D-{herbStatus.dDay}</span>
          )}
        </div>
      </div>

      <div style={{fontSize:12, color:"var(--ink-muted)", marginBottom:10}}>
        사고일 {formatDate(patient.accident_date)}
      </div>

      {/* 내원 버튼 — 클릭 시 상세 이동 막기 */}
      {canTreat && (
        <button
          className={`visit-btn ${todayVisit ? "visited" : "not-visited"}`}
          onClick={e => { e.stopPropagation(); onToggleVisit(patient, todayVisit); }}
        >
          {todayVisit ? "✅ 내원 확인됨 (취소하려면 클릭)" : "내원 확인"}
        </button>
      )}
      {!canTreat && (
        <div style={{fontSize:12, color:"var(--ink-muted)", padding:"6px 0"}}>
          오늘 치료 횟수 초과
        </div>
      )}
    </div>
  );
}

// =============================================
// 섹션 헤더
// =============================================
function SectionDivider({ icon, label, count }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      margin:"28px 0 14px",
      paddingBottom:10,
      borderBottom:"2px solid var(--border)",
    }}>
      <span style={{fontSize:18}}>{icon}</span>
      <span style={{fontSize:16, fontWeight:700}}>{label}</span>
      <span style={{fontSize:12, color:"var(--ink-muted)", marginLeft:2}}>{count}명</span>
    </div>
  );
}

// =============================================
// DASHBOARD
// =============================================
export default function Dashboard({ currentUser, onNavigate }) {
  const [loading, setLoading] = useState(true);

  // 다이어트
  const [dietPatients, setDietPatients] = useState([]);
  const [dietAlerts, setDietAlerts] = useState({});

  // 탕약
  const [tangPatients, setTangPatients] = useState([]);
  const [tangAlerts, setTangAlerts] = useState({});

  // 교통사고
  const [trafficPatients, setTrafficPatients] = useState([]);
  const [trafficVisits, setTrafficVisits] = useState({});

  // 선택된 환자 (상세 이동용)
  const [selectedType, setSelectedType] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);

    // ── 다이어트 환자 ──
    const { data: dPatients } = await supabase
      .from("patients")
      .select("*, goals(*), packages(*), measurements(*)")
      .order("created_at", { ascending: false });

    const { data: dPrescriptions } = await supabase
      .from("prescriptions")
      .select("*, happycall_logs(*), prescription_updates(*)")
      .eq("is_completed", false);

    const dAlertMap = {};
    (dPrescriptions || []).forEach(p => {
      const latestUpdate = (p.prescription_updates || []).sort((a,b) => b.created_at.localeCompare(a.created_at))[0];
      const reservationDate = latestUpdate ? latestUpdate.new_reservation_happycall_date : p.reservation_happycall_date;
      const arrivalDone = (p.happycall_logs || []).find(h => h.call_type === "arrival" && h.is_done);
      const reservationDone = (p.happycall_logs || []).find(h => h.call_type === "reservation" && h.is_done);
      if (!dAlertMap[p.patient_id]) dAlertMap[p.patient_id] = [];
      if (isTodayOrPast(p.arrival_happycall_date) && !arrivalDone)
        dAlertMap[p.patient_id].push({ kind: "도착" });
      if (isTodayOrPast(reservationDate) && !reservationDone)
        dAlertMap[p.patient_id].push({ kind: "예약" });
    });

    // 다이어트 잔여 개월 계산
    const dRxByPatient = {};
    (dPrescriptions || []).forEach(rx => {
      if (!dRxByPatient[rx.patient_id]) dRxByPatient[rx.patient_id] = [];
      dRxByPatient[rx.patient_id].push(rx);
    });

    const dSorted = [...(dPatients || [])].sort((a, b) => {
      const aHas = (dAlertMap[a.id] || []).length > 0 ? 0 : 1;
      const bHas = (dAlertMap[b.id] || []).length > 0 ? 0 : 1;
      return aHas - bHas;
    }).map(p => {
      const pkgs = (p.packages || []).filter(pk => pk.is_active);
      const rxs = dRxByPatient[p.id] || [];
      const _remainingMonths = calcRemainingMonths(pkgs, rxs);
      return { ...p, _remainingMonths };
    });

    setDietPatients(dSorted);
    setDietAlerts(dAlertMap);

    // ── 탕약 환자 ──
    const { data: tPatients } = await supabase
      .from("tang_patients")
      .select("*, tang_packages(*)")
      .order("created_at", { ascending: false });

    const { data: tPrescriptions } = await supabase
      .from("tang_prescriptions")
      .select("*, tang_happycall_logs(*), tang_prescription_updates(*)")
      .eq("is_completed", false);

    const tAlertMap = {};
    (tPrescriptions || []).forEach(p => {
      const latestUpdate = (p.tang_prescription_updates || []).sort((a,b) => b.created_at.localeCompare(a.created_at))[0];
      const reservationDate = latestUpdate ? latestUpdate.new_reservation_happycall_date : p.reservation_happycall_date;
      const arrivalDone = (p.tang_happycall_logs || []).find(h => h.call_type === "arrival" && h.is_done);
      const reservationDone = (p.tang_happycall_logs || []).find(h => h.call_type === "reservation" && h.is_done);
      if (!tAlertMap[p.patient_id]) tAlertMap[p.patient_id] = [];
      if (isTodayOrPast(p.arrival_happycall_date) && !arrivalDone)
        tAlertMap[p.patient_id].push({ kind: "도착" });
      if (isTodayOrPast(reservationDate) && !reservationDone)
        tAlertMap[p.patient_id].push({ kind: "예약" });
    });

    const tRxByPatient = {};
    (tPrescriptions || []).forEach(rx => {
      if (!tRxByPatient[rx.patient_id]) tRxByPatient[rx.patient_id] = [];
      tRxByPatient[rx.patient_id].push(rx);
    });

    const tSorted = [...(tPatients || [])].sort((a, b) => {
      const aHas = (tAlertMap[a.id] || []).length > 0 ? 0 : 1;
      const bHas = (tAlertMap[b.id] || []).length > 0 ? 0 : 1;
      return aHas - bHas;
    }).map(p => {
      const pkgs = (p.tang_packages || []).filter(pk => pk.is_active);
      const rxs = tRxByPatient[p.id] || [];
      const _remainingMonths = calcRemainingMonths(pkgs, rxs);
      return { ...p, _remainingMonths };
    });

    setTangPatients(tSorted);
    setTangAlerts(tAlertMap);

    // ── 교통사고 환자 ──
    const { data: trPatients } = await supabase
      .from("traffic_patients")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: trVisits } = await supabase
      .from("traffic_visits")
      .select("*")
      .order("visit_date", { ascending: false });

    const visitMap = {};
    (trVisits || []).forEach(v => {
      if (!visitMap[v.patient_id]) visitMap[v.patient_id] = [];
      visitMap[v.patient_id].push(v);
    });

    // 교통사고: 오늘 치료 가능한 환자 먼저, 알림 있는 환자 최상단
    const trSorted = [...(trPatients || [])].sort((a, b) => {
      const aVisits = (visitMap[a.id] || []).map(v => v.visit_date);
      const bVisits = (visitMap[b.id] || []).map(v => v.visit_date);
      const aMissed = getConsecutiveMissedSlots(a.accident_date, a.is_severe, aVisits);
      const bMissed = getConsecutiveMissedSlots(b.accident_date, b.is_severe, bVisits);
      const aCanTreat = canTreatToday(a.accident_date, a.is_severe, aVisits) ? 0 : 1;
      const bCanTreat = canTreatToday(b.accident_date, b.is_severe, bVisits) ? 0 : 1;
      const aScore = aMissed >= 3 ? 0 : aCanTreat;
      const bScore = bMissed >= 3 ? 0 : bCanTreat;
      return aScore - bScore;
    });

    setTrafficPatients(trSorted);
    setTrafficVisits(visitMap);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // 내원 토글
  const handleToggleVisit = async (patient, isVisited) => {
    if (isVisited) {
      // 취소
      await supabase
        .from("traffic_visits")
        .delete()
        .eq("patient_id", patient.id)
        .eq("visit_date", today());
    } else {
      // 내원 확인
      await supabase
        .from("traffic_visits")
        .insert([{ patient_id: patient.id, visit_date: today() }]);
    }
    loadAll();
  };

  // 환자 선택 → 해당 페이지로 이동
  const handleSelectPatient = (type, patient) => {
    setSelectedType(type);
    setSelectedPatient(patient);
  };

  // 오늘 알림 요약
  const todayDietAlerts = Object.values(dietAlerts).flat().length;
  const todayTangAlerts = Object.values(tangAlerts).flat().length;
  const todayTrafficCanTreat = trafficPatients.filter(p => {
    const visits = (trafficVisits[p.id] || []).map(v => v.visit_date);
    return canTreatToday(p.accident_date, p.is_severe, visits);
  }).length;
  const todayMissed = trafficPatients.filter(p => {
    const visits = (trafficVisits[p.id] || []).map(v => v.visit_date);
    return getConsecutiveMissedSlots(p.accident_date, p.is_severe, visits) >= 3;
  }).length;

  if (loading) return <div className="empty">불러오는 중...</div>;

  // 환자 상세 선택된 경우 → 해당 페이지로 이동 안내
  if (selectedPatient) {
    const pageMap = { diet: "diet", tang: "tang", traffic: "traffic" };
    onNavigate(pageMap[selectedType]);
    setSelectedPatient(null);
    setSelectedType(null);
    return null;
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">대시보드</div>
        <div className="page-sub">{new Date().toLocaleDateString("ko-KR", { year:"numeric", month:"long", day:"numeric", weekday:"long" })}</div>
      </div>

      {/* ── 오늘 알림 요약 배너 ── */}
      {(todayDietAlerts > 0 || todayTangAlerts > 0 || todayMissed > 0) && (
        <div style={{display:"flex", flexWrap:"wrap", gap:8, marginBottom:20}}>
          {todayDietAlerts > 0 && (
            <div className="alert-banner urgent">
              👥 다이어트 해피콜 {todayDietAlerts}건 대기 중
            </div>
          )}
          {todayTangAlerts > 0 && (
            <div className="alert-banner urgent">
              🌿 탕약 해피콜 {todayTangAlerts}건 대기 중
            </div>
          )}
          {todayMissed > 0 && (
            <div className="alert-banner">
              🚗 교통사고 환자 {todayMissed}명 3회 연속 미내원
            </div>
          )}
        </div>
      )}

      {/* ── 오늘 교통사고 내원 가능 환자 ── */}
      {todayTrafficCanTreat > 0 && (
        <div className="card" style={{marginBottom:20}}>
          <div className="section-header">
            <div className="section-title">🚗 오늘 치료 가능한 교통사고 환자</div>
            <span className="badge badge-traffic">{todayTrafficCanTreat}명</span>
          </div>
          <div style={{display:"flex", flexWrap:"wrap", gap:8}}>
            {trafficPatients
              .filter(p => {
                const visits = (trafficVisits[p.id] || []).map(v => v.visit_date);
                return canTreatToday(p.accident_date, p.is_severe, visits);
              })
              .map(p => {
                const visits = trafficVisits[p.id] || [];
                const visitDates = visits.map(v => v.visit_date);
                const todayVisited = visitDates.includes(today());
                return (
                  <button
                    key={p.id}
                    className={`visit-btn ${todayVisited ? "visited" : "not-visited"}`}
                    onClick={() => handleToggleVisit(p, todayVisited)}
                  >
                    {todayVisited ? "✅" : "○"} {p.chart_number} {p.name}
                  </button>
                );
              })
            }
          </div>
        </div>
      )}

      {/* ── 다이어트 환자 섹션 ── */}
      <SectionDivider icon="👥" label="다이어트 환자" count={dietPatients.length} />
      {dietPatients.length === 0 ? (
        <div className="empty">등록된 다이어트 환자가 없습니다</div>
      ) : (
        <div className="patient-grid">
          {dietPatients.map(p => (
            <DietCard
              key={p.id}
              patient={p}
              alerts={dietAlerts[p.id]}
              onSelect={handleSelectPatient}
            />
          ))}
        </div>
      )}

      {/* ── 탕약 환자 섹션 ── */}
      <SectionDivider icon="🌿" label="탕약 환자" count={tangPatients.length} />
      {tangPatients.length === 0 ? (
        <div className="empty">등록된 탕약 환자가 없습니다</div>
      ) : (
        <div className="patient-grid">
          {tangPatients.map(p => (
            <TangCard
              key={p.id}
              patient={p}
              alerts={tangAlerts[p.id]}
              onSelect={handleSelectPatient}
            />
          ))}
        </div>
      )}

      {/* ── 교통사고 환자 섹션 ── */}
      <SectionDivider icon="🚗" label="교통사고 환자" count={trafficPatients.length} />
      {trafficPatients.length === 0 ? (
        <div className="empty">등록된 교통사고 환자가 없습니다</div>
      ) : (
        <div className="patient-grid">
          {trafficPatients.map(p => (
            <TrafficCard
              key={p.id}
              patient={p}
              visits={trafficVisits[p.id]}
              onSelect={handleSelectPatient}
              onToggleVisit={handleToggleVisit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
