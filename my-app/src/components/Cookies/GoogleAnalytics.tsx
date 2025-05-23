// components/GoogleAnalytics.jsx
'use client';

import { useCookieConsent } from '@/components/Cookies/cookie-consent';
import { useEffect } from 'react';

export default function GoogleAnalytics() {
  const { hasConsent } = useCookieConsent();

  useEffect(() => {
    if (hasConsent('analytics')) {
      // GA sera initialisé par le système de cookies
    }
  }, [hasConsent]);

  return null;
}