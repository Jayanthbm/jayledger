import { Pressable, StyleSheet, Text, View } from 'react-native';

import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function Button({ title, onPress, variant = 'filled', icon, style }) {
   const { theme } = useTheme();

   // Determine colors based on variant
   let backgroundColor, textColor, borderColor;

   if (variant === 'filled') {
      backgroundColor = theme.colors.primaryContainer; // Button background
      textColor = theme.colors.onPrimaryContainer;    // Text
      borderColor = 'transparent';
   } else if (variant === 'outlined') {
      backgroundColor = 'transparent';
      textColor = theme.colors.primary; // Active text color
      borderColor = theme.colors.primary;
   }

   return (
      <Pressable
         onPress={onPress}
         style={({ pressed }) => [
            styles.button,
            {
               backgroundColor,
               borderColor,
               flexDirection: icon ? 'row' : 'column',
            },
            pressed && { opacity: 0.7 },
            style,
         ]}
      >
         {icon && <View style={styles.iconContainer}>{icon}</View>}
         <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      </Pressable>
   );
}

const styles = StyleSheet.create({
   button: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
   },
   text: {
      fontWeight: '600',
      fontSize: 16,
   },
   iconContainer: {
      marginRight: 8,
      alignItems: 'center',
      justifyContent: 'center',
   },
});
