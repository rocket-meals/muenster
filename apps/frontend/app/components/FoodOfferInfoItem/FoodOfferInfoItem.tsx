import React, { memo } from 'react';
import { Text, Linking } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FoodOfferInfoItemProps } from './types';
import styles from './styles';
import CardWithText from '../CardWithText/CardWithText';
import { getImageUrl } from '@/constants/HelperFunctions';
import { isWeb } from '@/constants/Constants';

const FoodOfferInfoItem: React.FC<FoodOfferInfoItemProps> = memo(({ item, content }) => {
  const { theme } = useTheme();

  const imageId = typeof item.image === 'string' ? item.image : item.image?.id;
  const imageUri = item.image_remote_url || (imageId ? getImageUrl(imageId) : undefined);

  const openInBrowser = async (url: string) => {
    try {
      if (isWeb) {
        window.open(url, '_blank');
      } else {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        }
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
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
      containerStyle={[styles.container, { backgroundColor: theme.card.background }]}
      imageContainerStyle={styles.imageContainer}
      contentStyle={styles.content}
    >
      <Text style={[styles.text, { color: theme.screen.text }]}>{content}</Text>
    </CardWithText>
  );
});

export default FoodOfferInfoItem;
