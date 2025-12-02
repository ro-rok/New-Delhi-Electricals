import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppProvider } from "@/contexts/AppContext";
import Home from "./pages/Home";
import AboutPage from "./pages/AboutPage";
import CategoryPage from "./pages/CategoryPage";
import BrandPage from "./pages/BrandPage";
import ProductPage from "./pages/ProductPage";
import ShortlistPage from "./pages/ShortlistPage";
import ComparePage from "./pages/ComparePage";
import BrandsListPage from "./pages/BrandsListPage";
import CategoriesListPage from "./pages/CategoriesListPage";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminBrands from "./pages/admin/AdminBrands";
import AdminImport from "./pages/admin/AdminImport";
import AdminInquiries from "./pages/admin/AdminInquiries";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/categories" element={<CategoriesListPage />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/brands" element={<BrandsListPage />} />
              <Route path="/brand/:slug" element={<BrandPage />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/shortlist" element={<ShortlistPage />} />
              <Route path="/compare" element={<ComparePage />} />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="brands" element={<AdminBrands />} />
                <Route path="import" element={<AdminImport />} />
                <Route path="inquiries" element={<AdminInquiries />} />
                <Route path="logs" element={<AdminLogs />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
