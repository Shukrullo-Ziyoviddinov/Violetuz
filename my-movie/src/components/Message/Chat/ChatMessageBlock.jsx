import React, { useEffect, useRef, useState } from 'react';
import { emojiMotion, emojiMotionId, emojiOnlyCount } from './chatEmojis';
import ChatLottie from './ChatLottie';
import ChatGif from './ChatGif';
import ChatVideoNote from './ChatVideoNote';

const PLAY_MS = 1800;

const SoloEmoji = ({ text, held = false }) => {
  const [token, setToken] = useState(0);
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const motionId = emojiMotionId(text);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (!held) return undefined;
    window.clearTimeout(timerRef.current);
    setToken(0);
    return undefined;
  }, [held]);

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

const ChatMessageBlock = ({
  text,
  mine,
  held = false,
  status = null,
  quote = '',
  replyId = '',
  animated = false,
  animationId = '',
  gif = '',
  video = null,
  uploading = false,
  failed = false,
  progress = 0,
  onCancelUpload,
  onOpen,
  quoteAnimated = false,
  quoteAnimationId = '',
  quoteGif = '',
}) => {
  const mineVideo = Boolean(video?.url);
  const mineGif = Boolean(gif) && !mineVideo;
  const quoteGifOn = Boolean(quoteGif);
  const mineAnim = Boolean(animationId);
  const quoteAnim = Boolean(quoteAnimationId);
  const emojiCount = mineGif ? 0 : (mineAnim || animated ? 1 : emojiOnlyCount(text));
  const quoteEmoji = quoteGifOn ? 0 : (quoteAnim || quoteAnimated ? 1 : emojiOnlyCount(quote));
  const emojiClass = `${mineVideo ? ' is-video' : ''}${mineGif ? ' is-gif' : ''}${emojiCount > 1 ? ' is-emoji is-emoji-row' : emojiCount === 1 ? ' is-emoji' : ''}${!mineGif && !mineVideo && (mineAnim || animated) ? ' is-anim' : ''}`;
  const quoteClass = `${quoteGifOn ? ' is-gif' : ''}${quoteEmoji > 1 ? ' is-emoji-quote is-emoji-row' : quoteEmoji === 1 ? ' is-emoji-quote' : ''}${!quoteGifOn && (quoteAnim || quoteAnimated) ? ' is-anim' : ''}`;
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
            {quoteGifOn ? <ChatGif file={quoteGif} fit max={106} label={quote} /> : quoteAnim ? <ChatLottie id={quoteAnimationId} className="chat-anim" label={quote} /> : quoteAnimated ? <LoopEmoji text={quote} /> : quote}
          </span>
        </button>
      ) : null}
      <div className="chat-block-main">
        {mineVideo ? (
          <ChatVideoNote
            url={video.url}
            duration={video.duration}
            start={video.start}
            uploading={uploading}
            failed={failed}
            progress={progress}
            onCancel={onCancelUpload}
            onOpen={onOpen}
          />
        ) : mineGif ? <ChatGif file={gif} fit label={text} /> : mineAnim ? <ChatLottie id={animationId} className="chat-anim" label={text} /> : animated ? <LoopEmoji text={text} /> : emojiCount === 1 ? <SoloEmoji text={text} held={held} /> : <span className="chat-block-text">{text}</span>}
        {status}
      </div>
    </div>
  );
};

export default ChatMessageBlock;
