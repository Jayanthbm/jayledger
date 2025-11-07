// src/components/core/RowText.jsx

import { StyleSheet, Text, View } from 'react-native';

import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const RowText = ({
  left = '',
  right = '',
  leftSecondary = '',
  rightSecondary = '',
  leftIcon = null,
  rightIcon = null,
  leftSecondaryIcon = null,
  rightSecondaryIcon = null,
  style,
  leftStyle,
  rightStyle,
  leftSecondaryStyle,
  rightSecondaryStyle,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {/* Left Column */}
      <View style={styles.leftColumn}>
        {leftIcon && <View style={styles.iconWrapper}>{leftIcon}</View>}
        <View style={{ flexDirection: 'column' }}>
          <Text style={[{ color: theme.colors.onBackground }, leftStyle]}>{left}</Text>
          {leftSecondary !== '' && (
            <View style={styles.secondaryRow}>
              {leftSecondaryIcon && <View style={styles.iconWrapper}>{leftSecondaryIcon}</View>}
              <Text style={[{ color: theme.colors.onSurfaceVariant }, leftSecondaryStyle]}>
                {leftSecondary}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Right Column */}
      <View style={styles.rightColumn}>
        {rightIcon && <View style={styles.iconWrapper}>{rightIcon}</View>}
        <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
          <Text style={[{ color: theme.colors.onBackground }, rightStyle]}>{right}</Text>
          {rightSecondary !== '' && (
            <View style={[styles.secondaryRow, { justifyContent: 'flex-end' }]}>
              {rightSecondaryIcon && <View style={styles.iconWrapper}>{rightSecondaryIcon}</View>}
              <Text style={[{ color: theme.colors.onSurfaceVariant }, rightSecondaryStyle]}>
                {rightSecondary}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  leftColumn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightColumn: {
    flexDirection: 'row',
    alignItems: 'flex-start', // allow secondary row to align right
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    marginRight: 6,
  },
});

export default RowText;
