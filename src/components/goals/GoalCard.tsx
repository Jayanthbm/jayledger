import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Goal } from '../../models/types';
import { useTheme } from '../../store/ThemeContext';
import { common } from '../../styles/common';

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
          ₹{item.current_amount.toLocaleString()}
        </Text>
        <Text style={[styles.amountValue, { color: colors.text }]}>
          ₹{item.goal_amount.toLocaleString()}
        </Text>
      </View>

      <View
        style={[
          styles.progressWrapper,
          { backgroundColor: colors.border, marginTop: 12, marginBottom: 8 },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress}%`,
              backgroundColor: progress >= 100 ? colors.success : colors.primary,
            },
          ]}
        />
      </View>

      <View style={styles.statsRow}>
        <Text style={[styles.percentLabel, { color: colors.primary }]}>
          {progressDisplay}% Complete
        </Text>
        <Text style={[styles.remainingLabel, { color: colors.textSecondary }]}>
          ₹{remaining.toLocaleString()} left
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
  title: {
    fontSize: 16,
    fontWeight: 'bold',
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
  progressWrapper: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
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
