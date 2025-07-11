import React, { useState } from 'react';
import { Text, TouchableOpacity, View, TextInput } from 'react-native';
import Modal from 'react-native-modal';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import { myContrastColor } from '@/helper/colorHelper';
import { TranslationKeys } from '@/locales/keys';

export interface TextInputSheetProps {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (val: string) => void;
}

const TextInputSheet: React.FC<TextInputSheetProps> = ({
  label,
  value,
  placeholder,
  onChange,
}) => {
  const { theme } = useTheme();
  const { translate } = useLanguage();
  const { primaryColor, selectedTheme: mode } = useSelector(
    (state: RootState) => state.settings
  );
  const contrastColor = myContrastColor(primaryColor, theme, mode === 'dark');
  const [tempValue, setTempValue] = useState(value);

  const [isVisible, setIsVisible] = useState(false);

  const openSheet = () => {
    setTempValue(value);
    setIsVisible(true);
  };

  const closeSheet = () => {
    setIsVisible(false);
  };

  const saveValue = () => {
    onChange(tempValue);
    closeSheet();
  };

  return (
    <>
      <TouchableOpacity onPress={openSheet}>
        <View style={[styles.inputDisplay, { borderColor: theme.screen.border }]}>
          <Text style={[styles.inputText, { color: theme.screen.text }]}>
            {value || placeholder || translate(TranslationKeys.type_here)}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        isVisible={isVisible}
        onBackdropPress={closeSheet}
        style={styles.modalContainer}
        animationIn='slideInUp'
        animationOut='slideOutDown'
        backdropOpacity={0.7}
        useNativeDriver
      >
        <View style={[styles.sheetView, { backgroundColor: theme.sheet.sheetBg }]}>
          <View style={styles.sheetHeader}>
            <View />
            <Text style={[styles.sheetHeading, { color: theme.sheet.text }]}>{label}</Text>
          </View>
          <TextInput
            style={[
              styles.sheetInput,
              {
                color: theme.sheet.text,
                backgroundColor: theme.sheet.inputBg,
                borderColor: theme.sheet.inputBorder,
              },
            ]}
            placeholderTextColor={theme.sheet.placeholder}
            cursorColor={theme.sheet.text}
            selectionColor={primaryColor}
            value={tempValue}
            onChangeText={setTempValue}
            placeholder={placeholder || translate(TranslationKeys.type_here)}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={closeSheet}
              style={[styles.cancelButton, { borderColor: primaryColor }]}
            >
              <Text style={[styles.buttonText, { color: theme.screen.text }]}>
                {translate(TranslationKeys.cancel)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={saveValue}
              style={[styles.saveButton, { backgroundColor: primaryColor }]}
            >
              <Text style={[styles.buttonText, { color: contrastColor }]}>
                {translate(TranslationKeys.save)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default TextInputSheet;
