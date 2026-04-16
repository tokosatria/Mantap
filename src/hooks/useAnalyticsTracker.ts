'use client';

import { useEffect } from 'react';

export function useAnalyticsTracker() {
  useEffect(() => {
    // Generate or get session ID from localStorage
    let sessionId = localStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('analytics_session_id', sessionId);
      console.log('Analytics: New session created', sessionId);
    } else {
      console.log('Analytics: Using existing session', sessionId);
    }

    // Detect device type
    const getDeviceType = () => {
      const ua = navigator.userAgent;
      if (/mobile/i.test(ua)) return 'mobile';
      if (/tablet/i.test(ua)) return 'tablet';
      return 'desktop';
    };

    // Track page view
    const trackPageView = async () => {
      try {
        console.log('Analytics: Tracking page view', {
          sessionId,
          pagePath: window.location.pathname,
          pageTitle: document.title,
          deviceType: getDeviceType(),
        });

        const response = await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            pagePath: window.location.pathname,
            pageTitle: document.title,
            deviceType: getDeviceType(),
            referrer: document.referrer || null,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Analytics: Track failed', error);
        } else {
          console.log('Analytics: Track successful');
        }
      } catch (error) {
        console.error('Analytics: Tracking failed', error);
      }
    };

    // Track initial page view
    trackPageView();

    // Track route changes (for single page app)
    const handleRouteChange = () => {
      trackPageView();
    };

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
}
