import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { profileApi } from '../../api/profileApi';
import { useProfileStore } from '../../store/profileStore';
import toast from 'react-hot-toast';

export default function AchievementsForm({ item, onClose }) {
  const isEdit = !!item;
  const [loading, setLoading] = useState(false);
  const refreshProfile = useProfileStore((s) => s.refreshProfile);

  const [form, setForm] = useState({
    title: item?.title || '',
    description: item?.description || '',
    date: item?.date?.slice(0, 10) || '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Achievement title is required');
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        date: form.date || null,
      };
      if (isEdit) {
        await profileApi.updateAchievement(item.id, payload);
        toast.success('Achievement updated');
      } else {
        await profileApi.createAchievement(payload);
        toast.success('Achievement added');
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
    bg: 'rgba(0, 0, 0, 0.2)',
    border: 'rgba(255, 255, 255, 0.15)',
    borderFocus: '#6366f1',
    text: '#ffffff',
    textMuted: 'rgba(255, 255, 255, 0.4)',
  };

  const [isDescFocused, setIsDescFocused] = useState(false);

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Input id="ach-title" name="title" label="Achievement Title" placeholder="e.g. 1st Place in HackMIT 2024" value={form.title} onChange={handleChange} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
        <label style={{ fontSize: '11px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
          Description (optional)
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          onFocus={() => setIsDescFocused(true)}
          onBlur={() => setIsDescFocused(false)}
          rows={2}
          placeholder="Brief description of the achievement"
          style={{
            width: '100%',
            backgroundColor: colors.bg,
            border: `1.5px solid ${isDescFocused ? colors.borderFocus : colors.border}`,
            borderRadius: '10px',
            color: colors.text,
            fontSize: '14px',
            padding: '12px 16px',
            outline: 'none',
            transition: 'border-color 0.2s',
            resize: 'none',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <div style={{ width: '50%' }}>
        <Input id="ach-date" name="date" label="Date" type="date" value={form.date} onChange={handleChange} />
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button type="submit" size="sm" loading={loading}>{isEdit ? 'Update' : 'Add'}</Button>
      </div>
    </form>
  );
}
