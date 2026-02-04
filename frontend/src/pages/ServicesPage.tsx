import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import { SEOHead } from '@/components/SEOHead';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Package, 
  Headphones, 
  Wrench, 
  Shield, 
  Settings,
  CheckCircle,
  Phone
} from 'lucide-react';
import { useMagneticEffect } from '@/hooks/useMagneticEffect';

interface Service {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  features: string[];
}

const services: Service[] = [
  {
    id: 'bulk-ordering',
    title: 'Bulk Ordering Services',
    description: 'Competitive pricing and dedicated support for large-scale projects and contractors.',
    icon: Package,
    features: [
      'Volume discounts on bulk purchases',
      'Dedicated account manager',
      'Priority order processing',
      'Flexible payment terms',
      'Custom packaging options'
    ]
  },
  {
    id: 'technical-consultation',
    title: 'Technical Consultation',
    description: 'Expert guidance to help you select the right components for your specific requirements.',
    icon: Headphones,
    features: [
      'Free technical advice from experts',
      'Product specification assistance',
      'Load calculation support',
      'Compliance and safety guidance',
      'Alternative product recommendations'
    ]
  },
  {
    id: 'installation-support',
    title: 'Installation Support',
    description: 'Professional assistance to ensure proper installation and optimal performance.',
    icon: Wrench,
    features: [
      'Installation guidelines and manuals',
      'On-site technical support (select areas)',
      'Troubleshooting assistance',
      'Best practices documentation',
      'Post-installation verification'
    ]
  },
  {
    id: 'warranty-returns',
    title: 'Warranty & Returns',
    description: 'Hassle-free warranty claims and return process for your peace of mind.',
    icon: Shield,
    features: [
      'Manufacturer warranty support',
      'Easy return and exchange process',
      'Defect replacement guarantee',
      'Extended warranty options',
      'Quality assurance on all products'
    ]
  },
  {
    id: 'custom-solutions',
    title: 'Custom Solutions',
    description: 'Tailored electrical solutions designed to meet your unique project requirements.',
    icon: Settings,
    features: [
      'Custom product sourcing',
      'Project-specific recommendations',
      'Integration with existing systems',
      'Scalable solutions for growth',
      'Ongoing support and maintenance'
    ]
  }
];

const ServicesPageContent = () => {
  const { trackPageView } = useApp();
  const whatsappBtnRef = useMagneticEffect(0.2);

  useEffect(() => {
    trackPageView('services');
    window.scrollTo(0, 0);
  }, [trackPageView]);

  const handleContactClick = () => {
    const message = encodeURIComponent(
      "Hi! I'd like to know more about your services."
    );
    window.open(`https://wa.me/919810132827?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Services - New Delhi Electricals"
        description="Professional electrical services including bulk ordering, technical consultation, installation support, warranty assistance, and custom solutions for your projects."
        type="website"
      />
      
      <Header />
      <div className="h-16" />
      
      <main>
        {/* Hero Section */}
        <section className="py-24 px-4 bg-gradient-to-b from-background via-secondary/20 to-background">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight animate-fade-in">
              Professional Services
              <br />
              Tailored to Your Needs
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '100ms' }}>
              From bulk ordering to technical consultation, we provide comprehensive support 
              to ensure your electrical projects succeed.
            </p>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Our Services</h2>
              <div className="w-20 h-1 bg-accent mx-auto mb-6"></div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Comprehensive support at every stage of your electrical project
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <Card 
                  key={service.id}
                  className="hover-lift shadow-card hover:shadow-elevated transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                      <service.icon className="text-accent" size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {service.description}
                    </p>
                    <ul className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="text-accent flex-shrink-0 mt-0.5" size={16} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Our Services */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Why Choose Our Services</h2>
              <div className="w-20 h-1 bg-accent mx-auto"></div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-card/50 backdrop-blur-sm shadow-card">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Shield className="text-accent" size={24} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Expert Team</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Decades of combined experience in electrical components and systems
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm shadow-card">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="text-accent" size={24} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Quality Assured</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Only genuine products from authorized manufacturers and distributors
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm shadow-card">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Phone className="text-accent" size={24} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Always Available</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Responsive support team ready to assist with your queries
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-b from-background to-secondary/30">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Contact us today to discuss your requirements and discover how our services 
              can help your project succeed.
            </p>
            <button
              ref={whatsappBtnRef as any}
              onClick={handleContactClick}
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#25D366] text-white rounded-xl font-semibold hover:bg-[#20BA5A] transition-all duration-200 hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Contact Us on WhatsApp
            </button>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppFab />
    </div>
  );
};

const ServicesPage = () => {
  return (
    <ErrorBoundary>
      <ServicesPageContent />
    </ErrorBoundary>
  );
};

export default ServicesPage;
