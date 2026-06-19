import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as commentsApi from '../../api/commentsApi';
import * as shortsCommentsApi from '../../api/shortsCommentsApi';
import './ComentariaHistoryTextDelit.css';

/** O‘chirish `commentsApi` / `shortsCommentsApi.deleteCommentById` (async) — backendda shu funksiyalar ichida `fetch`. */
const ComentariaHistoryTextDelit = ({ lang, commentId, variant, entityKey, onDeleted }) => {
  const ru = lang === 'ru';
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!confirmOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [confirmOpen]);

  const handleOpen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const handleCancel = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setConfirmOpen(false);
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (deleting) return;
    setDeleting(true);
    try {
      if (variant === 'movieVideo') {
        await commentsApi.deleteCommentById(entityKey, commentId);
      } else {
        await shortsCommentsApi.deleteCommentById(entityKey, commentId);
      }
      setConfirmOpen(false);
      onDeleted?.();
    } catch (err) {
      console.error('ComentariaHistoryTextDelit: delete failed', err);
    } finally {
      setDeleting(false);
    }
  };

  const title = ru
    ? 'Вы действительно хотите удалить этот комментарий?'
    : "Bu sharhni o'chirishga aminmisiz?";

  const modal =
    confirmOpen &&
    createPortal(
      <div
        className="comentaria-delete-confirm-root"
        role="presentation"
        onClick={handleCancel}
      >
        <div
          className="comentaria-delete-confirm-panel"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="comentaria-delete-confirm-title"
          onClick={(e) => e.stopPropagation()}
        >
          <p id="comentaria-delete-confirm-title" className="comentaria-delete-confirm-title">
            {title}
          </p>
          <div className="comentaria-delete-confirm-actions">
            <button
              type="button"
              className="comentaria-delete-confirm-yes"
              onClick={handleConfirm}
              disabled={deleting}
              aria-busy={deleting}
            >
              {ru ? 'Да' : 'Ha'}
            </button>
            <button type="button" className="comentaria-delete-confirm-no" onClick={handleCancel}>
              {ru ? 'Нет' : "Yo'q"}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <button type="button" className="comentaria-history-btn-delete" onClick={handleOpen}>
        {ru ? 'Удалить' : 'O‘chirish'}
      </button>
      {modal}
    </>
  );
};

export default ComentariaHistoryTextDelit;
