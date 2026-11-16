import React, { useCallback, useEffect, useRef, useState } from 'react';
import { bubbleFill, darkenHex } from './chatBubbles';
import './ChatColorModal.css';

const CLOSE_MS = 340;

const READY_COLORS = [
  '#7C3AED',
  '#2563EB',
  '#22D3EE',
  '#22C55E',
  '#84CC16',
  '#FACC15',
  '#F97316',
  '#EF4444',
  '#FB7185',
  '#E879F9',
  '#8B5CF6',
  '#38BDF8',
];

const isMobileViewport = () =>
  typeof window !== 'undefined' && window.innerWidth <= 768;

const normalizeHex = (value) => {
  const hex = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(hex) ? hex.toUpperCase() : '';
};

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

const ChatColorModal = ({
  initialHex,
  mode = 'solid',
  previewImage,
  onClose,
  onApply,
  closeRef,
}) => {
  const startHex = normalizeHex(initialHex) || '#7C3AED';
  const [color, setColor] = useState(startHex);
  const [hsv, setHsv] = useState(() => hexToHsv(startHex));
  const [hexDraft, setHexDraft] = useState(startHex);
  const [dragY, setDragY] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(() => !isMobileViewport());
  const [exiting, setExiting] = useState(false);
  const hsvRef = useRef(hsv);
  const colorRef = useRef(color);
  const exitingRef = useRef(false);
  const dragYRef = useRef(0);
  const startYRef = useRef(0);
  const closeTimerRef = useRef(null);
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
    const next = normalizeHex(value);
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

  const pickFromScreen = async () => {
    if (typeof window.EyeDropper !== 'function') return;
    try {
      const result = await new window.EyeDropper().open();
      applyHex(result?.sRGBHex);
    } catch {
      // Tanlov bekor qilinsa rang o‘zgarmaydi.
    }
  };

  const confirm = () => {
    onApplyRef.current?.(colorRef.current);
    requestClose();
  };

  const inFill = { background: bubbleFill(darkenHex(color), mode) };
  const outFill = { background: bubbleFill(color, mode) };
  const hueColor = hsvToHex(hsv.h, 1, 1);

  const overlayClass = [
    'chat-color-picker-backdrop',
    sheetOpen ? 'chat-color-picker-backdrop--open' : '',
    exiting ? 'chat-color-picker-backdrop--closing' : '',
  ].filter(Boolean).join(' ');

  const modalClass = [
    'chat-color-picker',
    sheetOpen && !exiting ? 'chat-color-picker--open' : '',
    dragY > 0 && !exiting ? 'chat-color-picker--dragging' : '',
    exiting ? 'chat-color-picker--closing' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className={overlayClass} onClick={requestClose} />
      <div
        className={modalClass}
        style={{ '--drag-y': `${dragY}px` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-color-picker-title"
      >
        <div
          className="chat-color-picker-top"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <div className="chat-color-picker-handle" aria-hidden="true" />
          <div className="chat-color-picker-header">
            <h2 id="chat-color-picker-title">O‘zingiz hohlagan rangni tanlang</h2>
            <button
              type="button"
              className="chat-color-picker-close"
              onClick={requestClose}
              aria-label="Yopish"
            >
              ×
            </button>
          </div>
        </div>

        <div className="chat-color-picker-body">
          <div
            className="chat-color-sv"
            onPointerDown={(event) => {
              bindPointer(event, (x, y) => {
                const next = { ...hsvRef.current, s: x, v: 1 - y };
                publish(next, hsvToHex(next.h, next.s, next.v));
              });
            }}
          >
            <span
              className="chat-color-sv-fill"
              style={{ backgroundColor: hueColor }}
            />
            <span
              className="chat-color-sv-thumb"
              style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
            />
          </div>

          <div
            className="chat-color-hue"
            onPointerDown={(event) => {
              bindPointer(event, (x) => {
                const next = { ...hsvRef.current, h: x * 360 };
                publish(next, hsvToHex(next.h, next.s, next.v));
              });
            }}
          >
            <span className="chat-color-hue-bar" />
            <span
              className="chat-color-hue-thumb"
              style={{ left: `${(hsv.h / 360) * 100}%`, background: color }}
            />
          </div>

          <div className="chat-color-hex">
            <span className="chat-color-hex-chip" style={{ background: color }} />
            <input
              className="chat-color-hex-input"
              value={hexDraft}
              aria-label="Rang kodi"
              spellCheck={false}
              maxLength={7}
              onChange={(event) => {
                const raw = event.target.value.toUpperCase();
                const next = raw.startsWith('#') ? raw : `#${raw}`;
                setHexDraft(next);
                if (normalizeHex(next)) applyHex(next);
              }}
            />
            <button
              type="button"
              className="chat-color-eyedrop"
              onClick={pickFromScreen}
              aria-label="Ekrandan rang olish"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m2 22 1-1h3l9-9" />
                <path d="M3 21v-3l9-9" />
                <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3L15 6" />
              </svg>
            </button>
          </div>

          <h3 className="chat-color-picker-label">Oldindan tayyor ranglar</h3>
          <div className="chat-color-ready-grid">
            {READY_COLORS.map((item) => {
              const selected = item.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={item}
                  type="button"
                  className={`chat-color-ready${selected ? ' is-on' : ''}`}
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

          <h3 className="chat-color-picker-label">Tanlangan rangda ko‘rinishi</h3>
          <div
            className="chat-color-live"
            style={previewImage ? { backgroundImage: `url(${previewImage})` } : undefined}
          >
            <div className="chat-color-live-in">
              <span className="chat-color-live-avatar" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="8" r="4" />
                </svg>
              </span>
              <span className="chat-color-live-msg" style={inFill}>
                Bu kiruvchi xabar
                <span>20:45</span>
              </span>
            </div>
            <span className="chat-color-live-msg chat-color-live-msg--out" style={outFill}>
              Bu chiquvchi xabar
              <span>
                20:46
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="4 12 9 17 20 6" />
                  <polyline points="9 12 14 17" />
                </svg>
              </span>
            </span>
          </div>
        </div>

        <div className="chat-color-picker-footer">
          <button type="button" className="chat-color-picker-apply" onClick={confirm}>
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

export default ChatColorModal;
