'use client';

import { useEffect } from 'react';
import { suppressHydrationWarnings } from '@/lib/hydrationUtils';

interface ClientHydrationSetupProps {
  children: React.ReactNode;
}

/** Client-only side effects (hydration warnings, RSC fetch errors). */
export function ClientHydrationSetup({ children }: ClientHydrationSetupProps) {
  useEffect(() => {
    const cleanup = suppressHydrationWarnings();

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason &&
        typeof event.reason === 'string' &&
        (event.reason.includes('Failed to fetch RSC payload') ||
          event.reason.includes('Failed to fetch'))
      ) {
        console.warn('RSC fetch error suppressed:', event.reason);
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      cleanup?.();
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
    };
  }, []);

  return <>{children}</>;
}

export const ClientBody = ClientHydrationSetup;
