import React from 'react';
import './SemicircleLoader.css';

const SemicircleLoader = ({ className = '', label = 'Yuklanmoqda' }) => (
  <span
    className={['semicircle-loader', className].filter(Boolean).join(' ')}
    role="status"
    aria-live="polite"
    aria-label={label}
  />
);

export default SemicircleLoader;
