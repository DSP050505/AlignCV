import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { profileApi } from '../../api/profileApi';
import { useProfileStore } from '../../store/profileStore';
import toast from 'react-hot-toast';

export default function ProjectForm({ item, onClose }) {
  const isEdit = !!item;
  const [loading, setLoading] = useState(false);
  const refreshProfile = useProfileStore((s) => s.refreshProfile);

  const [form, setForm] = useState({
    title: item?.title || '',
    description: item?.description || item?.bullets?.join('\n') || '',
    start_date: item?.start_date?.slice(0, 10) || '',
    end_date: item?.end_date?.slice(0, 10) || '',
    repo_url: item?.repo_url || '',
    live_url: item?.live_url || '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Project title is required');
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        bullets: [],
        tech_stack: [],
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        repo_url: form.repo_url || null,
        live_url: form.live_url || null,
      };
      if (isEdit) {
        await profileApi.updateProject(item.id, payload);
        toast.success('Project updated');
      } else {
        await profileApi.createProject(payload);
        toast.success('Project added');
      }
      await refreshProfile();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const colors = {
    inputBg: 'rgba(0, 0, 0, 0.2)',
    border: 'rgba(255, 255, 255, 0.15)',
    borderFocus: '#6366f1',
    text: '#ffffff',
    textMuted: 'rgba(255, 255, 255, 0.4)',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Input id="proj-title" name="title" label="Project Title" placeholder="e.g. AlignCV" value={form.title} onChange={handleChange} />

      <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
        <div style={{ flex: 1 }}><Input id="proj-start" name="start_date" label="Start Date" type="date" value={form.start_date} onChange={handleChange} /></div>
        <div style={{ flex: 1 }}><Input id="proj-end" name="end_date" label="End Date" type="date" value={form.end_date} onChange={handleChange} /></div>
      </div>

      <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
        <div style={{ flex: 1 }}><Input id="proj-repo" name="repo_url" label="Repository URL" placeholder="https://github.com/..." value={form.repo_url} onChange={handleChange} /></div>
        <div style={{ flex: 1 }}><Input id="proj-live" name="live_url" label="Live URL" placeholder="https://myapp.com" value={form.live_url} onChange={handleChange} /></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '11px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Project Description (What did you do?)
        </label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={4}
          placeholder="A brief overview of the project and your technical contributions. Our AI will automatically translate this into professional resume bullet points if you are generating a resume."
          style={{
            width: '100%',
            backgroundColor: colors.inputBg,
            border: `1.5px solid ${colors.border}`,
            borderRadius: '10px',
            color: colors.text,
            fontSize: '14px',
            padding: '12px 16px',
            outline: 'none',
            resize: 'none',
            lineHeight: 1.5,
          }}
          onFocus={(e) => (e.target.style.borderColor = colors.borderFocus)}
          onBlur={(e) => (e.target.style.borderColor = colors.border)}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button type="submit" size="sm" loading={loading}>{isEdit ? 'Update' : 'Add'}</Button>
      </div>
    </form>
  );
}
