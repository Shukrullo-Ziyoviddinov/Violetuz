import React from 'react';
import SearchModalBrowseShell from '../SearchModalBrowseShell/SearchModalBrowseShell';
import SearchModalHistory from '../SearchModalHistory/SearchModalHistory';
import { SEARCH_MODE_COMPOSE } from '../../searchModalModes';
import './SearchModalIdleBody.css';

/**
 * Query bo‘sh: browse (Kino|Music) yoki compose (History).
 * Compose’da Kino/Music yashirinadi — History chiqadi (animatsiya).
 */
const SearchModalIdleBody = ({ searchMode, onNavigateAway }) => {
  const isCompose = searchMode === SEARCH_MODE_COMPOSE;

  return (
    <div
      className={`search-modal-idle${
        isCompose ? ' search-modal-idle--compose' : ' search-modal-idle--browse'
      }`}
    >
      {isCompose ? (
        <div key="compose" className="search-modal-idle-pane search-modal-idle-pane--history">
          <SearchModalHistory enabled onItemClick={onNavigateAway} />
        </div>
      ) : (
        <div key="browse" className="search-modal-idle-pane search-modal-idle-pane--browse">
          <SearchModalBrowseShell onNavigateAway={onNavigateAway} />
        </div>
      )}
    </div>
  );
};

export default SearchModalIdleBody;
