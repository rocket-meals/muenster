import React from 'react';
import { View, Image } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { QrCodeProps } from './types';

const QrCode: React.FC<QrCodeProps> = ({
  value,
  size = 200,
  image,
  imageUrl,
  imagePercentage = 20,
  backgroundColor = 'white',
  margin = 0,
}) => {
  const imageSource = image ? image : imageUrl ? { uri: imageUrl } : undefined;

  const marginSize = size * (margin / 100);
  const innerSize = size * (imagePercentage / 100);
  const containerSize = innerSize + marginSize * 2;

  return (
    <View style={{ width: size, height: size }}>
      <QRCode value={value} size={size} />
      {imageSource && (
        <View
          style={{
            position: 'absolute',
            left: (size - containerSize) / 2,
            top: (size - containerSize) / 2,
            width: containerSize,
            height: containerSize,
            backgroundColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source={imageSource}
            style={{ width: innerSize, height: innerSize, resizeMode: 'contain' }}
          />
        </View>
      )}
    </View>
  );
};

export default QrCode;
