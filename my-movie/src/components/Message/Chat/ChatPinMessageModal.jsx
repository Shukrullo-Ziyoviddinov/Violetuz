import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './ChatPinMessageModal.css';

const ChatPinMessageModal = ({ peerName, lang, busy, onClose, onConfirm }) => {
  const ru = lang === 'ru';
  const [forPeer, setForPeer] = useState(false);
  const name = String(peerName || '').trim() || (ru ? 'собеседника' : 'suhbatdosh');

  return createPortal(
    <div className="chat-pin-modal" role="presentation" onClick={onClose}>
      <div
        className="chat-pin-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-pin-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="chat-pin-title">{ru ? 'Закрепить сообщение' : 'Xabarni qadash'}</h2>
        <p>{ru ? 'Вы действительно хотите закрепить это сообщение?' : 'Chindan ham ushbu xabarni qadamoqchimisiz?'}</p>
        <label className="chat-pin-check">
          <input
            type="checkbox"
            checked={forPeer}
            onChange={(event) => setForPeer(event.target.checked)}
          />
          <span>
            {ru ? 'Закрепить и для ' : null}
            <strong className="chat-pin-name">{name}</strong>
            {ru ? null : ' uchun ham qadash'}
          </span>
        </label>
        <div className="chat-pin-actions">
          <button type="button" onClick={onClose} disabled={busy}>{ru ? 'Отмена' : 'Bekor qilish'}</button>
          <button type="button" className="is-pin" onClick={() => onConfirm(forPeer)} disabled={busy}>
            {ru ? 'Закрепить' : 'Qadash'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ChatPinMessageModal;
