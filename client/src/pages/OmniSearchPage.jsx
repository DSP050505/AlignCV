import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { resumeApi } from '../api/resumeApi';
import { useAuthStore } from '../store/authStore';
import CinematicSearch from '../components/omnisearch/CinematicSearch';

const OmniSearchPage = () => {
  const navigate = useNavigate();
  const token = useAuthStore(s => s.token);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  
  // Search Params
  const [title, setTitle] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState('');
  
  // State
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [searchStatus, setSearchStatus] = useState('idle'); // idle, running, completed, failed
  const [jobId, setJobId] = useState(null);
  
  // Progress State
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState([]);

  // Cinematic mode
  const [cinematicMode, setCinematicMode] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  // Colors
  const colors = {
    bg: '#0B0F19', 
    card: 'rgba(255, 255, 255, 0.03)', 
    cardHover: 'rgba(255, 255, 255, 0.05)',
    primary: '#6366f1', 
    primaryLight: '#818cf8', 
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)', 
    textMuted: 'rgba(255, 255, 255, 0.5)',
    border: 'rgba(255, 255, 255, 0.08)', 
    accent: '#10b981',
    pink: '#EC4899',
    pinkLight: '#F472B6',
    yellow: '#F59E0B',
    red: '#EF4444'
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const res = await resumeApi.getAll();
      setResumes(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch resumes', error);
    } finally {
      setLoadingResumes(false);
    }
  };

  const handleResumeSelect = async (e) => {
    const id = e.target.value;
    setSelectedResumeId(id);
    if (!id) return;

    setExtracting(true);
    try {
      const res = await api.post('/omnisearch/extract', { resumeId: id });
      if (res.data.params) {
        setTitle(res.data.params.title || res.data.params.target_role || res.data.params.name || '');
        
        let exp = parseInt(res.data.params.yearsExperience || res.data.params.experience, 10);
        if (!isNaN(exp)) {
          if (exp <= 1) setExperience('0-1');
          else if (exp <= 2) setExperience('1-2');
          else if (exp <= 3) setExperience('2-3');
          else setExperience('>3');
        } else {
          setExperience('');
        }
        
        let extractedSkills = res.data.params.skills || [];
        if (typeof extractedSkills === 'string') extractedSkills = extractedSkills.split(',');
        setSkills(Array.isArray(extractedSkills) ? extractedSkills.join(', ') : '');
      }
    } catch (err) {
      console.error('Extraction failed', err);
      alert('Failed to extract parameters from resume.');
    } finally {
      setExtracting(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!title) return alert('Job title is required');

    // Trigger cinematic fade-out
    setFadeOut(true);
    
    setTimeout(async () => {
      setCinematicMode(true);
      setSearchStatus('running');
      setLogs([]);
      setProgress(0);
      setResults([]);

      try {
        const res = await api.post('/omnisearch/search', {
          title,
          experience,
          skills: skills.split(',').map(s => s.trim())
        });
        
        const newJobId = res.data.searchJobId;
        setJobId(newJobId);
        pollStatus(newJobId);
      } catch (err) {
        setSearchStatus('failed');
      }
    }, 800); // Wait for fade animation
  };

  const pollStatus = (id) => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/omnisearch/status/${id}`);
        const data = res.data;
        setProgress(data.progress);
        setLogs(data.logs);
        
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
          setSearchStatus(data.status);
          setResults(data.results || []);
        }
      } catch (err) {
        clearInterval(interval);
        setSearchStatus('failed');
      }
    }, 2000);
  };

  const handleBack = () => {
    setCinematicMode(false);
    setFadeOut(false);
    setSearchStatus('idle');
    setResults([]);
    setLogs([]);
    setProgress(0);
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${colors.border}`,
    borderRadius: '10px',
    padding: '14px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: colors.textSecondary,
    marginBottom: '6px'
  };

  // ─── CINEMATIC MODE ───
  if (cinematicMode) {
    return (
      <CinematicSearch
        logs={logs}
        progress={progress}
        results={results}
        searchStatus={searchStatus}
        onBack={handleBack}
      />
    );
  }

  // ─── NORMAL CONFIG UI ───
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#05070a',
      color: colors.text,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
    }}>
      {/* Subtle Background Particles/Glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.05) 0%, transparent 50%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      {/* Header / Back Button Area */}
      <div style={{
        position: 'absolute', top: '40px', left: '40px', zIndex: 10
      }}>
        <button
          onClick={goToDashboard}
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '10px 20px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#fff'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'; }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
          Back to Dashboard
        </button>
      </div>

      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: 'rgba(11, 14, 25, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '28px 32px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        zIndex: 1,
        position: 'relative',
      }}>
        
        {/* Top Tag */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '100px',
            padding: '6px 16px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#818cf8',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8' }} />
            Direct Portal Intelligence · India
          </div>
        </div>

        {/* Title Section */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 900,
            margin: '0 0 4px 0',
            letterSpacing: '-1.5px',
            background: `linear-gradient(135deg, #fff 30%, #a5b4fc 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            OmniSearch
          </h1>
          <p style={{
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.4)',
            fontWeight: 600,
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}>
            423 Company Career Portals · Real-Time
          </p>
        </div>

        {/* Form Area */}
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Resume Import Row */}
          <div>
            <label style={{ ...labelStyle, fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>
              Import from resume
            </label>
            <div style={{ position: 'relative' }}>
              <select 
                value={selectedResumeId}
                onChange={handleResumeSelect}
                style={{ 
                  ...inputStyle, 
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  padding: '16px 20px 16px 48px',
                  cursor: 'pointer',
                  appearance: 'none'
                }}
                disabled={loadingResumes || extracting}
              >
                <option value="">Select a Tailored Resume...</option>
                {resumes.map(r => (
                  <option key={r.id} value={r.id} style={{ background: '#0b0e19', color: '#fff' }}>
                    {r.target_role || r.title || r.id}
                  </option>
                ))}
              </select>
              <div style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
            </div>
          </div>

          {/* Search Parameters Section */}
          <div>
            <label style={{ ...labelStyle, fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>
              Search parameters
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{ 
                    ...inputStyle,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    padding: '16px 20px 16px 48px',
                  }}
                  placeholder="Target Job Title (e.g. Engineer)"
                  required
                />
                <div style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <select 
                    value={experience}
                    onChange={e => setExperience(e.target.value)}
                    style={{ 
                      ...inputStyle,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '16px',
                      padding: '16px 20px 16px 48px',
                      appearance: 'none',
                      cursor: 'pointer'
                    }}
                    required
                  >
                    <option value="" style={{ background: '#0b0e19', color: '#fff' }}>Exp Level</option>
                    <option value="0-1" style={{ background: '#0b0e19', color: '#fff' }}>0-1 Years</option>
                    <option value="1-2" style={{ background: '#0b0e19', color: '#fff' }}>1-2 Years</option>
                    <option value="2-3" style={{ background: '#0b0e19', color: '#fff' }}>2-3 Years</option>
                    <option value=">3" style={{ background: '#0b0e19', color: '#fff' }}>&gt; 3 Years</option>
                  </select>
                  <div style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    value={skills}
                    onChange={e => setSkills(e.target.value)}
                    style={{ 
                      ...inputStyle,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '16px',
                      padding: '16px 20px 16px 48px',
                    }}
                    placeholder="React, Node, AWS"
                  />
                  <div style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Launch Button */}
          <button 
            type="submit"
            disabled={!title || !experience || extracting}
            style={{
              background: `linear-gradient(135deg, #6366f1, #a855f7, #ec4899)`,
              border: 'none',
              borderRadius: '20px',
              padding: '20px',
              color: '#fff',
              fontWeight: 800,
              fontSize: '17px',
              cursor: (!title || !experience || extracting) ? 'not-allowed' : 'pointer',
              opacity: (!title || !experience || extracting) ? 0.5 : 1,
              boxShadow: `0 20px 40px -15px rgba(99, 102, 241, 0.4)`,
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
            onMouseOver={e => { if(!extracting) e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            Launch Global Scan
          </button>
        </form>

        {/* Footer Stats Row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>423</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '1px' }}>Companies</div>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>India</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '1px' }}>Region</div>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>Live</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '1px' }}>Source</div>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>0</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '1px' }}>Ghost Jobs</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OmniSearchPage;
