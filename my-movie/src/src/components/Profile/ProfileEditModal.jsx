import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './ProfileEditModal.css';

const normalizeUsername = (raw) => (raw ?? '').trim().replace(/^@+/, '').trim();

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const ProfileEditModal = ({ profile, onSave, onClose }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(profile.name || '');
  const [username, setUsername] = useState(normalizeUsername(profile.username));
  const [bio, setBio] = useState(profile.bio || '');
  const [avatar, setAvatar] = useState(profile.avatar ?? null);
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef(0);
  const avatarInputRef = useRef(null);

  const isNameInvalid = !name.trim();
  const isFormValid = !isNameInvalid;

  useEffect(() => {
    setName(profile.name || '');
    setUsername(normalizeUsername(profile.username));
    setBio(profile.bio || '');
    setAvatar(profile.avatar ?? null);
  }, [profile]);

  useEffect(() => {
    if (window.innerWidth <= 768) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleTouchStart = (e) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (window.innerWidth > 768) return;
    const y = e.touches[0].clientY;
    const diff = y - startYRef.current;
    if (diff > 0) setDragY(diff);
  };

  const handleTouchEnd = () => {
    if (dragY > 80) onClose();
    setDragY(0);
  };

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > MAX_AVATAR_BYTES) {
      window.alert(t('profile.avatarTooLarge'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      setAvatar(typeof result === 'string' ? result : null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    onSave({
      name,
      username: normalizeUsername(username),
      bio,
      avatar,
    });
  };

  return (
    <>
      <div className="profile-edit-overlay" onClick={onClose} />
      <div
        className={`profile-edit-modal ${dragY > 0 ? 'profile-edit-modal-dragging' : ''}`}
        style={{ '--drag-y': `${dragY}px` }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="profile-edit-drag-handle" />
        <div className="profile-edit-header">
          <h3 className="profile-edit-title">{t('profile.editProfile')}</h3>
          <button
            className="profile-edit-close profile-edit-close-desktop"
            onClick={onClose}
            aria-label={t('detail.close')}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="profile-edit-form">
          <div className="profile-edit-field profile-edit-avatar-field">
            <span className="profile-edit-avatar-heading" id="profile-avatar-heading">
              {t('profile.avatarLabel')}
            </span>
            <div className="profile-edit-avatar-row">
              <div className="profile-edit-avatar-preview" aria-hidden="true">
                {avatar ? (
                  <img src={avatar} alt="" className="profile-edit-avatar-img" />
                ) : (
                  <svg
                    className="profile-edit-avatar-placeholder"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                      fill="currentColor"
                    />
                  </svg>
                )}
              </div>
              <div className="profile-edit-avatar-actions">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="profile-edit-avatar-input"
                  aria-labelledby="profile-avatar-heading"
                  onChange={handleAvatarFile}
                />
                <div className="profile-edit-avatar-btn-row">
                  <button
                    type="button"
                    className="profile-edit-avatar-btn"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {t('profile.uploadPhoto')}
                  </button>
                  {avatar ? (
                    <button
                      type="button"
                      className="profile-edit-avatar-remove"
                      onClick={() => setAvatar(null)}
                      aria-label={t('profile.removeAvatar')}
                      title={t('profile.removeAvatar')}
                    >
                      <svg
                        className="profile-edit-avatar-remove-icon"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9 3v1H4v2h1v13a2 2 0 002 2h10a2 2 0 002-2V6h1V4h-5V3H9zm0 5h2v9H9V8zm4 0h2v9h-2V8z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          <div className="profile-edit-field">
            <label htmlFor="profile-name">{t('profile.name')}</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('profile.namePlaceholder')}
              className={`profile-edit-input ${isNameInvalid ? 'profile-edit-input-invalid' : ''}`}
            />
          </div>
          <div className="profile-edit-field">
            <label htmlFor="profile-username">{t('profile.username')}</label>
            <input
              id="profile-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(normalizeUsername(e.target.value))}
              placeholder={t('profile.usernamePlaceholder')}
              className="profile-edit-input"
              autoComplete="username"
            />
          </div>
          <div className="profile-edit-field">
            <label htmlFor="profile-bio">{t('profile.bio')}</label>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('profile.bioPlaceholder')}
              className="profile-edit-input profile-edit-textarea"
              rows={3}
            />
          </div>
          <button
            type="submit"
            className="profile-edit-save"
            disabled={!isFormValid}
          >
            {t('profile.save')}
          </button>
        </form>
      </div>
    </>
  );
};

export default ProfileEditModal;
