import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Download, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CatalogViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalogUrl?: string;
  brandName: string;
}

const CatalogViewer = ({ open, onOpenChange, catalogUrl, brandName }: CatalogViewerProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const totalPages = 24; // Mock

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isFullscreen ? 'max-w-full h-full' : 'max-w-5xl h-[85vh]'} p-0 gap-0 overflow-hidden`}>
        <DialogHeader className="px-6 py-4 border-b border-border flex-row items-center justify-between">
          <DialogTitle className="text-lg font-medium">{brandName} Catalogue</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 50}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground w-12 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 200}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-2" />
            <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
              <Maximize2 className="h-4 w-4" />
            </Button>
            {catalogUrl && (
              <Button variant="ghost" size="icon" asChild>
                <a href={catalogUrl} download>
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Thumbnails sidebar */}
          <div className="w-24 border-r border-border bg-muted/30 overflow-y-auto p-2 space-y-2 hidden md:block">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-full aspect-[3/4] rounded-lg border-2 transition-all ${
                  currentPage === i + 1
                    ? 'border-primary bg-primary/10'
                    : 'border-transparent hover:border-border'
                }`}
              >
                <div className="w-full h-full bg-card rounded flex items-center justify-center text-xs text-muted-foreground">
                  {i + 1}
                </div>
              </button>
            ))}
          </div>

          {/* Main viewer */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-muted/20">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="bg-card rounded-xl shadow-lg overflow-hidden"
                  style={{ transform: `scale(${zoom / 100})` }}
                >
                  {/* Mock PDF page */}
                  <div className="w-[595px] h-[842px] bg-card flex flex-col items-center justify-center p-8">
                    <div className="text-4xl font-bold text-muted-foreground/20 mb-4">{brandName}</div>
                    <div className="text-lg text-muted-foreground">Page {currentPage} of {totalPages}</div>
                    <div className="mt-8 text-sm text-muted-foreground text-center max-w-sm">
                      PDF catalogue viewer placeholder. Connect actual PDF file to display content.
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Page navigation */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-card">
              <Button
                variant="ghost"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="ghost"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CatalogViewer;
