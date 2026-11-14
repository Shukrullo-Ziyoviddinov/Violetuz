import React from 'react';
import { useTranslation } from 'react-i18next';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import './RomLiveUser.css';

const FACE_COLORS = ['#7c3aed', '#e11d48', '#f97316', '#0ea5e9', '#16a34a'];

const STYLE_PREVIEW_USERS = [
  { id: 'preview-dilshod', name: 'Dilshod', room: 'Qasos', initials: 'DM', color: '#7c3aed' },
  { id: 'preview-madina', name: 'Madina', room: "To'y kuni", initials: 'MD', color: '#e11d48' },
  { id: 'preview-malika', name: 'Malika', room: 'Mehmon', initials: 'ML', color: '#f97316' },
];

const initialsOf = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const friendLabel = (count, lang) => {
  if (lang !== 'ru') return `${count} do'st`;
  const n10 = count % 10;
  const n100 = count % 100;
  if (n10 === 1 && n100 !== 11) return `${count} друг`;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return `${count} друга`;
  return `${count} друзей`;
};

const Face = ({ person, color, children }) => {
  const avatar = String(person?.avatar || '');
  const showPhoto = /^https:\/\//i.test(avatar);
  return (
    <span className="rom-live-face" style={showPhoto ? undefined : { background: color }}>
      {showPhoto ? (
        <img src={avatar} alt="" />
      ) : (
        <span>{person?.initials || initialsOf(person?.name)}</span>
      )}
      {children}
    </span>
  );
};

const RomLiveUser = ({ self = null, users = STYLE_PREVIEW_USERS }) => {
  const { i18n } = useTranslation();
  const lang = String(i18n.language || '').startsWith('ru') ? 'ru' : 'uz';
  const people = Array.isArray(users) ? users : [];
  if (!self && people.length === 0) return null;

  return (
    <section className="rom-live" aria-label={lang === 'ru' ? 'Сейчас смотрят' : 'Hozir tomoshada'}>
      <div className="rom-live-head">
        <h2 className="rom-live-title">{lang === 'ru' ? 'Сейчас смотрят' : 'Hozir tomoshada'}</h2>
        {people.length > 0 ? <span className="rom-live-count">{friendLabel(people.length, lang)}</span> : null}
      </div>
      <ScrollTouch className="rom-live-row">
        {self ? (
          <div className="rom-live-user rom-live-user--self">
            <Face person={self} color="#0f9f8f">
              <span className="rom-live-plus" aria-hidden="true">+</span>
            </Face>
            <span className="rom-live-name">{lang === 'ru' ? 'Вы' : 'Siz'}</span>
            <span className="rom-live-room">{lang === 'ru' ? 'Открыть комнату' : 'Xona ochish'}</span>
          </div>
        ) : null}
        {people.map((person, index) => (
          <div className="rom-live-user" key={person.id || `${person.name}-${index}`}>
            <Face person={person} color={person.color || FACE_COLORS[index % FACE_COLORS.length]} />
            <span className="rom-live-name">{person.name}</span>
            {person.room ? <span className="rom-live-room">{person.room}</span> : null}
          </div>
        ))}
      </ScrollTouch>
    </section>
  );
};

export default RomLiveUser;
