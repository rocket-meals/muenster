import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, Image } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './styles';
import QRCodeGenerator from 'qrcode-generator';

const QrcodeGeneratorScreen = () => {
  useSetPageTitle(TranslationKeys.qrcode_generator);
  const { theme } = useTheme();
  const { translate } = useLanguage();
  const [uri, setUri] = useState('');

  useEffect(() => {
    const qr = QRCodeGenerator(0, 'H');
    qr.addData('https://example.com');
    qr.make();
    setUri(qr.createDataURL(8, 4));
  }, []);

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
          {translate(TranslationKeys.qrcode_generator)}
        </Text>
        {uri ? <Image source={{ uri }} style={styles.qr} /> : null}
      </View>
    </ScrollView>
  );
};

export default QrcodeGeneratorScreen;
