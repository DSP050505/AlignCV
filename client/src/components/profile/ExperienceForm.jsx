import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { profileApi } from '../../api/profileApi';
import { useProfileStore } from '../../store/profileStore';
import toast from 'react-hot-toast';

export default function ExperienceForm({ item, onClose }) {
  const isEdit = !!item;
  const [loading, setLoading] = useState(false);
  const refreshProfile = useProfileStore((s) => s.refreshProfile);

  const [form, setForm] = useState({
    company: item?.company || '',
    role: item?.role || '',
    type: item?.type || 'job',
    location: item?.location || '',
    start_date: item?.start_date?.slice(0, 10) || '',
    end_date: item?.end_date?.slice(0, 10) || '',
    is_current: item?.is_current || false,
    description: item?.bullets?.join('\n') || '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) return toast.error('Company and role are required');
    setLoading(true);
    try {
      const payload = {
        company: form.company,
        role: form.role,
        type: form.type,
        location: form.location || null,
        start_date: form.start_date || null,
        end_date: form.is_current ? null : (form.end_date || null),
        is_current: form.is_current,
        // Send description as a single bullet; the AI translates it to professional bullets later.
        bullets: form.description ? [form.description.trim()] : [],
        tech_stack: [],
      };
      if (isEdit) {
        await profileApi.updateExperience(item.id, payload);
        toast.success('Experience updated');
      } else {
        await profileApi.createExperience(payload);
        toast.success('Experience added');
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
    accent: '#6366f1',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
        <div style={{ flex: 1 }}><Input id="exp-company" name="company" label="Company" placeholder="e.g. Google" value={form.company} onChange={handleChange} /></div>
        <div style={{ flex: 1 }}><Input id="exp-role" name="role" label="Role" placeholder="Software Engineer Intern" value={form.role} onChange={handleChange} /></div>
      </div>

      <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</label>
          <select name="type" value={form.type} onChange={handleChange}
            style={{
              width: '100%',
              backgroundColor: colors.inputBg,
              border: `1.5px solid ${colors.border}`,
              borderRadius: '10px',
              color: colors.text,
              fontSize: '14px',
              padding: '12px 16px',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
            }}>
            <option value="job">Job</option>
            <option value="internship">Internship</option>
            <option value="freelance">Freelance</option>
          </select>
        </div>
        <div style={{ flex: 1 }}><Input id="exp-start" name="start_date" label="Start Date" type="date" value={form.start_date} onChange={handleChange} /></div>
        <div style={{ flex: 1 }}><Input id="exp-end" name="end_date" label="End Date" type="date" value={form.end_date} onChange={handleChange} disabled={form.is_current} /></div>
      </div>

      <div style={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <Input id="exp-loc" name="location" label="Location" placeholder="Bangalore, India" value={form.location} onChange={handleChange} />
        </div>
        <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: colors.textMuted, cursor: 'pointer', paddingBottom: '14px' }}>
          <input type="checkbox" name="is_current" checked={form.is_current} onChange={handleChange} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
          Currently working here
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '11px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Role Description (What did you do?)
        </label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={4}
          placeholder="Briefly describe your responsibilities and achievements. Our AI will automatically generate professional resume bullet points from this."
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
