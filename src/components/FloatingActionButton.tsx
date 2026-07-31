import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp, Platform, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';

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
  backgroundColor = '#6200ee', // Default fallback
  iconColor = '#fff',
  iconSize = 28,
  size = 64,
  style,
  disabled = false,
}) => {
  const borderRadius = size / 3;

  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.fabWrapper, style]}>
        <BlurView
          intensity={80}
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
                backgroundColor: backgroundColor + 'CC', // 80% opacity for glass shine
                width: size,
                height: size,
                borderRadius,
              },
            ]}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={disabled}
          >
            <MaterialIcons name={iconName} size={iconSize} color={iconColor} />
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
      <MaterialIcons name={iconName} size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fabWrapper: {
    position: 'absolute',
    right: 24,
    bottom: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  blurContainer: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  fabInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: Platform.OS === 'ios' ? 90 : 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
