import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { AlertCircle, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

/**
 * OfflineBanner component that displays when network is offline
 * Shows a banner at the top of the page with retry functionality
 */
export function OfflineBanner() {
  const isOnline = useNetworkStatus();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground shadow-lg"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <WifiOff className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">No Internet Connection</p>
                  <p className="text-xs opacity-90">
                    Please check your network connection and try again
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRetry}
                className="flex-shrink-0"
              >
                Retry
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default OfflineBanner;
