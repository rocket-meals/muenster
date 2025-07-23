import { ImageSourcePropType } from 'react-native';

export interface QrCodeProps {
  value: string;
  size?: number;
  logoSource?: ImageSourcePropType;
  logoUrl?: string;
}
