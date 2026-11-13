import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useModalHardwareBack } from '../../useModalHardwareBack';
import {
  fetchNotificationSettings,
  fetchNotifications,
  fetchUnreadCount,
  markNotificationsRead,
  openNotificationStream,
} from '../../api/notificationsApi';
import { askDevicePermission, ensureDevicePush } from './enableDevicePush';
import NotificationsFilter from './NotificationsFilter';
import NotificationsEmpty from './NotificationsEmpty';
import NotificationsList from './NotificationsList';
import { itemsForFilter } from './notificationView';
import './Notifications.css';

const MOBILE_QUERY = '(max-width: 768px)';

const showOsNotice = (item) => {
  if (item?.type !== 'subscriber') return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  if (document.visibilityState !== 'visible') return;
  const name = String(item.actor?.name || item.actor?.username || '').trim();
  const avatar = String(item.actor?.avatar || '');
  const icon = /^https?:\/\//i.test(avatar) ? avatar : '/img/newlogo.jpg';
  try {
    const notice = new Notification('VioletPlay', {
      body: name ? `${name} sizga obuna bo‘ldi` : 'sizga obuna bo‘ldi',
      icon,
      tag: `subscriber-${item.id}`,
    });
    notice.onclick = () => {
      window.focus();
      notice.close();
    };
  } catch {
    // Qo‘ng‘iroqcha yozuvi saqlanadi.
  }
};

const useMobileNotifications = () => {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  );

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const sync = () => setMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return mobile;
};

