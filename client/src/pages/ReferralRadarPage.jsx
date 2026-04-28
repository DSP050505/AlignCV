import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { referralApi } from '../api/referralApi';
import { resumeApi } from '../api/resumeApi';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { ChevronLeft, Check, Loader2, Upload, Send, Copy, ExternalLink, Search, Radar, Briefcase, FileText, Users, ArrowRight, X, Download } from 'lucide-react';
import { useEffect } from 'react';

const C = { bg:'#070c1a', card:'rgba(10,17,38,0.95)', border:'rgba(99,102,241,0.3)', primary:'#6366f1', primaryLight:'#818cf8', text:'#e8eaf6', textSec:'rgba(148,151,255,0.7)', success:'#10b981', warning:'#f59e0b', danger:'#ef4444' };
const badgeColors = { '1st':{ bg:'rgba(16,185,129,0.15)', border:'rgba(16,185,129,0.4)', text:'#6ee7b7' }, '2nd':{ bg:'rgba(245,158,11,0.15)', border:'rgba(245,158,11,0.4)', text:'#fcd34d' }, cold:{ bg:'rgba(99,102,241,0.15)', border:'rgba(99,102,241,0.4)', text:'#a5b4fc' } };

export default function ReferralRadarPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [stage, setStage] = useState(() => parseInt(sessionStorage.getItem('rr_stage')) || 1);
  const [jobUrl, setJobUrl] = useState(() => sessionStorage.getItem('rr_jobUrl') || '');
  const [manualJd, setManualJd] = useState(() => sessionStorage.getItem('rr_manualJd') || '');
  const [showManual, setShowManual] = useState(() => sessionStorage.getItem('rr_showManual') === 'true');
  const [jobData, setJobData] = useState(() => JSON.parse(sessionStorage.getItem('rr_jobData')) || null);
  const [loading, setLoading] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(() => JSON.parse(sessionStorage.getItem('rr_selectedResume')) || null);
  const [csvFile, setCsvFile] = useState(null);
  const [connections, setConnections] = useState(() => JSON.parse(sessionStorage.getItem('rr_connections')) || []);
  const [sessionId, setSessionId] = useState(() => sessionStorage.getItem('rr_sessionId') || null);
  const [selected, setSelected] = useState(new Set());
  const [sendModal, setSendModal] = useState(false);
  const [sendStep, setSendStep] = useState(0);
  const [sentIds, setSentIds] = useState(new Set());
  const [previewPerson, setPreviewPerson] = useState(null);
  const [editedMessages, setEditedMessages] = useState({});
  const [extInstalled, setExtInstalled] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef(null);

  const stages = ['Job','Resume','Connections','Outreach'];

  // Persist state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('rr_stage', stage);
    sessionStorage.setItem('rr_jobUrl', jobUrl);
    sessionStorage.setItem('rr_manualJd', manualJd);
    sessionStorage.setItem('rr_showManual', showManual);
    sessionStorage.setItem('rr_jobData', JSON.stringify(jobData));
    sessionStorage.setItem('rr_selectedResume', JSON.stringify(selectedResume));
    sessionStorage.setItem('rr_connections', JSON.stringify(connections));
    if (sessionId) sessionStorage.setItem('rr_sessionId', sessionId);
  }, [stage, jobUrl, manualJd, showManual, jobData, selectedResume, connections, sessionId]);

  // Clear session storage on done
  const clearSession = () => {
    sessionStorage.removeItem('rr_stage');
    sessionStorage.removeItem('rr_jobUrl');
    sessionStorage.removeItem('rr_manualJd');
    sessionStorage.removeItem('rr_showManual');
    sessionStorage.removeItem('rr_jobData');
    sessionStorage.removeItem('rr_selectedResume');
    sessionStorage.removeItem('rr_connections');
    sessionStorage.removeItem('rr_sessionId');
    setStage(1); setJobUrl(''); setManualJd(''); setShowManual(false); setJobData(null);
    setSelectedResume(null); setConnections([]); setSessionId(null); setSelected(new Set());
    setSentIds(new Set()); setDone(false);
  };

  // Check for extension — 4 detection methods
  useEffect(() => {
    const markInstalled = (method) => {
      console.log(`[AlignCV Debug] ✅ Extension DETECTED via: ${method}`);
      setExtInstalled(true);
    };

    // Method 1: Check global variable (set by content-app.js in MAIN world)
    if (window.__ALIGNCV_EXT_INSTALLED__) {
      markInstalled('global variable');
      return;
    }

    // Method 2: Check DOM attribute
    if (document.documentElement.getAttribute('data-aligncv-ext') === 'true') {
      markInstalled('DOM attribute');
      return;
    }

    console.log("[AlignCV Debug] Extension not found on initial check. Listening...");

    // Method 3: Listen for CustomEvent
    const handleCustomEvent = () => markInstalled('CustomEvent');
    window.addEventListener('aligncv-ext-ready', handleCustomEvent);

    // Method 4: Listen for postMessage  
    const handleMessage = (event) => {
      if (event.data?.type === 'ALIGNCV_EXT_STATUS' && event.data?.status === 'installed') {
        markInstalled('postMessage');
      }
    };
    window.addEventListener('message', handleMessage);

    // Periodic fallback — re-check methods 1 & 2 every second
    const interval = setInterval(() => {
      if (window.__ALIGNCV_EXT_INSTALLED__) {
        markInstalled('global variable (delayed)');
        clearInterval(interval);
      } else if (document.documentElement.getAttribute('data-aligncv-ext') === 'true') {
        markInstalled('DOM attribute (delayed)');
        clearInterval(interval);
      } else {
        console.log("[AlignCV Debug] Still checking... global:", !!window.__ALIGNCV_EXT_INSTALLED__, "| attr:", document.documentElement.getAttribute('data-aligncv-ext'));
      }
    }, 2000);

    // Also check when window regains focus
    const handleFocus = () => {
      if (window.__ALIGNCV_EXT_INSTALLED__ || document.documentElement.getAttribute('data-aligncv-ext') === 'true') {
        markInstalled('focus check');
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('aligncv-ext-ready', handleCustomEvent);
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  // Stage 1 - Fetch Job
  const handleFetchJob = async () => {
    if (!jobUrl.trim() && !manualJd.trim()) return toast.error('Enter a URL or paste JD');
    setLoading(true);
    try {
      const res = await referralApi.fetchJob(jobUrl.trim() || null, manualJd.trim() || null);
      if (res.data.success && res.data.data) { setJobData(res.data.data); toast.success('Job details fetched!'); }
      else { setShowManual(true); toast.error(res.data.message || 'Could not fetch URL'); }
    } catch { setShowManual(true); toast.error('Fetch failed — paste JD manually'); }
    finally { setLoading(false); }
  };

  // Stage 2 - Load resumes
  const loadResumes = async () => { try { const r = await resumeApi.getAll(); setResumes(r.data.data || []); } catch {} };
  useEffect(() => { if (stage === 2) loadResumes(); }, [stage]);

  // Stage 3 - Scan with Extension
  const handleScanLinkedIn = () => {
    setLoading(true);
    
    // Listener for response from extension
    const responseListener = async (event) => {
      if (event.data?.type === 'ALIGNCV_EXT_RESPONSE' && event.data?.action === 'SCAN_COMPANY') {
        window.removeEventListener('message', responseListener);
        clearTimeout(timeoutId);
        
        if (event.data.success) {
          toast.success(`Extracted ${event.data.data.length} connections. Generating AI messages...`);
          // Send to backend
          try {
            const res = await referralApi.matchConnections({
              company_name: jobData.company_name,
              job_id: jobData.job_id || '',
              job_url: jobData.job_url || '',
              resume_id: selectedResume?.id || '',
              connections_data: JSON.stringify(event.data.data)
            });
            const d = res.data.data;
            if (d.total_found > 0) { setConnections(d.connections); setSessionId(d.session_id); setStage(4); toast.success(`Messages generated!`); }
            else { toast('No connections found at this company'); setLoading(false); }
          } catch (err) {
            toast.error('Failed to process connections');
            setLoading(false);
          }
        } else {
          toast.error(event.data.error || 'Scraping failed');
          setLoading(false);
        }
      }
    };
    
    window.addEventListener('message', responseListener);
    
    // Send request to extension via postMessage (content-app.js bridges to background)
    window.postMessage({ type: 'ALIGNCV_INTERNAL_SCAN', companyName: jobData.company_name }, '*');
    
    // Failsafe timeout
    const timeoutId = setTimeout(() => {
      window.removeEventListener('message', responseListener);
      toast.error('Extension timed out. Is LinkedIn open?');
      setLoading(false);
    }, 20000);
  };

  const handleFindCold = async () => {
    setLoading(true);
    try {
      const res = await referralApi.findPublicEmployees({ company_name: jobData.company_name, role_title: jobData.role_title, job_id: jobData.job_id, job_url: jobData.job_url, resume_id: selectedResume?.id });
      const d = res.data.data;
      setConnections(d.connections); setSessionId(d.session_id); setStage(4);
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  // Stage 4 - Send
  const toggleSelect = id => { const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s); };
  const selectAll = () => setSelected(new Set(connections.map(c => c.id)));
  const deselectAll = () => setSelected(new Set());
  const getMessage = p => editedMessages[p.id] || p.message;

  const startSendFlow = () => { if (selected.size === 0) return toast.error('Select people first'); setSendModal(true); setSendStep(0); };
  const selectedList = connections.filter(c => selected.has(c.id));
  const currentPerson = selectedList[sendStep];

  const markSent = async () => {
    if (!currentPerson) return;
    setSentIds(prev => new Set([...prev, currentPerson.id]));
    if (sendStep < selectedList.length - 1) { setSendStep(s => s + 1); }
    else {
      // Save all to backend
      try {
        await referralApi.sendMessages({ session_id: sessionId, messages: selectedList.map(p => ({ person_name: p.full_name, person_linkedin_url: p.linkedin_url, person_role: p.position, message_text: getMessage(p), resume_id: selectedResume?.id, connection_type: p.connection_type })) });
        setSendModal(false); setDone(true); toast.success(`Outreach sent to ${selectedList.length} people!`);
      } catch { toast.error('Failed to save'); }
    }
  };

  const copyMsg = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };

  // ── Styles ──
  const card = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28 };
  const btn = (active=true) => ({ padding:'12px 24px', background: active ? C.primary : 'rgba(255,255,255,0.05)', color:'#fff', border:'none', borderRadius:9, fontSize:14, fontWeight:600, cursor: active?'pointer':'not-allowed', opacity: active?1:0.5, display:'flex', alignItems:'center', gap:8 });
  const input = { width:'100%', padding:'12px 16px', background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`, borderRadius:9, color:C.text, fontSize:14, boxSizing:'border-box', outline:'none' };

  // ── DONE SCREEN ──
  if (done) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Inter',sans-serif" }}>
      <div style={{ ...card, textAlign:'center', maxWidth:500 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
        <h2 style={{ color:C.text, fontSize:24, marginBottom:8 }}>Outreach sent to {selectedList.length} people!</h2>
        <p style={{ color:C.textSec, fontSize:14, marginBottom:24 }}>Your referral requests are tracked in the log.</p>
        <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
          <button onClick={() => navigate('/referral/log')} style={btn()}>View Referral Log</button>
          <button onClick={clearSession} style={{ ...btn(), background:'rgba(255,255,255,0.08)' }}>Start New</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'Inter',sans-serif", color:C.text }}>
      {/* NAV */}
      <nav style={{ display:'flex', alignItems:'center', padding:'14px 32px', borderBottom:`1px solid rgba(255,255,255,0.08)`, background:'rgba(11,15,25,0.95)', position:'sticky', top:0, zIndex:50 }}>
        <button onClick={() => navigate('/dashboard')} style={{ background:'none', border:'none', color:C.textSec, cursor:'pointer', display:'flex', marginRight:12 }}><ChevronLeft size={20}/></button>
        <Radar size={20} color={C.primaryLight} />
        <span style={{ fontSize:17, fontWeight:700, marginLeft:8 }}>Referral<span style={{ color:C.primaryLight }}>Radar</span></span>
        <div style={{ flex:1 }}/>
        <button onClick={() => navigate('/referral/log')} style={{ background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 16px', color:C.textSec, fontSize:12, fontWeight:600, cursor:'pointer' }}>View Log</button>
      </nav>

      {/* STAGE INDICATOR */}
      <div style={{ display:'flex', justifyContent:'center', gap:8, padding:'24px 0 8px' }}>
        {stages.map((s,i) => { const num = i+1; const completed = stage > num; const active = stage === num;
          const isClickable = num < stage; // Can go back
          return (<div key={s} onClick={() => isClickable && setStage(num)} style={{ display:'flex', alignItems:'center', gap:6, cursor: isClickable ? 'pointer' : 'default', opacity: isClickable ? 0.9 : 1 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, border: `2px solid ${completed ? C.success : active ? C.primary : 'rgba(255,255,255,0.15)'}`, background: completed ? C.success : active ? C.primary : 'transparent', color: completed || active ? '#fff' : 'rgba(255,255,255,0.4)', transition:'all 0.3s' }}>
              {completed ? <Check size={14}/> : num}
            </div>
            <span style={{ fontSize:12, fontWeight:600, color: active ? C.text : isClickable ? '#fff' : 'rgba(255,255,255,0.4)', transition:'all 0.3s' }}>{s}</span>
            {i < 3 && <div style={{ width:40, height:2, background: completed ? C.success : 'rgba(255,255,255,0.1)', borderRadius:1, margin:'0 4px' }}/>}
          </div>);
        })}
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 24px 80px' }}>

        {/* ── STAGE 1: JOB ── */}
        {stage === 1 && (
          <div style={card}>
            <h2 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>Where do you want to work?</h2>
            <p style={{ color:C.textSec, fontSize:13, marginBottom:20 }}>Paste any job listing URL and we'll handle the rest</p>
            <input value={jobUrl} onChange={e => setJobUrl(e.target.value)} placeholder="https://linkedin.com/jobs/... or any job URL" style={input} />
            {showManual && <textarea value={manualJd} onChange={e => setManualJd(e.target.value)} placeholder="Paste the full job description here..." rows={6} style={{ ...input, marginTop:12, resize:'vertical' }} />}
            <button onClick={handleFetchJob} disabled={loading} style={{ ...btn(!loading), width:'100%', justifyContent:'center', marginTop:16 }}>
              {loading ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }}/> Fetching...</> : <><Search size={16}/> Fetch Job Details →</>}
            </button>
            {jobData && (
              <div style={{ marginTop:20, padding:20, background:'rgba(255,255,255,0.03)', border:`1px solid rgba(16,185,129,0.3)`, borderRadius:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  <img src={jobData.logo_url} alt="" style={{ width:40, height:40, borderRadius:8, background:'rgba(255,255,255,0.1)' }} onError={e => { e.target.style.display='none'; }} />
                  <div><div style={{ fontSize:18, fontWeight:700 }}>{jobData.company_name}</div><div style={{ fontSize:14, color:C.textSec }}>{jobData.role_title}</div></div>
                  <Check size={20} color={C.success} style={{ marginLeft:'auto' }}/>
                </div>
                {jobData.location && <p style={{ fontSize:12, color:C.textSec, margin:'4px 0' }}>📍 {jobData.location}</p>}
                <p style={{ fontSize:13, color:C.textSec, lineHeight:1.6, margin:'8px 0' }}>{jobData.summary}</p>
                {jobData.tech_stack?.length > 0 && <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>{jobData.tech_stack.map((t,i) => <span key={i} style={{ padding:'3px 10px', fontSize:11, background:'rgba(99,102,241,0.12)', border:`1px solid ${C.border}`, borderRadius:20, color:C.primaryLight }}>{t}</span>)}</div>}
                <button onClick={() => setStage(2)} style={{ ...btn(), width:'100%', justifyContent:'center', marginTop:16 }}>Looks right? Continue →</button>
              </div>
            )}
          </div>
        )}

        {/* ── STAGE 2: RESUME ── */}
        {stage === 2 && (
          <div style={card}>
            <h2 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>Which resume will you send?</h2>
            <p style={{ color:C.textSec, fontSize:13, marginBottom:20 }}>Pick the version tailored closest to this role</p>
            {resumes.length === 0 ? <p style={{ color:C.textSec, textAlign:'center', padding:40 }}>No resumes found. <button onClick={() => navigate('/new-resume')} style={{ color:C.primaryLight, background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>Create one first</button></p> :
              <div style={{ display:'flex', gap:16, overflowX:'auto', paddingBottom:12 }}>
                {resumes.map(r => { const sel = selectedResume?.id === r.id; return (
                  <div key={r.id} onClick={() => setSelectedResume(r)} style={{ minWidth:220, padding:16, background: sel ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)', border: `2px solid ${sel ? C.primary : 'rgba(255,255,255,0.08)'}`, borderRadius:12, cursor:'pointer', position:'relative', transition:'all 0.2s' }}>
                    {sel && <div style={{ position:'absolute', top:8, right:8 }}><Check size={16} color={C.primary}/></div>}
                    <FileText size={20} color={C.primaryLight} style={{ marginBottom:8 }}/>
                    <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>{r.title || 'Untitled'}</div>
                    <div style={{ fontSize:11, color:C.textSec }}>{new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                );})}
              </div>
            }
            <div style={{ display:'flex', gap: 12, marginTop: 16 }}>
              <button onClick={() => setStage(1)} style={{ ...btn(), background: 'rgba(255,255,255,0.05)', flex: 1, justifyContent:'center' }}>← Back</button>
              {selectedResume && <button onClick={() => setStage(3)} style={{ ...btn(), flex: 3, justifyContent:'center' }}>Continue with this resume →</button>}
            </div>
          </div>
        )}

        {/* ── STAGE 3: CONNECTIONS ── */}
        {stage === 3 && (
          <div style={card}>
            <h2 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>Find your insider connections</h2>
            <p style={{ color:C.textSec, fontSize:13, marginBottom:20 }}>We'll scan LinkedIn for people you know at {jobData?.company_name}</p>
            
            {!extInstalled ? (
              <div style={{ padding:32, background:'rgba(255,255,255,0.02)', borderRadius:12, marginBottom:20, border:`1px solid ${C.border}`, textAlign:'center' }}>
                <div style={{ width:64, height:64, borderRadius:16, background:'rgba(99,102,241,0.1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                  <Radar size={32} color={C.primaryLight} />
                </div>
                <h3 style={{ margin:'0 0 8px', fontSize:20 }}>AlignCV Extension Required</h3>
                <p style={{ margin:'0 auto 24px', fontSize:14, color:C.textSec, maxWidth:400, lineHeight:1.6 }}>
                  To find your connections securely, please install our official Chrome Extension. It automates the search without requiring your LinkedIn password.
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:12, alignItems:'center' }}>
                  <a href="https://github.com/DSP050505/AlignCV/releases/download/v1.0.0/aligncv-extension.zip" style={{ ...btn(), display:'inline-flex', padding:'14px 28px', fontSize:15, alignItems: 'center' }}>
                    <Download size={18} style={{ marginRight: 8 }} /> Download Extension (.zip)
                  </a>
                  <button onClick={() => window.location.reload()} style={{ background:'none', border:'none', color:C.primaryLight, fontSize:13, cursor:'pointer', textDecoration:'underline' }}>
                    I installed it — Refresh Page
                  </button>
                </div>
                <div style={{ marginTop:24, fontSize:13, color:'rgba(255,255,255,0.6)', textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                  <strong>How to install:</strong>
                  <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px', lineHeight: 1.5 }}>
                    <li>Extract the downloaded <code>.zip</code> file to a folder.</li>
                    <li>Go to <code>chrome://extensions</code> in your browser.</li>
                    <li>Enable <strong>Developer mode</strong> (top right).</li>
                    <li>Click <strong>Load unpacked</strong> and select the extracted folder.</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div style={{ padding:40, border:`2px dashed ${C.primary}`, borderRadius:12, textAlign:'center', background: 'rgba(99,102,241,0.05)' }}>
                <Radar size={40} color={C.primaryLight} style={{ marginBottom:16, animation: loading ? 'spin 2s linear infinite' : 'none' }}/>
                <h3 style={{ margin:'0 0 8px', fontSize:18 }}>Extension Ready</h3>
                <p style={{ fontSize:13, color:C.textSec, marginBottom:24 }}>We will securely scan your 1st and 2nd degree connections at {jobData?.company_name}.</p>
                
                <button onClick={handleScanLinkedIn} disabled={loading} style={{ ...btn(!loading), width:'100%', justifyContent:'center' }}>
                  {loading ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }}/> Scanning LinkedIn safely...</> : <><Search size={16}/> Scan LinkedIn for Connections →</>}
                </button>
              </div>
            )}
            
            <div style={{ textAlign:'center', marginTop:20 }}>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>No LinkedIn? <button onClick={handleFindCold} disabled={loading} style={{ color:C.primaryLight, background:'none', border:'none', cursor:'pointer', fontSize:12 }}>Find suggested outreach targets →</button></p>
              <button onClick={() => setStage(2)} style={{ background: 'none', border: 'none', color: C.textSec, cursor:'pointer', fontSize: 13, margin: '16px auto 0' }}>← Go Back to Resumes</button>
            </div>
          </div>
        )}

        {/* ── STAGE 4: OUTREACH ── */}
        {stage === 4 && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24 }}>
              <div>
                <button onClick={() => setStage(3)} style={{ background: 'none', border: 'none', color: C.textSec, cursor:'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, padding: 0, marginBottom: 12, transition: 'color 0.2s' }} onMouseOver={e=>e.currentTarget.style.color='#fff'} onMouseOut={e=>e.currentTarget.style.color=C.textSec}><ChevronLeft size={14}/> Back to Scan</button>
                
                <div style={{ display:'flex', alignItems:'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize:22, fontWeight:700, margin:0, color:'#fff' }}>Found {connections.length} connections at {jobData?.company_name}</h2>
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    ⚠️ Double-check current company
                  </div>
                </div>
                
                <p style={{ fontSize:14, color:C.textSec, margin:0 }}>We've prepared personalized messages — you send in one click.</p>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={selectAll} style={{ ...btn(), padding:'8px 16px', fontSize:13, background:'rgba(255,255,255,0.06)', border:`1px solid rgba(255,255,255,0.1)` }}>Select All</button>
                <button onClick={deselectAll} style={{ ...btn(), padding:'8px 16px', fontSize:13, background:'rgba(255,255,255,0.06)', border:`1px solid rgba(255,255,255,0.1)` }}>Deselect</button>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {connections.map(p => { 
                const sel = selected.has(p.id); 
                const sent = sentIds.has(p.id); 
                const bc = badgeColors[p.connection_type] || badgeColors['1st'];
                
                // Clean up massive LinkedIn scraped names
                let cleanName = p.full_name || '';
                cleanName = cleanName.split('•')[0].split(/ 1st| 2nd| 3rd|\n/)[0].trim();
                
                return (<div key={p.id} onClick={() => toggleSelect(p.id)} style={{ ...card, padding:16, cursor:'pointer', borderColor: sel ? C.primary : 'rgba(255,255,255,0.08)', borderLeft: sel ? `4px solid ${C.primary}` : `4px solid transparent`, background: sel ? 'rgba(99,102,241,0.06)' : C.card, transition:'all 0.2s', opacity: sent ? 0.6 : 1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:40, height:40, borderRadius:'50%', background:'rgba(99,102,241,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:C.primaryLight, flexShrink:0 }}>{p.initials}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:15, fontWeight:600 }}>{cleanName} {sent && <Check size={14} color={C.success} style={{ display:'inline' }}/>}</div>
                      <div style={{ fontSize:12, color:C.textSec, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.position}</div>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:12, background:bc.bg, border:`1px solid ${bc.border}`, color:bc.text }}>{p.connection_type === '1st' ? '✓ 1st degree' : p.connection_type === 'cold' ? '🌐 Cold Outreach' : '2nd degree'}</span>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                      <div style={{ width:22, height:22, borderRadius:4, border:`2px solid ${sel ? C.primary : 'rgba(255,255,255,0.2)'}`, background: sel ? C.primary : 'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>{sel && <Check size={14} color="#fff"/>}</div>
                      <button onClick={e => { e.stopPropagation(); setPreviewPerson({...p, full_name: cleanName}); }} style={{ fontSize:11, color:C.primaryLight, background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>Preview</button>
                    </div>
                  </div>
                </div>);
              })}
            </div>
            {/* Bottom bar */}
            <div style={{ position:'fixed', bottom:0, left:0, right:0, padding:'14px 32px', background:'rgba(7,12,26,0.95)', borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', backdropFilter:'blur(10px)', zIndex:40 }}>
              <span style={{ fontSize:13, color:C.textSec }}>{selected.size} people selected</span>
              <button onClick={startSendFlow} disabled={selected.size===0} style={btn(selected.size>0)}><Send size={16}/> Send to All Selected →</button>
            </div>
          </div>
        )}
      </div>

      {/* ── PREVIEW MODAL ── */}
      {previewPerson && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }} onClick={() => setPreviewPerson(null)}>
          <div onClick={e => e.stopPropagation()} style={{ ...card, width:520, maxHeight:'80vh', overflow:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}><h3 style={{ margin:0 }}>Message to {previewPerson.full_name}</h3><button onClick={() => setPreviewPerson(null)} style={{ background:'none', border:'none', color:C.textSec, cursor:'pointer' }}><X size={18}/></button></div>
            <p style={{ fontSize:12, color:C.textSec, marginBottom:8 }}>{previewPerson.position} at {previewPerson.company}</p>
            <textarea value={getMessage(previewPerson)} onChange={e => setEditedMessages(prev => ({ ...prev, [previewPerson.id]: e.target.value }))} rows={8} style={{ ...input, resize:'vertical', marginBottom:12 }} />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => copyMsg(getMessage(previewPerson))} style={{ ...btn(), flex:1, justifyContent:'center', background:'rgba(255,255,255,0.08)' }}><Copy size={14}/> Copy</button>
              <button onClick={() => { setPreviewPerson(null); toast.success('Saved'); }} style={{ ...btn(), flex:1, justifyContent:'center' }}><Check size={14}/> Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SEND FLOW MODAL ── */}
      {sendModal && currentPerson && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ ...card, width:560, maxHeight:'85vh', overflow:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ margin:0, fontSize:16 }}>Step {sendStep+1} of {selectedList.length} — {currentPerson.full_name}</h3>
              <button onClick={() => setSendModal(false)} style={{ background:'none', border:'none', color:C.textSec, cursor:'pointer' }}><X size={18}/></button>
            </div>
            <div style={{ height:4, background:'rgba(255,255,255,0.08)', borderRadius:2, marginBottom:16 }}><div style={{ height:'100%', width:`${((sendStep+1)/selectedList.length)*100}%`, background:C.primary, borderRadius:2, transition:'width 0.3s' }}/></div>
            <p style={{ fontSize:13, color:C.textSec, marginBottom:12 }}>{currentPerson.position} at {currentPerson.company}</p>
            <div style={{ ...input, padding:16, whiteSpace:'pre-wrap', fontSize:13, lineHeight:1.7, marginBottom:12, maxHeight:200, overflow:'auto' }}>{getMessage(currentPerson)}</div>
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              <button onClick={() => copyMsg(getMessage(currentPerson))} style={{ ...btn(), flex:1, justifyContent:'center', background:'rgba(255,255,255,0.08)' }}><Copy size={14}/> Copy Message</button>
              {currentPerson.linkedin_url && <a href={currentPerson.linkedin_url} target="_blank" rel="noreferrer" style={{ ...btn(), flex:1, justifyContent:'center', textDecoration:'none', background:'rgba(255,255,255,0.08)' }}><ExternalLink size={14}/> Open LinkedIn</a>}
            </div>
            <button onClick={markSent} style={{ ...btn(), width:'100%', justifyContent:'center', background:C.success }}><Check size={16}/> Mark as Sent ✓</button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
