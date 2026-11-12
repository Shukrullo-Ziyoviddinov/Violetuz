import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import GlobalModal from '../components/GlobalModal/GlobalModal';
import FollowingButton from '../Music/FollowingButton/FollowingButton';
import ShareButton from '../components/ShareButton/ShareButton';
import UserAvatar from '../components/UserAvatar/UserAvatar';
import RepostFilter from '../components/Repost/RepostFilter';
import RepostMovieCard from '../components/Repost/RepostMovieCard';
import RepostMusicCard from '../components/Repost/RepostMusicCard';
import RepostVideoCard from '../components/Repost/RepostVideoCard';
import RepostShortsCard from '../components/Repost/RepostShortsCard';
import { normalizeRepostType, repostMatchesFilter } from '../components/Repost/repostTypes';
import { useAuth } from '../context/AuthContext';
import { useActorsApi } from '../context/ActorsApiContext';
import { useMusicApi } from '../context/MusicApiContext';
import { fetchPublicProfile } from '../api/publicProfileApi';
import { followButtonType, getFollowedPeople, isOwnUserFollow, mapUserFollowRows, pinViewerFirst } from '../store/slices/followingUtils';
import { normalizeUsername } from '../store/slices/userUtils';
import { useImageReady } from '../utils/useImageReady';
import SkeletonLoader from '../components/SkeletonLoader/SkeletonLoader';
import './ProfilePage.css';

const REPOST_EMPTY_IMG_SRC = '/img/wishlist_preview_rev_1.png';

const REPOST_SECTIONS = [
  { key: 'movie', titleKey: 'profilePage.repostFilters.movie' },
  { key: 'shorts', titleKey: 'profilePage.repostFilters.shorts' },
  { key: 'klip', titleKey: 'profilePage.repostFilters.klip' },
  { key: 'konsert', titleKey: 'profilePage.repostFilters.konsert' },
  { key: 'music', titleKey: 'profilePage.repostFilters.music' },
];

const formatUsernameDisplay = (raw) => {
  const username = normalizeUsername(raw);
  return username ? `@${username}` : '';
};

const getCurrentLanguage = () => {
  const lang = (typeof window !== 'undefined' && localStorage.getItem('i18nextLng')) || 'uz';
  const code = typeof lang === 'string' ? lang.toLowerCase().split('-')[0] : 'uz';
  return code === 'uz' || code === 'ru' ? code : 'uz';
};

const repostGridClass = (sectionKey) => {
  if (sectionKey === 'music') return 'profile-page-repost-grid profile-page-repost-grid--music';
  if (sectionKey === 'klip' || sectionKey === 'konsert') {
    return 'profile-page-repost-grid profile-page-repost-grid--media';
  }
  return 'profile-page-repost-grid';
};

const groupRepostSections = (items) => {
  const groups = { movie: [], music: [], klip: [], konsert: [], shorts: [] };
  for (const item of items) {
    const type = normalizeRepostType(item?.type);
    if (!type) continue;
    if (type === 'movie') groups.movie.push(item);
    else if (type === 'music') groups.music.push(item);
    else if (type === 'klip') groups.klip.push(item);
    else if (type === 'konsert') groups.konsert.push(item);
    else if (type === 'movieShorts' || type === 'musicshorts') groups.shorts.push(item);
  }
  return REPOST_SECTIONS.map((section) => ({ ...section, items: groups[section.key] })).filter(
    (section) => section.items.length > 0
  );
};

const PublicRepostEmpty = () => {
  const { showSkeleton, imgRef, onLoad, onError } = useImageReady(REPOST_EMPTY_IMG_SRC);

  return (
    <div className="profile-page-repost-empty">
      {showSkeleton ? (
        <div
          className="profile-page-repost-empty-img profile-page-repost-empty-img--skeleton"
          aria-hidden="true"
        >
          <SkeletonLoader variant="profile-page-repost-empty-img" />
        </div>
      ) : (
        <img
          ref={imgRef}
          src={REPOST_EMPTY_IMG_SRC}
          alt=""
          className="profile-page-repost-empty-img"
          decoding="async"
          onLoad={onLoad}
          onError={onError}
        />
      )}
      <p className="profile-page-repost-empty-text">repostlar yo‘q</p>
    </div>
  );
};

