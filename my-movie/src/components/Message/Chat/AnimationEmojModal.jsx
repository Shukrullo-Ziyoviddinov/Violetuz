import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useModalHardwareBack } from '../../../useModalHardwareBack';
import {
  CHAT_EMOJIS,
  emojiFromId,
  emojiMatches,
  emojiMotion,
  emojiStill,
  readRecentEmojiIds,
  rememberEmoji,
} from './chatEmojis';
import {
  CHAT_ANIMATIONS,
  FEATURED_ANIMATIONS,
  animationMatches,
  readRecentAnimationIds,
  rememberAnimation,
} from './chatAnimations';
import ChatLottie from './ChatLottie';
import ChatGif from './ChatGif';
import {
  CHAT_GIFS,
  gifByFile,
  gifMatches,
  readRecentGifIds,
  rememberGif,
} from './chatGifs';
import './AnimationEmojModal.css';

const CLOSE_MS = 340;
const CLOSE_DRAG_PX = 80;
const OPEN_GAP_PX = 10;

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
    empty: ru ? 'Ничего не найдено' : 'Topilmadi',
    emptyRecent: ru ? 'Пока пусто' : 'Hali tanlanmagan',
    send: ru ? 'Отправить' : 'Yuborish',
    cancel: ru ? 'Отмена' : 'Bekor qilish',
    groups: {
      recent: ru ? 'ИСПОЛЬЗОВАННЫЕ' : 'ISHLATILGANLAR',
      smile: ru ? 'УЛЫБКИ' : 'TABASSUMLAR',
      people: ru ? 'ЛЮДИ' : 'ODAMLAR',
      animals: ru ? 'ЖИВОТНЫЕ' : 'HAYVONLAR',
      food: ru ? 'ЕДА' : 'OVQAT',
      travel: ru ? 'ДОРОГА' : 'SAYOHAT',
      places: ru ? 'МЕСТА' : 'JOYLAR',
      activity: ru ? 'СПОРТ' : 'SPORT',
      objects: ru ? 'ПРЕДМЕТЫ' : 'BUYUMLAR',
      symbols: ru ? 'СИМВОЛЫ' : 'BELGILAR',
      flags: ru ? 'ФЛАГИ' : 'BAYROQLAR',
      weather: ru ? 'ПОГОДА' : 'OB-HAVO',
      gesture: ru ? 'ЖЕСТЫ' : 'IMO-ISHORA',
    },
    chips: [
      { id: 'recent', label: ru ? 'Недавние' : 'So‘nggi' },
      { id: 'laugh', label: ru ? 'Смех' : 'Kulgi' },
      { id: 'love', label: ru ? 'Любовь' : 'Sevgi' },
      { id: 'cinema', label: ru ? 'Кино' : 'Kino' },
      { id: 'emotion', label: ru ? 'Эмоции' : 'Hayajon' },
    ],
    gifChips: [
      { id: 'recent', label: ru ? 'Недавние' : 'So‘nggi' },
      { id: 'laugh', label: ru ? 'Смех' : 'Kulgi' },
      { id: 'shock', label: ru ? 'Удивление' : 'Hayron' },
      { id: 'love', label: ru ? 'Любовь' : 'Sevgi' },
      { id: 'fear', label: ru ? 'Страх' : 'Qo‘rquv' },
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
  {
    id: 'activity',
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8.2v7.6M8.2 12h7.6" strokeLinecap="round" />
      </Icon>
    ),
  },
  {
    id: 'objects',
    icon: (
      <Icon>
        <path d="M9 18h6M10 21h4" strokeLinecap="round" />
        <path d="M8.2 14.5a5 5 0 1 1 7.6 0" strokeLinecap="round" />
      </Icon>
    ),
  },
  {
    id: 'symbols',
    icon: (
      <Icon>
        <path d="M12 19.2s-5.2-3.2-5.2-7.1A2.9 2.9 0 0 1 12 9.6a2.9 2.9 0 0 1 5.2 2.5c0 3.9-5.2 7.1-5.2 7.1Z" />
      </Icon>
    ),
  },
  {
    id: 'flags',
    icon: (
      <Icon>
        <path d="M7 20.5V4.5" strokeLinecap="round" />
        <path d="M7 5.2h9.2l-1.6 3.1 1.6 3.1H7" strokeLinejoin="round" />
      </Icon>
    ),
  },
  {
    id: 'weather',
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 4.2v1.8M12 18v1.8M4.2 12h1.8M18 12h1.8M6.4 6.4l1.3 1.3M16.3 16.3l1.3 1.3M17.6 6.4l-1.3 1.3M7.7 16.3l-1.3 1.3" strokeLinecap="round" />
      </Icon>
    ),
  },
  {
    id: 'gesture',
    icon: (
      <Icon>
        <path d="M9.2 11.2V7.4a1.3 1.3 0 0 1 2.6 0V11" strokeLinecap="round" />
        <path d="M11.8 10.6V6.2a1.3 1.3 0 0 1 2.6 0v5.2" strokeLinecap="round" />
        <path d="M8 12.2c0 3.4 1.6 6.2 4 6.2s4.2-2.4 4.2-5.2V9.2a1.2 1.2 0 0 0-2.4 0" strokeLinecap="round" />
      </Icon>
    ),
  },
];

