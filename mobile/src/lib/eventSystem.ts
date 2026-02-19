/**
 * React Native Event System for Session Management
 * Provides event dispatching and listening for mobile app
 */

import { DeviceEventEmitter } from 'react-native';

// Event types for type safety
export type SessionEventType = 
  | 'sessionCreated'
  | 'sessionUpdated'
  | 'sessionCompleted'
  | 'sessionCancelled'
  | 'sessionDeleted'
  | 'sessionChanged'
  | 'taskListUpdate';

export interface SessionEventDetail {
  sessionId?: string;
  session?: any;
  message?: string;
  overdueCount?: number;
  overdueSessions?: string[];
  timestamp?: string;
}

/**
 * Enhanced event dispatcher for React Native
 */
export function dispatchSessionEvent(
  eventType: SessionEventType, 
  detail: SessionEventDetail
): void {
  try {
    DeviceEventEmitter.emit(eventType, detail);
    
    // Log in development mode
    if (__DEV__) {
      console.log(`📡 Dispatched ${eventType} event:`, detail);
    }
  } catch (error) {
    console.error(`Failed to dispatch ${eventType} event:`, error);
  }
}

/**
 * Enhanced event listener for React Native
 */
export function addSessionEventListener(
  eventType: SessionEventType,
  handler: (detail: SessionEventDetail) => void
): () => void {
  try {
    const subscription = DeviceEventEmitter.addListener(eventType, handler);
    
    // Return cleanup function
    return () => {
      subscription.remove();
    };
  } catch (error) {
    console.error(`Failed to add ${eventType} listener:`, error);
    return () => {}; // Return no-op cleanup function
  }
}

/**
 * Batch event listener for multiple session events
 */
export function addBatchSessionEventListeners(
  eventTypes: SessionEventType[],
  handler: (detail: SessionEventDetail) => void
): () => void {
  const subscriptions = eventTypes.map(eventType => 
    addSessionEventListener(eventType, handler)
  );

  // Return cleanup function
  return () => {
    subscriptions.forEach(cleanup => cleanup());
  };
}

/**
 * Get event system status
 */
export function getEventSystemStatus(): {
  eventTypes: SessionEventType[];
} {
  return {
    eventTypes: [
      'sessionCreated',
      'sessionUpdated', 
      'sessionCompleted',
      'sessionCancelled',
      'sessionDeleted',
      'sessionChanged',
      'taskListUpdate'
    ]
  };
}







