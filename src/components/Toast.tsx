import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../store/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type: ToastType;
  onHide: () => void;
}

export const Toast = ({ visible, message, type, onHide }: ToastProps) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [translateY] = useState(() => new Animated.Value(-100));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: insets.top + 24,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, insets.top, translateY, opacity]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.danger;
      case 'warning':
        return '#f59e0b'; // Amber 500
      default:
        return colors.primary;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'error-outline';
      case 'warning':
        return 'warning-amber';
      default:
        return 'info-outline';
    }
  };

  if (!visible) return null;

  const backgroundColor = getBackgroundColor();
  const themedStyles = {
    container: {
      transform: [{ translateY }],
      opacity,
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      shadowColor: '#000',
      borderColor: backgroundColor + '40',
    },
    content: { backgroundColor: backgroundColor + '10' },
    iconContainer: { backgroundColor },
    message: { color: isDark ? '#fff' : '#333' },
  };

  return (
    <Animated.View style={[styles.container, themedStyles.container]}>
      <View style={[styles.content, themedStyles.content]}>
        <View style={[styles.iconContainer, themedStyles.iconContainer]}>
          <Icon name={getIcon()} size={20} color="#fff" />
        </View>
        <Text style={[styles.message, themedStyles.message]} numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity onPress={onHide} style={styles.closeBtn}>
          <Icon name="close" size={18} color={isDark ? '#aaa' : '#999'} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingRight: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  closeBtn: {
    padding: 8,
  },
});
