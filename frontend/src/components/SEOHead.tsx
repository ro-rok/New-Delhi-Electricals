import { useEffect } from 'react';
import { useSEOCollector } from '@/lib/seoCollector';

export interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  robots?: string;
  canonicalPath?: string;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * SEOHead component for managing page metadata
 * Sets document title and injects meta tags for SEO and social sharing
 */
export function SEOHead({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website',
  robots = 'index, follow',
  canonicalPath,
  structuredData,
}: SEOHeadProps): null {
  const collector = useSEOCollector();
  // The server entry collects this exact model into <head>; the browser effect
  // below keeps it current for client-side navigation.
  collector?.set({ title, description, image, url, type, robots, canonicalPath, structuredData });

  useEffect(() => {
    // Set document title
    document.title = title;

    // Helper function to set or update meta tag
    const setMetaTag = (property: string, content: string, isName = false) => {
      const attribute = isName ? 'name' : 'property';
      let element = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Set description meta tag
    setMetaTag('description', description, true);
    setMetaTag('robots', robots, true);

    // Set Open Graph tags
    setMetaTag('og:title', title);
    setMetaTag('og:description', description);
    setMetaTag('og:type', type);
    setMetaTag('og:site_name', 'New Delhi Electricals');
    
    if (image) {
      setMetaTag('og:image', image);
      setMetaTag('og:image:secure_url', image);
      setMetaTag('og:image:width', '1200');
      setMetaTag('og:image:height', '630');
      setMetaTag('og:image:alt', title);
    }
    
    // Set current URL if not provided
    const siteUrl = 'https://www.newdelhielectricals.com';
    const currentPath = canonicalPath || (url ? new URL(url, siteUrl).pathname : window.location.pathname);
    const currentUrl = new URL(currentPath || '/', siteUrl).toString();
    setMetaTag('og:url', currentUrl);
    
    // Set canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    // Set Twitter Card tags
    setMetaTag('twitter:card', image ? 'summary_large_image' : 'summary', true);
    setMetaTag('twitter:title', title, true);
    setMetaTag('twitter:description', description, true);
    setMetaTag('twitter:site', '@newdelhielec', true);
    
    if (image) {
      const absoluteImage = new URL(image, siteUrl).toString();
      setMetaTag('og:image', absoluteImage);
      setMetaTag('og:image:secure_url', absoluteImage);
      setMetaTag('twitter:image', absoluteImage, true);
      setMetaTag('twitter:image:alt', title, true);
    }

    document.querySelectorAll('script[data-seo-schema]').forEach((element) => element.remove());
    const schemas = structuredData ? (Array.isArray(structuredData) ? structuredData : [structuredData]) : [];
    schemas.forEach((schema) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seoSchema = 'true';
      script.text = JSON.stringify(schema).replace(/</g, '\\u003c');
      document.head.appendChild(script);
    });

    // Cleanup function (optional - meta tags typically persist across page changes in SPAs)
    return () => {
      // We don't remove meta tags on unmount as they should be replaced by the next page
    };
  }, [title, description, image, url, type, robots, canonicalPath, structuredData]);

  // This component doesn't render anything
  return null;
}

export default SEOHead;
