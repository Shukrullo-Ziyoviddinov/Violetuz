import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import FeedHeader from '../components/feed/FeedHeader';
import FeedCategory from '../components/feed/FeedCategory';
import FeedList from '../components/feed/FeedList';
import MessageModal from '../components/Messages/MessageModal';
import { OPEN_MESSAGES_EVENT } from '../messagesModalBridge';
import { useFeedProfile } from '../context/AuthContext';
import { useFollowingItems } from '../context/FollowingContext';
import { getFeedHeaderFromFollowingItems } from '../store/slices/followingUtils';
import { useAppSelector } from '../store/hooks';
import { selectAuthReady, selectIsLoggedIn } from '../store/slices/userSlice';
import { fetchFeed } from '../api/feedApi';
import './feedPage.css';

const PAGE_SIZE = 12;

const FeedPage = () => {
  const { i18n } = useTranslation();
  const feedLang = i18n.language?.toLowerCase().startsWith('ru') ? 'ru' : 'uz';
  const [activeCategory, setActiveCategory] = useState('all');
  const followingItems = useFollowingItems();
  const feedProfileUser = useFeedProfile();
  const [messagesOpen, setMessagesOpen] = useState(false);
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const sentinelRef = useRef(null);

  const followingKey = useMemo(
    () =>
      followingItems
        .map((x) => `${x.type}:${x.id}`)
        .sort()
        .join('|'),
    [followingItems]
  );

  const openMessages = useCallback(() => setMessagesOpen(true), []);

  useEffect(() => {
    const onOpen = () => setMessagesOpen(true);
    window.addEventListener(OPEN_MESSAGES_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_MESSAGES_EVENT, onOpen);
  }, []);

  const headerFollowedPeople = useMemo(
    () => getFeedHeaderFromFollowingItems(followingItems, feedLang),
    [followingItems, feedLang]
  );

  const feedQuery = useInfiniteQuery({
    queryKey: ['feed', activeCategory, followingKey],
    queryFn: ({ pageParam = 0 }) =>
      fetchFeed({ type: activeCategory, offset: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.hasMore) return undefined;
      return lastPage.offset + lastPage.items.length;
    },
    enabled: Boolean(authReady && isLoggedIn),
    staleTime: 60_000,
    retry: 1,
  });

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = feedQuery;

  const feedItems = useMemo(
    () => (data?.pages || []).flatMap((p) => (Array.isArray(p.items) ? p.items : [])),
    [data]
  );

  const feedLoading = Boolean(authReady && isLoggedIn && isLoading);
  const loadingMore = Boolean(isFetchingNextPage);
  const hasMore = Boolean(hasNextPage);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || loadingMore || feedLoading) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: '160px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, feedLoading, fetchNextPage]);

  return (
    <div className="feed-page">
      <FeedHeader currentUser={feedProfileUser} followedPeople={headerFollowedPeople} />
      <FeedCategory
        activeCategory={activeCategory}
        onChangeCategory={setActiveCategory}
        onOpenMessages={openMessages}
      />
      <FeedList items={feedItems} loading={feedLoading} />
      {isLoggedIn && hasMore ? (
        <div ref={sentinelRef} className="feed-page-sentinel" aria-hidden="true" />
      ) : null}
      {loadingMore ? (
        <div className="feed-page-load-more" role="status" aria-label="Yuklanmoqda">
          <span className="feed-page-load-more-arc" />
        </div>
      ) : null}
      <MessageModal open={messagesOpen} onClose={() => setMessagesOpen(false)} />
    </div>
  );
};

export default FeedPage;
