import { Redirect } from 'expo-router';

export default function Index() {
  // Explicitly redirect to the Calendar tab as the home screen
  return <Redirect href="/(tabs)/calendar" />;
}
