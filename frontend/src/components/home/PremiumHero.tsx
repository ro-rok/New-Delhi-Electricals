import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle, Zap, Shield, Truck } from "lucide-react";
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
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Dark gradient background */}
      <div className="absolute inset-0" style={{ background: 'var(--gradient-hero)' }} />
      
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />
      
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-400/8 rounded-full blur-[100px]" />

      <div className="container relative z-10 mx-auto px-6 lg:px-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-white/80">Authorized Partner · Since 1998</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
            >
              Build Your
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Electrical Setup
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-base md:text-lg text-white/60 font-light leading-relaxed max-w-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
            >
              Premium switches, sockets, MCBs, wires, and complete electrical solutions from India's most trusted brands.
            </motion.p>

            {/* Trust stats */}
            <motion.div
              className="flex items-center gap-6 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.35 }}
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-400" />
                <span className="text-white/70 font-medium">3000+ Products</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-400" />
                <span className="text-white/70 font-medium">27 Years Trust</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-400" />
                <span className="text-white/70 font-medium">Delhi NCR</span>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              className="flex flex-col sm:flex-row gap-3 pt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
            >
              <Button
                ref={primaryBtnRef as any}
                size="lg"
                onClick={() => navigate("/categories")}
                className="group bg-white text-gray-900 hover:bg-white/90 font-semibold text-base px-8 h-12 rounded-xl shadow-lg shadow-white/10 transition-all duration-200 hover:shadow-xl hover:shadow-white/20"
              >
                Shop Now
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
              </Button>
              <Button
                ref={secondaryBtnRef as any}
                size="lg"
                onClick={handleWhatsApp}
                className="group text-base px-8 h-12 rounded-xl border border-white/20 bg-transparent text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200"
              >
                <MessageCircle className="mr-2 group-hover:scale-110 transition-transform" size={18} />
                WhatsApp Us
              </Button>
            </motion.div>
          </motion.div>

          {/* Right side - Product image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="relative hidden lg:flex items-center justify-center min-h-[500px]"
          >
            {/* Glow behind product */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[450px] h-[450px] bg-blue-500/15 rounded-full blur-[80px] animate-pulse" />
            </div>
            
            {/* Product image */}
            <motion.div
              className="relative z-10"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <img
                src={heroImage}
                alt="Premium electrical components"
                className="w-full max-w-lg object-contain drop-shadow-2xl"
              />
            </motion.div>

            {/* Floating badges */}
            <motion.div
              className="absolute top-16 right-8 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 z-20"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <div className="text-xs font-semibold text-white">500+</div>
              <div className="text-[10px] text-white/60">SKUs in Stock</div>
            </motion.div>

            <motion.div
              className="absolute bottom-24 left-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 z-20"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            >
              <div className="text-xs font-semibold text-white">Top Brands</div>
              <div className="text-[10px] text-white/60">Anchor · Havells · Polycab</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PremiumHero;
