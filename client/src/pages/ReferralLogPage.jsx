import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { referralApi } from '../api/referralApi';
import toast from 'react-hot-toast';
import { ChevronLeft, Radar, ChevronDown, MessageSquare, StickyNote } from 'lucide-react';

const C = { bg:'#070c1a', card:'rgba(10,17,38,0.95)', border:'rgba(99,102,241,0.3)', primary:'#6366f1', primaryLight:'#818cf8', text:'#e8eaf6', textSec:'rgba(148,151,255,0.7)', success:'#10b981', warning:'#f59e0b', danger:'#ef4444' };
const statusColors = { prepared:{ bg:'rgba(255,255,255,0.06)', text:'#9ca3af' }, sent:{ bg:'rgba(59,130,246,0.12)', text:'#60a5fa' }, responded:{ bg:'rgba(245,158,11,0.12)', text:'#fbbf24' }, referred:{ bg:'rgba(16,185,129,0.12)', text:'#6ee7b7' }, 'no response':{ bg:'rgba(239,68,68,0.12)', text:'#f87171' } };
const statusOptions = ['prepared','sent','responded','referred','no response'];

export default function ReferralLogPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteId, setNoteId] = useState(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => { fetchLog(); }, []);
  const fetchLog = async () => { try { const r = await referralApi.getLog(); setRecords(r.data.data || []); } catch {} finally { setLoading(false); } };

  const updateStatus = async (id, status) => {
    try { const r = await referralApi.updateOutreach(id, { status }); setRecords(prev => prev.map(p => p.id === id ? r.data.data : p)); toast.success(`Updated to ${status}`); } catch { toast.error('Update failed'); }
  };

  const saveNote = async (id) => {
    try { await referralApi.updateOutreach(id, { notes: noteText }); setRecords(prev => prev.map(p => p.id === id ? { ...p, notes: noteText } : p)); setNoteId(null); toast.success('Note saved'); } catch { toast.error('Failed'); }
  };

  const total = records.length;
  const sent = records.filter(r => r.status !== 'prepared').length;
  const responded = records.filter(r => r.status === 'responded' || r.status === 'referred').length;
  const referred = records.filter(r => r.status === 'referred').length;

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'Inter',sans-serif", color:C.text }}>
      <nav style={{ display:'flex', alignItems:'center', padding:'14px 32px', borderBottom:'1px solid rgba(255,255,255,0.08)', background:'rgba(11,15,25,0.95)', position:'sticky', top:0, zIndex:50 }}>
        <button onClick={() => navigate('/dashboard')} style={{ background:'none', border:'none', color:C.textSec, cursor:'pointer', display:'flex', marginRight:12 }}><ChevronLeft size={20}/></button>
        <Radar size={20} color={C.primaryLight}/>
        <span style={{ fontSize:17, fontWeight:700, marginLeft:8 }}>Referral <span style={{ color:C.primaryLight }}>Log</span></span>
        <div style={{ flex:1 }}/>
        <button onClick={() => navigate('/referral')} style={{ padding:'8px 16px', background:C.primary, border:'none', borderRadius:8, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>+ New Referral</button>
      </nav>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 24px' }}>
        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:32 }}>
          {[['Total Outreach', total, C.primaryLight],['Sent', sent, '#60a5fa'],['Responses', responded, C.warning],['Referrals ✓', referred, C.success]].map(([label, val, color]) => (
            <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'20px 16px', textAlign:'center' }}>
              <div style={{ fontSize:28, fontWeight:800, color }}>{val}</div>
              <div style={{ fontSize:11, color:C.textSec, fontWeight:600, letterSpacing:1, textTransform:'uppercase', marginTop:4 }}>{label}</div>
            </div>
          ))}
        </div>

        {loading ? <p style={{ textAlign:'center', color:C.textSec }}>Loading...</p> :
        records.length === 0 ? <div style={{ textAlign:'center', padding:60 }}><MessageSquare size={40} color={C.textSec} style={{ margin:'0 auto 12px' }}/><p style={{ color:C.textSec }}>No referral outreach yet.</p><button onClick={() => navigate('/referral')} style={{ padding:'10px 20px', background:C.primary, border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', marginTop:12 }}>Start First Referral</button></div> :
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden' }}>
          {/* Header */}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 1.5fr 1fr 1fr 80px', padding:'12px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:1.5, textTransform:'uppercase' }}>
            <span>Person</span><span>Company</span><span>Role Applied</span><span>Sent</span><span>Status</span><span></span>
          </div>
          {records.map(r => { const sc = statusColors[r.status] || statusColors.prepared; return (
            <div key={r.id}>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 1.5fr 1fr 1fr 80px', padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.04)', alignItems:'center', fontSize:13 }}>
                <div><div style={{ fontWeight:600 }}>{r.person_name}</div>{r.person_role && <div style={{ fontSize:11, color:C.textSec }}>{r.person_role}</div>}</div>
                <span style={{ color:C.textSec }}>{r.company_name}</span>
                <span style={{ color:C.textSec, fontSize:12 }}>{r.role_title || '-'}</span>
                <span style={{ fontSize:11, color:C.textSec }}>{r.sent_at ? new Date(r.sent_at).toLocaleDateString() : '-'}</span>
                <div style={{ position:'relative' }}>
                  <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)} style={{ appearance:'none', padding:'4px 24px 4px 10px', background:sc.bg, color:sc.text, border:`1px solid ${sc.text}30`, borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer', outline:'none' }}>
                    {statusOptions.map(s => <option key={s} value={s} style={{ background:'#111', color:'#fff' }}>{s}</option>)}
                  </select>
                </div>
                <button onClick={() => { setNoteId(noteId === r.id ? null : r.id); setNoteText(r.notes || ''); }} style={{ background:'none', border:'none', color:C.textSec, cursor:'pointer', fontSize:11, display:'flex', alignItems:'center', gap:4 }}><StickyNote size={12}/> Note</button>
              </div>
              {noteId === r.id && (
                <div style={{ padding:'8px 20px 14px', display:'flex', gap:8 }}>
                  <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..." style={{ flex:1, padding:'8px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`, borderRadius:6, color:C.text, fontSize:12, outline:'none' }}/>
                  <button onClick={() => saveNote(r.id)} style={{ padding:'8px 14px', background:C.primary, border:'none', borderRadius:6, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>Save</button>
                </div>
              )}
            </div>
          );})}
        </div>}
      </div>
    </div>
  );
}
