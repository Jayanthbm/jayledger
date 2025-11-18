// src/hooks/useScrollToTopSection.js

import { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { useRef, useState } from 'react';

export const useScrollToTopSection = () => {
  const listRef = useRef(null);
  const show = useSharedValue(0); // 0 = hidden, 1 = visible

  const toTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    show.value = withTiming(0, { duration: 250 });
  };

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    show.value = withTiming(offsetY > 250 ? 1 : 0, { duration: 250 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: show.value,
    transform: [{ translateY: withTiming(show.value ? 0 : 20, { duration: 250 }) }],
  }));

  return {
    listRef,
    toTop,
    handleScroll,
    animatedStyle,
  };
};
