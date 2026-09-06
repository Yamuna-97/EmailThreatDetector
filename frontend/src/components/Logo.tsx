import React from 'react'

interface LogoProps {
  className?: string
  size?: number
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 36 }) => {
  return (
    <div className={`flex items-center gap-2 cursor-pointer select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105 hover:rotate-3"
      >
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#7342E2" />
          </linearGradient>
          <linearGradient id="logoGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#7342E2" stopOpacity="0.2" />
          </linearGradient>
          <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#7342E2" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Outer Shield Hull */}
        <path
          d="M24 4L40 10V22C40 32.5 33.2 42.1 24 45C14.8 42.1 8 32.5 8 22V10L24 4Z"
          fill="url(#logoGrad)"
          filter="url(#logoShadow)"
        />

        {/* Inner Target Radar Rings */}
        <path
          d="M24 8L36 12.8V22C36 30.2 30.9 37.8 24 40.2C17.1 37.8 12 30.2 12 22V12.8L24 8Z"
          fill="#1A103C"
          fillOpacity="0.35"
          stroke="url(#logoGlow)"
          strokeWidth="1.2"
        />

        {/* Cyber Tracing Crosshair & Neural Node */}
        <circle cx="24" cy="23" r="7.5" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3 2" strokeOpacity="0.7" />
        <circle cx="24" cy="23" r="3.2" fill="#FFFFFF" />
        
        {/* Pulse Tracing Crosshair Vectors */}
        <line x1="24" y1="12" x2="24" y2="17" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <line x1="24" y1="29" x2="24" y2="34" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <line x1="13" y1="23" x2="18" y2="23" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <line x1="30" y1="23" x2="35" y2="23" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

        {/* Dynamic Tracing Sweep Spark */}
        <path
          d="M24 23L31 16"
          stroke="#38BDF8"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="31" cy="16" r="1.5" fill="#38BDF8" />
      </svg>
    </div>
  )
}

export default Logo
