import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
    Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import CardWithText from '@/components/CardWithText/CardWithText';
import CardDimensionHelper from '@/helper/CardDimensionHelper';
import QrCode from '@/components/QrCode';
import { getImageUrl } from '@/constants/HelperFunctions';
import styles from './styles';

const AppDownload = () => {
  useSetPageTitle(TranslationKeys.app_download);
  const { theme } = useTheme();
  const { serverInfo, appSettings, primaryColor } = useSelector(
    (state: RootState) => state.settings
  );
  
  
  const [projectName, setProjectName] = useState('');
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const projectColor = serverInfo?.info?.project?.project_color || primaryColor;

  useEffect(() => {
    if (serverInfo && serverInfo.info) {
      setProjectName(serverInfo.info.project.project_name);
    }
  }, [serverInfo]);

    

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => sub?.remove();
  }, []);



  const projectLogo =
    serverInfo?.info?.project?.project_logo &&
    getImageUrl(serverInfo.info.project.project_logo);

  const iconSource = projectLogo
    ? { uri: projectLogo }
    : require('../../../../assets/images/icon.png');

  
  const cardSize = CardDimensionHelper.getCardWidth(screenWidth, 2);


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
        <View style={styles.cardsContainer}>
          <CardWithText topRadius={0} containerStyle={{ width: cardSize, backgroundColor: theme.card.background }} imageContainerStyle={{ height: cardSize }} contentStyle={styles.cardContent} imageChildren={<QrCode value={appSettings?.app_stores_url_to_google || ""} size={cardSize * 0.9} />}>
            <Text style={{ ...styles.cardTitle, color: theme.screen.text }}>Google Play</Text>
          </CardWithText>
          <CardWithText topRadius={0} containerStyle={{ width: cardSize, backgroundColor: theme.card.background }} imageContainerStyle={{ height: cardSize }} contentStyle={styles.cardContent} imageChildren={<QrCode value={appSettings?.app_stores_url_to_apple || ""} size={cardSize * 0.9} />}>
            <Text style={{ ...styles.cardTitle, color: theme.screen.text }}>Apple Store</Text>
          </CardWithText>
        </View>
      </View>
    </ScrollView>
  );
};

export default AppDownload;
