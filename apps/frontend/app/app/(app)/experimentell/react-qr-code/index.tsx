import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';
import { useLanguage } from '@/hooks/useLanguage';
import QRCode from 'react-qr-code';
import styles from './styles';

const ReactQrCodeScreen = () => {
  useSetPageTitle(TranslationKeys.react_qr_code);
  const { theme } = useTheme();
  const { translate } = useLanguage();

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
          {translate(TranslationKeys.react_qr_code)}
        </Text>
        <QRCode value="https://example.com" size={200} />
      </View>
    </ScrollView>
  );
};

export default ReactQrCodeScreen;
