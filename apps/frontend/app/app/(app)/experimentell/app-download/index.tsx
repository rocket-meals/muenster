import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
  View,
  Platform,
  Linking,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import styles from './styles';
import { getImageUrl } from '@/constants/HelperFunctions';
import RedirectButton from '@/components/RedirectButton';
import QRCode from 'qrcode';
import CardDimensionHelper from '@/helper/CardDimensionHelper';

const AppDownload = () => {
  useSetPageTitle(TranslationKeys.app_download);
  const { theme } = useTheme();
  const { serverInfo, appSettings } = useSelector((state: RootState) => state.settings);
  const [projectName, setProjectName] = useState('');
  const [iosQr, setIosQr] = useState<string>('');
  const [androidQr, setAndroidQr] = useState<string>('');
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const log = (msg: string) => setDebugLogs((logs) => [...logs, msg]);

  const qrOptions = {
    errorCorrectionLevel: 'H',
    type: 'image/jpeg',
    quality: 0.3,
    margin: 1,
    color: {
      dark: '#010599FF',
      light: '#FFBF60FF',
    },
  };

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (serverInfo && serverInfo.info) {
      setProjectName(serverInfo.info.project.project_name);
    }
  }, [serverInfo]);

  useEffect(() => {
    if (appSettings?.app_stores_url_to_apple) {
      log(`Generate iOS QR for ${appSettings.app_stores_url_to_apple}`);
      QRCode.toDataURL(appSettings.app_stores_url_to_apple, qrOptions, (err, url) => {
        if (err) {
          console.error(err);
          log(`iOS QR error: ${err}`);
          return;
        }
        setIosQr(url);
        log('iOS QR created');
      });
    }
    if (appSettings?.app_stores_url_to_google) {
      log(`Generate Android QR for ${appSettings.app_stores_url_to_google}`);
      QRCode.toDataURL(appSettings.app_stores_url_to_google, qrOptions, (err, url) => {
        if (err) {
          console.error(err);
          log(`Android QR error: ${err}`);
          return;
        }
        setAndroidQr(url);
        log('Android QR created');
      });
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

  const projectLogo =
    serverInfo?.info?.project?.project_logo &&
    getImageUrl(serverInfo.info.project.project_logo);

  const iconSource = projectLogo
    ? { uri: projectLogo }
    : require('../../../../assets/images/icon.png');

  const qrSize = CardDimensionHelper.getCardDimension(screenWidth);

  return (
    <ScrollView
      style={{ ...styles.container, backgroundColor: theme.screen.background }}
      contentContainerStyle={{
        ...styles.contentContainer,
        backgroundColor: theme.screen.background,
      }}
    >
      <View style={styles.content}>
        <Image source={iconSource} style={styles.icon} />
        <Text style={{ ...styles.heading, color: theme.screen.text }}>{projectName}</Text>
        <View style={styles.qrRow}>
          {iosQr ? (
            <View style={styles.qrCol}>
              {appSettings?.app_stores_url_to_apple && (
                <Text selectable style={styles.urlText}>
                  {appSettings.app_stores_url_to_apple}
                </Text>
              )}
              <View style={styles.qrDebugWrapper}>
                <Image source={{ uri: iosQr }} style={[styles.qr, { width: qrSize, height: qrSize }]} />
              </View>
              <Text selectable style={styles.uriText}>{iosQr}</Text>
              <RedirectButton
                label='iOS'
                onClick={() => appSettings?.app_stores_url_to_apple && openInBrowser(appSettings.app_stores_url_to_apple)}
              />
            </View>
          ) : null}
          {androidQr ? (
            <View style={styles.qrCol}>
              {appSettings?.app_stores_url_to_google && (
                <Text selectable style={styles.urlText}>
                  {appSettings.app_stores_url_to_google}
                </Text>
              )}
              <View style={styles.qrDebugWrapper}>
                <Image source={{ uri: androidQr }} style={[styles.qr, { width: qrSize, height: qrSize }]} />
              </View>
              <Text selectable style={styles.uriText}>{androidQr}</Text>
              <RedirectButton
                label='Android'
                onClick={() => appSettings?.app_stores_url_to_google && openInBrowser(appSettings.app_stores_url_to_google)}
              />
            </View>
          ) : null}
        </View>
        {debugLogs.length > 0 && (
          <View style={styles.debugLogContainer}>
            <ScrollView>
              {debugLogs.map((l, i) => (
                <Text key={i} style={styles.debugLogText}>
                  {l}
                </Text>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default AppDownload;
