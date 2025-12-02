import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { useMagneticEffect } from '@/hooks/useMagneticEffect';
import { cn } from '@/lib/utils';

interface MagneticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  strength?: number;
}

export const MagneticButton = forwardRef<HTMLButtonElement, MagneticButtonProps>(
  ({ children, variant, size, strength = 0.2, className, ...props }, forwardedRef) => {
    const magneticRef = useMagneticEffect(strength);

    return (
      <Button
        ref={(node) => {
          // Handle both refs
          if (magneticRef.current !== node) {
            (magneticRef as any).current = node;
          }
          if (typeof forwardedRef === 'function') {
            forwardedRef(node);
          } else if (forwardedRef) {
            forwardedRef.current = node;
          }
        }}
        variant={variant}
        size={size}
        className={cn('transition-transform duration-200', className)}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

MagneticButton.displayName = 'MagneticButton';
