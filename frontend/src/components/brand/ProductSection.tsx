import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '@/components/catalog/ProductCard';
import type { Product } from '@/types/product';

interface ProductSectionProps {
  title: string;
  products: Product[];
  categorySlug?: string;
  index: number;
}

const ProductSection = ({ title, products, categorySlug, index }: ProductSectionProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      className="py-16"
    >
      <div className="container max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
              {title}
            </h2>
            <div className="h-0.5 w-16 bg-foreground/10 rounded-full" />
          </div>

          {categorySlug && (
            <Link
              to={`/category/${categorySlug}`}
              className="group hidden sm:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              <span>View all</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
            </Link>
          )}
        </div>

        {/* Horizontal scrolling grid */}
        <div className="relative -mx-6 lg:-mx-12">
          <div className="overflow-x-auto hide-scrollbar px-6 lg:px-12">
            <div className="flex gap-4 lg:gap-6 pb-4 min-w-max lg:min-w-0 lg:grid lg:grid-cols-5">
              {products.map((product, idx) => (
                <div key={product.id} className="w-56 lg:w-auto">
                  <ProductCard product={product} index={idx} />
                </div>
              ))}
            </div>
          </div>

          {/* Fade edges on mobile */}
          <div className="lg:hidden pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent" />
          <div className="lg:hidden pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
        </div>

        {/* Mobile view all link */}
        {categorySlug && (
          <Link
            to={`/category/${categorySlug}`}
            className="sm:hidden flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 mt-6"
          >
            <span>View all {title}</span>
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        )}
      </div>
    </motion.section>
  );
};

export default ProductSection;
