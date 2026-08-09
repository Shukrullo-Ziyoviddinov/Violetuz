import { useEffect, useState } from 'react';
import { formatVideoDuration, loadVideoDuration } from './videoDuration';

export const useVideoDurationLabel = (src) => {
  const [label, setLabel] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLabel('');

    if (!src) return undefined;

    loadVideoDuration(src).then((seconds) => {
      if (cancelled) return;
      setLabel(formatVideoDuration(seconds));
    });

    return () => {
      cancelled = true;
    };
  }, [src]);

  return label;
};
