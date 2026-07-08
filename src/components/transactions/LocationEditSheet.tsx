import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { BottomSheet } from '../BottomSheet';
import { MaterialIconName, ThemeColors } from '../../models/types';

interface Location {
  latitude: number;
  longitude: number;
}

interface LocationEditSheetProps {
  visible: boolean;
  onClose: () => void;
  location: Location | null;
  onUpdateFromGPS: () => void;
  onManualUpdate: (lat: number, lng: number) => void;
  onRemove: () => void;
  colors: ThemeColors;
  isFetching: boolean;
}

export const LocationEditSheet = ({
  visible,
  onClose,
  location,
  onUpdateFromGPS,
  onManualUpdate,
  onRemove,
  colors,
  isFetching,
}: LocationEditSheetProps) => {
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCoords, setManualCoords] = useState('');

  const [prevVisible, setPrevVisible] = useState(visible);

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      if (location) {
        setManualCoords(`${location.latitude}, ${location.longitude}`);
      } else {
        setManualCoords('');
      }
    } else {
      setShowManualInput(false);
    }
  }

  const handleManualSubmit = () => {
    const parts = manualCoords.split(',').map((p) => p.trim());
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        onManualUpdate(lat, lng);
        onClose();
      }
    }
  };

  const menuOptions = [
    {
      id: 'gps',
      label: 'Update from GPS',
      icon: 'my-location',
      color: colors.primary,
      onPress: () => {
        onUpdateFromGPS();
        onClose();
      },
      disabled: isFetching,
    },
    {
      id: 'manual',
      label: 'Enter Coordinates',
      icon: 'edit-location',
      color: colors.textSecondary,
      onPress: () => setShowManualInput(true),
    },
    {
      id: 'remove',
      label: 'Remove Location',
      icon: 'location-off',
      color: colors.danger,
      onPress: () => {
        onRemove();
        onClose();
      },
      disabled: !location,
    },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Edit Location">
      <View style={styles.container}>
        {!showManualInput ? (
          <View style={styles.menu}>
            {menuOptions.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.menuItem,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  opt.disabled && styles.disabledOption,
                ]}
                onPress={opt.onPress}
                disabled={opt.disabled}
              >
                <View style={[styles.iconContainer, { backgroundColor: opt.color + '15' }]}>
                  <Icon name={opt.icon as MaterialIconName} size={22} color={opt.color} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>{opt.label}</Text>
                <Icon name="chevron-right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.manualContainer}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Manual Entry</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              placeholder="lat, lng (e.g. 12.90, 77.49)"
              placeholderTextColor={colors.textSecondary + '80'}
              value={manualCoords}
              onChangeText={setManualCoords}
              keyboardType="numbers-and-punctuation"
              autoFocus
            />
            <View style={styles.manualActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowManualInput(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: colors.primary }]}
                onPress={handleManualSubmit}
              >
                <Text style={styles.applyBtnText}>Apply Coordinates</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  menu: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  disabledOption: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  manualContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  manualActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyBtn: {
    flex: 2,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
