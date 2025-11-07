import Card from '../core/Card';
import { PieChart } from 'react-native-gifted-charts';
import React from 'react';
import Skeleton from '../core/Skeleton';
import Text from '../core/Text';
import { View } from 'react-native';
import { formatIndianNumber } from '../../utils';
import { useTheme } from '../../context/ThemeContext';

const TopCategoriesCard = ({ data = [], loading = false, onPress }) => {
  const { theme } = useTheme();

  // Transform data for PieChart
  const chartData = data.map((item) => ({
    value: item.percent,
    color: item.color,
  }));

  return (
    <Card title="Top Categories" subtitle="Spending distribution" onPress={onPress}>
      {loading ? (
        <View style={{ gap: 8 }}>
          {[1, 2, 3].map((_, i) => (
            <Skeleton key={i} height={24} borderRadius={6} />
          ))}
        </View>
      ) : (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* ---------- Left: List ---------- */}
          <View style={{ flex: 1, gap: 8 }}>
            {data.map((item, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {/* Color marker */}
                <View
                  style={{
                    width: 8,
                    height: 32,
                    borderRadius: 4,
                    backgroundColor: item.color,
                    marginRight: 6,
                  }}
                />

                {/* Label + amount + percent */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      fontSize: 14,
                      fontWeight: '500',
                    }}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>

                  {/* Amount + Percent inline */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 2,
                    }}
                  >
                    <Text
                      style={{
                        color: theme.colors.onSurface,
                        fontSize: 13,
                      }}
                      numberOfLines={1}
                    >
                      {formatIndianNumber(item.amount)}
                    </Text>

                    <Text
                      style={{
                        color: theme.colors.onSurfaceVariant,
                        fontSize: 13,
                      }}
                    >
                      {item.percent.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* ---------- Right: Donut chart ---------- */}
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <PieChart data={chartData} radius={60} donut backgroundColor={theme.colors.surface} />
          </View>
        </View>
      )}
    </Card>
  );
};

export default TopCategoriesCard;
