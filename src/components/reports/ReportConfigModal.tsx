import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { BottomSheet } from '../BottomSheet';
import { SearchBar } from '../SearchBar';
import Icon from '@expo/vector-icons/MaterialIcons';
import { Category } from '../../models/types';
import { common } from '../../styles/common';

interface ReportConfigModalProps {
  visible: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  allCategories: Category[];
  onToggleLivingCost: (catId: string, current: boolean) => void;
  colors: any;
  bottomInset: number;
  width: number;
}

export const ReportConfigModal: React.FC<ReportConfigModalProps> = ({
  visible,
  onClose,
  searchQuery,
  setSearchQuery,
  allCategories,
  onToggleLivingCost,
  colors,
  bottomInset,
  width,
}) => {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Configure Living Costs" isFullScreen>
      <View style={common.flex1}>
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search categories..."
            size="medium"
          />
        </View>

        <FlatList
          data={allCategories.filter((c: any) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()),
          )}
          keyExtractor={(item) => item.id}
          numColumns={3}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.configGridItem,
                {
                  width: (width - 40) / 3,
                  backgroundColor: colors.card,
                  borderColor: item.is_living_cost === 1 ? colors.primary : colors.border,
                  borderWidth: item.is_living_cost === 1 ? 2 : 1,
                },
              ]}
              onPress={() => onToggleLivingCost(item.id, !!item.is_living_cost)}
            >
              <View
                style={[
                  styles.gridIconBox,
                  {
                    backgroundColor:
                      (item.is_living_cost === 1 ? colors.primary : colors.textSecondary) + '20',
                  },
                ]}
              >
                <Icon
                  name={(item.app_icon || 'receipt') as any}
                  size={24}
                  color={item.is_living_cost === 1 ? colors.primary : colors.textSecondary}
                />
              </View>
              <Text style={[styles.gridConfigName, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              {item.is_living_cost === 1 && (
                <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                  <Icon name="check" size={12} color="white" />
                </View>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={{ padding: 12, paddingBottom: bottomInset + 40 }}
          columnWrapperStyle={{ justifyContent: 'flex-start', gap: 8 }}
        />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  configGridItem: {
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  gridIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridConfigName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
});
