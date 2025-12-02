import { useState } from 'react';
import { MessageCircle, X, Camera, FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

const WhatsAppFab = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { trackWhatsAppClick } = useApp();

  const handleQuickInquiry = () => {
    trackWhatsAppClick();
    const message = encodeURIComponent("Hi! I need help with electrical products. Please assist.");
    window.open(`https://wa.me/919654102758?text=${message}`, '_blank');
    setIsOpen(false);
  };

  const handlePhotoInquiry = () => {
    trackWhatsAppClick();
    const message = encodeURIComponent("Hi! I'm sharing my product list/order sheet. Please match, verify specs, and send a quote.");
    window.open(`https://wa.me/919654102758?text=${message}`, '_blank');
    setIsOpen(false);
  };

  const handleListInquiry = () => {
    trackWhatsAppClick();
    const message = encodeURIComponent("Hi! I'd like to share my requirements list. Please help me with availability and pricing.");
    window.open(`https://wa.me/919654102758?text=${message}`, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="absolute bottom-20 right-0 w-80 glass-strong rounded-3xl shadow-float p-6 mb-2"
          >
            <h4 className="font-semibold mb-4 text-base tracking-tight">Quick Inquiry</h4>
            <div className="space-y-2">
              <button
                onClick={handlePhotoInquiry}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-all duration-300 text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Camera className="h-5 w-5 text-emerald-600" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-medium text-sm tracking-tight">Upload Order Photo</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Share photo & get instant quote</p>
                </div>
              </button>
              
              <button
                onClick={handleListInquiry}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-all duration-300 text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-5 w-5 text-foreground/60" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-medium text-sm tracking-tight">Share Requirements</p>
                  <p className="text-xs text-muted-foreground mt-0.5">PDF or text list</p>
                </div>
              </button>
              
              <button
                onClick={handleQuickInquiry}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-all duration-300 text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Send className="h-5 w-5 text-foreground/60" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-medium text-sm tracking-tight">Quick Chat</p>
                  <p className="text-xs text-muted-foreground mt-0.5">General inquiry</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-110"
      >
        {isOpen ? (
          <X className="h-6 w-6" strokeWidth={2} />
        ) : (
          <MessageCircle className="h-6 w-6" strokeWidth={2} />
        )}
      </Button>
    </div>
  );
};

export default WhatsAppFab;
