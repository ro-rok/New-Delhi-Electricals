import { MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-secondary/20">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-12 py-12 md:py-20">
        <div className="grid md:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-12">
          {/* Brand */}
          <div>
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 tracking-tight">New Delhi Electricals</h3>
            <p className="text-muted-foreground text-sm md:text-sm leading-relaxed">
              Your trusted partner for premium electrical solutions since 1998.
              Authorized retail partner for India's finest brands.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-3 md:mb-4 text-sm tracking-tight">Contact</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="mt-1 flex-shrink-0" strokeWidth={1.5} />
                <span className="leading-relaxed">
                  30 A Corner Market, Malviya Nagar<br />New Delhi – 110017
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} strokeWidth={1.5} />
                <span>9654102758</span>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-semibold mb-3 md:mb-4 text-sm tracking-tight">Operating Hours</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Monday – Sunday</p>
              <p className="font-medium text-foreground">10:00 AM – 7:30 PM</p>
            </div>
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Service Area</p>
              <p className="font-medium text-sm">Delhi NCR</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/50 pt-6 md:pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} New Delhi Electricals. All rights reserved.</p>
            <div className="flex items-center gap-4 md:gap-6">
              <Link to="/categories" className="hover:text-foreground transition-colors">
                Categories
              </Link>
              <Link to="/brands" className="hover:text-foreground transition-colors">
                Brands
              </Link>
              <Link to="/faq" className="hover:text-foreground transition-colors">
                FAQ
              </Link>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          27 Years of Trusted Service · 30,000+ Happy Customers
        </p>
      </div>
    </footer>
  );
};

export default Footer;
