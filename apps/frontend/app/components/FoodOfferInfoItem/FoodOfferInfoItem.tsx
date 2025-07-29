import React, { memo } from 'react';
import { Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FoodOfferInfoItemProps } from './types';
import styles from './styles';
import CardWithText from '../CardWithText/CardWithText';
import { getImageUrl } from '@/constants/HelperFunctions';
import { isWeb } from '@/constants/Constants';
import useFoodCard from '@/hooks/useFoodCard';
import {CommonSystemActionHelper} from "@/helper/SystemActionHelper";

const FoodOfferInfoItem: React.FC<FoodOfferInfoItemProps> = memo(({ item, content }) => {
  const { theme } = useTheme();

  const {
    containerStyle: cardContainerStyle,
    imageContainerStyle: cardImageContainerStyle,
    contentStyle: cardContentStyle,
  } = useFoodCard();



  const imageId = typeof item.image === 'string' ? item.image : item.image?.id;
  const imageUri = item.image_remote_url || (imageId ? getImageUrl(imageId) : undefined);

  const openInBrowser = async (url: string) => {
    CommonSystemActionHelper.openExternalURL(url, true);
  };

  const handlePress = () => {
    if (item.link) {
      openInBrowser(item.link);
    }
  };

  return (
    <CardWithText
      onPress={item.link ? handlePress : undefined}
      imageSource={imageUri ? { uri: imageUri } : undefined}
      containerStyle={cardContainerStyle}
      imageContainerStyle={cardImageContainerStyle}
      contentStyle={cardContentStyle}
    >
      <Text style={[styles.text, { color: theme.screen.text }]}>{content}</Text>
    </CardWithText>
  );
});

export default FoodOfferInfoItem;
