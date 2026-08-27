import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ToggleRight, Shield, Cable, Box, LayoutGrid, ChevronRight, Thermometer } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SHOPPING_CATEGORIES } from "@/config/shoppingCategories";

const iconMap: Record<string, LucideIcon> = {
  "switches-sockets": ToggleRight,
  "plates": LayoutGrid,
  "circuit-protection": Shield,
  "wires-cables": Cable,
  "boxes": Box,
  "geysers": Thermometer,
};

const CategoryGrid = () => {
  return (
    <section className="py-16 md:py-24 px-4 md:px-6 lg:px-16 bg-background">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-14"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-accent mb-3 block">Our Products</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-3">
            Shop by Category
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Everything you need to build your complete electrical setup
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {SHOPPING_CATEGORIES.map((category, index) => {
            const IconComponent = iconMap[category.id] || ToggleRight;

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.06 }}
              >
                <Link to={`/category/${category.slug}`}>
                  <motion.div
                    className="group relative overflow-hidden rounded-2xl bg-card border border-border/60 hover:border-accent/30 transition-all duration-300 h-full"
                    whileHover={{ y: -4 }}
                  >
                    {/* Image area */}
                    <div className="relative h-44 overflow-hidden bg-gradient-to-br from-secondary/50 to-secondary/20">
                      <img
                        src={category.image}
                        alt={category.displayName}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      {/* Icon fallback */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <IconComponent className="h-14 w-14 text-muted-foreground/15 group-hover:text-accent/20 transition-colors duration-300" />
                      </div>
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                      {/* Step badge */}
                      <div className="absolute top-3 left-3 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                        Step {category.step}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors duration-200">
                            {category.displayName}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {category.tagline}
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all duration-200 flex-shrink-0 mt-0.5">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                      
                      {/* Sub-section tags */}
                      {category.subSections.length > 1 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {category.subSections.filter(s => s.id !== 'all').slice(0, 3).map(sub => (
                            <span
                              key={sub.id}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-muted-foreground font-medium"
                            >
                              {sub.name}
                            </span>
                          ))}
                          {category.subSections.length > 4 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-muted-foreground font-medium">
                              +{category.subSections.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
