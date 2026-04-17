import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../store/ThemeContext';

export interface BudgetCardProps {
  name: string;
  amount: number;
  spent: number;
  startDateText: string; // e.g., "Apr 1"
  endDateText: string; // e.g., "Apr 30"
  isCurrentMonth: boolean;
  daysRemaining?: number;
  todayProgress?: number; // percentage of month elapsed
  daysInMonth?: number;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const BudgetCard = ({
  name,
  amount,
  spent,
  startDateText,
  endDateText,
  isCurrentMonth,
  daysRemaining,
  todayProgress,
  daysInMonth = 30,
  onPress,
  onLongPress,
}: BudgetCardProps) => {
  const { colors } = useTheme();

  const percentage = amount > 0 ? Math.round((spent / amount) * 100) : 0;
  const visualPercentage = Math.min(percentage, 100);
  const isOverspent = spent > amount;
  const remaining = amount - spent;

  let adviceText = '';
  if (isCurrentMonth) {
    if (isOverspent) {
      adviceText = `Overspent ₹${(spent - amount).toLocaleString()}`;
    } else {
      const perDay =
        daysRemaining && daysRemaining > 0 ? Math.floor(remaining / daysRemaining) : remaining;
      adviceText = `You can spend ₹${perDay.toLocaleString()}/day for ${daysRemaining || 0} more days`;
    }
  } else {
    if (isOverspent) {
      adviceText = `Overspent ₹${(spent - amount).toLocaleString()}`;
    } else {
      adviceText = `Saved ₹${remaining.toLocaleString()}`;
    }
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
        <Text style={[styles.spentText, { color: colors.textSecondary }]}>
          ₹{spent.toLocaleString()} spent of ₹{amount.toLocaleString()}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          {/* Day Markers (Divisions) */}
          {isCurrentMonth && (
            <View style={StyleSheet.absoluteFill}>
              {Array.from({ length: daysInMonth }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dayMarker,
                    {
                      left: `${(i / daysInMonth) * 100}%`,
                      backgroundColor: colors.background + '40',
                    },
                  ]}
                />
              ))}
            </View>
          )}

          <View
            style={[
              styles.progressFill,
              { width: `${visualPercentage}%` },
              isOverspent ? styles.progressFillOverspent : { backgroundColor: colors.primary },
            ]}
          />

          {/* Today Indicator Line */}
          {isCurrentMonth && todayProgress !== undefined && (
            <View
              style={[
                styles.todayIndicator,
                { left: `${todayProgress}%`, backgroundColor: colors.text },
              ]}
            />
          )}
        </View>
        <View style={styles.dateRow}>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>{startDateText}</Text>
          <View
            style={[
              styles.percentageBadge,
              { backgroundColor: (isOverspent ? '#EF4444' : colors.primary) + '20' },
            ]}
          >
            <Text
              style={[
                styles.percentageText,
                isOverspent ? styles.textOverspent : { color: colors.primary },
              ]}
            >
              {percentage}%
            </Text>
          </View>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>{endDateText}</Text>
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.adviceText, isOverspent ? styles.textOverspent : styles.textSafe]}>
          {adviceText}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  spentText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    textAlign: 'right',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  percentageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 15,
  },
  adviceText: {
    fontSize: 15,
    fontWeight: '700',
  },
  dayMarker: {
    position: 'absolute',
    width: 1,
    height: '100%',
  },
  todayIndicator: {
    position: 'absolute',
    width: 2,
    height: '100%',
    zIndex: 10,
  },
  textOverspent: {
    color: '#EF4444',
  },
  textSafe: {
    color: '#10B981',
  },
  progressFillOverspent: {
    backgroundColor: '#EF4444',
  },
});
