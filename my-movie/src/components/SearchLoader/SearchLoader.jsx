import React from 'react';
import './SearchLoader.css';

const SearchLoader = () => (
  <div className="search-loader" role="status" aria-live="polite" aria-label="Qidirilmoqda">
    <div className="search-loader-spinner" />
  </div>
);

export default SearchLoader;
