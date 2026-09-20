import React from 'react';
import Icon from '@expo/vector-icons/MaterialIcons';
import { NativeListItem } from './NativeListItem';

export interface SettingRowProps {
  icon: keyof typeof Icon.glyphMap;
  title: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
  color?: string;
  isLoading?: boolean;
}

export const SettingRow = (props: SettingRowProps) => {
  return <NativeListItem {...props} />;
};
