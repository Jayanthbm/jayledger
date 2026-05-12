import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 100
  color: string;
  backgroundColor: string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  children?: React.ReactNode; // For markers/indicators
}

export const ProgressBar = React.memo(
  ({
    progress,
    color,
    backgroundColor,
    height = 8,
    borderRadius,
    style,
    children,
  }: ProgressBarProps) => {
    const finalRadius = borderRadius ?? height / 2;
    const clampedProgress = Math.min(100, Math.max(0, progress));

    return (
      <View style={[styles.bg, { backgroundColor, height, borderRadius: finalRadius }, style]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress}%`,
              backgroundColor: color,
              borderRadius: finalRadius,
            },
          ]}
        />
        {children}
      </View>
    );
  },
);

ProgressBar.displayName = 'ProgressBar';

const styles = StyleSheet.create({
  bg: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
  },
});
