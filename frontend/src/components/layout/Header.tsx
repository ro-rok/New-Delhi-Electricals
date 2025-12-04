import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, GitCompare, Menu, X, Sun, Moon, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from 'next-themes';
import SearchModal from '@/components/catalog/SearchModal';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { shortlistCount, comparisonCount, cartCount } = useApp();
  const { theme, setTheme } = useTheme();

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
            <nav className="hidden md:flex items-center gap-8">
              <Link 
                to="/categories" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300"
              >
                Categories
              </Link>
              <Link 
                to="/brands" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300"
              >
                Brands
              </Link>
              <Link 
                to="/about" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300"
              >
                About
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                className="rounded-full h-10 w-10 hover:bg-foreground/5"
              >
                <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </Button>
              
              <Link to="/shortlist">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full h-10 w-10 hover:bg-foreground/5 relative"
                >
                  <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  {shortlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-foreground text-background text-[10px] font-semibold flex items-center justify-center">
                      {shortlistCount}
                    </span>
                  )}
                </Button>
              </Link>
              
              <Link to="/compare">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full h-10 w-10 hover:bg-foreground/5 relative"
                >
                  <GitCompare className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  {comparisonCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-foreground text-background text-[10px] font-semibold flex items-center justify-center">
                      {comparisonCount}
                    </span>
                  )}
                </Button>
              </Link>

              <Link to="/cart">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full h-10 w-10 hover:bg-foreground/5 relative"
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
                className="rounded-full h-10 w-10 hover:bg-foreground/5"
              >
                <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" strokeWidth={1.5} />
                <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" strokeWidth={1.5} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full h-10 w-10 hover:bg-foreground/5"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
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
              <Link
                to="/categories"
                className="px-4 py-3 text-sm font-medium hover:bg-foreground/5 rounded-xl transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Categories
              </Link>
              <Link
                to="/brands"
                className="px-4 py-3 text-sm font-medium hover:bg-foreground/5 rounded-xl transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Brands
              </Link>
              <Link
                to="/about"
                className="px-4 py-3 text-sm font-medium hover:bg-foreground/5 rounded-xl transition-colors"
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

      <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
};

export default Header;
