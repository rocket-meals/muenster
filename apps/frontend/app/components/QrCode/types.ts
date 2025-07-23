import { ImageSourcePropType } from 'react-native';

export interface QrCodeProps {
  value: string;
  size?: number;
  image?: ImageSourcePropType;
  imageUrl?: string;
  imagePercentage?: number;
  backgroundColor?: string;
  margin?: number;
}
