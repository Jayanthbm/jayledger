import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import Icon from '@expo/vector-icons/Ionicons';

interface NativeHeaderBackButtonProps {
  onPress?: () => void;
  tintColor?: any;
}

export const NativeHeaderBackButton: React.FC<NativeHeaderBackButtonProps> = ({
  onPress,
  tintColor,
}) => {
  const router = useRouter();
  const { colors } = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  const iconColor = typeof tintColor === 'string' ? tintColor : colors.text;

  if (Platform.OS === 'ios') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={styles.iosContainer}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        activeOpacity={0.5}
      >
        <Icon name="chevron-back" size={28} color={iconColor} style={styles.iosChevron} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.androidContainer}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      activeOpacity={0.7}
    >
      <Icon name="arrow-back" size={24} color={iconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iosContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 0,
    marginRight: 4,
  },
  iosChevron: {
    marginLeft: -2, // Optical alignment for Apple SF chevron
  },
  androidContainer: {
    height: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
