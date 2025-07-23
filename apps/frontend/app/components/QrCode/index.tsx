import React from 'react';
import { Image, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { QrCodeProps } from './types';

const QrCode: React.FC<QrCodeProps> = ({ value, size = 200, logoSource, logoUrl }) => {
  const logo = logoSource ? logoSource : logoUrl ? { uri: logoUrl } : undefined;

  return (
    <View style={{ width: size, height: size }}>
      <QRCode value={value} size={size} />
      {logo && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source={logo}
            style={{ width: size / 5, height: size / 5, resizeMode: 'contain' }}
          />
        </View>
      )}
    </View>
  );
};

export default QrCode;
