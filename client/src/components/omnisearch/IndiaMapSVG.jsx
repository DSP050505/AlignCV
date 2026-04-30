import React from 'react';

const INDIA_PATH = `M132.222,34.577L146.933,54.139L145.548,67.592L150.993,75.969L150.544,84.277L140.722,82.095L144.56,99.898L158.007,110.029L177.029,121.14L168.345,128.306L163.03,142.981L176.29,148.88L189.193,156.497L207.044,165.164L225.805,167.16L233.699,174.973L244.273,176.431L260.739,179.996L272.136,179.741L273.704,173.682L271.902,163.91L272.96,157.255L281.308,153.995L282.456,166.168L282.749,169.251L295.188,175.077L303.794,172.68L315.348,173.709L326.516,173.254L327.477,163.806L321.906,158.876L332.944,156.94L345.402,145.382L361.177,135.421L372.658,139.271L382.414,132.667L388.832,142.411L384.21,148.958L398.967,151.282L400,157.162L395.202,160L396.324,169.485L386.544,166.703L368.825,177.31L369.241,186.046L361.687,198.774L360.995,206.128L354.892,218.506L344.195,215.093L343.663,230.546L340.57,235.605L342.018,241.895L335.265,245.401L328.057,221.843L324.278,221.89L322.041,231.414L314.547,223.694L318.773,215.182L324.896,214.316L331.207,201.582L323.315,199.002L310.622,199.226L297.6,197.152L296.392,186.597L289.858,185.846L279.018,179.253L274.183,189.594L284.062,197.622L275.505,203.251L272.467,208.74L280.892,212.766L278.563,221.789L283.306,232.991L285.436,245.187L283.476,250.572L274.166,250.387L257.293,253.443L258.079,264.48L250.773,273.122L231.077,282.914L215.759,299.934L205.469,309.011L191.832,318.397L191.811,324.972L184.988,328.489L172.66,333.593L166.267,334.344L162.163,345.179L165.013,363.565L165.739,375.237L159.939,388.558L159.877,412.263L152.794,412.937L146.564,423.534L150.73,428.106L138.251,432.036L133.642,441.449L128.15,445.423L115.19,432.504L108.854,413.065L103.604,399.011L98.809,392.404L91.538,378.948L88.142,361.354L85.776,352.532L73.326,333.042L67.656,305.312L63.564,286.835L63.612,269.214L60.958,255.494L41.041,264.273L31.394,262.518L13.515,244.691L20.096,239.345L16.054,233.526L0,220.88L9.115,210.883L39.234,210.922L36.516,197.978L28.827,190.291L27.267,178.56L18.309,171.679L33.393,155.509L49.285,156.687L63.603,140.369L72.182,124.415L85.468,108.48L85.257,97.058L96.928,87.724L85.882,79.709L81.129,68.654L76.279,54.209L82.989,47.045L103.749,51.103L119.005,48.633Z`;

export const INDIA_CITIES = [
  { name: 'Delhi', x: 123.6, y: 145.8, region: 'North' },
  { name: 'Mumbai', x: 64.3, y: 288.8, region: 'West' },
  { name: 'Bangalore', x: 128.9, y: 375.7, region: 'South' },
  { name: 'Hyderabad', x: 141.1, y: 313.1, region: 'South' },
  { name: 'Chennai', x: 165.5, y: 374.2, region: 'South' },
  { name: 'Pune', x: 77.7, y: 296.8, region: 'West' },
  { name: 'Kolkata', x: 276.3, y: 237.5, region: 'East' },
  { name: 'Noida', x: 126.1, y: 147.0, region: 'North' },
  { name: 'Gurgaon', x: 121.1, y: 148.2, region: 'North' },
];