const AvatarFallback = () => (
  <svg
    className="profile-avatar-icon"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const PublicProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { profile, isLoggedIn, authReady } = useAuth();
  const { allActors } = useActorsApi();
  const { allArtists } = useMusicApi();
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage);
  const [status, setStatus] = useState('loading');
  const [profileData, setProfileData] = useState(null);
  const [repostFilter, setRepostFilter] = useState('all');
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [statsModalType, setStatsModalType] = useState('following');

  const userId = String(id || '').trim();
  const isOwn =
    authReady && isLoggedIn && profile?.id && String(profile.id) === userId;

  useEffect(() => {
    if (!isOwn) return;
    navigate('/profile', { replace: true });
  }, [isOwn, navigate]);

  useEffect(() => {
    setCurrentLanguage(getCurrentLanguage());
  }, [i18n.language]);

  useEffect(() => {
    if (!authReady || isOwn) return undefined;
    if (!userId) {
      setProfileData(null);
      setStatus('missing');
      return undefined;
    }

    let cancelled = false;
    setStatus('loading');
    setProfileData(null);
    setRepostFilter('all');

    fetchPublicProfile(userId)
      .then((data) => {
        if (cancelled) return;
        setProfileData(data);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setProfileData(null);
        setStatus(err?.status === 404 ? 'missing' : 'error');
      });

    return () => {
      cancelled = true;
    };
  }, [authReady, isOwn, userId]);

  const repostItems = profileData?.reposts || [];
  const followedPeople = useMemo(
    () =>
      pinViewerFirst(
        getFollowedPeople(
          profileData?.following || [],
          currentLanguage,
          allActors,
          allArtists
        ),
        profile?.id
      ),
    [profileData, currentLanguage, allActors, allArtists, profile?.id]
  );
  const followersPeople = useMemo(
    () => pinViewerFirst(mapUserFollowRows(profileData?.followers || []), profile?.id),
    [profileData, profile?.id]
  );

  const shortsRepostScope = useMemo(
    () =>
      repostItems
        .map((item) => ({ ...item, type: normalizeRepostType(item?.type) }))
        .filter((item) => item.type === 'movieShorts' || item.type === 'musicshorts')
        .map((item) => ({ type: item.type, id: item.id })),
    [repostItems]
  );

  const filteredRepostItems = repostItems.filter((item) => {
    const type = normalizeRepostType(item?.type);
    if (!type) return false;
    return repostMatchesFilter(type, repostFilter);
  });

  const repostSectionsAll = useMemo(
    () => (repostFilter === 'all' ? groupRepostSections(repostItems) : []),
    [repostFilter, repostItems]
  );

  const renderRepostCard = (item) => {
    const type = normalizeRepostType(item?.type);
    const key = `${type ?? 'unknown'}-${item.id}`;
    if (!type) return null;
    if (type === 'movie') return <RepostMovieCard key={key} item={item} />;
    if (type === 'music') return <RepostMusicCard key={key} item={item} />;
    if (type === 'klip' || type === 'konsert') return <RepostVideoCard key={key} item={item} />;
    if (type === 'movieShorts' || type === 'musicshorts') {
      const scopeIndex = shortsRepostScope.findIndex(
        (entry) => entry.type === type && String(entry.id) === String(item.id)
      );
      return (
        <RepostShortsCard
          key={key}
          item={item}
          scopeEntries={shortsRepostScope}
          scopeIndex={scopeIndex >= 0 ? scopeIndex : 0}
        />
      );
    }
    return null;
  };

  const openFollowingItem = (person) => {
    if (!person) return;
    if (person.entityType === 'actor') {
      navigate(`/actor/${person.followId}`);
    } else if (person.entityType === 'channel') {
      navigate(`/channel/${encodeURIComponent(person.followId)}`);
    } else if (person.entityType === 'user') {
      navigate(`/user/${encodeURIComponent(person.followId)}`);
    } else {
      navigate(`/music/artist/${person.followId}`);
    }
    setShowFollowingModal(false);
  };

  const handleVisitorSubscribe = useCallback((active) => {
    if (!profile?.id) return;
    const mine = String(profile.id);
    setProfileData((prev) => {
      if (!prev) return prev;
      const rows = Array.isArray(prev.followers) ? prev.followers : [];
      const has = rows.some((row) => String(row.id) === mine);
      if (active && !has) {
        return {
          ...prev,
          followers: [
            {
              id: mine,
              type: 'user',
              snapshot: {
                id: mine,
                name: profile.name || '',
                username: profile.username || '',
                avatar: profile.avatar || '',
              },
            },
            ...rows,
          ],
        };
      }
      if (!active && has) {
        return { ...prev, followers: rows.filter((row) => String(row.id) !== mine) };
      }
      return prev;
    });
  }, [profile?.id, profile?.name, profile?.username, profile?.avatar]);

  const openStats = (type) => {
    setStatsModalType(type);
    setShowFollowingModal(true);
  };

  if (!authReady || isOwn || status === 'loading') {
    return null;
  }

  if (status !== 'ready' || !profileData?.user) {
    return (
      <div className="profile-page">
        <div className="profile-page-header">
          <div className="profile-page-bg" style={{ backgroundImage: 'url(/img/profilfoto.jpg)' }} />
        </div>
        <div className="profile-page-content">
          <p className="profile-page-repost-empty-text">
            {status === 'missing' ? 'Foydalanuvchi topilmadi' : 'Profilni ochib bo‘lmadi'}
          </p>
        </div>
      </div>
    );
  }

  const user = profileData.user;
  const modalPeople = statsModalType === 'followers' ? followersPeople : followedPeople;

  return (
    <div className="profile-page">
      <div className="profile-page-mobile-name profile-page-visitor-name">
        <button
          type="button"
          className="profile-page-visitor-back"
          onClick={() => navigate(-1)}
          aria-label="Ortga"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <path
              d="M15 6l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="profile-page-mobile-name-text">{user.name}</span>
        <ShareButton
          icon="send"
          className="profile-page-visitor-share"
          buttonClassName="profile-page-visitor-share-btn"
          movie={{ title: user.name }}
          sharePath={`/user/${encodeURIComponent(user.id)}`}
        />
      </div>
      <div className="profile-page-header">
        <div className="profile-page-bg" style={{ backgroundImage: 'url(/img/profilfoto.jpg)' }} />
      </div>

      <div className="profile-page-content">
        <div className="profile-page-top-card">
          <div className="profile-page-top">
            <div className="profile-avatar-wrap" aria-hidden="true">
              <UserAvatar
                src={user.avatar}
                className="profile-avatar-img"
                fallback={<AvatarFallback />}
              />
            </div>
            <div className="profile-info">
              <div className="profile-name-row">
                <div className="profile-name">
                  <span className="profile-name-text">{user.name}</span>
                </div>
              </div>
              <div className="profile-username">{formatUsernameDisplay(user.username)}</div>
              <div className="profile-bio">{user.bio}</div>
            </div>
          </div>

          <div className="profile-page-stats">
            <div className="profile-page-stat">
              <span className="profile-page-stat-value">0</span>
              <span className="profile-page-stat-label">{t('profilePage.stats.posts')}</span>
            </div>
            <button
              type="button"
              className="profile-page-stat profile-page-stat--clickable"
              onClick={() => openStats('followers')}
            >
              <span className="profile-page-stat-value">{followersPeople.length}</span>
              <span className="profile-page-stat-label">{t('profilePage.stats.followers')}</span>
            </button>
            <button
              type="button"
              className="profile-page-stat profile-page-stat--clickable"
              onClick={() => openStats('following')}
            >
              <span className="profile-page-stat-value">{followedPeople.length}</span>
              <span className="profile-page-stat-label">{t('profilePage.stats.following')}</span>
            </button>
          </div>

          <div className="profile-page-visitor-actions">
            <FollowingButton
              artistId={user.id}
              entityType="user"
              onSubscribeChange={handleVisitorSubscribe}
            />
            <button type="button" className="profile-page-visitor-message">
              <i className="fa-solid fa-message" aria-hidden="true" />
              Xabar
            </button>
          </div>

          <div className="profile-page-repost">
            <RepostFilter activeFilter={repostFilter} onChange={setRepostFilter} />
            {filteredRepostItems.length === 0 ? (
              <PublicRepostEmpty />
            ) : repostFilter === 'all' ? (
              <div className="profile-page-repost-by-type">
                {repostSectionsAll.map((section) => (
                  <div key={section.key} className="profile-page-repost-section">
                    <h3 className="profile-page-repost-section-title">{t(section.titleKey)}</h3>
                    <div className={repostGridClass(section.key)}>
                      {section.items.map((item) => renderRepostCard(item))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={repostGridClass(repostFilter)}>{filteredRepostItems.map((item) => renderRepostCard(item))}</div>
            )}
          </div>
        </div>
      </div>

      <GlobalModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        title={
          statsModalType === 'followers'
            ? t('profilePage.followModal.followersTitle')
            : t('profilePage.followModal.followingTitle')
        }
      >
        <div className="profile-following-modal">
          {modalPeople.length === 0 ? (
            <div className="profile-following-empty">
              {statsModalType === 'followers'
                ? t('profilePage.followModal.followersEmpty')
                : t('profilePage.followModal.followingEmpty')}
            </div>
          ) : (
            modalPeople.map((person) => (
              <div
                key={person.id}
                className="profile-following-item"
                role="button"
                tabIndex={0}
                onClick={() => openFollowingItem(person)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openFollowingItem(person);
                  }
                }}
              >
                {person.image ? (
                  <img src={person.image} alt={person.name} className="profile-following-avatar" />
                ) : (
                  <span className="profile-following-avatar profile-following-avatar--fallback" aria-hidden="true">
                    {(person.name || '?').charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="profile-following-main">
                  <div className="profile-following-name">
                    <span className="profile-following-name-text">{person.name}</span>
                    {person.entityType !== 'user' && (
                      <img
                        src={person.entityType === 'actor' ? '/img/galichka2.png' : '/img/galichka.png'}
                        alt=""
                        className="profile-following-name-verified"
                        aria-hidden
                      />
                    )}
                  </div>
                  <div className="profile-following-type">{person.type}</div>
                </div>
                {isOwnUserFollow(person, profile?.id) ? null : (
                  <FollowingButton
                    artistId={person.followId}
                    entityType={followButtonType(person.entityType)}
                    wrapperClassName="profile-following-action"
                    stopPropagation
                  />
                )}
              </div>
            ))
          )}
        </div>
      </GlobalModal>
    </div>
  );
};

export default PublicProfilePage;
