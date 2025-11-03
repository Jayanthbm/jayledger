import { Platform, Pressable, StyleSheet, View } from "react-native";

import React from "react";
import Text from "./Text";
import { useTheme } from "../../context/ThemeContext";

export default function Card({
   title,
   subtitle,
   children,
   style,
   onPress,
   disabled = false,
   keyname = "",
}) {
   const { theme } = useTheme();
   const isAndroid = Platform.OS === "android";

   return (
      <Pressable
         key={`${theme.mode}-${keyname}`}
         onPress={disabled ? undefined : onPress}
         disabled={disabled}
         android_ripple={
            isAndroid && !disabled
               ? {
                  color: theme.colors.onSurfaceVariant + "22",
                  borderless: false,
                  foreground: true,
               }
               : undefined
         }
         style={({ pressed }) => [
            styles.card,
            {
               backgroundColor: theme.colors.surface,
               shadowColor: theme.colors.shadow,
               transform: [{ scale: pressed && !isAndroid ? 0.98 : 1 }],
            },
            style,
         ]}
      >
         {title && (
            <Text
               style={[styles.title, { color: theme.colors.onSurface }]}
               numberOfLines={1}
               ellipsizeMode="tail"
            >
               {title}
            </Text>
         )}
         {subtitle && (
            <Text
               style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
               numberOfLines={1}
               ellipsizeMode="tail"
            >
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
      overflow: "hidden",
      elevation: 2,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
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
