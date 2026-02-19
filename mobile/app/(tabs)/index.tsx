import { View, StyleSheet } from 'react-native';
import { Calendar } from '../../src/components/Calendar';
import { useState, useEffect } from 'react';
import { Session } from '@shared/types';
import { useNavigation } from 'expo-router';

export default function CalendarScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    // Disable swipe back gesture on this tab screen
    navigation.setOptions({
      gestureEnabled: false,
    });
  }, [navigation]);
  const [calendarRefresh, setCalendarRefresh] = useState(0);

  const handleSessionClick = (session: Session) => {
    // Navigate to session details
    // You can implement navigation here when you have session detail screens
    console.log('Session clicked:', session);
  };

  const handleDateSelect = (date: Date) => {
    console.log('Date selected:', date);
  };

  return (
    <View style={styles.container}>
      <Calendar
        onSessionClick={handleSessionClick}
        onDateSelect={handleDateSelect}
        refreshTrigger={calendarRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

