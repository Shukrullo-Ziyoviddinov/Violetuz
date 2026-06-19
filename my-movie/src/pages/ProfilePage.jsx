import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ProfileEditModal from '../components/Profile/ProfileEditModal';
import { useAuth } from '../context/AuthContext';
import ProfileLanguageModal from '../components/Profile/ProfileLanguageModal';
import ProfileContactModal from '../components/Profile/ProfileContactModal';
import ProfileSocialModal from '../components/Profile/ProfileSocialModal';
import ProfileInfoModal from '../components/Profile/ProfileInfoModal';
import GlobalModal from '../components/GlobalModal/GlobalModal';
import FollowingButton from '../Music/FollowingButton/FollowingButton';
import { useFollowingIds } from '../context/FollowingContext';
import { getFollowedPeople } from '../store/slices/followingUtils';
import { useRepostItems } from '../context/RepostsContext';
import { normalizeRepostType, repostMatchesFilter } from '../components/Repost/repostTypes';
import RepostFilter from '../components/Repost/RepostFilter';
import RepostMovieCard from '../components/Repost/RepostMovieCard';
import RepostMusicCard from '../components/Repost/RepostMusicCard';
import RepostVideoCard from '../components/Repost/RepostVideoCard';
import RepostShortsCard from '../components/Repost/RepostShortsCard';
import ComentariaHistory from '../components/ComentariaHistory/ComentariaHistory';
import { setProfileInfoMenuHandler, clearProfileInfoMenuHandler } from '../profileInfoMenuBridge';
import { normalizeUsername } from '../store/slices/userUtils';
import './ProfilePage.css';

const formatUsernameDisplay = (raw) => {
  const u = normalizeUsername(raw);
  return u ? `@${u}` : '';
};

