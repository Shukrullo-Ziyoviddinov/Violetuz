import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { switchAccountRequest, fetchDeviceAccounts } from '../../api/authApi';
import {
  listAccounts,
  getActiveAccountId,
  removeAccount,
  replaceAccountsCache,
} from '../../accounts/accountsStorage';
import { requestOpenAuthModal } from '../../authModalBridge';
import { normalizeUsername } from '../../store/slices/userUtils';
import './AddAccountModal.css';

const formatUsername = (raw) => {
  const u = normalizeUsername(raw);
  return u ? `@${u}` : '';
};

const AddAccountModal = ({ onClose }) => {
  const { profile, setAuthSession } = useAuth();
  const [accounts, setAccounts] = useState(() => listAccounts());
  const [activeId, setActiveId] = useState(
    () => profile?.id || getActiveAccountId()
  );
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef(0);
  const dragYRef = useRef(0);

  const applyList = useCallback((nextAccounts, nextActiveId) => {
    const cached = replaceAccountsCache(nextAccounts, nextActiveId);
    setAccounts(cached.accounts);
    setActiveId(cached.activeId);
  }, []);

  const loadFromServer = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDeviceAccounts();
      const serverAccounts = Array.isArray(data?.accounts) ? data.accounts : [];
      const serverActive =
        data?.activeUserId || profile?.id || getActiveAccountId();
      applyList(serverAccounts, serverActive);
    } catch (err) {
      setAccounts(listAccounts());
      setActiveId(profile?.id || getActiveAccountId());
      setError(err.message || 'Hisoblar yuklanmadi');
    } finally {
      setLoading(false);
    }
  }, [applyList, profile?.id]);

  useEffect(() => {
    loadFromServer();
  }, [loadFromServer]);

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      if (isMobile) {
        document.body.style.overflow = '';
      }
    };
  }, []);

  const handleTouchStart = (e) => {
    startYRef.current = e.touches[0].clientY;
    dragYRef.current = 0;
  };

  const handleTouchMove = (e) => {
    if (window.innerWidth > 768) return;
    const y = e.touches[0].clientY;
    const diff = y - startYRef.current;
    if (diff > 0) {
      dragYRef.current = diff;
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragYRef.current > 80) onClose();
    dragYRef.current = 0;
    setDragY(0);
  };

  const handleSelectAccount = async (account) => {
    if (!account?.id || busyId) return;
    if (account.id === activeId) return;

    setError('');
    setBusyId(account.id);
    try {
      const data = await switchAccountRequest({ userId: account.id });
      setAuthSession({ user: data.user });
      await loadFromServer();
      onClose?.();
    } catch (err) {
      if (err.status === 403 || err.status === 401) {
        removeAccount(account.id);
        await loadFromServer();
      }
      setError(err.message || 'Hisobga o‘tib bo‘lmadi');
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateAccount = () => {
    onClose?.();
    requestOpenAuthModal('register', { copyVariant: 'addAccount' });
  };

  const currentId = activeId || null;

  return (
    <>
      <div className="add-account-overlay" onClick={onClose} aria-hidden="true" />
      <div
        className={`add-account-modal ${dragY > 0 ? 'add-account-modal--dragging' : ''}`}
        style={{ '--drag-y': `${dragY}px` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-account-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="add-account-sheet-top"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="add-account-drag-handle" aria-hidden="true" />
          <div className="add-account-header">
            <h3 id="add-account-title" className="add-account-title">
              Hisoblar
            </h3>
            <button
              type="button"
              className="add-account-close add-account-close--desktop"
              onClick={onClose}
              aria-label="Yopish"
            >
              ×
            </button>
          </div>
        </div>

        <div className="add-account-content">
          {loading ? (
            <p className="add-account-empty">Yuklanmoqda...</p>
          ) : accounts.length === 0 ? (
            <p className="add-account-empty">Hozircha saqlangan hisob yo‘q</p>
          ) : null}

          {!loading &&
            accounts.map((account) => {
              const isActive = account.id === currentId;
              const username = formatUsername(account.username);
              return (
                <button
                  key={account.id}
                  type="button"
                  className={`add-account-row${isActive ? ' add-account-row--active' : ''}`}
                  onClick={() => handleSelectAccount(account)}
                  disabled={Boolean(busyId)}
                >
                  <div className="add-account-avatar" aria-hidden="true">
                    {account.avatar ? (
                      <img src={account.avatar} alt="" className="add-account-avatar-img" />
                    ) : (
                      <svg
                        className="add-account-avatar-placeholder"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                          fill="currentColor"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="add-account-meta">
                    <span className="add-account-name">{account.name || 'Foydalanuvchi'}</span>
                    {username ? (
                      <span className="add-account-username">{username}</span>
                    ) : null}
                  </div>
                  {isActive ? (
                    <span className="add-account-check" aria-label="Joriy hisob">
                      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M9.55 18l-5.7-5.7 1.4-1.45 4.3 4.3L18.7 6.4l1.4 1.4z"
                        />
                      </svg>
                    </span>
                  ) : busyId === account.id ? (
                    <span className="add-account-busy" aria-hidden="true" />
                  ) : null}
                </button>
              );
            })}

          <button
            type="button"
            className="add-account-row add-account-row--create"
            onClick={handleCreateAccount}
            disabled={Boolean(busyId) || loading}
          >
            <div className="add-account-avatar add-account-avatar--add" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="add-account-meta">
              <span className="add-account-name">Hisob yaratish</span>
            </div>
          </button>

          {error ? <p className="add-account-error">{error}</p> : null}
        </div>
      </div>
    </>
  );
};

export default AddAccountModal;
