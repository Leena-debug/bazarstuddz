import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ChatScreen() {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const flatListRef = useRef();
  const [isTyping, setIsTyping] = useState(false);
  
  // Chat data - in real app, fetch from backend
  const [chatUser, setChatUser] = useState({
    id: id || '1',
    name: name || 'Rym A.',
    avatar: 'R',
    online: true,
    lastSeen: 'Online',
  });

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Assalamu alaykum, HI Rym you can buy this book !",
      sender: 'me',
      time: '10:00 AM',
      status: 'read'
    },
    {
      id: 2,
      text: "Wa alaykum salam, unfortunately Lyna !",
      sender: 'other',
      time: '10:02 AM',
      status: 'read'
    },
    {
      id: 3,
      text: "Let's meet In the university today",
      sender: 'me',
      time: '10:05 AM',
      status: 'read'
    },
    {
      id: 4,
      text: "I have work today so If you want tomorrow ?",
      sender: 'other',
      time: '10:08 AM',
      status: 'read'
    },
    {
      id: 5,
      text: "And I'm free at 9:35 till after Dhuhr prayer",
      sender: 'other',
      time: '10:09 AM',
      status: 'read'
    },
    {
      id: 6,
      text: "Okay Insha'ALLAH I agree with u Lyna !",
      sender: 'me',
      time: '10:12 AM',
      status: 'read'
    },
    {
      id: 7,
      text: "Insha'ALLAH , nice see you there Rym !",
      sender: 'other',
      time: '10:15 AM',
      status: 'read'
    },
  ]);

  // Simulate typing indicator
  useEffect(() => {
    const typingTimeout = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
    return () => clearTimeout(typingTimeout);
  }, [isTyping]);

  const sendMessage = () => {
    if (!message.trim()) return;
    
    const newMessage = {
      id: messages.length + 1,
      text: message.trim(),
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };
    
    setMessages([...messages, newMessage]);
    setMessage('');
    
    // Simulate reply after 2 seconds
    setTimeout(() => {
      const replyMessage = {
        id: messages.length + 2,
        text: "Okay, noted! 👍",
        sender: 'other',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read'
      };
      setMessages(prev => [...prev, replyMessage]);
      setIsTyping(false);
    }, 2000);
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender === 'me';
    
    return (
      <View style={[
        styles.messageWrapper,
        isMe ? styles.myMessageWrapper : styles.otherMessageWrapper
      ]}>
        {!isMe && (
          <View style={styles.otherAvatar}>
            <Text style={styles.otherAvatarText}>{chatUser.avatar}</Text>
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isMe ? styles.myBubble : styles.otherBubble
        ]}>
          <Text style={isMe ? styles.myMessageText : styles.otherMessageText}>
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={styles.messageTime}>{item.time}</Text>
            {isMe && (
              <Text style={styles.messageStatus}>
                {item.status === 'read' ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#8B5A2B" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{chatUser.name}</Text>
          <Text style={styles.headerStatus}>
            {isTyping ? 'typing...' : (chatUser.online ? 'Online' : 'Offline')}
          </Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuIcon}>⋮</Text>
        </TouchableOpacity>
      </View>
      
      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />
      
      {/* Typing Indicator */}
      {isTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>Rym A. is typing...</Text>
        </View>
      )}
      
      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Text style={styles.attachIcon}>+</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={message}
            onChangeText={(text) => {
              setMessage(text);
              if (text.length > 0) setIsTyping(true);
            }}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F1E9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#8B5A2B',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 28,
    color: '#fff',
  },
  headerInfo: {
    alignItems: 'center',
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerStatus: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: '#fff',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  myMessageWrapper: {
    justifyContent: 'flex-end',
  },
  otherMessageWrapper: {
    justifyContent: 'flex-start',
  },
  otherAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8B5A2B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  otherAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 20,
  },
  myBubble: {
    backgroundColor: '#8B5A2B',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E6D9C2',
  },
  myMessageText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 20,
  },
  otherMessageText: {
    fontSize: 15,
    color: '#2c3e50',
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginRight: 4,
  },
  messageStatus: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  typingIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 12,
    color: '#27ae60',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E6D9C2',
    gap: 12,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachIcon: {
    fontSize: 22,
    color: '#8B5A2B',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5A2B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 18,
    color: '#fff',
  },
});