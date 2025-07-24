import React from 'react';
import { Text } from 'react-native';
import CardWithText from '../CardWithText/CardWithText';
import { DownloadItemProps } from './types';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';

const DownloadItem: React.FC<DownloadItemProps> = ({
  label,
  imageSource,
  onPress,
  containerStyle,
}) => {
  const { theme } = useTheme();
  const { primaryColor } = useSelector((state: RootState) => state.settings);
  return (
    <CardWithText
      onPress={onPress}
      imageSource={imageSource}
      containerStyle={[
        styles.card,
        { backgroundColor: theme.card.background },
        containerStyle,
      ]}
      imageContainerStyle={styles.imageContainer}
      borderColor={primaryColor}
      bottomContent={
        <Text style={[styles.label, { color: theme.screen.text }]}>{label}</Text>
      }
    />
  );
};

export default DownloadItem;
