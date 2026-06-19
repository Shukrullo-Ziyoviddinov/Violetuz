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

const Repost = ({ item, className = '', stopPropagation = true, ariaLabel = 'Repost' }) => {
  const { toggleRepost: dispatchToggle } = useReposts();
  const active = useIsReposted(item?.id, item?.type);

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
      <i className="fa-solid fa-repeat" aria-hidden="true" />
    </button>
  );
};

export default Repost;
