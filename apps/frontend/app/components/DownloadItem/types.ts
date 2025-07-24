import { ImageSourcePropType } from 'react-native';

import { StyleProp, ViewStyle } from 'react-native';

export interface DownloadItemProps {
  label: string;
  imageSource: ImageSourcePropType;
  onPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}
