import { Button } from "@/components/ui/button";
import { FileUp, MessageCircle } from "lucide-react";
import heroImage from "@/assets/hero-shop.jpg";

const Hero = () => {
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Hi! I would like to know more about your electrical products.");
    window.open(`https://wa.me/919654102758?text=${message}`, "_blank");
  };

  const scrollToForm = () => {
    document.getElementById("enquiry-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="New Delhi Electricals storefront with premium electrical brands"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-3xl">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 bg-card/10 backdrop-blur-sm border border-card/20 rounded-full px-4 py-2 mb-6">
            <span className="text-trust-gold font-bold text-sm">★</span>
            <span className="text-primary-foreground text-sm font-medium">
              27 Years of Trusted Service | 30,000+ Happy Customers
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
            New Delhi Electricals
          </h1>
          
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-4">
            Your Trusted Partner in Premium Electrical Solutions
          </p>
          
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl">
            Authorized retail partner for ABB, Lauritz Knudsen, Polycab, Vion Lights, Havells, and more. 
            Serving South Delhi since 1998 with genuine products and fast delivery.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              variant="cta"
              onClick={scrollToForm}
              className="text-base"
            >
              <FileUp className="mr-2" />
              Upload Your Requirements
            </Button>
            <Button 
              size="lg" 
              variant="hero"
              onClick={handleWhatsAppClick}
              className="text-base"
            >
              <MessageCircle className="mr-2" />
              WhatsApp Enquiry
            </Button>
          </div>

          {/* Brand Badges */}
          <div className="mt-12 pt-8 border-t border-primary-foreground/20">
            <p className="text-primary-foreground/70 text-sm mb-4">Authorized Partner For:</p>
            <div className="flex flex-wrap gap-4 text-primary-foreground/90 text-sm font-medium">
              <span className="px-3 py-1 bg-card/10 backdrop-blur-sm rounded-full border border-card/20">ABB</span>
              <span className="px-3 py-1 bg-card/10 backdrop-blur-sm rounded-full border border-card/20">Lauritz Knudsen</span>
              <span className="px-3 py-1 bg-card/10 backdrop-blur-sm rounded-full border border-card/20">Polycab</span>
              <span className="px-3 py-1 bg-card/10 backdrop-blur-sm rounded-full border border-card/20">Vion Lights</span>
              <span className="px-3 py-1 bg-card/10 backdrop-blur-sm rounded-full border border-card/20">Havells</span>
              <span className="px-3 py-1 bg-card/10 backdrop-blur-sm rounded-full border border-card/20">Crompton</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;