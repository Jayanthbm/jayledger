import React from 'react';
import { ViewStyle } from 'react-native';
import { NativeSegmentedControl } from './common/NativeSegmentedControl';

export interface SegmentedOption<T = string | number | boolean> {
  label: string;
  value: T;
  activeColor?: string;
}

interface SegmentedControlProps<T = string | number | boolean> {
  options: SegmentedOption<T>[];
  selectedValue: T;
  onValueChange: (value: T) => void;
  variant?: 'small' | 'medium' | 'large';
  containerStyle?: ViewStyle;
}

export const SegmentedControl = <T extends string | number | boolean>(
  props: SegmentedControlProps<T>,
) => {
  return <NativeSegmentedControl {...props} />;
};
