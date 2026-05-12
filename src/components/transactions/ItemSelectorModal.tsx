import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { BottomSheet } from '../BottomSheet';
import { SearchBar } from '../SearchBar';
import Icon from '@expo/vector-icons/MaterialIcons';
import { Category, Payee, MaterialIconName } from '../../models/types';
import { useTheme } from '../../store/ThemeContext';
import { common } from '../../styles/common';

const formatIconName = (name: string) => {
  if (!name) return 'category';
  let formatted = name.trim();
  if (formatted.startsWith('Md')) {
    formatted = formatted.substring(2);
    formatted = formatted.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }
  return formatted;
};

export interface ItemSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'Category' | 'Payee';
  data: (Category | Payee | { id: 'none'; name: string })[];
  searchQuery: string;
  onSearchChange: (text: string) => void;
  selectedItemId?: string;
  onSelect: (item: Category | Payee | { id: 'none'; name: string }) => void;
  transactionType: 'Income' | 'Expense';
}

export const ItemSelectorModal = ({
  visible,
  onClose,
  type,
  data,
  searchQuery,
  onSearchChange,
  selectedItemId,
  onSelect,
  transactionType,
}: ItemSelectorModalProps) => {
  const { colors } = useTheme();

  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const iconColor = transactionType === 'Income' ? colors.success : colors.danger;
  const iconBg = transactionType === 'Income' ? colors.success + '15' : colors.danger + '15';

  return (
    <BottomSheet visible={visible} onClose={onClose} title={`Select ${type}`}>
      <View style={styles.modalInner}>
        <View style={styles.modalSearchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder={`Search ${type.toLowerCase()}...`}
            size="medium"
            onClear={() => onSearchChange('')}
          />
        </View>

        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          numColumns={4}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.modalListContent}
          keyboardShouldPersistTaps="always"
          renderItem={({ item }) => {
            const isSelected = selectedItemId === item.id;
            const isPayee = type === 'Payee';
            const isNone = item.id === 'none';
            const payee = item as Payee;

            let iconNode;

            if (isPayee && !isNone) {
              if (payee.logo) {
                iconNode = (
                  <Image
                    source={{ uri: payee.logo }}
                    style={styles.logoImage}
                    contentFit="contain"
                    transition={200}
                    cachePolicy="disk"
                  />
                );
              } else {
                const avatarColorStyle = { color: isSelected ? 'white' : iconColor };
                iconNode = (
                  <Text style={[styles.avatarText, avatarColorStyle]}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                );
              }
            } else {
              iconNode = (
                <Icon
                  name={
                    formatIconName(
                      (item as Category).app_icon || (isPayee ? 'person' : 'category'),
                    ) as MaterialIconName
                  }
                  size={24}
                  color={isSelected ? 'white' : iconColor}
                />
              );
            }

            return (
              <TouchableOpacity style={styles.gridItem} onPress={() => onSelect(item)}>
                <View
                  style={[
                    styles.gridIconBox,
                    {
                      backgroundColor: isSelected ? iconColor : iconBg,
                      borderColor: isSelected ? iconColor : colors.border,
                    },
                  ]}
                >
                  {iconNode}
                </View>
                <Text
                  style={[
                    styles.gridLabel,
                    { color: isSelected ? colors.primary : colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View
              style={[
                common.noResultsSearchContainer,
                styles.emptyMarginTop,
                { borderColor: colors.border },
              ]}
            >
              <Text style={[common.noResultsSearchText, { color: colors.textSecondary }]}>
                No {type.toLowerCase()} found matching &quot;{searchQuery}&quot;
              </Text>
              <TouchableOpacity
                onPress={() => onSearchChange('')}
                style={[common.clearSearchButton, { backgroundColor: colors.primary + '15' }]}
              >
                <Text style={[common.clearSearchText, { color: colors.primary }]}>
                  Clear Search
                </Text>
              </TouchableOpacity>
            </View>
          }
          style={styles.modalList}
        />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  modalInner: { maxHeight: 500 },
  modalSearchContainer: { paddingBottom: 16 },
  modalListContent: { paddingBottom: 40, paddingHorizontal: 10 },
  modalList: { maxHeight: 400 },
  emptyMarginTop: { marginTop: 40 },
  gridItem: {
    flex: 1,
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  gridIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
});
