// src/components/app/ScrollToTopWrapper.jsx

import Animated from 'react-native-reanimated';
import ScrolltoTopIcon from './ScrolltoTopIcon';

const ScrollToTopWrapper = ({ animatedStyle, onPress }) => {
  return (
    <Animated.View style={animatedStyle}>
      <ScrolltoTopIcon visible onPress={onPress} align="center" />
    </Animated.View>
  );
};

export default ScrollToTopWrapper;
