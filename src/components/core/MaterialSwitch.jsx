// src/components/core/MaterialSwitch.jsx

import { Animated, Pressable, StyleSheet, View } from "react-native";

import React from "react";

export default function MaterialSwitch({ value, onValueChange, theme }) {
   const anim = React.useRef(new Animated.Value(value ? 1 : 0)).current;

   React.useEffect(() => {
      Animated.timing(anim, {
         toValue: value ? 1 : 0,
         duration: 180,
         useNativeDriver: false,
      }).start();
   }, [value]);

   const trackColor = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.surfaceVariant, theme.colors.primaryContainer],
   });

   const thumbTranslate = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [2, 22],
   });

   return (
      <Pressable
         onPress={() => onValueChange(!value)}
         style={({ pressed }) => [
            styles.pressable,
            { opacity: pressed ? 0.8 : 1 },
         ]}
      >
         <Animated.View
            style={[
               styles.track,
               {
                  backgroundColor: trackColor,
               },
            ]}
         >
            <Animated.View
               style={[
                  styles.thumb,
                  {
                     transform: [{ translateX: thumbTranslate }],
                     backgroundColor: theme.colors.primary,
                  },
               ]}
            />
         </Animated.View>
      </Pressable>
   );
}

const styles = StyleSheet.create({
   pressable: {
      width: 52,
      height: 32,
      justifyContent: "center",
   },
   track: {
      width: 48,
      height: 28,
      borderRadius: 20,
      justifyContent: "center",
   },
   thumb: {
      width: 20,
      height: 20,
      borderRadius: 10,
   },
});
