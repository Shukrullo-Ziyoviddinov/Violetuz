import { useCallback, useMemo, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

const pageLength = (page) => (Array.isArray(page?.items) ? page.items.length : 0);

/**
 * Sahifalangan kesh. Keyingi offset — qaytgan elementlar yig‘indisi.
 * fetchNextPage chaqirilishidan oldin limit shu paytdagi ko‘rinishga qo‘yiladi.
 */
export function usePagedList({
  queryKey,
  fetchPage,
  getLimit,
  enabled = true,
  maxItems = null,
  staleTime = 60_000,
} = {}) {
  const getLimitRef = useRef(getLimit);
  const fetchPageRef = useRef(fetchPage);
  const pendingLimitRef = useRef(null);
  getLimitRef.current = getLimit;
  fetchPageRef.current = fetchPage;

  const query = useInfiniteQuery({
    queryKey,
    enabled: Boolean(enabled),
    initialPageParam: 0,
    staleTime,
    retry: 1,
    queryFn: ({ pageParam, signal }) => {
      const offset = Math.max(0, Number(pageParam) || 0);
      const pending = pendingLimitRef.current;
      pendingLimitRef.current = null;
      const requested = Number(pending ?? getLimitRef.current?.() ?? 0);
      const limit = requested > 0 ? Math.floor(requested) : 0;
      if (!(limit > 0)) {
        return Promise.resolve({ items: [], hasMore: false, nextOffset: offset });
      }
      return fetchPageRef.current({ offset, limit, signal });
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + pageLength(page), 0);
      if (maxItems != null && loaded >= maxItems) return undefined;
      if (!lastPage?.hasMore || pageLength(lastPage) === 0) return undefined;
      return loaded;
    },
  });

  const items = useMemo(() => {
    const flat = (query.data?.pages || []).flatMap((page) => (
      Array.isArray(page.items) ? page.items : []
    ));
    return maxItems != null ? flat.slice(0, maxItems) : flat;
  }, [maxItems, query.data]);

  const fetchNextPage = useCallback((limit) => {
    const next = Number(limit ?? getLimitRef.current?.() ?? 0);
    if (!(next > 0) || !query.hasNextPage || query.isFetchingNextPage) {
      return Promise.resolve(undefined);
    }
    pendingLimitRef.current = Math.floor(next);
    return query.fetchNextPage();
  }, [query]);

  return {
    items,
    hasMore: Boolean(query.hasNextPage),
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage,
    error: query.error,
  };
}
