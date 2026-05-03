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
// LINE CHART (기존 App.jsx 그대로)
// =============================================
function LineChart({ data, valueKey, color = "#52b788", showDiff = false }) {
  if (!data || data.length < 2) return (
    <div className="empty" style={{height:120}}>데이터가 부족합니다 (최소 2개)</div>
  );
  const values = data.map(d => d[valueKey]).filter(v => v != null);
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const w = 500, h = 180, padX = 40, padY = showDiff ? 36 : 20;
  const filteredData = data.filter(d => d[valueKey] != null);
  const firstVal = filteredData.length > 0 ? parseFloat(filteredData[0][valueKey]) : null;
  const pts = filteredData.map((d, i, arr) => {
    const x = padX + (i / (arr.length - 1)) * (w - padX * 2);
    const y = padY + ((max - d[valueKey]) / (max - min)) * (h - padY * 2);
    const prev = arr[i - 1];
    const diff = prev && prev[valueKey] != null
      ? (parseFloat(d[valueKey]) - parseFloat(prev[valueKey])).toFixed(1) : null;
    const diffPct = firstVal != null && i > 0
      ? ((parseFloat(d[valueKey]) - firstVal) / firstVal * 100).toFixed(1) : null;
    return { x, y, d, diff, diffPct };
  });
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length-1].x} ${h} L ${pts[0].x} ${h} Z`;
  return (
    <div style={{
      background: "var(--surface2)", borderRadius: 10, border: "1px solid var(--border)",
      padding: "8px 4px", height: showDiff ? 200 : 180, position: "relative"
    }}>
      {showDiff && (
        <div style={{position:"absolute", top:4, right:8, fontSize:10, color:"#9090b0", zIndex:1}}>
          % = 최초 체중 대비 변화율
        </div>
      )}
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{width:"100%", height:"100%"}}>
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
            <text x={p.x} y={h-4} textAnchor="middle" fontSize="9" fill="#9090b0">
              {formatDate(p.d.measured_at || p.d.date).slice(5)}
            </text>
            <text x={p.x} y={p.y-8} textAnchor="middle" fontSize="10" fontWeight="600" fill={color}>
              {p.d[valueKey]}
            </text>
            {showDiff && p.diffPct !== null && (
              <text x={p.x} y={p.y-20} textAnchor="middle" fontSize="9"
                fill={parseFloat(p.diffPct) < 0 ? "#2d6a4f" : "#e07a5f"}>
                {parseFloat(p.diffPct) > 0 ? "+" : ""}{p.diffPct}%
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

// =============================================
// 목표 체중 예측 그래프 (기존 App.jsx 그대로)
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
      <div style={{display:"flex", gap:16, fontSize:11, color:"var(--ink-muted)", marginTop:6}}>
        <span><span style={{color:"#2d6a4f", fontWeight:700}}>—</span> 최대 감량</span>
        <span><span style={{color:"var(--accent)", fontWeight:700}}>- -</span> 최소 감량</span>
        <span><span style={{color:"var(--warn)", fontWeight:700}}>- -</span> 목표 체중</span>
      </div>
    </div>
  );
}

// =============================================
// TAB 1: 체형 측정 (기존 App.jsx 그대로)
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
    const { error } = await supabase.from("measurements").insert([{
      patient_id: patient.id, measured_at: mForm.measured_at,
      height: mForm.height || null, weight: mForm.weight, bmi: bmi || null, memo: mForm.memo || null,
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
              <div><div className="form-label">목표 체중</div><div style={{fontSize:20,fontWeight:700,color:"var(--accent)"}}>{goal.target_weight} kg</div></div>
              <div><div className="form-label">목표 기간</div><div style={{fontSize:20,fontWeight:700}}>{goal.target_period_weeks}주</div></div>
              <div><div className="form-label">시작일</div><div style={{fontSize:14,fontWeight:600}}>{formatDate(goal.start_date)}</div></div>
              {goal.constitution && <div><div className="form-label">체질</div><div style={{fontSize:16,fontWeight:700,color:"var(--info)"}}>{goal.constitution}</div></div>}
              {lost && <div><div className="form-label">현재까지 감량</div><div style={{fontSize:20,fontWeight:700,color:"var(--info)"}}>-{lost} kg</div></div>}
            </div>
            {!showGoalForm && goal.target_weight && (() => {
              const sorted = [...measurements].sort((a,b) => a.measured_at.localeCompare(b.measured_at));
              const startDateWeight = goal.start_date
                ? sorted.reduce((a,b) => Math.abs(new Date(a.measured_at)-new Date(goal.start_date)) <= Math.abs(new Date(b.measured_at)-new Date(goal.start_date)) ? a : b)?.weight
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
            {gForm.target_weight && (() => {
              const sorted = [...measurements].sort((a,b) => a.measured_at.localeCompare(b.measured_at));
              const startDateWeight = gForm.start_date
                ? sorted.reduce((a,b) => !a ? b : Math.abs(new Date(a.measured_at)-new Date(gForm.start_date)) <= Math.abs(new Date(b.measured_at)-new Date(gForm.start_date)) ? a : b, null)?.weight
                : sorted[0]?.weight || latestWeight;
              const chartHeight = measurements.find(m => m.height)?.height;
              if (!startDateWeight) return null;
              return <WeightProjectionChart currentWeight={startDateWeight} targetWeight={gForm.target_weight} height={chartHeight} />;
            })()}
            <div className="form-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowGoalForm(false)}>취소</button>
              <button className="btn btn-primary btn-sm" onClick={saveGoal}>저장</button>
            </div>
          </div>
        )}
      </div>

      {/* 체형 측정 기록 */}
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

        {/* Flat 구간 감지 + 선 그래프 */}
        {measurements.length >= 2 && (() => {
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

        {/* 측정 기록 테이블 */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>측정일</th><th>키(CM)</th><th>체중(KG)</th><th>BMI</th><th>변화(KG)</th><th>변화(%)</th><th>메모</th><th></th></tr>
            </thead>
            <tbody>
              {[...measurements].reverse().map((m, i, arr) => {
                const prev = arr[i+1];
                const firstWeight = arr[arr.length-1]?.weight;
                const diff = prev && m.weight && prev.weight ? (m.weight - prev.weight).toFixed(1) : null;
                const diffPct = firstWeight && m.weight && i < arr.length - 1
                  ? ((parseFloat(m.weight) - parseFloat(firstWeight)) / parseFloat(firstWeight) * 100).toFixed(1) : null;
                const cat = bmiCategory(m.bmi);
                return (
                  <tr key={m.id}>
                    <td>{formatDate(m.measured_at)}</td>
                    <td>{m.height || "-"}</td>
                    <td><strong>{m.weight || "-"}</strong></td>
                    <td>{m.bmi ? (
                      <span style={{display:"inline-flex",alignItems:"center",gap:4}}>
                        {m.bmi}{cat && <span style={{fontSize:10,fontWeight:700,color:cat.color,background:cat.color+"20",padding:"1px 6px",borderRadius:20}}>{cat.label}</span>}
                      </span>
                    ) : "-"}</td>
                    <td>{diff ? <span style={{color:parseFloat(diff)<0?"var(--accent)":"var(--warn)",fontWeight:600}}>{parseFloat(diff)>0?"+":""}{diff}</span> : "-"}</td>
                    <td>{diffPct ? <span style={{color:parseFloat(diffPct)<0?"var(--accent)":"var(--warn)",fontWeight:600,fontSize:12}}>{parseFloat(diffPct)>0?"+":""}{diffPct}%</span> : "-"}</td>
                    <td style={{maxWidth:150,fontSize:12,color:"var(--ink-muted)"}}>{m.memo || "-"}</td>
                    <td><button className="btn btn-xs btn-danger" onClick={async () => {
                      if (!window.confirm("이 측정 기록을 삭제하시겠습니까?")) return;
                      await supabase.from("measurements").delete().eq("id", m.id);
                      load();
                    }}>삭제</button></td>
                  </tr>
                );
              })}
              {measurements.length === 0 && <tr><td colSpan={8} className="empty">측정 기록이 없습니다</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =============================================
// TAB 2: 인바디 분석 (기존 App.jsx 그대로)
// =============================================
const INBODY_FIELDS = [
  { key: "height",           label: "신장",      unit: "cm"   },
  { key: "weight",           label: "체중",      unit: "kg"   },
  { key: "body_fat_percent", label: "체지방률",  unit: "%"    },
  { key: "muscle_mass",      label: "골격근량",  unit: "kg"   },
  { key: "body_fat_mass",    label: "체지방량",  unit: "kg"   },
  { key: "bmi",              label: "BMI",       unit: ""     },
  { key: "bmr",              label: "기초대사량", unit: "kcal" },
  { key: "total_body_water", label: "체수분",    unit: "L"    },
];
const COMPARE_FIELDS = [
  { key: "muscle_mass",      label: "골격근량",  unit: "kg", color: "var(--accent)" },
  { key: "body_fat_mass",    label: "체지방량",  unit: "kg", color: "var(--gold)"   },
  { key: "body_fat_percent", label: "체지방률",  unit: "%",  color: "var(--warn)"   },
];

function bodyFatAlert(pct, gender) {
  if (!pct) return null;
  const p = parseFloat(pct);
  if (gender === "female") {
    if (p >= 35) return { msg: "고도비만 수준의 체지방률입니다.", color: "var(--warn)" };
    if (p >= 28) return { msg: "BMI 정상이어도 체지방률 28% 이상은 마른 비만 가능성이 있습니다.", color: "var(--warn)" };
    if (p < 18)  return { msg: "체지방률이 너무 낮습니다. 건강에 주의가 필요합니다.", color: "var(--info)" };
  } else {
    if (p >= 30) return { msg: "고도비만 수준의 체지방률입니다.", color: "var(--warn)" };
    if (p >= 25) return { msg: "BMI 정상이어도 체지방률 25% 이상은 마른 비만 가능성이 있습니다.", color: "var(--warn)" };
    if (p < 10)  return { msg: "체지방률이 너무 낮습니다. 건강에 주의가 필요합니다.", color: "var(--info)" };
  }
  return null;
}

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
        <div className="form-group"><label className="form-label">측정일</label><input className="form-input" type="date" value={form.measured_date} onChange={e => setForm({...form, measured_date: e.target.value})} /></div>
        <div className="form-group"><label className="form-label">신장 (cm)</label><input className="form-input" type="number" step="0.1" value={form.height} onChange={e => setForm({...form, height: e.target.value})} /></div>
        <div className="form-group"><label className="form-label">체중 (kg)</label><input className="form-input" type="number" step="0.1" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} /></div>
        <div className="form-group"><label className="form-label">체지방률 (%)</label><input className="form-input" type="number" step="0.1" value={form.body_fat_percent} onChange={e => setForm({...form, body_fat_percent: e.target.value})} /></div>
        <div className="form-group"><label className="form-label">골격근량 (kg)</label><input className="form-input" type="number" step="0.1" value={form.muscle_mass} onChange={e => setForm({...form, muscle_mass: e.target.value})} /></div>
        <div className="form-group"><label className="form-label">체지방량 (kg)</label><input className="form-input" type="number" step="0.1" value={form.body_fat_mass} onChange={e => setForm({...form, body_fat_mass: e.target.value})} /></div>
        <div className="form-group"><label className="form-label">BMI</label><input className="form-input" type="number" step="0.1" value={form.bmi} onChange={e => setForm({...form, bmi: e.target.value})} /></div>
        <div className="form-group"><label className="form-label">기초대사량 (kcal)</label><input className="form-input" type="number" value={form.bmr} onChange={e => setForm({...form, bmr: e.target.value})} /></div>
        <div className="form-group"><label className="form-label">체수분 (L)</label><input className="form-input" type="number" step="0.1" value={form.total_body_water} onChange={e => setForm({...form, total_body_water: e.target.value})} /></div>
      </div>
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onCancel}>취소</button>
        <button className="btn btn-primary" onClick={() => onSave(form)}>저장</button>
      </div>
    </div>
  );
}

function InbodyTab({ patient }) {
  const [records, setRecords] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [ageGroup, setAgeGroup] = useState("adult");
  const [editingRecord, setEditingRecord] = useState(null);

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
    const { error: uploadErr } = await supabase.storage.from("inbody-pdfs").upload(fileName, file);
    if (uploadErr) { alert("업로드 실패: " + uploadErr.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("inbody-pdfs").getPublicUrl(fileName);
    setParsing(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result.split(",")[1];
      try {
        const res = await fetch("/api/parse-inbody", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64, mediaType: "application/pdf", ageGroup }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "파싱 실패");
        await saveInbodyRecord(result.parsed, urlData.publicUrl);
      } catch(err) {
        alert("AI 파싱 실패: " + err.message + "\n수동으로 기록을 추가해주세요.");
      }
      setParsing(false); setUploading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const saveInbodyRecord = async (data, pdfUrl) => {
    const measuredAt = data.measured_date || data.measured_at || today();
    await supabase.from("inbody_records").insert([{ patient_id: patient.id, measured_at: measuredAt, parsed_data: data, pdf_url: pdfUrl || null }]);
    if (data.weight) {
      await supabase.from("measurements").insert([{ patient_id: patient.id, measured_at: measuredAt, height: data.height || null, weight: data.weight || null, bmi: data.bmi || null, memo: "인바디 자동 입력" }]);
    }
    load();
  };

  const updateInbodyRecord = async (record, formData) => {
    const measuredAt = formData.measured_date || today();
    await supabase.from("inbody_records").update({ measured_at: measuredAt, parsed_data: formData }).eq("id", record.id);
    if (formData.weight) {
      const { data: existing } = await supabase.from("measurements").select("id").eq("patient_id", patient.id).eq("measured_at", measuredAt).limit(1);
      if (existing?.length > 0) {
        await supabase.from("measurements").update({ height: formData.height || null, weight: formData.weight || null, bmi: formData.bmi || null }).eq("id", existing[0].id);
      } else {
        await supabase.from("measurements").insert([{ patient_id: patient.id, measured_at: measuredAt, height: formData.height || null, weight: formData.weight || null, bmi: formData.bmi || null, memo: "인바디 자동 입력" }]);
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

  // 인바디 선 그래프용 데이터
  const chartData = records.map(r => ({
    measured_at: r.measured_at,
    muscle_mass: r.parsed_data?.muscle_mass,
    body_fat_mass: r.parsed_data?.body_fat_mass,
    body_fat_percent: r.parsed_data?.body_fat_percent,
  }));

  return (
    <div>
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
            <span className="btn btn-primary">{uploading ? (parsing ? "🤖 AI 분석 중..." : "업로드 중...") : "+ PDF 업로드"}</span>
            <input type="file" accept=".pdf" style={{display:"none"}} onChange={handleFileUpload} disabled={uploading} />
          </label>
          <button className="btn btn-secondary" onClick={() => setEditingRecord({ id: null, isNew: true })}>+ 수동 입력</button>
        </div>
        <div style={{fontSize:12, color:"var(--ink-muted)", marginTop:8}}>PDF 업로드 시 AI가 자동 파싱 후 즉시 저장됩니다. 오류 시 수동 입력을 이용해주세요.</div>
      </div>

      {editingRecord?.isNew && (
        <InbodyEditForm initialData={{ measured_date: today() }} title="✏️ 인바디 수동 입력"
          onSave={(formData) => { saveInbodyRecord(formData, null); setEditingRecord(null); }}
          onCancel={() => setEditingRecord(null)} />
      )}
      {editingRecord && !editingRecord.isNew && (
        <InbodyEditForm initialData={{ ...editingRecord.parsed_data, measured_date: editingRecord.measured_at }} title="✏️ 인바디 기록 수정"
          onSave={(formData) => updateInbodyRecord(editingRecord, formData)}
          onCancel={() => setEditingRecord(null)} />
      )}

      {/* 변화 추이 — 선 그래프 (기존 App.jsx 스타일) */}
      {records.length >= 2 && (
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
            <div style={{display:"flex", gap:8, flexWrap:"wrap", marginBottom:16}}>
              {records.map(r => (
                <button key={r.id} className={`btn btn-sm ${selected?.id === r.id ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setSelected(selected?.id === r.id ? null : r)}>
                  {formatDate(r.measured_at)}
                </button>
              ))}
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>항목</th>{records.map(r => <th key={r.id}>{formatDate(r.measured_at)}</th>)}<th></th></tr></thead>
                <tbody>
                  {COMPARE_FIELDS.map(f => (
                    <tr key={f.key}>
                      <td><strong>{f.label}</strong></td>
                      {records.map((r, i) => {
                        const val = r.parsed_data?.[f.key];
                        const prev = records[i-1]?.parsed_data?.[f.key];
                        const diff = val && prev ? (parseFloat(val) - parseFloat(prev)).toFixed(1) : null;
                        return (
                          <td key={r.id}>
                            {val != null ? `${val} ${f.unit}` : "-"}
                            {diff && <span style={{fontSize:11, marginLeft:4, color:parseFloat(diff)<0?"var(--accent)":"var(--warn)"}}>({parseFloat(diff)>0?"+":""}{diff})</span>}
                          </td>
                        );
                      })}
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selected && (
              <div style={{marginTop:16}}>
                <div style={{display:"flex", gap:8, marginBottom:12}}>
                  <button className="btn btn-sm btn-secondary" onClick={() => setEditingRecord(selected)}>✏️ 수정</button>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteRecord(selected)}>삭제</button>
                  {selected.pdf_url && <a href={selected.pdf_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">📥 원본 PDF</a>}
                </div>
                {INBODY_FIELDS.map(f => {
                  const val = selected.parsed_data?.[f.key];
                  if (val == null || val === "") return null;
                  const bfAlert = f.key === "body_fat_percent" ? bodyFatAlert(val, patient.gender) : null;
                  return (
                    <div key={f.key} style={{display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid var(--border)"}}>
                      <span style={{fontSize:12, color:"var(--ink-muted)"}}>{f.label}</span>
                      <div style={{display:"flex", alignItems:"center", gap:8}}>
                        <span style={{fontSize:14, fontWeight:600, color:bfAlert?bfAlert.color:"inherit"}}>{val} {f.unit}</span>
                        {bfAlert && <span style={{fontSize:11, color:bfAlert.color, fontWeight:600}}>⚠️ {bfAlert.msg}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// TAB 3: 약 처방
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
    const rxIds = (rxs || []).map(r => r.id);
    const { data: hcs } = rxIds.length ? await supabase.from("happycall_logs").select("*").in("prescription_id", rxIds) : { data: [] };
    const { data: upds } = rxIds.length ? await supabase.from("prescription_updates").select("*").in("prescription_id", rxIds).order("created_at", { ascending: false }) : { data: [] };
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
        {activePrescriptions.length === 0 && completedPrescriptions.length === 0 && <div className="empty">처방 이력이 없습니다</div>}
        {activePrescriptions.map(rx => (
          <div key={rx.id} style={{marginBottom:16, paddingBottom:16, borderBottom:"1px solid var(--border)"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
              <div>
                <span className="badge badge-success" style={{marginRight:8}}>진행 중</span>
                <strong>{formatDate(rx.prescribed_at)}</strong>
                <span style={{fontSize:12, color:"var(--ink-muted)", marginLeft:8}}>{rx.medicine_type === "hwan" ? "환약" : "탕약"} {rx.duration_days}일</span>
              </div>
              <button className="btn btn-xs btn-secondary" onClick={() => {
                if (window.confirm("복용 완료 처리하시겠습니까?"))
                  supabase.from("prescriptions").update({ is_completed: true, completed_at: today() }).eq("id", rx.id).then(() => load());
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
                    <span style={{fontSize:12, color:"var(--ink-muted)", marginLeft:8}}>{rx.medicine_type === "hwan" ? "환약" : "탕약"} {rx.duration_days}일</span>
                  </div>
                  <button className="btn btn-xs btn-secondary" onClick={() => {
                    if (window.confirm("복원하시겠습니까?"))
                      supabase.from("prescriptions").update({ is_completed: false, completed_at: null }).eq("id", rx.id).then(() => load());
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
// TAB 4: 침구실 치료
// =============================================
function VisitTab({ patient }) {
  const [visits, setVisits] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ visited_at: today(), treatment_types: [], memo: "" });
  const [treatmentEndDate, setTreatmentEndDate] = useState(null);

  const TREATMENTS = [
    { key: "general",          label: "일반 관리" },
    { key: "premium",          label: "프리미엄 관리" },
    { key: "herbal_injection", label: "약침" },
    { key: "highfrequency",    label: "고주파" },
    { key: "coolsculpting",    label: "쿨쎄라" },
    { key: "other",            label: "기타" },
  ];

  const load = useCallback(async () => {
    const { data } = await supabase.from("visits").select("*").eq("patient_id", patient.id).order("visited_at", { ascending: false });
    setVisits(data || []);
    const { data: pkgData } = await supabase.from("packages").select("*").eq("patient_id", patient.id).eq("is_active", true).order("start_date");
    if (pkgData?.length > 0) {
      const totalDays = pkgData.reduce((s, p) => s + Number(p.package_months) * 30, 0);
      const firstStart = [...pkgData].sort((a,b) => a.start_date.localeCompare(b.start_date))[0].start_date;
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
        : [...f.treatment_types, key],
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
              <thead><tr><th>치료일</th><th>치료</th><th>메모</th><th></th></tr></thead>
              <tbody>
                {visits.map(v => (
                  <tr key={v.id}>
                    <td><strong>{formatDate(v.visited_at)}</strong></td>
                    <td style={{display:"flex", gap:4, flexWrap:"wrap"}}>
                      {(v.treatment_types || []).map(t => (
                        <span key={t} style={{background:"var(--accent-pale)", color:"var(--accent)", fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:20}}>
                          {treatmentLabel(t)}
                        </span>
                      ))}
                    </td>
                    <td style={{maxWidth:200, color:"var(--ink-muted)", fontSize:12}}>{v.memo || "-"}</td>
                    <td><button className="btn btn-xs btn-danger" onClick={async () => {
                      if (!window.confirm("삭제하시겠습니까?")) return;
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
// PDF 출력 (기존 App.jsx generatePDF 그대로)
// =============================================
function usePDFGenerator(patient) {
  const [generating, setGenerating] = useState(false);

  const bmiCat = (bmi) => {
    if (!bmi) return "";
    const b = parseFloat(bmi);
    if (b < 18.5) return "저체중";
    if (b < 23) return "정상";
    if (b < 25) return "과체중";
    return "비만";
  };

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

  const makeSVG = (data, valueKey, color, label, unit, showPctChange = false) => {
    if (!data || data.length < 2) return `<div style="color:#9090b0;font-size:12px;padding:20px 0">데이터가 부족합니다 (최소 2개)</div>`;
    const values = data.map(d => parseFloat(d[valueKey])).filter(v => !isNaN(v));
    if (values.length < 2) return `<div style="color:#9090b0;font-size:12px;padding:20px 0">데이터가 부족합니다</div>`;
    const min = Math.min(...values) - 1;
    const max = Math.max(...values) + 1;
    const w = 500, h = 160, padX = 50, padY = showPctChange ? 36 : 20;
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
    return `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" style="display:block;max-width:100%">
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

  const generatePDF = async () => {
    setGenerating(true);
    try {
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

      const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>건강관리 리포트 — ${patient.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Noto Sans KR',sans-serif;color:#1a1a2e;background:#fff;}
  .body{padding:40px 48px;}
  .section-block{margin-bottom:40px;}
  .section-head{display:flex;align-items:center;gap:12px;margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid #1a1a2e;}
  .section-num{width:28px;height:28px;border-radius:50%;background:#1a1a2e;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;}
  .section-title{font-size:16px;font-weight:700;}
  .goal-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px;}
  .goal-card{background:#f4f3ef;border-radius:10px;padding:16px;}
  .goal-label{font-size:10px;color:#9090b0;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;}
  .goal-value{font-size:22px;font-weight:700;color:#1a1a2e;}
  .goal-value.accent{color:#2d6a4f;}.goal-value.info{color:#3d7ebf;}
  .progress-wrap{margin-bottom:20px;}
  .progress-label{display:flex;justify-content:space-between;font-size:12px;color:#9090b0;margin-bottom:6px;}
  .progress-bar{height:8px;background:#e8e6e0;border-radius:20px;overflow:hidden;}
  .progress-fill{height:100%;background:linear-gradient(90deg,#52b788,#2d6a4f);border-radius:20px;}
  .chart-block{margin-bottom:10px;}
  .chart-label{font-size:10px;font-weight:600;color:#4a4a6a;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;}
  .chart-wrap{background:#faf9f6;border-radius:10px;padding:16px;border:1px solid #e8e6e0;}
  .chart-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px;}
  table{width:100%;border-collapse:collapse;font-size:12px;margin-top:16px;}
  th{background:#1a1a2e;color:#fff;padding:10px 12px;text-align:left;font-size:10px;font-weight:600;letter-spacing:0.5px;}
  td{padding:10px 12px;border-bottom:1px solid #e8e6e0;}
  tr:nth-child(even) td{background:#faf9f6;}
  .badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;}
  .badge-down{background:#d8f3dc;color:#2d6a4f;}.badge-up{background:#fdecea;color:#e07a5f;}
  .badge-warn{background:#fdecea;color:#e07a5f;}.badge-ok{background:#d8f3dc;color:#2d6a4f;}
  .insight{background:#f0f7ff;border-left:4px solid #3d7ebf;border-radius:0 8px 8px 0;padding:14px 16px;margin-top:16px;font-size:12px;line-height:1.7;color:#1a1a2e;}
  .insight strong{color:#3d7ebf;}
  .insight-warn{background:#fff5f3;border-left-color:#e07a5f;}
  .insight-warn strong{color:#e07a5f;}
  .divider{height:1px;background:#e8e6e0;margin:32px 0;}
  .footer{background:#f4f3ef;padding:20px 48px;font-size:11px;color:#9090b0;display:flex;justify-content:space-between;margin-top:40px;}
  .ib-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;}
  .ib-card{background:#faf9f6;border:1px solid #e8e6e0;border-radius:10px;padding:14px 16px;}
  .ib-label{font-size:10px;color:#9090b0;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;}
  .ib-val{font-size:20px;font-weight:700;}
  .ib-warn{color:#e07a5f;}.ib-ok{color:#2d6a4f;}
  .ib-warn-msg{font-size:10px;color:#e07a5f;margin-top:2px;font-weight:600;}
  @media print {
    @page{margin:15mm 12mm 20mm;size:A4 portrait;}
    body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .section-block{page-break-inside:avoid;break-inside:avoid;}
    .no-break{page-break-inside:avoid;break-inside:avoid;}
    .footer{page-break-before:avoid;break-before:avoid;}
    .chart-wrap{overflow:visible;padding:4px 8px;}
    .chart-wrap svg{width:100%;height:100%;}
  }
</style></head><body>
<div class="body">
<div class="section-block no-break">
  <div class="section-head"><div class="section-num">1</div><div class="section-title">목표 설정 및 체형 측정</div></div>
  ${goal ? `
  <div class="goal-grid">
    <div class="goal-card"><div class="goal-label">목표 체중</div><div class="goal-value accent">${goal.target_weight} <span style="font-size:14px;font-weight:400">kg</span></div></div>
    <div class="goal-card"><div class="goal-label">목표 기간</div><div class="goal-value">${goal.target_period_weeks} <span style="font-size:14px;font-weight:400">주</span></div></div>
    <div class="goal-card"><div class="goal-label">현재 체중</div><div class="goal-value">${latestWeight || "-"} <span style="font-size:14px;font-weight:400">kg</span></div></div>
    <div class="goal-card"><div class="goal-label">총 감량</div><div class="goal-value info">${lost ? `-${lost}` : "-"} <span style="font-size:14px;font-weight:400">kg</span></div></div>
  </div>
  ${goal.target_weight && latestWeight && startWeight ? `
  <div class="progress-wrap">
    <div class="progress-label"><span>시작 ${startWeight}kg → 현재 ${latestWeight}kg</span><span>목표 ${goal.target_weight}kg</span></div>
    <div class="progress-bar"><div class="progress-fill" style="width:${Math.max(0,Math.min(100,Math.round((startWeight-latestWeight)/(startWeight-goal.target_weight)*100)))}%"></div></div>
  </div>` : ""}` : '<div style="color:#9090b0;font-size:13px;padding:16px 0">목표가 등록되지 않았습니다</div>'}
  ${ms.length >= 2 ? `
  <div class="chart-row">
    <div class="chart-block"><div class="chart-label">체중 추이 (kg)</div><div class="chart-wrap">${makeSVG(ms, "weight", "#2d6a4f", "체중", "kg", true)}</div></div>
    ${ms.some(m => m.bmi) ? `<div class="chart-block"><div class="chart-label">BMI 추이</div><div class="chart-wrap">${makeSVG(ms, "bmi", "#c9a94e", "BMI", "")}</div></div>` : "<div></div>"}
  </div>` : '<div style="color:#9090b0;font-size:12px;padding:8px 0">체형 측정 데이터가 2개 이상이어야 그래프가 표시됩니다</div>'}
  ${ms.length > 0 ? (() => {
    const first = ms[0]; const last = ms[ms.length-1];
    const rows = ms.length === 1 ? [first] : [first, last];
    const startW = first.weight;
    return `<table><thead><tr><th>구분</th><th>측정일</th><th>키(cm)</th><th>체중(kg)</th><th>BMI</th><th>최초 대비 변화</th><th>메모</th></tr></thead><tbody>
    ${rows.map((m, i) => {
      const isLast = i === rows.length - 1 && rows.length > 1;
      const diff = isLast && startW && m.weight ? (m.weight - startW).toFixed(1) : null;
      const diffPct = isLast && startW && m.weight ? ((m.weight - startW) / startW * 100).toFixed(1) : null;
      const cat = bmiCat(m.bmi);
      return `<tr><td><strong style="color:${isLast?"#3d7ebf":"#2d6a4f"}">${isLast?"최근":"최초"}</strong></td><td>${formatDate(m.measured_at)}</td><td>${m.height||"-"}</td><td><strong>${m.weight||"-"}</strong></td><td>${m.bmi?`${m.bmi} <span class="badge ${["정상"].includes(cat)?"badge-ok":"badge-warn"}">${cat}</span>`:"-"}</td><td>${diff?`<span class="badge ${parseFloat(diff)<0?"badge-down":"badge-up"}">${parseFloat(diff)>0?"+":""}${diff}kg (${parseFloat(diffPct)>0?"+":""}${diffPct}%)</span>`:"-"}</td><td style="color:#9090b0">${m.memo||"-"}</td></tr>`;
    }).join("")}
    </tbody></table>`;
  })() : ""}
  <div class="insight"><strong>BMI 해석 기준 (아시아인)</strong><br>저체중: BMI &lt; 18.5 | 정상: 18.5~22.9 | 과체중: 23~24.9 | 비만: ≥ 25</div>
</div>
<div class="divider"></div>
<div class="section-block no-break">
  <div class="section-head"><div class="section-num">2</div><div class="section-title">인바디 체성분 분석</div></div>
  ${ib.length === 0 ? '<div style="color:#9090b0;font-size:13px;padding:16px 0">인바디 측정 기록이 없습니다</div>' : `
  ${ib.length >= 2 ? `
  <div class="chart-row" style="grid-template-columns:1fr 1fr 1fr;">
    <div class="chart-block"><div class="chart-label">골격근량 추이 (kg)</div><div class="chart-wrap">${makeSVG(ib.map(r=>({measured_at:r.measured_at,muscle_mass:r.parsed_data?.muscle_mass})),"muscle_mass","#2d6a4f","골격근량","kg")}</div></div>
    <div class="chart-block"><div class="chart-label">체지방량 추이 (kg)</div><div class="chart-wrap">${makeSVG(ib.map(r=>({measured_at:r.measured_at,body_fat_mass:r.parsed_data?.body_fat_mass})),"body_fat_mass","#c9a94e","체지방량","kg")}</div></div>
    <div class="chart-block"><div class="chart-label">체지방률 추이 (%)</div><div class="chart-wrap">${makeSVG(ib.map(r=>({measured_at:r.measured_at,body_fat_percent:r.parsed_data?.body_fat_percent})),"body_fat_percent","#e07a5f","체지방률","%")}</div></div>
  </div>` : ""}
  <div class="insight insight-warn" style="margin-top:16px"><strong>체지방률 해석 기준</strong><br>여성: 정상 18~27% | <strong>28% 이상</strong> → 마른 비만 가능성<br>남성: 정상 10~24% | <strong>25% 이상</strong> → 마른 비만 가능성</div>
  `}
</div>
</div>
<div class="footer"><span>건강관리 리포트</span><span>${patient.name} 님 · 출력일 ${formatDate(today())}</span></div>
</body></html>`;

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

  return { generating, generatePDF };
}

// =============================================
// 환자 상세 페이지
// =============================================
function PatientDetail({ patient, onBack, initialTab }) {
  const [tab, setTab] = useState(initialTab || "measurement");
  const { generating, generatePDF } = usePDFGenerator(patient);

  return (
    <div>
      <button className="back-btn" onClick={onBack}>← 목록으로</button>
      <div style={{background:"var(--ink)", color:"#fff", borderRadius:"var(--r)", padding:24, marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12}}>
        <div>
          <div style={{fontFamily:"'DM Serif Display', serif", fontSize:24}}>{patient.name}</div>
          <div style={{fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:4}}>
            차트 #{patient.chart_number}
            {patient.gender && ` · ${patient.gender === "female" ? "여성" : "남성"}`}
            {patient.birth_date && ` · ${patient.birth_date}`}
            {patient.phone && ` · ${patient.phone}`}
          </div>
        </div>
        <div style={{display:"flex", gap:10, alignItems:"center"}}>
          <button className="btn btn-secondary btn-sm" onClick={generatePDF} disabled={generating}
            style={{background:"rgba(255,255,255,0.15)", color:"#fff", border:"1px solid rgba(255,255,255,0.3)"}}>
            {generating ? "생성 중..." : "🖨️ 리포트 PDF 출력"}
          </button>
          <span className="badge badge-success">👥 다이어트</span>
        </div>
      </div>

      <div className="tabs">
        {[
          { key: "measurement",  label: "① 체형 측정" },
          { key: "inbody",       label: "② 인바디 분석" },
          { key: "prescription", label: "③ 약 처방" },
          { key: "visit",        label: "④ 침구실 치료" },
        ].map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "measurement"  && <MeasurementTab patient={patient} />}
      {tab === "inbody"       && <InbodyTab patient={patient} />}
      {tab === "prescription" && <PrescriptionTab patient={patient} />}
      {tab === "visit"        && <VisitTab patient={patient} />}
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
          <div className="form-group"><label className="form-label">차트번호 *</label><input className="form-input" value={form.chart_number} onChange={e => setForm({...form, chart_number: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">이름 *</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div className="form-group">
            <label className="form-label">성별</label>
            <select className="form-select" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
              <option value="female">여성</option>
              <option value="male">남성</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">생년월일</label><input className="form-input" type="date" value={form.birth_date} onChange={e => setForm({...form, birth_date: e.target.value})} /></div>
          <div className="form-group form-full"><label className="form-label">연락처</label><input className="form-input" placeholder="010-0000-0000" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
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
export default function DietPatients({ currentUser, selectPatientId, selectTab, onMounted }) {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState({});
  const [selected, setSelected] = useState(null);
  const [initialTab, setInitialTab] = useState("measurement");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("patients").select("*, goals(*), packages(*), measurements(*)").order("created_at", { ascending: false });
    const { data: prescriptions } = await supabase.from("prescriptions").select("*, happycall_logs(*), prescription_updates(*)").eq("is_completed", false);
    const { data: allVisits } = await supabase.from("visits").select("patient_id, visited_at, treatment_types").order("visited_at", { ascending: false });

    const alertMap = {};
    const premiumAlertSet = new Set();

    (prescriptions || []).forEach(p => {
      const latestUpdate = (p.prescription_updates || []).sort((a,b) => b.created_at.localeCompare(a.created_at))[0];
      const reservationDate = latestUpdate ? latestUpdate.new_reservation_happycall_date : p.reservation_happycall_date;
      const arrivalDone = (p.happycall_logs || []).find(h => h.call_type === "arrival" && h.is_done);
      const reservationDone = (p.happycall_logs || []).find(h => h.call_type === "reservation" && h.is_done);
      if (!alertMap[p.patient_id]) alertMap[p.patient_id] = [];
      if (isTodayOrPast(p.arrival_happycall_date) && !arrivalDone) alertMap[p.patient_id].push({ kind: "도착" });
      if (isTodayOrPast(reservationDate) && !reservationDone) alertMap[p.patient_id].push({ kind: "예약" });
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

    // 정렬: 해피콜 대상 → 프리미엄 알림 → 나머지
    const sorted = [...(data || [])].sort((a, b) => {
      const aScore = (alertMap[a.id] || []).length > 0 ? 0 : premiumAlertSet.has(a.id) ? 1 : 2;
      const bScore = (alertMap[b.id] || []).length > 0 ? 0 : premiumAlertSet.has(b.id) ? 1 : 2;
      return aScore - bScore;
    }).map(p => ({ ...p, _premiumAlert: premiumAlertSet.has(p.id) }));

    setPatients(sorted);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // 대시보드에서 직접 환자+탭 선택 시 처리 — 한 번만 실행 후 초기화
  useEffect(() => {
    if (selectPatientId && patients.length > 0) {
      const found = patients.find(p => p.id === selectPatientId);
      if (found) {
        setSelected(found);
        setInitialTab(selectTab || "prescription");
        // 처리 후 부모에게 초기화 요청
        if (onMounted) onMounted();
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
            const hasPremiumAlert = p._premiumAlert;
            return (
              <div key={p.id} className={`patient-card ${hasAlert || hasPremiumAlert ? "alert" : ""}`} onClick={() => setSelected(p)}>
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
                    {hasPremiumAlert && (
                      <span className="badge badge-warn">🏥 프리미엄 재내원 필요</span>
                    )}
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
                      <div className="progress-fill" style={{width:`${Math.min(100,Math.max(0,Math.round((goal.start_weight-latestWeight)/(goal.start_weight-goal.target_weight)*100)))}%`}} />
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
