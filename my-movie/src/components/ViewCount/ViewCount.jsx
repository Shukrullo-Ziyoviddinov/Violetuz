import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchViewCount, recordViewRequest } from '../../api/viewsApi';
import { formatActionCount } from '../../utils/utils';
import './ViewCount.css';

/**
 * Umumiy ko‘rishlar komponenti (movie / music / klip / konsert / triller).
 * Login user detailga kirganda serverga yozadi; bir user + id = bir marta.
 */
const ViewCount = ({
  itemId,
  type,
  className = 'movie-detail-action-btn movie-detail-action-btn-views',
  countFormatter = formatActionCount,
}) => {
  const { isLoggedIn } = useAuth();
  const [viewCount, setViewCount] = useState(0);
  const trackedKeyRef = useRef('');

  useEffect(() => {
    if (itemId == null || itemId === '' || !type) return undefined;

    const key = `${type}:${itemId}:${isLoggedIn ? '1' : '0'}`;
    if (trackedKeyRef.current === key) return undefined;
    trackedKeyRef.current = key;

    let cancelled = false;

    const run = async () => {
      try {
        const data = isLoggedIn
          ? await recordViewRequest({ id: itemId, type })
          : await fetchViewCount({ id: itemId, type });
        if (!cancelled) {
          setViewCount(Number(data?.viewCount) || 0);
        }
      } catch {
        if (cancelled) return;
        // Record xato bo‘lsa ham sonni ko‘rsatishga urinish
        if (isLoggedIn) {
          try {
            const data = await fetchViewCount({ id: itemId, type });
            if (!cancelled) setViewCount(Number(data?.viewCount) || 0);
          } catch {
            /* ignore */
          }
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [itemId, type, isLoggedIn]);

  if (itemId == null || itemId === '' || !type) return null;

  return (
    <div
      className={className}
      role="status"
      aria-label={`Ko‘rishlar: ${viewCount}`}
      title="Ko‘rishlar"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <span className="movie-detail-action-count">{countFormatter(viewCount)}</span>
    </div>
  );
};

export default ViewCount;
