import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const ProgressBar = ({ progress, color, style, height = 8 }) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceVariant,
          height,
          borderRadius: height / 2,
        },
        style,
      ]}
    >
      <View
        style={{
          width: `${clampedProgress * 100}%`,
          backgroundColor: color || colors.primary,
          height: '100%',
          borderRadius: height / 2,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    width: '100%',
  },
});

export default ProgressBar;
