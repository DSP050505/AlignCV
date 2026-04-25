// ─────────────────────────────────────────────────────────────────
// AlignCV — Profile Wizard Page
// 7-step wizard: Personal → Education → Experience → Projects
//                → Skills → Certifications → Achievements
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, User, GraduationCap, Briefcase, FolderKanban,
  Wrench, Award, ShieldCheck, ArrowLeft, ArrowRight, Check,
  ChevronLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useProfileStore } from '../store/profileStore';
import { profileApi } from '../api/profileApi';
import { FullPageSpinner } from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import PersonalInfoForm from '../components/profile/PersonalInfoForm';
import EducationForm from '../components/profile/EducationForm';
import ExperienceForm from '../components/profile/ExperienceForm';
import ProjectForm from '../components/profile/ProjectForm';
import SkillsForm from '../components/profile/SkillsForm';
import CertificationsForm from '../components/profile/CertificationsForm';
import AchievementsForm from '../components/profile/AchievementsForm';
import ProfileSection from '../components/profile/ProfileSection';
import ResumeUploadPanel from '../components/profile/ResumeUploadPanel';

const STEPS = [
  { key: 'personal',  label: 'Personal',       icon: User },
  { key: 'education', label: 'Education',       icon: GraduationCap },
  { key: 'experience',label: 'Experience',      icon: Briefcase },
  { key: 'projects',  label: 'Projects',        icon: FolderKanban },
  { key: 'skills',    label: 'Skills',          icon: Wrench },
  { key: 'certs',     label: 'Certifications',  icon: ShieldCheck },
  { key: 'achieve',   label: 'Achievements',    icon: Award },
];

