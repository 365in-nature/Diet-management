import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { today, formatDate, diffDays } from "../lib/dateUtils";

// =============================================
// PLANTS PAGE
// =============================================
export default function Plants({ currentUser }) {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", location: "", memo: "", last_watered_at: today() });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("plants")
      .select("*")
      .order("created_at", { ascending: false });
    setPlants(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({ name: "", location: "", memo: "", last_watered_at: today() });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.name) { alert("식물 이름을 입력해주세요."); return; }
    if (editingId) {
      await supabase.from("plants").update(form).eq("id", editingId);
    } else {
      await supabase.from("plants").insert([form]);
    }
    resetForm();
    load();
  };

  const handleEdit = (plant) => {
    setForm({
      name: plant.name || "",
      location: plant.location || "",
      memo: plant.memo || "",
      last_watered_at: plant.last_watered_at || today(),
    });
    setEditingId(plant.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("이 식물을 삭제하시겠습니까?")) return;
    await supabase.from("plants").delete().eq("id", id);
    load();
  };

  const handleWater = async (plant) => {
    await supabase.from("plants").update({ last_watered_at: today() }).eq("id", plant.id);
    load();
  };

  const getWaterStatus = (lastWatered) => {
    if (!lastWatered) return { label: "기록 없음", color: "var(--ink-muted)", urgent: false };
    const days = diffDays(lastWatered, today());
    if (days === 0) return { label: "오늘 물줌 ✅", color: "var(--accent)", urgent: false };
    if (days <= 2)  return { label: `${days}일 전`, color: "var(--accent)", urgent: false };
    if (days <= 5)  return { label: `${days}일 전`, color: "var(--gold)", urgent: false };
    return { label: `${days}일 전 ⚠️`, color: "var(--warn)", urgent: true };
  };

  const urgentPlants = plants.filter(p => {
    if (!p.last_watered_at) return true;
    return diffDays(p.last_watered_at, today()) > 5;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">식물 관리</div>
        <div className="page-sub">총 {plants.length}개 식물 등록</div>
      </div>

      {/* 긴급 알림 */}
      {urgentPlants.length > 0 && (
        <div className="alert-banner urgent" style={{marginBottom:16}}>
          🌱 물주기가 필요한 식물: {urgentPlants.map(p => p.name).join(", ")}
        </div>
      )}

      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ 식물 등록</button>
      </div>

      {/* 등록/수정 폼 */}
      {showForm && (
        <div className="card" style={{marginBottom:16}}>
          <div className="section-title" style={{marginBottom:16}}>
            {editingId ? "식물 정보 수정" : "새 식물 등록"}
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">식물 이름 *</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="예: 몬스테라" />
            </div>
            <div className="form-group">
              <label className="form-label">위치</label>
              <input className="form-input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="예: 원장실, 대기실" />
            </div>
            <div className="form-group">
              <label className="form-label">마지막 물준 날</label>
              <input className="form-input" type="date" value={form.last_watered_at} onChange={e => setForm({...form, last_watered_at: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">메모</label>
              <input className="form-input" value={form.memo} onChange={e => setForm({...form, memo: e.target.value})} placeholder="특이사항 등" />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary btn-sm" onClick={resetForm}>취소</button>
            <button className="btn btn-primary btn-sm" onClick={handleSubmit}>
              {editingId ? "수정 완료" : "등록"}
            </button>
          </div>
        </div>
      )}

      {/* 식물 목록 */}
      {loading ? <div className="empty">불러오는 중...</div> : (
        <div className="patient-grid">
          {plants.length === 0 && <div className="empty">등록된 식물이 없습니다</div>}
          {plants.map(p => {
            const waterStatus = getWaterStatus(p.last_watered_at);
            return (
              <div key={p.id} className={`patient-card ${waterStatus.urgent ? "alert" : ""}`}>
                <div className="patient-card-header">
                  <div>
                    <div style={{fontSize:24, marginBottom:4}}>🌱</div>
                    <div className="patient-name">{p.name}</div>
                    {p.location && <div className="patient-chart">📍 {p.location}</div>}
                  </div>
                  <div style={{display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end"}}>
                    <span style={{fontSize:12, fontWeight:700, color:waterStatus.color}}>
                      {waterStatus.label}
                    </span>
                    <button className="btn btn-xs btn-danger" onClick={() => handleDelete(p.id)}>삭제</button>
                  </div>
                </div>

                {p.memo && (
                  <div style={{fontSize:12, color:"var(--ink-muted)", marginBottom:10}}>
                    💬 {p.memo}
                  </div>
                )}

                <div style={{display:"flex", gap:8, marginTop:8}}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{flex:1}}
                    onClick={() => handleWater(p)}
                    disabled={p.last_watered_at === today()}
                  >
                    💧 {p.last_watered_at === today() ? "오늘 물줌" : "물주기"}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(p)}>수정</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
