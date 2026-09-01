import { useState, useEffect } from 'react';

/**
 * Custom hook to detect network online/offline status
 * @returns {boolean} isOnline - true if online, false if offline
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    // Node 22+ exposes a partial navigator. Only browser state may influence
    // the first client render; the SSR default must be deterministic.
    typeof window !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
