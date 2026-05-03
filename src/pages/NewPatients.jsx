import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { today, formatDate } from "../lib/dateUtils";

// =============================================
// 상수
// =============================================
const ROUTES = ["간판", "인터넷", "블로그", "인스타", "지인", "AI", "협력업체", "기타"];

const ROUTE_EMOJI = {
  간판: "🪧", 인터넷: "🔍", 블로그: "✍️", 인스타: "📸",
  지인: "🤝", AI: "🤖", 협력업체: "🏢", 기타: "📌",
};

const ROUTE_COLOR = {
  간판:   { bg: "#fff3e8", color: "#e07030", border: "#ffd0a8" },
  인터넷: { bg: "#eef3ff", color: "#4a7fe5", border: "#b8d0f8" },
  블로그: { bg: "#e8f5e9", color: "#27ae60", border: "#a8d8aa" },
  인스타: { bg: "#fce4ec", color: "#c2185b", border: "#f8bbd0" },
  지인:   { bg: "#f3e5f5", color: "#9b59b6", border: "#e1bee7" },
  AI:     { bg: "#e0f7fa", color: "#0097a7", border: "#b2ebf2" },
  협력업체: { bg: "#e0f2f1", color: "#00695c", border: "#80cbc4" },
  기타:   { bg: "#f5f5f5", color: "#78909c", border: "#cfd8dc" },
};

const CHART_COLORS = {
  간판: "#e07030", 인터넷: "#4a7fe5", 블로그: "#27ae60",
  인스타: "#c2185b", 지인: "#9b59b6", AI: "#0097a7",
  협력업체: "#00695c", 기타: "#78909c",
};

