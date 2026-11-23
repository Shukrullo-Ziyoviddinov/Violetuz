import React, { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { emojiFromId, emojiOnlyCount } from './chatEmojis';
import ChatMessageBlock from './ChatMessageBlock';

const QUICK = ['1f44d', '2764', '1f602', '1f62e', '1f37f', '1f525'];
const MOVE_MS = 340;

const MenuIcon = ({ children }) => (
  <svg className="chat-hold-menu-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    {children}
  </svg>
);

const mediaMessage = (message) => Boolean(
  message?.gif
  || message?.animationId
  || message?.animated
  || emojiOnlyCount(message?.text)
);

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ChatMessageHold = forwardRef(({ message, anchor, lang, onClose, onReply, onCopy, onDelete, onPick, onMore }, ref) => {
  const ru = lang === 'ru';
  const mine = message.mine === true;
  const quick = QUICK.map((id) => emojiFromId(id)).filter(Boolean);
  const stageRef = useRef(null);
  const closingRef = useRef(false);
  const openedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const [spot, setSpot] = useState(null);
  const [ready, setReady] = useState(false);
  const [moved, setMoved] = useState(false);
  onCloseRef.current = onClose;

  useLayoutEffect(() => {
    const node = stageRef.current;
    if (!node) return undefined;
    const reactions = node.querySelector('.chat-hold-reactions');
    const menu = node.querySelector('.chat-hold-menu');
    const bubble = node.querySelector('.chat-hold-bubble');
    const above = (reactions?.offsetHeight || 44) + 8;
    const below = (menu?.offsetHeight || 156) + 8;
    const bubbleH = bubble?.offsetHeight || node.offsetHeight || 48;
    const groupW = Math.max(node.offsetWidth, menu?.offsetWidth || 228, reactions?.offsetWidth || 0);
    const total = above + bubbleH + below;
    const room = Math.max(12, window.innerHeight - total - 12);
    const visualTop = Math.max(12, Math.min(room, Math.round((window.innerHeight - total) / 2)));
    const top = visualTop + above;
    const centerX = window.innerWidth * 0.36;
    const maxLeft = Math.max(16, window.innerWidth - groupW - 16);
    const left = Math.min(maxLeft, Math.max(16, Math.round(centerX - groupW / 2)));
    setSpot({
      left,
      top,
      fromX: (anchor?.left ?? left) - left,
      fromY: (anchor?.top ?? top) - top,
    });
    return undefined;
  }, [anchor]);

  useEffect(() => {
    if (!spot || ready) return undefined;
    if (reducedMotion()) {
      openedRef.current = true;
      setReady(true);
      setMoved(true);
      return undefined;
    }
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, [spot, ready]);

  useEffect(() => {
    if (!ready || openedRef.current) return undefined;
    const id = window.requestAnimationFrame(() => {
      openedRef.current = true;
      setMoved(true);
    });
    return () => window.cancelAnimationFrame(id);
  }, [ready]);

  const settle = (done) => {
    if (closingRef.current) {
      done?.();
      return;
    }
    closingRef.current = true;
    const node = stageRef.current;
    if (!node || reducedMotion()) {
      done?.();
      return;
    }
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      node.removeEventListener('transitionend', onEnd);
      window.clearTimeout(timer);
      done?.();
    };
    const onEnd = (event) => {
      if (event.target !== node || event.propertyName !== 'transform') return;
      finish();
    };
    const timer = window.setTimeout(finish, MOVE_MS + 80);
    node.addEventListener('transitionend', onEnd);
    setMoved(false);
  };

  useImperativeHandle(ref, () => ({
    close: (done) => settle(done || onCloseRef.current),
  }), []);

  return createPortal(
    <div className="chat-hold" role="presentation" onClick={() => settle(onClose)}>
      <div
        ref={stageRef}
        className={`chat-hold-stage${mine ? ' is-mine' : ''}${mediaMessage(message) ? ' is-compact' : ''}${ready ? ' is-set' : ''}`}
        style={spot ? {
          left: spot.left,
          top: spot.top,
          '--chat-hold-x': moved ? '0px' : `${spot.fromX}px`,
          '--chat-hold-y': moved ? '0px' : `${spot.fromY}px`,
        } : { visibility: 'hidden' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="chat-hold-reactions" role="toolbar" aria-label={ru ? 'Реакции' : 'Reaksiyalar'}>
          {quick.map((item, index) => (
            <button
              key={item.id}
              type="button"
              style={{ '--i': index }}
              onClick={() => settle(() => onPick?.(item))}
            >
              {item.char}
            </button>
          ))}
          <button type="button" className="is-more" style={{ '--i': quick.length }} onClick={onMore} aria-label={ru ? 'Ещё' : 'Yana'}>+</button>
        </div>
        <div className="chat-hold-bubble">
          <ChatMessageBlock
            text={message.text}
            mine={mine}
            quote={message.quote || ''}
            replyId={message.replyId || ''}
            animated={message.animated === true}
            animationId={message.animationId || ''}
            gif={message.gif || ''}
            quoteAnimated={message.quoteAnimated === true}
            quoteAnimationId={message.quoteAnimationId || ''}
            quoteGif={message.quoteGif || ''}
          />
        </div>
        <div className="chat-hold-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => settle(onReply)}>
            <MenuIcon>
              <path d="M9 14 4.5 9.5 9 5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4.8 9.5H14a5.5 5.5 0 0 1 5.5 5.5V19" strokeLinecap="round" strokeLinejoin="round" />
            </MenuIcon>
            <span>{ru ? 'Ответить' : 'Javob berish'}</span>
          </button>
          <button type="button" role="menuitem" onClick={() => settle(onCopy)}>
            <MenuIcon>
              <rect x="8" y="8" width="12" height="12" rx="2.2" />
              <path d="M6 16H5.2A1.2 1.2 0 0 1 4 14.8V5.2A1.2 1.2 0 0 1 5.2 4H14.8A1.2 1.2 0 0 1 16 5.2V6" strokeLinecap="round" />
            </MenuIcon>
            <span>{ru ? 'Копировать' : 'Nusxa olish'}</span>
          </button>
          <button type="button" role="menuitem" className="is-danger" onClick={onDelete}>
            <MenuIcon>
              <path d="M4.5 7h15" strokeLinecap="round" />
              <path d="M9 7V5.2A1.2 1.2 0 0 1 10.2 4h3.6A1.2 1.2 0 0 1 15 5.2V7" strokeLinecap="round" />
              <path d="M7.2 7 8 19.2A1.2 1.2 0 0 0 9.2 20.2h5.6a1.2 1.2 0 0 0 1.2-1L16.8 7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 10.5v6M14 10.5v6" strokeLinecap="round" />
            </MenuIcon>
            <span>{ru ? 'Удалить' : 'O‘chirish'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
});

export default ChatMessageHold;
