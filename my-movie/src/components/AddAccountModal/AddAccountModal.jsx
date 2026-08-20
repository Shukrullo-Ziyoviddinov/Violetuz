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
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import UserAvatar from '../UserAvatar/UserAvatar';
import './AddAccountModal.css';

const CLOSE_MS = 340;

const formatUsername = (raw) => {
  const u = normalizeUsername(raw);
  return u ? `@${u}` : '';
};

const isMobileViewport = () =>
  typeof window !== 'undefined' && window.innerWidth <= 768;

const AddAccountRowSkeleton = () => (
  <div className="add-account-row add-account-row--skeleton" aria-hidden="true">
    <SkeletonLoader variant="add-account-avatar" />
    <div className="add-account-meta">
      <SkeletonLoader variant="add-account-name" />
      <SkeletonLoader variant="add-account-username" />
    </div>
  </div>
);

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
  const [sheetOpen, setSheetOpen] = useState(() => !isMobileViewport());
  const [exiting, setExiting] = useState(false);
  const startYRef = useRef(0);
  const dragYRef = useRef(0);
  const closeTimerRef = useRef(null);

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
    const isMobile = isMobileViewport();
    if (isMobile) {
      document.body.style.overflow = 'hidden';
      const id = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setSheetOpen(true));
      });
      return () => {
        window.cancelAnimationFrame(id);
        document.body.style.overflow = '';
      };
    }
    setSheetOpen(true);
    return undefined;
  }, []);

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

  const handleSelectAccount = async (account) => {
    if (!account?.id || busyId || exiting) return;
    if (account.id === activeId) return;

    setError('');
    setBusyId(account.id);
    try {
      const data = await switchAccountRequest({ userId: account.id });
      setAuthSession({ user: data.user });
      await loadFromServer();
      requestClose();
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
    requestClose();
    window.setTimeout(() => {
      requestOpenAuthModal('register', { copyVariant: 'addAccount' });
    }, isMobileViewport() ? CLOSE_MS : 0);
  };

  const currentId = activeId || null;
  const overlayClass = [
    'add-account-overlay',
    sheetOpen ? 'add-account-overlay--open' : '',
    exiting ? 'add-account-overlay--closing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const modalClass = [
    'add-account-modal',
    sheetOpen ? 'add-account-modal--open' : '',
    dragY > 0 && !exiting ? 'add-account-modal--dragging' : '',
    exiting ? 'add-account-modal--closing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div
        className={overlayClass}
        onClick={requestClose}
        aria-hidden="true"
      />
      <div
        className={modalClass}
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
              onClick={requestClose}
              aria-label="Yopish"
            >
              ×
            </button>
          </div>
        </div>

        <div className="add-account-content">
          {loading ? (
            <>
              <AddAccountRowSkeleton />
              <AddAccountRowSkeleton />
              <AddAccountRowSkeleton />
            </>
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
                  disabled={Boolean(busyId) || exiting}
                >
                  <div className="add-account-avatar" aria-hidden="true">
                    <UserAvatar
                      src={account.avatar}
                      className="add-account-avatar-img"
                      fallback={
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
                      }
                    />
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
            disabled={Boolean(busyId) || loading || exiting}
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
