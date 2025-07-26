import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import { myContrastColor } from '@/helper/colorHelper';
import { SettingsListProps } from './types';

const SettingsList: React.FC<SettingsListProps> = ({
  leftIcon,
  title,
  label,
  value,
  rightElement,
  rightIcon,
  onPress,
  handleFunction,
  iconBackgroundColor,
  iconBgColor,
  showSeparator = true,
  groupPosition,
}) => {
  const { theme } = useTheme();
  const { primaryColor, selectedTheme } = useSelector(
    (state: RootState) => state.settings
  );

  const pressHandler = onPress || handleFunction;
  const Container: any = pressHandler ? TouchableOpacity : View;
  const iconBg = iconBackgroundColor || iconBgColor || primaryColor;
  const iconColor = myContrastColor(iconBg, theme, selectedTheme === 'dark');

  const containerStyles: ViewStyle[] = [
    styles.container,
    { backgroundColor: theme.screen.iconBg } as ViewStyle,
  ];

  if (groupPosition === 'top') {
    containerStyles.push({
      borderTopLeftRadius: 5,
      borderTopRightRadius: 5,
      paddingTop: 5,
    });
  } else if (groupPosition === 'bottom') {
    containerStyles.push({
      borderBottomLeftRadius: 5,
      borderBottomRightRadius: 5,
      paddingBottom: 5,
    });
  } else if (groupPosition === 'single') {
    containerStyles.push({
      borderRadius: 5,
      paddingTop: 5,
      paddingBottom: 5,
    });
  }

  return (
    <>
      <Container onPress={pressHandler} style={containerStyles}>
        <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}> 
          {React.isValidElement(leftIcon)
            ? React.cloneElement(leftIcon, { color: iconColor })
            : leftIcon}
        </View>
        <View style={styles.textWrapper}>
          <View style={styles.titleContainer}>
            <Text
              style={[styles.title, { color: theme.screen.text } as TextStyle]}
            >
              {title || label}
            </Text>
          </View>
          {value ? (
            <View style={styles.valueContainer}>
              <Text
                style={[styles.value, { color: theme.screen.text } as TextStyle]}
              >
                {value}
              </Text>
            </View>
          ) : null}
        </View>
        {rightElement || rightIcon ? (
          <View style={styles.rightWrapper}>{rightElement || rightIcon}</View>
        ) : null}
      </Container>
      {showSeparator && (
        <View
          style={[
            styles.separator,
            { backgroundColor: theme.screen.background, marginLeft: 54 },
          ]}
        />
      )}
    </>
  );
};

export default SettingsList;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flexShrink: 1,
  },
  valueContainer: {
    marginLeft: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
  },
  rightWrapper: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  separator: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
  },
});