const EmojiCell = ({ emoji, onPick, onHold, onRelease }) => {
  const [photo, setPhoto] = useState('wait');
  const ready = photo === 'ready';
  const holdTimerRef = useRef(null);
  const clearHold = () => {
    window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
  };
  const pressEmoji = (event) => {
    if (event.button != null && event.button !== 0) return;
    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;
    clearHold();
    holdTimerRef.current = window.setTimeout(() => {
      if (!moved) onHold(emoji);
    }, 160);
    const move = (next) => {
      if (Math.hypot(next.clientX - startX, next.clientY - startY) <= 12) return;
      moved = true;
      clearHold();
    };
    const end = () => {
      clearHold();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      onRelease();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };
  return (
    <button type="button" className="anim-emoji-cell" aria-label={emoji.char} onPointerDown={pressEmoji} onClick={() => onPick(emoji)}>
      <span className={ready ? 'is-hidden' : ''}>{emoji.char}</span>
      {photo !== 'off' ? (
        <img
          src={emojiStill(emoji.id)}
          alt=""
          draggable="false"
          className={ready ? 'is-in' : ''}
          onLoad={() => setPhoto('ready')}
          onError={() => setPhoto('off')}
        />
      ) : null}
    </button>
  );
};

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16.5 20 20.5" strokeLinecap="round" />
  </svg>
);

