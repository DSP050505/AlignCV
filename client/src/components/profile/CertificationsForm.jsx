import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { profileApi } from '../../api/profileApi';
import { useProfileStore } from '../../store/profileStore';
import toast from 'react-hot-toast';

export default function CertificationsForm({ item, onClose }) {
  const isEdit = !!item;
  const [loading, setLoading] = useState(false);
  const refreshProfile = useProfileStore((s) => s.refreshProfile);

  const [form, setForm] = useState({
    name: item?.name || '',
    issuer: item?.issuer || '',
    issued_at: item?.issued_at?.slice(0, 10) || '',
    expires_at: item?.expires_at?.slice(0, 10) || '',
    url: item?.url || '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Certification name is required');
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        issuer: form.issuer || null,
        issued_at: form.issued_at || null,
        expires_at: form.expires_at || null,
        url: form.url || null,
      };
      if (isEdit) {
        await profileApi.updateCertification(item.id, payload);
        toast.success('Certification updated');
      } else {
        await profileApi.createCertification(payload);
        toast.success('Certification added');
      }
      await refreshProfile();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Input id="cert-name" name="name" label="Certification Name" placeholder="e.g. AWS Solutions Architect" value={form.name} onChange={handleChange} />

      <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
        <div style={{ flex: 1 }}><Input id="cert-issuer" name="issuer" label="Issuer" placeholder="Amazon Web Services" value={form.issuer} onChange={handleChange} /></div>
        <div style={{ flex: 1 }}><Input id="cert-url" name="url" label="Certificate URL" placeholder="https://..." value={form.url} onChange={handleChange} /></div>
      </div>

      <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
        <div style={{ flex: 1 }}><Input id="cert-issued" name="issued_at" label="Issued Date" type="date" value={form.issued_at} onChange={handleChange} /></div>
        <div style={{ flex: 1 }}><Input id="cert-expires" name="expires_at" label="Expires Date" type="date" value={form.expires_at} onChange={handleChange} /></div>
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button type="submit" size="sm" loading={loading}>{isEdit ? 'Update' : 'Add'}</Button>
      </div>
    </form>
  );
}
