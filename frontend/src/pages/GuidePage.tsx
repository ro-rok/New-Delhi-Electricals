import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import NotFound from '@/pages/NotFound';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SEOHead } from '@/components/SEOHead';
import { GuideView } from '@/components/guides/GuideView';
import { findGuideSummary } from '@/content/guides/manifest';
import { getGuideSEO } from '@/lib/seo';
import { useApp } from '@/contexts/AppContext';
import { useInitialRouteData } from '@/lib/initialRouteData';
import type { Guide } from '@/lib/guides';

/**
 * A single editorial guide.
 *
 * The article body is deliberately not a static import. The prerendered document ships the
 * whole guide inside its initial route data, so a visitor arriving from search renders and
 * hydrates the full article with no fetch and no flash. Only an in-app navigation — where a
 * brief loading state is acceptable — pulls the guide bodies in as an async chunk, which
 * keeps ~75 kB of article prose out of the entry bundle every other route pays for.
 */
const GuidePage = () => {
  const { slug } = useParams();
  const location = useLocation();
  const { trackPageView } = useApp();
  const summary = findGuideSummary(slug);
  const initialData = useInitialRouteData();
  const prerendered = initialData?.pathname === location.pathname && initialData?.guide?.slug === slug
    ? initialData.guide
    : null;
  const [guide, setGuide] = useState<Guide | null>(prerendered);
  const [loading, setLoading] = useState(Boolean(summary) && !prerendered);

  useEffect(() => {
    if (!summary || prerendered) return;
    let cancelled = false;
    setLoading(true);
    import('@/content/guides')
      .then(({ findGuide }) => { if (!cancelled) setGuide(findGuide(slug) ?? null); })
      .catch(() => { if (!cancelled) setGuide(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug, summary, prerendered]);

  useEffect(() => {
    if (summary) trackPageView(`guide-${summary.slug}`);
  }, [summary, trackPageView]);

  if (!summary) return <NotFound />;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead {...getGuideSEO(summary)} />
      <Header />
      <main className="container mx-auto max-w-7xl px-4 pt-24 pb-16">
        {guide
          ? <GuideView guide={guide} />
          : <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" text={loading ? 'Loading guide...' : 'Guide unavailable'} />
            </div>}
      </main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
};

export default GuidePage;
