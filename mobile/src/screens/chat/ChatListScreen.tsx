import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, ActivityIndicator, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useChat } from '../../context/ChatContext';
import { ChatListItem } from '../../components/ChatListItem';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Chat } from '../../types/chat';

export const ChatListScreen: React.FC = () => {
  const navigation = useNavigation();
  const { chats, fetchChats, isLoading, error } = useChat();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      await fetchChats();
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Chat }) => (
    <ChatListItem
      chat={item}
      onPress={() => navigation.navigate('ChatRoom', { chatId: item.id })}
    />
  );

  if (isLoading && chats.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error && chats.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage message={error} onRetry={loadChats} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {chats.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.noChatsText}>No chats yet. Start a new conversation!</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  noChatsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

