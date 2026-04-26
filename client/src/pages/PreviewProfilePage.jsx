import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useProfileStore } from '../store/profileStore';
import { FullPageSpinner } from '../components/ui/Spinner';

export default function PreviewProfilePage() {
  const navigate = useNavigate();
  const { loading, fetchProfile, personal, education, experiences, projects, achievements, certifications, skills } = useProfileStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) return <FullPageSpinner message="Loading your profile..." />;

  const colors = {
    bg: '#0B0F19',
    card: 'rgba(255, 255, 255, 0.02)',
    border: 'rgba(255, 255, 255, 0.08)',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    textMuted: 'rgba(255, 255, 255, 0.4)',
    primary: '#6366f1',
    primaryLight: '#818cf8',
  };

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: '32px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: colors.primaryLight, marginBottom: '16px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '8px' }}>
        {title}
      </h3>
      {children}
    </div>
  );

  const EmptyState = () => (
    <p style={{ color: colors.textMuted, fontStyle: 'italic', fontSize: '14px' }}>Yet to update</p>
  );

  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: colors.bg, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: colors.text, paddingBottom: '64px' }}>
      <nav style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: `1px solid ${colors.border}`, backgroundColor: 'rgba(11, 15, 25, 0.8)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => navigate(-1)} style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: 'none', color: colors.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
          <ChevronLeft size={18} />
        </button>
        <span style={{ fontSize: '16px', fontWeight: 700, color: colors.text }}>Preview Profile</span>
      </nav>

      <main className="preview-main" style={{ maxWidth: '800px', margin: '40px auto', padding: '0 24px' }}>
        
        {/* Header (Personal Info) */}
        <div className="preview-header" style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px' }}>
          <div className="preview-avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.6))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {personal?.full_name ? personal.full_name[0].toUpperCase() : personal?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1 }}>
            <h1 className="preview-name" style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0', color: colors.text }}>
              {personal?.full_name || personal?.email || 'Your Profile'}
            </h1>
            <p style={{ fontSize: '16px', color: colors.textSecondary, margin: '0 0 12px 0' }}>{personal?.headline || 'Headline not updated'}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '14px', color: colors.textMuted }}>
              {personal?.email && <span>{personal.email}</span>}
              {personal?.phone && <span>{personal.phone}</span>}
              {personal?.github && <a href={personal.github} target="_blank" rel="noreferrer" style={{ color: colors.primaryLight, textDecoration: 'none' }}>GitHub</a>}
              {personal?.linkedin && <a href={personal.linkedin} target="_blank" rel="noreferrer" style={{ color: colors.primaryLight, textDecoration: 'none' }}>LinkedIn</a>}
              {personal?.portfolio && <a href={personal.portfolio} target="_blank" rel="noreferrer" style={{ color: colors.primaryLight, textDecoration: 'none' }}>Portfolio</a>}
            </div>
          </div>
        </div>

        {/* Education */}
        <Section title="Education">
          {education?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {education.map(ed => (
                <div key={ed.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0' }}>{ed.institution}</h4>
                    <span style={{ fontSize: '13px', color: colors.textMuted }}>{ed.start_date?.slice(0,4)} - {ed.end_date?.slice(0,4) || 'Present'}</span>
                  </div>
                  <p style={{ fontSize: '14px', color: colors.textSecondary, margin: '0 0 4px 0' }}>{ed.degree} in {ed.field}</p>
                  {ed.cgpa && <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>CGPA: {ed.cgpa}</p>}
                </div>
              ))}
            </div>
          ) : <EmptyState />}
        </Section>

        {/* Experience */}
        <Section title="Experience">
          {experiences?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {experiences.map(exp => (
                <div key={exp.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0' }}>{exp.role} at {exp.company}</h4>
                    <span style={{ fontSize: '13px', color: colors.textMuted }}>{exp.start_date?.slice(0,4)} - {exp.end_date?.slice(0,4) || 'Present'}</span>
                  </div>
                  {exp.bullets?.length > 0 && (
                    <ul style={{ marginTop: '8px', paddingLeft: '16px', color: colors.textSecondary, fontSize: '14px', lineHeight: 1.6 }}>
                      {exp.bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : <EmptyState />}
        </Section>

        {/* Projects */}
        <Section title="Projects">
          {projects?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {projects.map(proj => (
                <div key={proj.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0' }}>{proj.title}</h4>
                    <span style={{ fontSize: '13px', color: colors.textMuted }}>{proj.start_date?.slice(0,4)} - {proj.end_date?.slice(0,4) || 'Present'}</span>
                  </div>
                  {proj.description && <p style={{ fontSize: '14px', color: colors.textSecondary, margin: '4px 0 8px 0', lineHeight: 1.5 }}>{proj.description}</p>}
                  {proj.live_url && <a href={proj.live_url} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: colors.primaryLight, marginRight: '12px', textDecoration: 'none' }}>Live URL</a>}
                  {proj.repo_url && <a href={proj.repo_url} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: colors.primaryLight, textDecoration: 'none' }}>Repository</a>}
                </div>
              ))}
            </div>
          ) : <EmptyState />}
        </Section>

        {/* Skills */}
        <Section title="Skills">
          {skills?.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {skills.map(s => (
                <span key={s.id} style={{ padding: '6px 12px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.05)', fontSize: '13px', color: colors.textSecondary }}>
                  {s.name}
                </span>
              ))}
            </div>
          ) : <EmptyState />}
        </Section>

      </main>
    </div>
  );
}
