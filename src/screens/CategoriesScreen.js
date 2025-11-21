// src/screens/CategoriesScreen.js

import { View } from 'react-native';
import React, { useRef, useState, useMemo } from 'react';

import AppBar from '../components/app/AppBar';
import FABButton from '../components/app/FABButton';
import NoDataCard from '../components/app/NoDataCard';
import PageHeader from '../components/app/PageHeader';
import ListCard from '../components/app/ListCard';
import ScrollToTopWrapper from '../components/app/ScrollToTopWrapper';
import SwipeableListItem from '../components/core/SwipeableListItem';
import Text from '../components/core/Text';
import ViewModeToggle from '../components/app/ViewModeToggle';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import BottomSheetModal from '../components/app/BottomSheetModal';
import CategoryForm from '../components/forms/CategoryForm';
import { useNavigation } from '@react-navigation/native';
import Button from '../components/core/Button';
import { FlashList } from '@shopify/flash-list';
import { useScrollToTopSection } from '../hooks/useScrollToTopSection';
import { useCategories } from '../hooks/useCategories';

const CategoriesScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { listRef, toTop, handleScroll, animatedStyle } = useScrollToTopSection();

  const { categories, loading, reSync, insertCategory, updateCategory, deleteCategory } =
    useCategories(user.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');

  const [modalVisible, setModalVisible] = useState(false);
  const [editCategory, setEditCategory] = useState(null);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);

  const swipeRefs = useRef({});

  /** FILTERED CATEGORY LIST */
  const filteredCategories = useMemo(() => {
    return categories.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [categories, searchQuery]);

  /** EMPTY-STATE LOGIC */
  const isSearchActive = searchQuery.trim().length > 0;
  const isEmpty = filteredCategories.length === 0;

  /** DELETE */
  const handleDelete = async (id) => {
    await deleteCategory(id);
  };

  const closeDeleteModal = () => {
    setDeleteItem(null);
    setDeleteModal(false);
  };

  /** ADD / EDIT */
  const handleAddEdit = async ({ name, type }) => {
    setModalVisible(false);

    if (editCategory) {
      await updateCategory(editCategory, name, type);
    } else {
      await insertCategory(name, type, null, null);
    }

    setEditCategory(null);
  };

  /** RENDER CATEGORY ITEM */
  const renderItem = ({ item, index }) => (
    <View style={{ marginHorizontal: viewMode === 'grid' ? 4 : 0 }}>
      <SwipeableListItem
        ref={(ref) => (swipeRefs.current[item.id] = ref)}
        rightActions={[
          {
            label: 'Edit',
            buttonType: 'iconButton',
            iconName: 'database-edit',
            type: 'primary',
            color: theme.colors.income,
            onPress: () => {
              requestAnimationFrame(() => swipeRefs.current[item.id]?.close?.());
              setEditCategory(item);
              setModalVisible(true);
            },
          },
          {
            label: 'Delete',
            buttonType: 'iconButton',
            iconName: 'delete',
            type: 'danger',
            color: theme.colors.error,
            onPress: () => {
              requestAnimationFrame(() => swipeRefs.current[item.id]?.close?.());
              setDeleteItem(item);
              setDeleteModal(true);
            },
          },
        ]}
      >
        <ListCard
          key={index}
          title={item.name}
          description={item.type}
          icon={item.app_icon}
          onPress={() =>
            navigation.navigate('Transactions', {
              filter: { categoryId: item.id },
            })
          }
          compact={viewMode === 'grid'}
        />
      </SwipeableListItem>
    </View>
  );

  /** FOOTER */
  const renderFooter = () => (
    <View style={{ paddingVertical: 16 }}>
      <Text variant="caption" style={{ textAlign: 'center', opacity: 0.6 }}>
        Total Categories: {filteredCategories.length}
      </Text>
    </View>
  );

  return (
    <>
      <AppBar
        title={null}
        showSearch
        onSearch={setSearchQuery}
        searchValue={searchQuery}
        onSearchClear={() => setSearchQuery('')}
        loading={loading}
        icons={[{ name: 'sync', onPress: reSync }]}
      />

      <PageHeader title="Categories">
        <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
      </PageHeader>

      {/* ⭐ PROPER EMPTY STATE HANDLING */}
      {!loading && isEmpty && (
        <NoDataCard
          title={isSearchActive ? 'No matching categories' : 'No categories found'}
          icon="text-search"
          actionLabel={isSearchActive ? 'Clear Search' : 'Add Category'}
          onActionPress={() => {
            if (isSearchActive) setSearchQuery('');
            else setModalVisible(true);
          }}
        />
      )}

      {/* LIST */}
      <FlashList
        data={filteredCategories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => renderItem({ item, index })}
        numColumns={viewMode === 'grid' ? 2 : 1}
        ListFooterComponent={!loading ? renderFooter : null}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={80}
        removeClippedSubviews
        overrideItemLayout={(layout) => {
          layout.size = viewMode === 'grid' ? 140 : 80;
        }}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingTop: 2,
        }}
        ref={listRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      <FABButton onPress={() => setModalVisible(true)} hidden={loading} />

      {/* ADD / EDIT MODAL */}
      <BottomSheetModal
        key="edit-add-sheet"
        visible={modalVisible}
        closeModal={() => {
          setModalVisible(false);
          setEditCategory(null);
        }}
        title={editCategory ? 'Edit Category' : 'New Category'}
      >
        <CategoryForm
          onSubmit={handleAddEdit}
          initialData={editCategory}
          onClose={() => {
            setModalVisible(false);
            setEditCategory(null);
          }}
        />
      </BottomSheetModal>

      {/* DELETE MODAL */}
      <BottomSheetModal
        key="delete-sheet"
        visible={!!deleteItem && deleteModal}
        closeModal={closeDeleteModal}
      >
        <Text
          style={{ marginTop: 5, marginBottom: 25, textAlign: 'center' }}
          variant="headingMedium"
        >
          {`Delete Category ${deleteItem?.name}?`}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <Button title="Cancel" onPress={closeDeleteModal} type="warning" />
          <Button
            title="Delete"
            type="danger"
            onPress={async () => {
              await handleDelete(deleteItem.id);
              setDeleteItem(null);
              setDeleteModal(false);
            }}
          />
        </View>
      </BottomSheetModal>

      <ScrollToTopWrapper animatedStyle={animatedStyle} onPress={toTop} />
    </>
  );
};

export default CategoriesScreen;
