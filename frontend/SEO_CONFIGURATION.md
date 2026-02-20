# SEO Configuration Guide

## Overview
This document explains the SEO and social sharing configuration for New Delhi Electricals website, specifically for WhatsApp, Facebook, Twitter, and other social platforms.

## Environment Variables

### Development (.env)
```
VITE_API_BASE_URL=http://localhost:8000
VITE_SITE_URL=http://localhost:5173
```

### Production (.env.production)
```
VITE_API_BASE_URL=https://api.newdelhielectricals.com
VITE_SITE_URL=https://www.newdelhielectricals.com
```

## Key Features

### 1. Open Graph Tags (for WhatsApp, Facebook, LinkedIn)
- `og:title` - Product name with compelling title
- `og:description` - Product description with call-to-action
- `og:type` - Set to "product" for product pages
- `og:image` - Absolute URL to product image (1200x630 recommended)
- `og:image:secure_url` - HTTPS version of image
- `og:image:width` - Image width (1200px)
- `og:image:height` - Image height (630px)
- `og:url` - Canonical URL of the page
- `og:site_name` - "New Delhi Electricals"

### 2. Twitter Card Tags
- `twitter:card` - "summary_large_image" for products with images
- `twitter:title` - Product name
- `twitter:description` - Product description
- `twitter:image` - Absolute URL to product image
- `twitter:site` - @newdelhielec

### 3. Product SEO
Product pages automatically generate:
- Title: `{Product Name} - Buy Online at Best Price | New Delhi Electricals`
- Description: `Buy {Product Name} at best prices from New Delhi Electricals. Premium quality electrical products with warranty. Shop online or visit our store in South Delhi.`
- Image: Absolute URL to first product image

## How It Works

### Image URL Conversion
The system automatically converts relative image URLs to absolute URLs:
- Relative: `/assets/product.jpg`
- Absolute: `https://www.newdelhielectricals.com/assets/product.jpg`

This ensures images display correctly in WhatsApp, Facebook, and other social platforms.

### Dynamic Meta Tags
The `SEOHead` component dynamically updates meta tags when:
- User navigates to a product page
- Product data loads
- Images are available

## Testing Social Sharing

### WhatsApp
1. Share a product URL in WhatsApp
2. WhatsApp will fetch the Open Graph tags
3. Preview should show:
   - Product image
   - Product name
   - Description with "Buy at best prices..."

### Facebook
Use Facebook Sharing Debugger:
https://developers.facebook.com/tools/debug/

### Twitter
Use Twitter Card Validator:
https://cards-dev.twitter.com/validator

### LinkedIn
Use LinkedIn Post Inspector:
https://www.linkedin.com/post-inspector/

## Troubleshooting

### Images Not Showing
1. Verify `VITE_SITE_URL` is set correctly in production
2. Check that product images are accessible via HTTPS
3. Ensure images are at least 200x200px (recommended 1200x630px)
4. Clear social platform cache using their debugging tools

### Description Not Showing
1. Check that product has a description in the database
2. Verify SEO component is rendering on the page
3. Description should be 50-160 characters for best results

### Wrong URL
1. Verify canonical URL is set correctly
2. Check that `window.location.href` matches expected URL
3. Ensure no redirects are interfering

## Best Practices

1. **Image Size**: Use 1200x630px for optimal display across all platforms
2. **Image Format**: Use JPG or PNG (avoid WebP for better compatibility)
3. **Description Length**: Keep between 50-160 characters
4. **Title Length**: Keep under 60 characters
5. **Image Hosting**: Ensure images are served over HTTPS
6. **Cache**: Social platforms cache meta tags for 24-48 hours

## Files Modified

- `frontend/src/components/SEOHead.tsx` - Enhanced Open Graph and Twitter tags
- `frontend/src/lib/seo.ts` - Added absolute URL conversion and better descriptions
- `frontend/index.html` - Updated default meta tags with absolute URLs
- `frontend/.env` - Added VITE_SITE_URL
- `frontend/.env.production` - Production configuration

## Deployment Checklist

- [ ] Set `VITE_SITE_URL=https://www.newdelhielectricals.com` in Vercel environment variables
- [ ] Verify all product images are accessible via HTTPS
- [ ] Test sharing on WhatsApp, Facebook, and Twitter
- [ ] Clear social platform caches if needed
- [ ] Monitor social sharing analytics
