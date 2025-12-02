import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import AboutUs from '@/components/AboutUs';
import WhyChooseUs from '@/components/WhyChooseUs';
import { useApp } from '@/contexts/AppContext';
import { Shield, Award, Heart, Zap, Target, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useMagneticEffect } from '@/hooks/useMagneticEffect';

const values = [
  {
    icon: Target,
    title: "Precision",
    description: "Every component meets exact specifications and international standards"
  },
  {
    icon: Shield,
    title: "Reliability",
    description: "Only genuine products from authorized distributors you can trust"
  },
  {
    icon: Heart,
    title: "Service",
    description: "Customer-first approach with expert guidance at every step"
  },
  {
    icon: Award,
    title: "Integrity",
    description: "Transparent pricing and honest recommendations, always"
  }
];

const AboutPage = () => {
  const { trackPageView } = useApp();
  const whatsappBtnRef = useMagneticEffect(0.2);

  useEffect(() => {
    trackPageView('about');
    window.scrollTo(0, 0);
  }, [trackPageView]);

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(
      "Hi! I'd like to know more about New Delhi Electricals."
    );
    window.open(`https://wa.me/919810132827?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="h-16" />
      
      <main>
        {/* Hero Section */}
        <section className="py-24 px-4 bg-gradient-to-b from-background via-secondary/20 to-background">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight animate-fade-in">
              Building Trust Through
              <br />
              Precision Engineering
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '100ms' }}>
              For nearly three decades, New Delhi Electricals has been the trusted partner 
              for electrical excellence in South Delhi. We don't just supply components—we 
              deliver precision, reliability, and peace of mind.
            </p>
          </div>
        </section>

        {/* About Story */}
        <AboutUs />

        {/* Mission Section */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Our Mission</h2>
              <div className="w-20 h-1 bg-accent mx-auto"></div>
            </div>
            <Card className="bg-card/50 backdrop-blur-sm shadow-card">
              <CardContent className="p-8 md:p-12">
                <p className="text-lg text-center leading-relaxed text-foreground/90">
                  To empower every home, building, and industrial project with genuine, 
                  high-performance electrical components—backed by expert guidance, honest 
                  pricing, and unmatched customer service. We believe electrical safety and 
                  reliability should never be compromised.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Values */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Our Values</h2>
              <div className="w-20 h-1 bg-accent mx-auto mb-6"></div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <Card 
                  key={value.title} 
                  className="hover-lift shadow-card hover:shadow-elevated transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                      <value.icon className="text-accent" size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Promise Section */}
        <section className="py-20 bg-gradient-to-b from-secondary/30 to-background">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Our Promise</h2>
              <div className="w-20 h-1 bg-accent mx-auto"></div>
            </div>
            <Card className="bg-card/50 backdrop-blur-sm shadow-card">
              <CardContent className="p-8 md:p-12">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                      <Shield className="text-accent" size={24} strokeWidth={1.5} />
                    </div>
                    <h3 className="font-semibold mb-2">100% Genuine</h3>
                    <p className="text-sm text-muted-foreground">
                      Only authentic products from authorized sources
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                      <Zap className="text-accent" size={24} strokeWidth={1.5} />
                    </div>
                    <h3 className="font-semibold mb-2">Verified Specs</h3>
                    <p className="text-sm text-muted-foreground">
                      Every component meets exact technical standards
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                      <Users className="text-accent" size={24} strokeWidth={1.5} />
                    </div>
                    <h3 className="font-semibold mb-2">Expert Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Technical guidance from experienced professionals
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Why Choose Us */}
        <WhyChooseUs />

        {/* WhatsApp CTA */}
        <section className="py-20 bg-gradient-to-b from-background to-secondary/30">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Have Questions? We're Here to Help
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect with our team on WhatsApp for instant assistance, product recommendations, 
              or technical guidance.
            </p>
            <button
              ref={whatsappBtnRef as any}
              onClick={handleWhatsAppClick}
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#25D366] text-white rounded-xl font-semibold hover:bg-[#20BA5A] transition-all duration-200 hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Chat on WhatsApp
            </button>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppFab />
    </div>
  );
};

export default AboutPage;