import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, FolderOpen, Tags, FileUp,
  MessageSquare, Settings, LogOut, Menu, X, ChevronRight,
  Sun, Moon, FileText, ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

import { History } from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Package, label: 'Products', path: '/admin/products' },
  { icon: FolderOpen, label: 'Categories', path: '/admin/categories' },
  { icon: Tags, label: 'Brands', path: '/admin/brands' },
  { icon: FileUp, label: 'Import', path: '/admin/import' },
  { icon: FileText, label: 'Quotation Maker', path: '/admin/quotation-maker' },
  { icon: ClipboardList, label: 'Quotations', path: '/admin/quotations' },
  { icon: MessageSquare, label: 'Inquiries', path: '/admin/inquiries' },
  { icon: History, label: 'Logs', path: '/admin/logs' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

// Simple auth check - in production, use proper auth
const useAdminAuth = () => {
  const [isAuthenticated] = useState(() => {
    return localStorage.getItem('admin_auth') === 'true';
  });
  return isAuthenticated;
};

const AdminLayout = () => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed on mobile
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024;
  });
  const isAuthenticated = useAdminAuth();

  // Track viewport width to decide when to keep sidebar open
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktop(e.matches);
      // Ensure sidebar shown on desktop, hidden on mobile unless opened
      if (e.matches) {
        setSidebarOpen(false); // rely on isDesktop to show sidebar
      }
    };
    // Initial sync
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (!isAuthenticated && location.pathname !== '/admin/login') {
    return <Navigate to="/admin/login" replace />;
  }

  if (location.pathname === '/admin/login') {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {(sidebarOpen || isDesktop) && (
          <motion.aside
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col lg:relative lg:translate-x-0 print:hidden"
          >
            <div className="p-6 border-b border-border">
              <Link to="/admin" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">N</span>
                </div>
                <div>
                  <h1 className="font-semibold text-sm">NDE Admin</h1>
                  <p className="text-xs text-muted-foreground">Management Portal</p>
                </div>
              </Link>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/admin' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      // Close sidebar on mobile when clicking a link
                      if (!isDesktop) {
                        setSidebarOpen(false);
                      }
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                    {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-border space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                onClick={() => {
                  localStorage.removeItem('admin_auth');
                  window.location.href = '/admin/login';
                }}
              >
                <LogOut className="h-5 w-5" />
                Log Out
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border print:hidden">
          <div className="flex items-center justify-between px-6 py-4">
            {!isDesktop && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <Link
              to="/"
              className="ml-auto lg:ml-0 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">N</span>
              </div>
              <span className="font-semibold text-sm">New Delhi Electricals</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 print:p-0 print:overflow-visible">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
