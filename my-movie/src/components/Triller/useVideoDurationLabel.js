import { useEffect, useState } from 'react';
import { formatVideoDuration, loadVideoDuration } from './videoDuration';

/**
 * @returns {{ label: string, ready: boolean }}
 * ready=true when duration resolve/reject finished (or no src).
 */
export const useVideoDurationLabel = (src) => {
  const [label, setLabel] = useState('');
  const [ready, setReady] = useState(() => !src);

  useEffect(() => {
    let cancelled = false;
    setLabel('');

    if (!src) {
      setReady(true);
      return undefined;
    }

    setReady(false);

    loadVideoDuration(src).then((seconds) => {
      if (cancelled) return;
      setLabel(formatVideoDuration(seconds));
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [src]);

  return { label, ready };
};
