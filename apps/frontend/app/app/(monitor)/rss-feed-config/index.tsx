import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './styles';

const RssFeedConfig = () => {
  useSetPageTitle(TranslationKeys.rss_feed);
  const { theme } = useTheme();
  const { translate } = useLanguage();
  const [urls, setUrls] = useState('');
  const [interval, setInterval] = useState('10');

  return (
    <View style={[styles.container, { backgroundColor: theme.screen.background }]}>
      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.screen.text }]}>RSS Feed URLs (comma separated)</Text>
        <TextInput
          style={[styles.input, { color: theme.screen.text, borderColor: theme.screen.icon }]}
          value={urls}
          onChangeText={setUrls}
          placeholder='https://example.com/feed'
          placeholderTextColor={theme.screen.icon}
        />
      </View>
      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.screen.text }]}>Switch Interval (seconds)</Text>
        <TextInput
          style={[styles.input, { color: theme.screen.text, borderColor: theme.screen.icon }]}
          value={interval}
          onChangeText={setInterval}
          keyboardType='number-pad'
          placeholder='10'
          placeholderTextColor={theme.screen.icon}
        />
      </View>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.screen.iconBg }]}
        onPress={() => {
          router.push({
            pathname: '/rss-feed',
            params: { urls, switchIntervalInSeconds: interval },
          });
        }}
      >
        <Text style={[styles.buttonText, { color: theme.screen.text }]}>{translate(TranslationKeys.rss_feed)}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RssFeedConfig;
