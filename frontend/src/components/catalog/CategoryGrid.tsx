import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { useRef } from "react";
import switchesImg from "@/assets/switches.jpg";
import wiresImg from "@/assets/wires-cables.jpg";
import mcbsImg from "@/assets/mcb-hero.jpg";
import dbsImg from "@/assets/db-hero.jpg";
import smartHomeImg from "@/assets/smart-home-hero.jpg";
import industrialImg from "@/assets/industrial-hero.jpg";

const categories = [
  {
    name: "Switches",
    slug: "switches",
    image: switchesImg,
    description: "Modular switches and sockets",
  },
  {
    name: "Wires & Cables",
    slug: "wires-cables",
    image: wiresImg,
    description: "Premium electrical wires",
  },
  {
    name: "MCBs",
    slug: "mcbs",
    image: mcbsImg,
    description: "Circuit protection devices",
  },
  {
    name: "Distribution Boards",
    slug: "distribution-boards",
    image: dbsImg,
    description: "Power distribution solutions",
  },
  {
    name: "Smart Home",
    slug: "smart-home",
    image: smartHomeImg,
    description: "Connected home solutions",
  },
  {
    name: "Industrial",
    slug: "industrial",
    image: industrialImg,
    description: "Heavy-duty components",
  },
];

const CategoryGrid = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [80, -80]);

  return (
    <section ref={sectionRef} className="py-24 px-6 lg:px-16 bg-background">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 space-y-3"
        >
          <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground">
            Shop by Category
          </h2>
          <p className="text-muted-foreground text-lg font-light max-w-2xl mx-auto">
            Discover our comprehensive range of precision electrical components
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.slug}
              style={{ y: index % 2 === 0 ? y : useTransform(scrollYProgress, [0, 1], [-40, 40]) }}
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
                      src={category.image}
                      alt={category.name}
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
