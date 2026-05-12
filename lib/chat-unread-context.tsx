import React, { createContext, useContext, useState } from 'react';

interface ChatUnreadContextType {
  hasUnreadAiMsg: boolean;
  setHasUnreadAiMsg: (val: boolean) => void;
}

const ChatUnreadContext = createContext<ChatUnreadContextType>({
  hasUnreadAiMsg: false,
  setHasUnreadAiMsg: () => {},
});

export function ChatUnreadProvider({ children }: { children: React.ReactNode }) {
  const [hasUnreadAiMsg, setHasUnreadAiMsg] = useState(false);
  return (
    <ChatUnreadContext.Provider value={{ hasUnreadAiMsg, setHasUnreadAiMsg }}>
      {children}
    </ChatUnreadContext.Provider>
  );
}

export function useChatUnread() {
  return useContext(ChatUnreadContext);
}
