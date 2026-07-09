import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { TransactionGroup } from '../models/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { SearchBar } from '../components/SearchBar';
import { useToast } from '../store/ToastContext';
import { getRelativeTime } from '../utils/dateUtils';
import { BottomSheet } from '../components/BottomSheet';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { common } from '../styles/common';
import { AppNavigation } from '../navigation/navigationTypes';
import { logger } from '../utils/logger';

import {
  fetchGroupsData,
  saveGroupViewMode,
  addGroup,
  deleteGroup,
  updateGroup,
  performGroupSync,
  backgroundPushGroups,
  filterAndSortGroups,
} from '../services/groupService';
import { updateTransactionGroupPriorities } from '../db/queries';

export default function GroupsScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const user = session?.user;
  const { showToast } = useToast();
  const navigation = useNavigation<AppNavigation>();

  const [groups, setGroups] = useState<TransactionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'priority'>('priority');
  const [sortAsc, setSortAsc] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [selectedEditGroup, setSelectedEditGroup] = useState<TransactionGroup | null>(null);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const listRef = useRef<FlatList>(null);

  const handleEditPress = (group: TransactionGroup) => {
    setSelectedEditGroup(group);
    setEditModalVisible(true);
  };

  const handleEditGroupSubmit = async (name: string, description: string) => {
    if (!user?.id || !selectedEditGroup) return;
    try {
      const updatedGroup = await updateGroup(user.id, {
        ...selectedEditGroup,
        name,
        description,
      });
      setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
      showToast('Group updated successfully', 'success');
    } catch (e) {
      logger.error('Update group error:', e);
      showToast('Failed to update group', 'error');
    }
  };

  const handleDeleteGroup = async () => {
    if (!user?.id || !selectedEditGroup) return;
    try {
      await deleteGroup(user.id, selectedEditGroup.id);
      setGroups((prev) => prev.filter((g) => g.id !== selectedEditGroup.id));
      showToast('Group deleted successfully', 'success');
    } catch (e) {
      logger.error('Delete group error:', e);
      showToast('Failed to delete group', 'error');
    }
  };

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const {
        groups: fetchedGroups,
        viewMode: savedMode,
        lastSynced: synced,
      } = await fetchGroupsData(user.id);
      setGroups(fetchedGroups);
      setViewMode(savedMode);
      setLastSynced(synced);
    } catch (err) {
      logger.error('[Groups] loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const toggleViewMode = async () => {
    const newMode = viewMode === 'list' ? 'grid' : 'list';
    setViewMode(newMode);
    if (user?.id) {
      await saveGroupViewMode(user.id, newMode);
    }
  };

  const toggleReorderMode = () => {
    if (isReordering && user?.id) {
      backgroundPushGroups(user.id);
    }
    setIsReordering(!isReordering);
    if (!isReordering) setViewMode('list');
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const newData = [...filteredData];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newData.length) return;

    [newData[index], newData[targetIndex]] = [newData[targetIndex], newData[index]];

    const updatedItems = newData.map((item, i) => ({ ...item, priority: i + 1 }));
    const updates = updatedItems.map((item) => ({ id: item.id, priority: item.priority }));

    setGroups((prev) => {
      const remaining = prev.filter((p) => !updatedItems.find((n) => n.id === p.id));
      const merged = [...remaining, ...updatedItems];
      return merged.sort((a, b) => (a.priority || 0) - (b.priority || 0));
    });

    try {
      if (user?.id) {
        await updateTransactionGroupPriorities(updates, user.id);
      }
    } catch (error) {
      logger.error('Reorder Error:', error);
      loadData();
    }
  };

  const handleManualSync = useCallback(async () => {
    if (!user?.id) return;
    setSyncing(true);
    try {
      const { groups: updatedGroups, lastSynced: synced } = await performGroupSync(user.id);
      setGroups(updatedGroups);
      setLastSynced(synced);
      showToast('Groups synced successfully', 'success');
    } catch (e) {
      logger.error('Sync error:', e);
    } finally {
      setSyncing(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={scrollToTop}
          style={common.headerTitleContainer}
        >
          <Text style={[common.navHeaderTitle, { color: colors.text }]}>Groups</Text>
          {lastSynced && (
            <Text style={[common.navHeaderSubtitle, { color: colors.textSecondary }]}>
              Synced: {getRelativeTime(lastSynced)}
            </Text>
          )}
        </TouchableOpacity>
      ),
      headerTitleAlign: 'left',
      headerRight: () => (
        <TouchableOpacity
          style={common.headerRightBtn}
          onPress={handleManualSync}
          disabled={syncing}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          {syncing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <MaterialIcons name="refresh" size={24} color={colors.text} />
          )}
        </TouchableOpacity>
      ),
    });
  }, [
    navigation,
    handleManualSync,
    syncing,
    colors.text,
    colors.textSecondary,
    colors.primary,
    scrollToTop,
    lastSynced,
  ]);

  const handleAddGroupSubmit = async (name: string, description: string) => {
    if (!user?.id) return;
    const newGroup = await addGroup(user.id, name, description);
    setGroups((prev) => [...prev, newGroup]);
    showToast('Group added successfully', 'success');
  };

  const filteredData = filterAndSortGroups(groups, searchQuery, sortBy, sortAsc, isReordering);

  if (loading) {
    return (
      <View style={[common.flexCenter, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[common.flex1, { backgroundColor: colors.background }]}>
      <View style={common.headerTools}>
        <View style={common.headerControls}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search groups..."
            size="medium"
            containerStyle={common.flex1}
          />
          <View style={common.actionRow}>
            {!isReordering && (
              <TouchableOpacity
                style={[
                  common.sortButton,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => setShowSortModal(true)}
              >
                <View style={common.flexRowCenterGap4}>
                  <MaterialIcons name="sort" size={18} color={colors.primary} />
                  <MaterialIcons
                    name={sortAsc ? 'arrow-upward' : 'arrow-downward'}
                    size={14}
                    color={colors.primary}
                  />
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                common.sortButton,
                { backgroundColor: colors.card, borderColor: colors.border },
                searchQuery.length > 0 && styles.disabledOpacity,
              ]}
              onPress={searchQuery.length > 0 ? undefined : toggleReorderMode}
              disabled={searchQuery.length > 0}
            >
              <View style={common.flexRowCenterGap4}>
                <MaterialIcons
                  name={isReordering ? 'check' : 'reorder'}
                  size={18}
                  color={colors.primary}
                />
              </View>
            </TouchableOpacity>
            {!isReordering && (
              <TouchableOpacity
                style={[
                  common.iconButton44,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={toggleViewMode}
              >
                <MaterialIcons
                  name={viewMode === 'list' ? 'grid-view' : 'view-list'}
                  size={22}
                  color={colors.text}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={common.captionRow}>
          <Text style={[common.sortCaption, { color: colors.textSecondary }]}>
            Sorted by {sortBy === 'priority' ? 'Priority' : 'Name'}
          </Text>
        </View>
      </View>

      {searchQuery.length > 0 && filteredData.length === 0 && (
        <View style={common.ph16}>
          <View
            style={[
              common.noResultsSearchContainer,
              { borderColor: colors.border, backgroundColor: colors.card + '50' },
            ]}
          >
            <Text style={[common.noResultsSearchText, { color: colors.textSecondary }]}>
              No groups found matching &quot;{searchQuery}&quot;
            </Text>
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={[common.clearSearchButton, { backgroundColor: colors.primary + '15' }]}
            >
              <Text style={[common.clearSearchText, { color: colors.primary }]}>Clear Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {filteredData.length === 0 ? (
        <View style={common.emptyCenterPadded}>
          <MaterialIcons name="folder" size={64} color={colors.border} />
          <Text style={[common.emptyTitle20Bold, { color: colors.textSecondary }]}>
            {searchQuery ? 'No Groups Found' : 'No Transaction Groups'}
          </Text>
          <Text style={[common.emptySub14Centered, { color: colors.textSecondary }]}>
            {searchQuery ? `Nothing matches "${searchQuery}".` : 'Add your first group!'}
          </Text>
          {searchQuery && (
            <TouchableOpacity
              style={[common.clearOutlineButton, { borderColor: colors.border }]}
              onPress={() => setSearchQuery('')}
            >
              <Text style={[common.textBold600, { color: colors.primary }]}>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          ref={listRef}
          key={`${viewMode}-${isReordering}`}
          data={filteredData}
          numColumns={viewMode === 'grid' && !isReordering ? 2 : 1}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            if (isReordering) {
              return (
                <View style={[styles.reorderRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.reorderContent}>
                    <GroupCard item={item} viewMode="list" colors={colors} onPress={() => {}} />
                  </View>
                  <View style={styles.reorderArrows}>
                    <TouchableOpacity
                      onPress={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      style={index === 0 ? styles.arrowBtnDisabled : styles.arrowBtn}
                    >
                      <MaterialIcons name="expand-less" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveItem(index, 'down')}
                      disabled={index === filteredData.length - 1}
                      style={
                        index === filteredData.length - 1
                          ? styles.arrowBtnDisabled
                          : styles.arrowBtn
                      }
                    >
                      <MaterialIcons name="expand-more" size={24} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }
            return (
              <GroupCard
                item={item}
                viewMode={viewMode}
                colors={colors}
                onPress={(grp) => handleEditPress(grp)}
              />
            );
          }}
          contentContainerStyle={common.listContent16T4B120}
          columnWrapperStyle={viewMode === 'grid' && !isReordering ? styles.gridWrapper : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}

      {!isReordering && (
        <FloatingActionButton
          onPress={() => setAddModalVisible(true)}
          iconName="add"
          backgroundColor={colors.primary}
        />
      )}

      <GroupAddModal
        visible={isAddModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={handleAddGroupSubmit}
        colors={colors}
      />

      <GroupSortModal
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        sortBy={sortBy}
        sortAsc={sortAsc}
        onSortChange={(mode, asc) => {
          setSortBy(mode);
          setSortAsc(asc);
        }}
        colors={colors}
      />

      <GroupEditModal
        visible={isEditModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedEditGroup(null);
        }}
        onSave={handleEditGroupSubmit}
        onDelete={handleDeleteGroup}
        group={selectedEditGroup}
        colors={colors}
      />
    </View>
  );
}

// Sub-component: Group Card
interface GroupCardProps {
  item: TransactionGroup;
  viewMode: 'list' | 'grid';
  colors: Record<string, string>;
  onPress: (item: TransactionGroup) => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ item, viewMode, colors, onPress }) => {
  const isGrid = viewMode === 'grid';

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
          { backgroundColor: colors.primary + '15' },
          isGrid && styles.iconBoxGrid,
        ]}
      >
        <MaterialIcons name="folder" size={24} color={colors.primary} />
      </View>
      <View style={!isGrid && styles.listTextContainer}>
        <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.description ? (
          <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

// Sub-component: Group Add Modal
interface GroupAddModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, description: string) => Promise<void>;
  colors: Record<string, string>;
}

const GroupAddModal: React.FC<GroupAddModalProps> = ({ visible, onClose, onAdd, colors }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    Keyboard.dismiss();
    setIsSaving(true);
    try {
      await onAdd(name, description);
      setName('');
      setDescription('');
      onClose();
    } catch (error) {
      logger.error('Add group error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="New Group">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={[common.inputLabel, { color: colors.textSecondary }]}>Group Name</Text>
        <TextInput
          style={[
            common.inputField50,
            { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
          ]}
          placeholder="e.g. Europe Trip 2026"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
        />

        <Text style={[common.inputLabel, common.mt16, { color: colors.textSecondary }]}>
          Description (Optional)
        </Text>
        <TextInput
          style={[
            common.inputField50,
            { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
          ]}
          placeholder="Describe the purpose of this group"
          placeholderTextColor={colors.textSecondary}
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity
          style={[
            common.saveButton54R12Mt32,
            { backgroundColor: colors.primary },
            (!name.trim() || isSaving) && common.disabledButton,
          ]}
          onPress={handleSave}
          disabled={!name.trim() || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={common.saveButtonText}>Save Group</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
};

// Sub-component: Group Sort Modal
interface GroupSortModalProps {
  visible: boolean;
  onClose: () => void;
  sortBy: 'name' | 'priority';
  sortAsc: boolean;
  onSortChange: (mode: 'name' | 'priority', asc: boolean) => void;
  colors: Record<string, string>;
}

const GroupSortModal: React.FC<GroupSortModalProps> = ({
  visible,
  onClose,
  sortBy,
  sortAsc,
  onSortChange,
  colors,
}) => {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Sort Groups">
      <View style={styles.sortOptions}>
        <TouchableOpacity
          style={[
            styles.sortOptionRow,
            { borderBottomColor: colors.border },
            sortBy === 'priority' && { backgroundColor: colors.primary + '10' },
          ]}
          onPress={() => {
            onSortChange('priority', sortBy === 'priority' ? !sortAsc : true);
            onClose();
          }}
        >
          <Text style={[styles.sortText, { color: colors.text }]}>Priority Order</Text>
          {sortBy === 'priority' && (
            <MaterialIcons
              name={sortAsc ? 'arrow-upward' : 'arrow-downward'}
              size={18}
              color={colors.primary}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortOptionRow,
            { borderBottomColor: colors.border },
            sortBy === 'name' && { backgroundColor: colors.primary + '10' },
          ]}
          onPress={() => {
            onSortChange('name', sortBy === 'name' ? !sortAsc : true);
            onClose();
          }}
        >
          <Text style={[styles.sortText, { color: colors.text }]}>Name Order</Text>
          {sortBy === 'name' && (
            <MaterialIcons
              name={sortAsc ? 'arrow-upward' : 'arrow-downward'}
              size={18}
              color={colors.primary}
            />
          )}
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

// Sub-component: Group Edit Modal
interface GroupEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
  onDelete: () => Promise<void>;
  group: TransactionGroup | null;
  colors: Record<string, string>;
}

const GroupEditModal: React.FC<GroupEditModalProps> = ({
  visible,
  onClose,
  onSave,
  onDelete,
  group,
  colors,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (group) {
      const timer = setTimeout(() => {
        setName(group.name);
        setDescription(group.description || '');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [group]);

  const handleSave = async () => {
    if (!name.trim()) return;
    Keyboard.dismiss();
    setIsSaving(true);
    try {
      await onSave(name, description);
      onClose();
    } catch (error) {
      logger.error('Edit group error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    Keyboard.dismiss();
    setIsDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (error) {
      logger.error('Delete group error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Edit Group">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={[common.inputLabel, { color: colors.textSecondary }]}>Group Name</Text>
        <TextInput
          style={[
            common.inputField50,
            { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
          ]}
          placeholder="e.g. Europe Trip 2026"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
        />

        <Text style={[common.inputLabel, common.mt16, { color: colors.textSecondary }]}>
          Description (Optional)
        </Text>
        <TextInput
          style={[
            common.inputField50,
            { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
          ]}
          placeholder="Describe the purpose of this group"
          placeholderTextColor={colors.textSecondary}
          value={description}
          onChangeText={setDescription}
        />

        <View style={styles.modalButtonsRow}>
          <TouchableOpacity
            style={[
              styles.deleteButton,
              { borderColor: colors.danger },
              isDeleting && common.disabledButton,
            ]}
            onPress={handleDelete}
            disabled={isDeleting || isSaving}
          >
            {isDeleting ? (
              <ActivityIndicator color={colors.danger} />
            ) : (
              <Text style={[styles.deleteButtonText, { color: colors.danger }]}>Delete</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: colors.primary },
              (!name.trim() || isSaving) && common.disabledButton,
            ]}
            onPress={handleSave}
            disabled={!name.trim() || isSaving || isDeleting}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={common.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  disabledOpacity: { opacity: 0.5 },
  reorderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    marginHorizontal: 16,
  },
  reorderContent: { flex: 1 },
  reorderArrows: { flexDirection: 'row', alignItems: 'center' },
  arrowBtn: { padding: 4 },
  arrowBtnDisabled: { padding: 4, opacity: 0.3 },
  gridWrapper: { justifyContent: 'space-between', gap: 12 },

  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    flex: 1,
  },
  itemCardGrid: {
    width: '48%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconBoxGrid: { marginBottom: 10 },
  listTextContainer: { flex: 1, marginLeft: 14 },
  itemName: { fontSize: 14, fontWeight: '700' },
  itemDesc: { fontSize: 12, marginTop: 2 },

  sortOptions: { paddingVertical: 10 },
  sortOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sortText: { fontSize: 15, fontWeight: '500' },

  modalButtonsRow: {
    flexDirection: 'row',
    marginTop: 32,
    gap: 12,
  },
  deleteButton: {
    flex: 1,
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    flex: 2,
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
