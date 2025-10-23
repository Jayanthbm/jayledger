import { Animated, Easing, StyleSheet, View } from 'react-native';
import React, { useEffect, useRef } from 'react';

import { useTheme } from '../../context/ThemeContext';

const Skeleton = ({
   width = '100%',
   height = 20,
   borderRadius = 8,
   circular = false,
   style,
   shimmerDuration = 1800,
}) => {
   const { theme } = useTheme();
   const shimmerAnim = useRef(new Animated.Value(-1)).current;

   useEffect(() => {
      Animated.loop(
         Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: shimmerDuration,
            easing: Easing.linear,
            useNativeDriver: true,
         })
      ).start();
   }, [shimmerDuration]);

   const translateX = shimmerAnim.interpolate({
      inputRange: [-1, 1],
      outputRange: [-1000, 1000], // wide enough to cover any width
   });

   const skeletonWidth = typeof width === 'number' ? width : '100%';
   const radius = circular ? height / 2 : borderRadius;

   return (
      <View
         style={[
            {
               width: skeletonWidth,
               height,
               borderRadius: radius,
               backgroundColor: theme.colors.skeletonBackground,
               overflow: 'hidden',
            },
            style,
         ]}
      >
         <Animated.View
            style={[
               styles.shimmer,
               {
                  width: '30%',
                  height: '100%',
                  transform: [{ translateX }],
                  backgroundColor: theme.colors.skeletonShimmer,
               },
            ]}
         />
      </View>
   );
};

const styles = StyleSheet.create({
   shimmer: {
      opacity: 1,
   },
});

export default Skeleton;
