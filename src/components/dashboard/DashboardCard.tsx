import type { MaterialIconName, ThemeColors } from '../../models/types';
import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { cardStyles } from '../../styles/cardStyles';

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
}: DashboardCardProps) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[
        cardStyles.container,
        isMain && cardStyles.main,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
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
      {children}
    </Container>
  );
};
