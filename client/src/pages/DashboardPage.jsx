import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  UserCircle,
  FilePlus2,
  History,
  LogOut,
  ArrowRight,
  BriefcaseBusiness,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  Target,
  UploadCloud,
  Loader2,
  HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useEffect, useState, useRef } from 'react';
import { resumeApi } from '../api/resumeApi';
import { trackerApi } from '../api/trackerApi';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/auth');
  };

  const [resumes, setResumes] = useState([]);
  const [trackedApps, setTrackedApps] = useState([]);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [newAppForm, setNewAppForm] = useState({ company_name: '', job_id: '', resume_id: '' });
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [atsFile, setAtsFile] = useState(null);
  const [atsJd, setAtsJd] = useState('');
  const [atsResult, setAtsResult] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Tour State
  const [tourStep, setTourStep] = useState(-1);
  const showTour = tourStep >= 0;

  useEffect(() => {
    if (user) {
      resumeApi.getAll().then(res => setResumes(res.data.data)).catch(() => {});
      trackerApi.getAll().then(res => setTrackedApps(res.data.data)).catch(() => {});
      const hasSeenTour = localStorage.getItem(`tour_seen_${user.id}`);
      if (!hasSeenTour) setTimeout(() => setTourStep(0), 1000);
    }
  }, [user]);

  const handleCreateTracker = async (e) => {
    e.preventDefault(); setTrackerLoading(true);
    try {
      const res = await trackerApi.create(newAppForm);
      setTrackedApps([res.data.data, ...trackedApps]);
      setNewAppForm({ company_name: '', job_id: '', resume_id: '' });
      toast.success('Application tracked!');
    } catch { toast.error('Failed to log application'); } finally { setTrackerLoading(false); }
  };

  const handleDeleteTracker = async (id) => {
    try { await trackerApi.delete(id); setTrackedApps(trackedApps.filter(t => t.id !== id)); toast.success('Removed'); } catch { toast.error('Failed to delete'); }
  };

  const handleAtsCheck = async () => {
    if (!atsFile || !atsJd.trim()) return toast.error('Upload resume and paste JD');
    setAtsLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume', atsFile); formData.append('jd', atsJd);
      const res = await axios.post(`${API_BASE_URL}/ats/quick-check`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setAtsResult(res.data.data); toast.success('ATS Analysis Complete');
    } catch (err) { toast.error('Failed to analyze resume'); } finally { setAtsLoading(false); }
  };

  const resetAts = () => { setAtsFile(null); setAtsJd(''); setAtsResult(null); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const closeRight = () => { setRightOpen(false); setTimeout(resetAts, 300); };
  const skipTour = () => { setTourStep(-1); if (user) localStorage.setItem(`tour_seen_${user.id}`, 'true'); };
  const finishTour = () => { setTourStep(-1); if (user) localStorage.setItem(`tour_seen_${user.id}`, 'true'); toast.success('Enjoy!'); };

  const tourSteps = [
    { title: 'Welcome to AlignCV', desc: "Let's quickly explore the 5 core sections of your dashboard to get you started." },
    { title: 'Application Tracker', desc: 'Manage your submissions and track which resume went to which company here.', target: 'semi-left' },
    { title: 'ATS Score Checker', desc: 'Instantly test any resume against any JD without saving any data.', target: 'semi-right' },
    { title: 'Professional Bio', desc: 'Update your core skills and history for the AI to use during tailoring.', target: 'card-1' },
    { title: 'AI Resume Forge', desc: 'The heart of AlignCV. Paste a JD and generate a tailored resume instantly.', target: 'card-2' },
    { title: 'Vault & History', desc: 'Access and download every tailored resume you have ever generated.', target: 'card-3' },
  ];

  const colors = {
    bg: '#0B0F19', card: 'rgba(255, 255, 255, 0.03)', cardHover: 'rgba(255, 255, 255, 0.05)',
    primary: '#6366f1', primaryLight: '#818cf8', text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)', textMuted: 'rgba(255, 255, 255, 0.5)',
    border: 'rgba(255, 255, 255, 0.08)', accent: '#10b981'
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: colors.bg, color: colors.text, overflow: 'hidden', position: 'relative', fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── DRAWERS (Application Tracker / ATS) ── */}
      <div id="tour-semi-left" className={`semi-circle-left ${tourSteps[tourStep]?.target === 'semi-left' ? 'tour-highlight-semi' : ''}`} style={{ position: 'fixed', left: leftOpen ? '0' : '-60px', top: '50%', transform: 'translateY(-50%)', width: '120px', height: '240px', backgroundColor: 'rgba(59,130,246,0.1)', border: `1px solid rgba(59,130,246,0.2)`, borderRadius: '0 120px 120px 0', cursor: 'pointer', transition: '0.4s', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '15px', backdropFilter: 'blur(10px)' }} onClick={() => setLeftOpen(true)}>
        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '11px', fontWeight: 700, color: '#60A5FA', letterSpacing: '2px', display: leftOpen ? 'none' : 'block' }}>TRACKER</div>
        {!leftOpen && <ChevronRight size={18} color="#60A5FA" />}
        {!leftOpen && trackedApps.length > 0 && (
          <div className="hover-pane" style={{ position: 'absolute', left: '130px', width: '220px', background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', pointerEvents: 'none' }}>
            <p style={{ fontSize: '10px', color: colors.textMuted, marginBottom: '6px', fontWeight: 800 }}>RECENT APPS</p>
            {trackedApps.slice(0, 5).map(app => (<div key={app.id} style={{ fontSize: '12px', margin: '3px 0' }}>{app.company_name}</div>))}
          </div>
        )}
      </div>

      <div id="tour-semi-right" className={`semi-circle-right ${tourSteps[tourStep]?.target === 'semi-right' ? 'tour-highlight-semi' : ''}`} style={{ position: 'fixed', right: rightOpen ? '0' : '-60px', top: '50%', transform: 'translateY(-50%)', width: '120px', height: '240px', backgroundColor: 'rgba(16,185,129,0.1)', border: `1px solid rgba(16,185,129,0.2)`, borderRadius: '120px 0 0 120px', cursor: 'pointer', transition: '0.4s', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: '15px', backdropFilter: 'blur(10px)' }} onClick={() => setRightOpen(true)}>
        <ChevronLeft size={18} color="#10B981" />
        <div style={{ writingMode: 'vertical-lr', fontSize: '11px', fontWeight: 700, color: '#10B981', letterSpacing: '2px', display: rightOpen ? 'none' : 'block' }}>ATS CHECK</div>
      </div>

      {/* ── LEFT DRAWER CONTENT ── */}
      <div style={{ position: 'fixed', left: leftOpen ? '0' : '-60%', top: 0, bottom: 0, width: '50%', maxWidth: '600px', backgroundColor: colors.bg, borderRight: `1px solid ${colors.border}`, zIndex: 110, transition: '0.4s', padding: '60px 40px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}><h2 style={{ fontSize: '22px', fontWeight: 700, display: 'flex', gap: '12px' }}><BriefcaseBusiness color="#60A5FA" /> Application Tracker</h2><button onClick={() => setLeftOpen(false)} style={{ background: 'none', border: 'none', color: colors.textMuted }}><X /></button></div>
        <form onSubmit={handleCreateTracker} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '20px', marginBottom: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <input required value={newAppForm.company_name} onChange={e => setNewAppForm({...newAppForm, company_name: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '13px' }} placeholder="Company" />
            <input value={newAppForm.job_id} onChange={e => setNewAppForm({...newAppForm, job_id: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '13px' }} placeholder="Job ID" />
          </div>
          <select value={newAppForm.resume_id} onChange={e => setNewAppForm({...newAppForm, resume_id: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '13px', marginBottom: '16px' }}>
            <option value="">-- Linked Resume --</option>
            {resumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
          <button type="submit" disabled={trackerLoading} style={{ width: '100%', padding: '12px', background: colors.primary, borderRadius: '8px', color: '#fff', fontWeight: 600 }}>Track App</button>
        </form>
        {trackedApps.map(app => (
          <div key={app.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${colors.border}`, borderRadius: '10px', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div><p style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>{app.company_name}</p><p style={{ fontSize: '11px', color: colors.textMuted, margin: 0 }}>{app.job_id || '-'}</p></div>
            <div style={{ display: 'flex', gap: '8px' }}>{app.resume_pdf_path && <a href={app.resume_pdf_path} target="_blank" rel="noreferrer" style={{ color: colors.primaryLight }}><ExternalLink size={14}/></a>}<button onClick={() => handleDeleteTracker(app.id)} style={{ color: '#ef4444', background: 'none', border: 'none' }}><Trash2 size={14}/></button></div>
          </div>
        ))}
      </div>

      {/* ── RIGHT DRAWER CONTENT ── */}
      <div style={{ position: 'fixed', right: rightOpen ? '0' : '-60%', top: 0, bottom: 0, width: '50%', maxWidth: '600px', backgroundColor: colors.bg, borderLeft: `1px solid ${colors.border}`, zIndex: 110, transition: '0.4s', padding: '60px 40px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}><h2 style={{ fontSize: '22px', fontWeight: 700, gap: '12px', display: 'flex' }}><Target color="#10B981" /> ATS Validator</h2><button onClick={closeRight} style={{ background: 'none', border: 'none', color: colors.textMuted }}><X /></button></div>
        {!atsResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div onClick={() => fileInputRef.current?.click()} style={{ padding: '40px', border: `2px dashed ${atsFile ? colors.accent : colors.border}`, borderRadius: '20px', textAlign: 'center', cursor: 'pointer' }}>
               <input type="file" ref={fileInputRef} hidden accept=".pdf" onChange={e => setAtsFile(e.target.files[0])} />
               <UploadCloud size={40} color={atsFile ? colors.accent : colors.textMuted} style={{ margin: '0 auto 12px' }} />
               <p style={{ fontSize: '14px', fontWeight: 700 }}>{atsFile ? atsFile.name : 'Upload Resume PDF'}</p>
            </div>
            <textarea value={atsJd} onChange={e => setAtsJd(e.target.value)} style={{ width: '100%', height: '200px', background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '16px', color: '#fff', fontSize: '13px' }} placeholder="Paste JD..." />
            <button onClick={handleAtsCheck} disabled={atsLoading || !atsFile || !atsJd.trim()} style={{ width: '100%', padding: '14px', background: colors.accent, borderRadius: '10px', color: '#fff', fontWeight: 700 }}>{atsLoading ? 'Analyzing...' : 'Check Score'}</button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '64px', color: colors.accent }}>{Math.round(atsResult.overall_score)}%</h1>
            <button onClick={resetAts} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${colors.border}`, borderRadius: '10px', color: '#fff' }}>Reset</button>
          </div>
        )}
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 40px', 
        background: 'rgba(11,15,25,0.95)', borderBottom: `1px solid ${colors.border}`, 
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 600 
      }}>
        <div style={{ fontSize: '19px', fontWeight: 800, marginRight: '40px' }}>Align<span style={{ color: colors.primaryLight }}>CV</span></div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
           {/* TOUR BOX IN HEADER - FULL SPREAD */}
           {showTour && (
             <div style={{ 
               animation: 'fadeInDown 0.4s ease', 
               flex: 1, 
               padding: '10px 24px', 
               background: 'rgba(99,102,241,0.05)', 
               border: `1px solid ${colors.primary}40`, 
               borderRadius: '14px', 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'space-between',
               gap: '32px',
               pointerEvents: 'auto'
             }}>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <p style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 800, color: colors.primaryLight, textTransform: 'uppercase', letterSpacing: '1px' }}>{tourSteps[tourStep].title}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>{tourSteps[tourStep].desc}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '24px' }}>
                  <button onClick={skipTour} style={{ background: 'none', border: 'none', color: colors.textMuted, fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: '8px' }}>SKIP TOUR</button>
                  <button 
                    onClick={() => tourStep === tourSteps.length - 1 ? finishTour() : setTourStep(s => s + 1)} 
                    style={{ background: colors.primary, border: 'none', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '10px 24px', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}
                  >
                    {tourStep === tourSteps.length - 1 ? 'GET STARTED' : 'CONTINUE'}
                  </button>
                </div>
             </div>
           )}
           
           {!showTour && <div style={{ flex: 1 }} />}

           <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '20px' }}>
             <button onClick={() => setTourStep(0)} style={{ background: 'rgba(99,102,241,0.1)', border: `1px solid ${colors.primary}30`, padding: '8px 16px', borderRadius: '10px', color: colors.primaryLight, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
               Guide Me
             </button>
             <button onClick={handleLogout} style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>
           </div>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main style={{ maxWidth: '1200px', margin: '80px auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 100px)', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 900, margin: '0 0 12px 0' }}>Hello, <span style={{ background: `linear-gradient(to right, ${colors.primaryLight}, #c084fc)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name}</span></h1>
          <p style={{ fontSize: '17px', color: colors.textSecondary, margin: 0 }}>What would you like to achieve today?</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 360px)', gap: '24px' }}>
          <div id="tour-card-1" onClick={() => navigate('/profile')} className={`center-card ${tourSteps[tourStep]?.target === 'card-1' ? 'tour-highlight' : ''}`} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${colors.border}`, borderRadius: '24px', padding: '32px', cursor: 'pointer' }}>
             <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}><UserCircle color="#60A5FA" size={28} /></div>
             <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Professional Bio</h3>
             <p style={{ fontSize: '14px', color: colors.textMuted, margin: '12px 0 24px 0' }}>Master your skills and history for the perfect neural tailor.</p>
             <div style={{ fontSize: '13px', fontWeight: 700, color: colors.primaryLight, display: 'flex', gap: '4px' }}>Update Profile <ArrowRight size={14}/></div>
          </div>
          <div id="tour-card-2" onClick={() => navigate('/new-resume')} className={`center-card ${tourSteps[tourStep]?.target === 'card-2' ? 'tour-highlight' : ''}`} style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.04))', border: `2px solid ${colors.primary}`, borderRadius: '24px', padding: '32px', cursor: 'pointer', boxShadow: `0 15px 40px -10px ${colors.primary}30` }}>
             <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}><FilePlus2 color="#fff" size={28} /></div>
             <h3 style={{ fontSize: '20px', fontWeight: 800 }}>AI Resume Forge</h3>
             <p style={{ fontSize: '14px', color: colors.textSecondary, margin: '12px 0 24px 0' }}>Forge a unique, high-impact resume for any JD in seconds.</p>
             <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', background: colors.primary, padding: '8px 20px', borderRadius: '10px' }}>Forge Now</div>
          </div>
          <div id="tour-card-3" onClick={() => navigate('/history')} className={`center-card ${tourSteps[tourStep]?.target === 'card-3' ? 'tour-highlight' : ''}`} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${colors.border}`, borderRadius: '24px', padding: '32px', cursor: 'pointer' }}>
             <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}><History color="#c084fc" size={28} /></div>
             <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Vault & History</h3>
             <p style={{ fontSize: '14px', color: colors.textMuted, margin: '12px 0 24px 0' }}>Manage all tailored resumes and download your PDFs.</p>
             <div style={{ fontSize: '13px', fontWeight: 700, color: '#c084fc', display: 'flex', gap: '4px' }}>View Vault <ArrowRight size={14}/></div>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .center-card:hover { transform: translateY(-10px); background: rgba(255,255,255,0.05); }
        .semi-circle-left:hover { left: -40px !important; } .semi-circle-right:hover { right: -40px !important; }
        .hover-pane { opacity: 0; transition: 0.2s; } .semi-circle-left:hover .hover-pane { opacity: 1; }
        .tour-highlight { position: relative; z-index: 500 !important; box-shadow: 0 0 0 9999px rgba(0,0,0,0.8), 0 0 40px rgba(99,102,241,0.6) !important; outline: 3px solid #6366f1 !important; pointer-events: none; }
        .tour-highlight-semi { position: relative; z-index: 500 !important; box-shadow: 0 0 0 9999px rgba(0,0,0,0.8), 0 0 30px rgba(99,102,241,0.5) !important; outline: 3px solid #6366f1 !important; pointer-events: none; }
        @keyframes fadeInDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}} />

      {/* BACKGROUND MASK DURING TOUR */}
      {showTour && <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0)' }} />}
    </div>
  );
}
