import React from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import { AntDesign } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

export interface BaseBottomModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

const BaseBottomModal: React.FC<BaseBottomModalProps> = ({ visible, onClose, title, children }) => {
  const { theme } = useTheme();

  return (
    <Modal
      isVisible={visible}
      style={styles.modalContainer}
      onBackdropPress={onClose}
      backdropOpacity={0.5}
      swipeDirection="down"
      onSwipeComplete={onClose}
    >
      <View style={[styles.sheet, { backgroundColor: theme.sheet.sheetBg }]}>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: theme.sheet.closeBg }]}
          onPress={onClose}
        >
          <AntDesign name="close" size={24} color={theme.sheet.closeIcon} />
        </TouchableOpacity>
        <View style={styles.handleRow}>
          <View style={[styles.handle, { backgroundColor: theme.sheet.closeBg }]} />
        </View>
        {title && <Text style={[styles.title, { color: theme.sheet.text }]}>{title}</Text>}
        <View style={styles.contentContainer}>{children}</View>
      </View>
    </Modal>
  );
};

export default BaseBottomModal;

const styles = StyleSheet.create({
  modalContainer: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  sheet: {
    height: Dimensions.get('window').height * 0.8,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 10,
  },
  handleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    width: 45,
    height: 45,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 10,
    top: 10,
  },
  handle: {
    width: '30%',
    height: 6,
    borderRadius: 3,
    alignSelf: 'center',
  },
  title: {
    marginTop: 60,
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  contentContainer: {
    gap: 20,
    alignItems: 'center',
    padding: 20,
  },
});
