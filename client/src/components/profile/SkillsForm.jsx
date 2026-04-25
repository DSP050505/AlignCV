import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { profileApi } from '../../api/profileApi';
import { useProfileStore } from '../../store/profileStore';
import toast from 'react-hot-toast';

export default function SkillsForm({ onComplete }) {
  const skills = useProfileStore((s) => s.skills);
  const setSkills = useProfileStore((s) => s.setSkills);
  const [loading, setLoading] = useState(false);
  const [localSkills, setLocalSkills] = useState(skills.length > 0 ? skills : []);
  const [newSkill, setNewSkill] = useState('');

  const colors = {
    inputBg: 'rgba(0, 0, 0, 0.2)',
    border: 'rgba(255, 255, 255, 0.15)',
    borderFocus: '#6366f1',
    text: '#ffffff',
    textMuted: 'rgba(255, 255, 255, 0.5)',
    primary: '#6366f1',
    primaryLight: '#818cf8',
    danger: '#ef4444',
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    const exists = localSkills.find(
      (s) => s.name.toLowerCase() === newSkill.trim().toLowerCase()
    );
    if (exists) return toast.error('Skill already added');
    // AI will determine category later; defaulting to 'Other'
    setLocalSkills([...localSkills, { name: newSkill.trim(), category: 'Other', level: 'intermediate' }]);
    setNewSkill('');
  };

  const removeSkill = (idx) => {
    setLocalSkills(localSkills.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await profileApi.bulkUpdateSkills(
        localSkills.map(({ name, category, level }) => ({ name, category, level }))
      );
      setSkills(data.data);
      toast.success('Skills saved!');
      onComplete?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Add Skill Input Row */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Skill Name
          </label>
          <input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. React, Python, Docker"
            style={{
              width: '100%',
              backgroundColor: colors.inputBg,
              border: `1.5px solid ${colors.border}`,
              borderRadius: '10px',
              color: colors.text,
              fontSize: '14px',
              padding: '12px 16px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = colors.borderFocus)}
            onBlur={(e) => (e.target.style.borderColor = colors.border)}
          />
        </div>
        <button
          type="button"
          onClick={addSkill}
          style={{
            height: '46px',
            width: '46px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: `1px solid ${colors.border}`,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.text,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Skills Display */}
      {localSkills.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {localSkills.map((skill, idx) => (
            <span
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.2)',
                color: colors.primaryLight,
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {skill.name}
              <button
                onClick={() => removeSkill(idx)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.primaryLight,
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p style={{ color: colors.textMuted, fontSize: '13px', margin: 0, textAlign: 'center', padding: '12px 0' }}>
          No skills added yet. Type a skill name and press Enter.
        </p>
      )}

      {/* Footer / Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: colors.primary,
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#4f46e5';
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = colors.primary;
          }}
        >
          {loading ? 'Saving...' : 'Save Skills'}
        </button>
      </div>
    </div>
  );
}
