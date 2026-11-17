import React from 'react';

const ChatMessageBlock = ({ text, mine, status = null }) => (
  <div className={`chat-block${mine ? ' is-mine' : ''}${status ? ' has-status' : ''}`}>
    <span className="chat-block-text">{text}</span>
    {status}
  </div>
);

export default ChatMessageBlock;
