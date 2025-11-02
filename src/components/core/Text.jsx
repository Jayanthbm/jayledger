import { Text as RNText, StyleSheet } from 'react-native';

import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function Text({ children, variant = 'bodyMedium', style, numberOfLines = 1, ellipsizeMode = 'none', color, ...props }) {
   const { theme } = useTheme();

   let defaultColor = theme.colors.onBackground;

   if (variant === 'caption' || variant === 'label') {
      defaultColor = theme.colors.onSurface;
   }

   if (color) {
      defaultColor = color;
   }

   return (
      <RNText style={[styles[variant], { color: defaultColor }, style]} {...props} numberOfLines={numberOfLines} ellipsizeMode={ellipsizeMode}>
         {children}
      </RNText>
   );
}

const styles = StyleSheet.create({
   headingLarge: {
      fontSize: 32,
      fontWeight: '700',
   },
   headingMedium: {
      fontSize: 28,
      fontWeight: '700',
   },
   headingSmall: {
      fontSize: 24,
      fontWeight: '700',
   },
   title: {
      fontSize: 20,
      fontWeight: '700',
   },
   subtitle: {
      fontSize: 16,
      fontWeight: '500',
   },
   bodyLarge: {
      fontSize: 16,
      fontWeight: '400',
   },
   bodyMedium: {
      fontSize: 14,
      fontWeight: '400',
   },
   bodySmall: {
      fontSize: 12,
      fontWeight: '400',
   },
   label: {
      fontSize: 16,
      fontWeight: '500',
   },
   caption: {
      fontSize: 12,
      fontWeight: '400',
   },
});
