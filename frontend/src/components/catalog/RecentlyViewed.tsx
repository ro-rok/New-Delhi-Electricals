import { useApp } from '@/contexts/AppContext';
import { getProductById } from '@/data/mockData';
import ProductCard from './ProductCard';
import { motion } from 'framer-motion';

const RecentlyViewed = () => {
  const { recentlyViewed } = useApp();
  
  const products = recentlyViewed
    .map(id => getProductById(id))
    .filter(Boolean)
    .slice(0, 5);

  if (products.length === 0) return null;

  return (
    <section className="py-20 border-t border-border/50">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-8">
            Recently Viewed
          </p>
          
          <div className="flex gap-4 lg:gap-6 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
            {products.map((product, idx) => (
              <div key={product!.id} className="flex-shrink-0 w-64">
                <ProductCard product={product!} index={idx} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default RecentlyViewed;
