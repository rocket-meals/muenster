import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import * as StoreReview from 'expo-store-review';
import styles from './styles';

const RateApp = () => {
  useSetPageTitle(TranslationKeys.rate_app);
  const { theme } = useTheme();
  const { translate } = useLanguage();

  const handleRate = async () => {
    try {
      const available = await StoreReview.isAvailableAsync();
      if (available) {
        await StoreReview.requestReview();
      }
    } catch (e) {
      console.log('Error requesting review', e);
    }
  };

  return (
    <ScrollView
      style={{ ...styles.container, backgroundColor: theme.screen.background }}
      contentContainerStyle={{
        ...styles.contentContainer,
        backgroundColor: theme.screen.background,
      }}
    >
      <View style={{ ...styles.content }}>
        <Text style={{ ...styles.heading, color: theme.screen.text }}>
          {translate(TranslationKeys.rate_app)}
        </Text>
        <TouchableOpacity
          style={{ ...styles.listItem, backgroundColor: theme.screen.iconBg }}
          onPress={handleRate}
        >
          <Text style={{ ...styles.body, color: theme.screen.text }}>
            {translate(TranslationKeys.rate_app)}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default RateApp;
