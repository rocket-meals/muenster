import React from 'react';
import { Image, ScrollView, View } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { getImageUrl } from '@/constants/HelperFunctions';
import DownloadItem from '@/components/DownloadItem';
import styles from './styles';

const AppDownload = () => {
  useSetPageTitle(TranslationKeys.app_download);
  const { theme } = useTheme();
  const { serverInfo } = useSelector(
    (state: RootState) => state.settings
  );



  const projectLogo =
    serverInfo?.info?.project?.project_logo &&
    getImageUrl(serverInfo.info.project.project_logo);

  const iconSource = projectLogo
    ? { uri: projectLogo }
    : require('../../../../assets/images/icon.png');


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
        <View style={styles.downloadRow}>
          <DownloadItem
            label='iOS'
            imageSource={require('../../../../assets/icons/apple-store.png')}
            containerStyle={styles.downloadItem}
          />
          <DownloadItem
            label='Android'
            imageSource={require('../../../../assets/icons/google-play.png')}
            containerStyle={styles.downloadItem}
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default AppDownload;
