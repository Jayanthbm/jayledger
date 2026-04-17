import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { BottomSheet } from '../BottomSheet';
import { SearchBar } from '../SearchBar';
import { Category, Payee, ThemeColors } from '../../models/types';
import { formatIconName } from '../../services/transactionService';
import { common } from '../../styles/common';

interface TransactionFilterSelectorProps {
  type: 'Category' | 'Payee';
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  payees: Payee[];
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
    tempSelectedItems,
    setTempSelectedItems,
    onApply,
    colors,
    modalSearch,
    setModalSearch,
  }: TransactionFilterSelectorProps) => {
    const data = (type === 'Category' ? categories : payees).filter((item) =>
      item.name.toLowerCase().includes(modalSearch.toLowerCase()),
    );

    const toggleTempSelection = (id: string) => {
      setTempSelectedItems((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    };

    return (
      <BottomSheet
        visible={visible}
        onClose={onClose}
        title={`Select ${type === 'Category' ? 'Categories' : 'Payees'}`}
      >
        <View style={common.pb16}>
          <SearchBar
            value={modalSearch}
            onChangeText={setModalSearch}
            placeholder={`Search ${type}...`}
            size="medium"
            onClear={() => setModalSearch('')}
          />
        </View>

        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          numColumns={4}
          renderItem={({ item }: { item: Category | Payee }) => {
            const isSelected = tempSelectedItems.includes(item.id);
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
                  <Icon
                    name={
                      formatIconName(
                        (item as Category).app_icon ||
                          (type === 'Category' ? 'category' : 'person'),
                      ) as any
                    }
                    size={24}
                    color={isSelected ? 'white' : colors.textSecondary}
                  />
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
