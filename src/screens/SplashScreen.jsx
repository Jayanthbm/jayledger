// src/screens/SplashScreen.js

import Animated, {
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideInRight,
  SlideOutDown,
} from 'react-native-reanimated';
import { StyleSheet, View ,Text} from 'react-native';

import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function SplashScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 🔹 Animated Logo + Title */}
      <Animated.View
        entering={FadeIn.duration(500)}
        exiting={FadeOut.duration(400)}
        style={styles.logoContainer}
      >
        <Animated.View
          entering={SlideInLeft.duration(600).delay(100)}
          exiting={SlideOutDown.duration(200)}
        >
          <MaterialDesignIcons
            name="finance"
            size={72}
            color={theme.colors.primary}
            style={{ marginBottom: 8 }}
          />
        </Animated.View>

        <Animated.View
          entering={SlideInRight.duration(700).delay(250)}
          exiting={SlideOutDown.duration(250)}
        >
          <Text
            style={{
              fontSize: 32,
              fontWeight: '700',
              color: theme.colors.primary,
            }}
          >
            JayLedger
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(800).delay(400)} exiting={FadeOut.duration(200)}>
          <Text
            style={{
              fontSize: 16,
              color: theme.colors.onSurfaceVariant,
              marginTop: 6,
            }}
          >
            Smart. Simple. Secure.
          </Text>
        </Animated.View>
      </Animated.View>

      {/* 🔹 Animated Loader */}
      {/* <Loader
        inline={true}
        position="center"
        size="xlarge"
        style={{
          marginTop: 30,
        }}
      /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
});
