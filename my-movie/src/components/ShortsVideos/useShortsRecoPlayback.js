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

const FROZEN_AHEAD = 3;

const mergeTail = (current, incoming, displayIndex, furthestIndex) => {
  if (!current || !current.length) return incoming;
  const index = Math.max(0, displayIndex);
  const furthest = Math.max(index, Number.isInteger(furthestIndex) ? furthestIndex : index);
  const end = index < furthest ? furthest + 1 : index + 1 + FROZEN_AHEAD;
  const prefixLen = Math.min(current.length, end);
  const prefix = current.slice(0, prefixLen);
  const seen = new Set(prefix.map(itemKey));
  const tail = [];
  incoming.forEach((item) => {
    const key = itemKey(item);
    if (seen.has(key)) return;
    seen.add(key);
    tail.push(item);
  });
  const next = [...prefix, ...tail];
  if (
    next.length === current.length
    && next.every((item, index) => itemKey(item) === itemKey(current[index]))
  ) {
    return current;
  }
  return next;
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
export const useShortsRecoPlayback = ({
  enabled,
  catalog,
  shortId,
  refreshKey = 0,
  locked = false,
}) => {
  const [list, setList] = useState(null);
  const sessionRef = useRef({
    sessionId: null,
    count: 0,
    pinned: false,
    loading: false,
    done: false,
  });
  const sessionKeyRef = useRef(null);
  const catalogRef = useRef(catalog);
  const syncAtRef = useRef(() => {});
  const lockedRef = useRef(locked);
  catalogRef.current = catalog;
  lockedRef.current = locked;

  useEffect(() => {
    if (!enabled) {
      sessionKeyRef.current = null;
      sessionRef.current = {
        sessionId: null,
        count: 0,
        pinned: false,
        loading: false,
        done: false,
      };
      setList(null);
      return undefined;
    }
    if (!catalogRef.current.length) return undefined;
    const key = `${shortId || ''}::${refreshKey}`;
    if (sessionKeyRef.current === key) return undefined;
    const sameShort = sessionKeyRef.current != null
      && sessionKeyRef.current.startsWith(`${shortId || ''}::`);
    if (sameShort && sessionRef.current.sessionId && lockedRef.current) return undefined;
    sessionKeyRef.current = key;
    let cancelled = false;
    sessionRef.current = {
      sessionId: null,
      count: 0,
      pinned: false,
      loading: true,
      done: false,
    };
    fetchShortsRecoFeed({ position: 0, limit: 20, focus: shortId || undefined })
      .then((page) => {
        if (cancelled || !page) return;
        const built = playbackFromFeed(catalogRef.current, page.items, shortId);
        sessionRef.current = {
          sessionId: page.sessionId,
          count: (page.items || []).length,
          pinned: built.pinned,
          loading: false,
          done: (page.items || []).length === 0,
          pendingIndex: null,
          maxIndex: 0,
        };
        setList(built.list);
      })
      .catch(() => {
        if (!cancelled) sessionRef.current.loading = false;
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, catalog.length, shortId, refreshKey]);

  const syncAt = useCallback((displayIndex) => {
    const state = sessionRef.current;
    const index = Number.isInteger(displayIndex) && displayIndex >= 0 ? displayIndex : 0;
    if (!enabled) return;
    if (!state.sessionId || state.loading) {
      state.pendingIndex = index;
      return;
    }
    const sessionIndex = Math.max(0, index - (state.pinned ? 1 : 0));
    state.maxIndex = Math.max(state.maxIndex || 0, index);
    const furthestIndex = state.maxIndex;
    state.loading = true;
    state.pendingIndex = null;
    fetchShortsRecoFeed({
      sessionId: state.sessionId,
      position: sessionIndex,
      limit: 20,
    })
      .then((page) => {
        state.loading = false;
        if (!page) return;
        const mapped = uniqueShorts(
          (page.items || []).map((row) => matchCatalogShort(catalogRef.current, row))
        );
        const nextCount = (page.items || []).length;
        if (nextCount <= state.count && sessionIndex >= state.count - 4) state.done = true;
        state.count = Math.max(state.count, nextCount);
        if (mapped.length) {
          setList((current) => mergeTail(current, mapped, index, furthestIndex));
        }
        if (Number.isInteger(state.pendingIndex)) {
          const pending = state.pendingIndex;
          state.pendingIndex = null;
          syncAt(pending);
        }
      })
      .catch(() => {
        state.loading = false;
      });
  }, [enabled]);
  syncAtRef.current = syncAt;

  return { list, loadMore: syncAt, syncAt };
};
