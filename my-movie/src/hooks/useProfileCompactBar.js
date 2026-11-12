import { useEffect, useState } from 'react';

const ENTER_AT = 0;
const EXIT_AT = 40;

/**
 * Mobile ≤768: true once .profile-page-top-card has scrolled above the top bar.
 * barSelector, if set, receives the is-scrolled class (owner navbar slot).
 */
export function useProfileCompactBar(barSelector, watchKey) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    let frame = 0;
    let current = false;

    const apply = (next) => {
      if (next === current) return;
      current = next;
      setCompact(next);
    };

    const measure = () => {
      frame = 0;
      if (!mq.matches) {
        apply(false);
        return;
      }
      // The sheet (.profile-page-top-card) also wraps posts, so it stays on screen.
      // The compact bar starts once the avatar and name row has scrolled past.
      const card = document.querySelector('.profile-page-top');
      if (!card) {
        apply(false);
        return;
      }
      const bottom = card.getBoundingClientRect().bottom;
      apply(current ? bottom < EXIT_AT : bottom < ENTER_AT);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onScroll);
    mq.addEventListener('change', onScroll);

    return () => {
      document.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
      mq.removeEventListener('change', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [watchKey]);

  useEffect(() => {
    if (!barSelector) return undefined;
    const bar = document.querySelector(barSelector);
    if (!bar) return undefined;
    bar.classList.toggle('is-scrolled', compact);
    return () => bar.classList.remove('is-scrolled');
  }, [barSelector, compact, watchKey]);

  return compact;
}
