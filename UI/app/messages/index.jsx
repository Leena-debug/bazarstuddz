import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';

export default function MessagesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState([
    {
      id: 1,
      name: 'Rym A.',
      avatar: 'R',
      lastMessage: "Let's meet in the univ. 🌍",
      time: '20m',
      unread: 0,
      online: true,
      isTyping: false
    },
    {
      id: 2,
      name: 'User',
      avatar: 'U',
      lastMessage: 'User sent a photo 🎥',
      time: '1h',
      unread: 0,
      online: false,
      isTyping: false
    },
    {
      id: 3,
      name: 'Mrs.Dania',
      avatar: 'D',
      lastMessage: '+2 new messages 💬',
      time: '7h',
      unread: 2,
      online: true,
      isTyping: false
    },
    {
      id: 4,
      name: 'Gerr Amina',
      avatar: 'G',
      lastMessage: 'How much is it pls ? 💰',
      time: '7h',
      unread: 0,
      online: false,
      isTyping: false
    },
    {
      id: 5,
      name: 'Insaf Teacher',
      avatar: 'I',
      lastMessage: 'Hello Lyna what\'s new... 😊',
      time: '18h',
      unread: 0,
      online: true,
      isTyping: true
    },
    {
      id: 6,
      name: 'Quibix tech 0198',
      avatar: 'Q',
      lastMessage: 'I have already rate your lis... 😅',
      time: '2d',
      unread: 0,
      online: false,
      isTyping: false
    },
  ]);

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderChat = ({ item }) => (
    <TouchableOpacity 
      style={styles.chatItem}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.avatar}</Text>
        </View>
        {item.online && <View style={styles.onlineDot} />}
      </View>
      
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.chatTime}>{item.time}</Text>
        </View>
        <View style={styles.messageRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.isTyping ? (
              <Text style={styles.typingText}>typing...</Text>
            ) : (
              item.lastMessage
            )}
          </Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F1E9" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {/* Chat List */}
      <FlatList
        data={filteredChats}
        renderItem={renderChat}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.chatList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F1E9',
  },
  header: {
    paddingTop: 55,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#8B5A2B',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    borderRadius: 30,
    height: 45,
    borderWidth: 1,
    borderColor: '#E6D9C2',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
    color: '#999',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  chatList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginTop: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#8B5A2B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#27ae60',
    borderWidth: 2,
    borderColor: '#fff',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  chatTime: {
    fontSize: 11,
    color: '#999',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  typingText: {
    color: '#27ae60',
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});