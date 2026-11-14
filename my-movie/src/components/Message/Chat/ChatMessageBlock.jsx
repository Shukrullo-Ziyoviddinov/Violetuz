import React from 'react';

const ChatMessageBlock = ({ text, mine }) => (
  <div className={`chat-block${mine ? ' is-mine' : ''}`}>{text}</div>
);

export default ChatMessageBlock;
