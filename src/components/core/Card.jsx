import { StyleSheet, Text, View } from 'react-native';

import React from 'react';
import { useTheme } from '../../theme/ThemeContext';

export default function Card({ title, subtitle, children, style }) {
   const { theme } = useTheme();

   return (
      <View
         style={[
            styles.card,
            { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow },
            style,
         ]}
      >
         {title && <Text style={[styles.title, { color: theme.colors.onSurface }]}>{title}</Text>}
         {subtitle && (
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
               {subtitle}
            </Text>
         )}
         <View style={styles.body}>{children}</View>
      </View>
   );
}

const styles = StyleSheet.create({
   card: {
      borderRadius: 5,
      padding: 16,
      marginVertical: 1,
      // Shadow for iOS
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      // Elevation for Android
      elevation: 4,
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
