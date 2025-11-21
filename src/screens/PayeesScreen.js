// src/screens/PayeesScreen.js

import AppBar from '../components/app/AppBar';
import PageHeader from '../components/app/PageHeader';
import React, { useMemo, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

import SwipeableListItem from '../components/core/SwipeableListItem';
import ListCard from '../components/app/ListCard';
import Text from '../components/core/Text';
import FABButton from '../components/app/FABButton';
import BottomSheetModal from '../components/app/BottomSheetModal';
import { View } from 'react-native';
import Button from '../components/core/Button';
import ViewModeToggle from '../components/app/ViewModeToggle';
import NoDataCard from '../components/app/NoDataCard';
import PayeeForm from '../components/forms/PayeeForm';

import ScrollToTopWrapper from '../components/app/ScrollToTopWrapper';
import { useScrollToTopSection } from '../hooks/useScrollToTopSection';
import { FlashList } from '@shopify/flash-list';

import { usePayees } from '../hooks/usePayees';

const PayeesScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { theme } = useTheme();

  const { listRef, toTop, handleScroll, animatedStyle } = useScrollToTopSection();

  const { payees, loading, reSync, insertPayee, updatePayee, deletePayee } = usePayees(user.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');

  const [modalVisible, setModalVisible] = useState(false);
  const [editPayee, setEditPayee] = useState(null);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);

  const swipeRefs = useRef({});

  /** FILTERED DATA */
  const filteredPayees = useMemo(() => {
    return payees.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [payees, searchQuery]);

  /** EMPTY STATE LOGIC */
  const isSearchActive = searchQuery.trim().length > 0;
  const isEmpty = filteredPayees.length === 0;

  /** ADD / EDIT */
  const handleAddEdit = async ({ name, logo }) => {
    setModalVisible(false);

    if (editPayee) {
      await updatePayee(editPayee, name, logo);
    } else {
      await insertPayee(name, logo);
    }

    setEditPayee(null);
  };

  /** DELETE */
  const handleDelete = async (id) => {
    await deletePayee(id);
  };

  /** RENDER ITEM */
  const renderItem = ({ item, index }) => (
    <View
      style={{
        marginHorizontal: viewMode === 'grid' ? 4 : 0,
      }}
    >
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
              requestAnimationFrame(() => {
                swipeRefs.current[item.id]?.close?.();
              });
              setEditPayee(item);
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
              requestAnimationFrame(() => {
                swipeRefs.current[item.id]?.close?.();
              });
              setDeleteItem(item);
              setDeleteModal(true);
            },
          },
        ]}
      >
        <ListCard
          key={index}
          title={item.name}
          image={item.logo?.isNitroSQLiteNull ? null : item.logo}
          onPress={() =>
            navigation.navigate('Transactions', {
              filter: { payeeId: item.id },
            })
          }
          compact={viewMode === 'grid'}
        />
      </SwipeableListItem>
    </View>
  );

  return (
    <>
      <AppBar
        title={null}
        showSearch
        loading={loading}
        onSearch={setSearchQuery}
        searchValue={searchQuery}
        onSearchClear={() => setSearchQuery('')}
        icons={[{ name: 'sync', onPress: reSync }]}
      />

      <PageHeader title="Payees">
        <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
      </PageHeader>

      {/* ⭐ FIXED EMPTY-STATE (no flicker) */}
      {!loading && isEmpty && (
        <NoDataCard
          title={isSearchActive ? 'No matching payees' : 'No payees found'}
          icon="text-search"
          actionLabel={isSearchActive ? 'Clear Search' : 'Add Payee'}
          onActionPress={() => {
            if (isSearchActive) setSearchQuery('');
            else setModalVisible(true);
          }}
        />
      )}

      {/* LIST */}
      <FlashList
        data={filteredPayees}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        numColumns={viewMode === 'grid' ? 2 : 1}
        estimatedItemSize={80}
        removeClippedSubviews
        overrideItemLayout={(layout) => {
          layout.size = viewMode === 'grid' ? 140 : 80;
        }}
        ListFooterComponent={
          !loading ? (
            <View style={{ paddingVertical: 12 }}>
              <Text variant="caption" style={{ textAlign: 'center', opacity: 0.6 }}>
                Total Payees: {filteredPayees.length}
              </Text>
            </View>
          ) : null
        }
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
        visible={modalVisible}
        closeModal={() => {
          setModalVisible(false);
          setEditPayee(null);
        }}
        title={editPayee ? 'Edit Payee' : 'New Payee'}
      >
        <PayeeForm
          onSubmit={handleAddEdit}
          initialData={editPayee}
          onClose={() => {
            setModalVisible(false);
            setEditPayee(null);
          }}
        />
      </BottomSheetModal>

      {/* DELETE MODAL */}
      <BottomSheetModal
        visible={!!deleteItem && deleteModal}
        closeModal={() => {
          setDeleteModal(false);
          setDeleteItem(null);
        }}
      >
        <Text
          variant="headingMedium"
          style={{
            marginTop: 5,
            marginBottom: 25,
            textAlign: 'center',
          }}
        >
          Delete Payee {deleteItem?.name}?
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
          <Button title="Cancel" type="warning" onPress={() => setDeleteModal(false)} />
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

export default PayeesScreen;
