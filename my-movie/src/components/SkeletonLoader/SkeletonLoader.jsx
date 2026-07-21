import React from 'react';
import './SkeletonLoader.css';

/**
 * Global skeleton placeholder for async/DB-backed UI blocks.
 * Use variants for known shapes; pass width/height for one-offs.
 */
const SkeletonLoader = ({
  variant = 'block',
  className = '',
  width,
  height,
  count = 1,
  style,
  ...rest
}) => {
  const items = Array.from({ length: Math.max(1, Number(count) || 1) }, (_, index) => (
    <div
      key={index}
      className={`skeleton-loader skeleton-loader--${variant}${className ? ` ${className}` : ''}`}
      style={{
        ...(width != null ? { width } : null),
        ...(height != null ? { height } : null),
        ...style,
      }}
      aria-hidden="true"
      {...rest}
    />
  ));

  if (items.length === 1) return items[0];
  return <div className="skeleton-loader-group">{items}</div>;
};

export default SkeletonLoader;
