import React, { useEffect, useState } from 'react';
import { Image, View, ActivityIndicator } from 'react-native';
import QRCode from 'qrcode';

const VerticalScrollTopFoodScreen = () => {
  const [qrUri, setQrUri] = useState<string | null>(null);

  useEffect(() => {
    const googleUrl = 'https://www.google.com/search?q=Expo+QR+Code+Generator';

    QRCode.toDataURL(googleUrl, { errorCorrectionLevel: 'H' })
      .then(setQrUri)
      .catch(console.error);
  }, []);

  if (!qrUri) return <ActivityIndicator />;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={{ uri: qrUri }}
        style={{ width: 200, height: 200 }}
        resizeMode="contain"
      />
    </View>
  );

};

export default VerticalScrollTopFoodScreen;
