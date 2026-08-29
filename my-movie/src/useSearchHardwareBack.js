import { useEffect, useRef } from 'react';
import { SEARCH_MODE_COMPOSE } from './searchModalModes';

const HISTORY_KEY = 'violetSearch';

/**
 * Qurilma/browser «ortga» = search modal ortga tugmasi:
 * compose → browse (sahifa o‘zgarmaydi);
 * browse → modal yopiladi (saytdan chiqilmaydi).
 */
export function useSearchHardwareBack({
  showSearch,
  searchMode,
  hasQuery,
  onReturnToBrowse,
  onCloseFromHardware,
  /** true — boshqa modal (masalan voice) ortga ushlaydi */
  blocked = false,
}) {
  const ownedRef = useRef(false);
  const showRef = useRef(showSearch);
  const modeRef = useRef(searchMode);
  const queryRef = useRef(hasQuery);
  const blockedRef = useRef(blocked);
  const onReturnRef = useRef(onReturnToBrowse);
  const onCloseRef = useRef(onCloseFromHardware);

  showRef.current = showSearch;
  modeRef.current = searchMode;
  queryRef.current = hasQuery;
  blockedRef.current = blocked;
  onReturnRef.current = onReturnToBrowse;
  onCloseRef.current = onCloseFromHardware;

  const markSearchHistoryOpen = () => {
    if (ownedRef.current) return;
    window.history.pushState({ [HISTORY_KEY]: true }, '');
    ownedRef.current = true;
  };

  /** Overlay/UI yopish: history yozuvini ham yechish */
  const releaseSearchHistory = () => {
    if (!ownedRef.current) return;
    ownedRef.current = false;
    window.history.back();
  };

  /** Navigatsiya oldidan: history.back qilmasdan trapni yechish */
  const abandonSearchHistory = () => {
    ownedRef.current = false;
  };

  useEffect(() => {
    const onPopState = () => {
      if (blockedRef.current) return;

      if (!showRef.current) {
        ownedRef.current = false;
        return;
      }

      const isCompose =
        modeRef.current === SEARCH_MODE_COMPOSE || Boolean(queryRef.current);

      if (isCompose) {
        onReturnRef.current?.();
        window.history.pushState({ [HISTORY_KEY]: true }, '');
        ownedRef.current = true;
        return;
      }

      ownedRef.current = false;
      onCloseRef.current?.();
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return {
    markSearchHistoryOpen,
    releaseSearchHistory,
    abandonSearchHistory,
  };
}
