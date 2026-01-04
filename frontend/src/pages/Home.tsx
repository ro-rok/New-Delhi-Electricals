import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import PremiumHero from '@/components/home/PremiumHero';
import CategoryGrid from '@/components/catalog/CategoryGrid';
import BrandShowcase from '@/components/catalog/BrandShowcase';
import FeaturedProducts from '@/components/catalog/FeaturedProducts';
import FloatingSearchBar from '@/components/home/FloatingSearchBar';
import WhatsAppStrip from '@/components/home/WhatsAppStrip';
import RecentlyViewed from '@/components/catalog/RecentlyViewed';
import WhatsAppFab from '@/components/WhatsAppFab';
import Footer from '@/components/Footer';
import Testimonials from '@/components/Testimonials';
import PolycabPromoButton from '@/components/home/PolycabPromoButton';
import { useApp } from '@/contexts/AppContext';

const Home = () => {
  const { trackPageView } = useApp();

  useEffect(() => {
    trackPageView('home');
  }, [trackPageView]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="h-16" /> {/* Spacer for fixed header */}
      <PolycabPromoButton />
      <main>
        <PremiumHero />
        <CategoryGrid />
        <FloatingSearchBar />
        <FeaturedProducts />
        <BrandShowcase />
        <Testimonials />
        <WhatsAppStrip />
        <RecentlyViewed />
      </main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
};

export default Home;
