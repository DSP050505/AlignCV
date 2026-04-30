import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { resumeApi } from '../api/resumeApi';
import { useAuthStore } from '../store/authStore';
import CinematicSearch from '../components/omnisearch/CinematicSearch';

const OmniSearchPage = () => {
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
      backgroundColor: colors.bg,
      color: colors.text,
      padding: '40px 24px',
      fontFamily: "'Inter', sans-serif",
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '36px', fontWeight: 900, margin: '0 0 10px 0',
            background: `linear-gradient(to right, ${colors.pinkLight}, ${colors.primaryLight})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            OmniSearch
          </h1>
          <p style={{ fontSize: '16px', color: colors.textSecondary, margin: 0 }}>
            Direct Career Portal Intelligence · India
          </p>
        </div>

        {/* Configuration Phase */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
          
          {/* Left Card: Resume Import */}
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '20px', padding: '30px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px', color: colors.pinkLight, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              1. Import from Resume
            </h2>
            <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '24px', lineHeight: 1.5 }}>
              Select a tailored resume to automatically extract your target job parameters.
            </p>
            
            <select 
              value={selectedResumeId}
              onChange={handleResumeSelect}
              style={{ ...inputStyle, cursor: 'pointer' }}
              disabled={loadingResumes || extracting}
            >
              <option value="" style={{ background: colors.bg, color: colors.text }}>-- Select a Resume --</option>
              {resumes.map(r => (
                <option key={r.id} value={r.id} style={{ background: colors.bg, color: colors.text }}>
                  {r.target_role || r.title || r.id}
                </option>
              ))}
            </select>
            {extracting && (
              <p style={{ fontSize: '13px', color: colors.pinkLight, marginTop: '12px', fontStyle: 'italic' }}>
                Analyzing resume and extracting parameters...
              </p>
            )}
          </div>

          {/* Right Card: Search Params */}
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '20px', padding: '30px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px', color: colors.primaryLight, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              2. Search Parameters
            </h2>
            <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Target Job Title *</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={inputStyle}
                  placeholder="e.g. Senior Frontend Developer"
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Years Experience *</label>
                  <select 
                    value={experience}
                    onChange={e => setExperience(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    required
                  >
                    <option value="">Select Range</option>
                    <option value="0-1">0-1 Years</option>
                    <option value="1-2">1-2 Years</option>
                    <option value="2-3">2-3 Years</option>
                    <option value=">3">&gt; 3 Years</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Core Skills (csv)</label>
                  <input 
                    type="text" 
                    value={skills}
                    onChange={e => setSkills(e.target.value)}
                    style={inputStyle}
                    placeholder="React, Node, AWS"
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={!title || !experience || extracting}
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.pink})`,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '15px',
                  cursor: (!title || !experience || extracting) ? 'not-allowed' : 'pointer',
                  opacity: (!title || !experience || extracting) ? 0.5 : 1,
                  boxShadow: `0 10px 30px -10px ${colors.pink}`,
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.3s',
                }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Launch Global Scan
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OmniSearchPage;
