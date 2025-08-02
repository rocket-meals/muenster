import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import Animated, {
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import BaseBottomModal from '@/components/BaseBottomModal';
import SettingsList from '@/components/SettingsList';
import * as FileSystem from 'expo-file-system';
import useToast from '@/hooks/useToast';
import { getHighResImageUrl } from '@/constants/HelperFunctions';

export default function ImageFullScreen() {
  const { uri, assetId } = useLocalSearchParams<{ uri?: string; assetId?: string }>();
  const { theme } = useTheme();
  const toast = useToast();
  const [showControls, setShowControls] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const highResUri = assetId ? getHighResImageUrl(String(assetId)) : String(uri);
  const lowResUri = uri ? String(uri) : highResUri;

  const baseScale = useSharedValue(1);
  const pinchScale = useSharedValue(1);
  const scale = useDerivedValue(() => baseScale.value * pinchScale.value);

  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  const windowHeight = Dimensions.get('window').height;
  const CLOSE_DISTANCE = windowHeight * 0.3;
  const FADE_DISTANCE = windowHeight * 0.15;

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
      if (scale.value > 1) {
        translationX.value = startX.value + event.translationX;
        translationY.value = startY.value + event.translationY;
        containerOpacity.value = 1;
      } else {
        translationY.value = event.translationY;
        if (event.translationY > 0) {
          containerOpacity.value =
            1 - Math.min(event.translationY / FADE_DISTANCE, 1);
        } else {
          containerOpacity.value = 1;
        }
      }
    })
    .onEnd(() => {
      if (scale.value <= 1) {
        if (translationY.value > CLOSE_DISTANCE) {
          runOnJS(router.back)();
        } else {
          translationX.value = withTiming(0);
          translationY.value = withTiming(0);
          containerOpacity.value = withTiming(1);
        }
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
      const extension = String(highResUri).split('.').pop()?.split(/[#?]/)[0];
      const name = assetId ? assetId : `image_${Date.now()}`;
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = String(highResUri);
        link.download = extension ? `${name}.${extension}` : name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const filename = extension ? `${name}.${extension}` : name;
        const fileUri = FileSystem.documentDirectory + filename;
        await FileSystem.downloadAsync(String(highResUri), fileUri);
        toast('Image downloaded', 'success');
      }
    } catch (e) {
      toast('Download failed', 'error');
    }
  };

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: theme.screen.background }, containerStyle]}
    >
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
            <Animated.View style={[styles.imageWrapper, animatedStyle]}>
              <Image source={{ uri: lowResUri }} style={styles.image} contentFit='contain' />
              <Image
                source={{ uri: highResUri }}
                style={[styles.image, StyleSheet.absoluteFill]}
                contentFit='contain'
              />
            </Animated.View>
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topRow: { position: 'absolute', top: 40, right: 20, flexDirection: 'row', gap: 10, zIndex: 2 },
  iconButton: { padding: 8, borderRadius: 20 },
  imageWrapper: { width: '100%', height: '100%' },
  image: { width: '100%', height: '100%' },
});
