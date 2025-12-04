import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { getProductById } from '@/api/products';
import ProductCard from './ProductCard';
import { motion } from 'framer-motion';
import { Product } from '@/types/product';

const RecentlyViewed = () => {
  const { recentlyViewed } = useApp();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const productPromises = recentlyViewed.map(id => getProductById(id));
      const fetchedProducts = await Promise.all(productPromises);
      setProducts(fetchedProducts.filter(Boolean) as Product[]);
    };
    if (recentlyViewed.length > 0) {
      fetchProducts();
    } else {
      setProducts([]);
    }
  }, [recentlyViewed]);

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
