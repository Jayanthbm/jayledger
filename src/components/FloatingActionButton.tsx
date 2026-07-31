import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp, Platform, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/store/ThemeContext';

interface FloatingActionButtonProps {
  onPress: () => void;
  iconName: keyof typeof MaterialIcons.glyphMap;
  backgroundColor?: string;
  iconColor?: string;
  iconSize?: number;
  size?: number;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  iconName,
  backgroundColor = '#6200ee',
  iconColor,
  iconSize = 28,
  size = 64,
  style,
  disabled = false,
}) => {
  const { isDark } = useTheme();
  const effectiveIconColor = iconColor ?? (isDark ? '#FFFFFF' : '#000000');
  const borderRadius = size / 3;

  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.fabWrapper, style]}>
        <BlurView
          intensity={65}
          tint="light"
          style={[
            styles.blurContainer,
            {
              width: size,
              height: size,
              borderRadius,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.fabInner,
              {
                backgroundColor: 'rgba(255, 255, 255, 0.15)', // Ultra-transparent glass fill
                width: size,
                height: size,
                borderRadius,
              },
            ]}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={disabled}
          >
            {/* Top specular highlight reflection */}
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.65)', 'rgba(255, 255, 255, 0.1)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius }]}
            />
            {/* Inner rim glow border */}
            <View
              style={[
                styles.glassInnerBorder,
                {
                  borderRadius,
                  borderColor: 'rgba(255, 255, 255, 0.6)',
                },
              ]}
            />
            <MaterialIcons
              name={iconName}
              size={iconSize}
              color={effectiveIconColor}
              style={styles.iconGlow}
            />
          </TouchableOpacity>
        </BlurView>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          backgroundColor,
          width: size,
          height: size,
          borderRadius,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <MaterialIcons name={iconName} size={iconSize} color={effectiveIconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fabWrapper: {
    position: 'absolute',
    right: 24,
    bottom: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  blurContainer: {
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  fabInner: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  glassInnerBorder: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
    margin: 1,
    opacity: 0.8,
  },
  iconGlow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: Platform.OS === 'ios' ? 100 : 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
