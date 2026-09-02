import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import { LikeHistoryTabIcons } from './likeHistoryTabIcons';
import LikeHistoryMovieFilters from './LikeHistoryMovieFilters';
import LikeHistoryMusicFilters from './LikeHistoryMusicFilters';
import {
  getLikeHistoryFilterPanelKind,
  countLikeHistoryDraftResults,
  EMPTY_MOVIE_DRAFT,
  EMPTY_MUSIC_DRAFT,
} from './likeHistoryFilterLogic';
import '../Filters/FiltersSelect.css';
import './LikeHistoryFilterModal.css';

const DRAG_CLOSE_THRESHOLD = 80;

/**
 * Like-history mobil filter modal.
 * Tab → pastda kino yoki klip/konsert filter paneli (wishlist bilan bir xil).
 */
const LikeHistoryFilterModal = ({
  isOpen,
  onClose,
  tabs = [],
  selectedTab,
  onSelectTab,
  drafts,
  onDraftsChange,
  catalogs = {},
  onApply,
}) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const isDragging = useRef(false);
  const isTouch = useRef(false);
  const closeTimerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const panelKind = getLikeHistoryFilterPanelKind(selectedTab);
  const resultCount = countLikeHistoryDraftResults(selectedTab, catalogs, drafts);

  useEffect(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (isOpen) {
      setMounted(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    closeTimerRef.current = setTimeout(() => {
      setMounted(false);
      closeTimerRef.current = null;
    }, 320);
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [isOpen]);

  const handleDragStart = useCallback((e) => {
    if (e.target.closest?.('.like-history-tabs')) return;
    if (e.target.closest?.('.filters-select')) return;
    if (e.target.closest?.('.like-history-filter-modal-footer')) return;
    isTouch.current = e.type.startsWith('touch');
    isDragging.current = true;
    dragStartY.current = isTouch.current ? e.touches[0].clientY : e.clientY;
    dragCurrentY.current = dragStartY.current;
    const modal = modalRef.current;
    if (modal) modal.style.transition = 'none';
  }, []);

  const handleDragMove = useCallback((e) => {
    if (!isDragging.current) return;
    const y = isTouch.current ? e.touches[0].clientY : e.clientY;
    dragCurrentY.current = y;
    const modal = modalRef.current;
    if (!modal) return;
    const delta = y - dragStartY.current;
    if (delta > 0) modal.style.transform = `translateY(${delta}px)`;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const modal = modalRef.current;
    if (!modal) return;
    modal.style.transition = '';
    const delta = dragCurrentY.current - dragStartY.current;
    if (delta > DRAG_CLOSE_THRESHOLD) onClose?.();
    modal.style.transform = '';
  }, [onClose]);

  useEffect(() => {
    if (!mounted || !visible) return undefined;
    const onMove = (e) => {
      if (isTouch.current) handleDragMove(e);
    };
    const onEnd = () => handleDragEnd();
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', onEnd);
    return () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', onEnd);
    };
  }, [mounted, visible, handleDragMove, handleDragEnd]);

  const patchDraft = (tabId, nextDraft) => {
    onDraftsChange?.({
      ...drafts,
      [tabId]: nextDraft,
    });
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className={`like-history-filter-modal-overlay${visible ? ' open' : ''}`}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="like-history-filter-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="like-history-filter-modal-header"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <span className="like-history-filter-modal-drag-bar" aria-hidden="true" />
          <div className="like-history-filter-modal-header-row">
            <h3 className="like-history-filter-modal-title">
              {t('wishlist.sortAndFilter', 'Saralash va filterlash')}
            </h3>
          </div>
        </div>

        <div className="like-history-filter-modal-body filters-modal-sheet-body">
          <ScrollTouch className="like-history-tabs like-history-tabs--modal">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`like-history-tab${selectedTab === tab.id ? ' active' : ''}`}
                onClick={() => onSelectTab?.(tab.id)}
              >
                <span className="like-history-tab-icon">
                  {LikeHistoryTabIcons[tab.id]}
                </span>
                {tab.label}
              </button>
            ))}
          </ScrollTouch>

          {panelKind !== 'none' ? (
            <div className="like-history-filter-panels" aria-live="polite">
              {panelKind === 'movie' ? (
                <LikeHistoryMovieFilters
                  key="movie-panel"
                  movies={catalogs.movie || []}
                  draft={drafts?.movie || EMPTY_MOVIE_DRAFT}
                  onChange={(next) => patchDraft('movie', next)}
                />
              ) : null}

              {panelKind === 'music' ? (
                <LikeHistoryMusicFilters
                  key={`music-panel-${selectedTab}`}
                  items={catalogs[selectedTab] || []}
                  draft={drafts?.[selectedTab] || EMPTY_MUSIC_DRAFT}
                  onChange={(next) => patchDraft(selectedTab, next)}
                />
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="like-history-filter-modal-footer">
          <button
            type="button"
            className="like-history-filter-modal-clear"
            onClick={() => {
              if (panelKind === 'movie') {
                patchDraft('movie', {
                  ...EMPTY_MOVIE_DRAFT,
                  genres: [],
                });
              } else if (panelKind === 'music' && selectedTab) {
                patchDraft(selectedTab, { ...EMPTY_MUSIC_DRAFT });
              }
            }}
          >
            {t('music.filterClear', 'Tozalash')}
          </button>
          <button
            type="button"
            className="like-history-filter-modal-apply"
            onClick={onApply}
          >
            {t('music.showResults', 'Natija')}
            {` (${resultCount})`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LikeHistoryFilterModal;
