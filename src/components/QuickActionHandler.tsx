import { useEffect, useState, useCallback, useRef } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { router } from 'expo-router';
import { useQuickActionCallback } from 'expo-quick-actions/hooks';
import { setItems } from 'expo-quick-actions';
import type { Action } from 'expo-quick-actions';
import { useAuth } from '../store/AuthContext';
import { logger } from '../utils/logger';

export function QuickActionHandler() {
  const { session } = useAuth();
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const processingRef = useRef(false);

  // Handle quick action navigation
  const handleQuickAction = useCallback(
    (action: Action) => {
      logger.info('[QuickActions] Handling quick action:', action.id);

      // Guard: prevent duplicate processing of quick actions
      if (processingRef.current) {
        logger.info('[QuickActions] Already processing an action, ignoring duplicate');
        return;
      }

      // Check authentication state
      if (!session) {
        logger.info('[QuickActions] User not authenticated, ignoring action');
        return;
      }

      processingRef.current = true;

      // Handle known actions
      try {
        if (action.id === 'add_transaction') {
          router.push('/add-transaction');
          logger.info('[QuickActions] Navigated to AddTransaction via Expo Router');
        } else if (action.id === 'quick_transaction') {
          // Use router.replace to avoid duplicate tab stack entries
          router.replace('/(tabs)/transactions');
          // Trigger the quick transaction modal via event
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

      // Release the processing lock after a delay to allow subsequent actions
      setTimeout(() => {
        processingRef.current = false;
      }, 1000);
    },
    [session],
  );

  // Set up quick actions when component mounts
  useEffect(() => {
    logger.info('[QuickActions] Setting up quick actions');

    const actions: Action[] = [
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
    ];

    setItems(actions)
      .then(() => {
        logger.info('[QuickActions] Quick actions configured successfully');
      })
      .catch((error) => {
        logger.error('[QuickActions] Failed to configure quick actions:', error);
      });
  }, []);

  // Handle navigation for pending actions once layout is ready
  useEffect(() => {
    if (pendingAction) {
      logger.info('[QuickActions] Processing pending action:', pendingAction.id);
      const timer = setTimeout(() => {
        handleQuickAction(pendingAction);
        setPendingAction(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [pendingAction, handleQuickAction]);

  // Use the expo-quick-actions hook to handle quick actions
  useQuickActionCallback((action: Action) => {
    logger.info('[QuickActions] Received quick action:', action.id);
    handleQuickAction(action);
  });

  // This component doesn't render anything
  return null;
}
