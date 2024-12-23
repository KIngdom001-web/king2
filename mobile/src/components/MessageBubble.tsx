import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Message } from '../types/chat';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  onLongPress: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isCurrentUser, onLongPress }) => {
  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return <Text style={styles.messageText}>{message.content}</Text>;
      case 'image':
        return (
          <Image
            source={{ uri: message.content }}
            style={styles.imageContent}
            resizeMode="cover"
          />
        );
      case 'file':
        return (
          <View style={styles.fileContent}>
            <Icon name="insert-drive-file" size={24} color="#007AFF" />
            <Text style={styles.fileName}>{message.content.split('/').pop()}</Text>
          </View>
        );
      default:
        return <Text style={styles.messageText}>Unsupported message type</Text>;
    }
  };

  const renderStatus = () => {
    switch (message.status) {
      case 'sent':
        return <Icon name="check" size={16} color="#999" />;
      case 'delivered':
        return <Icon name="done-all" size={16} color="#999" />;
      case 'read':
        return <Icon name="done-all" size={16} color="#4CAF50" />;
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity onLongPress={onLongPress}>
      <View style={[
        styles.messageBubble,
        isCurrentUser ? styles.currentUser : styles.otherUser
      ]}>
        {renderContent()}
        <View style={styles.messageFooter}>
          <Text style={styles.timestamp}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isCurrentUser && renderStatus()}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 20,
    marginBottom: 10,
  },
  currentUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  otherUser: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
  },
  messageText: {
    fontSize: 16,
  },
  imageContent: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  fileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileName: {
    marginLeft: 10,
    fontSize: 14,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 5,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginRight: 5,
  },
});

