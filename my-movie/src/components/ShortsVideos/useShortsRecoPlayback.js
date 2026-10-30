import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchShortsRecoFeed } from '../../api/shortsRecoApi';

const itemKey = (item) => `${item?.type || ''}:${item?.id}`;

const numericIdOf = (row) => {
  if (row?.short?.id != null) return row.short.id;
  const raw = String(row?.shortId || '');
  const part = raw.includes(':') ? raw.slice(raw.indexOf(':') + 1) : raw;
  const numeric = Number(part);
  return Number.isFinite(numeric) ? numeric : part;
};

export const matchCatalogShort = (catalog, row) => {
  const id = numericIdOf(row);
  const type = row?.type;
  return (catalog || []).find((item) => {
    if (String(item.id) !== String(id)) return false;
    if (!type || !item.type) return true;
    return item.type === type;
  }) || null;
};

const uniqueShorts = (items) => {
  const seen = new Set();
  const list = [];
  (items || []).forEach((item) => {
    if (!item) return;
    const key = itemKey(item);
    if (seen.has(key)) return;
    seen.add(key);
    list.push(item);
  });
  return list;
};

const playbackFromFeed = (catalog, feedItems, shortId) => {
  const mapped = uniqueShorts(
    (feedItems || []).map((row) => matchCatalogShort(catalog, row))
  );
  if (shortId == null || String(shortId) === '') {
    return { list: mapped, pinned: false };
  }
  const opened = (catalog || []).find((item) => String(item.id) === String(shortId)) || null;
  const rest = mapped.filter((item) => String(item.id) !== String(shortId));
  const alreadyFirst = mapped[0] && String(mapped[0].id) === String(shortId);
  if (!opened || alreadyFirst) return { list: mapped, pinned: false };
  return { list: [opened, ...rest], pinned: true };
};

/**
 * Scroll order for the shorts player. The opened card stays first.
 * Everything after it is the shared shorts feed.
 */
export const useShortsRecoPlayback = ({ enabled, catalog, shortId }) => {
  const [list, setList] = useState(null);
  const sessionRef = useRef({
    sessionId: null,
    count: 0,
    pinned: false,
    loading: false,
    done: false,
  });
  const catalogRef = useRef(catalog);
  catalogRef.current = catalog;

  useEffect(() => {
    if (!enabled) {
      setList(null);
      return undefined;
    }
    if (!catalog.length) return undefined;
    let cancelled = false;
    sessionRef.current = {
      sessionId: null,
      count: 0,
      pinned: false,
      loading: true,
      done: false,
    };
    fetchShortsRecoFeed({ position: 0, limit: 20 })
      .then((page) => {
        if (cancelled || !page) return;
        const built = playbackFromFeed(catalog, page.items, shortId);
        sessionRef.current = {
          sessionId: page.sessionId,
          count: (page.items || []).length,
          pinned: built.pinned,
          loading: false,
          done: (page.items || []).length === 0,
        };
        setList(built.list);
      })
      .catch(() => {
        if (!cancelled) sessionRef.current.loading = false;
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, catalog, shortId]);

  const loadMore = useCallback((displayIndex) => {
    const state = sessionRef.current;
    if (!enabled || state.loading || state.done || !state.sessionId) return;
    const sessionIndex = Math.max(0, displayIndex - (state.pinned ? 1 : 0));
    if (sessionIndex < state.count - 4) return;
    state.loading = true;
    fetchShortsRecoFeed({
      sessionId: state.sessionId,
      position: sessionIndex,
      limit: 20,
    })
      .then((page) => {
        state.loading = false;
        if (!page) return;
        const nextCount = (page.items || []).length;
        if (nextCount <= state.count) state.done = true;
        state.count = nextCount;
        const built = playbackFromFeed(catalogRef.current, page.items, shortId);
        state.pinned = built.pinned;
        setList(built.list);
      })
      .catch(() => {
        state.loading = false;
      });
  }, [enabled, shortId]);

  return { list, loadMore };
};
