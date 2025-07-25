import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
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
        ...(groupPosition === 'top' && {
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          borderBottomWidth: 1,
          borderColor: theme.screen.iconBg,
        }),
        ...(groupPosition === 'middle' && {
          borderRadius: 0,
          borderBottomWidth: 1,
          borderColor: theme.screen.iconBg,
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
      <View style={{ ...styles.col, gap: isWeb ? 10 : 5 }}>
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
      </View>
      <View
        style={{
          ...styles.col,
          gap: isWeb ? 10 : 5,
          alignItems: 'center',
          // backgroundColor: 'red',
          justifyContent: 'flex-end',
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
    </TouchableOpacity>
  );
};

export default SettingList;
