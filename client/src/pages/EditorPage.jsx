// ─────────────────────────────────────────────────────────────────
// AlignCV — Editor Page (Cursor-like Diff Review)
// 100% Inline Styles — No Tailwind dependency
// ─────────────────────────────────────────────────────────────────

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Download, RefreshCw, FileText, Sparkles,
  Zap, Check, Loader2, ShieldAlert, TrendingUp, Target,
  ChevronDown, ChevronUp, MessageSquare, Send, Bot, User,
  X, CheckCircle, XCircle, ArrowRight, Plus, Minus
} from 'lucide-react';
import { resumeApi } from '../api/resumeApi';
import { skillgapApi } from '../api/skillgapApi';
import { atsApi } from '../api/atsApi';
import { chatApi } from '../api/chatApi';
import { FullPageSpinner } from '../components/ui/Spinner';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';

// ── Colors ───────────────────────────────────────────────────────
const C = {
  bg: '#0B0F1A',
  panel: '#111827',
  card: '#1F2937',
  cardHover: '#374151',
  border: '#374151',
  borderLight: '#4B5563',
  primary: '#6366F1',
  primaryHover: '#4F46E5',
  primaryLight: '#818CF8',
  white: '#FFFFFF',
  textMuted: '#9CA3AF',
  textDim: '#6B7280',
  success: '#22C55E',
  successBg: 'rgba(34,197,94,0.08)',
  successBorder: 'rgba(34,197,94,0.25)',
  danger: '#EF4444',
  dangerBg: 'rgba(239,68,68,0.08)',
  dangerBorder: 'rgba(239,68,68,0.25)',
  warning: '#F59E0B',
};

