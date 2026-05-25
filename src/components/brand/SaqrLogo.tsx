import { useId } from 'react';

interface SaqrLogoProps {
  variant?: 'full' | 'compact';
  tone?: 'light' | 'dark';
  subtitle?: boolean;
  className?: string;
  markClassName?: string;
}

export function SaqrLogo({
  variant = 'full',
  tone = 'light',
  subtitle = true,
  className = '',
  markClassName = ''
}: SaqrLogoProps) {
  const gradientId = useId();
  const cyanId = `${gradientId}-cyan`;
  const goldId = `${gradientId}-gold`;
  const isCompact = variant === 'compact';

  return (
    <div className={`saqr-logo saqr-logo-${variant} saqr-logo-${tone} ${className}`.trim()}>
      <svg
        className={`saqr-logo-icon ${markClassName}`.trim()}
        viewBox="0 0 96 96"
        role="img"
        aria-label="SAQR AI falcon engineering intelligence logo"
      >
        <defs>
          <linearGradient id={goldId} x1="18" y1="16" x2="79" y2="78" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F1D38A" />
            <stop offset="0.48" stopColor="#D6A84F" />
            <stop offset="1" stopColor="#A97728" />
          </linearGradient>
          <linearGradient id={cyanId} x1="24" y1="20" x2="74" y2="72" gradientUnits="userSpaceOnUse">
            <stop stopColor="#67E8F9" />
            <stop offset="1" stopColor="#0891B2" />
          </linearGradient>
        </defs>

        <rect x="8" y="8" width="80" height="80" rx="20" className="saqr-logo-frame" />
        <path
          className="saqr-logo-wing-primary"
          d="M21 59.5L49.5 22L77 27.5L55.5 42.5L77.5 48.5L47 56.5L32.5 72.5L38 58L21 59.5Z"
          fill={`url(#${goldId})`}
        />
        <path
          className="saqr-logo-wing-shadow"
          d="M32.5 72.5L47 56.5L77.5 48.5L58.5 63.5L42.5 64.5L32.5 72.5Z"
          fill="#07111F"
          fillOpacity="0.92"
        />
        <path
          d="M31 51.5L49.5 31.5L64 34.5M42.5 57L55 47L70.5 48.5"
          className="saqr-logo-circuit-line"
          stroke={`url(#${cyanId})`}
        />
        <path
          d="M48 31.5L48 22M55.5 47L65 37.5M42.5 57L32 69"
          className="saqr-logo-circuit-line saqr-logo-circuit-fine"
          stroke={`url(#${cyanId})`}
        />
        <circle cx="49.5" cy="31.5" r="3.2" className="saqr-logo-node" fill={`url(#${cyanId})`} />
        <circle cx="55" cy="47" r="3.8" className="saqr-logo-node-core" fill={`url(#${cyanId})`} />
        <path
          d="M69.5 29.5L79 20.5M74 48.5H84M31.5 58.5H16"
          className="saqr-logo-grid-line"
        />
      </svg>

      {!isCompact && (
        <div className="saqr-logo-wordmark">
          <strong>SAQR <span>AI</span></strong>
          {subtitle && <small>Engineering Intelligence</small>}
        </div>
      )}
    </div>
  );
}
