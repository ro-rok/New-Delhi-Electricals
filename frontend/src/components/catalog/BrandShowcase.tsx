import { Link } from 'react-router-dom';
import { brands } from '@/data/mockData';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const BrandShowcase = () => {
  const featuredBrands = brands.filter(b => b.featured);
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <section ref={sectionRef} className="py-24 border-y border-border/50">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          style={{ y }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Authorized Partners
          </p>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-12 lg:gap-16">
          {featuredBrands.map((brand, idx) => (
            <motion.div
              key={brand.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: idx * 0.1 }}
            >
              <Link
                to={`/brand/${brand.slug}`}
                className="block group relative"
              >
                <span className="text-2xl md:text-3xl font-semibold text-muted-foreground/30 group-hover:text-foreground/80 transition-all duration-700 tracking-tight">
                  {brand.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandShowcase;
