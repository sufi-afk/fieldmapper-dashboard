const { useState, useEffect } = React;

// ─── API LAYER ───────────────────────────────────────────────
const API = 'http://localhost:4000/api';
let _token = localStorage.getItem('fm_token') || null;
const api = {
  setToken: (t) => { _token = t; t ? localStorage.setItem('fm_token', t) : localStorage.removeItem('fm_token'); },
  getToken: () => _token,
  req: async (method, path, body) => {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(_token ? { Authorization: `Bearer ${_token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },
  get:    (path)       => api.req('GET',    path),
  post:   (path, body) => api.req('POST',   path, body),
  put:    (path, body) => api.req('PUT',    path, body),
  delete: (path)       => api.req('DELETE', path),
};

const FIELD_TYPES = [
  { type: 'text',     label: 'Short Text',      icon: '✏️',  preview: 'Type here...' },
  { type: 'textarea', label: 'Long Text',        icon: '📝',  preview: 'Enter details...' },
  { type: 'number',   label: 'Number',           icon: '🔢',  preview: '0' },
  { type: 'select',   label: 'Dropdown',         icon: '📋',  preview: 'Select option...' },
  { type: 'radio',    label: 'Multiple Choice',  icon: '🔘',  preview: 'Option A / Option B' },
  { type: 'photo',    label: 'Photo Upload',     icon: '📷',  preview: 'Tap to capture photo' },
  { type: 'location', label: 'GPS Location',     icon: '📍',  preview: 'Lat: -- / Lng: --' },
  { type: 'date',     label: 'Date',             icon: '📅',  preview: 'DD / MM / YYYY' },
  { type: 'rating',   label: 'Rating',           icon: '⭐',  preview: '★ ★ ★ ★ ★' },
];

// ─── SHARED COMPONENTS ───────────────────────────────────────
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, []);
  return <div className={`toast ${type}`}>{msg}</div>;
}

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

function Confirm({ title, message, onConfirm, onCancel, danger }) {
  return (
    <div className="confirm-dialog">
      <div className="confirm-box">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {danger ? '🗑 Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [err,   setErr]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !pass) { setErr('Please fill in all fields'); return; }
    setLoading(true); setErr('');
    try {
      const data = await api.post('/auth/login', { email, password: pass });
      if (data.user.role !== 'organiser') {
        setErr('Access denied. Field workers use the Android app.');
        api.setToken(null); return;
      }
      api.setToken(data.token);
      onLogin(data.user);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="login-wrap">
      <div className="login-card fade-up">
        <div className="login-logo">
          <div className="icon-wrap">📍</div>
          <h1>FieldMapper</h1>
          <p>Organiser Dashboard</p>
        </div>
        <div style={{background:'rgba(37,99,235,0.12)',border:'1px solid rgba(37,99,235,0.25)',borderRadius:10,padding:'10px 14px',marginBottom:24,display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:18}}>🏢</span>
          <span style={{color:'#93C5FD',fontSize:13,fontWeight:500}}>Organiser access only. Field workers use the Android app.</span>
        </div>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>
        {err && <p style={{color:'#F87171',fontSize:13,marginBottom:12}}>⚠️ {err}</p>}
        <button className="login-btn" onClick={handleLogin} disabled={loading}>{loading ? 'Signing in...' : 'Sign in →'}</button>
        <p style={{textAlign:'center',color:'#475569',fontSize:12,marginTop:16}}>Default: admin@fieldmapper.com / admin1234</p>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────
function Sidebar({ page, setPage, user, onLogout }) {
  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard'    },
    { id: 'surveys',   icon: '📋', label: 'Surveys'      },
    { id: 'builder',   icon: '🔨', label: 'Form Builder' },
    { id: 'responses', icon: '📥', label: 'Responses'    },
    { id: 'workers',   icon: '👷', label: 'Field Workers'},
  ];
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h1>Field<span>Mapper</span></h1>
        <p>Organiser Dashboard</p>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-label">Main</div>
        {navItems.map(n => (
          <div key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
            <span className="icon">{n.icon}</span>{n.label}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-chip" onClick={onLogout} title="Click to logout">
          <div className="avatar">{user.name[0]}</div>
          <div>
            <div className="name">{user.name}</div>
            <div className="role">Organiser · Logout</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div style={{padding: 24}}>
      <div className="skeleton skeleton-title"></div>
      {[1,2,3].map(i => <div key={i} className="skeleton skeleton-box"></div>)}
    </div>
  );
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────
function DashboardPage({ setPage }) {
  const [stats, setStats]         = useState(null);
  const [surveys, setSurveys]     = useState([]);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([api.get('/stats'), api.get('/surveys'), api.get('/responses')])
      .then(([s, sv, r]) => { setStats(s); setSurveys(sv); setResponses(r); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="content-full">
      <div className="stats-grid" style={{marginBottom: 24}}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-box" style={{height: 120}}></div>)}
      </div>
      <div className="skeleton skeleton-box" style={{height: 300}}></div>
    </div>
  );

  return (
    <div className="fade-up">
      <div className="page-header">
        <div><h2>Dashboard Overview</h2><p>All your surveys and field activity at a glance</p></div>
        <button className="btn btn-primary" onClick={() => setPage('builder')}>+ New Survey</button>
      </div>
      <div className="stats-grid" style={{marginTop:24}}>
        {[
          { label: 'Active Surveys',  value: stats?.active_surveys  ?? 0, sub: 'Live now',        icon: '📋', cls: 'blue'   },
          { label: 'Total Responses', value: stats?.total_responses ?? 0, sub: 'All time',        icon: '📥', cls: 'green'  },
          { label: 'Field Workers',   value: stats?.total_workers   ?? 0, sub: 'Registered',      icon: '👷', cls: 'orange' },
          { label: 'Total Surveys',   value: stats?.total_surveys   ?? 0, sub: 'Created by you',  icon: '🎯', cls: 'purple' },
        ].map((s, i) => (
          <div key={i} className={`stat-card ${s.cls}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
            <div className="stat-icon">{s.icon}</div>
          </div>
        ))}
      </div>
      <div className="content-grid">
        <div className="card">
          <div className="card-header">
            <h3>Your Surveys</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('surveys')}>View all →</button>
          </div>
          {surveys.length === 0
            ? <div className="empty-state"><div className="empty-icon">📋</div><p>No surveys yet. Create one!</p></div>
            : <table className="table">
                <thead><tr><th>Survey</th><th>Status</th><th>Responses</th></tr></thead>
                <tbody>{surveys.slice(0, 5).map(s => (
                  <tr key={s.id}>
                    <td><div style={{fontWeight:600,fontSize:13}}>{s.title}</div><div style={{color:'var(--muted)',fontSize:11.5}}>{(s.fields||[]).length} fields</div></td>
                    <td><span className={`badge badge-${s.status==='active'?'green':s.status==='draft'?'gray':'blue'}`}><span className="dot"/>{s.status.charAt(0).toUpperCase()+s.status.slice(1)}</span></td>
                    <td style={{fontFamily:"'DM Mono',monospace"}}>{s.responses || 0}</td>
                  </tr>
                ))}</tbody>
              </table>
          }
        </div>
        <div className="card">
          <div className="card-header"><h3>Recent Responses</h3><span className="badge badge-green"><span className="dot"/>Live</span></div>
          <div className="card-body" style={{padding:'12px 16px'}}>
            {responses.length === 0
              ? <div className="empty-state"><div className="empty-icon">📥</div><p>No responses yet</p></div>
              : responses.slice(0, 6).map((r, i) => (
                <div key={r.id} className="activity-item">
                  <div className={`activity-dot ${['blue','green','orange'][i%3]}`}>{['📥','📍','👷'][i%3]}</div>
                  <div className="activity-text">
                    <strong>{r.worker_name}</strong> submitted<br/>
                    <span style={{color:'var(--muted)'}}>{r.survey_title}</span>
                    <div className="activity-time">{new Date(r.submitted_at).toLocaleString()}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SURVEYS PAGE ─────────────────────────────────────────────
function SurveysPage({ setPage, toast }) {
  const [surveys, setSurveys]               = useState([]);
  const [search, setSearch]                 = useState('');
  const [filter, setFilter]                 = useState('all');
  const [loading, setLoading]               = useState(true);
  const [confirmDelete, setConfirmDelete]   = useState(null);
  const [assignModal, setAssignModal]       = useState(null);
  const [workers, setWorkers]               = useState([]);
  const [selectedWorker, setSelectedWorker] = useState('');

  useEffect(() => {
    api.get('/surveys').then(setSurveys).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = surveys.filter(s =>
    (filter === 'all' || s.status === filter) &&
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    try {
      await api.delete(`/surveys/${confirmDelete.id}`);
      setSurveys(prev => prev.filter(s => s.id !== confirmDelete.id));
      toast(`"${confirmDelete.title}" deleted.`, 'success');
    } catch (e) { toast(e.message, 'error'); }
    setConfirmDelete(null);
  };

  const openAssign = async (survey) => {
    setAssignModal(survey); setSelectedWorker('');
    try { setWorkers(await api.get('/users/workers')); }
    catch (e) { toast('Could not load workers', 'error'); }
  };

  const handleAssign = async () => {
    if (!selectedWorker) { toast('Select a worker first', 'error'); return; }
    try {
      await api.post(`/surveys/${assignModal.id}/assign`, { worker_id: parseInt(selectedWorker) });
      toast('Assigned successfully!', 'success');
      setAssignModal(null);
      const updated = await api.get('/surveys');
      setSurveys(updated);
    } catch (e) { toast(e.message, 'error'); }
  };

  const toggleStatus = async (survey) => {
    const nextStatus = survey.status === 'active' ? 'draft' : 'active';
    try {
      await api.put(`/surveys/${survey.id}`, { ...survey, fields: survey.fields || [], status: nextStatus });
      setSurveys(prev => prev.map(s => s.id === survey.id ? { ...s, status: nextStatus } : s));
      toast(`Survey marked as ${nextStatus}`, 'success');
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="fade-up">
      <div className="page-header">
        <div><h2>Surveys</h2><p>Manage all your survey forms</p></div>
        <button className="btn btn-primary" onClick={() => setPage('builder')}>+ Create Survey</button>
      </div>
      <div className="content-full">
        <div className="filter-bar">
          <div className="search-bar">
            <span>🔍</span>
            <input placeholder="Search surveys..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="chip-row">
            {['all','active','draft','complete'].map(f => (
              <div key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          {loading
            ? <SkeletonTable />
            : filtered.length === 0
              ? <div className="empty-state"><div className="empty-icon">📋</div><p>No surveys found</p></div>
              : <table className="table">
                  <thead><tr><th>Survey Name</th><th>Fields</th><th>Responses</th><th>Assigned To</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
                  <tbody>{filtered.map(s => {
                    const assignees = s.assigned_workers || [];
                    return (
                    <tr key={s.id}>
                      <td style={{fontWeight:600}}>{s.title}</td>
                      <td style={{fontFamily:"'DM Mono',monospace"}}>{(s.fields||[]).length}</td>
                      <td style={{fontFamily:"'DM Mono',monospace"}}>{s.responses || 0}</td>
                      <td>
                        {assignees.length === 0
                          ? <span style={{color:'var(--muted)',fontSize:12}}>Not assigned</span>
                          : <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                              {assignees.map(w => (
                                <span key={w.id} style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(99,102,241,0.15)',color:'#A5B4FC',border:'1px solid rgba(99,102,241,0.3)',borderRadius:20,padding:'3px 10px',fontSize:12,fontWeight:600}}>
                                  <span style={{width:18,height:18,borderRadius:'50%',background:'linear-gradient(135deg, var(--indigo), var(--purple))',color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:10}}>{w.name[0]}</span>
                                  {w.name}
                                </span>
                              ))}
                            </div>
                        }
                      </td>
                      <td>
                        <span className={`badge badge-${s.status==='active'?'green':s.status==='complete'?'blue':'gray'}`}
                          onClick={() => toggleStatus(s)} title="Click to toggle status" style={{cursor:'pointer'}}>
                          <span className="dot"/>
                          {s.status === 'complete' ? '✓ Complete' : s.status.charAt(0).toUpperCase()+s.status.slice(1)}
                        </span>
                      </td>
                      <td style={{color:'var(--muted)',fontSize:12}}>{new Date(s.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{display:'flex',gap:6}}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openAssign(s)}>👷 Assign</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(s)}>🗑 Delete</button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}</tbody>
                </table>
          }
        </div>
      </div>

      {confirmDelete && (
        <Confirm title="Delete Survey"
          message={`Delete "${confirmDelete.title}"? This permanently removes all responses too.`}
          onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} danger />
      )}

      {assignModal && (
        <Modal title={`Assign: ${assignModal.title}`} onClose={() => setAssignModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setAssignModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAssign}>Assign Worker</button>
          </>}>
          <div className="form-group">
            <label className="form-label">Select Field Worker</label>
            <select className="form-select" value={selectedWorker} onChange={e => setSelectedWorker(e.target.value)}>
              <option value="">-- Choose a worker --</option>
              {workers.map(w => <option key={w.id} value={w.id}>{w.name} {w.username ? `(@${w.username})` : ''}</option>)}
            </select>
          </div>
          <div style={{background:'var(--blue-lt)',borderRadius:8,padding:12,fontSize:13,color:'var(--blue)'}}>
            📱 The worker will see this survey on their Android app immediately after assignment.
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── FORM BUILDER ─────────────────────────────────────────────
function BuilderPage({ toast, setPage }) {
  const [fields,   setFields]   = useState([
    { id: 1, type: 'text',     label: 'Site Name',    required: true  },
    { id: 2, type: 'location', label: 'GPS Location', required: true  },
    { id: 3, type: 'photo',    label: 'Site Photo',   required: false },
  ]);
  const [selected,     setSelected]     = useState(null);
  const [title,        setTitle]        = useState('New Survey Form');
  const [category,     setCategory]     = useState('Infrastructure');
  const [showPreview,  setShowPreview]  = useState(false);

  const addField    = (type) => { const ft = FIELD_TYPES.find(f => f.type === type); setFields(prev => [...prev, { id: Date.now(), type, label: ft.label, required: false }]); };
  const removeField = (id)   => { setFields(prev => prev.filter(f => f.id !== id)); setSelected(null); };
  const updateField = (id, key, val) => setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: val } : f));
  const sel = fields.find(f => f.id === selected);

  const saveSurvey = async () => {
    if (!title.trim())    { toast('Please enter a survey title', 'error'); return; }
    if (!fields.length)   { toast('Add at least one field', 'error');      return; }
    try {
      await api.post('/surveys', { title, category, fields, status: 'active' });
      toast('Survey saved! Redirecting...', 'success');
      setTimeout(() => setPage('surveys'), 1200);
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="fade-up">
      <div className="page-header" style={{marginBottom:16}}>
        <div>
          <input value={title} onChange={e => setTitle(e.target.value)}
            style={{fontSize:22,fontWeight:700,border:'none',background:'transparent',outline:'none',letterSpacing:'-0.4px',fontFamily:'inherit',width:400}}/>
          <p>Click field types to add them to your form</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-secondary" onClick={() => setShowPreview(true)}>👁 Preview</button>
          <button className="btn btn-primary"   onClick={saveSurvey}>💾 Save Survey</button>
        </div>
      </div>

      <div className="builder-layout" style={{margin:'0 32px 32px'}}>
        <div className="builder-panel">
          <div style={{padding:'12px 16px',fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.08em',borderBottom:'1px solid var(--border)'}}>Field Types</div>
          {FIELD_TYPES.map(ft => (
            <div key={ft.type} className="field-type-item" onClick={() => addField(ft.type)}>
              <span className="ficon">{ft.icon}</span>{ft.label}
            </div>
          ))}
        </div>

        <div className="builder-canvas">
          <div style={{maxWidth:560,margin:'0 auto'}}>
            <div style={{background:'rgba(255,255,255,0.03)',backdropFilter:'blur(10px)',borderRadius:16,padding:'18px 24px',border:'1px solid rgba(255,255,255,0.08)',marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Form Title</div>
              <div style={{fontSize:18,fontWeight:600,color:'#fff'}}>{title}</div>
            </div>
            {fields.length === 0 && <div className="drop-zone"><div style={{fontSize:32,marginBottom:8}}>📋</div>Click a field type on the left to add it here</div>}
            {fields.map(f => {
              const ft = FIELD_TYPES.find(t => t.type === f.type);
              return (
                <div key={f.id} className={`canvas-field ${selected === f.id ? 'selected' : ''}`} onClick={() => setSelected(f.id)}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                    <span style={{fontSize:14}}>{ft?.icon}</span>
                    <div className="field-label">{f.label}</div>
                    {f.required && <span className="badge badge-red" style={{fontSize:10,padding:'1px 6px'}}>Required</span>}
                  </div>
                  <div className="field-preview">{ft?.preview}</div>
                  <button className="del-btn" onClick={e => { e.stopPropagation(); removeField(f.id); }}>✕ Remove</button>
                </div>
              );
            })}
            <div style={{textAlign:'center',color:'var(--muted)',fontSize:13,marginTop:8}}>{fields.length} field{fields.length !== 1 ? 's' : ''} · Click any field to edit →</div>
          </div>
        </div>

        <div className="builder-props">
          <div style={{fontSize:12,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:16}}>{sel ? 'Field Properties' : 'Form Properties'}</div>
          {!sel && (<>
            <div className="form-group">
              <label className="form-label">Survey Title</label>
              <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                <option>Infrastructure</option><option>Environment</option><option>Social</option><option>Health</option><option>Other</option>
              </select>
            </div>
            <div style={{padding:14,background:'rgba(99,102,241,0.1)',borderRadius:12,fontSize:13,color:'#A5B4FC',border:'1px solid rgba(99,102,241,0.2)'}}>💡 Click any field in the canvas to edit its properties</div>
          </>)}
          {sel && (<>
            <div className="form-group">
              <label className="form-label">Field Label</label>
              <input className="form-input" value={sel.label} onChange={e => updateField(sel.id, 'label', e.target.value)} />
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderTop:'1px solid var(--border)',marginTop:8}}>
              <label className="form-label" style={{margin:0}}>Required Field</label>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:12,color:'var(--muted)'}}>{sel.required ? 'Yes' : 'No'}</span>
                <div onClick={() => updateField(sel.id, 'required', !sel.required)}
                  style={{width:36,height:20,borderRadius:10,cursor:'pointer',background:sel.required?'var(--indigo)':'rgba(255,255,255,0.1)',position:'relative',transition:'background 0.2s'}}>
                  <div style={{position:'absolute',width:16,height:16,borderRadius:'50%',background:'#fff',top:2,left:sel.required?18:2,transition:'left 0.2s'}}/>
                </div>
              </div>
            </div>
            <button className="btn btn-danger btn-sm" style={{marginTop:12,width:'100%'}} onClick={() => removeField(sel.id)}>🗑️ Remove Field</button>
          </>)}
        </div>
      </div>

      {showPreview && (
        <Modal title={`Preview: ${title}`} onClose={() => setShowPreview(false)}>
          <div style={{background:'var(--bg)',borderRadius:10,padding:'16px 20px',marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>Form Title</div>
            <div style={{fontSize:16,fontWeight:700}}>{title}</div>
            <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>{category} · {fields.length} fields</div>
          </div>
          {fields.length === 0
            ? <div style={{textAlign:'center',padding:32,color:'var(--muted)'}}>No fields added yet.</div>
            : fields.map(f => {
                const ft = FIELD_TYPES.find(t => t.type === f.type);
                return (
                  <div key={f.id} style={{marginBottom:16}}>
                    <div style={{fontSize:13,fontWeight:600,marginBottom:6,display:'flex',alignItems:'center',gap:6}}>
                      <span>{ft?.icon}</span>{f.label}
                      {f.required && <span style={{background:'rgba(244,63,94,0.15)',color:'#FDA4AF',fontSize:10,padding:'2px 6px',borderRadius:4,fontWeight:700}}>Required</span>}
                    </div>
                    <div style={{border:'1.5px solid var(--border)',borderRadius:8,padding:'10px 14px',fontSize:13,color:'var(--muted)',background:'var(--surface)'}}>{ft?.preview}</div>
                  </div>
                );
              })
          }
          <div style={{marginTop:20,padding:'14px 18px',background:'rgba(99,102,241,0.1)',borderRadius:12,fontSize:13,color:'#A5B4FC',border:'1px solid rgba(99,102,241,0.2)'}}>
            📱 This is how the form will look on the Android app when workers fill it.
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── RESPONSES PAGE ───────────────────────────────────────────
function ResponsesPage() {
  const [responses, setResponses] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);
  const [showJson,  setShowJson]  = useState(false);

  useEffect(() => { api.get('/responses').then(setResponses).catch(console.error).finally(() => setLoading(false)); }, []);

  const openResponse = (r) => { setSelected(r); setShowJson(false); };

  // ── Leaflet map — setTimeout ensures div is painted before Leaflet attaches ──
  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      const pins  = responses.filter(r => r.latitude && r.longitude);
      const mapEl = document.getElementById('response-map');
      if (!mapEl || !window.L) return;

      // Destroy previous instance
      if (mapEl._mapInstance) {
        try { mapEl._mapInstance.remove(); } catch(e) {}
        mapEl._mapInstance = null;
      }
      if (mapEl._leaflet_id) {
        mapEl._leaflet_id = null;
        mapEl.innerHTML = '';
      }

      const map = window.L.map('response-map', { zoomControl: true });
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 19,
      }).addTo(map);

      mapEl._mapInstance = map;

      if (pins.length === 0) {
        map.setView([28.6, 77.2], 5);
        return;
      }

      const icon = window.L.divIcon({
        className: '',
        html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#2563EB;border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(37,99,235,0.5);"></div>`,
        iconSize: [22, 22], iconAnchor: [11, 22], popupAnchor: [0, -24],
      });

      const bounds = [];
      pins.forEach(r => {
        const lat = parseFloat(r.latitude);
        const lng = parseFloat(r.longitude);
        bounds.push([lat, lng]);
        const photoHtml = r.photo_url && (r.photo_url.startsWith('http') || r.photo_url.startsWith('data:'))
          ? `<img src="${r.photo_url}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;margin-bottom:6px;display:block;"/>`
          : '';
        window.L.marker([lat, lng], { icon }).addTo(map).bindPopup(`
          <div style="font-family:sans-serif;min-width:160px;">
            ${photoHtml}
            <div style="font-weight:700;font-size:13px;margin-bottom:2px;">${r.survey_title || 'Survey'}</div>
            <div style="color:#64748B;font-size:11px;margin-bottom:2px;">👷 ${r.worker_name || '—'}</div>
            <div style="color:#94A3B8;font-size:10px;">${new Date(r.submitted_at).toLocaleString()}</div>
          </div>
        `, { maxWidth: 200 });
      });

      bounds.length === 1
        ? map.setView(bounds[0], 15)
        : map.fitBounds(bounds, { padding: [40, 40] });
    }, 150);

    return () => {
      clearTimeout(timer);
      const mapEl = document.getElementById('response-map');
      if (mapEl && mapEl._mapInstance) {
        try { mapEl._mapInstance.remove(); } catch(e) {}
        mapEl._mapInstance = null;
      }
    };
  }, [responses, loading]);

  const exportCSV = (data) => {
    const answerKeys = [...new Set(data.flatMap(r => r.answers && typeof r.answers === 'object' ? Object.keys(r.answers) : []))];
    const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const headers = ['#', 'Survey', 'Field Worker', 'Latitude', 'Longitude', 'Submitted', ...answerKeys];
    const rows = data.map(r => [r.id, escape(r.survey_title), escape(r.worker_name),
      r.latitude ? Number(r.latitude).toFixed(6) : '', r.longitude ? Number(r.longitude).toFixed(6) : '',
      escape(new Date(r.submitted_at).toLocaleString()), ...answerKeys.map(k => escape(r.answers?.[k] ?? '')),
    ]);
    const csv  = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `FieldMapper_Responses_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-up">
      <div className="page-header">
        <div><h2>Survey Responses</h2><p>All submitted field data</p></div>
        <button className="btn btn-secondary" onClick={() => exportCSV(responses)} disabled={responses.length === 0}>⬇️ Export CSV</button>
      </div>
      <div className="content-full">

        {/* ── Live Map ── */}
        <div style={{borderRadius:16,overflow:'hidden',border:'1px solid var(--border)',marginBottom:20,position:'relative',height:400}}>
          <div id="response-map" style={{width:'100%',height:'100%'}}/>
          {!loading && responses.filter(r => r.latitude).length > 0 && (
            <div style={{position:'absolute',top:10,right:10,zIndex:1000,background:'rgba(255,255,255,0.95)',borderRadius:8,padding:'5px 12px',fontSize:12,fontWeight:600,color:'#1D4ED8',boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>
              📍 {responses.filter(r => r.latitude).length} locations mapped
            </div>
          )}
        </div>

        {/* ── Table ── */}
        <div className="card">
          <div className="card-header"><h3>All Responses ({responses.length})</h3></div>
          {loading
            ? <SkeletonTable />
            : responses.length === 0
              ? <div className="empty-state"><div className="empty-icon">📥</div><p>No responses yet</p></div>
              : <table className="table">
                  <thead><tr><th>#</th><th>Survey</th><th>Field Worker</th><th>Location</th><th>Submitted</th><th></th></tr></thead>
                  <tbody>{responses.map(r => (
                    <tr key={r.id}>
                      <td style={{fontFamily:"'DM Mono',monospace",color:'var(--muted)',fontSize:12}}>#{String(r.id).padStart(4,'0')}</td>
                      <td style={{fontWeight:600,fontSize:13}}>{r.survey_title}</td>
                      <td>{r.worker_name}</td>
                      <td style={{fontFamily:"'DM Mono',monospace",fontSize:11.5,color:'var(--muted)'}}>
                        {r.latitude ? `${Number(r.latitude).toFixed(4)}°, ${Number(r.longitude).toFixed(4)}°` : '—'}
                      </td>
                      <td style={{color:'var(--muted)',fontSize:12}}>{new Date(r.submitted_at).toLocaleString()}</td>
                      <td><button className="btn btn-ghost btn-sm" onClick={() => openResponse(r)}>View →</button></td>
                    </tr>
                  ))}</tbody>
                </table>
          }
        </div>
      </div>

      {selected && (
        <Modal title={`Response #${String(selected.id).padStart(4,'0')}`} onClose={() => setSelected(null)}
          footer={<button className="btn btn-secondary" onClick={() => setShowJson(j => !j)}>{showJson ? '📋 Show Fields' : '{ } View JSON'}</button>}>
          {selected.photo_url && (selected.photo_url.startsWith('data:image') || selected.photo_url.startsWith('http')) && (
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,color:'var(--muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Site Photo</div>
              <img src={selected.photo_url} alt="Site photo"
                style={{width:'100%',maxHeight:300,objectFit:'cover',borderRadius:10,border:'1px solid var(--border)',cursor:'pointer'}}
                onClick={() => window.open(selected.photo_url, '_blank')} title="Click to open full size"/>
              <div style={{fontSize:11,color:'var(--muted)',marginTop:4,textAlign:'center'}}>Click to open full size</div>
            </div>
          )}
          {[['Survey', selected.survey_title], ['Worker', selected.worker_name]].map(([label, val]) => (
            <div key={label} style={{marginBottom:12}}>
              <div style={{fontSize:12,color:'var(--muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>{label}</div>
              <div style={{fontWeight:600}}>{val}</div>
            </div>
          ))}
          {selected.latitude && (
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,color:'var(--muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>GPS Location</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:13}}>{Number(selected.latitude).toFixed(6)}°, {Number(selected.longitude).toFixed(6)}°</div>
            </div>
          )}
          {showJson ? (
            <div>
              <div style={{fontSize:12,color:'var(--muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Raw JSON</div>
              <pre style={{background:'#0F172A',color:'#93C5FD',borderRadius:10,padding:16,fontSize:12,overflowX:'auto',lineHeight:1.6,maxHeight:360,overflowY:'auto'}}>
                {JSON.stringify({id:selected.id,survey:selected.survey_title,worker:selected.worker_name,latitude:selected.latitude,longitude:selected.longitude,submitted_at:selected.submitted_at,answers:selected.answers},null,2)}
              </pre>
            </div>
          ) : (
            <div>
              <div style={{fontSize:12,color:'var(--muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Answers</div>
              {selected.answers && typeof selected.answers === 'object'
                ? Object.entries(selected.answers).map(([k, v]) => (
                    <div key={k} style={{background:'var(--bg)',borderRadius:8,padding:'10px 14px',marginBottom:8}}>
                      <div style={{fontSize:11.5,fontWeight:700,color:'var(--muted)',marginBottom:4}}>{k}</div>
                      {typeof v === 'string' && (v.startsWith('data:image') || v.startsWith('http'))
                        ? <img src={v} alt={k} style={{width:'100%',maxHeight:220,objectFit:'cover',borderRadius:6,cursor:'pointer'}} onClick={() => window.open(v,'_blank')} />
                        : typeof v === 'string' && v.includes('/storage/emulated')
                          ? <div style={{fontSize:12,color:'var(--muted)',background:'#FEF9C3',padding:'6px 8px',borderRadius:6,border:'1px solid #FDE047'}}>📷 Photo on device (old submission)</div>
                          : <div style={{fontSize:14}}>{v || '—'}</div>
                      }
                    </div>
                  ))
                : <div style={{color:'var(--muted)',fontSize:13}}>No answer data</div>
              }
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ─── WORKERS PAGE ─────────────────────────────────────────────
function WorkersPage({ toast }) {
  const [workers,   setWorkers]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name,      setName]      = useState('');
  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);

  useEffect(() => { api.get('/users/workers').then(setWorkers).catch(console.error).finally(() => setLoading(false)); }, []);

  const closeModal = () => { setShowModal(false); setName(''); setUsername(''); setPassword(''); setShowPass(false); };

  const addWorker = async () => {
    if (!name || !username || !password) { toast('All fields are required', 'error'); return; }
    if (password.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
    try {
      const res = await api.post('/users/invite', { name, username, password });
      setWorkers(prev => [res.user, ...prev]);
      toast(`Worker "${res.user.name}" created! They can log in as: ${res.user.username}`, 'success');
      closeModal();
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="fade-up">
      <div className="page-header">
        <div><h2>Field Workers</h2><p>Manage your survey team</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Worker</button>
      </div>
      <div className="content-full">
        <div className="card">
          {loading
            ? <SkeletonTable />
            : workers.length === 0
              ? <div className="empty-state"><div className="empty-icon">👷</div><p>No workers yet. Add one!</p></div>
              : <table className="table">
                  <thead><tr><th>Worker</th><th>Username</th><th>Surveys</th><th>Responses</th><th>Joined</th></tr></thead>
                  <tbody>{workers.map(w => (
                    <tr key={w.id}>
                      <td><div style={{display:'flex',alignItems:'center',gap:10}}><div className="avatar" style={{width:32,height:32,fontSize:12}}>{w.name[0]}</div><span style={{fontWeight:600}}>{w.name}</span></div></td>
                      <td><span style={{fontFamily:"'DM Mono',monospace",fontSize:12,background:'rgba(255,255,255,0.05)',padding:'4px 10px',borderRadius:8,border:'1px solid var(--border)'}}>@{w.username || '—'}</span></td>
                      <td style={{fontFamily:"'DM Mono',monospace"}}>{w.surveys || 0}</td>
                      <td style={{fontFamily:"'DM Mono',monospace"}}>{w.responses || 0}</td>
                      <td style={{color:'var(--muted)',fontSize:12}}>{new Date(w.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}</tbody>
                </table>
          }
        </div>
      </div>

      {showModal && (
        <Modal title="Add Field Worker" onClose={closeModal}
          footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={addWorker}>Create Worker</button></>}>
          <div style={{background:'var(--blue-lt)',borderRadius:8,padding:'10px 14px',fontSize:13,color:'var(--blue)',marginBottom:20,display:'flex',gap:8,alignItems:'flex-start'}}>
            <span>📱</span><span>The worker will use these credentials to log in on the Android app.</span>
          </div>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="e.g. Ali Hassan" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--muted)',fontSize:14}}>@</span>
              <input className="form-input" placeholder="alihassan" style={{paddingLeft:28,fontFamily:"'DM Mono',monospace"}}
                value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g,''))} />
            </div>
            <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>Lowercase only, no spaces.</div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{position:'relative'}}>
              <input className="form-input" type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters"
                style={{paddingRight:44}} value={password} onChange={e => setPassword(e.target.value)} />
              <button onClick={() => setShowPass(p => !p)}
                style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:16,color:'var(--muted)'}}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          {name && username && password && (
            <div style={{background:'#F0FDF4',border:'1px solid #86EFAC',borderRadius:8,padding:'10px 14px',fontSize:12.5,color:'#166534',marginTop:4}}>
              <div style={{fontWeight:700,marginBottom:4}}>✅ Login credentials preview</div>
              <div>Username: <strong style={{fontFamily:'monospace'}}>@{username}</strong></div>
              <div>Password: <strong style={{fontFamily:'monospace'}}>{showPass ? password : '••••••'}</strong></div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────
function App() {
  const [user,     setUser]     = useState(null);
  const [page,     setPage]     = useState('dashboard');
  const [toastMsg, setToastMsg] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (api.getToken()) {
      api.get('/auth/me').then(u => setUser(u)).catch(() => api.setToken(null)).finally(() => setChecking(false));
    } else { setChecking(false); }
  }, []);

  const showToast    = (msg, type = 'success') => setToastMsg({ msg, type });
  const handleLogout = () => { api.setToken(null); setUser(null); setPage('dashboard'); };

  if (checking) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#64748B'}}>Loading...</div>;
  if (!user)    return <LoginPage onLogin={setUser} />;

  const pages = {
    dashboard: <DashboardPage setPage={setPage} />,
    surveys:   <SurveysPage   setPage={setPage} toast={showToast} />,
    builder:   <BuilderPage   setPage={setPage} toast={showToast} />,
    responses: <ResponsesPage />,
    workers:   <WorkersPage   toast={showToast} />,
  };

  return (
    <div className="app-layout">
      <Sidebar page={page} setPage={setPage} user={user} onLogout={handleLogout} />
      <main className="main" style={{padding:'0 0 32px'}}>
        <div key={page} className="page-animate">
          {pages[page]}
        </div>
      </main>
      {toastMsg && <Toast {...toastMsg} onDone={() => setToastMsg(null)} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);