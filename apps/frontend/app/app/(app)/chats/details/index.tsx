import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLocalSearchParams } from 'expo-router';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';
import MyMarkdown from '@/components/MyMarkdown/MyMarkdown';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import { myContrastColor } from '@/helper/colorHelper';
import { ChatMessagesHelper } from '@/redux/actions/Chats/ChatMessages';
import { DatabaseTypes } from 'repo-depkit-common';
import styles from './styles';


const ChatDetailsScreen = () => {
  useSetPageTitle(TranslationKeys.chat);
  const { theme } = useTheme();
  const { chat_id } = useLocalSearchParams<{ chat_id?: string }>();
  const { primaryColor: projectColor, selectedTheme: mode } = useSelector(
    (state: RootState) => state.settings
  );

  const { chats } = useSelector((state: RootState) => state.chats);
  const { profile } = useSelector((state: RootState) => state.authReducer);
  const [messages, setMessages] = useState<DatabaseTypes.ChatMessages[]>([]);

  useEffect(() => {
    const fetchMsgs = async () => {
      if (chat_id) {
        try {
          const helper = new ChatMessagesHelper();
          const result = (await helper.fetchMessagesByChat(chat_id)) as DatabaseTypes.ChatMessages[];
          if (result) {
            setMessages(result);
          }
        } catch (e) {
          console.error('Error fetching chat messages:', e);
        }
      }
    };
    fetchMsgs();
  }, [chat_id]);

  const chatTitle = chats.find((c) => c.id === chat_id)?.alias || 'Chat';

  const sortedMessages = [...messages].sort((a, b) => {
    const da = a.date_created || a.date_updated || '';
    const db = b.date_created || b.date_updated || '';
    return da < db ? 1 : -1;
  });

  const renderItem = ({ item }: { item: DatabaseTypes.ChatMessages }) => {
    const profileId = typeof item.profile === 'object' ? item.profile?.id : item.profile;
    const isMe = profileId === profile?.id;
    const bgColor = isMe ? projectColor : theme.card.background;
    const textColor = myContrastColor(bgColor, theme, mode === 'dark');

    if (!item.message) {
      return null; // Skip rendering if message is empty
    }

    return (
      <View
        style={[
          styles.messageItem,
          { alignSelf: isMe ? 'flex-end' : 'flex-start' },
        ]}
      >
        <View style={[styles.bubble, { backgroundColor: bgColor }]}>
          <MyMarkdown content={item.message} textColor={textColor} />
        </View>
        <Text
          style={{
            ...styles.timestamp,
            color: theme.screen.text,
            textAlign: isMe ? 'right' : 'left',
          }}
        >
          {new Date(item.date_created+"").toLocaleString()}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.screen.background }]}>
      <FlatList
        data={sortedMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

export default ChatDetailsScreen;