const IndiaMapSVG = ({ glowIntensity = 1, onCityClick, activePins = [], phase = 'idle' }) => {
  return (
    <svg
      viewBox="-40 -40 480 560"
      style={{
        width: '100%',
        height: '100%',
        filter: `drop-shadow(0 0 ${20 * glowIntensity}px rgba(99, 102, 241, 0.4)) drop-shadow(0 0 ${40 * glowIntensity}px rgba(99, 102, 241, 0.2))`,
      }}
    >
      <defs>
        {/* Glow filter */}
        <filter id="mapGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feFlood floodColor="#818cf8" floodOpacity="0.6" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Pin pulse animation */}
        <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="1" />
          <stop offset="50%" stopColor="#6366f1" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>

        {/* Grid pattern */}
        <pattern id="techGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(99, 102, 241, 0.05)" strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* Tech grid behind map */}
      <rect x="-40" y="-40" width="480" height="560" fill="url(#techGrid)" opacity="0.5" />

      {/* India outline - main shape */}
      <path
        d={INDIA_PATH}
        fill="rgba(99, 102, 241, 0.03)"
        stroke="url(#mapStroke)"
        strokeWidth="2"
        filter="url(#mapGlow)"
        style={{
          animation: phase === 'scanning' ? 'mapPulse 3s ease-in-out infinite' : 'none',
        }}
      />

      {/* Gradient stroke */}
      <defs>
        <linearGradient id="mapStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>

      {/* Inner glow fill */}
      <path
        d={INDIA_PATH}
        fill="none"
        stroke="rgba(129, 140, 248, 0.15)"
        strokeWidth="6"
      />

      {/* City Pins */}
      {INDIA_CITIES.map((city, idx) => {
        const pinData = activePins.find(p => p.city === city.name);
        const isActive = !!pinData;
        const jobCount = pinData?.count || 0;

        return (
          <g
            key={city.name}
            onClick={() => onCityClick && onCityClick(city)}
            style={{
              cursor: 'pointer',
              opacity: phase === 'results' || isActive ? 1 : 0,
              transform: isActive ? 'scale(1)' : 'scale(0)',
              transformOrigin: `${city.x}px ${city.y}px`,
              transition: `all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.15}s`,
            }}
          >
            {/* Ripple rings */}
            {isActive && (
              <>
                <circle
                  cx={city.x} cy={city.y} r="18"
                  fill="none" stroke="#818cf8" strokeWidth="1" opacity="0.3"
                  style={{ animation: `ripple 2s ease-out infinite ${idx * 0.3}s` }}
                />
                <circle
                  cx={city.x} cy={city.y} r="12"
                  fill="none" stroke="#818cf8" strokeWidth="1" opacity="0.5"
                  style={{ animation: `ripple 2s ease-out infinite ${idx * 0.3 + 0.5}s` }}
                />
              </>
            )}

            {/* Outer glow */}
            <circle cx={city.x} cy={city.y} r="10" fill="url(#pinGlow)" opacity="0.6" />

            {/* Core dot */}
            <circle
              cx={city.x} cy={city.y} r="4"
              fill="#818cf8"
              stroke="#fff"
              strokeWidth="1.5"
              style={{ animation: isActive ? `pinFloat 3s ease-in-out infinite ${idx * 0.2}s` : 'none' }}
            />

            {/* City label */}
            <text
              x={city.x}
              y={city.y - 16}
              textAnchor="middle"
              fill="rgba(255,255,255,0.8)"
              fontSize="9"
              fontWeight="600"
              fontFamily="Inter, sans-serif"
            >
              {city.name}
            </text>

            {/* Job count badge */}
            {jobCount > 0 && (
              <g>
                <rect
                  x={city.x + 8} y={city.y - 12}
                  width="22" height="14"
                  rx="7" fill="#6366f1"
                  stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"
                />
                <text
                  x={city.x + 19} y={city.y - 2}
                  textAnchor="middle" fill="#fff"
                  fontSize="8" fontWeight="800"
                  fontFamily="Inter, sans-serif"
                >
                  {jobCount}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default IndiaMapSVG;
