import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Keyboard } from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { useTheme } from '../../store/ThemeContext';

interface NativeKeyboardToolbarProps {
  onDone?: () => void;
  doneText?: string;
}

export const NativeKeyboardToolbar: React.FC<NativeKeyboardToolbarProps> = ({
  onDone,
  doneText = 'Done',
}) => {
  const { colors, isDark } = useTheme();
  const keyboard = useAnimatedKeyboard({ isStatusBarTranslucentAndroid: true });

  const animatedStyle = useAnimatedStyle(() => {
    // Height of the keyboard
    const keyboardHeight = keyboard.height.value;
    const isVisible = keyboardHeight > 10;

    return {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: keyboardHeight,
      opacity: isVisible ? 1 : 0,
      transform: [{ translateY: isVisible ? 0 : 50 }],
      zIndex: 9999,
      pointerEvents: isVisible ? 'auto' : 'none',
    };
  });

  // iOS and iPadOS only
  if (Platform.OS !== 'ios') {
    return null;
  }

  const handleDone = () => {
    Keyboard.dismiss();
    if (onDone) {
      onDone();
    }
  };

  const toolbarThemeStyle = {
    backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
    borderTopColor: isDark ? '#2C2C2E' : '#E5E5EA',
  };

  const renderDoneButton = () => {
    try {
      const { Button: SwiftUIButton, Host } = require('@expo/ui/swift-ui');
      const { buttonStyle, controlSize } = require('@expo/ui/swift-ui/modifiers');
      if (SwiftUIButton && Host && buttonStyle && controlSize) {
        const modifiers = [controlSize('large'), buttonStyle('glass')];
        return (
          <Host style={styles.nativeButtonHost}>
            <SwiftUIButton label={doneText} modifiers={modifiers} onPress={handleDone} />
          </Host>
        );
      }
    } catch {
      // Fall through to styled component
    }

    const pillThemeStyle = {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.08)',
    };

    return (
      <TouchableOpacity
        onPress={handleDone}
        style={[styles.donePill, pillThemeStyle]}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 10, right: 10 }}
      >
        <Text style={[styles.doneText, { color: colors.text }]}>{doneText}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View style={animatedStyle}>
      <View style={[styles.toolbar, toolbarThemeStyle]}>
        <View style={styles.flex1} />
        {renderDoneButton()}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toolbar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 12,
    paddingLeft: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: -2 },
  },
  flex1: {
    flex: 1,
  },
  nativeButtonHost: {
    minWidth: 90,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donePill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
