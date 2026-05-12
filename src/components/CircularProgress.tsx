import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CircularProgressProps {
  percentage: number;
  progressColor: string;
  borderColor: string;
  innerBackgroundColor?: string;
  value: string | number;
  label: string;
  size?: number;
  strokeWidth?: number;
  fontSize?: number;
  textColor?: string;
}

export const CircularProgress = React.memo(
  ({
    percentage,
    progressColor,
    borderColor,
    innerBackgroundColor,
    value,
    label,
    size = 80,
    strokeWidth = 6,
    fontSize,
    textColor,
  }: CircularProgressProps) => {
    const innerSize = size - strokeWidth * 2;

    return (
      <View
        style={[
          styles.progressCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: borderColor,
            borderTopColor: percentage > 0 ? progressColor : borderColor,
            borderRightColor: percentage > 25 ? progressColor : borderColor,
            borderBottomColor: percentage > 50 ? progressColor : borderColor,
            borderLeftColor: percentage > 75 ? progressColor : borderColor,
            transform: [{ rotate: '0deg' }],
          },
        ]}
      >
        <View
          style={[
            styles.progressInner,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              backgroundColor: innerBackgroundColor || progressColor + '08',
            },
          ]}
        >
          <Text style={[styles.progressText, { color: textColor, fontSize: fontSize || 18 }]}>
            {value}
          </Text>
          <Text style={[styles.progressSub, { color: textColor + 'CC' }]}>{label}</Text>
        </View>
      </View>
    );
  },
);

CircularProgress.displayName = 'CircularProgress';

const styles = StyleSheet.create({
  progressCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontWeight: '900',
  },
  progressSub: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: -2,
  },
});
