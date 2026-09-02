import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LikeHistory from '../components/LikeHistory/LikeHistory';
import LikeHistoryFilter from '../components/LikeHistory/LikeHistoryFilter';
import {
  LikeHistoryFilterModal,
  getAvailableLikeHistoryTabs,
  pickDefaultLikeHistoryCategory,
} from '../components/LikeHistoryPageFilter';
import { useLikeHistory } from '../context/LikesContext';
import './LikeHistoryPage.css';
import '../components/LikeHistoryPageFilter/LikeHistoryFilterModal.css';

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
  const [filter, setFilter] = useState('movie');
  const [draftTab, setDraftTab] = useState('movie');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const list = useLikeHistory();

  const availableTabs = useMemo(
    () => getAvailableLikeHistoryTabs(list, t),
    [list, t]
  );

  useEffect(() => {
    const next = pickDefaultLikeHistoryCategory(list, filter);
    if (next !== filter) setFilter(next);
  }, [list, filter]);

  useEffect(() => {
    if (filterModalOpen) setDraftTab(filter);
  }, [filterModalOpen, filter]);

  const filtered = useMemo(
    () => list.filter((item) => item.category === filter),
    [list, filter]
  );

  const openFilterModal = () => {
    setDraftTab(filter);
    setFilterModalOpen(true);
  };

  const handleFilterApply = () => {
    setFilter(pickDefaultLikeHistoryCategory(list, draftTab));
    setFilterModalOpen(false);
  };

  const showMobileFilter = isMobile && availableTabs.length > 0;

  return (
    <div className="like-history-page">
      <div className="like-history-page-container">
        <LikeHistoryFilter active={filter} onChange={setFilter} items={list} />

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
              items={list}
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
