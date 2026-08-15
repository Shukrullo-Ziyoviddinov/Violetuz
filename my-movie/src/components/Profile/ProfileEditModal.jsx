import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { checkUsernameAvailable, updateProfileRequest } from '../../api/authApi';
import { uploadFileDirectToR2, deleteUpload } from '../../api/uploadsApi';
import './ProfileEditModal.css';

const normalizeUsername = (raw) => (raw ?? '').trim().replace(/^@+/, '').trim();
const USERNAME_RE = /^[a-zA-Z0-9_.]{3,30}$/;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const BIO_MAX_CHARS = 65;
const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/gif';
const AVATAR_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]);

const isHttpUrl = (value) =>
  typeof value === 'string' &&
  (value.startsWith('http://') || value.startsWith('https://'));

const CLOSE_MS = 340;

const isMobileViewport = () =>
  typeof window !== 'undefined' && window.innerWidth <= 768;

const ProfileEditModal = ({ profile, onSave, onClose }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(profile.name || '');
  const [username, setUsername] = useState(normalizeUsername(profile.username));
  const [bio, setBio] = useState(profile.bio || '');
  const [avatar, setAvatar] = useState(profile.avatar || null);
  const [dragY, setDragY] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(() => !isMobileViewport());
  const [exiting, setExiting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  /** idle | same | checking | available | taken | invalid */
  const [usernameStatus, setUsernameStatus] = useState('same');
  const [usernameMessage, setUsernameMessage] = useState('');
  const startYRef = useRef(0);
  const dragYRef = useRef(0);
  const closeTimerRef = useRef(null);
  const avatarInputRef = useRef(null);
  const usernameTimerRef = useRef(null);
  const usernameReqIdRef = useRef(0);
  const pendingFileRef = useRef(null);
  const previewUrlRef = useRef(null);
  const initialAvatarRef = useRef(profile.avatar || null);
  const avatarRemovedRef = useRef(false);
  const originalUsername = normalizeUsername(profile.username).toLowerCase();

  const isNameInvalid = !name.trim() || name.trim().length < 2;
  const usernameOk = usernameStatus === 'same' || usernameStatus === 'available';
  const isFormValid = !isNameInvalid && usernameOk && !busy;
  const bioRemaining = BIO_MAX_CHARS - bio.length;

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    setName(profile.name || '');
    setUsername(normalizeUsername(profile.username));
    setBio(profile.bio || '');
    revokePreviewUrl();
    pendingFileRef.current = null;
    avatarRemovedRef.current = false;
    initialAvatarRef.current = profile.avatar || null;
    setAvatar(profile.avatar || null);
    setUsernameStatus('same');
    setUsernameMessage('');
    setError('');
  }, [profile, revokePreviewUrl]);

  useEffect(() => {
    const isMobile = isMobileViewport();
    if (isMobile) {
      document.body.style.overflow = 'hidden';
      const id = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setSheetOpen(true));
      });
      return () => {
        window.cancelAnimationFrame(id);
        document.body.style.overflow = '';
        revokePreviewUrl();
      };
    }
    setSheetOpen(true);
    return () => {
      revokePreviewUrl();
    };
  }, [revokePreviewUrl]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    },
    []
  );

  const requestClose = useCallback(() => {
    if (exiting) return;
    if (!isMobileViewport()) {
      onClose?.();
      return;
    }
    setExiting(true);
    setSheetOpen(false);
    setDragY(0);
    dragYRef.current = 0;
    closeTimerRef.current = window.setTimeout(() => {
      onClose?.();
    }, CLOSE_MS);
  }, [exiting, onClose]);

  const runUsernameCheck = useCallback(
    async (value) => {
      const clean = normalizeUsername(value);
      if (!clean) {
        setUsernameStatus('idle');
        setUsernameMessage('');
        return;
      }
      if (clean.toLowerCase() === originalUsername) {
        setUsernameStatus('same');
        setUsernameMessage('');
        return;
      }
      if (clean.includes('-')) {
        setUsernameStatus('invalid');
        setUsernameMessage('- belgi mumkun emas');
        return;
      }
      if (!USERNAME_RE.test(clean)) {
        setUsernameStatus('invalid');
        setUsernameMessage('3–30 belgi: harf, raqam, _ yoki .');
        return;
      }

      const reqId = ++usernameReqIdRef.current;
      setUsernameStatus('checking');
      setUsernameMessage('');

      try {
        const data = await checkUsernameAvailable(clean, { excludeSelf: true });
        if (reqId !== usernameReqIdRef.current) return;
        if (data?.available) {
          setUsernameStatus('available');
          setUsernameMessage("Username bo'sh");
        } else {
          setUsernameStatus('taken');
          setUsernameMessage('Bu username band.');
        }
      } catch (err) {
        if (reqId !== usernameReqIdRef.current) return;
        setUsernameStatus('invalid');
        setUsernameMessage(err.message || 'Tekshirib bo‘lmadi');
      }
    },
    [originalUsername]
  );

  useEffect(() => {
    if (usernameTimerRef.current) window.clearTimeout(usernameTimerRef.current);

    const clean = normalizeUsername(username);
    if (!clean) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return undefined;
    }
    if (clean.toLowerCase() === originalUsername) {
      setUsernameStatus('same');
      setUsernameMessage('');
      return undefined;
    }

    setUsernameStatus('checking');
    setUsernameMessage('');
    usernameTimerRef.current = window.setTimeout(() => {
      runUsernameCheck(username);
    }, 350);

    return () => {
      if (usernameTimerRef.current) window.clearTimeout(usernameTimerRef.current);
    };
  }, [username, originalUsername, runUsernameCheck]);

  const handleTouchStart = (e) => {
    if (exiting) return;
    startYRef.current = e.touches[0].clientY;
    dragYRef.current = 0;
  };

  const handleTouchMove = (e) => {
    if (exiting || !isMobileViewport()) return;
    const y = e.touches[0].clientY;
    const diff = y - startYRef.current;
    if (diff > 0) {
      dragYRef.current = diff;
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (exiting) return;
    if (dragYRef.current > 80) {
      requestClose();
      return;
    }
    dragYRef.current = 0;
    setDragY(0);
  };

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!AVATAR_MIME.has(file.type)) {
      setError('Faqat JPEG, PNG, WebP, AVIF yoki GIF');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      window.alert(t('profile.avatarTooLarge'));
      return;
    }

    revokePreviewUrl();
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    pendingFileRef.current = file;
    avatarRemovedRef.current = false;
    setAvatar(previewUrl);
    setError('');
  };

  const handleRemoveAvatar = () => {
    revokePreviewUrl();
    pendingFileRef.current = null;
    avatarRemovedRef.current = true;
    setAvatar(null);
  };

  const maybeDeleteOldAvatar = async (oldUrl) => {
    if (!isHttpUrl(oldUrl)) return;
    try {
      await deleteUpload({ url: oldUrl });
    } catch {
      /* eski fayl o‘chmasa ham yangi avatar saqlanishi kerak */
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || busy || exiting) return;
    setError('');
    setBusy(true);

    const previousAvatar = initialAvatarRef.current;
    let nextAvatar = previousAvatar || '';

    try {
      if (pendingFileRef.current) {
        const { publicUrl } = await uploadFileDirectToR2({
          folder: 'avatars',
          file: pendingFileRef.current,
        });
        nextAvatar = publicUrl;
        if (previousAvatar && previousAvatar !== publicUrl) {
          await maybeDeleteOldAvatar(previousAvatar);
        }
      } else if (avatarRemovedRef.current) {
        nextAvatar = '';
        if (previousAvatar) {
          await maybeDeleteOldAvatar(previousAvatar);
        }
      }

      const payload = {
        name: name.trim(),
        username: normalizeUsername(username),
        bio,
      };

      if (pendingFileRef.current || avatarRemovedRef.current) {
        payload.avatar = nextAvatar;
      }

      const data = await updateProfileRequest(payload);
      const savedUser = data?.user || null;
      const savedAvatar =
        savedUser?.avatar !== undefined ? savedUser.avatar || null : nextAvatar || null;

      if (
        (pendingFileRef.current || avatarRemovedRef.current) &&
        savedAvatar &&
        !/^https?:\/\//i.test(savedAvatar)
      ) {
        throw new Error('Avatar URL saqlanmadi — qayta urinib ko‘ring');
      }

      revokePreviewUrl();
      pendingFileRef.current = null;
      avatarRemovedRef.current = false;

      /* To‘liq sessiya sync — register avatar bilan bir xil */
      if (savedUser) {
        onSave({
          user: { ...savedUser, avatar: savedAvatar },
        });
      } else {
        onSave({
          name: name.trim(),
          username: normalizeUsername(username),
          bio,
          avatar: savedAvatar,
        });
      }
      requestClose();
    } catch (err) {
      setError(err.message || 'Saqlab bo‘lmadi');
      if (err.field === 'username') {
        setUsernameStatus('taken');
        setUsernameMessage('Bu username band.');
      }
    } finally {
      setBusy(false);
    }
  };

  const usernameInputClass = [
    'profile-edit-input',
    'profile-edit-input--with-icon',
    usernameStatus === 'taken' || usernameStatus === 'invalid'
      ? 'profile-edit-input-invalid'
      : '',
    usernameStatus === 'available' ? 'profile-edit-input--ok' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const overlayClass = [
    'profile-edit-overlay',
    sheetOpen ? 'profile-edit-overlay--open' : '',
    exiting ? 'profile-edit-overlay--closing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const modalClass = [
    'profile-edit-modal',
    sheetOpen ? 'profile-edit-modal--open' : '',
    dragY > 0 && !exiting ? 'profile-edit-modal--dragging' : '',
    exiting ? 'profile-edit-modal--closing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div className={overlayClass} onClick={requestClose} aria-hidden="true" />
      <div
        className={modalClass}
        style={{ '--drag-y': `${dragY}px` }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="profile-edit-sheet-top"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="profile-edit-drag-handle" aria-hidden="true" />
          <div className="profile-edit-header">
            <h3 className="profile-edit-title">{t('profile.editProfile')}</h3>
            <button
              type="button"
              className="profile-edit-close profile-edit-close-desktop"
              onClick={requestClose}
              aria-label={t('detail.close')}
            >
              ×
            </button>
          </div>
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
                  accept={AVATAR_ACCEPT}
                  className="profile-edit-avatar-input"
                  aria-labelledby="profile-avatar-heading"
                  onChange={handleAvatarFile}
                />
                <div className="profile-edit-avatar-btn-row">
                  <button
                    type="button"
                    className="profile-edit-avatar-btn"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={busy}
                  >
                    {t('profile.uploadPhoto')}
                  </button>
                  {avatar ? (
                    <button
                      type="button"
                      className="profile-edit-avatar-remove"
                      onClick={handleRemoveAvatar}
                      disabled={busy}
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
            <div className="profile-edit-input-wrap">
              <input
                id="profile-username"
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.replace(/^@+/, '').replace(/\s/g, ''))
                }
                placeholder={t('profile.usernamePlaceholder')}
                className={usernameInputClass}
                autoComplete="username"
              />
              <span className="profile-edit-input-trailing" aria-hidden="true">
                {usernameStatus === 'checking' ? (
                  <span className="profile-edit-username-loader" />
                ) : null}
                {usernameStatus === 'available' ? (
                  <svg className="profile-edit-username-ok" viewBox="0 0 24 24" width="18" height="18">
                    <path
                      fill="currentColor"
                      d="M9.55 18l-5.7-5.7 1.4-1.45 4.3 4.3L18.7 6.4l1.4 1.4z"
                    />
                  </svg>
                ) : null}
                {usernameStatus === 'taken' || usernameStatus === 'invalid' ? (
                  <svg className="profile-edit-username-bad" viewBox="0 0 24 24" width="18" height="18">
                    <path
                      fill="currentColor"
                      d="M18.3 5.71L12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71 2.89 18.3 9.18 12 2.89 5.71 4.3 4.29l6.29 6.3 6.29-6.3z"
                    />
                  </svg>
                ) : null}
              </span>
            </div>
            {usernameMessage ? (
              <p
                className={
                  usernameStatus === 'available'
                    ? 'profile-edit-field-ok'
                    : 'profile-edit-field-error'
                }
              >
                {usernameMessage}
              </p>
            ) : null}
          </div>
          <div className="profile-edit-field">
            <label htmlFor="profile-bio">{t('profile.bio')}</label>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_CHARS))}
              placeholder={t('profile.bioPlaceholder')}
              className="profile-edit-input profile-edit-textarea"
              rows={3}
              maxLength={BIO_MAX_CHARS}
            />
            <p
              className={`profile-edit-bio-counter${
                bioRemaining === 0 ? ' profile-edit-bio-counter--limit' : ''
              }`}
            >
              {bioRemaining}
            </p>
          </div>
          {error ? <p className="profile-edit-error">{error}</p> : null}
          <button
            type="submit"
            className="profile-edit-save"
            disabled={!isFormValid || busy || exiting}
          >
            {busy ? '...' : t('profile.save')}
          </button>
        </form>
      </div>
    </>
  );
};

export default ProfileEditModal;
