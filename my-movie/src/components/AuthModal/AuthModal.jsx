import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  checkUsernameAvailable,
  loginStart,
  loginVerify,
  registerStart,
  registerVerify,
} from '../../api/authApi';
import './AuthModal.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

const AuthModal = ({ initialMode = 'register', onClose }) => {
  const { setAuthSession } = useAuth();
  const [mode, setMode] = useState(initialMode === 'login' ? 'login' : 'register');
  const [step, setStep] = useState('form'); // form | verify
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameOk, setUsernameOk] = useState(false);
  const usernameTimerRef = useRef(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    setMode(initialMode === 'login' ? 'login' : 'register');
    setStep('form');
    setError('');
    setCode('');
  }, [initialMode]);

  const runUsernameCheck = useCallback(async (value) => {
    const clean = value.trim().replace(/^@+/, '');
    if (!clean) {
      setUsernameError('');
      setUsernameOk(false);
      return;
    }
    if (!USERNAME_RE.test(clean)) {
      setUsernameError('3–30 belgi: harf, raqam yoki _');
      setUsernameOk(false);
      return;
    }
    try {
      const data = await checkUsernameAvailable(clean);
      if (data?.available) {
        setUsernameError('');
        setUsernameOk(true);
      } else {
        setUsernameError('Bu username band');
        setUsernameOk(false);
      }
    } catch (err) {
      setUsernameError(err.message || 'Tekshirib bo‘lmadi');
      setUsernameOk(false);
    }
  }, []);

  useEffect(() => {
    if (mode !== 'register' || step !== 'form') return undefined;
    if (usernameTimerRef.current) window.clearTimeout(usernameTimerRef.current);
    usernameTimerRef.current = window.setTimeout(() => {
      runUsernameCheck(username);
    }, 400);
    return () => {
      if (usernameTimerRef.current) window.clearTimeout(usernameTimerRef.current);
    };
  }, [username, mode, step, runUsernameCheck]);

  const switchMode = (next) => {
    setMode(next);
    setStep('form');
    setError('');
    setCode('');
    setPassword('');
    setUsernameError('');
    setUsernameOk(false);
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
        if (!USERNAME_RE.test(username.trim())) {
          throw new Error('Username noto‘g‘ri');
        }
        if (usernameError || !usernameOk) {
          throw new Error(usernameError || 'Username band yoki tekshirilmagan');
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
      } else {
        if (!EMAIL_RE.test(email.trim())) {
          throw new Error('Gmail manzil noto‘g‘ri');
        }
        if (!password) {
          throw new Error('Parol majburiy');
        }
        await loginStart({
          email: email.trim(),
          password,
        });
      }
      setStep('verify');
      setCode('');
    } catch (err) {
      setError(err.message || 'Xatolik yuz berdi');
      if (err.field === 'username') {
        setUsernameError('Bu username band');
        setUsernameOk(false);
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

      setAuthSession({
        token: data.token,
        user: data.user,
      });
      onClose?.();
    } catch (err) {
      setError(err.message || 'Kod noto‘g‘ri');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-modal-overlay" role="dialog" aria-modal="true">
      <div
        className="auth-modal-bg"
        style={{ backgroundImage: 'url(/img/auth-register-bg.jpg)' }}
        aria-hidden="true"
      />
      <div className="auth-modal-scrim" aria-hidden="true" />

      <button
        type="button"
        className="auth-modal-close"
        onClick={onClose}
        aria-label="Yopish"
      >
        ×
      </button>

      <div className="auth-modal-card">
        {step === 'form' ? (
          <>
            <h2 className="auth-modal-title">
              {mode === 'register' ? "Ro'yxatdan o'tish" : 'Kirish'}
            </h2>
            <p className="auth-modal-subtitle">
              {mode === 'register'
                ? "Sevimli manga va kinolaringiz olamiga qo'shiling"
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
                  <input
                    id="auth-username"
                    className={`auth-modal-input${
                      usernameError ? ' auth-modal-input--invalid' : ''
                    }`}
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="username_01"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.trim().replace(/^@+/, ''))
                    }
                  />
                  {usernameError ? (
                    <p className="auth-modal-field-error">{usernameError}</p>
                  ) : null}

                  <label className="auth-modal-label" htmlFor="auth-password">
                    Parol
                  </label>
                  <input
                    id="auth-password"
                    className="auth-modal-input"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </>
              )}

              {mode === 'login' && (
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

                  <label className="auth-modal-label" htmlFor="auth-login-password">
                    Parol
                  </label>
                  <input
                    id="auth-login-password"
                    className="auth-modal-input"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
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
                    ? "Ro'yxatdan o'tish"
                    : 'Davom etish'}
              </button>
            </form>

            <p className="auth-modal-footer">
              {mode === 'register' ? (
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
        ) : (
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
                  setStep('form');
                  setError('');
                  setCode('');
                }}
                disabled={busy}
              >
                Orqaga
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
