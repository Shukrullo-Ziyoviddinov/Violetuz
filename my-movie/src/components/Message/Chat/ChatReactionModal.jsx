import React, { useMemo, useState } from 'react';
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

const iconOf = (id) => CHAT_EMOJIS.find((item) => item.cat === id)?.char || '•';

const ChatReactionModal = ({ lang, onClose, onPick }) => {
  const ru = lang === 'ru';
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('smile');
  const recent = useMemo(() => readRecentEmojiIds(), []);
  const recentItems = recent.map((id) => emojiFromId(id)).filter(Boolean);
  const needle = query.trim();
  const shown = useMemo(() => {
    if (needle) return CHAT_EMOJIS.filter((item) => emojiMatches(item, needle));
    if (cat === 'recent') return recentItems;
    return CHAT_EMOJIS.filter((item) => item.cat === cat);
  }, [needle, cat, recentItems]);
  const title = GROUPS[cat] || GROUPS.smile;

  const choose = (item) => {
    rememberEmoji(item.id);
    onPick?.(item);
  };

  return createPortal(
    <div className="chat-react-modal" role="presentation" onClick={onClose}>
      <div
        className="chat-react-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={ru ? 'Выберите реакцию' : 'Reaksiya tanlang'}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="chat-react-grab" aria-hidden="true" />
        <div className="chat-react-head">
          <h2>{ru ? 'Выберите реакцию' : 'Reaksiya tanlang'}</h2>
          <button type="button" className="chat-react-close" onClick={onClose} aria-label={ru ? 'Закрыть' : 'Yopish'}>×</button>
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
};

export default ChatReactionModal;
