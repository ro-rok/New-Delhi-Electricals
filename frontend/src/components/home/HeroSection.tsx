import { useState, useEffect } from 'react';
import { Search, Zap, Cable, ToggleLeft, CircuitBoard, Lightbulb, Fan } from 'lucide-react';
import SearchModal from '@/components/catalog/SearchModal';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const categoryIcons = [
  { icon: ToggleLeft, label: 'Switches', slug: 'switches', color: 'from-blue-500/20 to-blue-600/10' },
  { icon: Cable, label: 'Wires', slug: 'wires-cables', color: 'from-amber-500/20 to-amber-600/10' },
  { icon: CircuitBoard, label: 'MCBs', slug: 'mcbs', color: 'from-emerald-500/20 to-emerald-600/10' },
  { icon: Zap, label: 'DBs', slug: 'distribution-boards', color: 'from-purple-500/20 to-purple-600/10' },
  { icon: Lightbulb, label: 'Lights', slug: 'lights', color: 'from-yellow-500/20 to-yellow-600/10' },
  { icon: Fan, label: 'Fans', slug: 'fans', color: 'from-cyan-500/20 to-cyan-600/10' },
];

const HeroSection = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <section className="relative min-h-[85vh] flex items-center justify-center pt-20 pb-12 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 via-background to-background" />
        
        {/* Floating shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-[10%] w-64 h-64 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl"
          />
          <motion.div
            animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1/4 right-[10%] w-96 h-96 bg-gradient-to-br from-accent/5 to-transparent rounded-full blur-3xl"
          />
        </div>

        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm text-muted-foreground mb-8 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                27 Years of Trusted Service
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight mb-6"
            >
              <span className="block">Premium Electrical</span>
              <span className="block text-muted-foreground/60">Solutions</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Authorized partner for ABB, Lauritz Knudsen, Polycab & more.
              <br className="hidden sm:block" />
              Same-day delivery across Delhi NCR.
            </motion.p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex justify-center mb-12"
            >
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-full max-w-xl flex items-center gap-4 px-6 py-4 bg-card border border-border rounded-2xl text-muted-foreground hover:border-muted-foreground/30 hover:shadow-lg transition-all duration-300 group"
              >
                <Search className="h-5 w-5 group-hover:text-foreground transition-colors" />
                <span className="flex-1 text-left">Search products, SKUs, brands...</span>
                <kbd className="hidden sm:inline-flex px-2.5 py-1 bg-secondary rounded-lg text-xs font-medium">⌘K</kbd>
              </button>
            </motion.div>

            {/* Category Icons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-3 md:grid-cols-6 gap-4 max-w-3xl mx-auto mb-12"
            >
              {categoryIcons.map((cat, idx) => (
                <motion.div
                  key={cat.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + idx * 0.05 }}
                >
                  <Link
                    to={`/category/${cat.slug}`}
                    className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary/20 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <cat.icon className="h-6 w-6 text-foreground" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      {cat.label}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex items-center justify-center gap-8 md:gap-12 text-sm"
            >
              {[
                { value: '30K+', label: 'Customers' },
                { value: 'Same Day', label: 'Delivery' },
                { value: '100%', label: 'Genuine' },
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-lg md:text-xl font-semibold text-foreground">{stat.value}</p>
                  <p className="text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
};

export default HeroSection;
