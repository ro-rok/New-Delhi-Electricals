import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const googleRating = {
  score: 4.2,
  count: 155,
  link: "https://www.google.com/search?q=new+delhi+electricals#lrd=0x390ce21918d6304b:0xd38324f4dee9235b,1,,,"
};

const reviews = [
  {
    name: "Yogesh Shrestha",
    rating: 5,
    text: "Variety of genuine electrical appliances with warranty and refund support; prices are reasonable and they accept cards.",
    date: "5 years ago"
  },
  {
    name: "Neeraj Kumar",
    rating: 5,
    text: "Lowest price this shop.",
    date: "2 months ago"
  },
  {
    name: "SUNILKUMAR K R",
    rating: 5,
    text: "All electrical items available at reasonable rate. Good shop, but a bit crowded for pickups.",
    date: "4 years ago"
  },
  {
    name: "Mohd Sultan",
    rating: 5,
    text: "Good electronic components and plenty of electrical items — great for bulk and retail buyers.",
    date: "3 years ago"
  },
  {
    name: "Kavita Upadhyay",
    rating: 5,
    text: "Cost affordable and discounted prices on wires, cables, switches and peripherals.",
    date: "7 years ago"
  },
  {
    name: "Vikas Kumar",
    rating: 5,
    text: "Best electrical shop in Malviya Nagar with good product quality at best prices.",
    date: "4 years ago"
  },
  {
    name: "Abhishek Gupta",
    rating: 5,
    text: "Best shop, best prices wholesale and retail; variety of electrical parts available.",
    date: "5 years ago"
  },
  {
    name: "Gaurav Bahl",
    rating: 5,
    text: "Best place to buy electrical stuff, offering the best possible discounts in South Delhi.",
    date: "5 years ago"
  },
  {
    name: "Vasu Narula",
    rating: 5,
    text: "One-stop shop for electrical items at a great price — personal favourite.",
    date: "7 years ago"
  },
  {
    name: "Ved Gandhi",
    rating: 5,
    text: "Very good place for buying electric items at reasonable price.",
    date: "7 years ago"
  },
  {
    name: "sukant samal",
    rating: 5,
    text: "All kinds of electronic products available; good shop in Malviya Nagar.",
    date: "4 years ago"
  },
  {
    name: "M. DEV",
    rating: 5,
    text: "Good place to shop electrical items.",
    date: "1 year ago"
  },
  {
    name: "Himanshu Baluni",
    rating: 5,
    text: "Crowded place but you get good items at good price.",
    date: "4 years ago"
  },
  {
    name: "Sanjiv Bhardwaj",
    rating: 5,
    text: "Well behaved and reasonable price. All good.",
    date: "3 years ago"
  },
  {
    name: "Vijay Bisht",
    rating: 5,
    text: "Good products with very reasonable price.",
    date: "4 years ago"
  },
  {
    name: "Renu Saini",
    rating: 5,
    text: "They are behaving very good to their customers.",
    date: "6 years ago"
  },
  {
    name: "Jagdeep K Kataria",
    rating: 5,
    text: "Nice shop, got everything electrical components.",
    date: "7 years ago"
  },
  {
    name: "Dheeraj Ashiwal",
    rating: 5,
    text: "Best rates and variety of electrical material.",
    date: "4 years ago"
  },
  {
    name: "Bharat Chauhan",
    rating: 5,
    text: "Cheaper price as compared to other shops.",
    date: "5 years ago"
  },
  {
    name: "Mohit Tiwari",
    rating: 5,
    text: "Amazon se sasta and best maal yaha hai aayyii shapat (cheaper and best than Amazon).",
    date: "3 years ago"
  },
  {
    name: "vishal kapoor",
    rating: 4,
    text: "Huge variety from fans to lights to switches to cables; economical prices but usually crowded.",
    date: "5 years ago"
  },
  {
    name: "Asli Deep",
    rating: 4,
    text: "Little bit crowded, good products, cheapest electric goods available.",
    date: "5 years ago"
  },
  {
    name: "Ajay Jain",
    rating: 4,
    text: "For every electrical need at reasonable price.",
    date: "5 years ago"
  },
  {
    name: "Manish Kumar Singh",
    rating: 4,
    text: "Any electrical stuff from wires to fittings at reasonable price.",
    date: "5 years ago"
  },
  {
    name: "Kailash Kumar",
    rating: 4,
    text: "Wholesale electrical item shop in South Delhi.",
    date: "4 years ago"
  }
];

const Testimonials = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

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
    <section className="py-20 bg-gradient-to-b from-background to-secondary/30 overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 space-y-3"
        >
          <h2 className="text-4xl font-bold tracking-tight">
            Trusted by Professionals & Homeowners
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < Math.round(googleRating.score) ? "fill-accent text-accent" : "text-muted-foreground/40"}`}
                  />
                ))}
              </div>
              <span>{googleRating.score.toFixed(1)} on Google · {googleRating.count} reviews</span>
            </div>
            <Button asChild variant="outline" size="sm" className="h-9">
              <a href={googleRating.link} target="_blank" rel="noreferrer">
                View on Google
              </a>
            </Button>
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