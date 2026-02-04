import { useEffect, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppProvider } from "@/contexts/AppContext";
import { PageLoader } from "@/components/ui/PageLoader";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <OfflineBanner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <GlobalShortcuts />
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
                    <Route path="logs" element={<ErrorBoundary><AdminLogs /></ErrorBoundary>} />
                    <Route path="settings" element={<ErrorBoundary><AdminSettings /></ErrorBoundary>} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
