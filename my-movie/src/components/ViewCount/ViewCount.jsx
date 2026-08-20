import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { fetchViewCount, recordViewRequest } from '../../api/viewsApi';
import { formatActionCount } from '../../utils/utils';
import './ViewCount.css';

/**
 * Umumiy ko‘rishlar komponenti (movie / music / klip / konsert / triller).
 * Login user detailga kirganda serverga yozadi; bir user + id = bir marta.
 *
 * variant:
 * - "icon"  — ko‘z + son (movie detail)
 * - "text"  — "1K marta ko'rishlar" (video detail)
 */
const ViewCount = ({
  itemId,
  type,
  variant = 'icon',
  className,
  countFormatter = formatActionCount,
}) => {
  const { t } = useTranslation();
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

  const formatted = countFormatter(viewCount);

  if (variant === 'text') {
    const label = t('views.times', { count: formatted });
    return (
      <div
        className={className || 'view-count-text'}
        role="status"
        aria-label={label}
      >
        {label}
      </div>
    );
  }

  return (
    <div
      className={className || 'movie-detail-action-btn movie-detail-action-btn-views'}
      role="status"
      aria-label={`Ko‘rishlar: ${formatted}`}
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
      <span className="movie-detail-action-count">{formatted}</span>
    </div>
  );
};

export default ViewCount;
