import React from 'react';
import { Text } from 'react-native';
import CardWithText from '../CardWithText/CardWithText';
import { DownloadItemProps } from './types';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';

const DownloadItem: React.FC<DownloadItemProps> = ({
  label,
  imageSource,
  onPress,
  containerStyle,
}) => {
  const { theme } = useTheme();
  return (
    <CardWithText
      onPress={onPress}
      imageSource={imageSource}
      containerStyle={[styles.card, { backgroundColor: theme.card.background }, containerStyle]}
      imageContainerStyle={styles.imageContainer}
      bottomContent={<Text style={[styles.label, { color: theme.screen.text }]}>{label}</Text>}
    />
  );
};

export default DownloadItem;
