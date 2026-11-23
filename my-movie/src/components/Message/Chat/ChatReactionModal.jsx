import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CHAT_EMOJIS, emojiFromId, emojiMatches, readRecentEmojiIds, rememberEmoji } from './chatEmojis';
import './ChatReactionModal.css';

const GROUPS = {
  recent: ['ISHLATILGANLAR', 'ИСПОЛЬЗОВАННЫЕ'],
  smile: ['TABASSUMLAR', 'УЛЫБКИ'],
  people: ['ODAMLAR', 'ЛЮДИ'],
  animals: ['HAYVONLAR', 'ЖИВОТНЫЕ'],
  food: ['OVQAT', 'ЕДА'],
  travel: ['SAYOHAT', 'ДОРОГА'],
  places: ['JOYLAR', 'МЕСТА'],
  activity: ['SPORT', 'СПОРТ'],
  objects: ['BUYUMLAR', 'ПРЕДМЕТЫ'],
  symbols: ['BELGILAR', 'СИМВОЛЫ'],
  flags: ['BAYROQLAR', 'ФЛАГИ'],
  weather: ['OB-HAVO', 'ПОГОДА'],
  gesture: ['IMO-ISHORA', 'ЖЕСТЫ'],
};

const CATS = ['smile', 'people', 'animals', 'food', 'travel', 'places', 'activity', 'objects', 'symbols', 'flags', 'weather', 'gesture'];
const CLOSE_MS = 340;
const CLOSE_DRAG_PX = 80;

const iconOf = (id) => CHAT_EMOJIS.find((item) => item.cat === id)?.char || '•';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ChatReactionModal = forwardRef(({ lang, onClose, onPick }, ref) => {
  const ru = lang === 'ru';
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('smile');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [exiting, setExiting] = useState(false);
  const recent = useMemo(() => readRecentEmojiIds(), []);
  const recentItems = recent.map((id) => emojiFromId(id)).filter(Boolean);
  const needle = query.trim();
  const shown = useMemo(() => {
    if (needle) return CHAT_EMOJIS.filter((item) => emojiMatches(item, needle));
    if (cat === 'recent') return recentItems;
    return CHAT_EMOJIS.filter((item) => item.cat === cat);
  }, [needle, cat, recentItems]);
  const title = GROUPS[cat] || GROUPS.smile;
  const modalRef = useRef(null);
  const sheetRef = useRef(null);
  const startYRef = useRef(0);
  const pointerRef = useRef(null);
  const dragYRef = useRef(0);
  const draggedRef = useRef(false);
  const exitingRef = useRef(false);
  const closeTimerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const finishClose = useCallback(() => {
    onCloseRef.current?.();
  }, []);

  const requestClose = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    if (reducedMotion()) {
      finishClose();
      return;
    }
    setExiting(true);
    setSheetOpen(false);
    setDragY(0);
    dragYRef.current = 0;
    closeTimerRef.current = window.setTimeout(finishClose, CLOSE_MS);
  }, [finishClose]);

  useImperativeHandle(ref, () => ({ close: requestClose }), [requestClose]);

  useEffect(() => () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
  }, []);

  useEffect(() => {
    if (reducedMotion()) {
      setSheetOpen(true);
      return undefined;
    }
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setSheetOpen(true));
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  useLayoutEffect(() => {
    const node = modalRef.current;
    if (!node) return;
    const sheetH = sheetRef.current?.offsetHeight || 0;
    const progress = sheetOpen && !exiting && sheetH > 0
      ? Math.max(0, Math.min(1, 1 - dragY / sheetH))
      : 0;
    node.style.setProperty('--chat-react-progress', String(progress));
    node.classList.toggle('is-dragging', dragY > 0 && !exiting);
  }, [sheetOpen, exiting, dragY]);

  const choose = (item) => {
    rememberEmoji(item.id);
    onPick?.(item);
  };

  const handlePointerDown = (event) => {
    if (exitingRef.current || event.button !== 0) return;
    pointerRef.current = event.pointerId;
    startYRef.current = event.clientY;
    dragYRef.current = 0;
    draggedRef.current = false;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* ignore */ }
  };

  const handlePointerMove = (event) => {
    if (exitingRef.current || pointerRef.current !== event.pointerId) return;
    const diff = event.clientY - startYRef.current;
    if (diff <= 0) return;
    if (diff > 8) draggedRef.current = true;
    dragYRef.current = diff;
    setDragY(diff);
  };

  const handlePointerEnd = (event) => {
    if (pointerRef.current !== event.pointerId) return;
    pointerRef.current = null;
    if (exitingRef.current) return;
    if (dragYRef.current > CLOSE_DRAG_PX) {
      requestClose();
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

  return createPortal(
    <div
      ref={modalRef}
      className={`chat-react-modal${sheetOpen ? ' is-open' : ''}${exiting ? ' is-closing' : ''}`}
      role="presentation"
      onClick={requestClose}
    >
      <div
        ref={sheetRef}
        className="chat-react-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={ru ? 'Выберите реакцию' : 'Reaksiya tanlang'}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="chat-react-sheet-top"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onClickCapture={swallowDragClick}
        >
          <span className="chat-react-grab" aria-hidden="true" />
          <div className="chat-react-head">
            <h2>{ru ? 'Выберите реакцию' : 'Reaksiya tanlang'}</h2>
            <button type="button" className="chat-react-close" onClick={requestClose} aria-label={ru ? 'Закрыть' : 'Yopish'}>×</button>
          </div>
        </div>
        <label className="chat-react-search">
          <span aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={ru ? 'Поиск реакции' : 'Reaksiya qidirish'}
          />
        </label>
        {needle ? null : (
          <div className="chat-react-cats" role="tablist">
            <button
              type="button"
              className={cat === 'recent' ? 'is-on' : ''}
              aria-label={ru ? GROUPS.recent[1] : GROUPS.recent[0]}
              onClick={() => setCat('recent')}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8.2V12l2.6 1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="chat-react-split" aria-hidden="true" />
            {CATS.map((id) => (
              <button
                key={id}
                type="button"
                className={id === cat ? 'is-on' : ''}
                aria-label={ru ? GROUPS[id][1] : GROUPS[id][0]}
                onClick={() => setCat(id)}
              >
                {iconOf(id)}
              </button>
            ))}
          </div>
        )}
        <div className="chat-react-body">
          <p className="chat-react-label">{needle ? (ru ? 'НАЙДЕНО' : 'TOPILDI') : (ru ? title[1] : title[0])}</p>
          <div className="chat-react-grid">
            {shown.map((item) => (
              <button key={item.id} type="button" className="chat-react-cell" onClick={() => choose(item)}>
                <span>{item.char}</span>
              </button>
            ))}
          </div>
          {recentItems.length && !needle && cat !== 'recent' ? (
            <>
              <p className="chat-react-label">{ru ? GROUPS.recent[1] : GROUPS.recent[0]}</p>
              <div className="chat-react-recent">
                {recentItems.map((item) => (
                  <button key={`recent-${item.id}`} type="button" onClick={() => choose(item)}>
                    {item.char}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
});

export default ChatReactionModal;
