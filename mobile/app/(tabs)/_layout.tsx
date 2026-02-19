import { Tabs, useNavigation } from 'expo-router';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { getPendingTasksCount } from '../../src/lib/utils';
import { addSessionEventListener, SessionEventDetail } from '../../src/lib/eventSystem';
import { TabBadge } from '../../src/components/TabBadge';

export default function TabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [pendingTasksCount, setPendingTasksCount] = useState<number>(0);

  // Ensure the bottom navigation is not overlapped by Android system nav bar
  const bottomPadding = Math.max(16, insets.bottom);
  const baseTabBarHeight = 64; // visual height without safe area
  const computedTabBarHeight = baseTabBarHeight + bottomPadding;

  // Update pending tasks count and badge
  useEffect(() => {
    const updatePendingTasksCount = async () => {
      const count = await getPendingTasksCount();
      console.log('[TabsLayout] Pending tasks count:', count);
      setPendingTasksCount(count);
    };
    
    // Initial load
    updatePendingTasksCount();
    
    // Listen for all session-related events to update count
    const handleSessionEvent = (detail: SessionEventDetail) => {
      console.log('[TabsLayout] Session event received:', detail);
      updatePendingTasksCount();
    };
    
    // Listen to all session change events
    const cleanup1 = addSessionEventListener('sessionCreated', handleSessionEvent);
    const cleanup2 = addSessionEventListener('sessionUpdated', handleSessionEvent);
    const cleanup3 = addSessionEventListener('sessionCompleted', handleSessionEvent);
    const cleanup4 = addSessionEventListener('sessionCancelled', handleSessionEvent);
    const cleanup5 = addSessionEventListener('sessionDeleted', handleSessionEvent);
    const cleanup6 = addSessionEventListener('sessionChanged', handleSessionEvent);
    const cleanup7 = addSessionEventListener('taskListUpdate', handleSessionEvent);
    
    // Cleanup listeners on unmount
    return () => {
      cleanup1();
      cleanup2();
      cleanup3();
      cleanup4();
      cleanup5();
      cleanup6();
      cleanup7();
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: computedTabBarHeight,
          paddingBottom: bottomPadding,
          paddingTop: 12,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        headerStyle: {
          backgroundColor: '#10b981',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.calendar'),
          headerTitle: t('navigation.calendar'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: t('navigation.students'),
          headerTitle: t('navigation.students'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: t('navigation.tasks'),
          headerTitle: t('navigation.tasks'),
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative', width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
              <MaterialCommunityIcons name="checkbox-marked-outline" size={size} color={color} />
              <TabBadge count={pendingTasksCount} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('navigation.settings'),
          headerTitle: t('navigation.settings'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

