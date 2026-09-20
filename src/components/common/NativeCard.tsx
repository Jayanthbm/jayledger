import React from 'react';
import { Platform, View, ViewStyle, TouchableOpacity } from 'react-native';

interface NativeCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'filled' | 'outlined';
  elevation?: number;
  onPress?: () => void;
  activeOpacity?: number;
}

export const NativeCard: React.FC<NativeCardProps> = ({
  children,
  style,
  variant = 'elevated',
  elevation = 2,
  onPress,
  activeOpacity = 0.7,
}) => {
  // On Android, use native Jetpack Compose Card when available
  if (Platform.OS === 'android') {
    try {
      const { Card, Host } = require('@expo/ui/jetpack-compose');
      if (Card && Host) {
        return (
          <Host style={[{ flex: 1 }, style]}>
            <Card variant={variant} elevation={elevation} shape="medium" onClick={onPress}>
              {children}
            </Card>
          </Host>
        );
      }
    } catch {
      // Fall through to standard React Native container
    }
  }

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container style={style} onPress={onPress} activeOpacity={onPress ? activeOpacity : 1}>
      {children}
    </Container>
  );
};
