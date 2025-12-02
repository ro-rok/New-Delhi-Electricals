import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Shield, Truck, Clock, Award, DollarSign } from "lucide-react";

const reasons = [
  {
    icon: Award,
    title: "27 Years Legacy",
    description: "Nearly three decades of trusted service since 1998",
  },
  {
    icon: Shield,
    title: "Authorized Partners",
    description: "Official retail partners for ABB, L&K, Polycab, Vion, Havells",
  },
  {
    icon: Truck,
    title: "Fastest Delivery",
    description: "Same-day delivery in South Delhi & across NCR via Porter",
  },
  {
    icon: CheckCircle2,
    title: "100% Genuine",
    description: "Only authentic products directly from authorized distributors",
  },
  {
    icon: Clock,
    title: "30,000+ Customers",
    description: "Serving families, contractors, and builders with excellence",
  },
  {
    icon: DollarSign,
    title: "Honest Pricing",
    description: "Transparent, competitive rates with no hidden charges",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Why Choose New Delhi Electricals?</h2>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            When it comes to electrical solutions, trust matters. Here's why thousands choose us.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {reasons.map((reason) => (
            <Card key={reason.title} className="bg-card/10 backdrop-blur-sm border-primary-foreground/20 shadow-elevated hover:bg-card/20 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                  <reason.icon className="text-accent" size={24} />
                </div>
                <CardTitle className="text-xl text-primary-foreground">{reason.title}</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  {reason.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;