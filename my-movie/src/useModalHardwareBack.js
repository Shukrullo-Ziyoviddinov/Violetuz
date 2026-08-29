import { useEffect, useRef } from 'react';

/**
 * Oddiy modal uchun qurilma/browser «ortga»:
 * ochilganda history push; ortga → onCloseFromHardware (sahifadan chiqilmaydi).
 */
export function useModalHardwareBack({
  historyKey,
  isOpen,
  onCloseFromHardware,
  /** true bo‘lsa ortga avval nested UI yopiladi (masalan confirm) */
  hasNested = false,
  onNestedBack,
}) {
  const ownedRef = useRef(false);
  const openRef = useRef(isOpen);
  const nestedRef = useRef(hasNested);
  const onCloseRef = useRef(onCloseFromHardware);
  const onNestedRef = useRef(onNestedBack);
  const key = String(historyKey || 'violetModal');

  openRef.current = isOpen;
  nestedRef.current = hasNested;
  onCloseRef.current = onCloseFromHardware;
  onNestedRef.current = onNestedBack;

  const markOpen = () => {
    if (ownedRef.current) return;
    window.history.pushState({ [key]: true }, '');
    ownedRef.current = true;
  };

  const releaseHistory = () => {
    if (!ownedRef.current) return;
    ownedRef.current = false;
    window.history.back();
  };

  const abandonHistory = () => {
    ownedRef.current = false;
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    markOpen();

    const onPopState = () => {
      if (!openRef.current) {
        ownedRef.current = false;
        return;
      }

      if (nestedRef.current) {
        onNestedRef.current?.();
        window.history.pushState({ [key]: true }, '');
        ownedRef.current = true;
        return;
      }

      ownedRef.current = false;
      onCloseRef.current?.();
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      ownedRef.current = false;
    };
  }, [isOpen, key]);

  return {
    releaseHistory,
    abandonHistory,
  };
}