const getCurrentLanguage = () => {
  const lang = (typeof window !== 'undefined' && localStorage.getItem('i18nextLng')) || 'uz';
  const code = typeof lang === 'string' ? lang.toLowerCase().split('-')[0] : 'uz';
  return code === 'uz' || code === 'ru' ? code : 'uz';
};

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [statsModalType, setStatsModalType] = useState('following');
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage);
  const followingIds = useFollowingIds();
  const repostItems = useRepostItems();
  const [repostFilter, setRepostFilter] = useState('all');

  useEffect(() => {
    setCurrentLanguage(getCurrentLanguage());
  }, [i18n.language]);

  useEffect(() => {
    const open = () => setShowInfoModal(true);
    setProfileInfoMenuHandler(open);
    return () => clearProfileInfoMenuHandler(open);
  }, []);

  const followedPeople = getFollowedPeople(followingIds, currentLanguage);
  const followersPeople = [];

  /** Kino + musiqa shortslari profil tartibida (scroll ikkalasini ham o‘z ichiga oladi) */
  const shortsRepostScope = useMemo(
    () =>
      repostItems
        .map((it) => ({ ...it, type: normalizeRepostType(it?.type) }))
        .filter((it) => it.type === 'movieShorts' || it.type === 'musicshorts')
        .map((it) => ({ type: it.type, id: it.id })),
    [repostItems]
  );

  const filteredRepostItems = repostItems.filter((item) => {
    const t = normalizeRepostType(item?.type);
    if (!t) return false;
    return repostMatchesFilter(t, repostFilter);
  });

  const repostSectionsAll = useMemo(() => {
    if (repostFilter !== 'all') return [];
    const groups = {
      movie: [],
      music: [],
      klip: [],
      konsert: [],
      shorts: [],
    };
    for (const item of repostItems) {
      const t = normalizeRepostType(item?.type);
      if (!t) continue;
      if (t === 'movie') groups.movie.push(item);
      else if (t === 'music') groups.music.push(item);
      else if (t === 'klip') groups.klip.push(item);
      else if (t === 'konsert') groups.konsert.push(item);
      else if (t === 'movieShorts' || t === 'musicshorts') groups.shorts.push(item);
    }
    return [
      { key: 'movie', titleKey: 'profilePage.repostFilters.movie', items: groups.movie },
      { key: 'shorts', titleKey: 'profilePage.repostFilters.shorts', items: groups.shorts },
      { key: 'klip', titleKey: 'profilePage.repostFilters.klip', items: groups.klip },
      { key: 'konsert', titleKey: 'profilePage.repostFilters.konsert', items: groups.konsert },
      { key: 'music', titleKey: 'profilePage.repostFilters.music', items: groups.music },
    ].filter((s) => s.items.length > 0);
  }, [repostFilter, repostItems]);

  const repostGridClassForSection = (sectionKey) => {
    if (sectionKey === 'music') return 'profile-page-repost-grid profile-page-repost-grid--music';
    if (sectionKey === 'klip' || sectionKey === 'konsert') {
      return 'profile-page-repost-grid profile-page-repost-grid--media';
    }
    return 'profile-page-repost-grid';
  };

  const renderRepostCard = (item) => {
    const t = normalizeRepostType(item?.type);
    const key = `${t ?? 'unknown'}-${item.id}`;
    if (!t) return null;
    if (t === 'movie') return <RepostMovieCard key={key} item={item} />;
    if (t === 'music') return <RepostMusicCard key={key} item={item} />;
    if (t === 'klip' || t === 'konsert') return <RepostVideoCard key={key} item={item} />;
    if (t === 'movieShorts' || t === 'musicshorts') {
      const scopeIndex = shortsRepostScope.findIndex(
        (e) => e.type === t && String(e.id) === String(item.id)
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

  const handleSaveProfile = (data) => {
    updateProfile({
      name: data.name,
      username: data.username,
      bio: data.bio,
      avatar: data.avatar,
    });
    setShowEditModal(false);
  };

  const handleLanguageChange = (langCode) => {
    if (langCode === 'uz' || langCode === 'ru') {
      i18n.changeLanguage(langCode);
      localStorage.setItem('i18nextLng', langCode);
      setCurrentLanguage(langCode);
    }
  };

  const handleFollowingItemOpen = (person) => {
    if (!person) return;
    if (person.entityType === 'actor') {
      navigate(`/actor/${person.followId}`);
    } else {
      navigate(`/music/artist/${person.followId}`);
    }
    setShowFollowingModal(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <div
          className="profile-page-bg"
          style={{ backgroundImage: `url(/img/profilfoto.jpg)` }}
        />
        <button
          type="button"
          className="profile-page-menu-btn"
          onClick={() => setShowInfoModal(true)}
          aria-label={t('profile.settingsAndActivity')}
        >
          <span className="profile-page-menu-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
        <div className="profile-page-content">
          <div className="profile-page-top-card">
            <div className="profile-page-top">
              <>
              <div className="profile-avatar-wrap" aria-hidden="true">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="" className="profile-avatar-img" />
                ) : (
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
                )}
              </div>
              <div className="profile-info">
                <div className="profile-name">{profile.name}</div>
                <div className="profile-username">{formatUsernameDisplay(profile.username)}</div>
                <div className="profile-bio">{profile.bio}</div>
              </div>
              <button
                className="profile-edit-btn"
                onClick={() => setShowEditModal(true)}
                aria-label={t('profile.edit')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              </>
            </div>
            <div className="profile-page-stats">
                <div className="profile-page-stat">
                  <span className="profile-page-stat-value">0</span>
                  <span className="profile-page-stat-label">{t('profilePage.stats.posts')}</span>
                </div>
                <button
                  type="button"
                  className="profile-page-stat profile-page-stat--clickable"
                  onClick={() => {
                    setStatsModalType('followers');
                    setShowFollowingModal(true);
                  }}
                >
                  <span className="profile-page-stat-value">0</span>
                  <span className="profile-page-stat-label">{t('profilePage.stats.followers')}</span>
                </button>
                <button
                  type="button"
                  className="profile-page-stat profile-page-stat--clickable"
                  onClick={() => {
                    setStatsModalType('following');
                    setShowFollowingModal(true);
                  }}
                >
                  <span className="profile-page-stat-value">{followedPeople.length}</span>
                  <span className="profile-page-stat-label">{t('profilePage.stats.following')}</span>
                </button>
              </div>
            <div className="profile-page-quick-links">
                <button
                  type="button"
                  className="profile-page-likes-link"
                  onClick={() => navigate('/like-history')}
                  aria-label={t('profilePage.quickLinks.likes')}
                >
                  <span className="profile-page-likes-icon-wrap" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </span>
                  <span className="profile-page-likes-label">{t('profilePage.quickLinks.likes')}</span>
                </button>

                <button
                  type="button"
                  className="profile-page-likes-link"
                  onClick={() => navigate('/wishlist')}
                  aria-label={t('profilePage.quickLinks.favorites')}
                >
                  <span className="profile-page-wishlist-icon-wrap" aria-hidden="true">
                    <i className="fa-solid fa-bookmark" />
                  </span>
                  <span className="profile-page-likes-label">{t('profilePage.quickLinks.favorites')}</span>
                </button>

                <button
                  type="button"
                  className="profile-page-likes-link"
                  onClick={() => navigate('/rating-page')}
                  aria-label={t('profilePage.quickLinks.rating')}
                >
                  <span className="profile-page-rating-icon-wrap" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 5.82 21.02 7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </span>
                  <span className="profile-page-likes-label">{t('profilePage.quickLinks.rating')}</span>
                </button>

                <ComentariaHistory />
              </div>
            <div className="profile-page-repost">
                <div className="profile-page-repost-title-wrap">
                  <i className="fa-solid fa-repeat" aria-hidden="true" />
                  <span className="profile-page-repost-title">{t('profilePage.repostTitle')}</span>
                </div>
                <RepostFilter activeFilter={repostFilter} onChange={setRepostFilter} />
                {filteredRepostItems.length === 0 ? (
                  <div className="profile-page-repost-empty">
                    <img
                      src="/img/wishlist_preview_rev_1.png"
                      alt=""
                      className="profile-page-repost-empty-img"
                      loading="lazy"
                    />
                    <p className="profile-page-repost-empty-text">Hozircha repostlar yo‘q</p>
                    <div className="profile-page-repost-empty-actions">
                      <button
                        type="button"
                        className="profile-page-repost-empty-btn profile-page-repost-empty-btn--movie"
                        onClick={() => navigate('/')}
                      >
                        Kino
                      </button>
                      <button
                        type="button"
                        className="profile-page-repost-empty-btn profile-page-repost-empty-btn--music"
                        onClick={() => navigate('/music')}
                      >
                        Musiqa
                      </button>
                    </div>
                  </div>
                ) : repostFilter === 'all' ? (
                  repostSectionsAll.length > 0 ? (
                    <div className="profile-page-repost-by-type">
                      {repostSectionsAll.map((section) => (
                        <div key={section.key} className="profile-page-repost-section">
                          <h3 className="profile-page-repost-section-title">{t(section.titleKey)}</h3>
                          <div className={repostGridClassForSection(section.key)}>
                            {section.items.map((item) => renderRepostCard(item))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="profile-page-repost-grid">{filteredRepostItems.map((item) => renderRepostCard(item))}</div>
                  )
                ) : (
                  <div
                    className={`profile-page-repost-grid ${
                      repostFilter === 'klip' || repostFilter === 'konsert'
                        ? 'profile-page-repost-grid--media'
                        : repostFilter === 'music'
                          ? 'profile-page-repost-grid--music'
                          : ''
                    }`}
                  >
                    {filteredRepostItems.map((item) => renderRepostCard(item))}
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>

      {showInfoModal && (
        <ProfileInfoModal
          onClose={() => setShowInfoModal(false)}
          currentLanguage={currentLanguage}
          onWishlist={() => {
            setShowInfoModal(false);
            navigate('/wishlist');
          }}
          onAppLanguage={() => setShowLangModal(true)}
          onVioletMarket={() => {}}
          onContact={() => setShowContactModal(true)}
          onSocial={() => setShowSocialModal(true)}
        />
      )}

      {showEditModal && (
        <ProfileEditModal
          profile={profile}
          onSave={handleSaveProfile}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showLangModal && (
        <ProfileLanguageModal
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          onClose={() => setShowLangModal(false)}
          skipBodyScrollRestore={showInfoModal}
        />
      )}

      {showContactModal && (
        <ProfileContactModal
          onClose={() => setShowContactModal(false)}
          skipBodyScrollRestore={showInfoModal}
        />
      )}

      {showSocialModal && (
        <ProfileSocialModal
          onClose={() => setShowSocialModal(false)}
          skipBodyScrollRestore={showInfoModal}
        />
      )}

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
          {(statsModalType === 'followers' ? followersPeople : followedPeople).length === 0 ? (
            <div className="profile-following-empty">
              {statsModalType === 'followers'
                ? t('profilePage.followModal.followersEmpty')
                : t('profilePage.followModal.followingEmpty')}
            </div>
          ) : (
            (statsModalType === 'followers' ? followersPeople : followedPeople).map((person) => (
              <div
                key={person.id}
                className="profile-following-item"
                role="button"
                tabIndex={0}
                onClick={() => handleFollowingItemOpen(person)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleFollowingItemOpen(person);
                  }
                }}
              >
                <img src={person.image} alt={person.name} className="profile-following-avatar" />
                <div className="profile-following-main">
                  <div className="profile-following-name">
                    <span className="profile-following-name-text">{person.name}</span>
                    <img
                      src={person.entityType === 'actor' ? '/img/galichka2.png' : '/img/galichka.png'}
                      alt=""
                      className="profile-following-name-verified"
                      aria-hidden
                    />
                  </div>
                  <div className="profile-following-type">{person.type}</div>
                </div>
                <FollowingButton
                  artistId={person.followId}
                  wrapperClassName="profile-following-action"
                  stopPropagation
                />
              </div>
            ))
          )}
        </div>
      </GlobalModal>
    </div>
  );
};

export default ProfilePage;
