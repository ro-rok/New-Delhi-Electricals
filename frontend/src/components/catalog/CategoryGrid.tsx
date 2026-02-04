import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCategories } from "@/api/products";
import { Category } from "@/types/product";
import switchesImg from "@/assets/switches.jpg";
import wiresImg from "@/assets/wires-cables.jpg";
import mcbsImg from "@/assets/mcb-hero.jpg";
import dbsImg from "@/assets/db-hero.jpg";
import smartHomeImg from "@/assets/smart-home-hero.jpg";
import industrialImg from "@/assets/industrial-hero.jpg";

// Image mapping for categories
const categoryImages: Record<string, string> = {
  "switches": switchesImg,
  "wires---cables": wiresImg,
  "wires-&-cables": wiresImg,
  "circuit-protection": mcbsImg,
  "distribution-boards": dbsImg,
  "smart-home": smartHomeImg,
  "industrial": industrialImg,
  "bell-push": switchesImg,
  "boxes": dbsImg,
};

const CategoryGrid = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await getCategories();
        // Limit to first 6 categories for the home page
        setCategories(cats.slice(0, 6));
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Get image for category based on slug
  const getCategoryImage = (slug: string) => {
    return categoryImages[slug] || mcbsImg; // Default to MCB image
  };

  if (loading) {
    return (
      <section className="py-16 md:py-24 px-4 md:px-6 lg:px-16 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-12 md:mb-16 space-y-3">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-foreground">
              Shop by Category
            </h2>
            <p className="text-muted-foreground text-base md:text-lg font-light max-w-2xl mx-auto">
              Discover our comprehensive range of precision electrical components
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 px-4 md:px-6 lg:px-16 bg-background">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 md:mb-16 space-y-3"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-foreground">
            Shop by Category
          </h2>
          <p className="text-muted-foreground text-base md:text-lg font-light max-w-2xl mx-auto">
            Discover our comprehensive range of precision electrical components
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.08 }}
            >
              <Link to={`/category/${category.slug}`}>
                <motion.div
                  className="group relative overflow-hidden rounded-2xl border-2 border-border/40 bg-card hover:shadow-elevated transition-all duration-500 h-full"
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Product image with soft gradient overlay */}
                  <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10">
                    <motion.img
                      src={getCategoryImage(category.slug)}
                      alt={category.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    {/* Subtle overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-card/20 to-transparent" />
                  </div>

                  {/* Content overlay - clean and minimal */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-card via-card/95 to-transparent backdrop-blur-sm">
                    <h3 className="text-xl md:text-2xl font-normal text-foreground mb-1 group-hover:text-accent transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-muted-foreground text-sm font-light">
                      {category.description}
                    </p>
                  </div>

                  {/* Subtle hover arrow */}
                  <motion.div
                    className="absolute top-6 right-6 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    whileHover={{ scale: 1.1 }}
                  >
                    →
                  </motion.div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
