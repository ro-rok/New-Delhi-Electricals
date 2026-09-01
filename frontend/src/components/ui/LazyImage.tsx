import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  /**
   * Low-resolution blur-up image shown while the real image decodes.
   * NOTE: this must be a genuinely small derivative — passing the full-size
   * `src` here downloads the master twice and defeats the whole component.
   */
  placeholder?: string;
  className?: string;
  onError?: () => void;
  /**
   * `eager` opts out of the IntersectionObserver gate entirely and renders the
   * <img> on first paint. Use it only for a real LCP candidate; everything
   * below the fold should stay lazy.
   */
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
}

/**
 * LazyImage component that loads images only when they enter the viewport
 * Uses Intersection Observer API for efficient lazy loading
 */
export const LazyImage = ({
  src,
  srcSet,
  sizes,
  alt,
  placeholder,
  className,
  onError,
  loading = 'lazy',
  fetchPriority,
  width,
  height,
  ...props
}: LazyImageProps) => {
  const isEager = loading === 'eager';
  const [isLoaded, setIsLoaded] = useState(false);
  // Eager images bypass the observer gate so they are in the initial HTML paint
  // and remain discoverable as an LCP candidate.
  const [isInView, setIsInView] = useState(isEager);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEager) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [isEager]);

  // framer-motion's <motion.img> prop types omit some plain DOM image
  // attributes (notably fetchpriority, which React 18 does not camelCase-map
  // either), so they are applied as a raw attribute bag.
  const nativeImgAttrs = {
    loading,
    decoding: isEager ? 'sync' : 'async',
    ...(fetchPriority ? { fetchpriority: fetchPriority } : {}),
  } as Record<string, string>;

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
      {/* Placeholder/Skeleton */}
      <AnimatePresence>
        {!isLoaded && !hasError && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center"
          >
            {placeholder ? (
              <img
                src={placeholder}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover blur-sm scale-110"
                aria-hidden="true"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 animate-pulse" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actual Image */}
      {isInView && (
        <motion.img
          ref={imgRef}
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            onError?.();
          }}
          className={cn(
            'w-full h-full object-contain transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          {...props}
          {...nativeImgAttrs}
        />
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-gray-400 dark:text-gray-600 text-sm">Image unavailable</div>
        </div>
      )}
    </div>
  );
};
