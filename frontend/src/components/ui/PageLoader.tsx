import { motion } from 'framer-motion';

/**
 * PageLoader component for route-level loading states
 * Used with React.lazy() and Suspense
 */
export const PageLoader = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <motion.div
          className="w-16 h-16 border-4 border-gray-200 dark:border-gray-800 border-t-gray-900 dark:border-t-white rounded-full mx-auto mb-4"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        <p className="text-gray-500 dark:text-gray-400 text-lg">Loading...</p>
      </div>
    </div>
  );
};

