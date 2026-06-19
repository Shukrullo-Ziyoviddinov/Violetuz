import React, { useState, useEffect, useRef } from 'react';
import * as commentsApi from '../../api/commentsApi';
import * as shortsCommentsApi from '../../api/shortsCommentsApi';
import './ComentariaHistoryTextEdit.css';

/**
 * Tahrir `commentsApi` / `shortsCommentsApi` orqali — ular `async`; backend ulanganda faqat shu modullarni o‘zgartirish kifoya.
 *
 * @param {'movieVideo'|'shorts'} variant
 * @param {string|number} entityKey — movieId, `music:id` yoki shortsId
 * @param {function} [render] — ({ body, actions }) => node; berilsa, actions `.comentaria-history-comment-block`dan tashqarida
 * @param {React.ReactNode} [deleteSlot] — O‘chirish tugmasi (actions ichida)
 */
const ComentariaHistoryTextEdit = ({
  lang,
  commentId,
  variant,
  entityKey,
  initialText,
  onPersist,
  deleteSlot,
  render,
}) => {
  const ru = lang === 'ru';
  const [text, setText] = useState(initialText ?? '');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialText ?? '');
  const areaRef = useRef(null);

  useEffect(() => {
    setText(initialText ?? '');
    setDraft(initialText ?? '');
  }, [initialText]);

  useEffect(() => {
    if (editing && areaRef.current) {
      areaRef.current.focus();
    }
  }, [editing]);

  const persistUpdate = async (trimmed) => {
    try {
      if (variant === 'movieVideo') {
        await commentsApi.updateCommentTextById(entityKey, commentId, trimmed);
      } else {
        await shortsCommentsApi.updateCommentTextById(entityKey, commentId, trimmed);
      }
      setText(trimmed);
      setDraft(trimmed);
      setEditing(false);
      onPersist?.();
    } catch (err) {
      console.error('ComentariaHistoryTextEdit: save failed', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = draft.trim();
    if (!trimmed || trimmed === String(text).trim()) return;
    await persistUpdate(trimmed);
  };

  const handleStartEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDraft(text);
    setEditing(true);
  };

  const handleCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDraft(text);
    setEditing(false);
  };

  const dirty = editing && draft.trim() !== String(text).trim() && draft.trim().length > 0;

  const body = !editing ? (
    <p className="comentaria-history-comment-text">{text}</p>
  ) : (
    <textarea
      ref={areaRef}
      className="comentaria-history-text-edit-area"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      rows={3}
      aria-label={ru ? 'Текст комментария' : 'Sharh matni'}
    />
  );

  const actions = (
    <div className="comentaria-history-comment-actions-row">
      {!editing ? (
        <button type="button" className="comentaria-history-btn-edit" onClick={handleStartEdit}>
          {ru ? 'Изменить' : 'Tahrirlash'}
        </button>
      ) : (
        <>
          <button
            type="button"
            className="comentaria-history-btn-save"
            onClick={handleSave}
            disabled={!dirty}
          >
            {ru ? 'Сохранить' : 'Saqlash'}
          </button>
          <button type="button" className="comentaria-history-btn-cancel" onClick={handleCancel}>
            {ru ? 'Отмена' : 'Bekor qilish'}
          </button>
        </>
      )}
      {deleteSlot}
    </div>
  );

  if (typeof render === 'function') {
    return render({ body, actions });
  }

  return (
    <div className="comentaria-history-text-edit-wrap">
      {body}
      {actions}
    </div>
  );
};

export default ComentariaHistoryTextEdit;
