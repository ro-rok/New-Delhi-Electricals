import { MessageCircle } from 'lucide-react';

interface ProductImagePlaceholderProps {
  className?: string;
}

export const ProductImagePlaceholder = ({ className = '' }: ProductImagePlaceholderProps) => {
  return (
    <div className={`flex flex-col items-center justify-center bg-gradient-to-br from-secondary/30 to-secondary/10 ${className}`}>
      <div className="text-center px-6 py-8 space-y-4">
        <div className="w-20 h-20 mx-auto bg-secondary/40 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-muted-foreground/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Image Coming Soon
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/80">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Contact on WhatsApp for more info</span>
          </div>
        </div>
      </div>
    </div>
  );
};
