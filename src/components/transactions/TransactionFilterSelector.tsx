import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { BottomSheet } from '../BottomSheet';
import { SearchBar } from '../SearchBar';
import {
  Category,
  MaterialIconName,
  Payee,
  ThemeColors,
  TransactionGroup,
} from '../../models/types';
import { formatIconName } from '../../services/transactionService';
import { common } from '../../styles/common';

interface TransactionFilterSelectorProps {
  type: 'Category' | 'Payee' | 'Group';
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  payees: Payee[];
  groups?: TransactionGroup[];
  tempSelectedItems: string[];
  setTempSelectedItems: React.Dispatch<React.SetStateAction<string[]>>;
  onApply: (selected: string[]) => void;
  colors: ThemeColors;
  modalSearch: string;
  setModalSearch: (text: string) => void;
}

export const TransactionFilterSelector = React.memo(
  ({
    type,
    visible,
    onClose,
    categories,
    payees,
    groups = [],
    tempSelectedItems,
    setTempSelectedItems,
    onApply,
    colors,
    modalSearch,
    setModalSearch,
  }: TransactionFilterSelectorProps) => {
    const data = (type === 'Category' ? categories : type === 'Payee' ? payees : groups).filter(
      (item) => item.name.toLowerCase().includes(modalSearch.toLowerCase()),
    );

    const toggleTempSelection = (id: string) => {
      setTempSelectedItems((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    };

    const getTitle = () => {
      if (type === 'Category') return 'Categories';
      if (type === 'Payee') return 'Payees';
      return 'Groups';
    };

    return (
      <BottomSheet visible={visible} onClose={onClose} title={`Select ${getTitle()}`}>
        <View style={common.pb16}>
          <SearchBar
            value={modalSearch}
            onChangeText={setModalSearch}
            placeholder={`Search ${type}...`}
            size="medium"
            onClear={() => setModalSearch('')}
          />
          {modalSearch.length > 0 && data.length === 0 && (
            <View style={[common.ph10, common.mt8]}>
              <View
                style={[
                  common.noResultsSearchContainer,
                  { borderColor: colors.border, backgroundColor: colors.card + '50' },
                ]}
              >
                <Text style={[common.noResultsSearchText, { color: colors.textSecondary }]}>
                  No {type.toLowerCase()}s found matching &quot;{modalSearch}&quot;
                </Text>
                <TouchableOpacity
                  onPress={() => setModalSearch('')}
                  style={[common.clearSearchButton, { backgroundColor: colors.primary + '15' }]}
                >
                  <Text style={[common.clearSearchText, { color: colors.primary }]}>
                    Clear Search
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          numColumns={4}
          keyboardShouldPersistTaps="always"
          renderItem={({ item }: { item: Category | Payee | TransactionGroup }) => {
            const isSelected = tempSelectedItems.includes(item.id);
            const isPayee = type === 'Payee';
            const isGroup = type === 'Group';

            let iconNode;

            if (isPayee) {
              const avatarColorStyle = { color: isSelected ? 'white' : colors.textSecondary };
              iconNode = (
                <Text style={[styles.avatarText, avatarColorStyle]}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              );
            } else if (isGroup) {
              iconNode = (
                <Icon name="folder" size={24} color={isSelected ? 'white' : colors.textSecondary} />
              );
            } else {
              iconNode = (
                <Icon
                  name={
                    formatIconName((item as Category).app_icon || 'category') as MaterialIconName
                  }
                  size={24}
                  color={isSelected ? 'white' : colors.textSecondary}
                />
              );
            }

            return (
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => toggleTempSelection(item.id)}
              >
                <View
                  style={[
                    styles.gridIconBox,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.background,
                      borderColor: isSelected ? colors.primary : colors.border,
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
          contentContainerStyle={common.pb20}
        />

        <TouchableOpacity
          style={[styles.modalDone, { backgroundColor: colors.primary }]}
          onPress={() => onApply(tempSelectedItems)}
        >
          <Text style={common.textWhiteBold16}>Apply Filters</Text>
        </TouchableOpacity>
      </BottomSheet>
    );
  },
);
TransactionFilterSelector.displayName = 'TransactionFilterSelector';

const styles = StyleSheet.create({
  gridItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  gridIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1.5,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalDone: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
