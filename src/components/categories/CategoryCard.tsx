import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Category } from '../../models/types';

interface CategoryCardProps {
  item: Category;
  viewMode: 'list' | 'grid';
  colors: any;
  onPress: (item: Category) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  item,
  viewMode,
  colors,
  onPress
}) => {
  const isGrid = viewMode === 'grid';
  const accentColor = item.type === 'Income' ? colors.success : colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.itemCard,
        { backgroundColor: colors.card, borderColor: colors.border },
        isGrid && styles.itemCardGrid
      ]}
      activeOpacity={0.7}
      onPress={() => onPress(item)}
    >
      <View style={[
        styles.iconBox,
        { backgroundColor: accentColor + '15' },
        isGrid && { marginRight: 0 }
      ]}>
        {item.app_icon ? (
          <MaterialIcons name={item.app_icon as any} size={isGrid ? 24 : 26} color={accentColor} />
        ) : (
          <Text style={[styles.legacyIconFallback, { fontSize: isGrid ? 22 : 24 }]}>{item.icon || '🏷️'}</Text>
        )}
      </View>
      <Text style={[
        styles.itemName,
        { color: colors.text },
        isGrid && { marginTop: 10, textAlign: 'center', fontSize: 13 }
      ]} numberOfLines={2}>
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
    marginBottom: 12
  },
  itemCardGrid: {
    width: '31%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginHorizontal: '1%'
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12
  },
  legacyIconFallback: { fontSize: 24 },
  itemName: { fontSize: 13, fontWeight: '700', flex: 1 },
});
