import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Goal } from '../../models/types';
import { useTheme } from '../../store/ThemeContext';
import { common } from '../../styles/common';

import { ProgressBar } from '../ProgressBar';

import { formatCurrency } from '../../utils/formatters';

interface GoalCardProps {
  item: Goal;
  onPress: (goal: Goal) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ item, onPress }) => {
  const { colors } = useTheme();

  const rawProgress = item.goal_amount ? (item.current_amount / item.goal_amount) * 100 : 0;
  const progress = Math.min(rawProgress, 100);
  const progressDisplay = Math.round(progress);
  const remaining = Math.max(item.goal_amount - item.current_amount, 0);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.7}
      onPress={() => onPress(item)}
    >
      <View style={styles.topRow}>
        <View style={common.flexRowFlex1}>
          {item.logo && item.logo.startsWith('http') ? (
            <Image source={{ uri: item.logo }} style={styles.goalLogo} />
          ) : (
            <View style={[styles.goalLogoFallback, { backgroundColor: colors.border }]}>
              <Text style={styles.emojiText}>🎯</Text>
            </View>
          )}
          <Text style={[styles.titleFlex, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Saved</Text>
        <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Target</Text>
      </View>
      <View style={styles.statsRow}>
        <Text style={[styles.amountValue, { color: colors.success }]}>
          {formatCurrency(item.current_amount)}
        </Text>
        <Text style={[styles.amountValue, { color: colors.text }]}>
          {formatCurrency(item.goal_amount)}
        </Text>
      </View>

      <ProgressBar
        progress={progress}
        color={progress >= 100 ? colors.success : colors.primary}
        backgroundColor={colors.border}
        height={10}
        style={styles.progressWrapperSpaced}
      />

      <View style={styles.statsRow}>
        <Text style={[styles.percentLabel, { color: colors.primary }]}>
          {progressDisplay}% Complete
        </Text>
        <Text style={[styles.remainingLabel, { color: colors.textSecondary }]}>
          {formatCurrency(remaining)} left
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleFlex: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emojiText: { fontSize: 16 },
  goalLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  goalLogoFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressWrapperSpaced: {
    marginTop: 12,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  percentLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  remainingLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
