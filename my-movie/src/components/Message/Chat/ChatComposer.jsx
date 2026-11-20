import React, { useEffect, useRef, useState } from 'react';
import AnimationEmojModal from './AnimationEmojModal';

const ChatComposer = ({ lang, onSend, onTyping, disabled = false, reply = null, onCancelReply }) => {
  const inputRef = useRef(null);
  const emojiRef = useRef(null);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const placeholder = lang === 'ru' ? 'Сообщение' : 'Xabar';
  const backLabel = lang === 'ru' ? 'Назад' : 'Orqaga';
  const closeLabel = lang === 'ru' ? 'Закрыть' : 'Yopish';

  useEffect(() => {
    if (reply?.id && !disabled) inputRef.current?.focus();
  }, [reply?.id, disabled]);

  const submit = (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || disabled || !onSend) return;
    setText('');
    onTyping?.(false);
    onSend(value);
  };

  const keyboardIsOpen = () => {
    const fromKeyboard = navigator.virtualKeyboard?.boundingRect?.height || 0;
    const viewport = window.visualViewport;
    const fromViewport = viewport
      ? Math.max(0, window.innerHeight - viewport.offsetTop - viewport.height)
      : 0;
    return Math.max(fromKeyboard, fromViewport) > 80;
  };

  const openComposer = () => {
    if (!disabled) setOpen(true);
  };

  const guardBackPress = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!keyboardIsOpen()) inputRef.current?.blur();
  };

  const closeComposer = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(false);
  };

  return (
    <div className="chat-composer-wrap">
      {reply?.text ? (
        <div className="chat-reply-draft">
          <span className="chat-reply-film" aria-hidden="true" />
          <span className="chat-reply-draft-text">{reply.text}</span>
          <button type="button" className="chat-reply-draft-x" aria-label={closeLabel} onClick={onCancelReply}>
            ×
          </button>
        </div>
      ) : null}
      <form className={`chat-composer${open ? ' is-open' : ''}`} onSubmit={submit}>
        <div className="chat-composer-field" onPointerDown={openComposer}>
          <input
            ref={inputRef}
            className="chat-composer-input"
            value={text}
            maxLength={2000}
            placeholder={placeholder}
            aria-label={placeholder}
            disabled={disabled}
            onFocus={() => {
              openComposer();
              emojiRef.current?.close();
            }}
            onChange={(event) => {
              const next = event.target.value;
              setText(next);
              onTyping?.(next.trim().length > 0);
            }}
          />
          <span className="chat-composer-field-icons">
            <button
              type="button"
              className="chat-composer-emoji"
              aria-label={lang === 'ru' ? 'Эмодзи' : 'Emoji'}
              aria-expanded={emojiOpen}
              disabled={disabled}
              onPointerDown={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                if (disabled) return;
                if (emojiOpen) {
                  emojiRef.current?.close();
                  return;
                }
                inputRef.current?.blur();
                setEmojiOpen(true);
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="12" cy="12" r="8.2" />
                <path d="M8.6 13.6c.7 1.3 1.9 2 3.4 2s2.7-.7 3.4-2" strokeLinecap="round" />
                <circle cx="9.2" cy="10.2" r="0.9" fill="currentColor" stroke="none" />
                <circle cx="14.8" cy="10.2" r="0.9" fill="currentColor" stroke="none" />
              </svg>
            </button>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <rect x="4" y="5.5" width="16" height="13" rx="2" />
              <circle cx="9" cy="10" r="1.3" fill="currentColor" stroke="none" />
              <path d="M4.5 16.2l4.2-3.6 3 2.5 2.2-1.8 5.6 4.2" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        <div className="chat-composer-tools">
          <button
            type="button"
            className="chat-composer-back"
            aria-label={backLabel}
            tabIndex={open ? 0 : -1}
            onPointerDown={guardBackPress}
            onMouseDown={guardBackPress}
            onClick={closeComposer}
          >
            ‹
          </button>
          <div className="chat-composer-media" aria-hidden="true">
            <span className="chat-composer-cam">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="3" y="7" width="11" height="10" rx="2" />
                <path d="M14 11.2l6.2-3.2v8.2L14 13" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="chat-composer-mic">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M7 11a5 5 0 0 0 10 0M12 16v4M9 20h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
          </div>
        </div>
      </form>
      {emojiOpen ? (
        <AnimationEmojModal ref={emojiRef} lang={lang} onClose={() => setEmojiOpen(false)} />
      ) : null}
    </div>
  );
};

export default ChatComposer;
