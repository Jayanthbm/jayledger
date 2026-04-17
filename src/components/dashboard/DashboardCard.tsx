import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface DashboardCardProps {
  children: React.ReactNode;
  colors: any;
  title?: string;
  subtitle?: string;
  icon?: string;
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
  headerRight
}: DashboardCardProps) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[
        styles.card,
        isMain && styles.mainCard,
        { backgroundColor: colors.card, borderColor: colors.border },
        style
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {(title || icon) && (
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            {icon && <MaterialIcons name={icon as any} size={20} color={colors.primary} />}
            <View>
              {title && <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{title}</Text>}
              {subtitle && <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{subtitle}</Text>}
            </View>
          </View>
          {headerRight}
        </View>
      )}
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
  },
  mainCard: {
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  cardSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2
  },
});
