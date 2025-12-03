import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../context/ThemeContext';

const FAB = ({ icon, onPress, style }) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.primaryContainer,
          shadowColor: colors.shadow,
        },
        style,
      ]}
      onPress={onPress}
    >
      <MaterialDesignIcons name={icon} size={24} color={colors.onPrimaryContainer} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default FAB;
