// src/components/app/AppBar.jsx

import { Pressable, StyleSheet, View } from 'react-native';

import Loader from '../core/Loader';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

const ICON_SIZE = 30;
const ICON_TOUCH = 40;

const AppBar = ({
  showBack = true,
  loading = false,
  centerContent = null,
  rightContent = null,
}) => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const onBackPress = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const iconColor = theme.colors.onBackground;

  return (
    <>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Left (Back icon if enabled) */}
        {showBack ? (
          <Pressable
            onPress={onBackPress}
            style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
            android_ripple={{
              color: theme.colors.onSurfaceVariant + '22',
              borderless: false,
              foreground: true,
            }}
          >
            <MaterialDesignIcons name="arrow-left" size={ICON_SIZE} color={iconColor} />
          </Pressable>
        ) : (
          <View style={styles.sideSpace} />
        )}

        {/* Center (Custom content or children) */}
        <View style={styles.centerContainer}>{centerContent}</View>

        {/* Right (Custom content like theme toggle, menu, etc.) */}
        <View style={styles.rightContainer}>{rightContent}</View>
      </View>

      {loading && <Loader inline position="center" size="medium" variant="contained" />}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 8,
  },
  backButton: {
    width: ICON_TOUCH,
    height: ICON_TOUCH,
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  sideSpace: {
    width: ICON_TOUCH,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8, // ✅ adds space before right icon
  },
  rightContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    minWidth: ICON_TOUCH, // ✅ flexible width, not fixed
  },
});
export default AppBar;
