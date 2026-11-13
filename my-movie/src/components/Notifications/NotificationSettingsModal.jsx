import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  fetchNotificationSettings,
  saveNotificationSettings,
} from '../../api/notificationsApi';
import { askDevicePermission, browserHasPushSubscription, ensureDevicePush } from './enableDevicePush';
import './NotificationSettingsModal.css';

const SECTIONS = [
  {
    id: 'social',
    uz: 'IJTIMOIY',
    ru: 'СОЦИАЛЬНЫЕ',
    items: [
      {
        id: 'mentions',
        uz: 'Belgilash va javoblar',
        ru: 'Отметки и ответы',
        hintUz: 'Izohda @ qilinganda',
        hintRu: 'Когда отмечают в комментарии',
        defaultOn: true,
      },
      {
        id: 'subscribers',
        uz: 'Yangi obunachilar',
        ru: 'Новые подписчики',
        hintUz: "Kimdir obuna bo'lganda",
        hintRu: 'Когда кто-то подписывается',
        defaultOn: true,
      },
      {
        id: 'likes',
        uz: 'Yoqtirishlar',
        ru: 'Отметки нравится',
        hintUz: 'Fikr va izohlarga',
        hintRu: 'На мысли и комментарии',
        defaultOn: false,
      },
      {
        id: 'rooms',
        uz: 'Xona takliflari',
        ru: 'Приглашения в комнату',
        hintUz: "Do'stlar chaqirganda",
        hintRu: 'Когда зовут друзья',
        defaultOn: true,
      },
    ],
  },
  {
    id: 'movies',
    uz: 'KINO VA TAVSIYA',
    ru: 'КИНО И РЕКОМЕНДАЦИИ',
    items: [
      {
        id: 'ai',
        uz: 'AI kechki tavsiya',
        ru: 'Вечерняя рекомендация',
        hintUz: "Ko'rish odatingiz asosida",
        hintRu: 'На основе ваших просмотров',
        defaultOn: true,
      },
      {
        id: 'channels',
        uz: "Obuna bo'lgan kanallar",
        ru: 'Каналы в подписках',
        hintUz: 'Yangi video va qismlar',
        hintRu: 'Новые видео и серии',
        defaultOn: true,
      },
      {
        id: 'artists',
        uz: 'Kuzatilgan artistlar',
        ru: 'Отслеживаемые артисты',
        hintUz: 'Yangi klip chiqqanda',
        hintRu: 'Когда выходит новый клип',
        defaultOn: true,
      },
    ],
  },
];

const initialToggles = () =>
  Object.fromEntries(
    SECTIONS.flatMap((section) => section.items.map((item) => [item.id, item.defaultOn]))
  );

const isMobileSlide = () =>
  typeof window !== 'undefined' && window.innerWidth <= 768;

const NotificationSettingsModal = ({ closing = false, onClose, onExited }) => {
  const { t, i18n } = useTranslation();
  const lang = String(i18n.language || '').startsWith('ru') ? 'ru' : 'uz';
  const [toggles, setToggles] = useState(initialToggles);
  const [entered, setEntered] = useState(false);
  const slideIn = entered && !closing;
  const exitedRef = useRef(false);
  const savingRef = useRef(false);
  const onExitedRef = useRef(onExited);
  onExitedRef.current = onExited;

  useEffect(() => {
    let cancelled = false;
    fetchNotificationSettings()
      .then((settings) => {
        if (cancelled || typeof settings?.subscribers !== 'boolean') return;
        setToggles((current) => ({ ...current, subscribers: settings.subscribers }));
        if (settings.subscribers) return ensureDevicePush();
        return null;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleItem = (id) => {
    if (id !== 'subscribers') {
      setToggles((current) => ({ ...current, [id]: !current[id] }));
      return;
    }
    if (savingRef.current) return;
    const permission = typeof Notification === 'undefined' ? 'denied' : Notification.permission;
    if (toggles.subscribers && permission === 'default') {
      askDevicePermission()
        .then((result) => (result === 'granted' ? ensureDevicePush() : null))
        .catch(() => {});
      return;
    }
    if (toggles.subscribers && permission === 'granted') {
      savingRef.current = true;
      browserHasPushSubscription()
        .then((subscribed) => {
          if (!subscribed) return ensureDevicePush();
          setToggles((current) => ({ ...current, subscribers: false }));
          return saveNotificationSettings({ subscribers: false }).catch(() => {
            setToggles((current) => ({ ...current, subscribers: true }));
          });
        })
        .catch(() => {})
        .finally(() => {
          savingRef.current = false;
        });
      return;
    }
    const next = !toggles.subscribers;
    savingRef.current = true;
    setToggles((current) => ({ ...current, subscribers: next }));
    const permissionPromise = next ? askDevicePermission() : null;
    saveNotificationSettings({ subscribers: next })
      .then(() => {
        if (!permissionPromise) return null;
        return permissionPromise
          .then((result) => (result === 'granted' ? ensureDevicePush() : null))
          .catch(() => null);
      })
      .catch(() => {
        setToggles((current) => ({ ...current, subscribers: !next }));
      })
      .finally(() => {
        savingRef.current = false;
      });
  };

  const finishExit = () => {
    if (exitedRef.current) return;
    exitedRef.current = true;
    onExitedRef.current?.();
  };

  useEffect(() => {
    let innerId = 0;
    const outerId = window.requestAnimationFrame(() => {
      innerId = window.requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      window.cancelAnimationFrame(outerId);
      window.cancelAnimationFrame(innerId);
    };
  }, []);

  useEffect(() => {
    if (!closing) return undefined;
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = window.setTimeout(finishExit, reduced || !isMobileSlide() ? 0 : 380);
    return () => window.clearTimeout(id);
  }, [closing]);

  const handleTransitionEnd = (event) => {
    if (event.target !== event.currentTarget) return;
    if (event.propertyName !== 'transform') return;
    if (!closing || !isMobileSlide()) return;
    finishExit();
  };

  return (
    <>
      <div className="notification-settings-backdrop" onClick={onClose} />
      <div
        className={`notification-settings${slideIn ? ' notification-settings--in' : ''}`}
        onTransitionEnd={handleTransitionEnd}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-settings-title"
      >
      <div className="profile-info-modal-header notification-settings-header">
        <button
          type="button"
          className="profile-info-back"
          onClick={onClose}
          aria-label={t('profile.settingsBack', 'Orqaga')}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h2 id="notification-settings-title" className="profile-info-modal-title">
          {t('navbar.notifications', 'Bildirishnomalar')}
        </h2>
        <span className="profile-info-header-spacer" aria-hidden="true" />
      </div>

      <div className="notification-settings-body">
        {SECTIONS.map((section) => (
          <section key={section.id} className="notification-settings-section">
            <h3 className="notification-settings-label">{lang === 'ru' ? section.ru : section.uz}</h3>
            {section.items.map((item) => {
              const on = toggles[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  className="notification-settings-row"
                  aria-pressed={on}
                  onClick={() => toggleItem(item.id)}
                >
                  <span className="notification-settings-copy">
                    <span className="notification-settings-title">{lang === 'ru' ? item.ru : item.uz}</span>
                    <span className="notification-settings-hint">{lang === 'ru' ? item.hintRu : item.hintUz}</span>
                  </span>
                  <span className={`notification-settings-switch${on ? ' is-on' : ''}`} aria-hidden="true">
                    <span />
                  </span>
                </button>
              );
            })}
          </section>
        ))}
      </div>
      </div>
    </>
  );
};

export default NotificationSettingsModal;
