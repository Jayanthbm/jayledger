import type { ThemeColors } from '../../models/types';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Category, MaterialIconName } from '../../models/types';

interface CategoryCardProps {
  item: Category;
  viewMode: 'list' | 'grid';
  colors: ThemeColors;
  onPress: (item: Category) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ item, viewMode, colors, onPress }) => {
  const isGrid = viewMode === 'grid';
  const accentColor = item.type === 'Income' ? colors.success : colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.itemCard,
        { backgroundColor: colors.card, borderColor: colors.border },
        isGrid && styles.itemCardGrid,
      ]}
      activeOpacity={0.7}
      onPress={() => onPress(item)}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: accentColor + '15' },
          isGrid && styles.iconBoxGrid,
        ]}
      >
        {item.app_icon ? (
          <MaterialIcons
            name={item.app_icon as MaterialIconName}
            size={isGrid ? 24 : 26}
            color={accentColor}
          />
        ) : (
          <Text style={[styles.legacyIconFallback, isGrid && styles.legacyIconGrid]}>
            {item.icon || '🏷️'}
          </Text>
        )}
      </View>
      <Text
        style={[styles.itemName, { color: colors.text }, isGrid && styles.gridName]}
        numberOfLines={2}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  itemCardGrid: {
    width: '31%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginHorizontal: '1%',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  legacyIconFallback: { fontSize: 24 },
  legacyIconGrid: { fontSize: 22 },
  iconBoxGrid: { marginRight: 0 },
  itemName: { fontSize: 13, fontWeight: '700', flex: 1 },
  gridName: { marginTop: 10, textAlign: 'center', fontSize: 13 },
});
