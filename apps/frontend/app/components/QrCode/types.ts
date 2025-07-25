import { ImageSourcePropType } from 'react-native';

export interface QrCodeProps {
  value: string;
  size?: number;
  image?: ImageSourcePropType;
  imageUrl?: string;
  /**
   * Percentage size of the inner logo (0-30).
   * Values outside this range will be clamped.
   */
  innerSize?: number;
  /**
   * Error correction level for the QR code.
   * Defaults to a level calculated from `innerSize`.
   */
  ecl?: 'L' | 'M' | 'Q' | 'H';
  backgroundColor?: string;
  margin?: number;
}
