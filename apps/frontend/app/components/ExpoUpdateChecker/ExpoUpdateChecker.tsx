import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import {
  AppState,
  AppStateStatus,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as Updates from 'expo-updates';
import Modal from 'react-native-modal';
import { AntDesign } from '@expo/vector-icons';
import popupStyles from '../PopupEventSheet/styles';
import usePlatformHelper from '@/helper/platformHelper';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import { useTheme } from '@/hooks/useTheme';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';

interface ExpoUpdateCheckerProps {
  children?: ReactNode;
}

interface UpdateCheckerContextType {
  manualCheck: () => void;
}

const UpdateCheckerContext = createContext<UpdateCheckerContextType | null>(null);

const ExpoUpdateChecker: React.FC<ExpoUpdateCheckerProps> = ({ children }) => {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const { isSmartPhone } = usePlatformHelper();
  const { translate } = useLanguage();
  const { theme } = useTheme();
  const { primaryColor } = useSelector((state: RootState) => state.settings);

  const [modalVisible, setModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [titleKey, setTitleKey] = useState<TranslationKeys>(
    TranslationKeys.update_available
  );
  const [messageKey, setMessageKey] = useState<TranslationKeys>(
    TranslationKeys.update_available_message
  );


  const checkForUpdates = async (showUpToDate = false) => {
    if (!isSmartPhone()) return;
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        setUpdateAvailable(true);
        setTitleKey(TranslationKeys.update_available);
        setMessageKey(TranslationKeys.update_available_message);
        setModalVisible(true);
      } else if (showUpToDate) {
        setUpdateAvailable(false);
        setTitleKey(TranslationKeys.no_updates_available);
        setMessageKey(TranslationKeys.no_updates_available);
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
    <UpdateCheckerContext.Provider value={{ manualCheck: () => checkForUpdates(true) }}>
      {children}
      {modalVisible && (
        <Modal
          isVisible={modalVisible}
          style={modalStyles.modalContainer}
          backdropOpacity={0}
        >
          <TouchableOpacity
            style={modalStyles.backdrop}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={[modalStyles.sheet, { backgroundColor: theme.sheet.sheetBg }]}>
            <View style={modalStyles.handleRow}>
              <View style={[modalStyles.handle, { backgroundColor: theme.sheet.closeBg }]} />
              <TouchableOpacity
                style={[modalStyles.closeButton, { backgroundColor: theme.sheet.closeBg }]}
                onPress={() => setModalVisible(false)}
              >
                <AntDesign name='close' size={24} color={theme.sheet.closeIcon} />
              </TouchableOpacity>
            </View>
            <Text style={[modalStyles.title, { color: theme.sheet.text }]}>{translate(titleKey)}</Text>
            <View style={[popupStyles.popupContainer, { marginTop: 0 }]}>
              <Text style={{ color: theme.screen.text, textAlign: 'center' }}>
                {translate(messageKey)}
              </Text>
              <View style={modalStyles.buttonContainer}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={[modalStyles.cancelButton, { borderColor: primaryColor }]}
                >
                  <Text style={[modalStyles.buttonText, { color: theme.screen.text }]}> 
                    {translate(updateAvailable ? TranslationKeys.cancel : TranslationKeys.okay)}
                  </Text>
                </TouchableOpacity>
                {updateAvailable && (
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
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </UpdateCheckerContext.Provider>
  );
};

export const useExpoUpdateChecker = () => {
  const ctx = useContext(UpdateCheckerContext);
  if (!ctx) throw new Error('useExpoUpdateChecker must be used within ExpoUpdateChecker');
  return ctx;
};

export default ExpoUpdateChecker;

const modalStyles = StyleSheet.create({
  modalContainer: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Dimensions.get('window').height * 0.2,
    backgroundColor: '#00000055',
  },
  sheet: {
    height: Dimensions.get('window').height * 0.8,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 10,
  },
  handleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    width: 45,
    height: 45,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handle: {
    width: '30%',
    height: 6,
    borderRadius: 3,
    alignSelf: 'center',
  },
  title: {
    marginTop: 10,
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
