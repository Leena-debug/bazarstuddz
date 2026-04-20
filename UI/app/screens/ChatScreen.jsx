import React, { useState, useCallback } from 'react';
import { GiftedChat } from 'react-native-gifted-chat';

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { _id: 1, text: 'Hello! Is this product available?', createdAt: new Date(), user: { _id: 2, name: 'Buyer' } },
  ]);

  const onSend = useCallback((messages = []) => {
    setMessages(previousMessages => GiftedChat.append(previousMessages, messages));
  }, []);

  return (
    <GiftedChat
      messages={messages}
      onSend={messages => onSend(messages)}
      user={{ _id: 1, name: 'You' }}
    />
  );
}