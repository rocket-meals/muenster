import React from 'react';
import QRCode from 'react-native-qrcode-svg';
import { QrCodeProps } from './types';

const QrCode: React.FC<QrCodeProps> = ({
  value,
  size = 200,
  logoSource,
  logoUrl,
  logoSize,
  logoBackgroundColor = 'white',
  logoMargin,
}) => {
  const logo = logoSource ? logoSource : logoUrl ? { uri: logoUrl } : undefined;
  const calculatedLogoSize = logoSize ?? size / 5;

  return (
    <QRCode
      value={value}
      size={size}
      {...(logo
        ? {
            logo,
            logoSize: calculatedLogoSize,
            logoBackgroundColor,
            ...(logoMargin !== undefined ? { logoMargin } : {}),
          }
        : {})}
    />
  );
};

export default QrCode;
