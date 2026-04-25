import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { profileApi } from '../../api/profileApi';
import { useProfileStore } from '../../store/profileStore';
import toast from 'react-hot-toast';

export default function EducationForm({ item, onClose }) {
  const isEdit = !!item;
  const [loading, setLoading] = useState(false);
  const refreshProfile = useProfileStore((s) => s.refreshProfile);

  const [form, setForm] = useState({
    institution: item?.institution || '',
    degree: item?.degree || '',
    field: item?.field || '',
    start_date: item?.start_date?.slice(0, 10) || '',
    end_date: item?.end_date?.slice(0, 10) || '',
    cgpa: item?.cgpa || '',
    location: item?.location || '',
    is_current: item?.is_current || false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.institution.trim()) return toast.error('Institution is required');
    setLoading(true);
    try {
      const payload = {
        ...form,
        cgpa: form.cgpa ? parseFloat(form.cgpa) : null,
        start_date: form.start_date || null,
        end_date: form.is_current ? null : (form.end_date || null),
      };
      if (isEdit) {
        await profileApi.updateEducation(item.id, payload);
        toast.success('Education updated');
      } else {
        await profileApi.createEducation(payload);
        toast.success('Education added');
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
    textMuted: 'rgba(255, 255, 255, 0.4)',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Input id="edu-inst" name="institution" label="Institution" placeholder="e.g. IIT Bombay" value={form.institution} onChange={handleChange} />

      <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
        <div style={{ flex: 1 }}><Input id="edu-degree" name="degree" label="Degree" placeholder="B.Tech" value={form.degree} onChange={handleChange} /></div>
      </div>

      <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
        <div style={{ flex: 1 }}><Input id="edu-start" name="start_date" label="Start Date" type="date" value={form.start_date} onChange={handleChange} /></div>
        <div style={{ flex: 1 }}><Input id="edu-end" name="end_date" label="End Date" type="date" value={form.end_date} onChange={handleChange} disabled={form.is_current} /></div>
        <div style={{ flex: 1 }}><Input id="edu-cgpa" name="cgpa" label="CGPA" type="number" placeholder="8.5" value={form.cgpa} onChange={handleChange} /></div>
      </div>

      <div style={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'flex-end' }}>
        <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: colors.textMuted, cursor: 'pointer', paddingBottom: '14px' }}>
          <input type="checkbox" name="is_current" checked={form.is_current} onChange={handleChange} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
          Currently studying here
        </label>
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button type="submit" size="sm" loading={loading}>{isEdit ? 'Update' : 'Add'}</Button>
      </div>
    </form>
  );
}
