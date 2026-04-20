import type { ThemeColors } from '../../models/types';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Payee } from '../../models/types';

interface PayeeCardProps {
  item: Payee;
  viewMode: 'list' | 'grid';
  colors: ThemeColors;
  onPress: (item: Payee) => void;
}

export const PayeeCard: React.FC<PayeeCardProps> = ({ item, viewMode, colors, onPress }) => {
  const isGrid = viewMode === 'grid';

  return (
    <TouchableOpacity
      style={[
        styles.payeeCard,
        { backgroundColor: colors.card, borderColor: colors.border },
        isGrid && styles.payeeCardGrid,
      ]}
      activeOpacity={0.7}
      onPress={() => onPress(item)}
    >
      <View
        style={[
          styles.logoContainer,
          { backgroundColor: colors.primary + '15' },
          isGrid && styles.logoContainerGrid,
        ]}
      >
        {item.logo && item.logo.startsWith('http') ? (
          <Image
            source={{ uri: item.logo }}
            style={styles.logoImage}
            contentFit="cover"
            transition={200}
            cachePolicy="disk"
          />
        ) : (
          <Text
            style={[
              styles.logoFallback,
              { color: colors.primary },
              isGrid ? styles.logoFallbackSm : styles.logoFallbackLg,
            ]}
          >
            {item.name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <Text
        style={[styles.payeeName, { color: colors.text }, isGrid && styles.gridName]}
        numberOfLines={2}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  payeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  payeeCardGrid: {
    width: '31%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginHorizontal: '1%',
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  logoImage: { width: '100%', height: '100%' },
  logoFallback: { fontWeight: 'bold' },
  logoFallbackLg: { fontSize: 22 },
  logoFallbackSm: { fontSize: 18 },
  logoContainerGrid: { marginRight: 0 },
  payeeName: { fontSize: 13, fontWeight: '700', flex: 1 },
  gridName: { marginTop: 10, textAlign: 'center', fontSize: 13 },
});
