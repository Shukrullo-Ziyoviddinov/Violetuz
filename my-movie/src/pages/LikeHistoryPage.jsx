import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LikeHistory from '../components/LikeHistory/LikeHistory';
import LikeHistoryFilter from '../components/LikeHistory/LikeHistoryFilter';
import {
  LikeHistoryFilterModal,
  getAvailableLikeHistoryTabs,
  pickDefaultLikeHistoryCategory,
  createEmptyLikeHistoryDrafts,
  cloneLikeHistoryDrafts,
  resolveLikeHistoryCatalogs,
  filterLikeHistoryItems,
} from '../components/LikeHistoryPageFilter';
import { useLikeHistory } from '../context/LikesContext';
import { useMoviesApi } from '../context/MoviesApiContext';
import { useMusicApi } from '../context/MusicApiContext';
import './LikeHistoryPage.css';
import '../components/LikeHistoryPageFilter/LikeHistoryFilterModal.css';
import '../components/Filters/FiltersSelect.css';

const MOBILE_MAX = 768;

const useIsMobileLikeHistory = () => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= MOBILE_MAX);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
};

const LikeHistoryPage = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobileLikeHistory();
  const list = useLikeHistory();
  const { allMovies } = useMoviesApi();
  const { allClips, allConcerts } = useMusicApi();

  const [filter, setFilter] = useState('movie');
  const [draftTab, setDraftTab] = useState('movie');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(() =>
    createEmptyLikeHistoryDrafts()
  );
  const [draftFilters, setDraftFilters] = useState(() =>
    createEmptyLikeHistoryDrafts()
  );

  const availableTabs = useMemo(
    () => getAvailableLikeHistoryTabs(list, t),
    [list, t]
  );

  const filterCatalogs = useMemo(
    () =>
      resolveLikeHistoryCatalogs({
        historyItems: list,
        allMovies,
        allClips,
        allConcerts,
      }),
    [list, allMovies, allClips, allConcerts]
  );

  useEffect(() => {
    const next = pickDefaultLikeHistoryCategory(list, filter);
    if (next !== filter) setFilter(next);
  }, [list, filter]);

  const filtered = useMemo(
    () => filterLikeHistoryItems(list, filter, filterCatalogs, appliedFilters),
    [list, filter, filterCatalogs, appliedFilters]
  );

  const openFilterModal = () => {
    setDraftTab(filter);
    setDraftFilters(cloneLikeHistoryDrafts(appliedFilters));
    setFilterModalOpen(true);
  };

  const handleFilterApply = () => {
    setFilter(pickDefaultLikeHistoryCategory(list, draftTab));
    setAppliedFilters(cloneLikeHistoryDrafts(draftFilters));
    setFilterModalOpen(false);
  };

  const handleDesktopFilterChange = (next) => {
    setFilter(next);
    setAppliedFilters(createEmptyLikeHistoryDrafts());
  };

  const showMobileFilter = isMobile && availableTabs.length > 0;

  return (
    <div className="like-history-page">
      <div className="like-history-page-container">
        <LikeHistoryFilter
          active={filter}
          onChange={handleDesktopFilterChange}
          items={list}
        />

        {showMobileFilter ? (
          <>
            <button
              type="button"
              className="like-history-filter-mobile-bar"
              onClick={openFilterModal}
            >
              <span className="like-history-filter-mobile-bar-icon" aria-hidden="true">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 5h16" />
                  <path d="M7 12h10" />
                  <path d="M10 19h4" />
                </svg>
              </span>
              <span className="like-history-filter-mobile-bar-text">
                {t('wishlist.sortAndFilter', 'Saralash va filterlash')}
              </span>
            </button>

            <LikeHistoryFilterModal
              isOpen={filterModalOpen}
              onClose={() => setFilterModalOpen(false)}
              tabs={availableTabs}
              selectedTab={draftTab}
              onSelectTab={setDraftTab}
              drafts={draftFilters}
              onDraftsChange={setDraftFilters}
              catalogs={filterCatalogs}
              onApply={handleFilterApply}
            />
          </>
        ) : null}

        <LikeHistory items={filtered} activeCategory={filter} />
      </div>
    </div>
  );
};

export default LikeHistoryPage;
