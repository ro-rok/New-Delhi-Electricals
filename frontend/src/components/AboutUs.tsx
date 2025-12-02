import { Card } from "@/components/ui/card";
import { Heart, Award, Users, TrendingUp } from "lucide-react";

const stats = [
  { icon: Award, value: "27", label: "Years of Service", suffix: "+" },
  { icon: Users, value: "30,000", label: "Happy Customers", suffix: "+" },
  { icon: Heart, value: "100", label: "Genuine Products", suffix: "%" },
  { icon: TrendingUp, value: "1000", label: "Homes Built", suffix: "s" },
];

const AboutUs = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-secondary/30 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Story</h2>
            <div className="w-20 h-1 bg-accent mx-auto mb-6"></div>
          </div>

          <div className="prose prose-lg max-w-none mb-12 text-foreground">
            <p className="text-lg leading-relaxed text-center mb-8">
              Since <span className="font-bold text-primary">1998</span>, New Delhi Electricals has been more than just a shop—
              it's been a trusted partner in building dreams across Delhi.
            </p>

            <Card className="p-8 shadow-card mb-8 bg-card/50 backdrop-blur-sm">
              <p className="text-base leading-relaxed mb-4">
                Founded by <span className="font-semibold">Gulshan Ahuja</span> with a vision to bring genuine electrical 
                solutions to South Delhi, we've grown from a small corner shop to become the region's most trusted name 
                in electrical supplies.
              </p>
              
              <p className="text-base leading-relaxed mb-4">
                Over <span className="font-semibold text-primary">27 years</span>, we've had the privilege of serving 
                over 30,000 customers—from families building their dream homes to contractors constructing major projects. 
                Each relationship is built on three simple principles: <span className="font-semibold">honesty, quality, and speed</span>.
              </p>

              <p className="text-base leading-relaxed mb-4">
                What sets us apart isn't just our partnership with India's finest brands like ABB, Lauritz Knudsen, 
                Polycab, and Havells. It's the relationships we've built—contractors who've worked with us for decades, 
                families who return generation after generation, and distributors who trust us as partners, not just customers.
              </p>

              <p className="text-base leading-relaxed">
                Whether it's a midnight emergency or a massive construction project, we've been there. 
                With our same-day delivery across Delhi NCR through Porter, we ensure you never have to wait. 
                Because we know—when you're building something special, every moment counts.
              </p>
            </Card>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card key={stat.label} className="text-center p-6 shadow-card hover:shadow-elevated transition-shadow">
                <stat.icon className="mx-auto mb-3 text-primary" size={36} />
                <div className="text-3xl font-bold text-primary mb-1">
                  {stat.value}
                  <span className="text-xl">{stat.suffix}</span>
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;