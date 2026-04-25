import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  User,
  GraduationCap,
  Briefcase,
  FolderKanban,
  Wrench,
  Award,
  ShieldCheck,
  FileUp,
  Eye,
} from 'lucide-react';
import { useProfileStore } from '../store/profileStore';
import { profileApi } from '../api/profileApi';
import { FullPageSpinner } from '../components/ui/Spinner';
import ProfileSection from '../components/profile/ProfileSection';
import ResumeUploadPanel from '../components/profile/ResumeUploadPanel';
import PersonalInfoForm from '../components/profile/PersonalInfoForm';
import EducationForm from '../components/profile/EducationForm';
import ExperienceForm from '../components/profile/ExperienceForm';
import ProjectForm from '../components/profile/ProjectForm';
import SkillsForm from '../components/profile/SkillsForm';
import CertificationsForm from '../components/profile/CertificationsForm';
import AchievementsForm from '../components/profile/AchievementsForm';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { loading, fetchProfile, personal, education, experiences, projects, achievements, certifications, completeness } = useProfileStore();
  const [showUpload, setShowUpload] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) return <FullPageSpinner message="Loading your profile..." />;

  const handleDelete = async (type, id) => {
    try {
      if (type === 'education') await profileApi.deleteEducation(id);
      if (type === 'experience') await profileApi.deleteExperience(id);
      if (type === 'project') await profileApi.deleteProject(id);
      if (type === 'cert') await profileApi.deleteCertification(id);
      if (type === 'achieve') await profileApi.deleteAchievement(id);
      await useProfileStore.getState().refreshProfile();
      toast.success('Deleted');
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

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

  const renderPersonal = () => (
    <div
      style={{
        backgroundColor: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
        <button
          onClick={() => setEditingPersonal(!editingPersonal)}
          style={{
            fontSize: '12px',
            color: colors.primaryLight,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {editingPersonal ? 'Cancel' : 'Edit Info'}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.6))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 700,
            color: '#fff',
          }}
        >
          {personal?.full_name ? personal.full_name[0].toUpperCase() : personal?.email?.[0].toUpperCase() || 'U'}
        </div>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: colors.text, margin: '0 0 4px 0' }}>
            {personal?.full_name || personal?.email || 'Your Profile'}
          </h2>
          <p style={{ fontSize: '14px', color: colors.textMuted, margin: 0 }}>
            {personal?.headline || 'Add a professional headline'}
          </p>
        </div>
      </div>

      {editingPersonal ? (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
          <PersonalInfoForm onComplete={() => setEditingPersonal(false)} />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginTop: '24px',
          }}
        >
          <div>
            <p style={{ fontSize: '11px', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Phone</p>
            <p style={{ fontSize: '13px', color: colors.text, margin: 0 }}>{personal?.phone || '—'}</p>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Completeness</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${completeness}%`, backgroundColor: colors.primaryLight }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: colors.primaryLight }}>{completeness}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: colors.bg,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: colors.text,
      }}
    >
      {/* Navbar */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: 'rgba(11, 15, 25, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '6px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: 'none',
              color: colors.textSecondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: '16px', fontWeight: 700, color: colors.text }}>
            Career Profile
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/profile/preview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: colors.textSecondary,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
          >
            <Eye size={16} /> View Profile
          </button>
          <button
            onClick={() => setShowUpload(!showUpload)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '12px',
              backgroundColor: 'rgba(99,102,241,0.2)',
              border: '1px solid rgba(99,102,241,0.4)',
              color: colors.primaryLight,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.2)')}
          >
            <FileUp size={16} /> Upload Resume
          </button>
        </div>
      </nav>

      {/* Main Grid Layout */}
      <main
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '32px 24px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 4fr)',
          gap: '32px',
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN: Main Resume Content Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {showUpload && (
            <div style={{ marginBottom: '24px' }}>
              <ResumeUploadPanel onComplete={() => setShowUpload(false)} />
            </div>
          )}

          <ProfileSection
            title="Education"
            icon={GraduationCap}
            items={education}
            renderItem={(i) => (
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 2px 0' }}>{i.institution}</p>
                <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>{i.degree}</p>
              </div>
            )}
            renderForm={(i, close) => <EducationForm item={i} onClose={close} />}
            onDelete={(id) => handleDelete('education', id)}
          />

          <ProfileSection
            title="Experience"
            icon={Briefcase}
            items={experiences}
            renderItem={(i) => (
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 2px 0' }}>{i.role} at {i.company}</p>
                <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>{i.type}</p>
              </div>
            )}
            renderForm={(i, close) => <ExperienceForm item={i} onClose={close} />}
            onDelete={(id) => handleDelete('experience', id)}
          />

          <ProfileSection
            title="Projects"
            icon={FolderKanban}
            items={projects}
            renderItem={(i) => (
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 2px 0' }}>{i.title}</p>
                <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                  {i.description}
                </p>
              </div>
            )}
            renderForm={(i, close) => <ProjectForm item={i} onClose={close} />}
            onDelete={(id) => handleDelete('project', id)}
          />

          <div
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <Wrench size={20} color={colors.primaryLight} />
              <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Skills
              </h3>
            </div>
            <SkillsForm />
          </div>
        </div>

        {/* RIGHT COLUMN: Personal Info & Extras */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {renderPersonal()}

          <ProfileSection
            title="Certifications"
            icon={ShieldCheck}
            items={certifications}
            renderItem={(i) => (
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 2px 0' }}>{i.name}</p>
                <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>{i.issuer}</p>
              </div>
            )}
            renderForm={(i, close) => <CertificationsForm item={i} onClose={close} />}
            onDelete={(id) => handleDelete('cert', id)}
          />

          <ProfileSection
            title="Achievements"
            icon={Award}
            items={achievements}
            renderItem={(i) => (
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{i.title}</p>
              </div>
            )}
            renderForm={(i, close) => <AchievementsForm item={i} onClose={close} />}
            onDelete={(id) => handleDelete('achieve', id)}
          />
        </div>
      </main>
    </div>
  );
}
