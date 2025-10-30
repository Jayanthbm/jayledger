import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '../../context/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const AnimatedCircularProgress = ({
   radius = 60,
   strokeWidth = 10,
   currentValue = 0,
   totalValue = 100,
   showText = true,
   text = '',
   valuePrefix = '',
   valueSuffix = '',
   duration = 1200,
   color, // optional custom color
}) => {
   const { theme } = useTheme();

   const adjustedRadius = radius - strokeWidth / 2;
   const diameter = radius * 2;
   const circumference = 2 * Math.PI * adjustedRadius;

   const progressAnimated = useRef(new Animated.Value(0)).current;
   const remainingAnimated = useRef(new Animated.Value(0)).current;
   const [animatedRemaining, setAnimatedRemaining] = useState(0);

   // Animate progress ring
   useEffect(() => {
      Animated.timing(progressAnimated, {
         toValue: Math.min(currentValue / totalValue, 1),
         duration,
         easing: Easing.out(Easing.cubic),
         useNativeDriver: false,
      }).start();
   }, [currentValue, totalValue]);

   // Animate text counter
   useEffect(() => {
      Animated.timing(remainingAnimated, {
         toValue: currentValue,
         duration,
         easing: Easing.out(Easing.cubic),
         useNativeDriver: false,
      }).start();

      const listener = remainingAnimated.addListener(({ value }) => {
         setAnimatedRemaining(Math.ceil(value));
      });

      return () => remainingAnimated.removeListener(listener);
   }, [currentValue]);

   const strokeDashoffset = progressAnimated.interpolate({
      inputRange: [0, 1],
      outputRange: [circumference, 0],
   });

   const progressColor = color || theme.colors.primary;

   return (
      <View style={{ width: diameter, height: diameter }}>
         <Svg width={diameter} height={diameter}>
            {/* Background Circle */}
            <Circle
               cx={radius}
               cy={radius}
               r={adjustedRadius}
               stroke={theme.colors.surfaceVariant}
               strokeWidth={strokeWidth}
               fill="none"
            />
            {/* Animated Foreground Circle */}
            <AnimatedCircle
               cx={radius}
               cy={radius}
               r={adjustedRadius}
               stroke={progressColor}
               strokeWidth={strokeWidth}
               fill="none"
               strokeDasharray={`${circumference}`}
               strokeDashoffset={strokeDashoffset}
               strokeLinecap="round"
               rotation="-90"
               origin={`${radius}, ${radius}`}
            />
         </Svg>

         {/* Centered Text */}
         {showText && (
            <View style={styles.centeredText}>
               <Text
                  style={{
                     fontSize: 24,
                     fontWeight: '600',
                     color: theme.colors.onSurface,
                  }}
               >
                  {valuePrefix}
                  {animatedRemaining}
                  {valueSuffix}
               </Text>
               {text !== '' && (
                  <Text
                     style={{
                        fontSize: 14,
                        color: theme.colors.onSurfaceVariant,
                     }}
                  >
                     {text}
                  </Text>
               )}
            </View>
         )}
      </View>
   );
};

const styles = StyleSheet.create({
   centeredText: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
   },
});

export default AnimatedCircularProgress;
