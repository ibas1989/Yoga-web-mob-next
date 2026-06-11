'use client';

import React from 'react';
import '@/lib/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
}

// Translations are bundled synchronously — no need to block the app shell.
export function I18nProvider({ children }: I18nProviderProps) {
  return <>{children}</>;
}
