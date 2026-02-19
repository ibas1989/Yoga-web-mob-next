import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { translationResources } from '@shared/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a simple language detector for React Native
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // Try to get saved language from AsyncStorage
      const savedLanguage = await AsyncStorage.getItem('yoga_tracker_language');
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
      
      // Fall back to device language
      const deviceLanguage = Localization.locale.split('-')[0];
      callback(deviceLanguage === 'ru' ? 'ru' : 'en');
    } catch (error) {
      // Default to English
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem('yoga_tracker_language', lng);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  },
};

// Initialize i18n with React Native configuration
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: translationResources,
    fallbackLng: 'en',
    debug: __DEV__,
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    compatibilityJSON: 'v3',
  });

export default i18n;

