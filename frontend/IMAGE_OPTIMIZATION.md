# Image Optimization Guide

## Overview

This project uses `vite-imagetools` for automatic image optimization during the build process. Images are automatically converted to WebP format with JPG fallbacks for better performance.

## Automatic Optimizations

All images imported in the project are automatically:
- Converted to WebP format with JPG fallback
- Compressed to 80% quality
- Resized to a maximum width of 1920px
- Inlined if smaller than 4KB

## Using Optimized Images

### Static Imports (Recommended)

```typescript
import heroImage from "@/assets/hero-shop.jpg";

// Use in component
<img src={heroImage} alt="Hero" loading="lazy" />
```

### Advanced Usage with vite-imagetools

For more control over image optimization, you can use query parameters:

```typescript
// Generate multiple sizes for responsive images
import heroImage from "@/assets/hero.jpg?w=400;800;1200&format=webp";

// Use with srcset
<img 
  srcset={`${heroImage[0]} 400w, ${heroImage[1]} 800w, ${heroImage[2]} 1200w`}
  sizes="(max-width: 768px) 400px, (max-width: 1200px) 800px, 1200px"
  src={heroImage[1]}
  alt="Hero"
  loading="lazy"
/>
```

## Best Practices

### 1. Use Lazy Loading

Add `loading="lazy"` to all images that are not above the fold:

```typescript
<img src={image} alt="Description" loading="lazy" />
```

### 2. Use LazyImage Component

For product images and dynamic content, use the custom LazyImage component:

```typescript
import { LazyImage } from '@/components/ui/LazyImage';

<LazyImage 
  src={product.image} 
  alt={product.name}
  className="w-full h-full object-cover"
/>
```

### 3. Provide Alt Text

Always provide descriptive alt text for accessibility and SEO:

```typescript
<img src={image} alt="Premium modular switch in white finish" loading="lazy" />
```

### 4. Use Appropriate Image Formats

- **WebP**: Modern format with excellent compression (automatically generated)
- **JPG**: Fallback for older browsers (automatically generated)
- **PNG**: Use only for images requiring transparency
- **SVG**: Use for icons and logos

### 5. Optimize Image Dimensions

Before adding images to the project:
- Resize images to the maximum display size needed
- Don't upload images larger than 1920px wide
- Use appropriate resolution for the use case

## Image Size Guidelines

| Use Case | Recommended Max Width | Format |
|----------|----------------------|--------|
| Hero Images | 1920px | JPG/WebP |
| Product Images | 800px | JPG/WebP |
| Thumbnails | 400px | JPG/WebP |
| Icons | 64px | SVG |
| Logos | 200px | SVG/PNG |

## Performance Targets

- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1

## Monitoring

Use Lighthouse to monitor image performance:

```bash
npm run build
npm run preview
# Then run Lighthouse in Chrome DevTools
```

## Troubleshooting

### Images not loading after build

Check that:
1. Image paths are correct
2. Images are in the `src/assets` directory
3. Images are imported correctly in components

### Build errors with vite-imagetools

If you encounter build errors:
1. Ensure images are valid formats (JPG, PNG, WebP)
2. Check that image files are not corrupted
3. Verify vite-imagetools is installed: `npm list vite-imagetools`

## Additional Resources

- [Vite Image Tools Documentation](https://github.com/JonasKruckenberg/imagetools)
- [Web.dev Image Optimization Guide](https://web.dev/fast/#optimize-your-images)
- [MDN Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
