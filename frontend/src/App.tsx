import { useEffect, Suspense, lazy } from "react";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppProvider } from "@/contexts/AppContext";
import { PageLoader } from "@/components/ui/PageLoader";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { trackConversion } from "@/lib/conversionTracking";
import { trackPageView } from "@/api/tracking";
import { PrerenderRoute } from "@/components/PrerenderRoute";
import type { RouteData } from "@/lib/routeData";

// Eagerly loaded components (critical path)
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// Lazy loaded components (code splitting)
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const BrandPage = lazy(() => import("./pages/BrandPage"));
const ProductSlugPage = lazy(() => import("./pages/ProductSlugPage"));
const ShortlistPage = lazy(() => import("./pages/ShortlistPage"));
const ComparePage = lazy(() => import("./pages/ComparePage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const BrandsListPage = lazy(() => import("./pages/BrandsListPage"));
const CategoriesListPage = lazy(() => import("./pages/CategoriesListPage"));
const SearchResultsPage = lazy(() => import("./pages/SearchResultsPage"));

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminBrands = lazy(() => import("./pages/admin/AdminBrands"));
const AdminImport = lazy(() => import("./pages/admin/AdminImport"));
const AdminInquiries = lazy(() => import("./pages/admin/AdminInquiries"));
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminAddProduct = lazy(() => import("./pages/admin/AdminAddProduct"));
const AdminQuotationMaker = lazy(() => import("./pages/admin/AdminQuotationMaker"));
const AdminQuotationsList = lazy(() => import("./pages/admin/AdminQuotationsList"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));

const queryClient = new QueryClient();

const GlobalShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      // Ctrl+Shift+A (or Cmd+Shift+A on macOS) opens the admin portal
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        navigate("/admin/login");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  return null;
};

const RouteTracker = () => {
  const location = useLocation();
  useEffect(() => {
    // Queries can contain customer intent and must not enter page-view analytics.
    trackPageView(location.pathname);
  }, [location.pathname]);
  return null;
};

const GlobalConversionTracking = () => {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('a,button') : null;
      if (!target) return;
      const href = target instanceof HTMLAnchorElement ? target.href : '';
      const label = (target.getAttribute('aria-label') || '').trim();
      if (href.includes('wa.me') || /whats\s*app/i.test(label)) {
        const properties = { cta_location: target.dataset.ctaLocation || 'whatsapp_cta' };
        trackConversion('whatsapp_click', properties);
        trackConversion('whatsapp_enquiry_start', properties);
      } else if (href.startsWith('tel:')) {
        trackConversion('phone_click', { cta_location: target.dataset.ctaLocation || 'phone_cta' });
      }
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);
  return null;
};

export const AppProviders = ({ children, prerender = false }: { children: React.ReactNode; prerender?: boolean }) => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AppProvider>
        <TooltipProvider>
          {!prerender && <><Toaster /><Sonner /><Analytics /><OfflineBanner /></>}
          {children}
        </TooltipProvider>
      </AppProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

const InitialOrLegacy = ({ initialRouteData, children }: { initialRouteData?: RouteData; children: React.ReactNode }) => {
  const location = useLocation();
  // The embedded payload describes one document only. Once the client navigates,
  // render the normal interactive route instead of reusing stale initial markup.
  return initialRouteData?.path === location.pathname
    ? <PrerenderRoute data={initialRouteData} />
    : <>{children}</>;
};

