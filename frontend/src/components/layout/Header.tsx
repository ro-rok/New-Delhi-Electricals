import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Search, Heart, Menu, X, Sun, Moon, ShoppingCart } from 'lucide-react';
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
  
  // Get current search query from URL if on search page
  const currentQuery = location.pathname === '/search' ? (searchParams.get('q') || '') : '';
  const [searchQuery, setSearchQuery] = useState(currentQuery);
  
  // Update search query when URL changes
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

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="container mx-auto max-w-7xl px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-base md:text-lg font-semibold tracking-tight">
                New Delhi Electricals
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8 flex-1 max-w-md mx-4">
              <Link 
                to="/categories" 
                className={`text-sm font-medium transition-colors duration-300 ${
                  location.pathname.startsWith('/categories') || location.pathname.startsWith('/category')
                    ? 'text-foreground font-semibold border-b-2 border-foreground pb-0.5'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Categories
              </Link>
              <Link 
                to="/brands" 
                className={`text-sm font-medium transition-colors duration-300 ${
                  location.pathname.startsWith('/brands') || location.pathname.startsWith('/brand')
                    ? 'text-foreground font-semibold border-b-2 border-foreground pb-0.5'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Brands
              </Link>
              <Link 
                to="/services" 
                className={`text-sm font-medium transition-colors duration-300 ${
                  location.pathname === '/services'
                    ? 'text-foreground font-semibold border-b-2 border-foreground pb-0.5'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Services
              </Link>
              <Link 
                to="/contact" 
                className={`text-sm font-medium transition-colors duration-300 ${
                  location.pathname === '/contact'
                    ? 'text-foreground font-semibold border-b-2 border-foreground pb-0.5'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Contact
              </Link>
              <Link 
                to="/about" 
                className={`text-sm font-medium transition-colors duration-300 ${
                  location.pathname === '/about'
                    ? 'text-foreground font-semibold border-b-2 border-foreground pb-0.5'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                About
              </Link>
              
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex-1 max-w-xs">
                <div className={`relative flex items-center bg-background/50 border border-border/50 rounded-full px-3 py-1.5 transition-all ${
                  isSearchFocused ? 'border-foreground/30 bg-background ring-1 ring-foreground/10' : ''
                }`}>
                  <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder="Search products..."
                    className="pl-8 pr-2 border-0 focus-visible:ring-0 bg-transparent text-sm h-7"
                  />
                </div>
              </form>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1">
              
              <Link to="/shortlist">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full h-10 w-10 md:h-10 md:w-10 hover:bg-foreground/5 relative touch-manipulation"
                  aria-label="View shortlist"
                >
                  <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  {shortlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-foreground text-background text-[10px] font-semibold flex items-center justify-center">
                      {shortlistCount}
                    </span>
                  )}
                </Button>
              </Link>

              <Link to="/cart">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full h-10 w-10 md:h-10 md:w-10 hover:bg-foreground/5 relative touch-manipulation"
                  aria-label="View cart"
                >
                  <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-foreground text-background text-[10px] font-semibold flex items-center justify-center">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Button>
              </Link>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-full h-10 w-10 md:h-10 md:w-10 hover:bg-foreground/5 touch-manipulation"
                aria-label="Toggle theme"
              >
                <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" strokeWidth={1.5} />
                <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" strokeWidth={1.5} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full h-10 w-10 hover:bg-foreground/5 touch-manipulation"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
            <nav className="container px-6 py-4 flex flex-col gap-1">
              {/* Mobile Search Bar */}
              <form onSubmit={handleSearch} className="mb-2">
                <div className={`relative flex items-center bg-background/50 border border-border/50 rounded-full px-3 py-2 transition-all ${
                  isSearchFocused ? 'border-foreground/30 bg-background ring-1 ring-foreground/10' : ''
                }`}>
                  <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder="Search products..."
                    className="pl-8 pr-2 border-0 focus-visible:ring-0 bg-transparent text-sm"
                  />
                </div>
              </form>
              
              <Link
                to="/categories"
                className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                  location.pathname.startsWith('/categories') || location.pathname.startsWith('/category')
                    ? 'bg-foreground/10 text-foreground font-semibold'
                    : 'hover:bg-foreground/5'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Categories
              </Link>
              <Link
                to="/brands"
                className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                  location.pathname.startsWith('/brands') || location.pathname.startsWith('/brand')
                    ? 'bg-foreground/10 text-foreground font-semibold'
                    : 'hover:bg-foreground/5'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Brands
              </Link>
              <Link
                to="/services"
                className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                  location.pathname === '/services'
                    ? 'bg-foreground/10 text-foreground font-semibold'
                    : 'hover:bg-foreground/5'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Services
              </Link>
              <Link
                to="/contact"
                className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                  location.pathname === '/contact'
                    ? 'bg-foreground/10 text-foreground font-semibold'
                    : 'hover:bg-foreground/5'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <Link
                to="/about"
                className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                  location.pathname === '/about'
                    ? 'bg-foreground/10 text-foreground font-semibold'
                    : 'hover:bg-foreground/5'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/cart"
                className="px-4 py-3 text-sm font-medium hover:bg-foreground/5 rounded-xl transition-colors flex items-center gap-2"
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