export default function ProfileWizardPage() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { loading, fetchProfile, education, experiences, projects, skills, achievements, certifications } = useProfileStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) return <FullPageSpinner message="Loading your profile..." />;

  const goNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else {
      toast.success('Profile complete! 🎉');
      navigate('/dashboard');
    }
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleDeleteEducation = async (id) => {
    await profileApi.deleteEducation(id);
    await useProfileStore.getState().refreshProfile();
    toast.success('Deleted');
  };

  const handleDeleteExperience = async (id) => {
    await profileApi.deleteExperience(id);
    await useProfileStore.getState().refreshProfile();
    toast.success('Deleted');
  };

  const handleDeleteProject = async (id) => {
    await profileApi.deleteProject(id);
    await useProfileStore.getState().refreshProfile();
    toast.success('Deleted');
  };

  const handleDeleteCertification = async (id) => {
    await profileApi.deleteCertification(id);
    await useProfileStore.getState().refreshProfile();
    toast.success('Deleted');
  };

  const handleDeleteAchievement = async (id) => {
    await profileApi.deleteAchievement(id);
    await useProfileStore.getState().refreshProfile();
    toast.success('Deleted');
  };

  // ── Render Item Helpers ──────────────────────────────────────────
  const renderEducationItem = (item) => (
    <div>
      <p className="text-sm font-semibold text-text-white">{item.institution}</p>
      <p className="text-xs text-text-muted">
        {item.degree}{item.cgpa ? ` — GPA: ${item.cgpa}` : ''}
      </p>
    </div>
  );

  const renderExperienceItem = (item) => (
    <div>
      <p className="text-sm font-semibold text-text-white">{item.role}</p>
      <p className="text-xs text-text-muted">{item.company} · {item.type}</p>
      {item.tech_stack?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {item.tech_stack.map((t, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-text-dim">{t}</span>
          ))}
        </div>
      )}
    </div>
  );

  const renderProjectItem = (item) => (
    <div>
      <p className="text-sm font-semibold text-text-white">{item.title}</p>
      {item.description && <p className="text-xs text-text-muted mt-0.5">{item.description}</p>}
      {item.tech_stack?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {item.tech_stack.map((t, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-text-dim">{t}</span>
          ))}
        </div>
      )}
    </div>
  );

  const renderCertItem = (item) => (
    <div>
      <p className="text-sm font-semibold text-text-white">{item.name}</p>
      {item.issuer && <p className="text-xs text-text-muted">{item.issuer}</p>}
    </div>
  );

  const renderAchieveItem = (item) => (
    <div>
      <p className="text-sm font-semibold text-text-white">{item.title}</p>
      {item.description && <p className="text-xs text-text-muted">{item.description}</p>}
    </div>
  );

  // ── Step Content ─────────────────────────────────────────────────
  const renderStepContent = () => {
    switch (STEPS[step].key) {
      case 'personal':
        return (
          <>
            <ResumeUploadPanel onComplete={goNext} />
            <PersonalInfoForm onComplete={goNext} />
          </>
        );

      case 'education':
        return (
          <div className="space-y-4">
            <ProfileSection
              title="Education"
              icon={GraduationCap}
              items={education}
              renderItem={renderEducationItem}
              renderForm={(item, onClose) => <EducationForm item={item} onClose={onClose} />}
              onDelete={handleDeleteEducation}
              emptyMessage="Add your education background"
            />
            <Button onClick={goNext} size="lg" className="w-full">Continue</Button>
          </div>
        );

      case 'experience':
        return (
          <div className="space-y-4">
            <ProfileSection
              title="Experiences"
              icon={Briefcase}
              items={experiences}
              renderItem={renderExperienceItem}
              renderForm={(item, onClose) => <ExperienceForm item={item} onClose={onClose} />}
              onDelete={handleDeleteExperience}
              emptyMessage="Add internships, jobs, or freelance work"
            />
            <Button onClick={goNext} size="lg" className="w-full">Continue</Button>
          </div>
        );

      case 'projects':
        return (
          <div className="space-y-4">
            <ProfileSection
              title="Projects"
              icon={FolderKanban}
              items={projects}
              renderItem={renderProjectItem}
              renderForm={(item, onClose) => <ProjectForm item={item} onClose={onClose} />}
              onDelete={handleDeleteProject}
              emptyMessage="Add your best projects"
            />
            <Button onClick={goNext} size="lg" className="w-full">Continue</Button>
          </div>
        );

      case 'skills':
        return <SkillsForm onComplete={goNext} />;

      case 'certs':
        return (
          <div className="space-y-4">
            <ProfileSection
              title="Certifications"
              icon={ShieldCheck}
              items={certifications}
              renderItem={renderCertItem}
              renderForm={(item, onClose) => <CertificationsForm item={item} onClose={onClose} />}
              onDelete={handleDeleteCertification}
              emptyMessage="Add your certifications"
            />
            <Button onClick={goNext} size="lg" className="w-full">Continue</Button>
          </div>
        );

      case 'achieve':
        return (
          <div className="space-y-4">
            <ProfileSection
              title="Achievements"
              icon={Award}
              items={achievements}
              renderItem={renderAchieveItem}
              renderForm={(item, onClose) => <AchievementsForm item={item} onClose={onClose} />}
              onDelete={handleDeleteAchievement}
              emptyMessage="Add awards, competitions, recognitions"
            />
            <Button onClick={goNext} size="lg" className="w-full">
              <Check className="w-4 h-4" /> Finish & Go to Dashboard
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface-dark relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/6 blur-[100px] animate-float" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-primary-light/4 blur-[80px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border-dark glass">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-white transition-colors cursor-pointer">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-text-white">Profile Wizard</span>
        </div>
        <span className="text-xs text-text-dim">Step {step + 1} of {STEPS.length}</span>
      </nav>

      <main className="relative z-10 max-w-2xl mx-auto px-6 py-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setStep(i)}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer
                ${i === step
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : i < step
                    ? 'bg-success/10 text-success border border-success/20'
                    : 'bg-white/3 text-text-dim border border-border-dark hover:border-border-focus'
                }
              `}
            >
              {i < step ? <Check className="w-3 h-3" /> : <s.icon className="w-3 h-3" />}
              <span className="hidden md:inline">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Step Title */}
        <div className="mb-6 animate-fade-in-up">
          <h2 className="text-xl font-bold text-text-white flex items-center gap-2">
            {(() => { const Icon = STEPS[step].icon; return <Icon className="w-5 h-5 text-primary-light" />; })()}
            {STEPS[step].label}
          </h2>
          <p className="text-text-muted text-sm mt-1">
            {step === 0 && 'Your contact details and social profiles'}
            {step === 1 && 'Add your educational background'}
            {step === 2 && 'Internships, jobs, and work experience'}
            {step === 3 && 'Your best projects with tech stacks'}
            {step === 4 && 'Technical skills by category'}
            {step === 5 && 'Professional certifications'}
            {step === 6 && 'Awards, competitions, and recognitions'}
          </p>
        </div>

        {/* Back Button */}
        {step > 0 && (
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-white mb-4 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to {STEPS[step - 1].label}
          </button>
        )}

        {/* Step Content */}
        <div className="animate-fade-in-up" key={step}>
          {renderStepContent()}
        </div>
      </main>
    </div>
  );
}
