import React from 'react';

interface SkillBridgeIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export default function SkillBridgeIcon({ size = 40, className, ...props }: SkillBridgeIconProps) {
  return (
    <svg 
      className={className} 
      width={size} 
      height={size} 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient id="globalLogoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#06d6a0" />
        </linearGradient>
      </defs>
      <path d="M4 28 Q20 8 36 28" stroke="url(#globalLogoGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <line x1="4" y1="28" x2="36" y2="28" stroke="url(#globalLogoGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="13" y1="20" x2="13" y2="28" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
      <line x1="27" y1="20" x2="27" y2="28" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="10.5" r="3" fill="#06d6a0" opacity="0.9" />
      <circle cx="20" cy="10.5" r="5.5" fill="#06d6a0" opacity="0.2" />
    </svg>
  );
}
