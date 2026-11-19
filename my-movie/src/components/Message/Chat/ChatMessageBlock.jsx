import React from 'react';

const ChatMessageBlock = ({ text, mine, status = null, quote = '', replyId = '' }) => (
  <div className={`chat-block${mine ? ' is-mine' : ''}${status ? ' has-status' : ''}${quote ? ' has-quote' : ''}`}>
    {quote ? (
      <button
        type="button"
        className="chat-reply-quote"
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

export default ChatMessageBlock;
