import React from 'react';
import { ScrollView, View } from 'react-native';
import MyImage from '@/components/MyImage';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { getImageUrl } from '@/constants/HelperFunctions';
import { CommonSystemActionHelper } from '@/helper/SystemActionHelper';
import DownloadItem from '@/components/DownloadItem';
import appleStoreIcon from '@/assets/icons/apple-store.png';
import googlePlayIcon from '@/assets/icons/google-play.png';
import styles from './styles';

const AppDownload = () => {
  useSetPageTitle(TranslationKeys.app_download);
  const { theme } = useTheme();
  const { serverInfo, appSettings } = useSelector(
    (state: RootState) => state.settings
  );



  const projectLogo =
    serverInfo?.info?.project?.project_logo &&
    getImageUrl(serverInfo.info.project.project_logo);

  const iconSource = projectLogo
    ? { uri: projectLogo }
    : require('../../../../assets/images/icon.png');

  const iosUrl = appSettings?.app_stores_url_to_apple;
  const androidUrl = appSettings?.app_stores_url_to_google;

  const handleOpenAppleStore = () => {
    if (appSettings?.app_stores_url_to_apple) {
      CommonSystemActionHelper.openExternalURL(
        appSettings.app_stores_url_to_apple,
        true
      );
    }
  };

  const handleOpenGooglePlay = () => {
    if (appSettings?.app_stores_url_to_google) {
      CommonSystemActionHelper.openExternalURL(
        appSettings.app_stores_url_to_google,
        true
      );
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
        <MyImage source={iconSource} style={styles.icon} />
        <View style={styles.itemsContainer}>
          <DownloadItem
            label='iOS'
            qrValue={iosUrl}
            imageSource={appleStoreIcon}
            onPress={handleOpenAppleStore}
          />
          <DownloadItem
            label='Android'
            qrValue={androidUrl}
            imageSource={googlePlayIcon}
            onPress={handleOpenGooglePlay}
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default AppDownload;

