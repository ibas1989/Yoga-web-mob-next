import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { safeStorage } from './hydrationUtils';
import { translationResources } from '@shared/i18n';

// Initialize i18n with web-specific configuration
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: translationResources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    detection: {
      order: safeStorage.isAvailable() ? ['localStorage', 'navigator', 'htmlTag'] : ['navigator', 'htmlTag'],
      caches: safeStorage.isAvailable() ? ['localStorage'] : [],
    },
  });

export default i18n;

