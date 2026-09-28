import React from 'react';

export const GovEmblem = ({ className = 'w-10 h-10', variant = 'gold' }) => {
  // SVG representation of the National Emblem / Ashoka Pillar lion capital
  return (
    <div className={`relative flex flex-col items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 100 120"
        fill="currentColor"
        className="w-full h-full drop-shadow-sm"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ashoka Lion Capital Stylized Silhouette */}
        <g fill={variant === 'white' ? '#FFFFFF' : variant === 'gold' ? '#F59E0B' : '#0F3B68'}>
          {/* Central Lion Head */}
          <path d="M50 12 C44 12, 38 18, 38 25 C38 30, 41 34, 44 37 C42 41, 42 47, 44 52 C46 54, 48 55, 50 55 C52 55, 54 54, 56 52 C58 47, 58 41, 56 37 C59 34, 62 30, 62 25 C62 18, 56 12, 50 12 Z" />
          {/* Left Lion Head */}
          <path d="M30 20 C25 20, 20 25, 20 32 C20 37, 23 41, 26 44 C24 48, 25 54, 27 58 C29 60, 32 60, 34 59 C36 55, 36 50, 35 46 C37 43, 39 39, 39 34 C39 27, 35 20, 30 20 Z" opacity="0.9" />
          {/* Right Lion Head */}
          <path d="M70 20 C65 20, 61 27, 61 34 C61 39, 63 43, 65 46 C64 50, 64 55, 66 59 C68 60, 71 60, 73 58 C75 54, 76 48, 74 44 C77 41, 80 37, 80 32 C80 25, 75 20, 70 20 Z" opacity="0.9" />
          
          {/* Shoulders & Mane details */}
          <path d="M35 55 C32 60, 30 68, 30 75 L70 75 C70 68, 68 60, 65 55 C60 59, 55 60, 50 60 C45 60, 40 59, 35 55 Z" />
          
          {/* Abacus / Base platform */}
          <rect x="22" y="77" width="56" height="6" rx="2" />
          
          {/* Ashoka Chakra in center of abacus */}
          <circle cx="50" cy="88" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="50" cy="88" r="1.5" />
          {/* Chakra spokes */}
          <line x1="50" y1="82" x2="50" y2="94" stroke="currentColor" strokeWidth="1" />
          <line x1="44" y1="88" x2="56" y2="88" stroke="currentColor" strokeWidth="1" />
          <line x1="46" y1="84" x2="54" y2="92" stroke="currentColor" strokeWidth="1" />
          <line x1="46" y1="92" x2="54" y2="84" stroke="currentColor" strokeWidth="1" />
          
          {/* Bull on left, Horse on right (stylized) */}
          <circle cx="32" cy="88" r="3" />
          <circle cx="68" cy="88" r="3" />
          
          {/* Bottom stepped plinth */}
          <rect x="18" y="97" width="64" height="4" rx="1" />
          <rect x="15" y="103" width="70" height="5" rx="1.5" />
        </g>
      </svg>
      <span className={`text-[8px] font-bold tracking-tight uppercase mt-0.5 ${
        variant === 'white' ? 'text-amber-300' : variant === 'gold' ? 'text-amber-800' : 'text-slate-800'
      }`}>
        सत्यमेવ જયતે
      </span>
    </div>
  );
};
