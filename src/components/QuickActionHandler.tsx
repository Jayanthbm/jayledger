import { useEffect, useState, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuickActionCallback } from 'expo-quick-actions/hooks';
import { setItems } from 'expo-quick-actions';
import type { Action } from 'expo-quick-actions';
import { useAuth } from '../store/AuthContext';
import { RootStackParamList } from '../navigation/navigationTypes';
import { logger } from '../utils/logger';

export function QuickActionHandler() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
            navigation.navigate('AddTransaction');
            logger.info('[QuickActions] Navigated to AddTransaction');
          } else if (action.id === 'quick_transaction') {
            // Navigate to Transactions tab which will show the quick transaction modal
            navigation.navigate('Main', { screen: 'Transactions' });
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
    [navigation, session],
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

  // Handle navigation for pending actions once navigation is ready
  useEffect(() => {
    if (pendingAction && navigation) {
      logger.info('[QuickActions] Processing pending action:', pendingAction.id);
      // Process action in next tick to avoid setState in effect
      const timer = setTimeout(() => {
        handleQuickAction(pendingAction);
        setPendingAction(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [pendingAction, navigation, handleQuickAction]);

  // Use the expo-quick-actions hook to handle quick actions
  useQuickActionCallback((action: Action) => {
    logger.info('[QuickActions] Received quick action:', action.id);

    // Check if navigation is ready
    if (!navigation) {
      logger.info('[QuickActions] Navigation not ready, queueing action');
      setPendingAction(action);
      return;
    }

    handleQuickAction(action);
  });

  // This component doesn't render anything
  return null;
}
