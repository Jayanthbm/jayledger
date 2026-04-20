import { getDb } from '../db/database';
import { Goal } from '../models/types';
import { syncGoals } from './syncService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

export const fetchGoals = async (userId: string): Promise<Goal[]> => {
  const db = getDb();
  return await db.getAllAsync<Goal>(
    `SELECT * FROM goals WHERE user_id = '${userId}' AND deleted = 0 ORDER BY name ASC`,
  );
};

export const handleGoalSync = async (userId: string) => {
  logger.info(`[GoalService] Triggering sync for user: ${userId}`);
  await syncGoals(userId);
  await AsyncStorage.setItem(`@initial_goals_sync_checked_${userId}`, 'true');
  logger.info(`[GoalService] Sync completed for user: ${userId}`);
};

export const sortGoals = (
  goals: Goal[],
  sortBy: 'name' | 'progress' | 'amount',
  sortAsc: boolean,
): Goal[] => {
  return [...goals].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'name') {
      cmp = a.name.localeCompare(b.name);
    } else if (sortBy === 'progress') {
      const progA = a.goal_amount ? a.current_amount / a.goal_amount : 0;
      const progB = b.goal_amount ? b.current_amount / b.goal_amount : 0;
      cmp = progA - progB;
    } else if (sortBy === 'amount') {
      cmp = a.goal_amount - b.goal_amount;
    }
    return sortAsc ? cmp : -cmp;
  });
};
