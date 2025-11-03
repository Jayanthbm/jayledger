import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import {
   Platform,
   Pressable,
   StyleSheet,
   View,
} from "react-native";

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

   // Material 3 state layer animation
   const pressed = useSharedValue(0);

   const animatedStyle = useAnimatedStyle(() => ({
      backgroundColor: `rgba(0, 0, 0, ${pressed.value * 0.08})`, // light overlay
   }));


   return (
      <Pressable
         key={`${theme.mode}-${keyname}`}
         onPress={disabled ? undefined : onPress}
         disabled={disabled}
         onPressIn={() => (pressed.value = withTiming(1, { duration: 100 }))}
         onPressOut={() => (pressed.value = withTiming(0, { duration: 200 }))}
         android_ripple={
            isAndroid
               ? { color: theme.colors.surfaceVariant, borderless: false }
               : undefined
         }
         style={({ pressed: isPressed }) => [
            styles.card,
            {
               backgroundColor: theme.colors.surface,
               shadowColor: theme.colors.shadow,
               transform: [{ scale: isPressed && !isAndroid ? 0.99 : 1 }],
            },
            style,
         ]}
      >
         {/* State layer overlay */}
         {!isAndroid && <Animated.View pointerEvents="none" style={[styles.stateLayer, animatedStyle]} />}
         {/* Content */}
         <View style={styles.content}>
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
                  style={[
                     styles.subtitle,
                     { color: theme.colors.onSurfaceVariant },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
               >
                  {subtitle}
               </Text>
            )}
            <View style={styles.body}>{children}</View>
         </View>
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
      // iOS shadow
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
   },
   stateLayer: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 16,
   },
   content: {
      padding: 16,
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
