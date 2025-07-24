import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import styles from './styles';
import { getImageUrl } from '@/constants/HelperFunctions';

const AppDownload = () => {
  useSetPageTitle(TranslationKeys.app_download);
  const { theme } = useTheme();
  const { serverInfo, appSettings, primaryColor } = useSelector(
    (state: RootState) => state.settings
  );
  const [projectName, setProjectName] = useState('');
  const projectColor = serverInfo?.info?.project?.project_color || primaryColor;

  useEffect(() => {
    if (serverInfo && serverInfo.info) {
      setProjectName(serverInfo.info.project.project_name);
    }
  }, [serverInfo]);



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
        <Text style={{ ...styles.heading, color: theme.screen.text }}>{projectName}</Text>
      </View>
    </ScrollView>
  );
};

export default AppDownload;
