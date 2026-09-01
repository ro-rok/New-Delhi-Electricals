import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import { SEOHead } from '@/components/SEOHead';
import { GuideIndexView } from '@/components/guides/GuideIndexView';
import { GUIDE_SUMMARIES } from '@/content/guides/manifest';
import { getGuidesIndexSEO } from '@/lib/seo';
import { useApp } from '@/contexts/AppContext';

const GuidesIndexPage = () => {
  const { trackPageView } = useApp();

  useEffect(() => { trackPageView('guides-index'); }, [trackPageView]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead {...getGuidesIndexSEO(GUIDE_SUMMARIES)} />
      <Header />
      <main className="container mx-auto max-w-7xl px-4 pt-24 pb-16">
        <GuideIndexView />
      </main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
};

export default GuidesIndexPage;
