import { motion } from "framer-motion";
import switchImage from "@/assets/product-switch-premium.jpg";
import mcbImage from "@/assets/product-mcb-premium.jpg";
import wireImage from "@/assets/product-wire-premium.jpg";
import lightImage from "@/assets/product-light-premium.jpg";
import { Link } from "react-router-dom";

interface FeaturedProduct {
  id: string;
  name: string;
  series: string;
  image: string;
  slug: string;
}

const featuredProducts: FeaturedProduct[] = [
  {
    id: "1",
    name: "Premium Modular Switch",
    series: "Premium Series",
    image: switchImage,
    slug: "premium-switch",
  },
  {
    id: "2",
    name: "Industrial MCB",
    series: "Pro Series",
    image: mcbImage,
    slug: "industrial-mcb",
  },
  {
    id: "3",
    name: "High-Grade Wire",
    series: "Elite Series",
    image: wireImage,
    slug: "high-grade-wire",
  },
  {
    id: "4",
    name: "Smart LED Panel",
    series: "Smart Series",
    image: lightImage,
    slug: "smart-led-panel",
  },
];

interface FeaturedCollectionProps {
  brandName: string;
}

const FeaturedCollection = ({ brandName }: FeaturedCollectionProps) => {
  return (
    <section className="py-20 px-6 lg:px-16 bg-gradient-to-b from-muted/20 to-background">
      <div className="container mx-auto">
        {/* Section header - ultra-clean */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 space-y-3"
        >
          <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground">
            Featured Series from {brandName}
          </h2>
          <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
            A curated selection of precision-engineered components
          </p>
        </motion.div>

        {/* Masonry-style product grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Link to={`/product/${product.slug}`}>
                <motion.div
                  className={`group relative overflow-hidden rounded-2xl bg-card border border-border/50 shadow-soft hover:shadow-elevated transition-all duration-500 ${
                    index === 0 || index === 3 ? "lg:row-span-2" : ""
                  }`}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Product image with soft gradient overlay */}
                  <div className="aspect-square overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10">
                    <motion.img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>

                  {/* Product info overlay - minimal */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-card/95 via-card/90 to-transparent backdrop-blur-sm"
                    initial={{ opacity: 0.9 }}
                    whileHover={{ opacity: 1 }}
                  >
                    <p className="text-xs text-muted-foreground font-light mb-1">
                      {product.product_family}
                    </p>
                    <h3 className="text-base md:text-lg font-normal text-foreground">
                      {product.name}
                    </h3>
                  </motion.div>

                  {/* Subtle hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/0 via-transparent to-accent/0 group-hover:from-accent/5 group-hover:to-accent/5 transition-all duration-500 pointer-events-none" />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View all link - minimal */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link
            to={`/brands/${brandName.toLowerCase()}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-light"
          >
            View all products from {brandName}
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedCollection;
