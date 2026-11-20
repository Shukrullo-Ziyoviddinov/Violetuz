import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useModalHardwareBack } from '../../../useModalHardwareBack';
import './AnimationEmojModal.css';

const CLOSE_MS = 340;
const CLOSE_DRAG_PX = 80;

const isMobileViewport = () =>
  typeof window !== 'undefined' && window.innerWidth <= 768;

const copy = (lang) => {
  const ru = lang === 'ru';
  return {
    title: ru ? 'Эмодзи' : 'Emoji',
    close: ru ? 'Закрыть' : 'Yopish',
    tabs: [
      { id: 'emoji', label: ru ? 'Эмодзи' : 'Emoji' },
      { id: 'animation', label: ru ? 'Анимация' : 'Animatsiya' },
      { id: 'gif', label: 'GIF' },
    ],
    search: {
      emoji: ru ? 'Поиск эмодзи' : 'Emoji qidirish',
      animation: ru ? 'Поиск анимаций' : 'Animatsion emoji qidirish',
      gif: ru ? 'Поиск GIF' : 'GIF qidirish',
    },
    recent: ru ? 'Недавние' : 'So‘nggi',
    used: ru ? 'ИСПОЛЬЗОВАННЫЕ' : 'ISHLATILGANLAR',
    smiles: ru ? 'УЛЫБКИ' : 'TABASSUMLAR',
    chips: [
      { id: 'recent', label: ru ? 'Недавние' : 'So‘nggi' },
      { id: 'laugh', label: ru ? 'Смех' : 'Kulgi' },
      { id: 'love', label: ru ? 'Любовь' : 'Sevgi' },
      { id: 'cinema', label: ru ? 'Кино' : 'Kino' },
      { id: 'emotion', label: ru ? 'Эмоции' : 'Hayajon' },
    ],
  };
};

const Icon = ({ children }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    {children}
  </svg>
);

const ClockIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8.2V12l2.6 1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);

const EMOJI_CATS = [
  { id: 'recent', icon: <ClockIcon /> },
  {
    id: 'smile',
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="8" />
        <path d="M8.6 13.6c.7 1.3 1.9 2 3.4 2s2.7-.7 3.4-2" strokeLinecap="round" />
        <circle cx="9.2" cy="10.2" r="0.8" fill="currentColor" stroke="none" />
        <circle cx="14.8" cy="10.2" r="0.8" fill="currentColor" stroke="none" />
      </Icon>
    ),
  },
  {
    id: 'people',
    icon: (
      <Icon>
        <circle cx="12" cy="8.2" r="2.5" />
        <path d="M6.8 18.2c.6-2.6 2.6-4 5.2-4s4.6 1.4 5.2 4" strokeLinecap="round" />
      </Icon>
    ),
  },
  {
    id: 'animals',
    icon: (
      <Icon>
        <path d="M7 10.2 5.2 6.8c.9.1 1.8.5 2.3 1.2" strokeLinecap="round" />
        <path d="M17 10.2 18.8 6.8c-.9.1-1.8.5-2.3 1.2" strokeLinecap="round" />
        <path d="M8 10.5c.8-1.6 2-2.4 4-2.4s3.2.8 4 2.4c.7 1.4.4 4.2-1.2 5.6-.8.7-1.8 1-2.8 1s-2-.3-2.8-1C7.6 14.7 7.3 11.9 8 10.5Z" />
        <circle cx="10" cy="12.2" r="0.6" fill="currentColor" stroke="none" />
        <circle cx="14" cy="12.2" r="0.6" fill="currentColor" stroke="none" />
      </Icon>
    ),
  },
  {
    id: 'food',
    icon: (
      <Icon>
        <path d="M12 7.2c2.6 2.2 4 4.2 4 6.3a4 4 0 1 1-8 0c0-2.1 1.4-4.1 4-6.3Z" />
        <path d="M12.2 6.6c.8-1.5 2.2-2.2 3.4-2" strokeLinecap="round" />
      </Icon>
    ),
  },
  {
    id: 'travel',
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="8" />
        <path d="M4 12h16M12 4c2.2 2.4 3.3 5 3.3 8S14.2 17.6 12 20c-2.2-2.4-3.3-5-3.3-8S9.8 6.4 12 4Z" />
      </Icon>
    ),
  },
  {
    id: 'places',
    icon: (
      <Icon>
        <path d="M12 21s6-5.1 6-10a6 6 0 1 0-12 0c0 4.9 6 10 6 10Z" />
        <circle cx="12" cy="11" r="1.7" />
      </Icon>
    ),
  },
];

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16.5 20 20.5" strokeLinecap="round" />
  </svg>
);

