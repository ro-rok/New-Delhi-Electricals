import { useEffect, useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import { SEOHead } from '@/components/SEOHead';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, HelpCircle } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // Ordering
  {
    id: 'order-1',
    question: 'How do I place an order?',
    answer: 'You can browse our catalog, add items to your shortlist or cart, and contact us via WhatsApp or phone to complete your order. We also accept orders through email and in-person visits to our store.',
    category: 'Ordering'
  },
  {
    id: 'order-2',
    question: 'What is the minimum order quantity?',
    answer: 'We accept orders of all sizes, from single units to bulk quantities. For bulk orders, we offer special pricing and dedicated support. Contact us to discuss your specific requirements.',
    category: 'Ordering'
  },
  {
    id: 'order-3',
    question: 'Can I get a quote before ordering?',
    answer: 'Yes! You can request a quote by contacting us with your product list. We will provide a detailed quotation including pricing, availability, and delivery timeline.',
    category: 'Ordering'
  },
  {
    id: 'order-4',
    question: 'Do you offer bulk discounts?',
    answer: 'Yes, we offer competitive pricing for bulk orders. The discount varies based on order quantity and product type. Contact our sales team for a customized quote.',
    category: 'Ordering'
  },
  
  // Shipping & Delivery
  {
    id: 'shipping-1',
    question: 'What are your delivery areas?',
    answer: 'We primarily serve Delhi NCR and surrounding areas. For orders outside this region, please contact us to discuss delivery options and charges.',
    category: 'Shipping'
  },
  {
    id: 'shipping-2',
    question: 'How long does delivery take?',
    answer: 'Delivery typically takes 1-3 business days within Delhi NCR for in-stock items. Bulk orders and custom requirements may take longer. We will provide an estimated delivery date when you place your order.',
    category: 'Shipping'
  },
  {
    id: 'shipping-3',
    question: 'Do you charge for delivery?',
    answer: 'Delivery charges depend on order value, location, and quantity. We offer free delivery for orders above a certain value within Delhi NCR. Contact us for specific details.',
    category: 'Shipping'
  },
  {
    id: 'shipping-4',
    question: 'Can I pick up my order from your store?',
    answer: 'Yes, you can pick up your order from our store in South Delhi. We will notify you when your order is ready for pickup.',
    category: 'Shipping'
  },
  
  // Returns & Warranty
  {
    id: 'returns-1',
    question: 'What is your return policy?',
    answer: 'We accept returns for defective or damaged products within 7 days of delivery. Products must be unused and in original packaging. Contact us immediately if you receive a defective item.',
    category: 'Returns'
  },
  {
    id: 'returns-2',
    question: 'How do I claim warranty?',
    answer: 'All products come with manufacturer warranty. To claim warranty, contact us with your purchase details and product issue. We will coordinate with the manufacturer for repair or replacement.',
    category: 'Returns'
  },
  {
    id: 'returns-3',
    question: 'Can I exchange a product?',
    answer: 'Yes, exchanges are possible for defective products or if you received the wrong item. Contact us within 7 days of delivery to initiate an exchange.',
    category: 'Returns'
  },
  {
    id: 'returns-4',
    question: 'What if I receive a damaged product?',
    answer: 'If you receive a damaged product, please contact us immediately with photos of the damage. We will arrange for a replacement or refund as per your preference.',
    category: 'Returns'
  },
  
  // Technical & Products
  {
    id: 'tech-1',
    question: 'Are all products genuine?',
    answer: 'Yes, we only sell 100% genuine products from authorized manufacturers and distributors. All products come with proper documentation and manufacturer warranty.',
    category: 'Technical'
  },
  {
    id: 'tech-2',
    question: 'Can you help me choose the right product?',
    answer: 'Absolutely! Our technical team can help you select the right components based on your requirements. Contact us with your specifications, and we will provide expert recommendations.',
    category: 'Technical'
  },
  {
    id: 'tech-3',
    question: 'Do you provide installation support?',
    answer: 'We provide installation guidelines and technical support. For select areas, we can also arrange on-site technical assistance. Contact us to discuss your installation needs.',
    category: 'Technical'
  },
  {
    id: 'tech-4',
    question: 'What brands do you carry?',
    answer: 'We carry a wide range of premium brands including Polycab, Havells, Legrand, Schneider Electric, Siemens, ABB, and many more. Browse our catalog to see our complete product range.',
    category: 'Technical'
  },
  {
    id: 'tech-5',
    question: 'Do you have product specifications available?',
    answer: 'Yes, detailed specifications are available for all products on our website. You can also request technical datasheets by contacting us.',
    category: 'Technical'
  },
  
  // Payment
  {
    id: 'payment-1',
    question: 'What payment methods do you accept?',
    answer: 'We accept cash, bank transfer, UPI, and credit/debit cards. For bulk orders, we also offer flexible payment terms for registered businesses.',
    category: 'Payment'
  },
  {
    id: 'payment-2',
    question: 'Do you provide invoices?',
    answer: 'Yes, we provide proper GST invoices for all orders. Invoices are sent via email and included with the delivery.',
    category: 'Payment'
  },
  {
    id: 'payment-3',
    question: 'Can I pay after delivery?',
    answer: 'Cash on delivery is available for select orders within Delhi NCR. For bulk orders and registered businesses, we offer credit terms subject to approval.',
    category: 'Payment'
  }
];

