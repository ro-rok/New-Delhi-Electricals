import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const reviews = [
  {
    name: "Rajesh Kumar",
    rating: 5,
    text: "Best electrical shop in South Delhi! Been buying from them for 15 years. Always genuine products and excellent service.",
    date: "2 months ago"
  },
  {
    name: "Priya Sharma",
    rating: 5,
    text: "Very reliable. Got all my home wiring materials from here. Quality products at honest prices. Highly recommended!",
    date: "3 weeks ago"
  },
  {
    name: "Amit Singh",
    rating: 5,
    text: "Professional service and quick delivery. They helped me choose the right MCBs for my entire project. Great technical knowledge.",
    date: "1 month ago"
  },
  {
    name: "Neha Gupta",
    rating: 5,
    text: "Trusted them for my villa's electrical work. All products were genuine ABB and Polycab. Worth every rupee!",
    date: "2 weeks ago"
  },
  {
    name: "Vikram Malhotra",
    rating: 5,
    text: "Outstanding! Quick WhatsApp support and same-day delivery. This is how electrical shops should operate.",
    date: "1 week ago"
  },
  {
    name: "Anita Verma",
    rating: 5,
    text: "27 years in business and it shows. Knowledgeable staff, quality products, and they stand behind what they sell.",
    date: "3 months ago"
  },
  {
    name: "Suresh Reddy",
    rating: 5,
    text: "My go-to place for all electrical needs. Fair pricing, genuine products, and excellent after-sales support.",
    date: "5 days ago"
  },
  {
    name: "Kavita Jain",
    rating: 5,
    text: "Impressed with their expertise. They suggested better alternatives that saved me money without compromising quality.",
    date: "1 month ago"
  }
];

const Testimonials = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || isPaused) return;

    let animationId: number;
    let scrollPosition = 0;

    const scroll = () => {
      scrollPosition += 0.5;
      if (scrollContainer) {
        scrollContainer.scrollLeft = scrollPosition;
        
        // Reset when reaching halfway (since we duplicated content)
        if (scrollPosition >= scrollContainer.scrollWidth / 2) {
          scrollPosition = 0;
        }
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationId);
  }, [isPaused]);

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-b from-background to-secondary/30 overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div style={{ y }} className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 tracking-tight">
            Trusted by Professionals & Homeowners
          </h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-accent text-accent" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">5.0 on Google</span>
          </div>
        </motion.div>

        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-x-hidden hide-scrollbar pb-4"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Duplicate reviews for seamless infinite scroll */}
          {[...reviews, ...reviews].map((review, index) => (
            <Card 
              key={index}
              className="flex-shrink-0 w-[340px] hover-lift bg-card shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${(index % reviews.length) * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-base">{review.name}</h4>
                    <p className="text-xs text-muted-foreground">{review.date}</p>
                  </div>
                  <svg className="w-5 h-5 text-muted-foreground/40" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {review.text}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;