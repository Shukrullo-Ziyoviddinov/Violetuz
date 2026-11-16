import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchChatBackgrounds, fetchMyChatBackground, saveChatBackground } from '../../../api/messagesApi';
import './ChatSettingsModal.css';

const DEFAULT_PREVIEW = '/img/chat-backgrounds/chat-bg-1.jpg';

const isMobileSlide = () =>
  typeof window !== 'undefined' && window.innerWidth <= 768;

const ChatSettingsModal = ({ closing = false, onClose, onExited }) => {
  const { t } = useTranslation();
  const [entered, setEntered] = useState(false);
  const [textLight, setTextLight] = useState(false);
  const [backgrounds, setBackgrounds] = useState([]);
  const [selectedId, setSelectedId] = useState(1);
  const [previewImage, setPreviewImage] = useState(DEFAULT_PREVIEW);
  const [choiceReady, setChoiceReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const pickedRef = useRef(false);
  const slideIn = entered && !closing;
  const exitedRef = useRef(false);
  const onExitedRef = useRef(onExited);
  onExitedRef.current = onExited;

  const finishExit = () => {
    if (exitedRef.current) return;
    exitedRef.current = true;
    onExitedRef.current?.();
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchChatBackgrounds(), fetchMyChatBackground()])
      .then(([list, mine]) => {
        if (cancelled) return;
        const rows = Array.isArray(list?.items) ? list.items : [];
        setBackgrounds(rows);
        if (!pickedRef.current) {
          const chosen = rows.find((row) => row.id === mine?.backgroundId)
            || rows.find((row) => row.isDefault)
            || rows[0];
          if (chosen) {
            setSelectedId(chosen.id);
            setPreviewImage(chosen.image || DEFAULT_PREVIEW);
          }
        }
        if (rows.length) setChoiceReady(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const chooseBackground = (item) => {
    if (!item?.image || saving) return;
    pickedRef.current = true;
    setSelectedId(item.id);
    setPreviewImage(item.image);
  };

  const saveChoice = () => {
    if (saving || !choiceReady) return;
    setSaving(true);
    saveChatBackground(selectedId)
      .then((saved) => {
        const image = saved?.image || previewImage;
        if (saved?.backgroundId) setSelectedId(saved.backgroundId);
        if (image) setPreviewImage(image);
        window.dispatchEvent(new CustomEvent('violet-chat-background', { detail: { image } }));
      })
      .catch(() => {})
      .finally(() => setSaving(false));
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
      <div className="chat-settings-backdrop" onClick={onClose} />
      <div
        className={`chat-settings${slideIn ? ' chat-settings--in' : ''}`}
        onTransitionEnd={handleTransitionEnd}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-settings-title"
      >
        <div className="profile-info-modal-header chat-settings-header">
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
          <div className="chat-settings-heading">
            <span className="chat-settings-mark" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-2.9-.4-4.1-1.1L4 21l1.6-4.2A8.4 8.4 0 0 1 4.5 12 8.5 8.5 0 0 1 13 3.5h.5A8.5 8.5 0 0 1 21 12z" />
              </svg>
            </span>
            <span className="chat-settings-heading-copy">
              <h2 id="chat-settings-title" className="profile-info-modal-title chat-settings-title">
                Chat Fonlari
              </h2>
              <p className="chat-settings-subtitle">Chat uchun orqa fonni tanlang</p>
            </span>
          </div>
          <span className="profile-info-header-spacer" aria-hidden="true" />
        </div>

        <div className="chat-settings-body">
          <div className="chat-settings-scroll">
            <div
              className="chat-settings-preview"
              style={{ backgroundImage: `url(${previewImage})` }}
            >
              <div className="chat-settings-bubble chat-settings-bubble--in">
                <span className="chat-settings-avatar" aria-hidden="true" />
                <span className="chat-settings-bubble-card">
                  Salom! <span aria-hidden="true">👋</span>
                  <span className="chat-settings-bubble-time">20:45</span>
                </span>
              </div>
              <div className="chat-settings-bubble chat-settings-bubble--out">
                <span className="chat-settings-bubble-card">
                  Qanday yangiliklar? <span aria-hidden="true">😎</span>
                  <span className="chat-settings-bubble-time">
                    20:46
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="2 12 7 17 15 7" />
                      <polyline points="9 12 14 17 22 7" />
                    </svg>
                  </span>
                </span>
              </div>
            </div>

            <div className="chat-settings-row chat-settings-row--static" aria-disabled="true">
              <span className="chat-settings-row-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3.2s5 5.1 5 8.6a5 5 0 0 1-10 0c0-3.5 5-8.6 5-8.6z" />
                </svg>
              </span>
              <span className="chat-settings-row-copy">
                <span className="chat-settings-row-title">Xabarlar rangi</span>
                <span className="chat-settings-row-hint">Xabarlar fon rangi</span>
              </span>
              <span className="chat-settings-swatch" aria-hidden="true" />
              <svg className="chat-settings-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <button
              type="button"
              className="chat-settings-row"
              aria-pressed={textLight}
              onClick={() => setTextLight((on) => !on)}
            >
              <span className="chat-settings-row-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              <span className="chat-settings-row-copy">
                <span className="chat-settings-row-title">Xabar matni rangi</span>
                <span className="chat-settings-row-hint">Matn rangi tanlovi</span>
              </span>
              <span className={`chat-settings-switch${textLight ? ' is-on' : ''}`} aria-hidden="true">
                <span />
              </span>
              <svg className="chat-settings-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <h3 className="chat-settings-section">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="8.5" cy="10" r="1.5" />
                <path d="M21 16l-5-5-8 8" />
              </svg>
              Fon tanlash
            </h3>
            <div className="chat-settings-grid">
              {backgrounds.map((item) => {
                const selected = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`chat-settings-card${selected ? ' is-selected' : ''}`}
                    style={{ backgroundImage: `url(${item.image})` }}
                    aria-pressed={selected}
                    aria-label={`Fon ${item.id}`}
                    onClick={() => chooseBackground(item)}
                  >
                    {selected ? (
                      <span className="chat-settings-check" aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="chat-settings-footer">
            <button type="button" className="chat-settings-save" onClick={saveChoice} disabled={saving || !choiceReady}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Saqlash
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatSettingsModal;
