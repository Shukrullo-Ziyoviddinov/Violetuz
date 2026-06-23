import React from 'react';

const MovieRefreshIcon = () => (
  <svg viewBox="0 0 48 48" className="ptr-icon-svg ptr-movie-svg" aria-hidden="true">
    <g className="ptr-movie-reel">
      <circle className="ptr-movie-reel-ring" cx="24" cy="24" r="19" />
      <circle className="ptr-movie-reel-hub" cx="24" cy="24" r="5" />
      <circle className="ptr-movie-reel-hole" cx="24" cy="11" r="2.2" />
      <circle className="ptr-movie-reel-hole" cx="24" cy="37" r="2.2" />
      <circle className="ptr-movie-reel-hole" cx="11" cy="24" r="2.2" />
      <circle className="ptr-movie-reel-hole" cx="37" cy="24" r="2.2" />
    </g>
    <g className="ptr-movie-clapper">
      <g className="ptr-movie-clapper-top">
        <path d="M8 14 L40 14 L36 8 H12 Z" />
        <path d="M12 8 L16 14 M20 8 L24 14 M28 8 L32 14 M36 8 L40 14" />
      </g>
      <rect className="ptr-movie-clapper-base" x="8" y="14" width="32" height="22" rx="2" />
      <line className="ptr-movie-clapper-line" x1="14" y1="20" x2="34" y2="20" />
      <line className="ptr-movie-clapper-line" x1="14" y1="26" x2="30" y2="26" />
      <line className="ptr-movie-clapper-line" x1="14" y1="32" x2="26" y2="32" />
    </g>
  </svg>
);

const MusicRefreshIcon = () => (
  <svg viewBox="0 0 48 48" className="ptr-icon-svg ptr-music-svg" aria-hidden="true">
    <g className="ptr-music-disc">
      <circle className="ptr-music-vinyl" cx="24" cy="20" r="16" />
      <circle className="ptr-music-vinyl-groove" cx="24" cy="20" r="11" />
      <circle className="ptr-music-vinyl-groove" cx="24" cy="20" r="6.5" />
      <circle className="ptr-music-vinyl-center" cx="24" cy="20" r="2.8" />
    </g>
    <g className="ptr-music-note">
      <path d="M31 5v13c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4c.8 0 1.6.2 2.2.7V5h1.8z" />
    </g>
    <g className="ptr-music-eq">
      <rect className="ptr-music-eq-bar ptr-music-eq-bar--1" x="10" y="36" width="4" height="10" rx="2" />
      <rect className="ptr-music-eq-bar ptr-music-eq-bar--2" x="17" y="36" width="4" height="10" rx="2" />
      <rect className="ptr-music-eq-bar ptr-music-eq-bar--3" x="24" y="36" width="4" height="10" rx="2" />
      <rect className="ptr-music-eq-bar ptr-music-eq-bar--4" x="31" y="36" width="4" height="10" rx="2" />
    </g>
  </svg>
);

const PullToRefreshLoader = ({
  theme = 'movie',
  progress = 0,
  isLoading = false,
  isPulling = false,
}) => {
  const loaderClass = [
    'pull-to-refresh-loader',
    `pull-to-refresh-loader--${theme}`,
    isPulling && 'pull-to-refresh-loader--pulling',
    isLoading && 'pull-to-refresh-loader--loading',
    progress >= 1 && !isLoading && 'pull-to-refresh-loader--ready',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={loaderClass} style={{ '--ptr-progress': progress }} aria-hidden="true">
      {theme === 'music' ? <MusicRefreshIcon /> : <MovieRefreshIcon />}
    </div>
  );
};

export default PullToRefreshLoader;
