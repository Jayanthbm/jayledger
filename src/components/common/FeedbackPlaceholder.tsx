import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../../store/ThemeContext';

export interface FeedbackPlaceholderProps {
  icon?: keyof typeof Icon.glyphMap;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  iconSize?: number;
}

export const FeedbackPlaceholder = ({
  icon = 'search-off',
  title,
  subtitle,
  actionLabel,
  onAction,
  iconSize = 48,
}: FeedbackPlaceholderProps) => {
  const { colors } = useTheme();

  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconBox, { backgroundColor: colors.border + '15' }]}>
        <Icon name={icon} size={iconSize} color={colors.border} />
      </View>
      <Text style={[styles.emptyHeader, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{subtitle}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.clearFilterBtn, { backgroundColor: colors.primary }]}
          onPress={onAction}
        >
          <Text style={styles.clearFilterBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  clearFilterBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 2,
  },
  clearFilterBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
