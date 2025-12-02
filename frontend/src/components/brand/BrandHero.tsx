import { motion } from 'framer-motion';
import { MessageCircle, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import type { Brand } from '@/types/product';

interface BrandHeroProps {
  brand: Brand;
  onCatalogOpen?: () => void;
}

const BrandHero = ({ brand, onCatalogOpen }: BrandHeroProps) => {
  const { trackWhatsAppClick } = useApp();

  const handleWhatsApp = () => {
    trackWhatsAppClick();
    const message = encodeURIComponent(
      `Hi! I need help selecting the correct products from ${brand.name}. Here's my requirement:`
    );
    window.open(`https://wa.me/919654102758?text=${message}`, '_blank');
  };

  return (
    <section className="relative py-24 overflow-hidden border-b border-border/30">
      {/* Ultra-subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/10 via-background to-background" />
      
      <div className="container max-w-6xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Brand Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8"
          >
            {/* Monochrome brand letter mark with color reveal on hover */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="group inline-block"
            >
              <span className="text-[120px] md:text-[140px] font-bold leading-none tracking-tighter text-muted-foreground/10 group-hover:text-accent/20 transition-all duration-700">
                {brand.name.charAt(0)}
              </span>
            </motion.div>

            {/* Brand name and description */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
                {brand.name}
              </h1>
              <p className="text-lg text-muted-foreground/70 leading-relaxed font-light max-w-md">
                {brand.description}
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleWhatsApp}
                  size="lg"
                  className="h-11 px-7 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 shadow-sm hover:shadow-md apple-focus group text-[13px] font-medium"
                >
                  <MessageCircle className="mr-2 h-4 w-4" strokeWidth={2} />
                  WhatsApp Assistance
                </Button>
              </motion.div>

              {brand.catalogUrl && onCatalogOpen && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={onCatalogOpen}
                    size="lg"
                    variant="outline"
                    className="h-11 px-7 rounded-full border border-border/60 hover:border-border hover:bg-secondary/30 transition-all duration-300 apple-focus text-[13px] font-medium gap-2"
                  >
                    <FileText className="h-4 w-4" strokeWidth={2} />
                    View Catalogue
                    <ExternalLink className="h-3 w-3" strokeWidth={2} />
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Right: WhatsApp chat mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative lg:ml-auto"
          >
            {/* Floating glass card with chat preview */}
            <div className="relative glass rounded-3xl p-8 border border-border/50">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/30">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center"
                >
                  <MessageCircle className="h-6 w-6 text-accent" strokeWidth={1.5} />
                </motion.div>
                <div>
                  <div className="font-medium text-sm">Need Help Choosing?</div>
                  <div className="text-xs text-muted-foreground">We're here to assist</div>
                </div>
              </div>

              {/* Chat bubbles */}
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="bg-secondary/50 rounded-2xl rounded-tl-sm p-4"
                >
                  <p className="text-sm text-foreground/80">
                    Hi! I need help selecting products from {brand.name}.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="bg-accent/10 rounded-2xl rounded-tr-sm p-4 ml-8"
                >
                  <p className="text-sm text-foreground/80">
                    Of course! Share your requirements, and we'll guide you instantly.
                  </p>
                </motion.div>
              </div>

              {/* Typing indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.6 }}
                className="flex gap-1 mt-4"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    className="w-2 h-2 rounded-full bg-muted-foreground/30"
                  />
                ))}
              </motion.div>
            </div>

            {/* Ambient glow */}
            <div className="absolute inset-0 -z-10 bg-accent/5 blur-3xl rounded-full" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BrandHero;