// ── ATS Circular Gauge ───────────────────────────────────────────
function ATSGauge({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 80 ? C.success : score >= 60 ? C.warning : C.danger;
  return (
    <div style={{ position: 'relative', width: 144, height: 144, margin: '0 auto' }}>
      <svg width="144" height="144" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference - progress}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 32, fontWeight: 900, color: C.white }}>{score}</span>
        <span style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>ATS Score</span>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const colors = {
    high: { bg: 'rgba(239,68,68,0.1)', text: '#F87171', border: 'rgba(239,68,68,0.3)' },
    medium: { bg: 'rgba(245,158,11,0.1)', text: '#FBBF24', border: 'rgba(245,158,11,0.3)' },
    low: { bg: 'rgba(96,165,250,0.1)', text: '#60A5FA', border: 'rgba(96,165,250,0.3)' },
  };
  const c = colors[priority] || colors.low;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 12, border: `1px solid ${c.border}`, background: c.bg, color: c.text }}>
      {priority}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [resumeData, setResumeData] = useState(null);
  const [pdfKey, setPdfKey] = useState(Date.now());

  // Skill Gap
  const [gaps, setGaps] = useState(null);
  const [scanningGaps, setScanningGaps] = useState(false);
  const [acceptedSkills, setAcceptedSkills] = useState([]);

  // ATS
  const [atsData, setAtsData] = useState(null);
  const [scoringATS, setScoringATS] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Diff Review
  const [pendingChange, setPendingChange] = useState(null);
  const [applyingChange, setApplyingChange] = useState(false);

  const [activePanel, setActivePanel] = useState('skillgap');

  useEffect(() => { fetchResume(); }, [id]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const fetchResume = async () => {
    try { const res = await resumeApi.get(id); setResumeData(res.data.data); }
    catch { toast.error('Failed to load resume'); }
    finally { setLoading(false); }
  };

  const handleDownloadPDF = () => {
    if (!resumeData?.pdf_path) return;
    const base = API_BASE_URL.replace('/api', '');
    window.open(`${base}${resumeData.pdf_path}`, '_blank');
  };

  // ── Skill Gap ──────────────────────────────────────────────────
  const handleScanGaps = async () => {
    if (!resumeData?.jd_analysis_id) { toast.error('No JD linked'); return; }
    setScanningGaps(true);
    try { const r = await skillgapApi.analyse(id, resumeData.jd_analysis_id); setGaps(r.data.data.gaps || []); }
    catch { toast.error('Scan failed'); }
    finally { setScanningGaps(false); }
  };

  const handlePreviewSkill = async (gap) => {
    try {
      const r = await skillgapApi.previewAccept(id, { name: gap.skill, category: gap.category });
      setPendingChange({
        type: 'skill',
        skill: { name: gap.skill, category: gap.category },
        pdf_url: r.data.data.pdf_url
      });
    } catch { toast.error('Preview failed'); }
  };

  const handleAcceptChange = async () => {
    if (!pendingChange) return;
    setApplyingChange(true);
    try {
      if (pendingChange.type === 'skill') {
        const r = await skillgapApi.applyAccept(id, pendingChange.skill);
        setResumeData(r.data.data);
        setAcceptedSkills(p => [...p, pendingChange.skill.name]);
        toast.success(`Added "${pendingChange.skill.name}"`);
      } else if (pendingChange.type === 'chat') {
        const r = await chatApi.apply(id, pendingChange.new_resume);
        setResumeData(r.data.data);
        toast.success('Changes applied!');
      }
      setPdfKey(Date.now());
      setPendingChange(null);
    } catch { toast.error('Apply failed'); }
    finally { setApplyingChange(false); }
  };

  const handleRejectChange = () => {
    setPendingChange(null);
    toast('Changes discarded', { icon: '↩️' });
  };

  // ── ATS ────────────────────────────────────────────────────────
  const handleScoreATS = async () => {
    setScoringATS(true);
    try { const r = await atsApi.score(id); setAtsData(r.data.data); toast.success(`Score: ${r.data.data.overall_score}`); }
    catch { toast.error('Scoring failed'); }
    finally { setScoringATS(false); }
  };

  // ── Chat ───────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const history = chatMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await chatApi.preview(id, userMsg, history);
      const { assistant_message, changes_made, old_resume, new_resume, pdf_url } = res.data.data;

      setChatMessages(prev => [...prev, { role: 'assistant', content: assistant_message }]);

      if (new_resume && JSON.stringify(old_resume) !== JSON.stringify(new_resume)) {
        setPendingChange({
          type: 'chat',
          new_resume,
          pdf_url
        });
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Sorry, something went wrong.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const getConfidenceColor = (c) => c === 'high' ? C.success : c === 'medium' ? C.warning : C.textDim;

  const breakdownLabels = {
    keyword_match: { label: 'Keywords', weight: '35%' }, skills_match: { label: 'Skills', weight: '25%' },
    experience_relevance: { label: 'Experience', weight: '20%' }, section_completeness: { label: 'Sections', weight: '10%' },
    format_score: { label: 'Format', weight: '10%' },
  };

  if (loading) return <FullPageSpinner message="Loading tailored resume..." />;
  if (!resumeData) return <div style={{ padding: 32, textAlign: 'center', color: C.white }}>Resume not found</div>;

  // ── Shared Styles ──────────────────────────────────────────────
  const btnPrimary = {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '12px 20px', background: C.primary, color: C.white, border: 'none',
    borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
  };

  const tabStyle = (active) => ({
    flex: 1, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
    border: 'none', borderRadius: 6, cursor: 'pointer', transition: 'all 0.2s',
    background: active ? C.primary : 'rgba(255,255,255,0.05)',
    color: active ? C.white : C.textMuted,
  });

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: C.bg, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' }}>

      {/* ── TOP NAV ── */}
      <nav style={{ height: 56, background: C.panel, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/dashboard')} style={{ padding: 8, background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', borderRadius: 6, display: 'flex' }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={16} color={C.primaryLight} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, color: C.white, maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {resumeData.title || 'Tailored Resume'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {pendingChange && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.warning }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: C.warning }}>Changes pending</span>
            </div>
          )}
          <button onClick={() => { fetchResume(); setPdfKey(Date.now()); }}
            style={{ padding: 8, background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', borderRadius: 6, display: 'flex' }}>
            <RefreshCw size={16} />
          </button>
          <button onClick={handleDownloadPDF}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: C.primary, color: C.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Download size={16} /> Export PDF
          </button>
        </div>
      </nav>

      {/* ── SPLIT VIEW ── */}
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ─── LEFT PANEL ─── */}
        <div style={{ width: 520, background: C.panel, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, padding: '12px 12px', borderBottom: `1px solid ${C.border}` }}>
            {[
              { key: 'skillgap', icon: ShieldAlert, label: 'Gaps' },
              { key: 'ats', icon: Target, label: 'ATS' },
              { key: 'chat', icon: MessageSquare, label: 'Chat' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActivePanel(tab.key)} style={tabStyle(activePanel === tab.key)}>
                <tab.icon size={15} />{tab.label}
              </button>
            ))}
          </div>

          {/* ── SKILL GAP TAB ── */}
          {activePanel === 'skillgap' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: 16, borderBottom: `1px solid ${C.border}` }}>
                <button onClick={handleScanGaps} disabled={scanningGaps} style={{ ...btnPrimary, opacity: scanningGaps ? 0.6 : 1 }}>
                  {scanningGaps ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Scanning...</> : <><Zap size={16} /> Run Gap Analysis</>}
                </button>
              </div>
              <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
                {gaps === null && !scanningGaps && (
                  <div style={{ textAlign: 'center', padding: '48px 0' }}>
                    <ShieldAlert size={36} color={C.textDim} style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.white, marginBottom: 4 }}>Analyze Keywords</div>
                    <div style={{ fontSize: 13, color: C.textMuted }}>Compare your resume against the JD.</div>
                  </div>
                )}
                {gaps && gaps.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '48px 0' }}>
                    <Check size={36} color={C.success} style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.success }}>Perfect Match</div>
                    <div style={{ fontSize: 13, color: C.textMuted }}>No missing keywords found.</div>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {gaps && gaps.map((gap, idx) => {
                    const isAccepted = acceptedSkills.includes(gap.skill);
                    return (
                      <div key={idx} style={{
                        padding: 16, borderRadius: 8, border: `1px solid ${isAccepted ? C.successBorder : C.border}`,
                        background: isAccepted ? C.successBg : C.card, transition: 'all 0.2s',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: C.white }}>{gap.skill}</div>
                            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: C.textDim, letterSpacing: '0.05em', marginTop: 2 }}>{gap.category}</div>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.success, background: C.successBg, padding: '4px 8px', borderRadius: 4 }}>
                            +{gap.ats_boost_estimate}%
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6, marginBottom: 12 }}>{gap.reason}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: getConfidenceColor(gap.confidence) }}>{gap.confidence} match</span>
                          {isAccepted ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: C.success }}>
                              <Check size={14} /> Added
                            </span>
                          ) : (
                            <button onClick={() => handlePreviewSkill(gap)}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', background: C.primary, color: C.white, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                              <Zap size={12} /> Add Skill
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── ATS SCORE TAB ── */}
          {activePanel === 'ats' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: 16, borderBottom: `1px solid ${C.border}` }}>
                <button onClick={handleScoreATS} disabled={scoringATS} style={{ ...btnPrimary, opacity: scoringATS ? 0.6 : 1 }}>
                  {scoringATS ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Scoring...</> : <><Target size={16} /> Run ATS Assessment</>}
                </button>
              </div>
              <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
                {!atsData && !scoringATS && (
                  <div style={{ textAlign: 'center', padding: '48px 0' }}>
                    <Target size={36} color={C.textDim} style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.white, marginBottom: 4 }}>ATS Scanner</div>
                    <div style={{ fontSize: 13, color: C.textMuted }}>Simulate how a tracking system reads your resume.</div>
                  </div>
                )}
                {atsData && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ padding: '20px 0', background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
                      <ATSGauge score={atsData.overall_score} />
                    </div>
                    <button onClick={() => setShowBreakdown(!showBreakdown)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 16px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                      <span>Score Breakdown</span>
                      <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: showBreakdown ? 'rotate(180deg)' : 'rotate(0)' }} />
                    </button>
                    {showBreakdown && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {Object.entries(atsData.breakdown || {}).map(([key, val]) => {
                          const meta = breakdownLabels[key]; if (!meta) return null;
                          const barColor = val >= 80 ? C.success : val >= 60 ? C.warning : C.danger;
                          return (
                            <div key={key}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 13, color: C.textMuted }}>{meta.label} <span style={{ fontSize: 10, color: C.textDim, marginLeft: 4, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>{meta.weight}</span></span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: barColor }}>{val}</span>
                              </div>
                              <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${val}%`, background: barColor, borderRadius: 3, transition: 'width 0.8s ease-out' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {atsData.missing_keywords?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Missing Keywords</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {atsData.missing_keywords.map((kw, i) => (
                            <span key={i} style={{ padding: '4px 10px', fontSize: 12, fontWeight: 500, background: C.dangerBg, color: '#F87171', border: `1px solid ${C.dangerBorder}`, borderRadius: 4 }}>{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {atsData.suggestions?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Suggestions</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {atsData.suggestions.map((s, i) => (
                            <div key={i} style={{ padding: 14, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8 }}>
                              <div style={{ marginBottom: 8 }}><PriorityBadge priority={s.priority} /></div>
                              <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>{s.suggestion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── AI CHAT TAB ── */}
          {activePanel === 'chat' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {chatMessages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Bot size={36} color={C.primaryLight} style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.white, marginBottom: 4 }}>Resume Assistant</div>
                    <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>Ask me to modify phrases or add skills.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div onClick={() => setChatInput("Make bullet 2 more quantitative")}
                        style={{ padding: '10px 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.white, cursor: 'pointer', textAlign: 'left' }}>
                        "Make bullet 2 more quantitative"
                      </div>
                      <div onClick={() => setChatInput("Add Docker to my skills")}
                        style={{ padding: '10px 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.white, cursor: 'pointer', textAlign: 'left' }}>
                        "Add Docker to my skills"
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '85%', padding: '10px 14px', fontSize: 13, lineHeight: 1.6,
                        borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                        background: msg.role === 'user' ? C.primary : C.card,
                        color: C.white,
                        border: msg.role === 'user' ? 'none' : `1px solid ${C.border}`,
                      }}>
                        {msg.content.split('\n').map((line, i) => (
                          <p key={i} style={{ margin: i > 0 ? '6px 0 0' : 0 }}>{line}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <div style={{ padding: '10px 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px 12px 12px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Loader2 size={14} color={C.primaryLight} style={{ animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: 13, color: C.textMuted }}>Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={chatEndRef} style={{ height: 16 }} />
              </div>
              <div style={{ padding: 12, borderTop: `1px solid ${C.border}`, background: C.panel }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <textarea
                    rows={1}
                    value={chatInput}
                    onChange={(e) => { setChatInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); e.target.style.height = 'auto'; } }}
                    placeholder="Type instructions..."
                    disabled={chatLoading}
                    style={{ flex: 1, padding: '10px 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 13, resize: 'none', maxHeight: 100, outline: 'none', fontFamily: 'inherit' }}
                  />
                  <button onClick={handleSendMessage} disabled={chatLoading || !chatInput.trim()}
                    style={{ padding: '10px 14px', background: C.primary, border: 'none', borderRadius: 8, color: C.white, cursor: 'pointer', opacity: (chatLoading || !chatInput.trim()) ? 0.4 : 1, display: 'flex', alignItems: 'center' }}>
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT PANEL — PDF ─── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          <div style={{ flex: 1, background: '#1E1E1E', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 3, overflow: 'hidden' }}>
            {resumeData.pdf_path || pendingChange?.pdf_url ? (
              <div style={{ width: '100%', maxWidth: 900, height: '100%', background: '#fff', boxShadow: '0 4px 30px rgba(0,0,0,0.5)', borderRadius: 2, overflow: 'hidden' }}>
                <iframe key={pendingChange ? pendingChange.pdf_url : pdfKey} src={`${API_BASE_URL.replace('/api', '')}${pendingChange ? pendingChange.pdf_url : resumeData.pdf_path}?t=${pendingChange ? Date.now() : pdfKey}#view=FitH&navpanes=0&scrollbar=0`}
                  style={{ width: '100%', height: '100%', border: 'none' }} title="Resume PDF Preview" />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <Loader2 size={32} color={C.primaryLight} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ color: C.white, fontSize: 16, fontWeight: 500 }}>Generating PDF...</span>
              </div>
            )}
          </div>

          {/* FLOATING ACTION BAR FOR DIFF REVIEW */}
          {pendingChange && (
            <div style={{
              position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)',
              padding: '12px 16px', borderRadius: 16, border: `1px solid ${C.borderLight}`,
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', gap: 16, zIndex: 100
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.white, fontWeight: 500, fontSize: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: '4px', background: C.success, animation: 'pulse 2s infinite' }} />
                Review changes in the document
              </div>
              <div style={{ width: 1, height: 24, background: C.borderLight }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={handleRejectChange} disabled={applyingChange}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'transparent', border: `1px solid ${C.borderLight}`, borderRadius: 8, color: C.white, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: applyingChange ? 0.5 : 1 }}>
                  <X size={16} /> Discard changes
                </button>
                <button onClick={handleAcceptChange} disabled={applyingChange}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', background: C.success, border: 'none', borderRadius: 8, color: C.white, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: applyingChange ? 0.7 : 1 }}>
                  {applyingChange ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Applying...</> : <><Check size={16} /> Keep changes</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Keyframes */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
