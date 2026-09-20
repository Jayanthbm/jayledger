import type { MaterialIconName, ThemeColors } from '../../models/types';
import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { cardStyles } from '../../styles/cardStyles';
import { NativeLoadingIndicator } from '../common';

interface DashboardCardProps {
  children: React.ReactNode;
  colors: ThemeColors;
  title?: string;
  subtitle?: string;
  icon?: MaterialIconName;
  onPress?: () => void;
  isMain?: boolean;
  style?: ViewStyle;
  headerRight?: React.ReactNode;
  loading?: boolean;
  minHeight?: number;
}

export const DashboardCard = ({
  children,
  colors,
  title,
  subtitle,
  icon,
  onPress,
  isMain = false,
  style,
  headerRight,
  loading = false,
  minHeight,
}: DashboardCardProps) => {
  const lastPressRef = React.useRef(0);

  const handlePress = React.useCallback(() => {
    if (!onPress || loading) return;
    const now = Date.now();
    if (now - lastPressRef.current < 600) return;
    lastPressRef.current = now;
    onPress();
  }, [onPress, loading]);

  const Container = onPress && !loading ? TouchableOpacity : View;

  return (
    <Container
      style={[
        cardStyles.container,
        isMain && cardStyles.main,
        { backgroundColor: colors.card, borderColor: colors.border },
        minHeight ? { minHeight } : null,
        style,
      ]}
      onPress={onPress && !loading ? handlePress : undefined}
      activeOpacity={onPress && !loading ? 0.7 : 1}
    >
      {(title || icon) && (
        <View style={cardStyles.header}>
          <View style={cardStyles.headerLeft}>
            {icon && <MaterialIcons name={icon} size={20} color={colors.primary} />}
            <View>
              {title && (
                <Text style={[cardStyles.title, { color: colors.textSecondary }]}>{title}</Text>
              )}
              {subtitle && (
                <Text style={[cardStyles.subtitle, { color: colors.textSecondary }]}>
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
          {headerRight}
        </View>
      )}
      {loading ? (
        <View style={cardStyles.loadingContainer}>
          <NativeLoadingIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        children
      )}
    </Container>
  );
};
