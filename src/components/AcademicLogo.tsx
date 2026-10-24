import React from 'react';

interface AcademicLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AcademicLogo: React.FC<AcademicLogoProps> = ({
  className = 'w-10 h-10',
  size = 'md',
}) => {
  return (
    <div
      className={`relative rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border border-indigo-700/50 shadow-md flex items-center justify-center shrink-0 ${className}`}
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-3/4 h-3/4"
      >
        {/* Academic Shield / Hexagonal Crest */}
        <path
          d="M20 4L34 10V22C34 29.5 28 35.5 20 38C12 35.5 6 29.5 6 22V10L20 4Z"
          fill="url(#crestGrad)"
          stroke="#6366f1"
          strokeWidth="1.5"
        />

        {/* Open Book of Knowledge */}
        <path
          d="M13 22C15.5 21 18 21.5 20 23C22 21.5 24.5 21 27 22V14C24.5 13 22 13.5 20 15C18 13.5 15.5 13 13 14V22Z"
          fill="#10b981"
          fillOpacity="0.85"
        />
        <path
          d="M20 15V23"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Orbit / Atom ring for Egyptian Science */}
        <ellipse
          cx="20"
          cy="20"
          rx="11"
          ry="4"
          transform="rotate(-30 20 20)"
          stroke="#38bdf8"
          strokeWidth="1.2"
          strokeDasharray="2 2"
        />

        {/* Shining Star of Excellence */}
        <polygon
          points="20,7 21.2,10.2 24.5,10.5 22,12.7 22.8,16 20,14.2 17.2,16 18,12.7 15.5,10.5 18.8,10.2"
          fill="#fbbf24"
        />

        <defs>
          <linearGradient id="crestGrad" x1="6" y1="4" x2="34" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0f172a" />
            <stop offset="1" stopColor="#1e1b4b" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
