import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Cable, Lightbulb, Fan, Droplets, Box } from "lucide-react";
import switchesImg from "@/assets/switches.jpg";
import wiresImg from "@/assets/wires-cables.jpg";
import lightsImg from "@/assets/lights.jpg";
import fansImg from "@/assets/fans.jpg";

const categories = [
  {
    title: "Switches & MCBs",
    description: "Premium switches, MCBs, and distribution boards",
    brands: ["Lauritz Knudsen", "ABB"],
    icon: Zap,
    image: switchesImg,
    badge: "Authorized Partner",
  },
  {
    title: "Wires & Cables",
    description: "High-quality wiring solutions for all applications",
    brands: ["Polycab", "Finolex"],
    icon: Cable,
    image: wiresImg,
    badge: "Premium Quality",
  },
  {
    title: "Lighting Solutions",
    description: "Surface, concealed, and panel lights",
    brands: ["Vion Lights"],
    icon: Lightbulb,
    image: lightsImg,
    badge: "Authorized Partner",
  },
  {
    title: "Ceiling Fans",
    description: "Energy-efficient and stylish ceiling fans",
    brands: ["Havells", "Crompton"],
    icon: Fan,
    image: fansImg,
    badge: "Top Brands",
  },
  {
    title: "Water Heaters",
    description: "Reliable geysers for instant hot water",
    brands: ["AO Smith", "Crompton"],
    icon: Droplets,
    image: null,
    badge: "Trusted Quality",
  },
  {
    title: "Building Essentials",
    description: "PVC pipes, C-channels, and all construction materials",
    brands: ["Multiple Brands"],
    icon: Box,
    image: null,
    badge: "Complete Range",
  },
];

const ProductCategories = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Our Product Range</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From switches to complete electrical solutions for building construction. 
            Authorized partners for India's most trusted brands.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category.title} className="shadow-card hover:shadow-elevated transition-shadow overflow-hidden group">
              {category.image ? (
                <div className="h-48 overflow-hidden bg-muted">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
                  <category.icon size={64} className="text-primary/20" />
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <category.icon className="text-primary" size={28} />
                  <Badge variant="secondary" className="text-xs">
                    {category.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{category.title}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {category.brands.map((brand) => (
                    <span
                      key={brand}
                      className="text-xs px-2 py-1 bg-primary/5 text-primary font-medium rounded-full"
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Can't find what you're looking for? We stock everything for electrical construction.
          </p>
          <a
            href="#enquiry-form"
            className="text-primary font-semibold hover:underline"
          >
            Contact us for your specific requirements →
          </a>
        </div>
      </div>
    </section>
  );
};

export default ProductCategories;