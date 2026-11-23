import React from 'react';
import { createPortal } from 'react-dom';
import { emojiFromId, emojiOnlyCount } from './chatEmojis';
import ChatMessageBlock from './ChatMessageBlock';

const QUICK = ['1f44d', '2764', '1f602', '1f62e', '1f37f', '1f525'];

const mediaMessage = (message) => Boolean(
  message?.gif
  || message?.animationId
  || message?.animated
  || emojiOnlyCount(message?.text)
);

const ChatMessageHold = ({ message, anchor, lang, onClose, onReply, onCopy, onDelete, onPick, onMore }) => {
  const ru = lang === 'ru';
  const mine = message.mine === true;
  const compact = mediaMessage(message);
  const quick = QUICK.map((id) => emojiFromId(id)).filter(Boolean);
  const top = Math.max(8, anchor?.top || 120);
  const menuBelow = (anchor?.bottom || 0) < window.innerHeight - 220;

  return createPortal(
    <div className="chat-hold" role="presentation" onClick={onClose}>
      <div
        className={`chat-hold-stage${mine ? ' is-mine' : ''}${compact ? ' is-compact' : ''}${menuBelow ? '' : ' is-flip'}`}
        style={{
          top,
          left: mine ? 'auto' : Math.max(12, anchor?.left || 12),
          right: mine ? Math.max(12, window.innerWidth - (anchor?.right || window.innerWidth - 12)) : 'auto',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="chat-hold-reactions" role="toolbar" aria-label={ru ? 'Реакции' : 'Reaksiyalar'}>
          {quick.map((item, index) => (
            <button
              key={item.id}
              type="button"
              style={{ '--i': index }}
              onClick={() => onPick?.(item)}
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
          <button type="button" role="menuitem" onClick={onReply}>{ru ? 'Ответить' : 'Javob berish'}</button>
          <button type="button" role="menuitem" onClick={onCopy}>{ru ? 'Копировать' : 'Nusxa olish'}</button>
          <button type="button" role="menuitem" className="is-danger" onClick={onDelete}>{ru ? 'Удалить' : 'O‘chirish'}</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ChatMessageHold;
