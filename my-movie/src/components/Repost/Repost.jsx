import React, { useCallback } from 'react';
import { useIsReposted, useReposts } from '../../context/RepostsContext';
import { store } from '../../store/store';
import { selectRepostItems, toggleRepost } from '../../store/slices/repostsSlice';
import { REPOST_STORAGE_KEY, isRepostedInList } from '../../store/slices/repostsUtils';
import './Repost.css';

export { REPOST_STORAGE_KEY };

export { normalizeRepostId, normalizeRepostType, REPOST_ENTITY_TYPES } from './repostTypes';

/** @deprecated Redux `useRepostItems` dan foydalaning */
export const readReposts = () => selectRepostItems(store.getState());

/** @deprecated Redux `toggleRepost` dan foydalaning */
export const toggleRepostItem = (item) => {
  store.dispatch(toggleRepost(item));
  return selectRepostItems(store.getState());
};

export const isRepostedItem = (items, id, type) => isRepostedInList(items, id, type);

const RepostIconOutline = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const Repost = ({ item, className = '', stopPropagation = true, ariaLabel = 'Repost' }) => {
  const { toggleRepost: dispatchToggle } = useReposts();
  const active = useIsReposted(item?.id, item?.type);
  const useOutlineIcon = className.includes('shorts-modal-action-btn');

  const handleClick = useCallback(
    (e) => {
      if (stopPropagation) e.stopPropagation();
      dispatchToggle(item);
    },
    [stopPropagation, dispatchToggle, item]
  );

  return (
    <button
      type="button"
      className={`repost-btn ${active ? 'active' : ''} ${className}`.trim()}
      onClick={handleClick}
      aria-label={ariaLabel}
      title="Repost"
    >
      {useOutlineIcon ? <RepostIconOutline /> : <i className="fa-solid fa-repeat" aria-hidden="true" />}
    </button>
  );
};

export default Repost;
