import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-premium.jpg";
import { useApp } from "@/contexts/AppContext";
import { useMagneticEffect } from "@/hooks/useMagneticEffect";

const PremiumHero = () => {
  const { trackWhatsAppClick } = useApp();
  const navigate = useNavigate();
  const primaryBtnRef = useMagneticEffect(0.2);
  const secondaryBtnRef = useMagneticEffect(0.2);

  const handleWhatsApp = () => {
    trackWhatsAppClick();
    const message = encodeURIComponent("Hi! I'm interested in your premium electrical products.");
    window.open(`https://wa.me/919654102758?text=${message}`, "_blank");
  };

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-gradient-to-b from-background via-secondary/20 to-background">
      <div className="container relative z-10 mx-auto px-6 lg:px-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content - ultra-clean typography */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-10"
          >
            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-foreground leading-[1.1]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1 }}
            >
              Precision Electrical Components.{" "}
              <span className="font-normal">Perfected.</span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2 }}
            >
              High-performance switches, MCBs, DBs, and industrial-grade components engineered with unmatched reliability.
            </motion.p>

            {/* Trust indicators - minimal */}
            <motion.div
              className="flex items-center gap-8 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                <span className="font-light">27 Years</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                <span className="font-light">30,000+ Products</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                <span className="font-light">50+ Brands</span>
              </div>
            </motion.div>

            {/* CTAs - minimal and clean with magnetic effect */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 pt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4 }}
            >
              <Button
                ref={primaryBtnRef as any}
                size="lg"
                onClick={() => navigate("/categories")}
                className="group font-light text-base hover-lift transition-transform duration-200"
              >
                Explore Products
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
              </Button>
              <Button
                ref={secondaryBtnRef as any}
                size="lg"
                variant="outline"
                onClick={handleWhatsApp}
                className="group font-light text-base hover-lift border-2 transition-transform duration-200"
              >
                <MessageCircle className="mr-2 group-hover:scale-110 transition-transform" size={18} />
                WhatsApp Assistance
              </Button>
            </motion.div>
          </motion.div>

          {/* Right side - Floating product with ambient light */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="relative lg:min-h-[650px] flex items-center justify-center"
          >
            {/* Ambient light effects positioned on the right */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-accent/10 via-foreground/5 to-transparent rounded-full blur-3xl"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.2, 0.35, 0.2],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-foreground/8 to-transparent rounded-full blur-3xl"
                animate={{
                  scale: [1, 1.12, 1],
                  opacity: [0.15, 0.25, 0.15],
                }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>

            {/* Soft ambient glow behind product */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.1, 0.15, 0.1],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="w-[400px] h-[400px] bg-foreground/10 rounded-full blur-3xl" />
            </motion.div>

            {/* Floating product with subtle rotation */}
            <motion.div
              className="relative z-10"
              animate={{
                y: [0, -12, 0],
                rotate: [-2, 2, -2],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <img
                src={heroImage}
                alt="Premium electrical component - precision engineered switch"
                className="w-full max-w-md lg:max-w-lg object-contain drop-shadow-2xl"
              />
            </motion.div>

            {/* Minimal shadow halo */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-foreground/5 blur-2xl rounded-full" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PremiumHero;
