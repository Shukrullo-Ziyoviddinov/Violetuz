import React, { useEffect, useRef, useState } from 'react';
import { emojiMotion, emojiMotionId, emojiOnlyCount } from './chatEmojis';

const PLAY_MS = 1800;

const SoloEmoji = ({ text }) => {
  const [token, setToken] = useState(0);
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const motionId = emojiMotionId(text);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const stop = () => {
    window.clearTimeout(timerRef.current);
    setToken(0);
  };

  const press = (event) => {
    if (!motionId || (event.button != null && event.button !== 0)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    startRef.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    window.clearTimeout(timerRef.current);
    setToken((current) => current + 1);
    timerRef.current = window.setTimeout(() => setToken(0), PLAY_MS);
  };

  const move = (event) => {
    if (!startRef.current || event.pointerId !== startRef.current.id) return;
    const distance = Math.hypot(event.clientX - startRef.current.x, event.clientY - startRef.current.y);
    if (distance <= 12) return;
    startRef.current = null;
    stop();
  };

  return (
    <span
      className={`chat-block-text chat-emoji-solo${token ? ' is-playing' : ''}`}
      onPointerDown={press}
      onPointerMove={move}
      onPointerUp={() => { startRef.current = null; }}
      onPointerCancel={stop}
    >
      <span className="chat-emoji-still">{text}</span>
      {token ? (
        <img key={token} className="chat-emoji-motion" src={emojiMotion(motionId)} alt="" draggable="false" onError={stop} />
      ) : null}
    </span>
  );
};

const LoopEmoji = ({ text }) => {
  const motionId = emojiMotionId(text);
  if (!motionId) return <span className="chat-block-text">{text}</span>;
  return <img className="chat-anim" src={emojiMotion(motionId)} alt={text} draggable="false" />;
};

const ChatMessageBlock = ({ text, mine, status = null, quote = '', replyId = '', animated = false, quoteAnimated = false }) => {
  const emojiCount = animated ? 1 : emojiOnlyCount(text);
  const quoteEmoji = quoteAnimated ? 1 : emojiOnlyCount(quote);
  const emojiClass = `${emojiCount > 1 ? ' is-emoji is-emoji-row' : emojiCount === 1 ? ' is-emoji' : ''}${animated ? ' is-anim' : ''}`;
  const quoteClass = `${quoteEmoji > 1 ? ' is-emoji-quote is-emoji-row' : quoteEmoji === 1 ? ' is-emoji-quote' : ''}${quoteAnimated ? ' is-anim' : ''}`;
  return (
    <div className={`chat-block${mine ? ' is-mine' : ''}${status ? ' has-status' : ''}${quote ? ' has-quote' : ''}${emojiClass}`}>
      {quote ? (
        <button
          type="button"
          className={`chat-reply-quote${quoteClass}`}
          data-reply-id={replyId || undefined}
        >
          <span className="chat-reply-film" aria-hidden="true" />
          <span className="chat-reply-quote-text">
            {quoteAnimated ? <LoopEmoji text={quote} /> : quote}
          </span>
        </button>
      ) : null}
      <div className="chat-block-main">
        {animated ? <LoopEmoji text={text} /> : emojiCount === 1 ? <SoloEmoji text={text} /> : <span className="chat-block-text">{text}</span>}
        {status}
      </div>
    </div>
  );
};

export default ChatMessageBlock;