const AnimationEmojModal = forwardRef(({ lang, onClose }, ref) => {
  const text = copy(lang);
  const [tab, setTab] = useState('animation');
  const [query, setQuery] = useState('');
  const [emojiCat, setEmojiCat] = useState('recent');
  const [chip, setChip] = useState('recent');
  const [dragY, setDragY] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(() => !isMobileViewport());
  const [exiting, setExiting] = useState(false);
  const startYRef = useRef(0);
  const dragYRef = useRef(0);
  const draggedRef = useRef(false);
  const exitingRef = useRef(false);
  const closeTimerRef = useRef(null);
  const sheetRef = useRef(null);
  const gapRef = useRef(0);
  const composerSpanRef = useRef(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const finishClose = useCallback(() => {
    onCloseRef.current?.();
  }, []);

  const requestClose = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    if (!isMobileViewport()) {
      finishClose();
      return;
    }
    setExiting(true);
    setSheetOpen(false);
    setDragY(0);
    dragYRef.current = 0;
    closeTimerRef.current = window.setTimeout(finishClose, CLOSE_MS);
  }, [finishClose]);

  const { releaseHistory } = useModalHardwareBack({
    historyKey: 'animationEmoj',
    isOpen: true,
    onCloseFromHardware: requestClose,
  });

  const closeFromUi = useCallback(() => {
    requestClose();
    releaseHistory();
  }, [releaseHistory, requestClose]);

  useImperativeHandle(ref, () => ({ close: closeFromUi }), [closeFromUi]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    },
    []
  );

  useEffect(() => {
    if (!isMobileViewport()) {
      setSheetOpen(true);
      return undefined;
    }
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setSheetOpen(true));
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') closeFromUi();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeFromUi]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const mobile = isMobileViewport();
    if (mobile && composerSpanRef.current === 0) {
      const composer = document.querySelector('.chat-composer-wrap');
      const field = composer?.querySelector('.chat-composer');
      if (composer && field) {
        const keyboardLift = parseFloat(getComputedStyle(root).getPropertyValue('--chat-keyboard-lift')) || 0;
        const rect = composer.getBoundingClientRect();
        const fieldRect = field.getBoundingClientRect();
        const tail = Math.max(0, rect.bottom - fieldRect.bottom);
        gapRef.current = Math.max(0, window.innerHeight - (rect.bottom + keyboardLift)) + tail;
        composerSpanRef.current = field.offsetHeight + gapRef.current;
      }
    }
    root.style.setProperty('--chat-emoji-composer', `${composerSpanRef.current}px`);
    const sheetH = sheetRef.current?.offsetHeight || 0;
    const lift = mobile && sheetOpen && !exiting ? Math.max(0, sheetH - gapRef.current - dragY) : 0;
    if (mobile && dragY > 0 && !exiting) root.classList.add('chat-emoji-dragging');
    else root.classList.remove('chat-emoji-dragging');
    root.style.setProperty('--chat-emoji-lift', `${lift}px`);
  }, [sheetOpen, exiting, dragY]);

  useEffect(
    () => () => {
      const root = document.documentElement;
      root.style.removeProperty('--chat-emoji-lift');
      root.style.removeProperty('--chat-emoji-composer');
      root.classList.remove('chat-emoji-dragging');
    },
    []
  );

  const handleTouchStart = (event) => {
    if (exitingRef.current || !isMobileViewport()) return;
    startYRef.current = event.touches[0].clientY;
    dragYRef.current = 0;
    draggedRef.current = false;
  };

  const handleTouchMove = (event) => {
    if (exitingRef.current || !isMobileViewport()) return;
    const diff = event.touches[0].clientY - startYRef.current;
    if (diff > 0) {
      if (diff > 8) draggedRef.current = true;
      dragYRef.current = diff;
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (exitingRef.current) return;
    if (dragYRef.current > CLOSE_DRAG_PX) {
      closeFromUi();
      return;
    }
    dragYRef.current = 0;
    setDragY(0);
  };

  const swallowDragClick = (event) => {
    if (!draggedRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    draggedRef.current = false;
  };

  const selectTab = (id) => {
    setTab(id);
    setQuery('');
  };

  const overlayClass = [
    'anim-emoji-overlay',
    sheetOpen ? 'anim-emoji-overlay--open' : '',
    exiting ? 'anim-emoji-overlay--closing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const modalClass = [
    'anim-emoji-modal',
    sheetOpen ? 'anim-emoji-modal--open' : '',
    dragY > 0 && !exiting ? 'anim-emoji-modal--dragging' : '',
    exiting ? 'anim-emoji-modal--closing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const searchPlaceholder = text.search[tab] || text.search.emoji;

  return createPortal(
    <>
      <div className={overlayClass} onClick={closeFromUi} />
      <div
        ref={sheetRef}
        className={modalClass}
        style={{ '--drag-y': `${dragY}px` }}
        role="dialog"
        aria-modal="true"
        aria-label={text.title}
      >
        <div
          className="anim-emoji-sheet-top"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onClickCapture={swallowDragClick}
        >
          <div className="anim-emoji-handle" aria-hidden="true" />
          <div className="anim-emoji-tabs" role="tablist">
            {text.tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={`anim-emoji-tab${tab === item.id ? ' is-on' : ''}`}
                onClick={() => selectTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button type="button" className="anim-emoji-close" aria-label={text.close} onClick={closeFromUi}>
            ×
          </button>
        </div>

        <label className="anim-emoji-search">
          <SearchIcon />
          <input
            value={query}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        {tab === 'emoji' ? (
          <div className="anim-emoji-icons" role="tablist">
            {EMOJI_CATS.map((item, index) => (
              <React.Fragment key={item.id}>
                <button
                  type="button"
                  className={`anim-emoji-icon-btn${emojiCat === item.id ? ' is-on' : ''}`}
                  aria-label={item.id === 'recent' ? text.recent : item.id}
                  aria-selected={emojiCat === item.id}
                  onClick={() => setEmojiCat(item.id)}
                >
                  {item.icon}
                </button>
                {index === 0 ? <span className="anim-emoji-icon-split" aria-hidden="true" /> : null}
              </React.Fragment>
            ))}
          </div>
        ) : null}

        {tab === 'animation' ? (
          <div className="anim-emoji-chips" role="tablist">
            {text.chips.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`anim-emoji-chip${chip === item.id ? ' is-on' : ''}`}
                aria-selected={chip === item.id}
                onClick={() => setChip(item.id)}
              >
                {item.id === 'recent' ? <ClockIcon /> : null}
                {item.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="anim-emoji-body">
          {tab === 'emoji' ? (
            <>
              <p className="anim-emoji-section">{text.used}</p>
              <div className="anim-emoji-grid" />
              <p className="anim-emoji-section">{text.smiles}</p>
              <div className="anim-emoji-grid" />
            </>
          ) : (
            <div className={`anim-emoji-grid${tab === 'animation' ? ' is-large' : ''}`} />
          )}
        </div>
      </div>
    </>,
    document.body
  );
});

AnimationEmojModal.displayName = 'AnimationEmojModal';

export default AnimationEmojModal;
