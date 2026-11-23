import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './ChatDeleteMessageModal.css';

const ChatDeleteMessageModal = ({ peerName, lang, busy, onClose, onConfirm }) => {
  const ru = lang === 'ru';
  const [forPeer, setForPeer] = useState(false);
  const name = String(peerName || '').trim() || (ru ? 'собеседника' : 'suhbatdosh');

  return createPortal(
    <div className="chat-delete-modal" role="presentation" onClick={onClose}>
      <div
        className="chat-delete-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-delete-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="chat-delete-title">{ru ? 'Удалить сообщение' : 'Xabarni o‘chirish'}</h2>
        <p>{ru ? 'Вы действительно хотите удалить сообщение?' : 'Haqiqatdan ham xabarni o‘chermoqchimisiz?'}</p>
        <label className="chat-delete-check">
          <input
            type="checkbox"
            checked={forPeer}
            onChange={(event) => setForPeer(event.target.checked)}
          />
          <span>
            {ru ? 'Удалить и для ' : null}
            <strong className="chat-delete-name">{name}</strong>
            {ru ? null : ' uchun ham o‘chirilsin'}
          </span>
        </label>
        <div className="chat-delete-actions">
          <button type="button" onClick={onClose} disabled={busy}>{ru ? 'Отмена' : 'Bekor qilish'}</button>
          <button type="button" className="is-danger" onClick={() => onConfirm(forPeer)} disabled={busy}>
            {ru ? 'Удалить' : 'O‘chirish'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ChatDeleteMessageModal;
