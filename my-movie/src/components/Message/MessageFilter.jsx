import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import './MessageFilter.css';

const FILTERS = [
  { id: 'chats', uz: 'Chatlar', ru: 'Чаты' },
  { id: 'groups', uz: 'Guruhlar', ru: 'Группы' },
  { id: 'channels', uz: 'Kanallar', ru: 'Каналы' },
  { id: 'artists', uz: 'Artistlar', ru: 'Артисты' },
  { id: 'actors', uz: 'Aktyorlar', ru: 'Актёры' },
];

const MessageFilter = () => {
  const { i18n } = useTranslation();
  const lang = String(i18n.language || '').startsWith('ru') ? 'ru' : 'uz';
  const [active, setActive] = useState('chats');
  const trackRef = useRef(null);
  const skipScrollRef = useRef(true);
  const [pill, setPill] = useState({ x: 0, width: 0, ready: false });

  useLayoutEffect(() => {
    const track = trackRef.current;
    const button = track?.querySelector(`[data-filter="${active}"]`);
    if (!track || !button) return;
    setPill((current) => ({
      x: button.offsetLeft,
      width: button.offsetWidth,
      ready: current.ready,
    }));
    const pad = 6;
    const viewLeft = track.scrollLeft;
    const viewRight = viewLeft + track.clientWidth;
    const itemLeft = button.offsetLeft - pad;
    const itemRight = button.offsetLeft + button.offsetWidth + pad;
    if (itemLeft < viewLeft || itemRight > viewRight) {
      const next = button.offsetLeft - (track.clientWidth - button.offsetWidth) / 2;
      track.scrollTo({
        left: Math.max(0, next),
        behavior: skipScrollRef.current ? 'auto' : 'smooth',
      });
    }
    skipScrollRef.current = false;
  }, [active, lang]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const frame = window.requestAnimationFrame(() => {
      setPill((current) => ({ ...current, ready: true }));
    });
    const measure = () => {
      const button = track.querySelector(`[data-filter="${active}"]`);
      if (!button) return;
      setPill((current) => ({
        ...current,
        x: button.offsetLeft,
        width: button.offsetWidth,
      }));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [active]);

  return (
    <ScrollTouch className="message-filter" ref={trackRef} role="tablist" aria-label={lang === 'ru' ? 'Фильтр' : 'Filter'}>
      <span
        className={`message-filter-pill${pill.ready ? ' is-ready' : ''}`}
        style={{ width: pill.width, transform: `translateX(${pill.x}px)` }}
        aria-hidden="true"
      />
      {FILTERS.map((item) => {
        const selected = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            data-filter={item.id}
            aria-selected={selected}
            className={`message-filter-btn${selected ? ' is-active' : ''}`}
            onClick={() => setActive(item.id)}
          >
            {lang === 'ru' ? item.ru : item.uz}
          </button>
        );
      })}
    </ScrollTouch>
  );
};

export default MessageFilter;
