import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useAuth } from '../../context/AuthContext';
import { fetchSearchPoiscHistory } from '../../api/searchPoiscHistoryApi';
import { normalizeImagePath } from '../../utils/utils';
import SearchHistoryItem, {
  getHistoryItemTitle,
  getHistoryItemImgSrc,
} from './SearchHistoryItem';
import './SearchModalHistory.css';

const HISTORY_TYPE_I18N = {
  movie: ['searchModal.historyTypeMovie', 'Kino'],
  music: ['searchModal.historyTypeMusic', 'Musiqa'],
  klip: ['searchModal.historyTypeClip', 'Klip'],
  konsert: ['searchModal.historyTypeConcert', 'Konsert'],
  actor: ['searchModal.historyTypeActor', 'Aktyor'],
  artist: ['searchModal.historyTypeArtist', 'Artist'],
};

const getHistoryPath = (item) => {
  const id = item?.id;
  const type = item?.type;
  if (id == null || !type) return null;
  if (type === 'movie') return `/movie/${id}`;
  if (type === 'music') return `/music/${id}`;
  if (type === 'klip' || type === 'konsert') return `/music/video/${id}`;
  if (type === 'actor') return `/actor/${id}`;
  if (type === 'artist') return `/music/artist/${id}`;
  return null;
};

/**
 * Qidiruv tarixi paneli — list + empty.
 * enabled=false bo‘lsa so‘rov yuborilmaydi (tab yopiq).
 */
const SearchModalHistory = ({ onItemClick, enabled = true }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { isLoggedIn, authReady } = useAuth();

  const canFetch = Boolean(enabled && authReady && isLoggedIn);

  const {
    data,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['searchPoiscHistory'],
    queryFn: () => fetchSearchPoiscHistory(),
    enabled: canFetch,
    staleTime: 15_000,
    refetchOnMount: 'always',
  });

  const items = Array.isArray(data?.items) ? data.items : [];
  const listPending = !authReady || (canFetch && isLoading && items.length === 0);

  const typeLabel = useCallback(
    (type) => {
      const entry = HISTORY_TYPE_I18N[type];
      if (!entry) return type || '';
      return t(entry[0], entry[1]);
    },
    [t]
  );

  const handleOpen = useCallback(
    (item) => {
      const path = getHistoryPath(item);
      if (!path) return;
      onItemClick?.(item);
      navigate(path);
    },
    [navigate, onItemClick]
  );

  if (!authReady || (isLoggedIn && listPending)) {
    return (
      <div className="search-modal-history" aria-busy="true">
        <div className="search-modal-history-list">
          {[0, 1, 2, 3].map((i) => (
            <SearchHistoryItem
              key={`sk-list-${i}`}
              placeholder
              forceLoading
            />
          ))}
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="search-modal-history">
        <p className="search-modal-history-empty">
          {t('searchModal.historyLoginRequired')}
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="search-modal-history">
        <p className="search-modal-history-empty">
          {t('searchModal.historyError')}
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="search-modal-history search-modal-history--empty">
        <div className="search-modal-history-empty-wrap">
          <svg
            className="search-modal-history-empty-icon"
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <p className="search-modal-history-empty">
            {t(
              'searchModal.historyEmpty',
              'Siz uchun qidiruv natijalari mavjud emas'
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="search-modal-history"
      aria-busy={isFetching || undefined}
    >
      <div className="search-modal-history-list">
        {items.map((item) => {
          const type = item.type || 'movie';
          const snapshot = item.snapshot || null;
          return (
            <SearchHistoryItem
              key={`${type}-${item.id}`}
              type={type}
              title={getHistoryItemTitle(snapshot, contentLang, type)}
              typeLabel={typeLabel(type)}
              imgSrc={normalizeImagePath(
                getHistoryItemImgSrc(snapshot, type, contentLang) || ''
              )}
              onClick={() => handleOpen(item)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default SearchModalHistory;
