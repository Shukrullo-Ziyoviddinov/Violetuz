import React, { useCallback, useEffect, useRef, useState } from 'react';
import { bubbleFill } from './chatBubbles';
import {
  DEFAULT_TEXT,
  TEXT_COLORS,
  TEXT_LOOKS,
  normalizeTextHex,
  writeTextChoice,
} from './chatTextFont';
import ChatCustomColorModal from './ChatCustomColorModal';
import './ChatTextFontModal.css';

const CLOSE_MS = 340;

const isMobileViewport = () =>
  typeof window !== 'undefined' && window.innerWidth <= 768;

const ChatTextFontModal = ({
  initial,
  previewImage,
  incoming,
  outgoing,
  mode = 'solid',
  onClose,
  onApply,
  closeRef,
}) => {
  const startColor = normalizeTextHex(initial?.color) || DEFAULT_TEXT.color;
  const startLook = TEXT_LOOKS.some((item) => item.id === initial?.look) ? initial.look : DEFAULT_TEXT.look;
  const [color, setColor] = useState(startColor);
  const [look, setLook] = useState(startLook);
  const [showCustom, setShowCustom] = useState(false);
  const customCloseRef = useRef(null);
  const [dragY, setDragY] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(() => !isMobileViewport());
  const [exiting, setExiting] = useState(false);
  const colorRef = useRef(color);
  const lookRef = useRef(look);
  const exitingRef = useRef(false);
  const dragYRef = useRef(0);
  const startYRef = useRef(0);
  const closeTimerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const onApplyRef = useRef(onApply);
  colorRef.current = color;
  lookRef.current = look;
  onCloseRef.current = onClose;
  onApplyRef.current = onApply;

  const requestClose = useCallback(() => {
    if (customCloseRef.current) {
      customCloseRef.current();
      return;
    }
    if (exitingRef.current) return;
    if (!isMobileViewport()) {
      onCloseRef.current?.();
      return;
    }
    exitingRef.current = true;
    setExiting(true);
    setSheetOpen(false);
    setDragY(0);
    dragYRef.current = 0;
    closeTimerRef.current = window.setTimeout(() => {
      onCloseRef.current?.();
    }, CLOSE_MS);
  }, []);

  if (closeRef) closeRef.current = requestClose;

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

  useEffect(
    () => () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      if (closeRef) closeRef.current = null;
    },
    [closeRef]
  );

  const applyHex = (value) => {
    const next = normalizeTextHex(value);
    if (!next) return;
    colorRef.current = next;
    setColor(next);
  };

  const handleTouchStart = (event) => {
    if (exitingRef.current) return;
    startYRef.current = event.touches[0].clientY;
    dragYRef.current = 0;
  };

  const handleTouchMove = (event) => {
    if (exitingRef.current || !isMobileViewport()) return;
    const diff = event.touches[0].clientY - startYRef.current;
    if (diff > 0) {
      dragYRef.current = diff;
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (exitingRef.current) return;
    if (dragYRef.current > 80) {
      requestClose();
      return;
    }
    dragYRef.current = 0;
    setDragY(0);
  };

  const confirm = () => {
    const saved = writeTextChoice({ color: colorRef.current, look: lookRef.current });
    onApplyRef.current?.(saved);
    requestClose();
  };

  const sampleStyle = (kind) => {
    const paint = { color };
    if (kind === 'glow') {
      paint.textShadow = `0 0 8px ${color}, 0 0 18px ${color}`;
    }
    if (kind === 'outline') {
      paint.WebkitTextStroke = `1px ${color}`;
      paint.textShadow = `0 0 6px ${color}`;
    }
    return paint;
  };

  const overlayClass = [
    'chat-text-font-backdrop',
    sheetOpen ? 'chat-text-font-backdrop--open' : '',
    exiting ? 'chat-text-font-backdrop--closing' : '',
  ].filter(Boolean).join(' ');

  const modalClass = [
    'chat-text-font',
    sheetOpen && !exiting ? 'chat-text-font--open' : '',
    dragY > 0 && !exiting ? 'chat-text-font--dragging' : '',
    exiting ? 'chat-text-font--closing' : '',
  ].filter(Boolean).join(' ');

  const inFill = { background: bubbleFill(incoming, mode) };
  const outFill = { background: bubbleFill(outgoing, mode) };

  return (
    <>
      <div className={overlayClass} onClick={requestClose} />
      <div
        className={modalClass}
        style={{ '--drag-y': `${dragY}px` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-text-font-title"
      >
        <div
          className="chat-text-font-top"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <div className="chat-text-font-handle" aria-hidden="true" />
          <div className="chat-text-font-header">
            <h2 id="chat-text-font-title">Xabar matni rangi</h2>
            <button
              type="button"
              className="chat-text-font-close"
              onClick={requestClose}
              aria-label="Yopish"
            >
              ×
            </button>
          </div>
        </div>

        <div className="chat-text-font-body">
          <div
            className="chat-text-font-preview"
            style={previewImage ? { backgroundImage: `url(${previewImage})` } : undefined}
          >
            <div className="chat-text-font-bubble chat-text-font-bubble--in">
              <span className="chat-text-font-avatar" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="8" r="4" />
                </svg>
              </span>
              <span className="chat-text-font-card" style={inFill}>
                <span style={sampleStyle(look)}>Salom! <span aria-hidden="true">👋</span></span>
                <span className="chat-text-font-time">20:45</span>
              </span>
            </div>
            <span className="chat-text-font-card chat-text-font-card--out" style={outFill}>
              <span style={sampleStyle(look)}>Qanday yangiliklar? <span aria-hidden="true">😎</span></span>
              <span className="chat-text-font-time">
                20:46
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="4 12 9 17 20 6" />
                </svg>
              </span>
            </span>
          </div>

          <h3 className="chat-text-font-label">Matn rangi tanlang</h3>
          <div className="chat-text-font-grid">
            {TEXT_COLORS.map((item) => {
              const selected = item.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={item}
                  type="button"
                  className={`chat-text-font-swatch${selected ? ' is-on' : ''}`}
                  aria-label={item}
                  aria-pressed={selected}
                  onClick={() => applyHex(item)}
                >
                  <span style={{ color: item }}>Aa</span>
                  {selected ? (
                    <span className="chat-text-font-check" aria-hidden="true">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <h3 className="chat-text-font-label">Maxsus rang</h3>
          <button type="button" className="chat-text-font-hex" onClick={() => setShowCustom(true)}>
            <span className="chat-text-font-rainbow" aria-hidden="true" />
            <span className="chat-text-font-hex-value">{color}</span>
            <svg className="chat-text-font-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <h3 className="chat-text-font-label">Qorong‘ilikdagi ko‘rinishi</h3>
          <div className="chat-text-font-looks">
            {TEXT_LOOKS.map((item) => {
              const selected = item.id === look;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`chat-text-font-look${selected ? ' is-on' : ''}`}
                  aria-pressed={selected}
                  onClick={() => {
                    lookRef.current = item.id;
                    setLook(item.id);
                  }}
                >
                  <span className="chat-text-font-look-card">
                    <span className="chat-text-font-look-aa" style={sampleStyle(item.id)}>Aa</span>
                    {selected ? (
                      <span className="chat-text-font-check" aria-hidden="true">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    ) : null}
                  </span>
                  <span className="chat-text-font-look-name">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="chat-text-font-footer">
          <button type="button" className="chat-text-font-save" onClick={confirm}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Saqlash
          </button>
        </div>
      </div>
      {showCustom ? (
        <ChatCustomColorModal
          initialHex={color}
          closeRef={customCloseRef}
          onApply={applyHex}
          onClose={() => setShowCustom(false)}
        />
      ) : null}
    </>
  );
};

export default ChatTextFontModal;
