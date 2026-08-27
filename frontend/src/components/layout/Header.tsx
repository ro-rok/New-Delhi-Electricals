import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Search, Heart, Menu, X, Sun, Moon, ShoppingCart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from 'next-themes';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { shortlistCount, cartCount } = useApp();
  const { theme, setTheme } = useTheme();
  
  const currentQuery = location.pathname === '/search' ? (searchParams.get('q') || '') : '';
  const [searchQuery, setSearchQuery] = useState(currentQuery);
  
  useEffect(() => {
    if (location.pathname === '/search') {
      setSearchQuery(searchParams.get('q') || '');
    } else {
      setSearchQuery('');
    }
  }, [location.pathname, searchParams]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const isCategoryActive = location.pathname.startsWith('/categories') || location.pathname.startsWith('/category');

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/30">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <Zap className="h-4 w-4 text-white" fill="white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm md:text-base font-bold tracking-tight leading-none">
                  New Delhi
                </span>
                <span className="text-[10px] md:text-xs font-medium tracking-widest uppercase text-muted-foreground leading-none">
                  Electricals
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 flex-1 max-w-md mx-4">
              <Link 
                to="/categories" 
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isCategoryActive
                    ? 'bg-accent/10 text-accent font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                Shop
              </Link>
              <Link 
                to="/brands" 
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname.startsWith('/brands') || location.pathname.startsWith('/brand')
                    ? 'bg-accent/10 text-accent font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                Brands
              </Link>
              <Link 
                to="/services" 
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/services'
                    ? 'bg-accent/10 text-accent font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                Services
              </Link>
              <Link 
                to="/contact" 
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/contact'
                    ? 'bg-accent/10 text-accent font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                Contact
              </Link>
              
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex-1 max-w-[200px] ml-2">
                <div className={`relative flex items-center bg-secondary/50 border border-border/50 rounded-lg px-2.5 py-1.5 transition-all ${
                  isSearchFocused ? 'border-accent/40 bg-background ring-2 ring-accent/10' : 'hover:border-border'
                }`}>
                  <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder="Search..."
                    className="pl-7 pr-1 border-0 focus-visible:ring-0 bg-transparent text-sm h-6 placeholder:text-muted-foreground/60"
                  />
                </div>
              </form>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-0.5">
              <Link to="/shortlist">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-xl h-9 w-9 hover:bg-secondary relative touch-manipulation"
                  aria-label="View shortlist"
                >
                  <Heart className="h-[16px] w-[16px]" strokeWidth={1.5} />
                  {shortlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                      {shortlistCount}
                    </span>
                  )}
                </Button>
              </Link>

              <Link to="/cart">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-xl h-9 w-9 hover:bg-secondary relative touch-manipulation"
                  aria-label="View cart"
                >
                  <ShoppingCart className="h-[16px] w-[16px]" strokeWidth={1.5} />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Button>
              </Link>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-xl h-9 w-9 hover:bg-secondary touch-manipulation"
                aria-label="Toggle theme"
              >
                <Sun className="h-[16px] w-[16px] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" strokeWidth={1.5} />
                <Moon className="absolute h-[16px] w-[16px] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" strokeWidth={1.5} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-xl h-9 w-9 hover:bg-secondary touch-manipulation"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="h-4 w-4" strokeWidth={2} /> : <Menu className="h-4 w-4" strokeWidth={2} />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl">
            <nav className="container px-4 py-3 flex flex-col gap-0.5">
              <form onSubmit={handleSearch} className="mb-3">
                <div className={`relative flex items-center bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 transition-all ${
                  isSearchFocused ? 'border-accent/40 bg-background ring-2 ring-accent/10' : ''
                }`}>
                  <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder="Search products..."
                    className="pl-9 pr-2 border-0 focus-visible:ring-0 bg-transparent text-sm"
                  />
                </div>
              </form>
              
              {[
                { to: '/categories', label: 'Shop', active: isCategoryActive },
                { to: '/brands', label: 'Brands', active: location.pathname.startsWith('/brands') || location.pathname.startsWith('/brand') },
                { to: '/services', label: 'Services', active: location.pathname === '/services' },
                { to: '/contact', label: 'Contact', active: location.pathname === '/contact' },
                { to: '/about', label: 'About', active: location.pathname === '/about' },
              ].map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    item.active
                      ? 'bg-accent/10 text-accent font-semibold'
                      : 'text-foreground hover:bg-secondary'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/cart"
                className="px-3 py-2.5 text-sm font-medium hover:bg-secondary rounded-lg transition-colors flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingCart className="h-4 w-4" />
                Cart {cartCount > 0 && `(${cartCount})`}
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
