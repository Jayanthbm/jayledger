import { Animated, Easing, StyleSheet, View } from 'react-native';
import React, { useEffect, useRef } from 'react';

import { useTheme } from '../../theme/ThemeContext';

export default function ProgressBar({
   progress = 0,
   height = 8,
   indeterminate = false,
   style,
   duration = 500,
}) {
   const { theme } = useTheme();
   const progressAnim = useRef(new Animated.Value(0)).current;
   const indeterminateAnim = useRef(new Animated.Value(0)).current;

   const fgColor = theme.colors.primary;
   const bgColor = theme.colors.surfaceVariant;

   // Determinate animation
   useEffect(() => {
      if (!indeterminate) {
         Animated.timing(progressAnim, {
            toValue: Math.min(progress, 1),
            duration,
            useNativeDriver: false,
         }).start();
      }
   }, [progress, indeterminate]);

   // Indeterminate animation
   useEffect(() => {
      if (indeterminate) {
         Animated.loop(
            Animated.timing(indeterminateAnim, {
               toValue: 1,
               duration: 1200,
               easing: Easing.linear,
               useNativeDriver: false,
            })
         ).start();
      }
   }, [indeterminate]);

   const widthInterpolated = indeterminate
      ? indeterminateAnim.interpolate({
         inputRange: [0, 1],
         outputRange: ['0%', '70%'],
      })
      : progressAnim.interpolate({
         inputRange: [0, 1],
         outputRange: ['0%', '100%'],
      });

   return (
      <View style={[styles.container, { backgroundColor: bgColor, height }, style]}>
         <Animated.View
            style={[
               styles.progress,
               {
                  width: widthInterpolated,
                  backgroundColor: fgColor,
                  height,
                  borderRadius: height / 2,
               },
            ]}
         />
      </View>
   );
}

const styles = StyleSheet.create({
   container: {
      width: '100%',
      borderRadius: 8,
      overflow: 'hidden',
   },
   progress: {
      position: 'absolute',
      left: 0,
      top: 0,
   },
});
