// src/screens/PayeesScreen.js

import AppBar from '../components/app/AppBar';
import PageHeader from '../components/app/PageHeader';
import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { PayeeModel } from '../database/payees/payeeModal';
import {
  deletePayeeFromSupabase,
  pushUnsyncedPayees,
  syncPayees,
} from '../database/payees/payeeSync';
import SwipeableListItem from '../components/core/SwipeableListItem';
import ListCard from '../components/app/ListCard';
import Text from '../components/core/Text';
import SearchBar from '../components/app/SearchBar';
import IconButton from '../components/core/IconButton';
import FABButton from '../components/app/FABButton';
import BottomSheetModal from '../components/app/BottomSheetModal';
import { View, LayoutAnimation } from 'react-native';
import Button from '../components/core/Button';
import ViewModeToggle from '../components/app/ViewModeToggle';
import NoDataCard from '../components/app/NoDataCard';
import NetInfo from '@react-native-community/netinfo';
import PayeeForm from '../components/forms/PayeeForm';
import ScrollToTopWrapper from '../components/app/ScrollToTopWrapper';
import { useScrollToTopSection } from '../hooks/useScrollToTopSection';
import { FlashList } from '@shopify/flash-list';

const PayeesScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { listRef, toTop, handleScroll, animatedStyle } = useScrollToTopSection();
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');

  const [modalVisible, setModalVisible] = useState(false);
  const [editPayee, setEditPayee] = useState(null);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const swipeRefs = useRef({});

  const loadPayees = async () => {
    const data = await PayeeModel.getAll(user.id);
    setData(data);
    setLoading(false);
    return data;
  };

  const reSyncPayees = async () => {
    setLoading(true);
    await pushUnsyncedPayees(user.id);
    await syncPayees(user.id);
    await loadPayees();
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const data = await loadPayees();
      if (!data.length) {
        await reSyncPayees();
      }
      setLoaded(true);
    })();
  }, [user]);

  const handleDelete = async (id) => {
    try {
      const isOnline = (await NetInfo.fetch()).isConnected;

      // Always delete locally first
      PayeeModel.delete(id);

      // Delete remotely if online
      if (isOnline) {
        const success = await deletePayeeFromSupabase(id, user.id);
        if (!success) {
          console.warn('⚠️ Category deleted locally but not from Supabase');
        }
      } else {
        console.log('📴 Offline — skipped Supabase delete');
      }

      delete swipeRefs.current[id];
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      await loadPayees();
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (error) {
      console.error('❌ Delete error:', error);
    }
  };

  const closeDeleteModal = () => {
    setDeleteItem(null);
    setDeleteModal(false);
  };

  const handleAddEdit = async ({ name, logo }) => {
    setModalVisible(false);
    const isOnline = (await NetInfo.fetch()).isConnected;

    if (editPayee) {
      PayeeModel.update(editPayee.id, name, logo, false);
      if (isOnline) {
        await pushUnsyncedPayees(user.id);
      }
    } else {
      PayeeModel.insert(user.id, name, logo, false);
      if (isOnline) {
        await pushUnsyncedPayees(user.id);
      }
    }

    await loadPayees();
    setEditPayee(null);
  };

  const filteredData = data.filter((item) => {
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
          key={index}
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
            image={item.logo.isNitroSQLiteNull ? null : item.logo}
            onPress={() => {
              navigation.navigate('Transactions', {
                filter: {
                  payeeId: item.id,
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
    return (
      <>
        {loaded ? (
          <Text
            variant="caption"
            style={{
              textAlign: 'center',
              marginTop: 10,
            }}
          >
            Total Payees: &nbsp;{filteredData?.length}
          </Text>
        ) : null}
      </>
    );
  };
  return (
    <>
      <AppBar
        centerContent={
          <SearchBar
            placeholder="Search Payees"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery('')}
            disabled={!loaded || loading}
          />
        }
        rightContent={
          <IconButton
            iconName="sync"
            mode="filled"
            size={25}
            type="primary"
            onPress={reSyncPayees}
            disabled={!loaded || loading}
          />
        }
        loading={loading}
      />
      <PageHeader title="Payees">
        <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
      </PageHeader>
      {loaded && filteredData.length === 0 && (
        <NoDataCard
          title="No payees found"
          icon="text-search"
          actionLabel="Clear Search"
          onActionPress={() => setSearchQuery('')}
        />
      )}
      <FlashList
        data={filteredData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={(item, index) => renderItem(item, index, viewMode)}
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
        key={'edit-add-payee-sheet'}
        visible={modalVisible}
        closeModal={() => {
          setModalVisible(false);
          setEditPayee(null);
        }}
        title={editPayee === null ? 'New Payee' : 'Edit Payee'}
      >
        <PayeeForm
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setEditPayee(null);
          }}
          onSubmit={handleAddEdit}
          initialData={editPayee}
        />
      </BottomSheetModal>

      <BottomSheetModal
        key={'delete-payee-sheet'}
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
          {`Delete Payee ${deleteItem?.name} ?`}
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

export default PayeesScreen;
