import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedGestureHandler, withTiming } from 'react-native-reanimated';
import { PinchGestureHandler, PinchGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import BaseBottomModal from '@/components/BaseBottomModal';
import SettingsList from '@/components/SettingsList';
import * as FileSystem from 'expo-file-system';
import useToast from '@/hooks/useToast';

export default function ImageFullScreen() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const { theme } = useTheme();
  const toast = useToast();
  const [showControls, setShowControls] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const scale = useSharedValue(1);

  const pinchHandler = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent>({
    onActive: (event) => {
      scale.value = event.scale;
    },
    onEnd: () => {
      scale.value = withTiming(1);
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const toggleControls = () => setShowControls((p) => !p);

  const downloadImage = async () => {
    try {
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = String(uri);
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const filename = String(uri).split('/').pop() || `image_${Date.now()}`;
        const fileUri = FileSystem.documentDirectory + filename;
        await FileSystem.downloadAsync(String(uri), fileUri);
        toast('Image downloaded', 'success');
      }
    } catch (e) {
      toast('Download failed', 'error');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.screen.background }]}> 
      {showControls && (
        <View style={styles.topRow} pointerEvents='box-none'>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.screen.iconBg }]} onPress={() => router.back()}>
            <Ionicons name='close' size={28} color={theme.screen.icon} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.screen.iconBg }]} onPress={downloadImage}>
            <Ionicons name='cloud-download-outline' size={28} color={theme.screen.icon} />
          </TouchableOpacity>
        </View>
      )}
      <TouchableWithoutFeedback onPress={toggleControls} onLongPress={() => setModalVisible(true)}>
        <PinchGestureHandler onGestureEvent={pinchHandler}>
          <Animated.View style={styles.flex}>
            <Image source={{ uri: String(uri) }} style={[styles.image, animatedStyle]} contentFit='contain' />
          </Animated.View>
        </PinchGestureHandler>
      </TouchableWithoutFeedback>
      <BaseBottomModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <SettingsList
          leftIcon={<Ionicons name='cloud-download-outline' size={24} color={theme.screen.icon} />}
          label='Download Image'
          handleFunction={() => {
            setModalVisible(false);
            downloadImage();
          }}
          groupPosition='single'
        />
      </BaseBottomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topRow: { position: 'absolute', top: 40, right: 20, flexDirection: 'row', gap: 10, zIndex: 2 },
  iconButton: { padding: 8, borderRadius: 20 },
  image: { width: '100%', height: '100%' },
});
