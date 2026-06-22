// AI 어드바이저 채팅 말풍선 — senderType USER(오른쪽) / AI(왼쪽) 배치
import React from 'react';

export default function ChatBubble({ message, senderType }) {
  const isUser = senderType === 'USER';
  return (
    <div className={`chat-bubble${isUser ? ' chat-bubble--user' : ' chat-bubble--bot'}`}>
      {message}
    </div>
  );
}
