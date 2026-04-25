import { useState } from 'react';
import { Mail, Phone, Code, Link, Globe, Trophy, User } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { profileApi } from '../../api/profileApi';
import { useProfileStore } from '../../store/profileStore';
import toast from 'react-hot-toast';

export default function PersonalInfoForm({ onComplete }) {
  const personal = useProfileStore((s) => s.personal);
  const setPersonal = useProfileStore((s) => s.setPersonal);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: personal.full_name || '',
    email: personal.email || '',
    phone: personal.phone || '',
    github: personal.github || '',
    linkedin: personal.linkedin || '',
    leetcode: personal.leetcode || '',
    portfolio: personal.portfolio || '',
    headline: personal.headline || '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await profileApi.updatePersonal(form);
      setPersonal(data.data);
      toast.success('Personal info saved!');
      onComplete?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Input id="pi-name" name="full_name" label="Full Professional Name" icon={User} placeholder="e.g. John Doe" value={form.full_name} onChange={handleChange} />
      <Input id="pi-headline" name="headline" label="Headline / Title" icon={Trophy} placeholder="e.g. Full-Stack Developer" value={form.headline} onChange={handleChange} />

      <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
        <div style={{ flex: 1 }}><Input id="pi-email" name="email" label="Email" icon={Mail} type="email" placeholder="you@email.com" value={form.email} onChange={handleChange} /></div>
        <div style={{ flex: 1 }}><Input id="pi-phone" name="phone" label="Phone" icon={Phone} placeholder="+91 98765 43210" value={form.phone} onChange={handleChange} /></div>
      </div>

      <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
        <div style={{ flex: 1 }}><Input id="pi-github" name="github" label="GitHub Profile Link" icon={Code} placeholder="https://github.com/..." value={form.github} onChange={handleChange} /></div>
        <div style={{ flex: 1 }}><Input id="pi-linkedin" name="linkedin" label="LinkedIn Profile Link" icon={Link} placeholder="https://linkedin.com/in/..." value={form.linkedin} onChange={handleChange} /></div>
      </div>

      <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
        <div style={{ flex: 1 }}><Input id="pi-leetcode" name="leetcode" label="LeetCode Profile Link" icon={Code} placeholder="https://leetcode.com/u/..." value={form.leetcode} onChange={handleChange} /></div>
        <div style={{ flex: 1 }}><Input id="pi-portfolio" name="portfolio" label="Portfolio URL" icon={Globe} placeholder="https://yoursite.com" value={form.portfolio} onChange={handleChange} /></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
        <Button type="submit" loading={loading} size="sm">
          Save & Continue
        </Button>
      </div>
    </form>
  );
}
