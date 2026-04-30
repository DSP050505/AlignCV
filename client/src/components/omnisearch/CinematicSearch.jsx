import React, { useState, useEffect, useRef, useCallback } from 'react';
import GlobeScene from './GlobeScene';
import IndiaMapSVG, { INDIA_CITIES } from './IndiaMapSVG';
import ParticleField from './ParticleField';

/*
  CINEMATIC PHASES:
  1. 'globe'      – Show rotating wireframe globe (2.5s)
  2. 'zoomIn'     – Camera zooms toward India, globe fades (2s)
  3. 'indiaReveal'– India map materializes with neon glow (1.5s)
  4. 'scanning'   – Pins appear one-by-one, logs stream (while backend runs)
  5. 'results'    – Full India map with all pins, results panel slides in
*/

const CinematicSearch = ({ logs, progress, results, searchStatus, onBack }) => {
  const [phase, setPhase] = useState('globe');
  const [globeOpacity, setGlobeOpacity] = useState(1);
  const [mapOpacity, setMapOpacity] = useState(0);
  const [mapScale, setMapScale] = useState(0.9); // Starts larger before reveal
  const [titleOpacity, setTitleOpacity] = useState(0);
  const [scanText, setScanText] = useState('Establishing satellite link...');
  const [activePins, setActivePins] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [cityJobMap, setCityJobMap] = useState({}); // city name → array of job indices
  const containerRef = useRef(null);

  // Phase 1 → 2 → 3 timeline
  useEffect(() => {
    // Phase 1: Globe for 2.5s
    const t1 = setTimeout(() => {
      setPhase('zoomIn');
      setGlobeOpacity(0.3);
      setScanText('Locking coordinates on India...');
    }, 2500);

    // Phase 2: Transition to India map
    const t2 = setTimeout(() => {
      setPhase('indiaReveal');
      setGlobeOpacity(0);
      setMapOpacity(1);
      setMapScale(1.5); // Scaled back slightly to 1.5
      setTitleOpacity(1);
      setScanText('Scanning 423 company career portals...');
    }, 4500);

    // Phase 3: Scanning
    const t3 = setTimeout(() => {
      setPhase('scanning');
    }, 6000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Update scan text from logs
  useEffect(() => {
    if (logs.length > 0 && phase === 'scanning') {
      setScanText(logs[logs.length - 1]);
    }
  }, [logs, phase]);

  // Animate pins based on results — also build a deterministic city→jobs map
  useEffect(() => {
    if (results.length > 0) {
      const cityCount = {};
      const jobMap = {}; // city name → [job indices]
      INDIA_CITIES.forEach(c => { cityCount[c.name] = 0; jobMap[c.name] = []; });

      results.forEach((job, idx) => {
        const loc = (job.location || '').toLowerCase();
        const title = (job.title || '').toLowerCase();
        let matched = false;

        for (const city of INDIA_CITIES) {
          if (loc.includes(city.name.toLowerCase()) || title.includes(city.name.toLowerCase())) {
            cityCount[city.name]++;
            jobMap[city.name].push(idx);
            matched = true;
            break;
          }
        }

        // If no specific city matched, assign to "India" bucket → distribute to a random city
        if (!matched) {
          const randomCity = INDIA_CITIES[Math.floor(Math.random() * INDIA_CITIES.length)];
          cityCount[randomCity.name]++;
          jobMap[randomCity.name].push(idx);
        }
      });

      const pins = Object.entries(cityCount)
        .filter(([, count]) => count > 0)
        .map(([city, count]) => {
           const cityData = INDIA_CITIES.find(c => c.name === city);
           return { city, count, x: cityData.x, y: cityData.y };
        });

      setActivePins(pins);
      setCityJobMap(jobMap);
    }
  }, [results]);

  // When search completes, show results panel
  useEffect(() => {
    if (searchStatus === 'completed' || searchStatus === 'failed') {
      setPhase('results');
      const t = setTimeout(() => setShowResults(true), 800);
      return () => clearTimeout(t);
    }
  }, [searchStatus]);

  const handleCityClick = useCallback((city) => {
    if (selectedCity?.name === city.name) {
      setSelectedCity(null); // zoom out
    } else {
      setSelectedCity(city); // zoom in
    }
  }, [selectedCity]);

  // Filter results by selected city using the stored mapping
  const filteredResults = selectedCity && cityJobMap[selectedCity.name]
    ? cityJobMap[selectedCity.name].map(idx => results[idx]).filter(Boolean)
    : [];

  // Calculate zoom transform
  let mapTransform = `translate(-50%, -50%) scale(${mapScale})`;
  if (selectedCity) {
    const zoomScale = 3.5;
    // SVG viewBox center is x: 200, y: 240
    const dx = selectedCity.x - 200;
    const dy = selectedCity.y - 240;
    // Adjust translation to center the clicked city
    const tx = `calc(-50% - ${dx * (500/480) * zoomScale}px)`;
    const ty = `calc(-50% - ${dy * zoomScale}px)`;
    mapTransform = `translate(${tx}, ${ty}) scale(${zoomScale})`;
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: 'radial-gradient(ellipse at center, #0a0e27 0%, #020617 50%, #000000 100%)',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Particle background */}
      <ParticleField />

      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute', top: 24, left: 24, zIndex: 20,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px', padding: '10px 20px', color: 'rgba(255,255,255,0.6)',
          cursor: 'pointer', fontSize: '13px', fontWeight: 600,
          backdropFilter: 'blur(10px)', transition: 'all 0.3s',
        }}
        onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
        onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
      >
        ← Back to Search
      </button>

      {/* Zoom Out / Close Overlay button */}
      {selectedCity && (
        <button
          onClick={() => setSelectedCity(null)}
          style={{
            position: 'absolute', top: 24, right: 24, zIndex: 20,
            background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)',
            borderRadius: '12px', padding: '10px 20px', color: '#818cf8',
            cursor: 'pointer', fontSize: '13px', fontWeight: 700,
            backdropFilter: 'blur(10px)', transition: 'all 0.3s',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)'
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'; e.currentTarget.style.color = '#fff'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'; e.currentTarget.style.color = '#818cf8'; }}
        >
          ✕ Zoom Out
        </button>
      )}

      {/* 3D Globe */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: globeOpacity,
        transition: 'opacity 2s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'none',
      }}>
        <GlobeScene phase={phase} />
      </div>

      {/* INDIA MAP CONTAINER */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: mapTransform,
        width: '500px', height: '560px',
        opacity: mapOpacity,
        transition: 'all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        zIndex: 5,
      }}>
        <IndiaMapSVG
          glowIntensity={phase === 'scanning' ? 1.5 : 1}
          onCityClick={handleCityClick}
          activePins={activePins}
          phase={phase}
        />
      </div>

      {/* TITLE OVERLAY */}
      <div style={{
        position: 'absolute',
        top: 30, left: 0, right: 0,
        textAlign: 'center', zIndex: 10,
        opacity: titleOpacity,
        transition: 'opacity 1s ease',
        pointerEvents: 'none'
      }}>
        <h1 style={{
          fontSize: '28px', fontWeight: 900, margin: 0,
          background: 'linear-gradient(135deg, #818cf8, #c084fc, #f472b6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px',
        }}>
          OmniSearch India
        </h1>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 0', letterSpacing: '3px', textTransform: 'uppercase' }}>
          Direct Career Portal Intelligence
        </p>
      </div>

      {/* SCAN STATUS BAR */}
      <div style={{
        position: 'absolute',
        bottom: 40, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10,
        opacity: (phase === 'results' && showResults) || selectedCity ? 0 : titleOpacity,
        transition: 'opacity 0.5s ease',
        textAlign: 'center',
        maxWidth: '600px', width: '90%',
        pointerEvents: 'none'
      }}>
        {/* Progress bar */}
        <div style={{
          height: '2px', background: 'rgba(255,255,255,0.05)',
          borderRadius: '2px', overflow: 'hidden', marginBottom: '12px',
        }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, #6366f1, #c084fc, #f472b6)',
            transition: 'width 0.8s ease',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
          }} />
        </div>

        {/* Status text */}
        <p style={{
          fontSize: '13px', color: 'rgba(255,255,255,0.5)',
          margin: 0, fontFamily: "'JetBrains Mono', monospace",
          animation: 'textGlow 2s ease-in-out infinite',
        }}>
          {scanText}
        </p>

        {/* Progress percentage */}
        <p style={{
          fontSize: '11px', color: 'rgba(129, 140, 248, 0.6)',
          margin: '6px 0 0 0', fontWeight: 700,
        }}>
          {progress}% COMPLETE
        </p>
      </div>

      {/* FLOATING JOB CARDS (when zoomed in on a city) */}
      {selectedCity && (() => {
        // Cities on right half of map (x >= 200) → show card on left; left half → show card on right
        const isRightSide = selectedCity.x >= 200;
        const cardPos = isRightSide
          ? { left: '5%', right: 'auto' }
          : { left: 'auto', right: '5%' };

        return (
        <div style={{
          position: 'absolute',
          top: '50%', ...cardPos, transform: 'translateY(-50%)',
          width: '380px', maxHeight: '75vh',
          zIndex: 15,
          overflowY: 'auto',
          padding: '20px',
          animation: `${isRightSide ? 'slideFromLeft' : 'slideFromRight'} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
          display: 'flex', flexDirection: 'column', gap: '16px'
        }}>
          <div style={{
            background: 'rgba(10, 14, 39, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: '0 0 4px 0' }}>
              {selectedCity.name} Openings
            </h2>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '0 0 20px 0' }}>
              {filteredResults.length} positions found nearby
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredResults.map((job, idx) => (
                <a
                  key={job.id || idx}
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'block',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '16px',
                    textDecoration: 'none',
                    color: '#fff',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(99, 102, 241, 0.15)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {job.company}
                  </div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 8px 0', lineHeight: 1.3, color: '#fff' }}>
                    {job.title}
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                    <span>{new Date(job.postedAt).toLocaleDateString()}</span>
                    <span style={{ color: '#818cf8', fontWeight: 600 }}>Apply ↗</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
        );
      })()}

      {/* Global Filter Pills - Show at bottom when results are ready, hide when zoomed in */}
      {showResults && !selectedCity && (
        <div style={{
          position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
          zIndex: 16, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px',
          maxWidth: '80%',
        }}>
          {activePins.map(pin => (
            <button
              key={pin.city}
              onClick={() => handleCityClick(INDIA_CITIES.find(c => c.name === pin.city))}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px', padding: '6px 14px',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
                backdropFilter: 'blur(5px)'
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'; e.currentTarget.style.color = '#fff'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
            >
              {pin.city} <span style={{ color: '#818cf8', marginLeft: '4px' }}>{pin.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Keyframe Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(-50%); }
        }
        @keyframes mapPulse {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.3)); }
          50% { filter: drop-shadow(0 0 40px rgba(99, 102, 241, 0.6)); }
        }
        @keyframes ripple {
          0% { r: 6; opacity: 0.6; }
          100% { r: 30; opacity: 0; }
        }
        @keyframes pinFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes textGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        @keyframes slideFromLeft {
          from { opacity: 0; transform: translateX(-40px) translateY(-50%); }
          to { opacity: 1; transform: translateX(0) translateY(-50%); }
        }
        @keyframes slideFromRight {
          from { opacity: 0; transform: translateX(40px) translateY(-50%); }
          to { opacity: 1; transform: translateX(0) translateY(-50%); }
        }
        
        /* Custom scrollbar for results panel */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 4px; }
      `}} />
    </div>
  );
};

export default CinematicSearch;

