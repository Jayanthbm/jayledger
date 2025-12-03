import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '../core/Text';
import Card from '../core/Card';
import ProgressBar from '../core/ProgressBar';
import { useTheme } from '../../context/ThemeContext';
import { formatIndianNumber } from '../../utils';

const DailyStatsCard = ({ spent, limit }) => {
  const { theme } = useTheme();

  const progress = limit > 0 ? Math.min(spent / limit, 1) : 0;
  const isOverLimit = spent > limit;
  const progressColor = isOverLimit ? theme.colors.error : theme.colors.primary;

  return (
    <Card title="Today's Spending">
      <View style={styles.container}>
        <View style={styles.row}>
          <View>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Spent
            </Text>
            <Text variant="titleLarge" style={{ color: isOverLimit ? theme.colors.error : theme.colors.onSurface, fontWeight: '600' }}>
              {formatIndianNumber(spent)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Daily Limit
            </Text>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
              {formatIndianNumber(limit)}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} height={12} />
        </View>

        {isOverLimit && (
          <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 8 }}>
            You have exceeded your daily limit by {formatIndianNumber(spent - limit)}
          </Text>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressContainer: {
    marginTop: 8,
  },
});

export default DailyStatsCard;
