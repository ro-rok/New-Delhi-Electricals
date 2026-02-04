/**
 * SEO Metadata Configuration
 * Centralized SEO metadata for all pages in the application
 */

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
}

/**
 * Page-specific SEO metadata
 * Used by SEOHead component to set appropriate meta tags for each page
 */
export const PAGE_SEO: Record<string, SEOMetadata> = {
  home: {
    title: "New Delhi Electricals - Quality Electrical Components & Supplies",
    description: "Leading supplier of electrical components, switches, wires, MCBs, and industrial equipment in New Delhi. Browse our extensive catalog of premium electrical products.",
    keywords: ["electrical components", "switches", "wires", "MCB", "electrical supplies", "New Delhi"],
    type: "website",
    image: "/hero-shop.jpg"
  },
  
  products: {
    title: "Products - New Delhi Electricals",
    description: "Browse our extensive catalog of electrical components, switches, MCBs, wires, cables, and more. Quality products from trusted brands.",
    keywords: ["electrical products", "switches", "MCB", "wires", "cables", "electrical catalog"],
    type: "website"
  },
  
  services: {
    title: "Services - New Delhi Electricals",
    description: "Professional electrical services including bulk ordering, technical consultation, installation support, warranty services, and custom solutions.",
    keywords: ["electrical services", "bulk ordering", "technical consultation", "installation support"],
    type: "website"
  },
  
  contact: {
    title: "Contact Us - New Delhi Electricals",
    description: "Get in touch with New Delhi Electricals for inquiries, quotes, and support. We're here to help with all your electrical component needs.",
    keywords: ["contact", "inquiry", "quote", "support", "electrical supplier"],
    type: "website"
  },
  
  about: {
    title: "About Us - New Delhi Electricals",
    description: "Learn about New Delhi Electricals, your trusted partner for quality electrical components and supplies. Serving customers with excellence since years.",
    keywords: ["about", "company", "electrical supplier", "New Delhi"],
    type: "website"
  },
  
  faq: {
    title: "FAQ - Frequently Asked Questions | New Delhi Electricals",
    description: "Find answers to common questions about ordering, shipping, returns, technical specifications, and more at New Delhi Electricals.",
    keywords: ["FAQ", "questions", "help", "support", "ordering", "shipping"],
    type: "website"
  },
  
  categories: {
    title: "Categories - Browse by Category | New Delhi Electricals",
    description: "Explore our product categories including switches, MCBs, wires, cables, lighting, fans, and industrial equipment.",
    keywords: ["categories", "product categories", "electrical categories"],
    type: "website"
  },
  
  brands: {
    title: "Brands - Shop by Brand | New Delhi Electricals",
    description: "Shop electrical products from top brands. We carry a wide selection of trusted manufacturers and premium brands.",
    keywords: ["brands", "manufacturers", "electrical brands"],
    type: "website"
  },
  
  cart: {
    title: "Shopping Cart - New Delhi Electricals",
    description: "Review your selected items and proceed to checkout. Your cart for electrical components and supplies.",
    keywords: ["cart", "shopping cart", "checkout"],
    type: "website"
  },
  
  shortlist: {
    title: "Shortlist - Saved Products | New Delhi Electricals",
    description: "View your shortlisted products. Save items for later and compare electrical components.",
    keywords: ["shortlist", "saved products", "wishlist"],
    type: "website"
  },
  
  compare: {
    title: "Compare Products - New Delhi Electricals",
    description: "Compare electrical products side by side. View specifications, features, and pricing to make informed decisions.",
    keywords: ["compare", "product comparison", "specifications"],
    type: "website"
  },
  
  search: {
    title: "Search Results - New Delhi Electricals",
    description: "Search results for electrical components, switches, wires, and more. Find the products you need.",
    keywords: ["search", "find products", "electrical search"],
    type: "website"
  }
};

/**
 * Generate dynamic SEO metadata for product pages
 */
export function getProductSEO(productName: string, description: string, imageUrl?: string): SEOMetadata {
  return {
    title: `${productName} - New Delhi Electricals`,
    description: description.length > 160 ? `${description.substring(0, 157)}...` : description,
    type: "product",
    image: imageUrl,
    twitterCard: imageUrl ? "summary_large_image" : "summary"
  };
}

/**
 * Generate dynamic SEO metadata for category pages
 */
export function getCategorySEO(categoryName: string, productCount?: number): SEOMetadata {
  const count = productCount ? ` - ${productCount} Products` : '';
  return {
    title: `${categoryName}${count} - New Delhi Electricals`,
    description: `Browse ${categoryName.toLowerCase()} products at New Delhi Electricals. Quality electrical components with competitive pricing.`,
    type: "website"
  };
}

/**
 * Generate dynamic SEO metadata for brand pages
 */
export function getBrandSEO(brandName: string, productCount?: number): SEOMetadata {
  const count = productCount ? ` - ${productCount} Products` : '';
  return {
    title: `${brandName}${count} - New Delhi Electricals`,
    description: `Shop ${brandName} electrical products at New Delhi Electricals. Authorized dealer with genuine products and warranty.`,
    type: "website"
  };
}

/**
 * Generate dynamic SEO metadata for search results
 */
export function getSearchSEO(query: string, resultCount?: number): SEOMetadata {
  const count = resultCount !== undefined ? ` - ${resultCount} Results` : '';
  return {
    title: `Search: ${query}${count} - New Delhi Electricals`,
    description: `Search results for "${query}". Find electrical components, switches, wires, and more at New Delhi Electricals.`,
    type: "website"
  };
}
