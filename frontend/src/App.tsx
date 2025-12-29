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

// Eagerly loaded components (critical path)
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// Lazy loaded components (code splitting)
const AboutPage = lazy(() => import("./pages/AboutPage"));
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
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/search" element={<SearchResultsPage />} />
                  <Route path="/categories" element={<CategoriesListPage />} />
                  <Route path="/category/:slug" element={<CategoryPage />} />
                  <Route path="/brands" element={<BrandsListPage />} />
                  <Route path="/brand/:slug" element={<BrandPage />} />
                  <Route path="/:brand/:slug" element={<ProductSlugPage />} />
                  <Route path="/product/:brand/:slug" element={<ProductSlugPage />} />
                  <Route path="/product/:brand/:product_family/:slug" element={<ProductSlugPage />} />
                  <Route path="/shortlist" element={<ShortlistPage />} />
                  <Route path="/compare" element={<ComparePage />} />
                  <Route path="/cart" element={<CartPage />} />


                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="products/add" element={<AdminAddProduct />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="brands" element={<AdminBrands />} />
                    <Route path="import" element={<AdminImport />} />
                    <Route path="inquiries" element={<AdminInquiries />} />
                    <Route path="logs" element={<AdminLogs />} />
                    <Route path="settings" element={<AdminSettings />} />
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
