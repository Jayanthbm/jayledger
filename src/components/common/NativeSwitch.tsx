import React from 'react';
import { Switch as RNSwitch, Platform } from 'react-native';
import { Switch as ExpoUISwitch, Host } from '@expo/ui';

export interface NativeSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
  trackColor?: { false?: string; true?: string };
  thumbColor?: string;
}

export const NativeSwitch: React.FC<NativeSwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  trackColor,
  thumbColor,
}) => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return (
      <Host style={{ width: 51, height: 31 }}>
        <ExpoUISwitch value={value} onValueChange={onValueChange} disabled={disabled} />
      </Host>
    );
  }

  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={trackColor}
      thumbColor={thumbColor}
    />
  );
};
