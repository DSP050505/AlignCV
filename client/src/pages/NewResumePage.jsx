import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, FileText, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useResumeStore } from '../store/resumeStore';

const STAGE_JD = 0;
const STAGE_TAILORING = 1;
const STAGE_REVIEW = 2;

export default function NewResumePage() {
  const navigate = useNavigate();
  const { analyseJD, generateTailoredResume } = useResumeStore();
  
  const [stage, setStage] = useState(STAGE_JD);
  const [rawJd, setRawJd] = useState('');
  const [loadingMsg, setLoadingMsg] = useState('');
  
  const [generatedResume, setGeneratedResume] = useState(null);

  const handleAnalyseJD = async () => {
    if (rawJd.length < 50) return toast.error('Please provide a more detailed Job Description.');
    
    setStage(STAGE_TAILORING);
    setLoadingMsg('Reading the Job Description...');
    
    try {
      const jdData = await analyseJD(rawJd);
      
      setLoadingMsg('Matching your profile to the role...');
      setTimeout(() => setLoadingMsg('Selecting best-fit projects...'), 2000);
      setTimeout(() => setLoadingMsg('Rewriting bullet points specifically for this job...'), 4000);
      
      const resumeData = await generateTailoredResume(jdData.data.id);
      
      setGeneratedResume(resumeData.data);
      setStage(STAGE_REVIEW);
      toast.success('AI Tailoring Complete!');
    } catch (err) {
      toast.error('AI pipeline failed. Please check logs.');
      setStage(STAGE_JD);
    }
  };

  const handleFinishSprint4 = () => {
    navigate(`/editor/${generatedResume.id}`);
  };

  const colors = {
    bg: '#0B0F19',
    card: 'rgba(17, 22, 35, 0.95)',
    border: 'rgba(255, 255, 255, 0.1)',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    textMuted: 'rgba(255, 255, 255, 0.4)',
    primary: '#6366f1',
    primaryLight: '#818cf8',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* Background Ambience */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '500px', backgroundColor: 'rgba(99,102,241,0.05)', filter: 'blur(120px)', borderRadius: '50%', pointerEvents: 'none' }} />

      <main style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '800px' }}>
        
        {stage === STAGE_JD && (
          <div
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: '24px',
              padding: '40px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.05)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Top Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.6))',
                  border: '1px solid rgba(99,102,241,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(99,102,241,0.2)'
                }}
              >
                <FileText size={32} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 700, color: colors.text, margin: '0 0 4px 0' }}>Create New Resume</h1>
                <p style={{ fontSize: '15px', color: colors.textSecondary, margin: 0 }}>Paste the job description you are targeting</p>
              </div>
            </div>

            {/* Label Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: colors.text, margin: 0 }}>Job Description</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', color: colors.primaryLight, fontWeight: 600 }}>
                <Sparkles size={12} /> AI Powered Analysis
              </div>
            </div>

            {/* Textarea */}
            <textarea
              value={rawJd}
              onChange={(e) => setRawJd(e.target.value)}
              placeholder="Paste job description here...&#10;• Responsibilities&#10;• Requirements&#10;• Skills"
              style={{
                width: '100%',
                height: '240px',
                backgroundColor: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(99,102,241,0.4)',
                borderRadius: '16px',
                padding: '24px',
                color: colors.text,
                fontSize: '15px',
                lineHeight: '1.6',
                resize: 'none',
                outline: 'none',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2), 0 0 0 2px rgba(99,102,241,0.05)',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = colors.primaryLight}
              onBlur={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.4)'}
            />

            {/* Footer Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
              <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>We'll analyze this and tailor your resume accordingly.</p>
              <button
                onClick={handleAnalyseJD}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4f46e5'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.primary; e.currentTarget.style.transform = 'none'; }}
                style={{
                  backgroundColor: colors.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px 0 rgba(99,102,241,0.39)',
                  transition: 'all 0.2s',
                }}
              >
                Analyze & Tailor Resume
              </button>
            </div>
          </div>
        )}

        {stage === STAGE_TAILORING && (
          <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: '24px', padding: '48px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
              <div style={{ width: '96px', height: '96px', border: `4px solid rgba(255,255,255,0.05)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={40} color={colors.primary} />
              </div>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: colors.text, margin: '0 0 16px 0', letterSpacing: '0.025em' }}>{loadingMsg}</h2>
            <p style={{ color: colors.textMuted, fontSize: '15px', margin: 0 }}>Powered by NVIDIA Llama 3.1 70B</p>
          </div>
        )}

        {stage === STAGE_REVIEW && generatedResume && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{ fontSize: '30px', fontWeight: 700, color: colors.text, margin: '0 0 8px 0' }}>Your Tailored Resume is Ready</h1>
              <p style={{ color: colors.textSecondary, fontSize: '16px', margin: 0 }}>We curated your top experiences and rewrote the bullets to match the JD.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, padding: '24px', borderRadius: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: colors.primaryLight, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 16px 0' }}>
                  <Sparkles size={20} /> Chosen Projects (Top 2)
                </h3>
                {generatedResume.selected_projects.map((p, idx) => (
                  <div key={idx} style={{ padding: '16px', border: `1px solid ${colors.border}`, borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>Project ID: {p.project_id.slice(0,8)}...</span>
                      <span style={{ fontSize: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', padding: '4px 12px', borderRadius: '20px', fontWeight: 700 }}>Relevance Score: {p.relevance_score}/100</span>
                    </div>
                    <ul style={{ paddingLeft: '20px', fontSize: '14px', color: colors.textMuted, margin: 0, lineHeight: 1.6 }}>
                      {p.tailored_bullets.map((b, i) => <li key={i} style={{ marginBottom: '8px' }}>{b}</li>)}
                    </ul>
                  </div>
                ))}
              </div>

              <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, padding: '24px', borderRadius: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: colors.primaryLight, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 16px 0' }}>
                  <Sparkles size={20} /> Chosen Experience (Top 2)
                </h3>
                {generatedResume.selected_experiences.map((exp, idx) => (
                  <div key={idx} style={{ padding: '16px', border: `1px solid ${colors.border}`, borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>Experience ID: {exp.experience_id.slice(0,8)}...</span>
                      <span style={{ fontSize: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', padding: '4px 12px', borderRadius: '20px', fontWeight: 700 }}>Relevance Score: {exp.relevance_score}/100</span>
                    </div>
                    <ul style={{ paddingLeft: '20px', fontSize: '14px', color: colors.textMuted, margin: 0, lineHeight: 1.6 }}>
                      {exp.tailored_bullets.map((b, i) => <li key={i} style={{ marginBottom: '8px' }}>{b}</li>)}
                    </ul>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  onClick={handleFinishSprint4}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4f46e5'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.primary; e.currentTarget.style.transform = 'none'; }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 32px', backgroundColor: colors.primary, color: '#fff', fontWeight: 700, borderRadius: '16px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px 0 rgba(99,102,241,0.39)', transition: 'all 0.2s' }}
                >
                  Confirm & Continue to Editor <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
