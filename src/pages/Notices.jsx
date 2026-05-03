import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { today, formatDate } from "../lib/dateUtils";

// =============================================
// NOTICES PAGE
// =============================================
export default function Notices({ currentUser }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ title: "", content: "" });
  const [logForm, setLogForm] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("notices")
      .select("*")
      .order("created_at", { ascending: false });
    setNotices(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadLogs = useCallback(async (noticeId) => {
    const { data } = await supabase
      .from("notice_logs")
      .select("*")
      .eq("notice_id", noticeId)
      .order("created_at", { ascending: false });
    setLogs(data || []);
  }, []);

  useEffect(() => {
    if (selected) loadLogs(selected.id);
  }, [selected, loadLogs]);

  const saveNotice = async () => {
    if (!form.title) { alert("제목을 입력해주세요."); return; }
    await supabase.from("notices").insert([{
      title: form.title,
      content: form.content || null,
      created_by: currentUser?.id || null,
    }]);
    setForm({ title: "", content: "" });
    setShowForm(false);
    load();
  };

  const deleteNotice = async (id) => {
    if (!window.confirm("공지사항을 삭제하시겠습니까?")) return;
    await supabase.from("notices").delete().eq("id", id);
    if (selected?.id === id) setSelected(null);
    load();
  };

  const saveLog = async () => {
    if (!logForm.trim()) { alert("내용을 입력해주세요."); return; }
    await supabase.from("notice_logs").insert([{
      notice_id: selected.id,
      content: logForm.trim(),
      created_by: currentUser?.id || null,
    }]);
    setLogForm("");
    loadLogs(selected.id);
  };

  const deleteLog = async (logId) => {
    if (!window.confirm("이 기록을 삭제하시겠습니까?")) return;
    await supabase.from("notice_logs").delete().eq("id", logId);
    loadLogs(selected.id);
  };

  // 상세 보기
  if (selected) {
    return (
      <div>
        <button className="back-btn" onClick={() => setSelected(null)}>← 목록으로</button>
        <div className="page-header">
          <div className="page-title">{selected.title}</div>
          <div className="page-sub">{formatDate(selected.created_at?.split("T")[0])}</div>
        </div>

        {/* 공지 내용 */}
        {selected.content && (
          <div className="card" style={{marginBottom:16}}>
            <div style={{fontSize:14, lineHeight:1.8, whiteSpace:"pre-wrap", color:"var(--ink)"}}>
              {selected.content}
            </div>
          </div>
        )}

        {/* 로그 입력 */}
        <div className="card" style={{marginBottom:16}}>
          <div className="section-header">
            <div className="section-title">📝 업무 기록 추가</div>
          </div>
          <textarea
            style={{
              width:"100%", padding:"10px 12px", border:"1.5px solid var(--border)",
              borderRadius:"var(--r-sm)", fontSize:14, fontFamily:"inherit",
              outline:"none", resize:"vertical", minHeight:80,
            }}
            placeholder="업무 처리 내용을 입력하세요..."
            value={logForm}
            onChange={e => setLogForm(e.target.value)}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
          <div className="form-actions">
            <button className="btn btn-primary btn-sm" onClick={saveLog}>기록 추가</button>
          </div>
        </div>

        {/* 로그 목록 */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">📋 업무 기록</div>
            <span style={{fontSize:12, color:"var(--ink-muted)"}}>{logs.length}건</span>
          </div>
          {logs.length === 0 ? (
            <div className="empty">기록이 없습니다</div>
          ) : (
            <div style={{display:"flex", flexDirection:"column", gap:12}}>
              {logs.map(log => (
                <div key={log.id} style={{
                  background:"var(--surface2)", borderRadius:"var(--r-sm)",
                  padding:"12px 16px", border:"1px solid var(--border)",
                }}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8}}>
                    <div style={{fontSize:14, lineHeight:1.7, whiteSpace:"pre-wrap", flex:1}}>
                      {log.content}
                    </div>
                    <button className="btn btn-xs btn-danger" onClick={() => deleteLog(log.id)}>삭제</button>
                  </div>
                  <div style={{fontSize:11, color:"var(--ink-muted)", marginTop:6}}>
                    {new Date(log.created_at).toLocaleString("ko-KR")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">공지사항</div>
        <div className="page-sub">업무 공지 및 기록 관리</div>
      </div>

      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ 공지 등록</button>
      </div>

      {/* 등록 폼 */}
      {showForm && (
        <div className="card" style={{marginBottom:16}}>
          <div className="section-title" style={{marginBottom:16}}>새 공지사항</div>
          <div className="form-group" style={{marginBottom:12}}>
            <label className="form-label">제목 *</label>
            <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="공지 제목을 입력하세요" />
          </div>
          <div className="form-group">
            <label className="form-label">내용</label>
            <textarea
              style={{width:"100%", padding:"10px 12px", border:"1.5px solid var(--border)", borderRadius:"var(--r-sm)", fontSize:14, fontFamily:"inherit", outline:"none", resize:"vertical", minHeight:100}}
              placeholder="공지 내용을 입력하세요 (선택)"
              value={form.content}
              onChange={e => setForm({...form, content: e.target.value})}
            />
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>취소</button>
            <button className="btn btn-primary btn-sm" onClick={saveNotice}>등록</button>
          </div>
        </div>
      )}

      {/* 목록 */}
      {loading ? <div className="empty">불러오는 중...</div> : (
        <div style={{display:"flex", flexDirection:"column", gap:10}}>
          {notices.length === 0 && <div className="empty">등록된 공지사항이 없습니다</div>}
          {notices.map(n => (
            <div key={n.id} className="card" style={{cursor:"pointer", transition:"all 0.2s"}}
              onClick={() => setSelected(n)}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-light)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:15, fontWeight:700, marginBottom:4}}>{n.title}</div>
                  {n.content && (
                    <div style={{fontSize:13, color:"var(--ink-muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:500}}>
                      {n.content}
                    </div>
                  )}
                  <div style={{fontSize:11, color:"var(--ink-muted)", marginTop:6}}>
                    {new Date(n.created_at).toLocaleString("ko-KR")}
                  </div>
                </div>
                <button className="btn btn-xs btn-danger" style={{marginLeft:12}}
                  onClick={e => { e.stopPropagation(); deleteNotice(n.id); }}>
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
