/**
 * React Native hook for session cron job
 * Checks for overdue sessions every 2 minutes
 * Similar to the web app's session-cron.js functionality
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getSessions } from './storage';
import { isSessionEndTimePassed } from '@shared/utils/dateUtils';
import { dispatchSessionEvent } from './eventSystem';

// Configuration - matches web app settings
const CHECK_INTERVAL = 2 * 60 * 1000; // Check every 2 minutes for sessions becoming overdue

/**
 * Log a message with timestamp (only important messages)
 */
function log(message: string, forceLog: boolean = false): void {
  const timestamp = new Date().toISOString();
  // Only log important messages to reduce console spam
  if (forceLog || message.includes('Starting') || message.includes('Stopping') || message.includes('Found') || message.includes('Error')) {
    console.log(`[Session Cron ${timestamp}] ${message}`);
  }
}

/**
 * Check for overdue sessions and trigger updates
 */
async function checkForOverdueSessions(): Promise<void> {
  try {
    const sessions = await getSessions();
    const now = new Date();
    
    // Filter sessions that are scheduled and whose end time has passed
    const overdueSessions = sessions.filter(session => 
      session.status === 'scheduled' && 
      isSessionEndTimePassed(session)
    );
    
    if (overdueSessions.length > 0) {
      log(`Found ${overdueSessions.length} overdue sessions`, true);
      
      // Dispatch custom events to trigger UI updates
      // Components can listen for these events to update their state
      dispatchSessionEvent('sessionChanged', { 
        message: 'Overdue sessions detected',
        overdueCount: overdueSessions.length,
        timestamp: now.toISOString()
      });
      
      // Also dispatch a specific event for task updates
      dispatchSessionEvent('taskListUpdate', { 
        overdueSessions: overdueSessions.map(s => s.id),
        timestamp: now.toISOString()
      });
    }
  } catch (error) {
    log(`Error checking for overdue sessions: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
  }
}

/**
 * Hook to manage the session cron job
 * Automatically starts when component mounts and stops when it unmounts
 */
export function useSessionCron(): void {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  
  useEffect(() => {
    // Start the cron job
    log('Starting session cron job...', true);
    
    // Initial check
    checkForOverdueSessions();
    
    // Set up interval to check every 2 minutes
    intervalRef.current = setInterval(() => {
      checkForOverdueSessions();
    }, CHECK_INTERVAL);
    
    log(`Cron job started - checking every ${CHECK_INTERVAL / 1000} seconds`, true);
    
    // Handle app state changes (foreground/background)
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground, refresh the check
        log('App came to foreground, refreshing session check', true);
        checkForOverdueSessions();
      }
      appStateRef.current = nextAppState;
    });
    
    // Cleanup function
    return () => {
      log('Stopping session cron job...', true);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      subscription.remove();
      log('Cron job stopped', true);
    };
  }, []); // Empty dependency array - only run once on mount
}







