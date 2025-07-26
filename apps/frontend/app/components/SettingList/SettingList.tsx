import { Dimensions, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { isWeb } from '@/constants/Constants';
import { SettingListProps } from './types';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import { myContrastColor } from '@/helper/colorHelper';

const SettingList: React.FC<SettingListProps> = ({
  leftIcon,
  label,
  rightIcon,
  value,
  handleFunction,
  iconBgColor,
  groupPosition = 'single',
}) => {
  const { theme } = useTheme();
  const { primaryColor, selectedTheme } = useSelector(
    (state: RootState) => state.settings
  );
  const [windowWidth, setWindowWidth] = useState(
    Dimensions.get('window').width
  );

  useEffect(() => {
    const onChange = ({ window }: { window: any }) => {
      setWindowWidth(window.width);
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <TouchableOpacity
      style={{
        ...styles.list,
        backgroundColor: theme.screen.iconBg,
        paddingHorizontal: isWeb ? 20 : 10,
        position: 'relative',
        ...(groupPosition === 'top' && {
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        }),
        ...(groupPosition === 'middle' && {
          borderRadius: 0,
        }),
        ...(groupPosition === 'bottom' && {
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
        }),
      }}
      onPress={handleFunction}
    >
      <View style={styles.iconContainer}>
        <View
          style={{
            ...styles.iconBox,
            backgroundColor: iconBgColor || primaryColor,
          }}
        >
          {React.isValidElement(leftIcon)
            ? React.cloneElement(leftIcon, {
                color: myContrastColor(
                  iconBgColor || primaryColor,
                  theme,
                  selectedTheme === 'dark'
                ),
              })
            : leftIcon}
        </View>
      </View>
      <View
        style={{
          ...styles.contentContainer,
          gap: isWeb ? 10 : 5,
          borderColor: theme.screen.background,
          borderBottomWidth:
            groupPosition === 'top' || groupPosition === 'middle'
              ? StyleSheet.hairlineWidth
              : 0,
        }}
      >
        <Text
          style={{
            ...styles.label,
            color: theme.screen.text,
            fontSize: windowWidth > 500 ? 16 : 13,
            marginTop: isWeb ? 0 : 2,
          }}
        >
          {label}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: isWeb ? 10 : 5,
          }}
        >
          {value && (
            <Text
              style={{
                ...styles.value,
                color: theme.screen.text,
                fontSize: windowWidth > 500 ? 16 : 13,
                marginTop: isWeb ? 0 : 2,
              }}
            >
              {value}
            </Text>
          )}
          {rightIcon}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default SettingList;
