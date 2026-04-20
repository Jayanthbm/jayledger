import { useState, useCallback, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { Category, Payee, MonthlyStatsBreakdown } from '../models/types';
import {
  fetchTransactions,
  fetchTransactionFilterData,
  fetchStatsBreakdown,
} from '../services/transactionService';
import { FlashListItem } from '../utils/dataMappers';
import { logger } from '../utils/logger';

interface UseTransactionFiltersProps {
  session: Session | null;
  params:
    | {
        initialSelectedCats?: string[];
        initialSelectedPayees?: string[];
        initialStartDate?: string | null;
        initialEndDate?: string | null;
      }
    | undefined;
}

export const useTransactionFilters = ({ session, params }: UseTransactionFiltersProps) => {
  const [loading, setLoading] = useState(true);
  const [listData, setListData] = useState<FlashListItem[]>([]);
  const [stickyHeaderIndices, setStickyHeaderIndices] = useState<number[]>([]);
  const [totalFiltered, setTotalFiltered] = useState(0);

  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsBreakdown, setStatsBreakdown] = useState<MonthlyStatsBreakdown[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedPayees, setSelectedPayees] = useState<string[]>([]);
  const [tempSelectedCats, setTempSelectedCats] = useState<string[]>([]);
  const [tempSelectedPayees, setTempSelectedPayees] = useState<string[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [showFilterModal, setShowFilterModal] = useState<'Category' | 'Payee' | null>(null);
  const [modalSearch, setModalSearch] = useState('');

  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const loadFilterData = useCallback(async () => {
    if (!session?.user?.id) return;
    const { categories: cats, payees: p } = await fetchTransactionFilterData(session.user.id);
    setCategories(cats);
    setPayees(p);
  }, [session]);

  const loadData = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    const {
      listData: data,
      stickyHeaderIndices: indices,
      totalFiltered: total,
    } = await fetchTransactions({
      userId: session.user.id,
      search,
      selectedCats,
      selectedPayees,
      startDate,
      endDate,
    });

    setListData(data);
    setStickyHeaderIndices(indices);
    setTotalFiltered(total);
    setLoading(false);
  }, [session, search, selectedCats, selectedPayees, startDate, endDate]);

  const loadStatsBreakdown = async () => {
    if (!session?.user?.id) return;
    setLoadingStats(true);
    setShowStatsModal(true);
    try {
      const stats = await fetchStatsBreakdown(
        session.user.id,
        selectedCats,
        selectedPayees,
        search,
      );
      setStatsBreakdown(stats);
    } catch (e) {
      logger.error('Error loading stats breakdown:', e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (params?.initialStartDate) setStartDate(params.initialStartDate);
      if (params?.initialEndDate) setEndDate(params.initialEndDate);
    }, 0);
    return () => clearTimeout(timer);
  }, [params]);

  useEffect(() => {
    const timeout = setTimeout(loadData, 300);
    return () => clearTimeout(timeout);
  }, [loadData]);

  useEffect(() => {
    if (!showFilterModal) {
      const timer = setTimeout(() => {
        setModalSearch('');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [showFilterModal]);

  const handleFilterCategory = (catId: string) => {
    setSelectedCats([catId]);
    setTempSelectedCats([catId]);
    setSearch('');
  };

  const handleFilterPayee = (payeeId: string | null) => {
    if (payeeId) {
      setSelectedPayees([payeeId]);
      setTempSelectedPayees([payeeId]);
      setSearch('');
    }
  };

  const clearFilters = useCallback(() => {
    setSearch('');
    setSelectedCats([]);
    setSelectedPayees([]);
    setTempSelectedCats([]);
    setTempSelectedPayees([]);
    setStartDate(null);
    setEndDate(null);
  }, []);

  return {
    loading,
    listData,
    stickyHeaderIndices,
    totalFiltered,
    showStatsModal,
    setShowStatsModal,
    statsBreakdown,
    loadingStats,
    search,
    setSearch,
    selectedCats,
    setSelectedCats,
    selectedPayees,
    setSelectedPayees,
    tempSelectedCats,
    setTempSelectedCats,
    tempSelectedPayees,
    setTempSelectedPayees,
    categories,
    payees,
    showFilterModal,
    setShowFilterModal,
    modalSearch,
    setModalSearch,
    startDate,
    endDate,
    loadFilterData,
    loadData,
    loadStatsBreakdown,
    handleFilterCategory,
    handleFilterPayee,
    clearFilters,
  };
};
