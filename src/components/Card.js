import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const Card = ({
  mode = 'elevated', // elevated, filled, outlined
  children,
  onPress,
  style,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const getBackgroundColor = () => {
    switch (mode) {
      case 'elevated':
        return colors.surface; // Low elevation color usually same as surface but with shadow
      case 'filled':
        return colors.surfaceVariant;
      case 'outlined':
        return colors.surface;
      default:
        return colors.surface;
    }
  };

  const getBorderColor = () => {
    if (mode === 'outlined') return colors.outlineVariant;
    return 'transparent';
  };

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: mode === 'outlined' ? 1 : 0,
          elevation: mode === 'elevated' ? 1 : 0, // MD3 Level 1
          shadowColor: colors.shadow,
        },
        style,
      ]}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12, // MD3 Medium shape
    padding: 16,
    marginVertical: 8,
    overflow: 'hidden',
  },
});

export default Card;
