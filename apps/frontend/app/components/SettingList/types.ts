import { GestureResponderEvent } from 'react-native-modal';

export interface SettingListProps {
  leftIcon: React.ReactNode;
  label: string;
  rightIcon?: React.ReactNode;
  value?: string;
  iconBgColor?: string;
  handleFunction: (event: GestureResponderEvent) => void;
  groupPosition?: 'top' | 'middle' | 'bottom' | 'single';
}
