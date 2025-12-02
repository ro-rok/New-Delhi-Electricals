import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import { categories, products } from '@/data/mockData';
import { ToggleRight, Cable, Zap, Lightbulb, Fan, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  ToggleRight,
  Cable,
  Zap,
  Lightbulb,
  Fan,
  Smartphone,
};

const CategoriesListPage = () => {
  const getCategoryCount = (categoryName: string) => {
    return products.filter(p => p.category.toLowerCase().includes(categoryName.toLowerCase())).length;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl font-semibold mb-4">Product Categories</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Browse our comprehensive range of electrical products for residential and commercial applications.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, idx) => {
              const IconComponent = iconMap[category.icon] || Zap;
              const count = getCategoryCount(category.name);
              
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Link
                    to={`/category/${category.slug}`}
                    className="block group bg-card rounded-2xl border border-border p-6 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">
                      <IconComponent className="h-7 w-7 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2 group-hover:text-accent transition-colors">
                      {category.name}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                    <span className="text-xs text-muted-foreground">{count} products</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
};

export default CategoriesListPage;
