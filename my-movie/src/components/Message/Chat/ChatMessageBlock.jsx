import React from 'react';

const ChatMessageBlock = ({ text, mine, status = null, quote = '' }) => (
  <div className={`chat-block${mine ? ' is-mine' : ''}${status ? ' has-status' : ''}${quote ? ' has-quote' : ''}`}>
    {quote ? (
      <div className="chat-reply-quote">
        <span className="chat-reply-film" aria-hidden="true" />
        <span className="chat-reply-quote-text">{quote}</span>
      </div>
    ) : null}
    <span className="chat-block-text">{text}</span>
    {status}
  </div>
);

export default ChatMessageBlock;
