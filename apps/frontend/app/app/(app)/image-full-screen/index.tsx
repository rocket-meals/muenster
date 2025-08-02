import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Image } from 'expo-image';

const AnimatedImage = Animated.createAnimatedComponent(Image);
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

  const baseScale = useSharedValue(1);
  const pinchScale = useSharedValue(1);
  const scale = useDerivedValue(() => baseScale.value * pinchScale.value);

  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      pinchScale.value = event.scale;
    })
    .onEnd(() => {
      baseScale.value = baseScale.value * pinchScale.value;
      pinchScale.value = 1;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      if (baseScale.value !== 1 || pinchScale.value !== 1) {
        baseScale.value = withTiming(1, { duration: 150 });
        pinchScale.value = withTiming(1, { duration: 150 });
        translationX.value = withTiming(0, { duration: 150 });
        translationY.value = withTiming(0, { duration: 150 });
      } else {
        baseScale.value = withTiming(2, { duration: 150 });
      }
    });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translationX.value;
      startY.value = translationY.value;
    })
    .onUpdate((event) => {
      translationX.value = startX.value + event.translationX;
      translationY.value = startY.value + event.translationY;
    })
    .onEnd(() => {
      if (scale.value <= 1) {
        translationX.value = withTiming(0);
        translationY.value = withTiming(0);
      }
    });

  const composedGesture = Gesture.Simultaneous(doubleTapGesture, pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translationX.value },
      { translateY: translationY.value },
    ],
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
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.screen.iconBg }]} onPress={downloadImage}>
            <Ionicons name='cloud-download-outline' size={28} color={theme.screen.icon} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.screen.iconBg }]} onPress={() => router.back()}>
            <Ionicons name='close' size={28} color={theme.screen.icon} />
          </TouchableOpacity>
        </View>
      )}
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={styles.flex}>
          <TouchableWithoutFeedback onPress={toggleControls} onLongPress={() => setModalVisible(true)}>
            <AnimatedImage source={{ uri: String(uri) }} style={[styles.image, animatedStyle]} contentFit='contain' />
          </TouchableWithoutFeedback>
        </Animated.View>
      </GestureDetector>
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
