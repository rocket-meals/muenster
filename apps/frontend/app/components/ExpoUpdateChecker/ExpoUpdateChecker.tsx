import React, { useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import * as Updates from 'expo-updates';
import BaseModal from '../BaseModal';
import usePlatformHelper from '@/helper/platformHelper';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import { useTheme } from '@/hooks/useTheme';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';

interface ExpoUpdateCheckerProps {
  children?: React.ReactNode;
}

const ExpoUpdateChecker: React.FC<ExpoUpdateCheckerProps> = ({ children }) => {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const { isSmartPhone } = usePlatformHelper();
  const { translate } = useLanguage();
  const { theme } = useTheme();
  const { primaryColor } = useSelector((state: RootState) => state.settings);

  const [modalVisible, setModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  const checkForUpdates = async () => {
    if (!isSmartPhone()) return;
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        setModalVisible(true);
      }
    } catch (e) {
      console.error('Error while checking updates', e);
    }
  };

  useEffect(() => {
    if (!isSmartPhone()) return;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        checkForUpdates();
      }
      appState.current = nextState;
    });
    return () => {
      subscription.remove();
    };
  }, []);

  const applyUpdate = async () => {
    try {
      setUpdating(true);
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch (e) {
      console.error('Error while applying updates', e);
    }
  };

  return (
    <>
      {children}
      <BaseModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={translate(TranslationKeys.update_available)}
      >
        <View style={modalStyles.contentContainer}>
          <Text style={{ color: theme.screen.text, textAlign: 'center' }}>
            {translate(TranslationKeys.update_available_message)}
          </Text>
          <View style={modalStyles.buttonContainer}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={[modalStyles.cancelButton, { borderColor: primaryColor }]}
            >
              <Text style={[modalStyles.buttonText, { color: theme.screen.text }]}>
                {translate(TranslationKeys.cancel)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={applyUpdate}
              style={[modalStyles.saveButton, { backgroundColor: primaryColor }]}
            >
              {updating ? (
                <ActivityIndicator color={theme.activeText} />
              ) : (
                <Text style={[modalStyles.buttonText, { color: theme.activeText }]}>
                  {translate(TranslationKeys.to_update)}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </BaseModal>
    </>
  );
};

export default ExpoUpdateChecker;

const modalStyles = StyleSheet.create({
  contentContainer: {
    gap: 20,
    alignItems: 'center',
    padding: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  cancelButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginRight: 5,
    alignItems: 'center',
    borderWidth: 1,
  },
  saveButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginLeft: 5,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
  },
});
