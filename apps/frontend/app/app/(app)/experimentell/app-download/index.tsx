import React, { useEffect, useState } from 'react';
import { Image, ScrollView, Text, View, Platform, Linking } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import styles from './styles';
import RedirectButton from '@/components/RedirectButton';
import QRCode from 'qrcode';

const AppDownload = () => {
  useSetPageTitle(TranslationKeys.app_download);
  const { theme } = useTheme();
  const { serverInfo, appSettings } = useSelector((state: RootState) => state.settings);
  const [projectName, setProjectName] = useState('');
  const [iosQr, setIosQr] = useState<string>('');
  const [androidQr, setAndroidQr] = useState<string>('');

  useEffect(() => {
    if (serverInfo && serverInfo.info) {
      setProjectName(serverInfo.info.project.project_name);
    }
  }, [serverInfo]);

  useEffect(() => {
    if (appSettings?.app_stores_url_to_apple) {
      QRCode.toDataURL(appSettings.app_stores_url_to_apple)
        .then(setIosQr)
        .catch(console.error);
    }
    if (appSettings?.app_stores_url_to_google) {
      QRCode.toDataURL(appSettings.app_stores_url_to_google)
        .then(setAndroidQr)
        .catch(console.error);
    }
  }, [appSettings]);

  const openInBrowser = async (url: string) => {
    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        }
      }
    } catch (e) {
      console.error('Error opening url', e);
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
      <View style={styles.content}>
        <Image source={require('../../../../assets/images/icon.png')} style={styles.icon} />
        <Text style={{ ...styles.heading, color: theme.screen.text }}>{projectName}</Text>
        <View style={styles.qrRow}>
          {iosQr ? (
            <View style={styles.qrCol}>
              <Image source={{ uri: iosQr }} style={styles.qr} />
              <RedirectButton
                label='iOS'
                onClick={() => appSettings?.app_stores_url_to_apple && openInBrowser(appSettings.app_stores_url_to_apple)}
              />
            </View>
          ) : null}
          {androidQr ? (
            <View style={styles.qrCol}>
              <Image source={{ uri: androidQr }} style={styles.qr} />
              <RedirectButton
                label='Android'
                onClick={() => appSettings?.app_stores_url_to_google && openInBrowser(appSettings.app_stores_url_to_google)}
              />
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
};

export default AppDownload;
