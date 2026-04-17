import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';

interface ReportEmptyStateProps {
  searchQuery: string;
  reportType: string;
  colors: any;
  onClearFilters: () => void;
  onOpenConfig: () => void;
}

export const ReportEmptyState: React.FC<ReportEmptyStateProps> = ({
  searchQuery,
  reportType,
  colors,
  onClearFilters,
  onOpenConfig,
}) => {
  return (
    <View style={styles.emptyContainer}>
      <Icon name="search-off" size={64} color={colors.border} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {searchQuery.trim() ? 'No matching results found' : 'No data found for this period'}
      </Text>
      {searchQuery.trim() ? (
        <TouchableOpacity
          style={[
            styles.clearFilterButton,
            { backgroundColor: colors.primary + '15', borderColor: colors.primary },
          ]}
          onPress={onClearFilters}
        >
          <Icon name="close" size={18} color={colors.primary} />
          <Text style={[styles.clearFilterText, { color: colors.primary }]}>Clear Filters</Text>
        </TouchableOpacity>
      ) : (
        reportType === 'monthlyLivingCosts' && (
          <TouchableOpacity
            style={[styles.configPrompt, { backgroundColor: colors.primary }]}
            onPress={onOpenConfig}
          >
            <Text style={styles.configPromptText}>Select Living Cost Categories</Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: { alignItems: 'center', marginTop: 5 },
  emptyText: { marginTop: 5, fontSize: 16, textAlign: 'center' },
  clearFilterButton: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: '700',
  },
  configPrompt: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  configPromptText: {
    color: 'white',
    fontWeight: '700',
  },
});
