import { Platform, Pressable, StyleSheet, View } from 'react-native';

import React from 'react';
import Text from './Text';
import { useTheme } from '../../context/ThemeContext';

export default function Card({ title, subtitle, children, style, onPress, disabled = false }) {
   const { theme } = useTheme();
   const isAndroid = Platform.OS === 'android';
   return (
      <Pressable
         onPress={disabled ? undefined : onPress}
         disabled={disabled}
         style={({ pressed }) => [
            styles.card,
            {
               backgroundColor: theme.colors.surface,
               shadowColor: theme.colors.shadow,
               opacity: pressed && !isAndroid ? 0.9 : 1,
            },
            style,
         ]}
      >
         {title && (
            <Text style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={1} ellipsizeMode='tail'>{title}</Text>
         )}
         {subtitle && (
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1} ellipsizeMode='tail'>
               {subtitle}
            </Text>
         )}

         <View style={styles.body}>{children}</View>
      </Pressable >
   );
}

const styles = StyleSheet.create({
   card: {
      borderRadius: 16,
      padding: 16,
      marginVertical: 8,

      // iOS shadow
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,

      elevation: 3,
   },
   title: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 4,
   },
   subtitle: {
      fontSize: 14,
      fontWeight: '400',
      marginBottom: 8,
   },
   body: {
      marginTop: 4,
   },
});
