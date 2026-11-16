import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  normalizeTextHex,
  readRecentColors,
  rememberRecentColor,
} from './chatTextFont';
import './ChatCustomColorModal.css';

const CLOSE_MS = 340;

const isMobileViewport = () =>
  typeof window !== 'undefined' && window.innerWidth <= 768;

const hsvToHex = (h, s, v) => {
  const hue = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const channel = (part) => Math.round((part + m) * 255).toString(16).padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase();
};

const hexToHsv = (hex) => {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = ((value >> 16) & 255) / 255;
  const g = ((value >> 8) & 255) / 255;
  const b = (value & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : delta / max, v: max };
};

const ChatCustomColorModal = ({
  initialHex,
  onClose,
  onApply,
  closeRef,
}) => {
  const startHex = normalizeTextHex(initialHex) || '#A855F7';
  const [color, setColor] = useState(startHex);
  const [hsv, setHsv] = useState(() => hexToHsv(startHex));
  const [hexDraft, setHexDraft] = useState(startHex);
  const [recents, setRecents] = useState(readRecentColors);
  const [copied, setCopied] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(() => !isMobileViewport());
  const [exiting, setExiting] = useState(false);
  const hsvRef = useRef(hsv);
  const colorRef = useRef(color);
  const exitingRef = useRef(false);
  const dragYRef = useRef(0);
  const startYRef = useRef(0);
  const closeTimerRef = useRef(null);
  const copyTimerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const onApplyRef = useRef(onApply);
  hsvRef.current = hsv;
  colorRef.current = color;
  onCloseRef.current = onClose;
  onApplyRef.current = onApply;

  const requestClose = useCallback(() => {
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
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      if (closeRef) closeRef.current = null;
    },
    [closeRef]
  );

  const publish = (nextHsv, nextHex) => {
    hsvRef.current = nextHsv;
    colorRef.current = nextHex;
    setHsv(nextHsv);
    setColor(nextHex);
    setHexDraft(nextHex);
  };

  const applyHex = (value) => {
    const next = normalizeTextHex(value);
    if (!next) return;
    publish(hexToHsv(next), next);
  };

  const bindPointer = (event, update) => {
    const el = event.currentTarget;
    const read = (point) => {
      const rect = el.getBoundingClientRect();
      const width = rect.width || 1;
      const height = rect.height || 1;
      const x = Math.min(1, Math.max(0, (point.clientX - rect.left) / width));
      const y = Math.min(1, Math.max(0, (point.clientY - rect.top) / height));
      update(x, y);
    };
    read(event);
    el.setPointerCapture?.(event.pointerId);
    const move = (point) => read(point);
    const end = (point) => {
      el.releasePointerCapture?.(point.pointerId);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', end);
      el.removeEventListener('pointercancel', end);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
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

  const copyHex = async () => {
    try {
      await navigator.clipboard.writeText(colorRef.current);
      setCopied(true);
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // Nusxa olinmasa kod maydonda qoladi.
    }
  };

  const confirm = () => {
    const next = colorRef.current;
    setRecents(rememberRecentColor(next));
    onApplyRef.current?.(next);
    requestClose();
  };

  const hueColor = hsvToHex(hsv.h, 1, 1);
  const overlayClass = [
    'chat-custom-color-backdrop',
    sheetOpen ? 'chat-custom-color-backdrop--open' : '',
    exiting ? 'chat-custom-color-backdrop--closing' : '',
  ].filter(Boolean).join(' ');
  const modalClass = [
    'chat-custom-color',
    sheetOpen && !exiting ? 'chat-custom-color--open' : '',
    dragY > 0 && !exiting ? 'chat-custom-color--dragging' : '',
    exiting ? 'chat-custom-color--closing' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className={overlayClass} onClick={requestClose} />
      <div
        className={modalClass}
        style={{ '--drag-y': `${dragY}px` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-custom-color-title"
      >
        <div
          className="chat-custom-color-top"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <div className="chat-custom-color-handle" aria-hidden="true" />
          <div className="chat-custom-color-header">
            <div className="chat-custom-color-heading">
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.2s6.2 6.4 6.2 10.6a6.2 6.2 0 1 1-12.4 0C5.8 8.6 12 2.2 12 2.2z" fill="#9b4fe7" />
              </svg>
              <h2 id="chat-custom-color-title">Maxsus rang tanlash</h2>
            </div>
            <button
              type="button"
              className="chat-custom-color-close"
              onClick={requestClose}
              aria-label="Yopish"
            >
              ×
            </button>
          </div>
        </div>

        <div className="chat-custom-color-body">
          <div
            className="chat-custom-color-sv"
            onPointerDown={(event) => {
              bindPointer(event, (x, y) => {
                const next = { ...hsvRef.current, s: x, v: 1 - y };
                publish(next, hsvToHex(next.h, next.s, next.v));
              });
            }}
          >
            <span className="chat-custom-color-sv-fill" style={{ backgroundColor: hueColor }} />
            <span
              className="chat-custom-color-sv-thumb"
              style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
            />
          </div>

          <div
            className="chat-custom-color-hue"
            onPointerDown={(event) => {
              bindPointer(event, (x) => {
                const next = { ...hsvRef.current, h: x * 360 };
                publish(next, hsvToHex(next.h, next.s, next.v));
              });
            }}
          >
            <span className="chat-custom-color-hue-bar" />
            <span
              className="chat-custom-color-hue-thumb"
              style={{ left: `${(hsv.h / 360) * 100}%`, background: color }}
            />
          </div>

          <div className="chat-custom-color-hex">
            <span className="chat-custom-color-chip" style={{ background: color }} />
            <input
              className="chat-custom-color-hex-input"
              value={hexDraft}
              aria-label="Rang kodi"
              spellCheck={false}
              maxLength={7}
              onChange={(event) => {
                const raw = event.target.value.toUpperCase();
                const next = raw.startsWith('#') ? raw : `#${raw}`;
                setHexDraft(next);
                if (normalizeTextHex(next)) applyHex(next);
              }}
            />
            <button
              type="button"
              className="chat-custom-color-copy"
              onClick={copyHex}
              aria-label={copied ? 'Nusxa olindi' : 'Rang kodini nusxalash'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="11" height="11" rx="2" />
                <path d="M5 15V5a2 2 0 0 1 2-2h10" />
              </svg>
            </button>
          </div>

          <h3 className="chat-custom-color-label">So‘nggi tanlangan ranglar</h3>
          <div className="chat-custom-color-recents">
            {recents.map((item) => {
              const selected = item.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={item}
                  type="button"
                  className={`chat-custom-color-recent${selected ? ' is-on' : ''}`}
                  style={{ background: item }}
                  aria-label={item}
                  aria-pressed={selected}
                  onClick={() => applyHex(item)}
                >
                  {selected ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="chat-custom-color-footer">
          <button type="button" className="chat-custom-color-apply" onClick={confirm}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Tanlash
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatCustomColorModal;
