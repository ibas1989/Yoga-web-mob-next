import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../src/lib/i18n'; // Initialize i18n
import { useSessionCron } from '../src/lib/useSessionCron';

export default function RootLayout() {
  // Start the session cron job to check for overdue sessions
  useSessionCron();
  
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}

