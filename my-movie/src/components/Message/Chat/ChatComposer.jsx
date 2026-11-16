import React, { useRef, useState } from 'react';

const ChatComposer = ({ lang, onSend, disabled = false }) => {
  const inputRef = useRef(null);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const placeholder = lang === 'ru' ? 'Сообщение' : 'Xabar';
  const failedLabel = lang === 'ru' ? 'Не отправилось' : 'Yuborilmadi';
  const backLabel = lang === 'ru' ? 'Назад' : 'Orqaga';

  const submit = async (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || sending || disabled || !onSend) return;
    setSending(true);
    setFailed(false);
    try {
      await onSend(value);
      setText('');
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  };

  const keepKeyboard = (event) => {
    event.preventDefault();
  };

  const close = () => {
    setOpen(false);
  };

  const openComposer = () => {
    if (!disabled) setOpen(true);
  };

  return (
    <div className="chat-composer-wrap">
      {failed ? <p className="chat-composer-error" role="alert">{failedLabel}</p> : null}
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
            onFocus={openComposer}
            onChange={(event) => {
              setFailed(false);
              setText(event.target.value);
            }}
          />
          <span className="chat-composer-field-icons" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="12" cy="12" r="8.2" />
              <path d="M8.6 13.6c.7 1.3 1.9 2 3.4 2s2.7-.7 3.4-2" strokeLinecap="round" />
              <circle cx="9.2" cy="10.2" r="0.9" fill="currentColor" stroke="none" />
              <circle cx="14.8" cy="10.2" r="0.9" fill="currentColor" stroke="none" />
            </svg>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
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
            onPointerDown={keepKeyboard}
            onMouseDown={keepKeyboard}
            onClick={close}
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
    </div>
  );
};

export default ChatComposer;
