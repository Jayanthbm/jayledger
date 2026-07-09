import { useEffect, useState, useCallback } from 'react';
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

  // Handle quick action navigation
  const handleQuickAction = useCallback(
    (action: Action) => {
      logger.info('[QuickActions] Handling quick action:', action.id);

      // Check authentication state
      if (!session) {
        logger.info('[QuickActions] User not authenticated, ignoring action');
        return;
      }

      // Handle known actions
      try {
        // Use setTimeout to ensure navigation is fully ready
        setTimeout(() => {
          if (action.id === 'add_transaction') {
            router.push('/add-transaction');
            logger.info('[QuickActions] Navigated to AddTransaction via Expo Router');
          } else if (action.id === 'quick_transaction') {
            // Navigate to Transactions tab which will show the quick transaction modal
            router.push('/(tabs)/transactions');
            // Trigger the quick transaction modal via event
            setTimeout(() => {
              DeviceEventEmitter.emit('show_quick_transaction_modal');
              logger.info('[QuickActions] Triggered quick transaction modal');
            }, 200);
          } else {
            logger.warn('[QuickActions] Unknown action ID:', action.id);
          }
        }, 100);
      } catch (error) {
        logger.error('[QuickActions] Navigation failed:', error);
      }
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
