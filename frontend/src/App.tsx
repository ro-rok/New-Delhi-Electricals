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
import { InitialRouteDataProvider } from "@/lib/initialRouteData";

// Eagerly loaded components (critical path)
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import CategoryPage from "./pages/CategoryPage";
import BrandPage from "./pages/BrandPage";
import ProductSlugPage from "./pages/ProductSlugPage";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import ContactPage from "./pages/ContactPage";
import FAQPage from "./pages/FAQPage";
import ShortlistPage from "./pages/ShortlistPage";
import ComparePage from "./pages/ComparePage";
import CartPage from "./pages/CartPage";
import BrandsListPage from "./pages/BrandsListPage";
import CategoriesListPage from "./pages/CategoriesListPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import CommercialHubPage from "./pages/CommercialHubPage";

// Admin code remains lazy and is never part of the public prerender output.
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
      const label = (target.getAttribute('aria-label') || target.textContent || '').trim().slice(0, 80);
      if (href.includes('wa.me') || /whats\s*app/i.test(label)) {
        const properties = { cta_location: target.dataset.ctaLocation || label || 'unknown' };
        trackConversion('whatsapp_click', properties);
        trackConversion('whatsapp_enquiry_start', properties);
      } else if (href.startsWith('tel:')) {
        trackConversion('phone_click', { cta_location: target.dataset.ctaLocation || label || 'unknown' });
      }
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);
  return null;
};

export const AppContent = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Analytics />
          <OfflineBanner />
            <GlobalShortcuts />
            <RouteTracker />
            <GlobalConversionTracking />
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
                  <Route path="/about" element={<ErrorBoundary><AboutPage /></ErrorBoundary>} />
                  <Route path="/services" element={<ErrorBoundary><ServicesPage /></ErrorBoundary>} />
                  <Route path="/contact" element={<ErrorBoundary><ContactPage /></ErrorBoundary>} />
                  <Route path="/faq" element={<ErrorBoundary><FAQPage /></ErrorBoundary>} />
                  <Route path="/search" element={<ErrorBoundary><SearchResultsPage /></ErrorBoundary>} />
                  <Route path="/categories" element={<ErrorBoundary><CategoriesListPage /></ErrorBoundary>} />
                  <Route path="/category/:slug" element={<ErrorBoundary><CategoryPage /></ErrorBoundary>} />
                  <Route path="/brands" element={<ErrorBoundary><BrandsListPage /></ErrorBoundary>} />
                  <Route path="/brand/:slug" element={<ErrorBoundary><BrandPage /></ErrorBoundary>} />
                  <Route path="/brand/:slug/:hub" element={<ErrorBoundary><CommercialHubPage /></ErrorBoundary>} />
                  <Route path="/:brand/:slug" element={<ErrorBoundary><ProductSlugPage /></ErrorBoundary>} />
                  <Route path="/product/:brand/:slug" element={<ErrorBoundary><ProductSlugPage /></ErrorBoundary>} />
                  <Route path="/product/:brand/:product_family/:slug" element={<ErrorBoundary><ProductSlugPage /></ErrorBoundary>} />
                  <Route path="/shortlist" element={<ErrorBoundary><ShortlistPage /></ErrorBoundary>} />
                  <Route path="/compare" element={<ErrorBoundary><ComparePage /></ErrorBoundary>} />
                  <Route path="/cart" element={<ErrorBoundary><CartPage /></ErrorBoundary>} />

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
        </TooltipProvider>
      </AppProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

const App = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <InitialRouteDataProvider>
      <AppContent />
    </InitialRouteDataProvider>
  </BrowserRouter>
);

export default App;
