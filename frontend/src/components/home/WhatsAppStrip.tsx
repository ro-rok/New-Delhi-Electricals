import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { useMagneticEffect } from '@/hooks/useMagneticEffect';

const WhatsAppStrip = () => {
  const { trackWhatsAppClick } = useApp();
  const buttonRef = useMagneticEffect(0.15);

  const handleWhatsApp = () => {
    trackWhatsAppClick();
    const message = encodeURIComponent("Hi! I need help selecting the right electrical components.");
    window.open(`https://wa.me/919654102758?text=${message}`, '_blank');
  };

  return (
    <section className="py-24">
      <div className="container max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <button
            ref={buttonRef as any}
            onClick={handleWhatsApp}
            className="w-full group relative overflow-hidden glass rounded-3xl p-10 hover:shadow-elevated transition-all duration-300"
          >
            {/* Gradient background on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 group-hover:bg-accent/20 transition-colors duration-500"
              >
                <MessageCircle className="h-8 w-8 text-accent" strokeWidth={1.5} />
              </motion.div>
              
              <div className="flex-1">
                <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
                  Need assistance?
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  Chat with us instantly on WhatsApp for expert guidance on selecting the right components.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 text-sm font-medium text-accent">
                <span>Start Chat</span>
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.div>
              </div>
            </div>
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default WhatsAppStrip;
