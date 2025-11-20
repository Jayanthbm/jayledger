// src/screens/CategoriesScreen.js

import { View, LayoutAnimation } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  deleteCategoryFromSupabase,
  pushUnsyncedCategories,
  syncCategories,
} from '../database/categories/categorySync';

import AppBar from '../components/app/AppBar';
import { CategoryModel } from '../database/categories/categoryModel';
import FABButton from '../components/app/FABButton';
import IconButton from '../components/core/IconButton';
import NetInfo from '@react-native-community/netinfo';
import NoDataCard from '../components/app/NoDataCard';
import PageHeader from '../components/app/PageHeader';
import ListCard from '../components/app/ListCard';
import SearchBar from '../components/app/SearchBar';
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

const CategoriesScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { listRef, toTop, handleScroll, animatedStyle } = useScrollToTopSection();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');

  const [modalVisible, setModalVisible] = useState(false);
  const [editCategory, setEditCategory] = useState(null);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const swipeRefs = useRef({});

  const loadCategories = async () => {
    const data = await CategoryModel.getAll(user.id);
    setData(data);
    setLoading(false);
    return data;
  };

  const reSyncCategories = async () => {
    setLoading(true);
    await pushUnsyncedCategories(user.id);
    await syncCategories(user.id);
    await loadCategories();
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const data = await loadCategories();
      if (!data.length) {
        await reSyncCategories();
      }
      setLoaded(true);
    })();
  }, [user]);

  const handleDelete = async (id) => {
    try {
      const isOnline = (await NetInfo.fetch()).isConnected;

      // Always delete locally first
      CategoryModel.delete(id);

      // Delete remotely if online
      if (isOnline) {
        const success = await deleteCategoryFromSupabase(id, user.id);
        if (!success) {
          console.warn('⚠️ Category deleted locally but not from Supabase');
        }
      } else {
        console.log('📴 Offline — skipped Supabase delete');
      }

      delete swipeRefs.current[id];
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      await loadCategories();
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (error) {
      console.error('❌ Delete error:', error);
    }
  };

  const closeDeleteModal = () => {
    setDeleteItem(null);
    setDeleteModal(false);
  };
  const handleAddEdit = async ({ name, type }) => {
    setModalVisible(false);
    const isOnline = (await NetInfo.fetch()).isConnected;

    if (editCategory) {
      CategoryModel.update(
        editCategory.id,
        name,
        type,
        editCategory.icon,
        editCategory.app_icon,
        false,
      );
      if (isOnline) {
        await pushUnsyncedCategories(user.id);
      }
    } else {
      CategoryModel.insert(user.id, name, type, null, null, false);
      if (isOnline) {
        await pushUnsyncedCategories(user.id);
      }
    }

    await loadCategories();
    setEditCategory(null);
  };

  const filteredCategories = data.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const renderItem = ({ item, index }) => {
    return (
      <View
        style={{
          marginHorizontal: viewMode === 'grid' ? 2 : 0,
        }}
      >
        <SwipeableListItem
          ref={(ref) => {
            swipeRefs.current[item.id] = ref;
          }}
          rightActions={[
            {
              label: 'Edit',
              buttonType: 'iconButton',
              iconName: 'database-edit',
              type: 'primary',
              color: theme.colors.income,
              onPress: () => {
                if (swipeRefs.current[item.id]) {
                  requestAnimationFrame(() => {
                    swipeRefs.current[item.id]?.close?.();
                  });
                }
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
                if (swipeRefs.current[item.id]) {
                  requestAnimationFrame(() => {
                    swipeRefs.current[item.id]?.close?.();
                  });
                }
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
            onPress={() => {
              navigation.navigate('Transactions', {
                filter: {
                  categoryId: item.id,
                },
              });
            }}
            compact={viewMode === 'grid'}
          />
        </SwipeableListItem>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loaded) return null;

    return (
      <View style={{ paddingVertical: 16 }}>
        <Text variant="caption" style={{ textAlign: 'center', opacity: 0.6 }}>
          Total Categories: {filteredCategories.length}
        </Text>
      </View>
    );
  };

  return (
    <>
      <AppBar
        title={null}
        showSearch={true}
        onSearch={setSearchQuery}
        searchValue={searchQuery}
        onSearchClear={() => setSearchQuery('')}
        loading={loading}
        icons={[
          {
            name: 'sync',
            onPress: reSyncCategories,
        }
        ]}
      />
      <PageHeader title="Categories">
        <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
      </PageHeader>
      {loaded && filteredCategories.length === 0 && (
        <NoDataCard
          title="No category found"
          icon="text-search"
          actionLabel="Clear Search"
          onActionPress={() => setSearchQuery('')}
        />
      )}

      <FlashList
        data={filteredCategories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => renderItem({ item, index })}
        numColumns={viewMode === 'grid' ? 2 : 1}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={80}
        removeClippedSubviews
        overrideItemLayout={(layout, item, index) => {
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

      <BottomSheetModal
        key={'edit-add-sheet'}
        visible={modalVisible}
        closeModal={() => {
          setModalVisible(false);
          setEditCategory(null);
        }}
        title={editCategory === null ? 'New Category' : 'Edit Category'}
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
      <BottomSheetModal
        key={'delete-sheet'}
        visible={!!(deleteItem && deleteModal)}
        closeModal={closeDeleteModal}
      >
        <Text
          style={{
            marginTop: 5,
            marginBottom: 25,
            textAlign: 'center',
          }}
          variant="headingMedium"
        >
          {`Delete Category ${deleteItem?.name} ?`}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
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
