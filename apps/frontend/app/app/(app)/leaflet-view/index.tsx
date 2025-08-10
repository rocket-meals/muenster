import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { LeafletView, LatLng } from 'react-native-leaflet-view';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';

const CENTER: LatLng = { lat: 52.52, lng: 13.405 };

const LeafletViewScreen = () => {
  useSetPageTitle(TranslationKeys.leaflet_map);
  const [html, setHtml] = useState<string | null>(null);
  const [icon, setIcon] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadAssets = async () => {
      const htmlAsset = Asset.fromModule(require('@/assets/leaflet.html'));
      const iconAsset = Asset.fromModule(require('@/assets/map/marker-icon-2x.png'));
      await Promise.all([htmlAsset.downloadAsync(), iconAsset.downloadAsync()]);
      const [htmlContent, iconContent] = await Promise.all([
        FileSystem.readAsStringAsync(htmlAsset.localUri!),
        FileSystem.readAsStringAsync(iconAsset.localUri!, {
          encoding: FileSystem.EncodingType.Base64,
        }),
      ]);
      if (isMounted) {
        setHtml(htmlContent);
        setIcon(iconContent);
      }
    };
    loadAssets();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!html || !icon) {
    return <ActivityIndicator />;
  }

  return (
    <View style={styles.container}>
      <LeafletView
        webviewStyle={styles.map}
        mapCenterPosition={CENTER}
        zoom={13}
        source={{ html }}
        mapMarkers={[
          {
            id: 'berlin-icon',
            position: CENTER,
            icon: `<img src='data:image/png;base64,${icon}' style='width:32px;height:32px;' />`,
            size: [32, 32],
          },
        ]}
      />
    </View>
  );
};

export default LeafletViewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

