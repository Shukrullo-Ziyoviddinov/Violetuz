import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ProfileEditModal from '../components/Profile/ProfileEditModal';
import LoaderSkeleton from '../components/LoaderSkeleton/LoaderSkeleton';
import { useLoading } from '../context/LoadingContext';
import { useAuth } from '../context/AuthContext';
import ProfileLanguageModal from '../components/Profile/ProfileLanguageModal';
import ProfileContactModal from '../components/Profile/ProfileContactModal';
import ProfileSocialModal from '../components/Profile/ProfileSocialModal';
import { APP_STORE_LINKS } from '../data/socialLinks';
import './ProfilePage.css';

const PROFILE_STORAGE_KEY = 'violet_profile';

const DEFAULT_PROFILE = { name: 'Shukrullo', username: 'Aliyov', bio: '', avatar: null };

/** @siz saqlanadi; ko‘rinishda @ qo‘shiladi */
const normalizeUsername = (raw) => (raw ?? '').trim().replace(/^@+/, '').trim();

const formatUsernameDisplay = (raw) => {
  const u = normalizeUsername(raw);
  return u ? `@${u}` : '';
};

const getStoredProfile = () => {
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const usernameRaw = parsed.username ?? parsed.surname ?? '';
      const username =
        normalizeUsername(usernameRaw) || normalizeUsername(DEFAULT_PROFILE.username) || DEFAULT_PROFILE.username;
      const bio = (parsed.bio ?? parsed.phone ?? '').trim() || DEFAULT_PROFILE.bio;
      return {
        name: parsed.name?.trim() || DEFAULT_PROFILE.name,
        username,
        bio,
        avatar: parsed.avatar ?? null,
      };
    }
  } catch (e) {}
  return { ...DEFAULT_PROFILE };
};

const getCurrentLanguage = () => {
  const lang = (typeof window !== 'undefined' && localStorage.getItem('i18nextLng')) || 'uz';
  const code = typeof lang === 'string' ? lang.toLowerCase().split('-')[0] : 'uz';
  return code === 'uz' || code === 'ru' ? code : 'uz';
};

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { profileLoading, setLoading } = useLoading();
  const { setLoggedIn } = useAuth();
  const [profile, setProfile] = useState(getStoredProfile);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage);

  useEffect(() => {
    setCurrentLanguage(getCurrentLanguage());
  }, [i18n.language]);

  useEffect(() => {
    if (localStorage.getItem(PROFILE_STORAGE_KEY)) setLoggedIn(true);
  }, [setLoggedIn]);

  useEffect(() => {
    setLoading('profile', true);
    const timer = setTimeout(() => setLoading('profile', false), 500);
    return () => clearTimeout(timer);
  }, [setLoading]);

  const handleSaveProfile = (data) => {
    const newProfile = {
      name: data.name?.trim() || profile.name,
      username: normalizeUsername(data.username),
      bio: (data.bio ?? '').trim(),
      avatar: data.avatar !== undefined ? data.avatar : profile.avatar,
    };
    setProfile(newProfile);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
    setLoggedIn(true);
    setShowEditModal(false);
  };

  const handleLanguageChange = (langCode) => {
    if (langCode === 'uz' || langCode === 'ru') {
      i18n.changeLanguage(langCode);
      localStorage.setItem('i18nextLng', langCode);
      setCurrentLanguage(langCode);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <div
          className="profile-page-bg"
          style={{ backgroundImage: `url(/img/profilfoto.jpg)` }}
        />
        <div className="profile-page-content">
          <div className="profile-page-top">
            {profileLoading ? (
              <LoaderSkeleton variant="profile-top" className="profile-page-top-skeleton" />
            ) : (
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
            )}
          </div>

          {profileLoading ? (
            <LoaderSkeleton variant="wishlist-block" className="profile-wishlist-block profile-wishlist-block-skeleton" />
          ) : (
          <>
          <button
            className="profile-wishlist-block"
            onClick={() => navigate('/wishlist')}
          >
            <div className="profile-wishlist-left">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>{t('navbar.favorites')}</span>
            </div>
            <svg className="profile-wishlist-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <button
            className="profile-wishlist-block"
            onClick={() => setShowLangModal(true)}
          >
            <div className="profile-wishlist-left">
              <img
                src={currentLanguage === 'uz' ? '/img/uzb-by.jpg' : '/img/rubay.png'}
                alt=""
                className="profile-wishlist-flag"
              />
              <span>{t('profile.appLanguage')}</span>
            </div>
            <svg className="profile-wishlist-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Violet Market - API joyi: backend yozilganda shu blok orqali Violet Market API ulanishi kerak */}
          <button
            className="profile-wishlist-block"
            type="button"
            onClick={() => {}}
          >
            <div className="profile-wishlist-left">
              <div className="profile-violet-market-logo">
                <img
                  src="/img/photo_2026-02-16_20-30-31_preview_rev_1.png"
                  alt="Violet Market"
                  className="profile-violet-market-logo-img"
                />
              </div>
              <span>{t('profile.violetMarket')}</span>
            </div>
            <svg className="profile-wishlist-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <button
            className="profile-wishlist-block"
            onClick={() => setShowContactModal(true)}
          >
            <div className="profile-wishlist-left">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>{t('profile.contactUs')}</span>
            </div>
            <svg className="profile-wishlist-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <button
            className="profile-wishlist-block"
            onClick={() => setShowSocialModal(true)}
          >
            <div className="profile-wishlist-left">
              <svg
                className="profile-wishlist-icon"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>{t('profile.socialNetworks')}</span>
            </div>
            <svg className="profile-wishlist-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          </>
          )}
          <div className="profile-app-stores">
            {profileLoading ? (
              <>
                <LoaderSkeleton variant="app-store-img" className="profile-app-store-skeleton" width={140} height={44} />
                <LoaderSkeleton variant="app-store-img" className="profile-app-store-skeleton" width={140} height={44} />
              </>
            ) : (
            <>
            <a
              href={APP_STORE_LINKS.android.link}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-app-store-link"
            >
              <img src={APP_STORE_LINKS.android.icon} alt="Google Play" className="profile-app-store-img" />
            </a>
            <a
              href={APP_STORE_LINKS.ios.link}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-app-store-link"
            >
              <img src={APP_STORE_LINKS.ios.icon} alt="App Store" className="profile-app-store-img" />
            </a>
            </>
            )}
          </div>
        </div>
      </div>

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
        />
      )}

      {showContactModal && (
        <ProfileContactModal onClose={() => setShowContactModal(false)} />
      )}

      {showSocialModal && (
        <ProfileSocialModal onClose={() => setShowSocialModal(false)} />
      )}
    </div>
  );
};

export default ProfilePage;
