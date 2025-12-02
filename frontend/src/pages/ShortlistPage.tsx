import { useMemo } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import { Button } from '@/components/ui/button';
import { getProductById } from '@/data/mockData';
import { useApp } from '@/contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trash2, MessageCircle, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

const ShortlistPage = () => {
  const { shortlist, removeFromShortlist, trackWhatsAppClick } = useApp();

  const products = useMemo(() => 
    shortlist.map(id => getProductById(id)).filter(Boolean),
    [shortlist]
  );

  const handleSendAll = () => {
    trackWhatsAppClick();
    const productList = products.map(p => `- ${p!.sku}: ${p!.name}`).join('\n');
    const message = encodeURIComponent(`Hi! I'm interested in the following products:\n\n${productList}\n\nPlease share availability and pricing.`);
    window.open(`https://wa.me/919654102758?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Heart className="h-6 w-6 text-red-500 fill-red-500" />
              <h1 className="text-3xl font-semibold">Shortlist</h1>
            </div>
            <p className="text-muted-foreground">
              {products.length === 0 ? 'Your shortlist is empty' : `${products.length} saved items`}
            </p>
          </motion.div>

          {products.length > 0 && (
            <Button
              onClick={handleSendAll}
              className="w-full mb-6 gap-2 bg-emerald-500 hover:bg-emerald-600"
            >
              <MessageCircle className="h-5 w-5" />
              Send All for Quote
            </Button>
          )}

          <AnimatePresence mode="popLayout">
            {products.length > 0 ? (
              <div className="space-y-3">
                {products.map((product, idx) => (
                  <motion.div
                    key={product!.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4"
                  >
                    <div className="w-16 h-16 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold text-muted-foreground/30">
                        {product!.brand.charAt(0)}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${product!.id}`} className="hover:text-accent transition-colors">
                        <h3 className="font-medium truncate">{product!.name}</h3>
                      </Link>
                      <p className="text-sm text-muted-foreground">{product!.brand} · {product!.sku}</p>
                      <p className="font-semibold mt-1">₹{product!.listPrice.toLocaleString()}</p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeFromShortlist(product!.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-4">Start adding products to your shortlist</p>
                <Link to="/">
                  <Button>Browse Products</Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
};

export default ShortlistPage;