export const NotificationsModal = ({ onClose, onMarked, registerLive }) => {
  const { t } = useTranslation();
  const { isLoggedIn } = useAuth();
  const mobile = useMobileNotifications();
  const title = t('navbar.notifications', 'Bildirishnomalar');
  const [activeFilter, setActiveFilter] = useState('all');
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const markedRef = useRef(new Set());
  const arrivedLive = useRef(new Set());
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const onMarkedRef = useRef(onMarked);
  onMarkedRef.current = onMarked;
  const [slideReady, setSlideReady] = useState(false);
  const [exiting, setExiting] = useState(false);
  const closingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const mobileRef = useRef(mobile);
  onCloseRef.current = onClose;
  mobileRef.current = mobile;

  const finishClose = () => {
    closingRef.current = false;
    onCloseRef.current?.();
  };

  const beginSlideClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setExiting(true);
  };

  const { releaseHistory } = useModalHardwareBack({
    historyKey: 'notificationsModal',
    isOpen: true,
    onCloseFromHardware: () => {
      if (!mobileRef.current) {
        onCloseRef.current?.();
        return;
      }
      beginSlideClose();
    },
  });

  const requestClose = () => {
    if (closingRef.current) return;
    if (!mobileRef.current) {
      releaseHistory();
      onCloseRef.current?.();
      return;
    }
    beginSlideClose();
    releaseHistory();
  };
  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;

  useEffect(() => {
    const id = window.setTimeout(() => setSlideReady(true), 20);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!exiting) return undefined;
    const id = window.setTimeout(finishClose, 320);
    return () => window.clearTimeout(id);
  }, [exiting]);

  useEffect(() => {
    if (!registerLive) return undefined;
    registerLive({
      push(item) {
        if (!item?.id) return;
        arrivedLive.current.add(item.id);
        setItems((current) => (
          current.some((row) => row.id === item.id) ? current : [item, ...current]
        ));
      },
      replace(next) {
        const list = Array.isArray(next) ? next : [];
        const known = new Set(itemsRef.current.map((row) => row.id));
        list.forEach((item) => {
          if (item?.id && !item.readAt && !known.has(item.id)) arrivedLive.current.add(item.id);
        });
        setItems((current) => {
          const ids = new Set(list.map((item) => item.id));
          const extra = current.filter((item) => arrivedLive.current.has(item.id) && item.id && !ids.has(item.id));
          return [...extra, ...list];
        });
      },
    });
    return () => registerLive(null);
  }, [registerLive]);

  useEffect(() => {
    if (!isLoggedIn) {
      setItems([]);
      setLoaded(true);
      return undefined;
    }
    let cancelled = false;
    fetchNotifications()
      .then((data) => {
        if (cancelled) return;
        const fetched = Array.isArray(data?.items) ? data.items : [];
        setItems((current) => {
          const ids = new Set(fetched.map((item) => item.id));
          const extra = current.filter((item) => item?.id && !ids.has(item.id));
          return [...extra, ...fetched];
        });
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const visible = itemsForFilter(items, activeFilter);

  useEffect(() => {
    if (!loaded || !isLoggedIn) return undefined;
    const ids = itemsForFilter(items, activeFilter)
      .filter((item) => item?.id && !item.readAt && !markedRef.current.has(item.id))
      .map((item) => item.id);
    if (!ids.length) return undefined;
    const badgeIds = ids.filter((id) => !arrivedLive.current.has(id));
    let cancelled = false;
    markNotificationsRead(ids)
      .then(() => {
        if (cancelled) return;
        ids.forEach((id) => markedRef.current.add(id));
        if (badgeIds.length) onMarkedRef.current?.(badgeIds);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [loaded, isLoggedIn, items, activeFilter]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') requestCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const modalClass = [
    'notifications-modal',
    slideReady && !exiting ? 'notifications-modal--open' : '',
    exiting ? 'notifications-modal--closing' : '',
  ].filter(Boolean).join(' ');

  return createPortal(
    <div className="notifications-overlay" onClick={requestClose} role="presentation">
      <div
        className={modalClass}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="notifications-modal-header">
          {mobile ? (
            <button type="button" className="ib" aria-label="Orqaga" onClick={requestClose}>
              ‹
            </button>
          ) : null}
          <b className="notifications-modal-title">{title}</b>
          {mobile ? null : (
            <button
              type="button"
              className="notifications-modal-close"
              aria-label="Yopish"
              onClick={requestClose}
            >
              ×
            </button>
          )}
        </header>
        <NotificationsFilter active={activeFilter} onChange={setActiveFilter} />
        <div className="notifications-modal-body">
          {loaded && visible.length === 0 ? <NotificationsEmpty filterId={activeFilter} /> : null}
          {visible.length > 0 ? <NotificationsList items={visible} /> : null}
        </div>
      </div>
    </div>,
    document.body
  );
};

const NotificationsBell = () => {
  const { t } = useTranslation();
  const { isLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const markedIds = useRef(new Set());
  const seenLiveIds = useRef(new Set());
  const unreadToken = useRef(0);
  const registry = useRef(null);
  const title = t('navbar.notifications', 'Bildirishnomalar');
  const registerLive = useCallback((api) => {
    registry.current = api;
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setUnread(0);
      return undefined;
    }
    let cancelled = false;
    const loadUnread = () => {
      const token = unreadToken.current + 1;
      unreadToken.current = token;
      fetchUnreadCount()
        .then((data) => {
          if (cancelled || token !== unreadToken.current) return;
          setUnread(Number(data?.count) || 0);
        })
        .catch(() => {});
    };
    const catchUp = () => {
      if (cancelled || document.visibilityState === 'hidden') return;
      if (registry.current) {
        fetchNotifications()
          .then((data) => {
            if (!cancelled) registry.current?.replace(data?.items || []);
          })
          .catch(() => {});
        return;
      }
      loadUnread();
    };
    const closeStream = openNotificationStream({
      onItem: (item) => {
        if (!item?.id || seenLiveIds.current.has(item.id)) return;
        seenLiveIds.current.add(item.id);
        showOsNotice(item);
        if (registry.current) {
          registry.current.push(item);
          return;
        }
        loadUnread();
      },
      onReconnect: catchUp,
    });
    const onVisible = () => {
      if (document.visibilityState === 'visible') catchUp();
    };
    document.addEventListener('visibilitychange', onVisible);
    fetchNotificationSettings()
      .then((settings) => {
        if (settings?.subscribers === false) return null;
        return askDevicePermission();
      })
      .then((permission) => (permission === 'granted' ? ensureDevicePush() : null))
      .catch(() => {});
    return () => {
      cancelled = true;
      closeStream();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || open) {
      if (!isLoggedIn) setUnread(0);
      return undefined;
    }
    let cancelled = false;
    const token = unreadToken.current + 1;
    unreadToken.current = token;
    fetchUnreadCount()
      .then((data) => {
        if (cancelled || token !== unreadToken.current) return;
        setUnread(Number(data?.count) || 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, open]);

  const onMarked = (ids) => {
    const fresh = ids.filter((id) => id && !markedIds.current.has(id));
    fresh.forEach((id) => markedIds.current.add(id));
    if (fresh.length) setUnread((count) => Math.max(0, count - fresh.length));
  };

  const badge = unread > 99 ? '99+' : String(unread);

  return (
    <>
      <button
        type="button"
        className="navbar-mobile-action-btn navbar-mobile-bell-btn"
        aria-label={unread > 0 ? `${title}, ${badge}` : title}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <i className="fa-solid fa-bell" aria-hidden="true" />
        {unread > 0 ? <span className="notifications-badge">{badge}</span> : null}
      </button>
      {open ? (
        <NotificationsModal
          onClose={() => setOpen(false)}
          onMarked={onMarked}
          registerLive={registerLive}
        />
      ) : null}
    </>
  );
};

export default NotificationsBell;
