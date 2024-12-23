import React, { useEffect, useState, useRef } from 'react';
import { View, FlatList, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Text, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useChat } from '../../context/ChatContext';
import { MessageBubble } from '../../components/MessageBubble';
import { ErrorMessage } from '../../components/ErrorMessage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Message, MessageStatus } from '../../types/chat';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export const ChatRoomScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId } = route.params as { chatId: string };
  const {
    activeChat,
    messages,
    fetchMessages,
    sendMessage,
    updateMessageStatus,
    isLoading,
    error,
    hasMore,
    typingUsers,
    startTyping,
    stopTyping,
    setActiveChatById,
  } = useChat();
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    setActiveChatById(chatId);
  }, [chatId]);

  useEffect(() => {
    if (activeChat) {
      navigation.setOptions({ title: activeChat.groupName || activeChat.participants[0].name });
    }
  }, [activeChat, navigation]);

  const handleSend = async () => {
    if (inputText.trim()) {
      try {
        await sendMessage(chatId, inputText.trim(), 'text');
        setInputText('');
      } catch (err) {
        console.error('Failed to send message:', err);
      }
    }
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchMessages(chatId);
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <MessageBubble 
      message={item} 
      isCurrentUser={item.sender.id === user?.id}
      onLongPress={() => handleMessageLongPress(item)}
    />
  );

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#0000ff" />
      </View>
    );
  };

  const handleTyping = (text: string) => {
    setInputText(text);
    startTyping(chatId);
  };

  const handleStopTyping = () => {
    stopTyping(chatId);
  };

  const handleMessageLongPress = (message: Message) => {
    // Implement logic for message options (e.g., delete, forward, etc.)
    console.log('Message long pressed:', message);
  };

  const renderTypingIndicator = () => {
    const typingUserIds = typingUsers[chatId] || [];
    if (typingUserIds.length === 0) return null;

    const typingText = typingUserIds.length === 1
      ? 'is typing...'
      : 'are typing...';

    return (
      <View style={styles.typingIndicator}>
        <Text style={styles.typingText}>{typingText}</Text>
      </View>
    );
  };

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      await sendMessage(chatId, result.assets[0].uri, 'image');
    }
  };

  const handleFilePicker = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
    });

    if (result.type === 'success') {
      await sendMessage(chatId, result.uri, 'file');
    }
  };

  const handleUpdateMessageStatus = (messageId: string, status: MessageStatus) => {
    updateMessageStatus(messageId, status);
  };

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage 
          message={error} 
          onRetry={() => fetchMessages(chatId, true)} 
          retryText="Retry loading messages"
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        inverted
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListHeaderComponent={renderTypingIndicator}
        contentContainerStyle={styles.messageList}
      />
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton} onPress={handleFilePicker}>
          <Icon name="attach-file" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.imageButton} onPress={handleImagePicker}>
          <Icon name="image" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={handleTyping}
          placeholder="Type a message..."
          onBlur={handleStopTyping}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Icon name="send" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    paddingVertical: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  sendButton: {
    padding: 10,
  },
  attachButton: {
    padding: 10,
  },
  imageButton: {
    padding: 10,
  },
  loaderContainer: {
    paddingVertical: 20,
  },
  typingIndicator: {
    padding: 8,
    backgroundColor: '#f0f0f0',
  },
  typingText: {
    color: '#666',
    fontStyle: 'italic',
  },
});

export default ChatRoomScreen;

