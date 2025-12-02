import { motion } from 'framer-motion';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useMagneticEffect } from '@/hooks/useMagneticEffect';

interface WhatsAppCTAProps {
  brandName: string;
}

const WhatsAppCTA = ({ brandName }: WhatsAppCTAProps) => {
  const { trackWhatsAppClick } = useApp();
  const buttonRef = useMagneticEffect(0.15);

  const handleWhatsApp = () => {
    trackWhatsAppClick();
    const message = encodeURIComponent(
      `Hi! I need help choosing products from ${brandName}. Can you assist me?`
    );
    window.open(`https://wa.me/919654102758?text=${message}`, '_blank');
  };

  return (
    <section className="py-24 border-t border-border/30">
      <div className="container max-w-5xl mx-auto px-6">
        <motion.button
          ref={buttonRef as any}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          onClick={handleWhatsApp}
          className="w-full group relative overflow-hidden glass-strong rounded-3xl p-12 hover:shadow-elevated transition-all duration-300"
        >
          {/* Animated gradient on hover */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-gradient-to-r from-accent/10 via-accent/5 to-transparent"
          />

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            {/* Icon */}
            <motion.div
              whileHover={{ scale: 1.15, rotate: 10 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="flex-shrink-0"
            >
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-accent/10 group-hover:bg-accent/20 transition-colors duration-500">
                <MessageCircle className="h-10 w-10 text-accent" strokeWidth={1.5} />
                
                {/* Pulse effect */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-3xl bg-accent/20"
                />
              </div>
            </motion.div>

            {/* Content */}
            <div className="flex-1 max-w-2xl">
              <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
                Need help choosing {brandName} products?
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Send us your product list, photos, or requirements — we'll match, verify, and guide you instantly via WhatsApp.
              </p>
            </div>

            {/* Arrow */}
            <motion.div
              animate={{ x: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex-shrink-0"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors duration-500">
                <ArrowRight className="h-6 w-6 text-accent" strokeWidth={2} />
              </div>
            </motion.div>
          </div>
        </motion.button>
      </div>
    </section>
  );
};

export default WhatsAppCTA;
