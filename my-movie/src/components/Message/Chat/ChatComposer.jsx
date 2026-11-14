import React, { useState } from 'react';

const ChatComposer = ({ lang, onSend, disabled = false }) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const placeholder = lang === 'ru' ? 'Напишите сообщение' : 'Xabar yozing';
  const failedLabel = lang === 'ru' ? 'Не отправилось' : 'Yuborilmadi';

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

  return (
    <div className="chat-composer-wrap">
      {failed ? <p className="chat-composer-error" role="alert">{failedLabel}</p> : null}
      <form className="chat-composer" onSubmit={submit}>
      <span className="chat-composer-plus" aria-hidden="true">+</span>
      <input
        className="chat-composer-input"
        value={text}
        maxLength={2000}
        placeholder={placeholder}
        aria-label={placeholder}
        disabled={disabled}
        onChange={(event) => {
          setFailed(false);
          setText(event.target.value);
        }}
      />
      <button type="submit" className="chat-composer-send" aria-label={lang === 'ru' ? 'Отправить' : 'Yuborish'} disabled={disabled || sending || !text.trim()}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 12l16-8-6 16-2.5-6.5L4 12z" />
        </svg>
      </button>
      </form>
    </div>
  );
};

export default ChatComposer;
