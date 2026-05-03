import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  today, formatDate, isTodayOrPast,
  addDays, addBusinessDays, subtractBusinessDays,
  calcTotalEndDate,
} from "../lib/dateUtils";

// =============================================
// BMI 유틸
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
  if (b < 23)   return { label: "정상",   color: "var(--accent)" };
  if (b < 25)   return { label: "과체중", color: "var(--gold)" };
  return { label: "비만", color: "var(--warn)" };
}

// =============================================
// 목표 체중 예측 그래프
// =============================================
function WeightProjectionChart({ currentWeight, targetWeight, height }) {
  if (!currentWeight || !targetWeight || !height) return null;
  const cw = parseFloat(currentWeight);
  const tw = parseFloat(targetWeight);
  const h = parseFloat(height) / 100;
  if (cw <= tw) return null;

  const getRates = (w) => {
    const bmi = w / (h * h);
    if (bmi >= 25) return { min: 0.08, max: 0.10, cat: "비만" };
    if (bmi >= 23) return { min: 0.06, max: 0.08, cat: "과체중" };
    return { min: 0.04, max: 0.06, cat: "정상체중" };
  };

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
  const { min: minRate, max: maxRate } = getRates(cw);
  const display = rows.slice(0, Math.min(rows.length, 13));
  const allVals = display.flatMap(r => [r.min, r.max]);
  const minV = Math.min(...allVals) - 1;
  const maxV = Math.max(...allVals) + 1;
  const W = 500, H = 160, PX = 40, PY = 20;
  const px = (i) => PX + (i / (display.length - 1)) * (W - PX * 2);
  const py = (v) => PY + ((maxV - v) / (maxV - minV)) * (H - PY * 2);
  const pathMax = display.map((r, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${py(r.max)}`).join(" ");
  const pathMin = display.map((r, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${py(r.min)}`).join(" ");
  const areaPath = pathMin + " " + [...display].reverse().map((r, i, arr) =>
    `L ${px(arr.length - 1 - i)} ${py(r.max)}`).join(" ") + " Z";
  const targetY = py(tw);

  return (
    <div style={{marginTop:16, padding:16, background:"var(--surface2)", borderRadius:10, border:"1px solid var(--border)"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
        <div style={{fontSize:13, fontWeight:700}}>📉 목표 체중 도달 예상 기간 ({initialCat})</div>
        <div style={{fontSize:12, color:"var(--ink-muted)"}}>월 {Math.round(minRate*100)}~{Math.round(maxRate*100)}% 감량 기준</div>
      </div>
      <div style={{fontSize:12, color:"var(--accent)", fontWeight:600, marginBottom:10}}>
        예상 기간: <strong>{reachMin}~{reachMax}개월</strong> 후 목표 {tw}kg 도달
      </div>
      <div style={{overflowX:"auto"}}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block", minWidth:300}}>
          <defs>
            <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15"/>
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02"/>
            </linearGradient>
          </defs>
          <line x1={PX} y1={targetY} x2={W-PX} y2={targetY} stroke="var(--warn)" strokeWidth="1.5" strokeDasharray="6,4"/>
          <text x={W-PX+4} y={targetY+4} fontSize="9" fill="var(--warn)">{tw}kg</text>
          <path d={areaPath} fill="url(#projGrad)"/>
          <path d={pathMax} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeDasharray="5,3"/>
          <path d={pathMin} fill="none" stroke="#2d6a4f" strokeWidth="2" strokeLinecap="round"/>
          {display.map((r, i) => (
            <g key={i}>
              <circle cx={px(i)} cy={py(r.min)} r="3" fill="#2d6a4f" stroke="#fff" strokeWidth="1.5"/>
              <text x={px(i)} y={H-4} textAnchor="middle" fontSize="9" fill="#9090b0">{r.month}M</text>
              {i % 2 === 0 && <text x={px(i)} y={py(r.min)-7} textAnchor="middle" fontSize="9" fill="#2d6a4f">{r.min}</text>}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// =============================================
// 체형 측정 탭
// =============================================
function MeasurementTab({ patient }) {
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
  useEffect(() => {
    if (goal) setGForm({ target_weight: goal.target_weight || "", target_period_weeks: goal.target_period_weeks || "", start_date: goal.start_date || today(), constitution: goal.constitution || "" });
  }, [goal]);

  const saveMeasurement = async () => {
    if (!mForm.weight) { alert("체중은 필수입니다."); return; }
    const bmi = calcBMI(mForm.weight, mForm.height);
    await supabase.from("measurements").insert([{ patient_id: patient.id, measured_at: mForm.measured_at, height: mForm.height || null, weight: mForm.weight, bmi: bmi || null, memo: mForm.memo || null }]);
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

  const latestWeight = measurements[measurements.length-1]?.weight;
  const startWeight = measurements[0]?.weight;
  const lost = startWeight && latestWeight ? (startWeight - latestWeight).toFixed(1) : null;
  const previewBMI = calcBMI(mForm.weight, mForm.height);
  const previewCat = bmiCategory(previewBMI);

  return (
    <div>
      {/* 목표 설정 */}
      <div className="card" style={{marginBottom:16}}>
        <div className="section-header">
          <div className="section-title">🎯 목표 설정</div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowGoalForm(!showGoalForm)}>
            {goal ? "수정" : "목표 등록"}
          </button>
        </div>
        {goal ? (
          <div>
            <div style={{display:"flex", gap:24, flexWrap:"wrap"}}>
              <div><div className="form-label">목표 체중</div><div style={{fontSize:20, fontWeight:700, color:"var(--accent)"}}>{goal.target_weight} kg</div></div>
              <div><div className="form-label">목표 기간</div><div style={{fontSize:20, fontWeight:700}}>{goal.target_period_weeks}주</div></div>
              <div><div className="form-label">시작일</div><div style={{fontSize:14, fontWeight:600}}>{formatDate(goal.start_date)}</div></div>
              {goal.constitution && <div><div className="form-label">체질</div><div style={{fontSize:16, fontWeight:700, color:"var(--info)"}}>{goal.constitution}</div></div>}
              {lost && <div><div className="form-label">현재까지 감량</div><div style={{fontSize:20, fontWeight:700, color:"var(--info)"}}>-{lost} kg</div></div>}
            </div>
            {goal.target_weight && (() => {
              const sorted = [...measurements].sort((a,b) => a.measured_at.localeCompare(b.measured_at));
              const startDateWeight = goal.start_date
                ? sorted.reduce((a, b) => Math.abs(new Date(a.measured_at) - new Date(goal.start_date)) <= Math.abs(new Date(b.measured_at) - new Date(goal.start_date)) ? a : b)?.weight
                : sorted[0]?.weight;
              const chartHeight = measurements.find(m => m.height)?.height;
              if (!startDateWeight) return null;
              return <WeightProjectionChart currentWeight={startDateWeight} targetWeight={goal.target_weight} height={chartHeight} />;
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
                  {["금양","금음","토양","토음","목양","목음","수양","수음"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowGoalForm(false)}>취소</button>
              <button className="btn btn-primary btn-sm" onClick={saveGoal}>저장</button>
            </div>
          </div>
        )}
      </div>

      {/* 측정 기록 */}
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
                {previewBMI && previewCat && (
                  <div style={{background:"var(--surface)", borderRadius:8, padding:"10px 14px", border:"1.5px solid var(--border)"}}>
                    <div style={{fontSize:11, color:"var(--ink-muted)", marginBottom:2}}>BMI 자동 계산</div>
                    <div style={{fontSize:18, fontWeight:700, color:previewCat.color}}>{previewBMI}</div>
                    <div style={{fontSize:11, fontWeight:600, color:previewCat.color}}>{previewCat.label}</div>
                  </div>
                )}
              </div>
              <div className="form-group form-full">
                <label className="form-label">메모</label>
                <input className="form-input" placeholder="특이사항 등" value={mForm.memo} onChange={e => setMForm({...mForm, memo: e.target.value})} />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowMeasureForm(false)}>취소</button>
              <button className="btn btn-primary btn-sm" onClick={saveMeasurement}>저장</button>
            </div>
          </div>
        )}
        {measurements.length === 0 ? (
          <div className="empty">측정 기록이 없습니다</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>측정일</th><th>체중</th><th>키</th><th>BMI</th><th>메모</th></tr></thead>
              <tbody>
                {[...measurements].reverse().map(m => {
                  const cat = bmiCategory(m.bmi);
                  return (
                    <tr key={m.id}>
                      <td>{formatDate(m.measured_at)}</td>
                      <td><strong>{m.weight} kg</strong></td>
                      <td>{m.height ? `${m.height} cm` : "-"}</td>
                      <td>{m.bmi ? <span style={{color: cat?.color, fontWeight:600}}>{m.bmi} ({cat?.label})</span> : "-"}</td>
                      <td style={{fontSize:12, color:"var(--ink-muted)"}}>{m.memo || "-"}</td>
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
// 약 처방 탭
// =============================================
function PrescriptionTab({ patient }) {
  const [pkgs, setPkgs] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [happycalls, setHappycalls] = useState({});
  const [updates, setUpdates] = useState({});
  const [showPkgForm, setShowPkgForm] = useState(false);
  const [showRxForm, setShowRxForm] = useState(false);
  const [pkgForm, setPkgForm] = useState({ package_months: 3, start_date: today() });
  const [rxForm, setRxForm] = useState({ prescribed_at: today(), medicine_type: "hwan", duration_days: 30 });
  const [remainingInput, setRemainingInput] = useState({});

  const load = useCallback(async () => {
    const { data: pkgData } = await supabase.from("packages").select("*").eq("patient_id", patient.id).eq("is_active", true).order("start_date");
    const { data: rxs } = await supabase.from("prescriptions").select("*").eq("patient_id", patient.id).order("prescribed_at", { ascending: false });
    const { data: hcs } = await supabase.from("happycall_logs").select("*").in("prescription_id", (rxs||[]).map(r => r.id));
    const { data: upds } = await supabase.from("prescription_updates").select("*").in("prescription_id", (rxs||[]).map(r => r.id)).order("created_at", { ascending: false });
    setPkgs(pkgData || []);
    setPrescriptions(rxs || []);
    const hcMap = {}; (hcs||[]).forEach(h => { if (!hcMap[h.prescription_id]) hcMap[h.prescription_id] = []; hcMap[h.prescription_id].push(h); });
    setHappycalls(hcMap);
    const updMap = {}; (upds||[]).forEach(u => { if (!updMap[u.prescription_id]) updMap[u.prescription_id] = []; updMap[u.prescription_id].push(u); });
    setUpdates(updMap);
  }, [patient.id]);

  useEffect(() => { load(); }, [load]);

  const savePkg = async () => {
    if (!pkgForm.start_date) { alert("시작일을 입력해주세요."); return; }
    const endDate = calcTotalEndDate(pkgs, Number(pkgForm.package_months), pkgForm.start_date);
    await supabase.from("packages").insert([{ patient_id: patient.id, package_months: Number(pkgForm.package_months), start_date: pkgForm.start_date, end_date: endDate, remaining_months: Number(pkgForm.package_months), is_active: true }]);
    setShowPkgForm(false);
    setPkgForm({ package_months: 3, start_date: today() });
    load();
  };

  const deletePkg = async (pkgId) => {
    if (!window.confirm("이 패키지를 삭제하시겠습니까?")) return;
    await supabase.from("packages").delete().eq("id", pkgId);
    const remaining = pkgs.filter(p => p.id !== pkgId);
    if (remaining.length > 0) {
      const newEndDate = calcTotalEndDate(remaining);
      await Promise.all(remaining.map(p => supabase.from("packages").update({ end_date: newEndDate }).eq("id", p.id)));
    }
    load();
  };

  const saveRx = async () => {
    if (!pkgs.length) { alert("먼저 패키지를 등록해주세요."); return; }
    if (!rxForm.prescribed_at) { alert("처방일을 입력해주세요."); return; }
    if (!rxForm.duration_days || Number(rxForm.duration_days) < 1) { alert("처방 기간을 입력해주세요."); return; }
    const expectedEnd = addDays(rxForm.prescribed_at, Number(rxForm.duration_days));
    const arrivalHappy = addBusinessDays(rxForm.prescribed_at, 3);
    const reservationHappy = subtractBusinessDays(expectedEnd, 3);
    await supabase.from("prescriptions").insert([{ patient_id: patient.id, package_id: pkgs[0]?.id, prescribed_at: rxForm.prescribed_at, medicine_type: rxForm.medicine_type, duration_days: Number(rxForm.duration_days), expected_end_date: expectedEnd, arrival_happycall_date: arrivalHappy, reservation_happycall_date: reservationHappy }]);
    setShowRxForm(false);
    load();
  };

  const toggleHappycall = async (rxId, callType, existing) => {
    if (existing) await supabase.from("happycall_logs").update({ is_done: !existing.is_done }).eq("id", existing.id);
    else await supabase.from("happycall_logs").insert([{ prescription_id: rxId, call_type: callType, is_done: true, no_answer_count: 0 }]);
    load();
  };

  const recordNoAnswer = async (rxId, callType, existing) => {
    const newCount = (existing?.no_answer_count || 0) + 1;
    const memo = window.prompt(`미응답 ${newCount}회\n메모:`, existing?.memo || "");
    if (existing) await supabase.from("happycall_logs").update({ no_answer_count: newCount, memo: memo !== null ? memo : existing.memo }).eq("id", existing.id);
    else await supabase.from("happycall_logs").insert([{ prescription_id: rxId, call_type: callType, is_done: false, no_answer_count: 1, memo: memo || null }]);
    load();
  };

  const saveRemainingUpdate = async (rxId) => {
    const days = Number(remainingInput[rxId]);
    if (!days || days < 1) { alert("잔여 일수를 입력해주세요."); return; }
    const newEnd = addDays(today(), days);
    const newHappy = subtractBusinessDays(newEnd, 3);
    await supabase.from("prescription_updates").insert([{ prescription_id: rxId, remaining_days: days, new_expected_end_date: newEnd, new_reservation_happycall_date: newHappy }]);
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
            <span style={{fontSize:12}}>잔여 한약 일수:</span>
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
                잔여 <strong style={{color:"var(--accent)"}}>약 {remainingMonths}개월</strong>
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

      {/* 처방 목록 */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">💊 처방 관리</div>
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
              <div className="form-group" style={{display:"flex", flexDirection:"column", justifyContent:"flex-end"}}>
                <div style={{fontSize:12, color:"var(--ink-muted)"}}>
                  도착 해피콜: {rxForm.prescribed_at ? formatDate(addBusinessDays(rxForm.prescribed_at, 3)) : "-"}<br/>
                  예약 해피콜: {rxForm.prescribed_at && rxForm.duration_days ? formatDate(subtractBusinessDays(addDays(rxForm.prescribed_at, Number(rxForm.duration_days)), 3)) : "-"}
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowRxForm(false)}>취소</button>
              <button className="btn btn-primary btn-sm" onClick={saveRx}>저장</button>
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
                <span className="badge badge-success" style={{marginRight:8}}>진행 중</span>
                <strong>{formatDate(rx.prescribed_at)}</strong>
                <span style={{fontSize:12, color:"var(--ink-muted)", marginLeft:8}}>{rx.medicine_type === "hwan" ? "환약" : "탕약"} {rx.duration_days}일</span>
              </div>
              <button className="btn btn-xs btn-secondary" onClick={() => { if(window.confirm("복용 완료 처리하시겠습니까?")) supabase.from("prescriptions").update({ is_completed: true, completed_at: today() }).eq("id", rx.id).then(() => load()); }}>
                완료 처리
              </button>
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
                    <span style={{fontSize:12, color:"var(--ink-muted)", marginLeft:8}}>{rx.medicine_type === "hwan" ? "환약" : "탕약"} {rx.duration_days}일</span>
                  </div>
                  <button className="btn btn-xs btn-secondary" onClick={() => { if(window.confirm("복원하시겠습니까?")) supabase.from("prescriptions").update({ is_completed: false, completed_at: null }).eq("id", rx.id).then(() => load()); }}>
                    복원
                  </button>
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
  const [tab, setTab] = useState("measurement");

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
        <span className="badge badge-success">👥 다이어트</span>
      </div>

      <div className="tabs">
        {[
          { key: "measurement", label: "① 체형 측정" },
          { key: "prescription", label: "② 약 처방" },
        ].map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "measurement" && <MeasurementTab patient={patient} />}
      {tab === "prescription" && <PrescriptionTab patient={patient} />}
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
    const { error } = await supabase.from("patients").insert([form]);
    if (error) { setErr(error.message); setLoading(false); return; }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">신규 다이어트 환자 등록</div>
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
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>등록</button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// DIET PATIENTS PAGE
// =============================================
export default function DietPatients({ currentUser }) {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState({});
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("patients").select("*, goals(*), packages(*), measurements(*)").order("created_at", { ascending: false });
    const { data: prescriptions } = await supabase.from("prescriptions").select("*, happycall_logs(*), prescription_updates(*)").eq("is_completed", false);

    const alertMap = {};
    (prescriptions || []).forEach(p => {
      const latestUpdate = (p.prescription_updates || []).sort((a,b) => b.created_at.localeCompare(a.created_at))[0];
      const reservationDate = latestUpdate ? latestUpdate.new_reservation_happycall_date : p.reservation_happycall_date;
      const arrivalDone = (p.happycall_logs || []).find(h => h.call_type === "arrival" && h.is_done);
      const reservationDone = (p.happycall_logs || []).find(h => h.call_type === "reservation" && h.is_done);
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

  const filtered = patients.filter(p =>
    p.name?.includes(search) || p.chart_number?.includes(search)
  );

  if (selected) return <PatientDetail patient={selected} onBack={() => { setSelected(null); load(); }} />;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">다이어트 환자</div>
        <div className="page-sub">총 {patients.length}명 등록</div>
      </div>
      <div className="toolbar">
        <input className="search-input" placeholder="이름 또는 차트번호 검색" value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 신규 환자 등록</button>
      </div>

      {loading ? <div className="empty">불러오는 중...</div> : (
        <div className="patient-grid">
          {filtered.map(p => {
            const pkg = (p.packages || []).find(pk => pk.is_active);
            const goal = p.goals?.[0];
            const measurements = p.measurements || [];
            const latestWeight = [...measurements].sort((a,b) => b.measured_at.localeCompare(a.measured_at))[0]?.weight;
            const todayAlerts = alerts[p.id] || [];
            const hasAlert = todayAlerts.length > 0;

            return (
              <div key={p.id} className={`patient-card ${hasAlert ? "alert" : ""}`} onClick={() => setSelected(p)}>
                <div className="patient-card-header">
                  <div>
                    <div className="patient-name">{p.name}
                      {goal?.constitution && <span style={{fontSize:13, fontWeight:500, color:"var(--info)", marginLeft:6}}>({goal.constitution})</span>}
                    </div>
                    <div className="patient-chart">차트 #{p.chart_number}</div>
                  </div>
                  <div style={{display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end"}}>
                    {todayAlerts.map((a, i) => (
                      <span key={i} className={`badge ${a.kind === "도착" ? "badge-info" : "badge-warn"}`}>
                        {a.kind === "도착" ? "📦" : "📅"} {a.kind} 해피콜
                      </span>
                    ))}
                    <button className="btn btn-xs btn-danger" onClick={async e => {
                      e.stopPropagation();
                      if (!window.confirm(`${p.name} 환자를 삭제하시겠습니까?`)) return;
                      await supabase.from("patients").delete().eq("id", p.id);
                      load();
                    }}>삭제</button>
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
                    <span className="badge badge-gold">{pkg.package_months}개월 패키지</span>
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