const AnimationEmojModal = forwardRef(({ lang, onClose, onPick, onSendAnimation, onSendGif }, ref) => {
  const text = copy(lang);
  const [tab, setTab] = useState('animation');
  const [query, setQuery] = useState('');
  const [emojiCat, setEmojiCat] = useState('recent');
  const [recentIds, setRecentIds] = useState(readRecentEmojiIds);
  const [burst, setBurst] = useState(null);
  const [chip, setChip] = useState('recent');
  const [gifChip, setGifChip] = useState('shock');
  const [animRecent, setAnimRecent] = useState(readRecentAnimationIds);
  const [gifRecent, setGifRecent] = useState(readRecentGifIds);
  const [stage, setStage] = useState(null);
  const [liveTint, setLiveTint] = useState('');
  const stageAtRef = useRef(0);
  const [dragY, setDragY] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(() => !isMobileViewport());
  const [exiting, setExiting] = useState(false);
  const startYRef = useRef(0);
  const dragYRef = useRef(0);
  const draggedRef = useRef(false);
  const exitingRef = useRef(false);
  const closeTimerRef = useRef(null);
  const sheetRef = useRef(null);
  const bodyRef = useRef(null);
  const [scrollRoot, setScrollRoot] = useState(null);
  const setBody = useCallback((node) => {
    bodyRef.current = node;
    setScrollRoot(node);
  }, []);
  const gapRef = useRef(0);
  const composerSpanRef = useRef(0);
  const burstTimerRef = useRef(null);
  const burstTokenRef = useRef(0);
  const burstEmojiRef = useRef('');
  const heldRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if ((tab === 'animation' || tab === 'gif') && bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [chip, gifChip, query, tab]);

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
    hasNested: Boolean(stage),
    onNestedBack: () => setStage(null),
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
      if (event.key !== 'Escape') return;
      if (stage) {
        setStage(null);
        return;
      }
      closeFromUi();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeFromUi, stage]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const mobile = isMobileViewport();
    if (mobile && composerSpanRef.current === 0) {
      const composer = document.querySelector('.chat-composer-wrap');
      const field = composer?.querySelector('.chat-composer');
      if (composer && field) {
        const keyboardLift = parseFloat(getComputedStyle(root).getPropertyValue('--chat-input-lift')) || 0;
        const rect = composer.getBoundingClientRect();
        const fieldRect = field.getBoundingClientRect();
        const tail = Math.max(0, rect.bottom - fieldRect.bottom);
        gapRef.current = Math.max(0, window.innerHeight - (rect.bottom + keyboardLift)) + tail;
        composerSpanRef.current = field.offsetHeight + gapRef.current;
        root.style.setProperty('--chat-emoji-field', `${field.offsetHeight}px`);
      }
    }
    root.style.setProperty('--chat-emoji-composer', `${composerSpanRef.current}px`);
    const fieldHeight = document.querySelector('.chat-composer')?.offsetHeight || 0;
    if (fieldHeight) root.style.setProperty('--chat-emoji-field', `${fieldHeight}px`);
    const sheetH = sheetRef.current?.offsetHeight || 0;
    const openLift = Math.max(0, sheetH - gapRef.current + OPEN_GAP_PX);
    if (mobile && openLift) root.style.setProperty('--chat-emoji-span', `${openLift}px`);
    else root.style.setProperty('--chat-emoji-span', '0px');
    const progress = mobile && sheetOpen && !exiting && sheetH > 0
      ? Math.max(0, Math.min(1, 1 - dragY / sheetH))
      : 0;
    root.classList.toggle('chat-emoji-dragging', mobile && dragY > 0 && !exiting);
    root.style.setProperty('--chat-emoji-progress', String(progress));
  }, [sheetOpen, exiting, dragY]);

  useEffect(
    () => () => {
      const root = document.documentElement;
      root.style.removeProperty('--chat-emoji-progress');
      root.style.removeProperty('--chat-emoji-span');
      root.style.removeProperty('--chat-emoji-composer');
      root.style.removeProperty('--chat-emoji-field');
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

  useEffect(() => () => window.clearTimeout(burstTimerRef.current), []);

  const openBurst = (emoji) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (burstEmojiRef.current === emoji.id) return;
    const token = burstTokenRef.current + 1;
    burstTokenRef.current = token;
    burstEmojiRef.current = emoji.id;
    setBurst({ id: emoji.id, token, leaving: false });
    window.clearTimeout(burstTimerRef.current);
    const leave = () => {
      if (heldRef.current && burstTokenRef.current === token) {
        burstTimerRef.current = window.setTimeout(leave, 120);
        return;
      }
      setBurst((current) => (current?.token === token ? { ...current, leaving: true } : current));
      burstTimerRef.current = window.setTimeout(() => {
        if (burstTokenRef.current === token) burstEmojiRef.current = '';
        setBurst((current) => (current?.token === token ? null : current));
      }, 320);
    };
    burstTimerRef.current = window.setTimeout(leave, 1500);
  };

  const previewEmoji = (emoji) => {
    heldRef.current = true;
    openBurst(emoji);
  };

  const releaseEmoji = () => {
    heldRef.current = false;
  };

  const pickEmoji = (emoji) => {
    setRecentIds(rememberEmoji(emoji.id));
    onPick?.(emoji.char);
    openBurst(emoji);
  };

  const emojiPool = emojiCat === 'recent'
    ? recentIds.map((id) => emojiFromId(id)).filter(Boolean)
    : CHAT_EMOJIS.filter((item) => item.cat === emojiCat);
  const shownEmoji = emojiPool.filter((item) => emojiMatches(item, query));
  const animPool = chip === 'recent'
    ? (animRecent.length
      ? animRecent.map((id) => CHAT_ANIMATIONS.find((item) => item.id === id)).filter(Boolean)
      : FEATURED_ANIMATIONS)
    : CHAT_ANIMATIONS.filter((item) => item.cat === chip);
  const shownAnim = animPool.filter((item) => animationMatches(item, query));
  const gifPool = gifChip === 'recent'
    ? gifRecent.map((file) => gifByFile(file)).filter(Boolean)
    : CHAT_GIFS.filter((item) => item.cat === gifChip);
  const shownGif = gifPool.filter((item) => gifMatches(item, query));

  const openStage = (item) => {
    stageAtRef.current = Date.now();
    setLiveTint('');
    setStage(item);
  };

  const sendStage = () => {
    if (!stage || Date.now() - stageAtRef.current < 450) return;
    if (stage.kind === 'gif') {
      setGifRecent(rememberGif(stage.file));
      onSendGif?.(stage);
    } else {
      setAnimRecent(rememberAnimation(stage.id));
      onSendAnimation?.(stage);
    }
    setStage(null);
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
          <div className="anim-emoji-tabs">
            <div
              className="anim-emoji-tab-row"
              role="tablist"
              style={{ '--tab-index': text.tabs.findIndex((item) => item.id === tab) }}
            >
              <span className="anim-emoji-tab-glide" aria-hidden="true" />
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
                  aria-label={text.groups[item.id] || item.id}
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

        {tab === 'animation' || tab === 'gif' ? (
          <div className="anim-emoji-chips" role="tablist">
            {(tab === 'gif' ? text.gifChips : text.chips).map((item) => (
              <button
                key={item.id}
                type="button"
                className={`anim-emoji-chip${(tab === 'gif' ? gifChip : chip) === item.id ? ' is-on' : ''}`}
                aria-selected={(tab === 'gif' ? gifChip : chip) === item.id}
                onClick={() => (tab === 'gif' ? setGifChip(item.id) : setChip(item.id))}
              >
                {item.id === 'recent' ? <ClockIcon /> : null}
                {item.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="anim-emoji-body" ref={setBody}>
          {tab === 'emoji' ? (
            <>
              <p className="anim-emoji-section">{text.groups[emojiCat] || text.used}</p>
              {shownEmoji.length ? (
                <div className="anim-emoji-grid is-emoji">
                  {shownEmoji.map((emoji) => (
                    <EmojiCell key={emoji.id} emoji={emoji} onPick={pickEmoji} onHold={previewEmoji} onRelease={releaseEmoji} />
                  ))}
                </div>
              ) : (
                <p className="anim-emoji-empty">{query.trim() ? text.empty : text.emptyRecent}</p>
              )}
            </>
          ) : tab === 'animation' && shownAnim.length ? (
            <div className="anim-emoji-grid is-large">
              {shownAnim.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="anim-emoji-cell is-motion"
                  aria-label={item.name}
                  onClick={() => openStage(item)}
                >
                  <ChatLottie id={item.id} className="anim-lottie" label={item.name} root={scrollRoot} />
                </button>
              ))}
            </div>
          ) : tab === 'animation' ? (
            <p className="anim-emoji-empty">{query.trim() ? text.empty : text.emptyRecent}</p>
          ) : tab === 'gif' && shownGif.length ? (
            <div className="anim-emoji-grid is-large">
              {shownGif.map((item) => (
                <button
                  key={item.file}
                  type="button"
                  className="anim-emoji-cell is-motion"
                  aria-label={item.name}
                  onClick={() => openStage({ ...item, kind: 'gif' })}
                >
                  <ChatGif file={item.file} className="anim-lottie" label={item.name} root={scrollRoot} />
                </button>
              ))}
            </div>
          ) : (
            <p className="anim-emoji-empty">{query.trim() || gifChip !== 'recent' ? text.empty : text.emptyRecent}</p>
          )}
        </div>
      </div>
      {stage ? (
        <div
          className="anim-stage"
          style={{ background: `radial-gradient(circle at 50% 38%, ${(stage.kind === 'gif' && liveTint) || stage.tint} 0%, #14081c 58%, #07060c 100%)` }}
        >
          {stage.kind === 'gif'
            ? <ChatGif file={stage.file} className="anim-stage-art" label={stage.name} onColor={setLiveTint} />
            : <ChatLottie id={stage.id} className="anim-stage-art" label={stage.name} />}
          <div className="anim-stage-actions">
            <button type="button" className="anim-stage-cancel" aria-label={text.cancel} onClick={() => setStage(null)}>
              ×
            </button>
            <button type="button" className="anim-stage-send" style={{ background: (stage.kind === 'gif' && liveTint) || stage.tint }} onClick={sendStage}>
              {text.send}
            </button>
          </div>
        </div>
      ) : null}
      {burst ? (
        <img
          key={burst.token}
          className={`anim-emoji-burst${burst.leaving ? ' is-leaving' : ''}`}
          src={emojiMotion(burst.id)}
          alt=""
          onError={() => setBurst(null)}
        />
      ) : null}
    </>,
    document.body
  );
});

AnimationEmojModal.displayName = 'AnimationEmojModal';

export default AnimationEmojModal;
