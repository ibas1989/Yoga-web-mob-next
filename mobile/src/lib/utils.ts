/**
 * Utility functions for mobile app
 */

import { getSessions } from './storage';
import { isSessionEndTimePassed } from '@shared/utils/dateUtils';

/**
 * Get the count of pending tasks (scheduled sessions whose end time has passed)
 * @returns Number of pending tasks
 */
export async function getPendingTasksCount(): Promise<number> {
  try {
    const sessions = await getSessions();
    console.log('[getPendingTasksCount] Total sessions:', sessions.length);
    
    // Filter sessions that are scheduled and whose end time has passed
    const pendingSessions = sessions.filter(session => {
      const isScheduled = session.status === 'scheduled';
      const isOverdue = isSessionEndTimePassed(session);
      if (isScheduled && isOverdue) {
        console.log('[getPendingTasksCount] Found pending session:', session.id, session.date, session.endTime);
      }
      return isScheduled && isOverdue;
    });
    
    console.log('[getPendingTasksCount] Pending sessions count:', pendingSessions.length);
    return pendingSessions.length;
  } catch (error) {
    console.error('Error getting pending tasks count:', error);
    return 0;
  }
}

