import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';

import Pentagon from '../../assets/shapes/Pentagon';
import Spinner from '../../assets/shapes/Spinner';
import Triangle from '../../assets/shapes/Triangle';
import { useTheme } from '../../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

const SIZE_MAP = { small: 24, medium: 36, large: 48 };
const shapes = [Pentagon, Spinner, Triangle];

const Loader = ({
   loading = true,
   inline = false,
   position = 'left', // 'left' | 'center' | 'right'
   text = '',
   size = 'medium', // 'small' | 'medium' | 'large'
   color,
   style,
   overlayOpacity = 0.4,
}) => {
   const { theme } = useTheme();
   const spinnerSize = SIZE_MAP[size] || SIZE_MAP.medium;
   const spinnerColor = color || theme.colors.spinnerColor;

   const rotateAnim = useRef(new Animated.Value(0)).current;
   const [currentShapeIndex, setCurrentShapeIndex] = useState(0);

   useEffect(() => {
      if (!loading) return;

      let isActive = true;

      const spinDuration = 3000; // full rotation duration
      const switchTime = 900;    // switch shape every 200ms

      // Start rotation animation (continuous)
      const rotateLoop = Animated.loop(
         Animated.timing(rotateAnim, {
            toValue: 1,
            duration: spinDuration,
            easing: Easing.linear,
            useNativeDriver: true,
         })
      );
      rotateLoop.start();

      // Shape switch timer
      const switchInterval = setInterval(() => {
         if (isActive) {
            setCurrentShapeIndex(prev => (prev + 1) % shapes.length);
         }
      }, switchTime);

      return () => {
         isActive = false;
         rotateAnim.stopAnimation();
         rotateLoop.stop();
         clearInterval(switchInterval);
      };
   }, [loading]);


   if (!loading) return null;

   const rotate = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
   });

   const ShapeComp = shapes[currentShapeIndex];

   // ---- Inline Layout ----
   if (inline) {
      let justifyContent = 'flex-start';
      if (position === 'center') justifyContent = 'center';
      else if (position === 'right') justifyContent = 'flex-end';

      return (
         <View style={[styles.inlineWrapper, { justifyContent }, style]}>
            <Animated.View
               style={{
                  width: spinnerSize,
                  height: spinnerSize,
                  transform: [{ rotate }],
                  alignItems: 'center',
                  justifyContent: 'center',
               }}
            >
               <ShapeComp width={spinnerSize} height={spinnerSize} color={spinnerColor} />
            </Animated.View>

            {text ? (
               <Text style={[styles.inlineText, { color: theme.colors.onSurface }]}>{text}</Text>
            ) : null}
         </View>
      );
   }

   // ---- Full-screen Modal Layout ----
   return (
      <View style={[styles.overlay, { backgroundColor: `rgba(0,0,0,${overlayOpacity})` }]}>
         <View style={[styles.loaderBox, { backgroundColor: theme.colors.surface, borderRadius: 16 }]}>
            <Animated.View
               style={{
                  width: spinnerSize,
                  height: spinnerSize,
                  transform: [{ rotate }],
                  alignItems: 'center',
                  justifyContent: 'center',
               }}
            >
               <ShapeComp width={spinnerSize} height={spinnerSize} color={spinnerColor} />
            </Animated.View>

            {text ? (
               <Text style={[styles.text, { color: theme.colors.onSurfaceVariant, marginTop: 12 }]}>
                  {text}
               </Text>
            ) : null}
         </View>
      </View>
   );
};

const styles = StyleSheet.create({
   inlineWrapper: { flexDirection: 'row', alignItems: 'center', width: '100%' },
   inlineText: { fontSize: 14, fontWeight: '500', marginLeft: 8 },
   overlay: { position: 'absolute', top: 0, left: 0, width, height, justifyContent: 'center', alignItems: 'center', zIndex: 999 },
   loaderBox: { padding: 20, alignItems: 'center', justifyContent: 'center', minWidth: 120 },
   text: { fontSize: 16, fontWeight: '500' },
});

export default Loader;
