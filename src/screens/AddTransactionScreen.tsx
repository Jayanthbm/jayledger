import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  DeviceEventEmitter,
  Linking,
} from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import * as Location from 'expo-location';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/navigationTypes';
import Icon from '@expo/vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { getCategories, getPayees, insertOrUpdateTransaction } from '../db/queries';
import { BottomSheet } from '../components/BottomSheet';
import { SegmentedControl } from '../components/SegmentedControl';
import { Category, Payee, Transaction } from '../models/types';
import { generateUUID } from '../utils/commonUtils';
import { syncTransactions } from '../services/syncService';
import { common } from '../styles/common';
import { validateTransaction } from '../utils/validators';
import { useTransactionDateTime } from '../hooks/useTransactionDateTime';
import { TransactionFormFields } from '../components/transactions/TransactionFormFields';
import { TransactionSelectorRow } from '../components/transactions/TransactionSelectorRow';
import { ItemSelectorModal } from '../components/transactions/ItemSelectorModal';
import { TransactionLocationEditRow } from '../components/transactions/TransactionLocationEditRow';
import { LocationEditSheet } from '../components/transactions/LocationEditSheet';
import { logger } from '../utils/logger';

export default function AddTransactionScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddTransaction'>>();
  const editTx = route.params?.transaction;
  const { showToast } = useToast();

  const [amount, setAmount] = useState(editTx ? editTx.amount.toString() : '');
  const [description, setDescription] = useState(editTx ? editTx.description || '' : '');
  const [type, setType] = useState<'Expense' | 'Income'>(
    editTx ? (editTx.type as 'Expense' | 'Income') : 'Expense',
  );
  const [productLink, setProductLink] = useState(editTx ? editTx.product_link || '' : '');
  const [includeLocation, setIncludeLocation] = useState(!editTx);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(
    editTx?.latitude && editTx?.longitude
      ? { latitude: editTx.latitude, longitude: editTx.longitude }
      : null,
  );
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [locationSource, setLocationSource] = useState<'Current' | 'Last Known' | null>(
    editTx?.latitude && editTx?.longitude ? 'Last Known' : null,
  );
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const {
    date,
    showDatePicker,
    setShowDatePicker,
    handleDateChange,
    showTimePicker,
    setShowTimePicker,
    handleTimeChange,
  } = useTransactionDateTime(editTx ? new Date(editTx.transaction_timestamp) : new Date());

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedPayee, setSelectedPayee] = useState<Payee | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [showModal, setShowModal] = useState<'Category' | 'Payee' | null>(null);
  const [modalSearch, setModalSearch] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Reset search when modal opens/closes
    if (!showModal) {
      const timer = setTimeout(() => {
        setModalSearch('');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [showModal]);

  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.id) return;
      const [cats, p] = await Promise.all([
        getCategories(session.user.id),
        getPayees(session.user.id),
      ]);
      setCategories(cats);
      setPayees(p);

      const quickTx = route.params?.quickTransaction;

      if (editTx) {
        const cat = cats.find((c) => c.id === editTx.category_id);
        if (cat) setSelectedCategory(cat);

        if (editTx.payee_id) {
          const payee = p.find((pay) => pay.id === editTx.payee_id);
          if (payee) setSelectedPayee(payee);
        }
      } else if (quickTx) {
        setType(quickTx.type as 'Expense' | 'Income');
        if (quickTx.amount) setAmount(quickTx.amount.toString());
        if (quickTx.description) setDescription(quickTx.description);

        if (quickTx.category_id) {
          const cat = cats.find((c) => c.id === quickTx.category_id);
          if (cat) setSelectedCategory(cat);
        }
        if (quickTx.payee_id) {
          const payee = p.find((pay) => pay.id === quickTx.payee_id);
          if (payee) setSelectedPayee(payee);
        }
      } else {
        const genCat = cats.find((c) => c.name.toLowerCase() === 'general');
        if (genCat) setSelectedCategory(genCat);
      }
    };
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [session, editTx, route.params]);

  useEffect(() => {
    // Apply default categories when type changes (only for new transactions and non-quick-tx)
    if (!editTx && !route.params?.quickTransaction && categories.length > 0) {
      const timer = setTimeout(() => {
        if (type === 'Income') {
          const salCat = categories.find((c) => c.name.toLowerCase() === 'salary');
          if (salCat) setSelectedCategory(salCat);
        } else {
          const genCat = categories.find((c) => c.name.toLowerCase() === 'general');
          if (genCat) setSelectedCategory(genCat);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [type, editTx, categories, route.params]);

  const fetchLocation = useCallback(async () => {
    setFetchingLocation(true);
    let lastKnownUsed = false;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permission to access location was denied', 'error');
        setIncludeLocation(false);
        return;
      }

      // Phase 1: Try to get last known position immediately (fast fallback)
      try {
        const lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown) {
          setLocation({
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          });
          setLocationSource('Last Known');
          setIncludeLocation(true);
          lastKnownUsed = true;
        }
      } catch (e) {
        logger.error('Last known position error:', e);
      }

      // Phase 2: Progressive Accuracy Strategy
      const accuracies = [
        { level: Location.Accuracy.High, timeout: 10000, name: 'High' },
        { level: Location.Accuracy.Balanced, timeout: 10000, name: 'Medium' },
        { level: Location.Accuracy.Low, timeout: 5000, name: 'Low' },
      ];

      let success = false;
      for (const config of accuracies) {
        try {
          const locationPromise = Location.getCurrentPositionAsync({
            accuracy: config.level,
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timed out at ${config.name}`)), config.timeout),
          );

          const loc = await Promise.race([locationPromise, timeoutPromise]);
          setLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          setLocationSource('Current');
          setIncludeLocation(true);
          success = true;
          break; // Stop once we have a fresh fix
        } catch {
          logger.warn(`Failed with ${config.name} accuracy, trying next...`);
        }
      }

      if (!success && !lastKnownUsed) {
        showToast('Failed to get current location. Please try again.', 'error');
        setIncludeLocation(false);
        setLocation(null);
        setLocationSource(null);
      }
    } catch (error) {
      logger.error('Critical location error:', error);
      showToast('Location services error', 'error');
      setIncludeLocation(false);
      setLocation(null);
      setLocationSource(null);
    } finally {
      setFetchingLocation(false);
    }
  }, [showToast]);

  const handleOpenMaps = useCallback(() => {
    if (location) {
      const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
      Linking.openURL(url).catch((err) => {
        logger.error('Error opening Google Maps:', err);
        showToast('Could not open map', 'error');
      });
    }
  }, [location, showToast]);

  useEffect(() => {
    if (!editTx && includeLocation) {
      const timer = setTimeout(() => {
        fetchLocation();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [editTx, includeLocation, fetchLocation]);

  const handleLocationToggle = async () => {
    if (!includeLocation) {
      await fetchLocation();
    } else {
      setIncludeLocation(false);
      setLocation(null);
      setLocationSource(null);
    }
  };

  const handleManualLocationUpdate = (latitude: number, longitude: number) => {
    setLocation({ latitude, longitude });
    setLocationSource('Current');
    showToast('Location updated manually', 'success');
  };

  const handleRemoveLocation = () => {
    setLocation(null);
    setLocationSource(null);
    showToast('Location removed', 'info');
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;

    const validation = validateTransaction({
      amount,
      description,
      categoryId: selectedCategory?.id || '',
    });

    if (!validation.valid || !selectedCategory) {
      // Find the first error and display it
      const firstErrorKey = Object.keys(validation.errors)[0];
      showToast(firstErrorKey ? validation.errors[firstErrorKey] : 'Category is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const txId = editTx?.id || generateUUID();
      const newTx: Transaction = {
        id: txId,
        amount: parseFloat(amount),
        description: description,
        transaction_timestamp: date.toISOString(),
        date: format(date, 'yyyy-MM-dd'),
        category_id: selectedCategory.id,
        category_name: selectedCategory.name,
        category_icon: selectedCategory.icon,
        category_app_icon: selectedCategory.app_icon,
        payee_id: selectedPayee?.id || null,
        payee_name: selectedPayee?.name || null,
        payee_logo: selectedPayee?.logo || null,
        type: type,
        user_id: session.user.id,
        product_link: productLink.trim() || null,
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        created_at: editTx?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sync_status: 1,
        tid: editTx?.tid || 0,
      };

      await insertOrUpdateTransaction(newTx, 1);
      syncTransactions(session.user.id, true).catch((err) =>
        logger.error('Background sync failed', err),
      );

      DeviceEventEmitter.emit('module_refreshed', { module: 'Transactions' });
      DeviceEventEmitter.emit('module_refreshed', { module: 'Dashboard' });
      DeviceEventEmitter.emit('module_refreshed', { module: 'Budgets' });

      showToast('Transaction saved successfully', 'success');
      navigation.goBack();
    } catch (error) {
      logger.error(error);
      showToast('Failed to save transaction', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const currentIconColor = type === 'Income' ? colors.success : colors.danger;
  const currentIconBg = type === 'Income' ? colors.success + '20' : colors.danger + '20';

  return (
    <View style={styles.container}>
      <BottomSheet
        visible={true}
        onClose={() => navigation.goBack()}
        title={editTx ? 'Edit Transaction' : 'Add Transaction'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {!editTx && (
                <SegmentedControl
                  options={[
                    { label: 'Expense', value: 'Expense', activeColor: colors.danger },
                    { label: 'Income', value: 'Income', activeColor: colors.success },
                  ]}
                  selectedValue={type}
                  onValueChange={(val: 'Expense' | 'Income') => setType(val)}
                  variant="medium"
                  containerStyle={common.mb12}
                />
              )}

              {/* Date / Time Row */}
              <View style={styles.dateTimeRow}>
                <TouchableOpacity
                  style={[
                    styles.dateTimeChip,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Icon
                    name="calendar-today"
                    size={14}
                    color={colors.textSecondary}
                    style={common.mr6}
                  />
                  <Text style={[styles.dateTimeText, { color: colors.text }]}>
                    {format(date, 'dd MMM yyyy')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.dateTimeChip,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Icon name="schedule" size={14} color={colors.textSecondary} style={common.mr6} />
                  <Text style={[styles.dateTimeText, { color: colors.text }]}>
                    {format(date, 'h:mm a')}
                  </Text>
                </TouchableOpacity>
              </View>

              <TransactionFormFields
                amount={amount}
                setAmount={setAmount}
                description={description}
                setDescription={setDescription}
                productLink={productLink}
                setProductLink={setProductLink}
                iconColor={currentIconColor}
                colors={colors}
                autoFocus={!editTx}
              />

              <TransactionSelectorRow
                selectedPayee={selectedPayee}
                selectedCategory={selectedCategory}
                onPressPayee={() => setShowModal('Payee')}
                onPressCategory={() => setShowModal('Category')}
                colors={colors}
                currentIconBg={currentIconBg}
                currentIconColor={currentIconColor}
              />

              {!editTx && (
                <View style={[styles.locationRow, common.mt12]}>
                  <View style={common.flex1}>
                    <Text style={[styles.locationLabel, { color: colors.textSecondary }]}>
                      Include Location {locationSource && `(${locationSource})`}
                    </Text>
                    {location && includeLocation && (
                      <TouchableOpacity onPress={handleOpenMaps} activeOpacity={0.6}>
                        <Text style={[styles.coordsText, { color: colors.primary }]}>
                          {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.locationToggle,
                      {
                        backgroundColor: includeLocation ? currentIconColor : colors.background,
                        borderColor: includeLocation ? currentIconColor : colors.border,
                      },
                    ]}
                    onPress={handleLocationToggle}
                    disabled={fetchingLocation}
                  >
                    {fetchingLocation ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <Icon
                        name={includeLocation ? 'location-on' : 'location-off'}
                        size={18}
                        color={includeLocation ? 'white' : colors.textSecondary}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {editTx && (
                <TransactionLocationEditRow
                  location={location}
                  onEditPress={() => setShowLocationSheet(true)}
                  colors={colors}
                />
              )}
            </ScrollView>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: currentIconColor },
                submitting && styles.submitting,
              ]}
              onPress={handleSave}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.saveBtnText}>Save Transaction</Text>
              )}
            </TouchableOpacity>

            {/* Date / Time pickers */}
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={date}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}

            <ItemSelectorModal
              visible={showModal === 'Category'}
              onClose={() => setShowModal(null)}
              type="Category"
              data={categories.filter((c) => c.type === type)}
              searchQuery={modalSearch}
              onSearchChange={setModalSearch}
              selectedItemId={selectedCategory?.id}
              onSelect={(item) => {
                setSelectedCategory(item as Category);
                setShowModal(null);
              }}
              transactionType={type}
            />
            <ItemSelectorModal
              visible={showModal === 'Payee'}
              onClose={() => setShowModal(null)}
              type="Payee"
              data={[{ id: 'none', name: 'None' }, ...payees] as (Category | Payee)[]}
              searchQuery={modalSearch}
              onSearchChange={setModalSearch}
              selectedItemId={selectedPayee?.id}
              onSelect={(item) => {
                setSelectedPayee(item.id === 'none' ? null : (item as Payee));
                setShowModal(null);
              }}
              transactionType={type}
            />

            <LocationEditSheet
              visible={showLocationSheet}
              onClose={() => setShowLocationSheet(false)}
              location={location}
              onUpdateFromGPS={fetchLocation}
              onManualUpdate={handleManualLocationUpdate}
              onRemove={handleRemoveLocation}
              colors={colors}
              isFetching={fetchingLocation}
            />
          </View>
        </TouchableWithoutFeedback>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  submitting: { opacity: 0.7 },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  dateTimeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateTimeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  locationToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  coordsText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
