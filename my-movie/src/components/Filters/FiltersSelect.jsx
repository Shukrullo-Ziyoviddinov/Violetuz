import React, { useRef, useCallback, useEffect, useState } from 'react';
import './FiltersSelect.css';

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12l5 5L20 7" />
  </svg>
);

const animateScrollTo = (el, to, duration = 560) => {
  if (!el) return () => {};
  const start = el.scrollTop;
  const change = to - start;
  if (Math.abs(change) < 1) return () => {};
  const prevBehavior = el.style.scrollBehavior;
  el.style.scrollBehavior = 'auto';
  let raf = 0;
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / duration);
    const ease = 1 - (1 - p) ** 3;
    el.scrollTop = start + change * ease;
    if (p < 1) {
      raf = requestAnimationFrame(step);
    } else {
      el.style.scrollBehavior = prevBehavior;
    }
  };
  raf = requestAnimationFrame(step);
  return () => {
    cancelAnimationFrame(raf);
    el.style.scrollBehavior = prevBehavior;
  };
};

const isSameValue = (a, b) => {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (typeof a === 'number' || typeof b === 'number') {
    return Number(a) === Number(b);
  }
  return String(a) === String(b);
};

/**
 * Music filter select uslubi — kino mobil modal ichida.
 * options: [{ value, label }]
 */
const FiltersSelect = ({
  options = [],
  value,
  open,
  onToggle,
  onSelect,
  placeholder = '',
  bodySelector = '.filters-modal-sheet-body',
  /** multi / custom active (janr) */
  isOptionActive,
  displayText,
  hasSelection,
}) => {
  const wrapRef = useRef(null);
  const listRef = useRef(null);
  const trackRef = useRef(null);
  const savedScrollTopRef = useRef(null);
  const didLiftRef = useRef(false);
  const wasOpenRef = useRef(false);
  const cancelScrollRef = useRef(null);
  const [thumb, setThumb] = useState({ top: 0, height: 32 });

  const hasOverflow = options.length > 4;
  const activeOpt = options.find((o) =>
    typeof isOptionActive === 'function'
      ? isOptionActive(o.value)
      : isSameValue(o.value, value)
  );
  const hasValue =
    typeof hasSelection === 'boolean'
      ? hasSelection
      : value != null && value !== '';
  const display =
    displayText != null && displayText !== ''
      ? displayText
      : hasValue && activeOpt
        ? activeOpt.label
        : placeholder;

  const optionIsActive = (optValue) =>
    typeof isOptionActive === 'function'
      ? isOptionActive(optValue)
      : isSameValue(value, optValue);

  const updateThumb = useCallback(() => {
    const el = listRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const trackH = track.clientHeight;
    if (scrollHeight <= clientHeight + 1 || trackH <= 0) {
      setThumb({ top: 0, height: trackH || 32 });
      return;
    }
    const height = Math.max(28, (clientHeight / scrollHeight) * trackH);
    const maxTop = Math.max(0, trackH - height);
    const top =
      (scrollTop / Math.max(1, scrollHeight - clientHeight)) * maxTop;
    setThumb({ top, height });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        onToggle?.(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
    };
  }, [open, onToggle]);

  useEffect(() => {
    if (!open || !hasOverflow) return undefined;
    const el = listRef.current;
    if (!el) return undefined;
    updateThumb();
    el.addEventListener('scroll', updateThumb, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateThumb) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener('scroll', updateThumb);
      ro?.disconnect();
    };
  }, [open, hasOverflow, options.length, updateThumb]);

  useEffect(() => {
    const el = wrapRef.current;
    const body = el?.closest(bodySelector);
    if (!body) return undefined;

    if (open) {
      if (!wasOpenRef.current) {
        wasOpenRef.current = true;
        savedScrollTopRef.current = body.scrollTop;
        didLiftRef.current = false;
      }
      const timer = setTimeout(() => {
        if (didLiftRef.current) return;
        const dropdown = el.querySelector('.filters-select-dropdown');
        const focusEl = dropdown || el;
        const bodyRect = body.getBoundingClientRect();
        const focusRect = focusEl.getBoundingClientRect();
        const pad = 20;
        let delta = 0;
        if (focusRect.bottom > bodyRect.bottom - pad) {
          delta = focusRect.bottom - bodyRect.bottom + pad;
        } else if (focusRect.top < bodyRect.top + pad) {
          delta = focusRect.top - bodyRect.top - pad;
        }
        if (Math.abs(delta) >= 1) {
          didLiftRef.current = true;
          body.scrollBy({ top: delta, behavior: 'smooth' });
        }
      }, 40);
      return () => clearTimeout(timer);
    }

    if (!wasOpenRef.current) return undefined;
    wasOpenRef.current = false;

    if (!didLiftRef.current || savedScrollTopRef.current == null) {
      savedScrollTopRef.current = null;
      didLiftRef.current = false;
      return undefined;
    }

    const restoreTo = savedScrollTopRef.current;
    savedScrollTopRef.current = null;
    didLiftRef.current = false;
    body.scrollTo({ top: body.scrollTop, behavior: 'auto' });
    cancelScrollRef.current = animateScrollTo(body, restoreTo, 560);
    return () => {
      if (cancelScrollRef.current) {
        cancelScrollRef.current();
        cancelScrollRef.current = null;
      }
    };
  }, [open, bodySelector]);

  const scrollListBy = (dir) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollBy({ top: dir * 56, behavior: 'smooth' });
  };

  return (
    <div
      className={`filters-select${open ? ' is-open' : ''}${hasValue ? ' has-value' : ''}`}
      ref={wrapRef}
    >
      <button
        type="button"
        className="filters-select-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => onToggle?.(!open)}
      >
        <span className="filters-select-trigger-text">{display}</span>
        <svg
          className="filters-select-arrow"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {open ? (
        <div
          className={`filters-select-dropdown${hasOverflow ? ' has-overflow' : ''}`}
          role="listbox"
        >
          <div className="filters-select-dropdown-scroll" ref={listRef}>
            {options.map((opt) => {
              const active = optionIsActive(opt.value);
              return (
                <button
                  key={`${opt.value ?? 'all'}-${opt.label}`}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`filters-select-option${active ? ' is-active' : ''}`}
                  onClick={() => {
                    onSelect?.(opt.value, active);
                    onToggle?.(false);
                  }}
                >
                  <span className={`filters-select-check${active ? ' is-on' : ''}`}>
                    {active ? <CheckIcon /> : null}
                  </span>
                  <span className="filters-select-option-text">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {hasOverflow ? (
            <div className="filters-select-scrollbar" aria-hidden="true">
              <button
                type="button"
                className="filters-select-scrollbar-btn filters-select-scrollbar-btn--up"
                tabIndex={-1}
                onClick={() => scrollListBy(-1)}
              />
              <div className="filters-select-scrollbar-track" ref={trackRef}>
                <div
                  className="filters-select-scrollbar-thumb"
                  style={{
                    height: `${thumb.height}px`,
                    transform: `translateY(${thumb.top}px)`,
                  }}
                />
              </div>
              <button
                type="button"
                className="filters-select-scrollbar-btn filters-select-scrollbar-btn--down"
                tabIndex={-1}
                onClick={() => scrollListBy(1)}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default FiltersSelect;
