import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBrands } from '@/api/products';
import { Brand } from '@/types/product';
import { motion } from 'framer-motion';

const BrandShowcase = () => {
  const [featuredBrands, setFeaturedBrands] = useState<Brand[]>([]);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const brandsList = await getBrands();
        const featured = brandsList.filter(b => b.featured);
        // If no featured brands, show all brands (up to 8)
        setFeaturedBrands(featured.length > 0 ? featured : brandsList.slice(0, 8));
      } catch (error) {
        console.error('Failed to fetch brands:', error);
      }
    };
    fetchBrands();
  }, []);

  // Don't render if no brands available
  if (featuredBrands.length === 0) {
    return null;
  }

  return (
    <section className="py-24 border-y border-border/50">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
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
