import { useEffect, useState } from 'react';

const HOLD_MS = 4000;
const FADE_MS = 280;

export const artistIdsOf = (value) => {
  if (Array.isArray(value)) {
    return value.map((id) => String(id || '').trim()).filter(Boolean);
  }
  const one = String(value || '').trim();
  return one ? [one] : [];
};

export const firstArtistId = (value) => artistIdsOf(value)[0] || '';

export const hasArtistId = (value, artistId) => {
  const id = String(artistId || '').trim();
  if (!id) return false;
  return artistIdsOf(value).includes(id);
};

export const formatArtistNames = (artistId, getArtistById) => {
  const ids = artistIdsOf(artistId);
  if (!ids.length) return '';
  return ids
    .map((id) => {
      const artist = typeof getArtistById === 'function' ? getArtistById(id) : null;
      const name = typeof artist?.name === 'string' ? artist.name.trim() : '';
      return name || id;
    })
    .join(' & ');
};

/**
 * 2 va undan ko'p artist bo'lsa har 4 soniyada keyingisiga o'tadi.
 * phase: idle | out | in
 */
export function useArtistCycle(artists) {
  const list = Array.isArray(artists) ? artists.filter(Boolean) : [];
  const key = list.map((artist) => String(artist.id)).join('|');
  const count = list.length;
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('idle');

  useEffect(() => {
    setIndex(0);
    setPhase('idle');
  }, [key]);

  useEffect(() => {
    if (count < 2) return undefined;
    let timer = 0;
    let stopped = false;

    const step = () => {
      setPhase('out');
      timer = window.setTimeout(() => {
        if (stopped) return;
        setIndex((current) => (current + 1) % count);
        setPhase('in');
        timer = window.setTimeout(() => {
          if (!stopped) step();
        }, HOLD_MS);
      }, FADE_MS);
    };

    timer = window.setTimeout(step, HOLD_MS);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [count, key]);

  return {
    artist: list[index] || list[0] || null,
    phase: count > 1 ? phase : 'idle',
  };
}
