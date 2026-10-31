import { useEffect, useRef, useState } from 'react';
import { fetchShortsRecoPage } from '../../api/shortsRecoApi';
import { matchCatalogShort } from './useShortsRecoPlayback';

const itemKey = (item) => `${item?.type || ''}:${item?.id}`;

/**
 * Shorts page grid order. The player feed is a separate request.
 */
export const useShortsPageOrder = ({ enabled, catalog, refreshKey }) => {
  const [list, setList] = useState(null);
  const [failed, setFailed] = useState(false);
  const catalogRef = useRef(catalog);
  catalogRef.current = catalog;

  useEffect(() => {
    if (!enabled) {
      setList(null);
      setFailed(false);
      return undefined;
    }
    if (!catalogRef.current.length) return undefined;
    let cancelled = false;
    setFailed(false);
    fetchShortsRecoPage()
      .then((page) => {
        if (cancelled || !page) return;
        const seen = new Set();
        const mapped = [];
        (page.items || []).forEach((row) => {
          const item = matchCatalogShort(catalogRef.current, row);
          if (!item) return;
          const key = itemKey(item);
          if (seen.has(key)) return;
          seen.add(key);
          mapped.push(item);
        });
        setList(mapped);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, catalog.length, refreshKey]);

  return { list, failed };
};
