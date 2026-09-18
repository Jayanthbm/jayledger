import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../../store/ThemeContext';
import { SettingRowProps } from './SettingRow';
import { NativeLoadingIndicator } from './NativeLoadingIndicator';

export const NativeListItem: React.FC<SettingRowProps> = ({
  icon,
  title,
  value,
  onPress,
  showArrow = true,
  color,
  isLoading,
}) => {
  const { colors } = useTheme();
  const lastPressRef = React.useRef(0);

  const handlePress = React.useCallback(() => {
    if (!onPress) return;
    const now = Date.now();
    if (now - lastPressRef.current < 600) return;
    lastPressRef.current = now;
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress ? handlePress : undefined}
      activeOpacity={0.6}
      disabled={!onPress || isLoading}
    >
      <View style={[styles.iconBox, { backgroundColor: (color || colors.primary) + '15' }]}>
        <Icon name={icon} size={22} color={color || colors.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {value && (
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{value}</Text>
        )}
      </View>
      {isLoading ? (
        <NativeLoadingIndicator size="small" color={colors.primary} style={styles.loader} />
      ) : (
        showArrow && <Icon name="chevron-right" size={24} color={colors.textSecondary + '60'} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '600' },
  settingValue: { fontSize: 13, marginTop: 2 },
  loader: {
    marginRight: 4,
  },
});
