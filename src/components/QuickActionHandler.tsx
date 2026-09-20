import { useEffect, useState, useCallback, useRef } from 'react';
import { DeviceEventEmitter, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../store/AuthContext';
import { logger } from '../utils/logger';

interface ActionItem {
  id: string;
  title: string;
}

export function QuickActionHandler() {
  const { session } = useAuth();
  const [pendingAction, setPendingAction] = useState<ActionItem | null>(null);
  const processingRef = useRef(false);

  // Handle quick action navigation
  const handleQuickAction = useCallback(
    (action: ActionItem) => {
      logger.info('[QuickActions] Handling quick action:', action.id);

      if (processingRef.current) {
        return;
      }

      if (!session) {
        logger.info('[QuickActions] User not authenticated, ignoring action');
        return;
      }

      processingRef.current = true;

      try {
        if (action.id === 'add_transaction') {
          router.push('/add-transaction');
          logger.info('[QuickActions] Navigated to AddTransaction via Expo Router');
        } else if (action.id === 'quick_transaction') {
          router.replace('/(tabs)/transactions');
          setTimeout(() => {
            DeviceEventEmitter.emit('show_quick_transaction_modal');
            logger.info('[QuickActions] Triggered quick transaction modal');
          }, 200);
        } else {
          logger.warn('[QuickActions] Unknown action ID:', action.id);
        }
      } catch (error) {
        logger.error('[QuickActions] Navigation failed:', error);
      }

      setTimeout(() => {
        processingRef.current = false;
      }, 1000);
    },
    [session],
  );

  // Configure native shortcuts on iOS where native 3D touch is supported
  useEffect(() => {
    if (Platform.OS === 'ios') {
      try {
        const { setItems } = require('expo-quick-actions');
        if (setItems) {
          setItems([
            {
              id: 'add_transaction',
              title: 'New Transaction',
              icon: 'asset:add_transaction_icon',
            },
            {
              id: 'quick_transaction',
              title: 'Quick Transaction',
              icon: 'asset:quick_transaction_icon',
            },
          ]).catch(() => {});
        }
      } catch {
        // Fall through
      }
    }
  }, []);

  // Listen for native callbacks when available
  useEffect(() => {
    try {
      const { addListener } = require('expo-quick-actions');
      if (addListener) {
        const sub = addListener((action: ActionItem) => {
          handleQuickAction(action);
        });
        return () => sub?.remove?.();
      }
    } catch {
      // Fall through
    }
  }, [handleQuickAction]);

  useEffect(() => {
    if (pendingAction) {
      const timer = setTimeout(() => {
        handleQuickAction(pendingAction);
        setPendingAction(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [pendingAction, handleQuickAction]);

  return null;
}
