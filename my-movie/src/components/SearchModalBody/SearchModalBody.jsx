import React from 'react';
import SearchModalResults from '../SearchModalResults/SearchModalResults';
import SearchModalIdleBody from '../SearchModalIdleBody/SearchModalIdleBody';
import './SearchModalBody.css';

/**
 * Search modal kontent marshruti (algoritm o‘zgarmaydi):
 * - query bor → SearchModalResults
 * - query bo‘sh + compose → History
 * - query bo‘sh + browse → Kino | Music
 */
const SearchModalBody = ({ query, searchMode, onNavigateAway }) => {
  const trimmed = String(query || '').trim();

  if (trimmed) {
    return (
      <div key="results" className="search-modal-body-pane search-modal-body-pane--results">
        <SearchModalResults
          query={trimmed}
          onMovieClick={onNavigateAway}
        />
      </div>
    );
  }

  return (
    <SearchModalIdleBody
      searchMode={searchMode}
      onNavigateAway={onNavigateAway}
    />
  );
};

export default SearchModalBody;
