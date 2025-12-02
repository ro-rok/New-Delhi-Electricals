import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import { brands } from '@/data/mockData';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const BrandsListPage = () => {
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
            <h1 className="text-4xl font-semibold mb-4">Our Brands</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Authorized partners for India's most trusted electrical brands. 
              Only genuine products with full warranty support.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brands.map((brand, idx) => (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link
                  to={`/brand/${brand.slug}`}
                  className="block group bg-card rounded-2xl border border-border p-6 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-5xl font-bold text-muted-foreground/20">
                      {brand.name.charAt(0)}
                    </span>
                    {brand.featured && (
                      <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full">
                        Authorized Partner
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold mb-2 group-hover:text-accent transition-colors">
                    {brand.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">{brand.description}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">
                    View Products
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
};

export default BrandsListPage;
