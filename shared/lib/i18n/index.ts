// Shared i18n configuration - platform-agnostic
// Platform-specific initialization should be done in web/lib/i18n.ts or mobile/lib/i18n.ts

// Export translation resources for use in platform-specific i18n initialization
import enTranslations from './en.json';
import ruTranslations from './ru.json';

export const translationResources = {
  en: {
    translation: enTranslations,
  },
  ru: {
    translation: ruTranslations,
  },
};

// Export types
export * from './types';