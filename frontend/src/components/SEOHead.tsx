import { useEffect } from 'react';

export interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
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
  type = 'website' 
}: SEOHeadProps): null {
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

    // Set Open Graph tags
    setMetaTag('og:title', title);
    setMetaTag('og:description', description);
    setMetaTag('og:type', type);
    
    if (image) {
      setMetaTag('og:image', image);
    }
    
    if (url) {
      setMetaTag('og:url', url);
      
      // Set canonical URL
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', url);
    }

    // Set Twitter Card tags
    setMetaTag('twitter:card', image ? 'summary_large_image' : 'summary', true);
    setMetaTag('twitter:title', title, true);
    setMetaTag('twitter:description', description, true);
    
    if (image) {
      setMetaTag('twitter:image', image, true);
    }

    // Cleanup function (optional - meta tags typically persist across page changes in SPAs)
    return () => {
      // We don't remove meta tags on unmount as they should be replaced by the next page
    };
  }, [title, description, image, url, type]);

  // This component doesn't render anything
  return null;
}

export default SEOHead;
