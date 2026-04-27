import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { common } from '../../styles/common';
import { ThemeColors } from '../../models/types';

interface Location {
  latitude: number;
  longitude: number;
}

interface TransactionLocationEditRowProps {
  location: Location | null;
  onEditPress: () => void;
  colors: ThemeColors;
}

export const TransactionLocationEditRow = ({
  location,
  onEditPress,
  colors,
}: TransactionLocationEditRowProps) => {
  return (
    <TouchableOpacity
      style={[styles.container, { borderColor: colors.border, backgroundColor: colors.card }]}
      onPress={onEditPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBg, { backgroundColor: colors.primary + '15' }]}>
        <Icon name="location-pin" size={20} color={colors.primary} />
      </View>
      <View style={common.flex1}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Transaction Location</Text>
        <Text style={[styles.value, { color: location ? colors.text : colors.textSecondary }]}>
          {location
            ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
            : 'No location set'}
        </Text>
      </View>
      <View
        style={[styles.editBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
      >
        <Text style={[styles.editBtnText, { color: colors.text }]}>Edit</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
