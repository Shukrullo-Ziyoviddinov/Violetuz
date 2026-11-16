import React, { useEffect, useRef } from 'react';
import ChatMessageBlock from './ChatMessageBlock';

const ChatThread = ({ messages, selfId, notice, typing, typingLabel }) => {
  const threadRef = useRef(null);

  useEffect(() => {
    const node = threadRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, typing]);

  return (
    <div className="chat-thread" ref={threadRef}>
      {notice ? <p className="chat-notice">{notice}</p> : null}
      {messages.map((item) => {
        const mine = String(item.senderId || '').trim().toLowerCase() === String(selfId || '').trim().toLowerCase();
        return (
          <ChatMessageBlock key={item.id} text={item.text} mine={mine} />
        );
      })}
      {typing ? (
        <div className="chat-typing" role="status" aria-label={typingLabel || 'Yozmoqda'}>
          <span className="chat-typing-dot" />
          <span className="chat-typing-dot" />
          <span className="chat-typing-dot" />
        </div>
      ) : null}
    </div>
  );
};

export default ChatThread;
