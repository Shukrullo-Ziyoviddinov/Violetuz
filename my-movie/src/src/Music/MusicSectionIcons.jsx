import React from 'react';

/** Matn bilan bir xil gradient - music-cards-title-text ga mos */
const GradientDefs = ({ id }) => (
  <defs>
    <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#ffffff" />
      <stop offset="30%" stopColor="#e8e8e8" />
      <stop offset="60%" stopColor="#c0c0c0" />
      <stop offset="100%" stopColor="#a0a0a0" />
    </linearGradient>
  </defs>
);

/**
 * Bo'lim turiga mos ikonlar:
 * - music: musiqa nota
 * - album: albom/diskl
 * - klip: video klip
 * - konsert: mikrofon/sahna
 */
const SvgIcon = ({ type, className, size = 24 }) => {
  const gradientId = `music-title-icon-gradient-${type}`;
  const props = { width: size, height: size, className, viewBox: '0 0 24 24' };

  switch (type) {
    case 'music':
      return (
        <svg {...props} fill={`url(#${gradientId})`} stroke={`url(#${gradientId})`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <GradientDefs id={gradientId} />
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );
    case 'album':
      return (
        <svg {...props} fill="none" stroke={`url(#${gradientId})`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <GradientDefs id={gradientId} />
          <rect x="5" y="4" width="14" height="16" rx="2" />
          <rect x="3" y="6" width="14" height="16" rx="2" />
        </svg>
      );
    case 'klip':
      return (
        <svg {...props} fill="none" stroke={`url(#${gradientId})`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <GradientDefs id={gradientId} />
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      );
    case 'konsert':
      return (
        <svg {...props} fill="none" stroke={`url(#${gradientId})`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <GradientDefs id={gradientId} />
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>
      );
    default:
      return (
        <svg {...props} fill={`url(#${gradientId})`}>
          <GradientDefs id={gradientId} />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
  }
};

export default SvgIcon;
