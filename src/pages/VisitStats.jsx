import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { today } from "../lib/dateUtils";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const MONTHS_LABEL = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function visitRate(reserved, visited) {
  if (!reserved) return null;
  return Math.round(visited / reserved * 100);
}

function RateBadge({ rate }) {
  if (rate === null) return <span style={{fontSize:11, color:"var(--ink-muted)"}}>—</span>;
  const color = rate >= 90 ? "var(--accent)" : rate >= 70 ? "var(--gold)" : "var(--warn)";
  return <span style={{fontSize:12, fontWeight:700, color}}>{rate}%</span>;
}

// =============================================
// 숫자 입력 팝업
// =============================================
function NumPicker({ label, value, onConfirm, onClose }) {
  const [selected, setSelected] = useState(value);
  const nums = [0, ...Array.from({ length: 50 }, (_, i) => i + 1)];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(26,26,46,0.5)",
      zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "var(--surface)", borderRadius: 16, padding: 24,
        width: "100%", maxWidth: 360, boxShadow: "var(--shadow-lg)",
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📋 {label} 선택</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, marginBottom: 16, maxHeight: 240, overflowY: "auto" }}>
          {nums.map(n => (
            <button
              key={n}
              onClick={() => setSelected(n)}
              style={{
                padding: "8px 4px", borderRadius: 8, border: "1.5px solid",
                borderColor: selected === n ? "var(--accent)" : "var(--border)",
                background: selected === n ? "var(--accent)" : "var(--surface)",
                color: selected === n ? "#fff" : n === 0 ? "var(--ink-muted)" : "var(--ink)",
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>취소</button>
          <button className="btn btn-primary btn-sm" onClick={() => { onConfirm(selected); onClose(); }}>확인</button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// 월별 테이블
// =============================================
function MonthTable({ year, month, stats, onUpdate }) {
  const [picker, setPicker] = useState(null); // { dateKey, field, value, label }
  const days = getDaysInMonth(year, month);

  const getVal = (dateKey, field) => {
    const s = stats[dateKey];
    return s ? (s[field] || 0) : 0;
  };

  const handleUpdate = async (dateKey, field, val) => {
    const existing = stats[dateKey];
    const reserved = field === "reserved" ? val : (existing?.reserved || 0);
    const visited  = field === "visited"  ? val : (existing?.visited  || 0);

    if (existing) {
      await supabase.from("visit_stats").update({ reserved, visited }).eq("stat_date", dateKey);
    } else {
      await supabase.from("visit_stats").insert([{ stat_date: dateKey, reserved, visited }]);
    }
    onUpdate();
  };

  // 월 합계
  let totalResv = 0, totalVisit = 0, workDays = 0;
  for (let d = 1; d <= days; d++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const r = getVal(key, "reserved");
    const v = getVal(key, "visited");
    totalResv += r;
    totalVisit += v;
    if (r > 0 || v > 0) workDays++;
  }
  const monthRate = visitRate(totalResv, totalVisit);

  return (
    <div>
      {/* 월 통계 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 20 }}>
        {[
          { label: "월 총 예약", value: totalResv, unit: "명", color: "#7e57c2" },
          { label: "월 실제 내원", value: totalVisit, unit: "명", color: "var(--info)" },
          { label: "월 내원율", value: monthRate !== null ? `${monthRate}%` : "—", unit: "예약 대비", color: monthRate >= 90 ? "var(--accent)" : monthRate >= 70 ? "var(--gold)" : "var(--warn)" },
          { label: "진료일 수", value: workDays, unit: "일", color: "var(--ink)" },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding: "14px 16px" }}>
            <div className="form-label">{c.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: c.color, lineHeight: 1.2 }}>{c.value}</div>
            <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 2 }}>{c.unit}</div>
          </div>
        ))}
      </div>

      {/* 일별 테이블 */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>날짜</th>
              <th style={{ textAlign: "center" }}>예약 환자</th>
              <th style={{ textAlign: "center" }}>실제 내원</th>
              <th style={{ textAlign: "center" }}>내원율</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: days }, (_, i) => {
              const d = i + 1;
              const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const dow = new Date(year, month, d).getDay();
              const isSun = dow === 0;
              const isSat = dow === 6;
              const r = getVal(dateKey, "reserved");
              const v = getVal(dateKey, "visited");
              const rate = visitRate(r, v);
              const isToday = dateKey === today();

              return (
                <tr key={d} style={{
                  background: isToday ? "var(--accent-pale)" : (isSun || isSat) ? "var(--surface2)" : undefined,
                }}>
                  <td style={{
                    color: isSun ? "var(--warn)" : isSat ? "var(--info)" : "var(--ink)",
                    fontWeight: isToday ? 700 : 400,
                    fontSize: 13,
                  }}>
                    {month + 1}/{d} ({DOW[dow]})
                    {isToday && <span className="badge badge-success" style={{ marginLeft: 6, fontSize: 10 }}>오늘</span>}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => setPicker({ dateKey, field: "reserved", value: r, label: "예약 환자 수" })}
                      style={{
                        background: r > 0 ? "#ede7f6" : "var(--surface2)",
                        color: r > 0 ? "#7e57c2" : "var(--ink-muted)",
                        border: "none", borderRadius: 8, padding: "6px 16px",
                        fontSize: 14, fontWeight: 700, cursor: "pointer",
                        fontFamily: "inherit", minWidth: 48,
                      }}
                    >
                      {r}
                    </button>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => setPicker({ dateKey, field: "visited", value: v, label: "실제 내원 환자 수" })}
                      style={{
                        background: v > 0 ? "var(--info-pale)" : "var(--surface2)",
                        color: v > 0 ? "var(--info)" : "var(--ink-muted)",
                        border: "none", borderRadius: 8, padding: "6px 16px",
                        fontSize: 14, fontWeight: 700, cursor: "pointer",
                        fontFamily: "inherit", minWidth: 48,
                      }}
                    >
                      {v}
                    </button>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <RateBadge rate={rate} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {picker && (
        <NumPicker
          label={picker.label}
          value={picker.value}
          onConfirm={val => handleUpdate(picker.dateKey, picker.field, val)}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}

// =============================================
// 연도별 통계
// =============================================
function YearStats({ stats }) {
  const years = [...new Set(Object.keys(stats).map(k => k.slice(0, 4)))];
  if (!years.length) years.push(String(new Date().getFullYear()));
  const [year, setYear] = useState(years[0]);

  const monthData = Array.from({ length: 12 }, (_, m) => {
    let totalR = 0, totalV = 0;
    const days = getDaysInMonth(parseInt(year), m);
    for (let d = 1; d <= days; d++) {
      const key = `${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const s = stats[key];
      if (s) { totalR += s.reserved || 0; totalV += s.visited || 0; }
    }
    return { reserved: totalR, visited: totalV, rate: visitRate(totalR, totalV) };
  });

  const maxVal = Math.max(...monthData.map(d => Math.max(d.reserved, d.visited)), 1);

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <select className="form-select" value={year} onChange={e => setYear(e.target.value)} style={{ width: "auto" }}>
          {years.sort().reverse().map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
      </div>

      {/* 월별 내원율 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>📈 월별 내원율 추이</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 140, marginBottom: 8 }}>
          {monthData.map((d, i) => {
            const rate = d.rate;
            const barH = rate !== null ? Math.max(4, (rate / 100) * 120) : 4;
            const color = rate === null ? "var(--border)" : rate >= 90 ? "var(--accent)" : rate >= 70 ? "var(--gold)" : "var(--warn)";
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                {rate !== null && <span style={{ fontSize: 9, fontWeight: 700, color }}>{rate}%</span>}
                <div style={{ width: "100%", height: barH, borderRadius: "3px 3px 0 0", background: color, opacity: 0.85 }} />
                <span style={{ fontSize: 9, color: "var(--ink-muted)" }}>{i + 1}월</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 월별 예약/내원 비교 */}
      <div className="card">
        <div className="section-title" style={{ marginBottom: 16 }}>📊 월별 예약 vs 내원</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {monthData.map((d, i) => (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{i + 1}월</span>
                <span style={{ color: "var(--ink-muted)" }}>
                  예약 {d.reserved} · 내원 {d.visited}
                  {d.rate !== null && <span style={{ marginLeft: 6, fontWeight: 700, color: d.rate >= 90 ? "var(--accent)" : d.rate >= 70 ? "var(--gold)" : "var(--warn)" }}>{d.rate}%</span>}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ background: "var(--surface2)", borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{ width: `${(d.reserved / maxVal) * 100}%`, height: "100%", background: "#7e57c2", borderRadius: 4 }} />
                </div>
                <div style={{ background: "var(--surface2)", borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{ width: `${(d.visited / maxVal) * 100}%`, height: "100%", background: "var(--info)", borderRadius: 4 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12 }}>
          <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#7e57c2", marginRight: 4 }} />예약</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "var(--info)", marginRight: 4 }} />내원</span>
        </div>
      </div>
    </div>
  );
}

// =============================================
// VISIT STATS PAGE
// =============================================
export default function VisitStats({ currentUser }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [stats, setStats] = useState({}); // { "YYYY-MM-DD": { reserved, visited } }
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("month");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("visit_stats").select("*");
    const map = {};
    (data || []).forEach(s => { map[s.stat_date] = { reserved: s.reserved, visited: s.visited }; });
    setStats(map);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">내원 현황</div>
        <div className="page-sub">일별 예약 및 내원 환자 수 관리</div>
      </div>

      <div className="tabs">
        {[
          { key: "month", label: "📅 월별 현황" },
          { key: "year",  label: "📈 연도별 통계" },
        ].map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "month" && (
        <>
          {/* 월 이동 */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <button className="btn btn-secondary btn-sm" onClick={prevMonth}>← 이전</button>
            <span style={{ fontSize: 18, fontWeight: 700, minWidth: 120, textAlign: "center" }}>
              {year}년 {MONTHS_LABEL[month]}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={nextMonth}>다음 →</button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}
              style={{ marginLeft: "auto" }}
            >
              이번 달
            </button>
          </div>

          {loading ? (
            <div className="empty">불러오는 중...</div>
          ) : (
            <div className="card">
              <MonthTable year={year} month={month} stats={stats} onUpdate={load} />
            </div>
          )}
        </>
      )}

      {tab === "year" && (
        loading ? <div className="empty">불러오는 중...</div> : <YearStats stats={stats} />
      )}
    </div>
  );
}
