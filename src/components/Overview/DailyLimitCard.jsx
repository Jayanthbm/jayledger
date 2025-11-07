import Card from '../core/Card';
import ProgressBar from '../core/ProgressBar';
import React from 'react';
import Skeleton from '../core/Skeleton';
import Text from '../core/Text';
import { View } from 'react-native';
import dayjs from 'dayjs';
import { formatIndianNumber } from '../../utils';
import { useTheme } from '../../context/ThemeContext';

const DailyLimitCard = ({
  limit = 0,
  remaining = 0,
  spent = 0,
  loading = false,
  onPress,
  disabled = false,
}) => {
  const { theme } = useTheme();

  const today = dayjs().format('DD MMM YYYY');
  const progress = limit > 0 ? spent / limit : 0;
  const isOverspent = progress > 1;

  return (
    <Card title="Daily Limit" subtitle={today} onPress={onPress} disabled={disabled}>
      {loading ? (
        <View style={{ gap: 8 }}>
          <Skeleton height={24} borderRadius={4} />
          <Skeleton height={12} borderRadius={6} />
        </View>
      ) : (
        <>
          {/* 💰 Remaining */}
          <Text
            color={isOverspent ? theme.colors.expense : theme.colors.onSurface}
            style={{
              fontSize: 28,
              fontWeight: '700',
              marginBottom: 4,
            }}
          >
            {formatIndianNumber(remaining)}
          </Text>

          {/* 🧾 Spent / Limit summary */}
          <Text
            style={{
              fontSize: 15,
              color: theme.colors.onSurfaceVariant,
              marginBottom: 12,
            }}
          >
            {formatIndianNumber(remaining)} spent of {formatIndianNumber(remaining)}
          </Text>

          {/* 📊 Progress bar */}
          <ProgressBar
            progress={Math.min(progress, 1)}
            height={12}
            duration={600}
            style={{
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: 6,
            }}
          />

          {/* 📈 Caption */}
          <Text
            style={{
              fontSize: 13,
              color: theme.colors.onSurfaceVariant,
              marginTop: 8,
            }}
          >
            {isOverspent
              ? `You've overspent by ${Math.round((progress - 1) * 100)}% today`
              : `${Math.round(progress * 100)}% of your daily limit used`}
          </Text>
        </>
      )}
    </Card>
  );
};

export default DailyLimitCard;