/** One logical route table used by BrowserRouter and StaticRouter. */
export const AppContent = ({ initialRouteData }: { initialRouteData?: RouteData }) => (
  <>
    <GlobalShortcuts />
    <RouteTracker />
    <GlobalConversionTracking />
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<InitialOrLegacy initialRouteData={initialRouteData}><ErrorBoundary><Home /></ErrorBoundary></InitialOrLegacy>} />
                  <Route path="/about" element={<InitialOrLegacy initialRouteData={initialRouteData}><ErrorBoundary><AboutPage /></ErrorBoundary></InitialOrLegacy>} />
                  <Route path="/services" element={<InitialOrLegacy initialRouteData={initialRouteData}><ErrorBoundary><ServicesPage /></ErrorBoundary></InitialOrLegacy>} />
                  <Route path="/contact" element={<InitialOrLegacy initialRouteData={initialRouteData}><ErrorBoundary><ContactPage /></ErrorBoundary></InitialOrLegacy>} />
                  <Route path="/faq" element={<InitialOrLegacy initialRouteData={initialRouteData}><ErrorBoundary><FAQPage /></ErrorBoundary></InitialOrLegacy>} />
                  <Route path="/search" element={<InitialOrLegacy initialRouteData={initialRouteData}><ErrorBoundary><SearchResultsPage /></ErrorBoundary></InitialOrLegacy>} />
                  <Route path="/categories" element={<InitialOrLegacy initialRouteData={initialRouteData}><ErrorBoundary><CategoriesListPage /></ErrorBoundary></InitialOrLegacy>} />
                  <Route path="/category/:slug" element={<InitialOrLegacy initialRouteData={initialRouteData}><ErrorBoundary><CategoryPage /></ErrorBoundary></InitialOrLegacy>} />
                  <Route path="/brands" element={<InitialOrLegacy initialRouteData={initialRouteData}><ErrorBoundary><BrandsListPage /></ErrorBoundary></InitialOrLegacy>} />
                  <Route path="/brand/:slug" element={<InitialOrLegacy initialRouteData={initialRouteData}><ErrorBoundary><BrandPage /></ErrorBoundary></InitialOrLegacy>} />
                  <Route path="/:brand/:slug" element={<InitialOrLegacy initialRouteData={initialRouteData}><ErrorBoundary><ProductSlugPage /></ErrorBoundary></InitialOrLegacy>} />
                  <Route path="/product/:brand/:slug" element={<InitialOrLegacy initialRouteData={initialRouteData}><ErrorBoundary><ProductSlugPage /></ErrorBoundary></InitialOrLegacy>} />
                  <Route path="/product/:brand/:product_family/:slug" element={<InitialOrLegacy initialRouteData={initialRouteData}><ErrorBoundary><ProductSlugPage /></ErrorBoundary></InitialOrLegacy>} />
                  <Route path="/shortlist" element={<InitialOrLegacy initialRouteData={initialRouteData}><ErrorBoundary><ShortlistPage /></ErrorBoundary></InitialOrLegacy>} />
                  <Route path="/compare" element={<InitialOrLegacy initialRouteData={initialRouteData}><ErrorBoundary><ComparePage /></ErrorBoundary></InitialOrLegacy>} />
                  <Route path="/cart" element={<InitialOrLegacy initialRouteData={initialRouteData}><ErrorBoundary><CartPage /></ErrorBoundary></InitialOrLegacy>} />

                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<ErrorBoundary><AdminLogin /></ErrorBoundary>} />
                  <Route path="/admin" element={<ErrorBoundary><AdminLayout /></ErrorBoundary>}>
                    <Route index element={<ErrorBoundary><AdminDashboard /></ErrorBoundary>} />
                    <Route path="products" element={<ErrorBoundary><AdminProducts /></ErrorBoundary>} />
                    <Route path="products/add" element={<ErrorBoundary><AdminAddProduct /></ErrorBoundary>} />
                    <Route path="categories" element={<ErrorBoundary><AdminCategories /></ErrorBoundary>} />
                    <Route path="brands" element={<ErrorBoundary><AdminBrands /></ErrorBoundary>} />
                    <Route path="import" element={<ErrorBoundary><AdminImport /></ErrorBoundary>} />
                    <Route path="inquiries" element={<ErrorBoundary><AdminInquiries /></ErrorBoundary>} />
                    <Route path="quotation-maker" element={<ErrorBoundary><AdminQuotationMaker /></ErrorBoundary>} />
                    <Route path="quotations" element={<ErrorBoundary><AdminQuotationsList /></ErrorBoundary>} />
                    <Route path="analytics" element={<ErrorBoundary><AdminAnalytics /></ErrorBoundary>} />
                    <Route path="logs" element={<ErrorBoundary><AdminLogs /></ErrorBoundary>} />
                    <Route path="settings" element={<ErrorBoundary><AdminSettings /></ErrorBoundary>} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  </>
);

const App = ({ initialRouteData }: { initialRouteData?: RouteData }) => (
  <AppProviders prerender={Boolean(initialRouteData)}>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent initialRouteData={initialRouteData} />
    </BrowserRouter>
  </AppProviders>
);

export default App;
