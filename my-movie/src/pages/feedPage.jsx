import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import FeedHeader from '../components/feed/FeedHeader';
import FeedCategory from '../components/feed/FeedCategory';
import FeedList from '../components/feed/FeedList';
import MessageModal from '../components/Messages/MessageModal';
import { OPEN_MESSAGES_EVENT } from '../messagesModalBridge';
import { useFeedProfile } from '../context/AuthContext';
import { useFollowingIds } from '../context/FollowingContext';
import { getFeedHeaderFollowedPeople } from '../store/slices/followingUtils';
import { actors } from '../data/actors';
import { artists } from '../dataMusic/artists';
import { allMovies } from '../data/movies';
import { MUSIC_SECTIONS } from '../dataMusic/musicSectionsConfig';
import { CLIPS_SECTIONS } from '../dataMusic/clipsSectionsConfig';
import './feedPage.css';

const resolveSortKey = (item, fallbackId = 0) => {
  if (item?.createdAt) {
    const t = new Date(item.createdAt).getTime();
    if (!Number.isNaN(t)) return t;
  }
  const year = Number(item?.year);
  if (!Number.isNaN(year) && year > 0) return year * 100000 + Number(fallbackId || 0);
  return Number(fallbackId || 0);
};

const normalizeType = (raw) => {
  const v = String(raw || '').toLowerCase();
  if (v === 'movie') return 'movie';
  if (v === 'music') return 'music';
  if (v === 'klip' || v === 'clip') return 'klip';
  if (v === 'konsert' || v === 'concert') return 'konsert';
  return 'other';
};

const FeedPage = () => {
  const { i18n } = useTranslation();
  const feedLang = i18n.language?.toLowerCase().startsWith('ru') ? 'ru' : 'uz';
  const [activeCategory, setActiveCategory] = useState('all');
  const followingIds = useFollowingIds();
  const feedProfileUser = useFeedProfile();
  const [messagesOpen, setMessagesOpen] = useState(false);

  const openMessages = useCallback(() => setMessagesOpen(true), []);

  useEffect(() => {
    const onOpen = () => setMessagesOpen(true);
    window.addEventListener(OPEN_MESSAGES_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_MESSAGES_EVENT, onOpen);
  }, []);

  const headerFollowedPeople = useMemo(
    () => getFeedHeaderFollowedPeople(followingIds, feedLang),
    [followingIds, feedLang]
  );

  const feedItems = useMemo(() => {
    const normalized = new Set(followingIds.map((id) => String(id)));
    const followedActorIds = new Set(
      actors.filter((actor) => normalized.has(String(actor.id))).map((actor) => actor.id)
    );
    const followedArtistIds = new Set(
      artists.filter((artist) => normalized.has(String(artist.id))).map((artist) => artist.id)
    );

    const movieItems = allMovies
      .filter((movie) => Array.isArray(movie.actors) && movie.actors.some((id) => followedActorIds.has(id)))
      .slice(0, 30)
      .map((movie) => {
        const actorId = movie.actors?.find((id) => followedActorIds.has(id));
        const actor = actors.find((a) => a.id === actorId);
        return {
          id: `movie-${movie.id}`,
          type: normalizeType(movie?.type) || 'movie',
          actorId: actor?.id,
          actorName: actor?.name?.uz || actor?.name?.ru || 'Movie actor',
          actorImage: actor?.image || '/img/movie1.jpg',
          title: movie?.title?.uz || movie?.title?.ru || 'Movie',
          cover: movie?.homeImg?.uz || movie?.homeImg?.ru || '/img/movie1.jpg',
          movieId: movie.id,
          like: movie.like,
          dislike: movie.dislike,
          sortKey: resolveSortKey(movie, movie.id),
        };
      });

    const musicItemsRaw = [];

    MUSIC_SECTIONS.forEach((section) => {
      const rows = Array.isArray(section.data) ? section.data : [];
      const isAlbum = section.wishlistType === 'album';

      rows.forEach((item) => {
        if (!item?.artistId || !followedArtistIds.has(item.artistId)) return;
        const artist = artists.find((a) => a.id === item.artistId);

        if (isAlbum) {
          musicItemsRaw.push({
            id: `music-${section.id}-${item.id}`,
            type: 'music',
            artistId: item.artistId,
            artistName: artist?.name || item.artist || 'Music artist',
            artistImage: artist?.imgArtist || artist?.img || '/img/movie1.jpg',
            title: item.title || 'Music',
            trackTitle: item.songs?.[0]?.title || 'Unknown track',
            cover: item.img || artist?.imgArtist || artist?.img || '/img/movie1.jpg',
            albumId: item.id,
            trackId: undefined,
            musicSectionId: section.id,
            sortKey: resolveSortKey(item, item.id),
          });
        } else {
          musicItemsRaw.push({
            id: `music-${section.id}-${item.id}`,
            type: 'music',
            artistId: item.artistId,
            artistName: artist?.name || item.artist || 'Music artist',
            artistImage: artist?.imgArtist || artist?.img || '/img/movie1.jpg',
            title: item.title || 'Music',
            trackTitle: item.title || 'Unknown track',
            cover: item.img || artist?.imgArtist || artist?.img || '/img/movie1.jpg',
            albumId: undefined,
            trackId: item.id,
            musicSectionId: section.id,
            sortKey: resolveSortKey(item, item.id),
          });
        }
      });
    });

    const musicItems = musicItemsRaw.sort((a, b) => (b.sortKey || 0) - (a.sortKey || 0)).slice(0, 100);

    const videoSource = CLIPS_SECTIONS.flatMap((section) =>
      Array.isArray(section.data) ? section.data : []
    );
    const videoItems = videoSource
      .filter((item) => followedArtistIds.has(item.artistId))
      .slice(0, 40)
      .map((item) => {
        const artist = artists.find((a) => a.id === item.artistId);
        return {
          id: `video-${item.id}`,
          videoId: item.id,
          type: normalizeType(item.type) || 'klip',
          wishlistType: normalizeType(item.type) || 'klip',
          artistId: item.artistId,
          artistName: artist?.name || 'Music artist',
          artistImage: artist?.imgArtist || artist?.img || '/img/movie1.jpg',
          title: item.title || 'Video',
          cover: item.img || '/img/movie1.jpg',
          videoKind: normalizeType(item.type) === 'konsert' ? 'Konsert' : 'Klip',
          sortKey: resolveSortKey(item, item.id),
        };
      });

    return [...movieItems, ...musicItems, ...videoItems].sort((a, b) => (b.sortKey || 0) - (a.sortKey || 0));
  }, [followingIds]);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return feedItems;
    return feedItems.filter((item) => item.type === activeCategory);
  }, [feedItems, activeCategory]);

  return (
    <div className="feed-page">
      <FeedHeader currentUser={feedProfileUser} followedPeople={headerFollowedPeople} />
      <FeedCategory
        activeCategory={activeCategory}
        onChangeCategory={setActiveCategory}
        onOpenMessages={openMessages}
      />
      <FeedList items={filteredItems} />
      <MessageModal open={messagesOpen} onClose={() => setMessagesOpen(false)} />
    </div>
  );
};

export default FeedPage;
