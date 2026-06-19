import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { APP_STORE_LINKS } from '../../data/socialLinks';
import './ProfileInfoModal.css';

const ProfileInfoModal = ({
  onClose,
  currentLanguage,
  onWishlist,
  onAppLanguage,
  onVioletMarket,
  onContact,
  onSocial,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (window.innerWidth <= 768) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      <div className="profile-info-overlay" onClick={onClose} />
      <div
        className="profile-info-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-info-modal-title"
      >
        <div className="profile-info-modal-header">
          <button
            type="button"
            className="profile-info-back"
            onClick={onClose}
            aria-label={t('profile.settingsBack')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2 id="profile-info-modal-title" className="profile-info-modal-title">
            {t('profile.settingsAndActivity')}
          </h2>
          <span className="profile-info-header-spacer" aria-hidden="true" />
        </div>

        <div className="profile-info-modal-body">
              <button type="button" className="profile-wishlist-block profile-info-action" onClick={onWishlist}>
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

              <button type="button" className="profile-wishlist-block profile-info-action" onClick={onAppLanguage}>
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

              <button type="button" className="profile-wishlist-block profile-info-action" onClick={onVioletMarket}>
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

              <button type="button" className="profile-wishlist-block profile-info-action" onClick={onContact}>
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

              <button type="button" className="profile-wishlist-block profile-info-action" onClick={onSocial}>
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

          <div className="profile-app-stores profile-info-app-stores">
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
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileInfoModal;
