import React from 'react'

interface CyberTraceLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  subtitle?: string
  className?: string
}

export const CyberTraceLogoIcon: React.FC<{ className?: string; size?: number }> = ({
  className = "w-9 h-9",
  size = 36
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="ctGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="50%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#7342E2" />
      </linearGradient>
      <linearGradient id="ctGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#7342E2" stopOpacity="0.2" />
      </linearGradient>
      <filter id="ctShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#7342E2" floodOpacity="0.35" />
      </filter>
    </defs>

    {/* Outer Shield Hull */}
    <path
      d="M24 4L40 10V22C40 32.5 33.2 42.1 24 45C14.8 42.1 8 32.5 8 22V10L24 4Z"
      fill="url(#ctGrad1)"
      filter="url(#ctShadow)"
    />

    {/* Inner Target Radar Rings */}
    <path
      d="M24 8L36 12.8V22C36 30.2 30.9 37.8 24 40.2C17.1 37.8 12 30.2 12 22V12.8L24 8Z"
      fill="#1A103C"
      fillOpacity="0.35"
      stroke="url(#ctGlow)"
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
)

export const CyberTraceLogo: React.FC<CyberTraceLogoProps> = ({
  size = 'md',
  showText = true,
  subtitle,
  className = '',
}) => {
  const iconSizes = {
    sm: 28,
    md: 36,
    lg: 44,
    xl: 56,
  }

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl sm:text-4xl',
  }

  const subSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-xs sm:text-sm',
  }

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      <div className="shrink-0 transition-transform duration-300 hover:scale-105">
        <CyberTraceLogoIcon size={iconSizes[size]} className="shrink-0" />
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-heading font-extrabold tracking-tight text-[#192837] ${textSizes[size]}`}>
            Cyber<span className="text-[#7342E2]">Trace</span>
          </span>
          {subtitle ? (
            <span className={`font-bold tracking-wider uppercase text-[#7342E2] ${subSizes[size]}`}>
              {subtitle}
            </span>
          ) : (
            <span className={`font-semibold tracking-wider text-[#192837]/50 ${subSizes[size]}`}>
              AI Threat Intelligence
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default CyberTraceLogo
