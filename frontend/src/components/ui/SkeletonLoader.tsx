import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
}

/**
 * SkeletonLoader component for loading states
 * Provides smooth shimmer animation
 */
export const SkeletonLoader = ({
  className,
  variant = 'rectangular',
  width,
  height,
  count = 1,
}: SkeletonLoaderProps) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-800 rounded animate-pulse';
  
  const variantClasses = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: '',
    card: 'rounded-xl',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  const skeleton = (
    <motion.div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );

  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {skeleton}
          </motion.div>
        ))}
      </div>
    );
  }

  return skeleton;
};

/**
 * ProductCardSkeleton - Pre-built skeleton for product cards
 */
export const ProductCardSkeleton = ({ count = 1 }: { count?: number }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          className="bg-background rounded-3xl border border-border/50 overflow-hidden"
        >
          {/* Image skeleton */}
          <SkeletonLoader variant="rectangular" className="aspect-square w-full" />
          
          {/* Content skeleton */}
          <div className="p-6 space-y-3">
            <SkeletonLoader variant="text" width="60%" height="12px" />
            <SkeletonLoader variant="text" width="80%" height="16px" />
            <SkeletonLoader variant="text" width="40%" height="20px" />
          </div>
        </motion.div>
      ))}
    </>
  );
};