// =============================================
// 경로 배지
// =============================================
function RouteBadge({ route, size = "md" }) {
  const c = ROUTE_COLOR[route] || ROUTE_COLOR["기타"];
  const pad = size === "sm" ? "3px 10px" : "5px 14px";
  const fs = size === "sm" ? 11 : 13;
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1.5px solid ${c.border}`,
      borderRadius: 20, padding: pad, fontSize: fs, fontWeight: 700,
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {ROUTE_EMOJI[route]} {route}
    </span>
  );
}

// =============================================
// 경로 선택 버튼 그룹
// =============================================
function RouteSelector({ value, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {ROUTES.map(r => {
        const c = ROUTE_COLOR[r];
        const selected = value === r;
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            style={{
              padding: "7px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
              background: selected ? c.color : c.bg,
              color: selected ? "#fff" : c.color,
              border: `2px solid ${selected ? c.color : c.border}`,
            }}
          >
            {ROUTE_EMOJI[r]} {r}
          </button>
        );
      })}
    </div>
  );
}

// =============================================
// 신환 등록 모달
// =============================================
function NewPatientModal({ onClose }) {
  const [route, setRoute] = useState("");
  const [jiinName, setJiinName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [etcMemo, setEtcMemo] = useState("");
  const [date, setDate] = useState(today());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!route) { alert("내원경로를 선택해주세요."); return; }
    if (route === "지인" && !jiinName) { alert("지인 이름을 입력해주세요."); return; }
    if (route === "협력업체" && !partnerName) { alert("협력업체명을 입력해주세요."); return; }
    setLoading(true);
    await supabase.from("new_patients").insert([{
      route,
      jiin_name: route === "지인" ? jiinName : null,
      partner_name: route === "협력업체" ? partnerName : null,
      etc_memo: route === "기타" ? etcMemo : null,
      registered_at: date,
    }]);
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-title">✏️ 신환 등록</div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">내원경로 *</label>
          <div style={{ marginTop: 8 }}>
            <RouteSelector value={route} onChange={r => { setRoute(r); setJiinName(""); setPartnerName(""); setEtcMemo(""); }} />
          </div>
        </div>

        {route === "지인" && (
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ color: ROUTE_COLOR.지인.color }}>🤝 소개해 주신 분 성함 *</label>
            <input
              className="form-input" value={jiinName}
              onChange={e => setJiinName(e.target.value)}
              placeholder="지인 이름 입력"
              style={{ borderColor: ROUTE_COLOR.지인.border }}
              autoFocus
            />
          </div>
        )}

        {route === "협력업체" && (
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ color: ROUTE_COLOR.협력업체.color }}>🏢 협력업체명 *</label>
            <input
              className="form-input" value={partnerName}
              onChange={e => setPartnerName(e.target.value)}
              placeholder="협력업체 이름 입력"
              style={{ borderColor: ROUTE_COLOR.협력업체.border }}
              autoFocus
            />
          </div>
        )}

        {route === "기타" && (
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">📌 기타 내용</label>
            <input
              className="form-input" value={etcMemo}
              onChange={e => setEtcMemo(e.target.value)}
              placeholder="내용 입력 (선택)"
              autoFocus
            />
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">내원일</label>
          <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div className="form-actions">
          <button className="btn btn-secondary" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !route}>
            {loading ? "등록 중..." : "✓ 등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// 대시보드 탭
// =============================================
function DashboardTab({ patients, onRegister }) {
  const thisMonth = today().slice(0, 7);
  const monthly = patients.filter(p => p.registered_at.startsWith(thisMonth));

  // 경로별 카운트 (전체)
  const totalCnt = {};
  ROUTES.forEach(r => totalCnt[r] = 0);
  patients.forEach(p => totalCnt[p.route] = (totalCnt[p.route] || 0) + 1);

  // 경로별 카운트 (이번 달)
  const monthlyCnt = {};
  ROUTES.forEach(r => monthlyCnt[r] = 0);
  monthly.forEach(p => monthlyCnt[p.route] = (monthlyCnt[p.route] || 0) + 1);

  const topRoute = Object.entries(totalCnt).sort((a, b) => b[1] - a[1])[0];
  const recent = [...patients].sort((a, b) => b.registered_at.localeCompare(a.registered_at)).slice(0, 5);
  const monthTotal = monthly.length || 1;

  return (
    <div>
      {/* 통계 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
        <div className="card" style={{ padding: "14px 16px" }}>
          <div className="form-label">전체 신환</div>
          <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>{patients.length}</div>
          <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>명 누적</div>
        </div>
        <div className="card" style={{ padding: "14px 16px" }}>
          <div className="form-label">이번 달</div>
          <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, color: "var(--accent)" }}>{monthly.length}</div>
          <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>명</div>
        </div>
        {topRoute && topRoute[1] > 0 && (
          <div className="card" style={{ padding: "14px 16px" }}>
            <div className="form-label">주요 경로</div>
            <div style={{ fontSize: 17, fontWeight: 700, paddingTop: 4 }}>
              {ROUTE_EMOJI[topRoute[0]]} {topRoute[0]}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>가장 많음</div>
          </div>
        )}
      </div>

      {/* 이번 달 경로별 현황 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-header">
          <div className="section-title">이번 달 내원경로 현황</div>
          <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{thisMonth.replace("-", "년 ")}월</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ROUTES.map(r => (
            <div key={r} style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: ROUTE_COLOR[r].bg, color: ROUTE_COLOR[r].color,
              border: `1.5px solid ${ROUTE_COLOR[r].border}`,
            }}>
              {ROUTE_EMOJI[r]} {r} <strong>{monthlyCnt[r]}명</strong>
              <span style={{ opacity: 0.6, marginLeft: 4 }}>
                ({Math.round(monthlyCnt[r] / monthTotal * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 등록 신환 */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">최근 등록 신환</div>
          <button className="btn btn-primary btn-sm" onClick={onRegister}>+ 신환 등록</button>
        </div>
        {recent.length === 0 ? (
          <div className="empty">등록된 신환이 없습니다</div>
        ) : (
          <div>
            {recent.map(p => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 0", borderBottom: "1px solid var(--border)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <RouteBadge route={p.route} size="sm" />
                  {p.route === "지인" && p.jiin_name && (
                    <span style={{ fontSize: 12, color: ROUTE_COLOR.지인.color }}>· {p.jiin_name}</span>
                  )}
                  {p.route === "협력업체" && p.partner_name && (
                    <span style={{ fontSize: 12, color: ROUTE_COLOR.협력업체.color }}>· {p.partner_name}</span>
                  )}
                  {p.route === "기타" && p.etc_memo && (
                    <span style={{ fontSize: 12, color: ROUTE_COLOR.기타.color }}>· {p.etc_memo}</span>
                  )}
                </div>
                <span style={{ fontSize: 12, color: "var(--ink-muted)", whiteSpace: "nowrap" }}>
                  {formatDate(p.registered_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// 신환 목록 탭
// =============================================
function ListTab({ patients, onDelete }) {
  const [monthFilter, setMonthFilter] = useState("all");

  const months = [...new Set(patients.map(p => p.registered_at.slice(0, 7)))].sort().reverse();
  const filtered = monthFilter === "all"
    ? patients
    : patients.filter(p => p.registered_at.startsWith(monthFilter));
  const sorted = [...filtered].sort((a, b) => b.registered_at.localeCompare(a.registered_at));

  const exportCSV = () => {
    const rows = [["번호", "내원경로", "지인이름", "협력업체", "기타내용", "등록일"]];
    sorted.forEach((p, i) => rows.push([
      sorted.length - i, p.route, p.jiin_name || "", p.partner_name || "", p.etc_memo || "", p.registered_at,
    ]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `신환내원경로_${today()}.csv`;
    a.click();
  };

  return (
    <div>
      <div className="toolbar">
        <select
          className="form-select"
          value={monthFilter}
          onChange={e => setMonthFilter(e.target.value)}
          style={{ width: "auto" }}
        >
          <option value="all">전체</option>
          {months.map(m => (
            <option key={m} value={m}>{m.replace("-", "년 ")}월</option>
          ))}
        </select>
        <span style={{ fontSize: 13, color: "var(--ink-muted)", marginLeft: 4 }}>
          총 {sorted.length}명
        </span>
        <button className="btn btn-secondary btn-sm" style={{ marginLeft: "auto" }} onClick={exportCSV}>
          📥 CSV 다운로드
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="empty">등록된 신환이 없습니다</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 50 }}>번호</th>
                <th>내원경로</th>
                <th>등록일</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr key={p.id}>
                  <td style={{ textAlign: "center", color: "var(--ink-muted)", fontSize: 12 }}>
                    {sorted.length - i}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <RouteBadge route={p.route} size="sm" />
                      {p.route === "지인" && p.jiin_name && (
                        <span style={{ fontSize: 12, color: ROUTE_COLOR.지인.color }}>· {p.jiin_name}</span>
                      )}
                      {p.route === "협력업체" && p.partner_name && (
                        <span style={{ fontSize: 12, color: ROUTE_COLOR.협력업체.color }}>· {p.partner_name}</span>
                      )}
                      {p.route === "기타" && p.etc_memo && (
                        <span style={{ fontSize: 12, color: ROUTE_COLOR.기타.color }}>· {p.etc_memo}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--ink-muted)" }}>{formatDate(p.registered_at)}</td>
                  <td>
                    <button className="btn btn-xs btn-danger" onClick={() => onDelete(p.id)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =============================================
// 통계 탭
// =============================================
function StatsTab({ patients }) {
  const years = [...new Set(patients.map(p => p.registered_at.slice(0, 7).slice(0, 4)))].sort().reverse();
  const [year, setYear] = useState(years[0] || String(new Date().getFullYear()));

  const yearData = patients.filter(p => p.registered_at.startsWith(year));
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);

  // 월별 신환 수
  const monthlyData = months.map(m => yearData.filter(p => p.registered_at.startsWith(m)).length);

  // 경로별 카운트
  const routeCnt = {};
  ROUTES.forEach(r => routeCnt[r] = 0);
  yearData.forEach(p => routeCnt[p.route] = (routeCnt[p.route] || 0) + 1);

  // 기타 상세
  const etcList = yearData.filter(p => p.route === "기타");

  const maxMonthly = Math.max(...monthlyData, 1);

  return (
    <div>
      {/* 연도 선택 */}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <select className="form-select" value={year} onChange={e => setYear(e.target.value)} style={{ width: "auto" }}>
          {(years.length ? years : [String(new Date().getFullYear())]).map(y => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
        <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>총 {yearData.length}명</span>
      </div>

      {/* 월별 신환 수 바 차트 (SVG) */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>📊 월별 신환 수</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140 }}>
          {months.map((m, i) => {
            const val = monthlyData[i];
            const barH = val === 0 ? 4 : Math.max(20, (val / maxMonthly) * 120);
            return (
              <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                {val > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)" }}>{val}</span>}
                <div style={{
                  width: "100%", height: barH, borderRadius: "4px 4px 0 0",
                  background: val > 0 ? "var(--accent)" : "var(--border)", opacity: val > 0 ? 0.85 : 0.4,
                  transition: "height 0.3s",
                }} />
                <span style={{ fontSize: 9, color: "var(--ink-muted)" }}>{i + 1}월</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 경로별 비율 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>🥧 경로별 비율 ({year}년)</div>
        {yearData.length === 0 ? (
          <div className="empty">데이터가 없습니다</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ROUTES.filter(r => routeCnt[r] > 0)
              .sort((a, b) => routeCnt[b] - routeCnt[a])
              .map(r => {
                const pct = Math.round(routeCnt[r] / yearData.length * 100);
                return (
                  <div key={r}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{ROUTE_EMOJI[r]} {r}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: CHART_COLORS[r] }}>
                        {routeCnt[r]}명 ({pct}%)
                      </span>
                    </div>
                    <div style={{ background: "var(--surface2)", borderRadius: 6, height: 8, overflow: "hidden" }}>
                      <div style={{
                        width: `${pct}%`, height: "100%", borderRadius: 6,
                        background: CHART_COLORS[r], transition: "width 0.4s",
                      }} />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* 기타 상세 */}
      {etcList.length > 0 && (
        <div className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>📌 기타 상세 목록</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>번호</th><th>내용</th><th>등록일</th></tr></thead>
              <tbody>
                {[...etcList].sort((a, b) => b.registered_at.localeCompare(a.registered_at)).map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ textAlign: "center", color: "var(--ink-muted)", fontSize: 12 }}>{etcList.length - i}</td>
                    <td style={{ fontSize: 13 }}>{p.etc_memo || <span style={{ color: "var(--ink-muted)" }}>내용 없음</span>}</td>
                    <td style={{ fontSize: 12, color: "var(--ink-muted)" }}>{formatDate(p.registered_at)}</td>
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

// =============================================
// 지인 랭킹 탭
// =============================================
function JiinRankTab({ patients }) {
  const jiinList = patients.filter(p => p.route === "지인" && p.jiin_name);
  const cnt = {};
  jiinList.forEach(p => cnt[p.jiin_name] = (cnt[p.jiin_name] || 0) + 1);
  const ranked = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
  const max = ranked[0]?.[1] || 1;

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-header">
          <div className="section-title">🤝 지인 소개 랭킹</div>
          <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>총 {ranked.length}명</span>
        </div>
        {ranked.length === 0 ? (
          <div className="empty">지인 소개 데이터가 없습니다</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {ranked.map(([name, count], i) => (
              <div key={name}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: i < 3 ? ROUTE_COLOR.지인.color : "var(--surface2)",
                    color: i < 3 ? "#fff" : "var(--ink-muted)",
                    fontSize: 11, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{name}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: ROUTE_COLOR.지인.color,
                    background: "#ede7f6", padding: "2px 10px", borderRadius: 10,
                  }}>
                    {count}명 소개
                  </span>
                </div>
                <div style={{ background: "var(--surface2)", borderRadius: 4, height: 6, overflow: "hidden", marginLeft: 34 }}>
                  <div style={{
                    width: `${(count / max) * 100}%`, height: "100%",
                    background: ROUTE_COLOR.지인.color, borderRadius: 4, transition: "width 0.4s",
                  }} />
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
// 협력업체 랭킹 탭
// =============================================
function PartnerRankTab({ patients }) {
  const partnerList = patients.filter(p => p.route === "협력업체" && p.partner_name);
  const cnt = {};
  partnerList.forEach(p => cnt[p.partner_name] = (cnt[p.partner_name] || 0) + 1);
  const ranked = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
  const max = ranked[0]?.[1] || 1;

  return (
    <div>
      <div className="card">
        <div className="section-header">
          <div className="section-title">🏢 협력업체 랭킹</div>
          <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>총 {ranked.length}곳</span>
        </div>
        {ranked.length === 0 ? (
          <div className="empty">협력업체 데이터가 없습니다</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {ranked.map(([name, count], i) => (
              <div key={name}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: i < 3 ? ROUTE_COLOR.협력업체.color : "var(--surface2)",
                    color: i < 3 ? "#fff" : "var(--ink-muted)",
                    fontSize: 11, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{name}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: ROUTE_COLOR.협력업체.color,
                    background: "#b2dfdb", padding: "2px 10px", borderRadius: 10,
                  }}>
                    {count}명 소개
                  </span>
                </div>
                <div style={{ background: "var(--surface2)", borderRadius: 4, height: 6, overflow: "hidden", marginLeft: 34 }}>
                  <div style={{
                    width: `${(count / max) * 100}%`, height: "100%",
                    background: ROUTE_COLOR.협력업체.color, borderRadius: 4, transition: "width 0.4s",
                  }} />
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
// NEW PATIENTS PAGE
// =============================================
export default function NewPatients({ currentUser }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState("dashboard");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("new_patients")
      .select("*")
      .order("registered_at", { ascending: false });
    setPatients(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("이 신환 기록을 삭제하시겠습니까?")) return;
    await supabase.from("new_patients").delete().eq("id", id);
    load();
  };

  const tabs = [
    { key: "dashboard", label: "📊 대시보드" },
    { key: "list",      label: "📋 신환 목록" },
    { key: "stats",     label: "📈 통계" },
    { key: "jiin",      label: "🤝 지인 랭킹" },
    { key: "partner",   label: "🏢 협력업체" },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">신환 관리</div>
        <div className="page-sub">신환 내원경로 등록 및 통계</div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 신환 등록</button>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty">불러오는 중...</div>
      ) : (
        <>
          {tab === "dashboard" && <DashboardTab patients={patients} onRegister={() => setShowModal(true)} />}
          {tab === "list"      && <ListTab patients={patients} onDelete={handleDelete} />}
          {tab === "stats"     && <StatsTab patients={patients} />}
          {tab === "jiin"      && <JiinRankTab patients={patients} />}
          {tab === "partner"   && <PartnerRankTab patients={patients} />}
        </>
      )}

      {showModal && <NewPatientModal onClose={() => { setShowModal(false); load(); }} />}
    </div>
  );
}
