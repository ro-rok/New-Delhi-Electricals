import { useEffect, useState } from 'react';
import { getBrands } from '@/api/products';
import { Brand } from '@/types/product';

const BrandMarquee = () => {
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const data = await getBrands();
        setBrands(data.filter(b => b.productCount > 0));
      } catch {
        // fallback brands
      }
    };
    fetchBrands();
  }, []);

  if (brands.length === 0) return null;

  // Double the array for seamless loop
  const doubled = [...brands, ...brands];

  return (
    <section className="py-6 bg-background border-y border-border/40 overflow-hidden">
      <div className="container mx-auto px-4 mb-3">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Trusted Brands We Carry
        </p>
      </div>

      {/* CSS-only infinite scroll */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee hover:[animation-play-state:paused]">
          {doubled.map((brand, idx) => (
            <div
              key={`${brand.id}-${idx}`}
              className="flex-shrink-0 mx-4 md:mx-6 px-5 py-2.5 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/40 hover:border-accent/30 transition-all duration-200 cursor-pointer group"
            >
              <span className="text-sm md:text-base font-semibold text-foreground/70 group-hover:text-accent transition-colors whitespace-nowrap">
                {brand.name}
              </span>
              {brand.productCount > 0 && (
                <span className="ml-2 text-[10px] text-muted-foreground">
                  {brand.productCount}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandMarquee;