const categories = ['All', 'Ordering', 'Shipping', 'Returns', 'Technical', 'Payment'];

const FAQPageContent = () => {
  const { trackPageView } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    trackPageView('faq');
    window.scrollTo(0, 0);
  }, [trackPageView]);

  const filteredFAQs = useMemo(() => {
    let filtered = faqData;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        faq =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="FAQ - Frequently Asked Questions | New Delhi Electricals"
        description="Find answers to common questions about ordering, shipping, returns, warranties, technical specifications, and payment methods at New Delhi Electricals."
        type="website"
      />
      
      <Header />
      <div className="h-16" />
      
      <main>
        {/* Hero Section */}
        <section className="py-24 px-4 bg-gradient-to-b from-background via-secondary/20 to-background">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="flex justify-center mb-6">
              <HelpCircle className="text-accent" size={64} strokeWidth={1.5} />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight animate-fade-in">
              Frequently Asked Questions
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '100ms' }}>
              Find answers to common questions about our products, services, and policies.
            </p>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="py-12 bg-secondary/30">
          <div className="container mx-auto px-4 max-w-4xl">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  className="cursor-pointer px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            {filteredFAQs.length > 0 ? (
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFAQs.map((faq, index) => (
                      <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionTrigger className="text-left hover:no-underline">
                          <div className="flex items-start gap-3">
                            <span className="text-accent font-semibold flex-shrink-0">
                              {index + 1}.
                            </span>
                            <span className="font-medium">{faq.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pl-8 pr-4">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-card">
                <CardContent className="p-12 text-center">
                  <HelpCircle className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <h3 className="text-xl font-semibold mb-2">No questions found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filter to find what you're looking for.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Still Have Questions Section */}
        <section className="py-20 bg-gradient-to-b from-background to-secondary/30">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Still Have Questions?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Can't find the answer you're looking for? Our team is here to help. 
              Contact us and we'll get back to you as soon as possible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/919810132827"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#25D366] text-white rounded-xl font-semibold hover:bg-[#20BA5A] transition-all duration-200 hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp Us
              </a>
              <a
                href="tel:+919810132827"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-accent text-accent-foreground rounded-xl font-semibold hover:bg-accent/90 transition-all duration-200 hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
              >
                Call Us
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppFab />
    </div>
  );
};

const FAQPage = () => {
  return (
    <ErrorBoundary>
      <FAQPageContent />
    </ErrorBoundary>
  );
};

export default FAQPage;
