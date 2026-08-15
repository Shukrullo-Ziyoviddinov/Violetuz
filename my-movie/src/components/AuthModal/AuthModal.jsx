import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  checkUsernameAvailable,
  loginStart,
  loginVerify,
  loginWithUsername,
  registerStart,
  registerVerify,
  updateProfileRequest,
} from '../../api/authApi';
import { uploadFileDirectToR2 } from '../../api/uploadsApi';
import { markNeedsAvatar, clearNeedsAvatar } from '../../authModalBridge';
import '../Profile/ProfileEditModal.css';
import './AuthModal.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_.]{3,30}$/;
const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/gif';
const AVATAR_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]);

const AuthModal = ({
  mode = 'register',
  step = 'form',
  copyVariant = 'default',
  onModeChange,
  onStepChange,
  onClose,
}) => {
  const { setAuthSession, updateProfile } = useAuth();
  const isAddAccount = copyVariant === 'addAccount' && mode === 'register';
  const [loginMethod, setLoginMethod] = useState('gmail'); // gmail | username
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  /** idle | checking | available | taken | invalid */
  const [usernameStatus, setUsernameStatus] = useState('idle');
  const [usernameMessage, setUsernameMessage] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const usernameTimerRef = useRef(null);
  const usernameReqIdRef = useRef(0);
  const avatarInputRef = useRef(null);
  const pendingFileRef = useRef(null);
  const previewUrlRef = useRef(null);

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  const resetAvatarPick = useCallback(() => {
    revokePreviewUrl();
    pendingFileRef.current = null;
    setAvatarPreview(null);
  }, [revokePreviewUrl]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      revokePreviewUrl();
    };
  }, [revokePreviewUrl]);

  const runUsernameCheck = useCallback(async (value) => {
    const clean = value.trim().replace(/^@+/, '');
    if (!clean) {
      setUsernameStatus('idle');
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
      const data = await checkUsernameAvailable(clean);
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
  }, []);

  useEffect(() => {
    if (mode !== 'register' || step !== 'form') return undefined;
    if (usernameTimerRef.current) window.clearTimeout(usernameTimerRef.current);

    const clean = username.trim();
    if (!clean) {
      setUsernameStatus('idle');
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
  }, [username, mode, step, runUsernameCheck]);

  const switchMode = (next) => {
    onModeChange?.(next);
    setError('');
    setCode('');
    setPassword('');
    setShowPassword(false);
    setLoginMethod('gmail');
    setUsernameStatus('idle');
    setUsernameMessage('');
    resetAvatarPick();
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'register') {
        if (!name.trim() || name.trim().length < 2) {
          throw new Error('Ism yoki tahallus majburiy');
        }
        if (username.includes('-')) {
          throw new Error('- belgi mumkun emas');
        }
        if (!USERNAME_RE.test(username.trim())) {
          throw new Error('Username noto‘g‘ri');
        }
        if (usernameStatus !== 'available') {
          throw new Error(
            usernameStatus === 'taken'
              ? 'Bu username band.'
              : usernameMessage || 'Username tekshirilmagan'
          );
        }
        if (!EMAIL_RE.test(email.trim())) {
          throw new Error('Gmail manzil noto‘g‘ri');
        }
        if (password.length < 6) {
          throw new Error('Parol kamida 6 belgi bo‘lishi kerak');
        }
        await registerStart({
          name: name.trim(),
          username: username.trim(),
          email: email.trim(),
          password,
        });
        onStepChange?.('verify');
        setCode('');
      } else if (loginMethod === 'gmail') {
        if (!EMAIL_RE.test(email.trim())) {
          throw new Error('Gmail manzil noto‘g‘ri');
        }
        await loginStart({ email: email.trim() });
        onStepChange?.('verify');
        setCode('');
      } else {
        if (!username.trim() || !password) {
          throw new Error('Parol yoki username xato');
        }
        const data = await loginWithUsername({
          username: username.trim(),
          password,
        });
        setAuthSession({ user: data.user });
        onClose?.();
      }
    } catch (err) {
      setError(err.message || 'Xatolik yuz berdi');
      if (err.field === 'username') {
        setUsernameStatus('taken');
        setUsernameMessage('Bu username band.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const payload = { email: email.trim(), code: code.trim() };
      const data =
        mode === 'register'
          ? await registerVerify(payload)
          : await loginVerify(payload);

      if (mode === 'register') {
        markNeedsAvatar();
        onStepChange?.('avatar');
        setAuthSession({ user: data.user });
        setError('');
        resetAvatarPick();
      } else {
        setAuthSession({ user: data.user });
        onClose?.();
      }
    } catch (err) {
      setError(err.message || 'Kod noto‘g‘ri');
    } finally {
      setBusy(false);
    }
  };

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!AVATAR_MIME.has(file.type)) {
      setError('Faqat JPEG, PNG, WebP, AVIF yoki GIF');
      return;
    }

    revokePreviewUrl();
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    pendingFileRef.current = file;
    setAvatarPreview(previewUrl);
    setError('');
  };

  const handleRemoveAvatar = () => {
    resetAvatarPick();
    setError('');
  };

  const handleAvatarSubmit = async (e) => {
    e.preventDefault();
    if (!pendingFileRef.current || busy) {
      setError('Profil rasmini yuklash majburiy');
      return;
    }

    setError('');
    setBusy(true);
    try {
      const { publicUrl } = await uploadFileDirectToR2({
        folder: 'avatars',
        file: pendingFileRef.current,
      });

      const data = await updateProfileRequest({ avatar: publicUrl });
      const savedAvatar = data.user?.avatar || publicUrl;

      updateProfile({ avatar: savedAvatar });
      clearNeedsAvatar();
      revokePreviewUrl();
      pendingFileRef.current = null;
      onClose?.();
    } catch (err) {
      setError(err.message || 'Rasm yuklanmadi');
    } finally {
      setBusy(false);
    }
  };

  const usernameInputClass = [
    'auth-modal-input',
    'auth-modal-input--with-icon',
    usernameStatus === 'taken' || usernameStatus === 'invalid'
      ? 'auth-modal-input--invalid'
      : '',
    usernameStatus === 'available' ? 'auth-modal-input--ok' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const avatarReady = Boolean(avatarPreview);
  const canClose = step !== 'avatar';

  return (
    <div className="auth-modal-overlay" role="dialog" aria-modal="true">
      <div
        className="auth-modal-bg"
        style={{ backgroundImage: 'url(/img/auth-register-bg.jpg)' }}
        aria-hidden="true"
      />
      <div className="auth-modal-scrim" aria-hidden="true" />

      {canClose ? (
        <button
          type="button"
          className="auth-modal-close"
          onClick={onClose}
          aria-label="Yopish"
        >
          ×
        </button>
      ) : null}

      <div className={`auth-modal-card${step === 'avatar' ? ' auth-modal-card--avatar' : ''}`}>
        {step === 'form' ? (
          <>
            <h2 className="auth-modal-title">
              {mode === 'register'
                ? isAddAccount
                  ? 'Hisob yaratish'
                  : "Ro'yxatdan o'tish"
                : 'Kirish'}
            </h2>
            <p className="auth-modal-subtitle">
              {mode === 'register'
                ? isAddAccount
                  ? 'Yangi hisob uchun maʼlumotlarni kiriting'
                  : 'Sevimli Kino va Musiqalaringizga tashrif buyuring'
                : 'Hisobingizga kiring'}
            </p>

            <form className="auth-modal-form" onSubmit={handleFormSubmit}>
              {mode === 'register' && (
                <>
                  <label className="auth-modal-label" htmlFor="auth-name">
                    Ism yoki Tahallus
                  </label>
                  <input
                    id="auth-name"
                    className="auth-modal-input profile-edit-input"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Bekzodbek yoki Akasi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  <label className="auth-modal-label" htmlFor="auth-username">
                    Username (Login)
                  </label>
                  <div className="auth-modal-input-wrap">
                    <input
                      id="auth-username"
                      className={usernameInputClass}
                      name="username"
                      type="text"
                      autoComplete="username"
                      placeholder="username_01"
                      value={username}
                      onChange={(e) =>
                        setUsername(e.target.value.replace(/^@+/, '').replace(/\s/g, ''))
                      }
                    />
                    <span className="auth-modal-input-trailing" aria-hidden="true">
                      {usernameStatus === 'checking' ? (
                        <span className="auth-modal-username-loader" />
                      ) : null}
                      {usernameStatus === 'available' ? (
                        <svg className="auth-modal-username-ok" viewBox="0 0 24 24" width="18" height="18">
                          <path
                            fill="currentColor"
                            d="M9.55 18l-5.7-5.7 1.4-1.45 4.3 4.3L18.7 6.4l1.4 1.4z"
                          />
                        </svg>
                      ) : null}
                      {usernameStatus === 'taken' || usernameStatus === 'invalid' ? (
                        <svg className="auth-modal-username-bad" viewBox="0 0 24 24" width="18" height="18">
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
                          ? 'auth-modal-field-ok'
                          : 'auth-modal-field-error'
                      }
                    >
                      {usernameMessage}
                    </p>
                  ) : null}

                  <label className="auth-modal-label" htmlFor="auth-password">
                    Parol
                  </label>
                  <div className="auth-modal-input-wrap">
                    <input
                      id="auth-password"
                      className="auth-modal-input auth-modal-input--with-icon"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="auth-modal-password-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Parolni berkitish' : 'Parolni ko‘rish'}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                          <path
                            fill="currentColor"
                            d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
                          />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                          <path
                            fill="currentColor"
                            d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </>
              )}

              {mode === 'login' && (
                <>
                  <div
                    className={`auth-modal-method-tabs auth-modal-method-tabs--${loginMethod}`}
                    role="tablist"
                    aria-label="Kirish usuli"
                  >
                    <span className="auth-modal-method-tabs-slider" aria-hidden="true" />
                    <button
                      type="button"
                      role="tab"
                      aria-selected={loginMethod === 'gmail'}
                      className={`auth-modal-method-tab${
                        loginMethod === 'gmail' ? ' auth-modal-method-tab--active' : ''
                      }`}
                      onClick={() => {
                        setLoginMethod('gmail');
                        setError('');
                        setPassword('');
                      }}
                    >
                      Gmail
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={loginMethod === 'username'}
                      className={`auth-modal-method-tab${
                        loginMethod === 'username' ? ' auth-modal-method-tab--active' : ''
                      }`}
                      onClick={() => {
                        setLoginMethod('username');
                        setError('');
                        setEmail('');
                      }}
                    >
                      Username
                    </button>
                  </div>

                  {loginMethod === 'gmail' ? (
                    <>
                      <label className="auth-modal-label" htmlFor="auth-login-email">
                        Gmail manzil
                      </label>
                      <input
                        id="auth-login-email"
                        className="auth-modal-input"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="example@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </>
                  ) : (
                    <>
                      <label className="auth-modal-label" htmlFor="auth-login-username">
                        Username
                      </label>
                      <input
                        id="auth-login-username"
                        className="auth-modal-input"
                        name="username"
                        type="text"
                        autoComplete="username"
                        placeholder="username_01"
                        value={username}
                        onChange={(e) =>
                          setUsername(e.target.value.replace(/^@+/, '').replace(/\s/g, ''))
                        }
                      />

                      <label className="auth-modal-label" htmlFor="auth-login-password">
                        Parol
                      </label>
                      <div className="auth-modal-input-wrap">
                        <input
                          id="auth-login-password"
                          className="auth-modal-input auth-modal-input--with-icon"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="auth-modal-password-toggle"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? 'Parolni berkitish' : 'Parolni ko‘rish'}
                        >
                          {showPassword ? (
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                              <path
                                fill="currentColor"
                                d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
                              />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                              <path
                                fill="currentColor"
                                d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}

              {mode === 'register' && (
                <>
                  <label className="auth-modal-label" htmlFor="auth-email">
                    Gmail manzil
                  </label>
                  <input
                    id="auth-email"
                    className="auth-modal-input"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </>
              )}

              {error ? <p className="auth-modal-error">{error}</p> : null}

              <button type="submit" className="auth-modal-submit" disabled={busy}>
                {busy
                  ? 'Kutilmoqda...'
                  : mode === 'register'
                    ? isAddAccount
                      ? 'Hisob yaratish'
                      : "Ro'yxatdan o'tish"
                    : loginMethod === 'username'
                      ? 'Hisobga kirish'
                      : 'Davom etish'}
              </button>
            </form>

            <p className="auth-modal-footer">
              {mode === 'register' ? (
                isAddAccount ? (
                  <>
                    Boshqa hisobga o‘tmoqchimisiz?{' '}
                    <button
                      type="button"
                      className="auth-modal-link"
                      onClick={() => switchMode('login')}
                    >
                      Kirish
                    </button>
                  </>
                ) : (
                  <>
                    Profilingiz bormi?{' '}
                    <button
                      type="button"
                      className="auth-modal-link"
                      onClick={() => switchMode('login')}
                    >
                      Kirish
                    </button>
                  </>
                )
              ) : (
                <>
                  Hisobingiz yo‘qmi?{' '}
                  <button
                    type="button"
                    className="auth-modal-link"
                    onClick={() => switchMode('register')}
                  >
                    Ro&apos;yxatdan o&apos;tish
                  </button>
                </>
              )}
            </p>
          </>
        ) : step === 'verify' ? (
          <>
            <h2 className="auth-modal-title">Kodni tasdiqlang</h2>
            <p className="auth-modal-subtitle">
              {email} manziliga yuborilgan 6 xonali kodni kiriting
            </p>

            <form className="auth-modal-form" onSubmit={handleVerifySubmit}>
              <label className="auth-modal-label" htmlFor="auth-code">
                Tasdiqlash kodi
              </label>
              <input
                id="auth-code"
                className="auth-modal-input auth-modal-input--code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />

              {error ? <p className="auth-modal-error">{error}</p> : null}

              <button
                type="submit"
                className="auth-modal-submit"
                disabled={busy || code.length !== 6}
              >
                {busy ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
              </button>

              <button
                type="button"
                className="auth-modal-back"
                onClick={() => {
                  resetAvatarPick();
                  onStepChange?.('form');
                  setError('');
                  setCode('');
                }}
                disabled={busy}
              >
                Orqaga
              </button>
            </form>
          </>
        ) : step === 'avatar' ? (
          <>
            <h2 className="auth-modal-title">Profil rasmi</h2>
            <p className="auth-modal-subtitle">
              Davom etish uchun profil rasmingizni yuklang
            </p>

            <form className="auth-modal-form auth-modal-avatar-form" onSubmit={handleAvatarSubmit}>
              <div className="auth-modal-avatar-panel">
                <div className="profile-edit-field profile-edit-avatar-field auth-modal-avatar-field">
                  <span className="profile-edit-avatar-heading" id="auth-avatar-heading">
                    Avatar
                  </span>
                  <div className="profile-edit-avatar-row auth-modal-avatar-row">
                    <div
                      className="profile-edit-avatar-preview profile-avatar-wrap auth-modal-avatar-preview"
                      aria-hidden="true"
                    >
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="" className="profile-edit-avatar-img" />
                      ) : (
                        <svg
                          className="profile-edit-avatar-placeholder"
                          width="44"
                          height="44"
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
                        aria-labelledby="auth-avatar-heading"
                        onChange={handleAvatarFile}
                      />
                      <div className="profile-edit-avatar-btn-row">
                        <button
                          type="button"
                          className="profile-edit-avatar-btn auth-modal-upload-btn"
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={busy}
                        >
                          <svg
                            className="auth-modal-upload-icon"
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M12 16V4m0 0l-4 4m4-4l4 4"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M4 16.5V18a2 2 0 002 2h12a2 2 0 002-2v-1.5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                          Rasm yuklash
                        </button>
                        {avatarPreview ? (
                          <button
                            type="button"
                            className="profile-edit-avatar-remove"
                            onClick={handleRemoveAvatar}
                            disabled={busy}
                            aria-label="Rasmni olib tashlash"
                            title="Rasmni olib tashlash"
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
                      <p className="auth-modal-avatar-hint">
                        Profilingizda ko‘rinadigan rasmni tanlang
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {error ? <p className="auth-modal-error">{error}</p> : null}

              <button
                type="submit"
                className="auth-modal-submit auth-modal-submit--footer"
                disabled={busy || !avatarReady}
              >
                {busy ? 'Yuklanmoqda...' : 'Davom etish'}
              </button>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default AuthModal;
