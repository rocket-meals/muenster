import React from 'react';
import { StyleSheet, View } from 'react-native';
import { OSMView } from 'expo-osm-sdk';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';

const OsmExperimental = () => {
  useSetPageTitle(TranslationKeys.osm_experimental);
  return (
    <View style={styles.container}>
      <OSMView
        style={styles.map}
        initialCenter={{ latitude: 40.7128, longitude: -74.0060 }}
        initialZoom={10}
        onMapReady={() => console.log('Map ready!')}
      />
    </View>
  );
};

export default OsmExperimental;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
