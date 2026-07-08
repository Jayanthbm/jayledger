import React from 'react';
import { View, StyleSheet } from 'react-native';

// Empty loading screen - splash screen is visible on top
export default function LoadingScreen() {
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
