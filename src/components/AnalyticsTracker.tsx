'use client';

import { useAnalyticsTracker } from '@/hooks/useAnalyticsTracker';

export default function AnalyticsTracker() {
  useAnalyticsTracker();
  return null; // This component doesn't render anything
}
