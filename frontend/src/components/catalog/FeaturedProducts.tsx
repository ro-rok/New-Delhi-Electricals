import { getFeaturedProducts, brands } from '@/data/mockData';
import ProductCard from './ProductCard';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRef } from 'react';
import switchImage from '@/assets/product-switch-premium.jpg';
import mcbImage from '@/assets/product-mcb-premium.jpg';
import wireImage from '@/assets/product-wire-premium.jpg';

const featuredImages = [switchImage, mcbImage, wireImage];

const FeaturedProducts = () => {
  const featuredBrands = brands.filter(b => b.featured).slice(0, 3);
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section ref={sectionRef} className="py-32 bg-secondary/20">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12">
        {featuredBrands.map((brand, brandIdx) => {
          const brandProducts = getFeaturedProducts(brand.name);
          if (brandProducts.length === 0) return null;

          return (
            <motion.div
              key={brand.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: brandIdx * 0.2 }}
              className="mb-32 last:mb-0"
            >
              {/* Hero Section for each brand */}
              <div className="mb-16">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  {/* Text Side */}
                  <div className="space-y-6">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      Featured Collection
                    </p>
                    <h2 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
                      {brand.name}
                      <br />
                      <span className="text-muted-foreground">Series</span>
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                      {brand.description}
                    </p>
                    <Link
                      to={`/brand/${brand.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all duration-300 group"
                    >
                      Explore Collection
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                    </Link>
                  </div>

                  {/* Image Side with parallax */}
                  <motion.div 
                    style={{ y: y }}
                    className="relative"
                  >
                    <div className="relative rounded-3xl overflow-hidden bg-background border border-border/50 p-12 aspect-square flex items-center justify-center">
                      <img
                        src={featuredImages[brandIdx % featuredImages.length]}
                        alt={`${brand.name} products`}
                        className="w-full h-auto object-contain drop-shadow-xl"
                      />
                    </div>
                    {/* Ambient glow */}
                    <div className="absolute inset-0 -z-10 bg-accent/5 blur-3xl rounded-full" />
                  </motion.div>
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                {brandProducts.slice(0, 5).map((product, idx) => (
                  <ProductCard key={product.id} product={product} index={idx} />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default FeaturedProducts;
