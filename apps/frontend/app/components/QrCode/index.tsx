import React from 'react';
import QRCode from 'react-native-qrcode-svg';
import { QrCodeProps } from './types';

const QrCode: React.FC<QrCodeProps> = ({ value, size = 200, logoSource, logoUrl }) => {
  const logo = logoSource ? logoSource : logoUrl ? { uri: logoUrl } : undefined;

  return (
    <QRCode
      value={value}
      size={size}
      {...(logo ? { logo, logoSize: size / 5, logoBackgroundColor: 'transparent' } : {})}
    />
  );
};

export default QrCode;
