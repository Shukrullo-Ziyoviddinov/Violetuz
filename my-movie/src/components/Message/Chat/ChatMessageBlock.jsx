import React from 'react';
import { emojiOnlyCount } from './chatEmojis';

const ChatMessageBlock = ({ text, mine, status = null, quote = '', replyId = '' }) => {
  const emojiCount = emojiOnlyCount(text);
  const quoteEmoji = emojiOnlyCount(quote);
  const emojiClass = emojiCount > 1 ? ' is-emoji is-emoji-row' : emojiCount === 1 ? ' is-emoji' : '';
  const quoteClass = quoteEmoji > 1 ? ' is-emoji-quote is-emoji-row' : quoteEmoji === 1 ? ' is-emoji-quote' : '';
  return (
    <div className={`chat-block${mine ? ' is-mine' : ''}${status ? ' has-status' : ''}${quote ? ' has-quote' : ''}${emojiClass}`}>
      {quote ? (
        <button
          type="button"
          className={`chat-reply-quote${quoteClass}`}
          data-reply-id={replyId || undefined}
        >
          <span className="chat-reply-film" aria-hidden="true" />
          <span className="chat-reply-quote-text">{quote}</span>
        </button>
      ) : null}
      <div className="chat-block-main">
        <span className="chat-block-text">{text}</span>
        {status}
      </div>
    </div>
  );
};

export default ChatMessageBlock;
