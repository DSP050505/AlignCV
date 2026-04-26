import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Sparkles, Download, Edit3, Trash2,
  FileText, Clock, Loader2, Plus
} from 'lucide-react';
import { resumeApi } from '../api/resumeApi';
import { API_BASE_URL } from '../config';
import { FullPageSpinner } from '../components/ui/Spinner';
import toast from 'react-hot-toast';

const colors = {
  bg: '#0B0F19',
  card: 'rgba(255, 255, 255, 0.02)',
  cardHover: 'rgba(255, 255, 255, 0.04)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderHover: 'rgba(99, 102, 241, 0.3)',
  text: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  textMuted: 'rgba(255, 255, 255, 0.4)',
  primary: '#6366f1',
  primaryLight: '#818cf8',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
};

function ATSBadge({ score }) {
  if (score === null || score === undefined) {
    return <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.05)', color: colors.textMuted, border: `1px solid ${colors.border}` }}>Not scored</span>;
  }
  const style = score >= 80
    ? { bg: 'rgba(34, 197, 94, 0.1)', color: colors.success, border: 'rgba(34, 197, 94, 0.2)' }
    : score >= 60
      ? { bg: 'rgba(245, 158, 11, 0.1)', color: colors.warning, border: 'rgba(245, 158, 11, 0.2)' }
      : { bg: 'rgba(239, 68, 68, 0.1)', color: colors.danger, border: 'rgba(239, 68, 68, 0.2)' };
      
  return <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', border: `1px solid ${style.border}`, backgroundColor: style.bg, color: style.color }}>{score}/100</span>;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState([]);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchResumes(); }, []);

  const fetchResumes = async () => {
    try {
      const res = await resumeApi.getAll();
      setResumes(res.data.data || []);
    } catch {
      toast.error('Failed to load resume history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await resumeApi.delete(id);
      setResumes(prev => prev.filter(r => r.id !== id));
      toast.success('Resume deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (resume) => {
    if (!resume.pdf_path) return toast.error('No PDF available');
    window.open(`${API_BASE_URL.replace('/api', '')}${resume.pdf_path}`, '_blank');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) return <FullPageSpinner message="Loading history..." />;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: colors.text, paddingBottom: '64px', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Ambience */}
      <div style={{ position: 'fixed', top: '-10%', left: '-5%', width: '500px', height: '500px', backgroundColor: 'rgba(99,102,241,0.05)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }} />

      {/* Navbar */}
      <nav className="history-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: `1px solid ${colors.border}`, backgroundColor: 'rgba(11, 15, 25, 0.8)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: 'none', color: colors.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={18} />
          </button>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={16} color="#fff" />
          </div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: colors.text }}>Resume History</span>
        </div>
        
        <button
          onClick={() => navigate('/new-resume')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px', backgroundColor: colors.primary, color: '#fff', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px 0 rgba(99,102,241,0.39)', transition: 'all 0.2s' }}
        >
          <Plus size={16} /> New Resume
        </button>
      </nav>

      <main className="history-main" style={{ position: 'relative', zIndex: 10, maxWidth: '1000px', margin: '32px auto', padding: '0 24px' }}>
        {resumes.length === 0 ? (
          <div className="history-empty" style={{ textAlign: 'center', padding: '96px 0' }}>
            <FileText size={64} color={colors.textMuted} style={{ margin: '0 auto 24px auto', opacity: 0.3 }} />
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: colors.text, marginBottom: '8px' }}>No resumes yet</h2>
            <p style={{ color: colors.textMuted, marginBottom: '32px' }}>Create your first tailored resume by pasting a job description.</p>
            <button
              onClick={() => navigate('/new-resume')}
              style={{ padding: '16px 32px', backgroundColor: colors.primary, color: '#fff', fontWeight: 700, borderRadius: '16px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px 0 rgba(99,102,241,0.39)' }}
            >
              Create New Resume
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header */}
            <div className="history-header" style={{ display: 'grid', gridTemplateColumns: '5fr 2fr 2fr 3fr', gap: '16px', padding: '12px 24px', fontSize: '12px', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <div>Resume</div>
              <div style={{ textAlign: 'center' }}>ATS Score</div>
              <div style={{ textAlign: 'center' }}>Created</div>
              <div style={{ textAlign: 'right' }}>Actions</div>
            </div>

            {/* Rows */}
            {resumes.map((resume) => (
              <div
                key={resume.id}
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '16px',
                  padding: '20px 24px',
                  display: 'grid',
                  gridTemplateColumns: '5fr 2fr 2fr 3fr',
                  gap: '16px',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                }}
                className="history-row"
                onMouseEnter={(e) => e.currentTarget.style.borderColor = colors.borderHover}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.border}
              >
                {/* Title */}
                <div className="history-row-title" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.4))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={20} color={colors.primaryLight} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: colors.text, margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{resume.title || 'Untitled Resume'}</h3>
                    <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>v{resume.version_number || 1}</p>
                  </div>
                </div>

                {/* ATS Score */}
                <div className="history-col-ats" style={{ display: 'flex', justifyContent: 'center' }}>
                  <ATSBadge score={resume.ats_score} />
                </div>

                {/* Date */}
                <div className="history-col-date" style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', color: colors.textMuted }}>{formatDate(resume.created_at)}</span>
                </div>

                {/* Actions */}
                <div className="history-col-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    onClick={() => handleDownload(resume)}
                    style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${colors.border}`, color: colors.textMuted, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = colors.text; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = colors.textMuted; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                    title="Download PDF"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => navigate(`/editor/${resume.id}`)}
                    style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${colors.border}`, color: colors.textMuted, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = colors.primaryLight; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = colors.textMuted; e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                    title="Re-edit"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(resume.id)}
                    disabled={deleting === resume.id}
                    style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${colors.border}`, color: colors.textMuted, cursor: deleting === resume.id ? 'not-allowed' : 'pointer', opacity: deleting === resume.id ? 0.5 : 1, transition: 'all 0.2s' }}
                    onMouseEnter={e => { if(deleting !== resume.id) { e.currentTarget.style.color = colors.danger; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; } }}
                    onMouseLeave={e => { if(deleting !== resume.id) { e.currentTarget.style.color = colors.textMuted; e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; } }}
                    title="Delete"
                  >
                    {deleting === resume.id ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
