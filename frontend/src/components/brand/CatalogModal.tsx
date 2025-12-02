import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogUrl: string;
  brandName: string;
}

const CatalogModal = ({ isOpen, onClose, catalogUrl, brandName }: CatalogModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex items-center justify-center"
          >
            <div className="relative w-full h-full bg-card rounded-3xl border border-border/50 shadow-float overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 bg-background/50 backdrop-blur-sm">
                <div>
                  <h2 className="text-lg font-semibold">{brandName} Catalogue</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Product Specifications & Details</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full h-9 px-4 text-xs"
                    asChild
                  >
                    <a href={catalogUrl} download target="_blank" rel="noopener noreferrer">
                      <Download className="h-3.5 w-3.5 mr-1.5" strokeWidth={2} />
                      Download
                    </a>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="rounded-full h-9 w-9 p-0"
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </Button>
                </div>
              </div>

              {/* PDF Viewer */}
              <div className="flex-1 relative bg-muted/10">
                <iframe
                  src={catalogUrl}
                  className="w-full h-full"
                  title={`${brandName} Catalogue`}
                />
              </div>

              {/* Footer hint */}
              <div className="px-6 py-3 bg-background/50 backdrop-blur-sm border-t border-border/30">
                <p className="text-xs text-muted-foreground text-center">
                  Use scroll to navigate • Press ESC or click outside to close
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CatalogModal;
