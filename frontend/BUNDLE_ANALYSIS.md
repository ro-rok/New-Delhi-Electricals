# Bundle Analysis Guide

## Overview

This project uses `rollup-plugin-visualizer` to analyze the production bundle and identify optimization opportunities.

## Running Bundle Analysis

### Generate Analysis Report

```bash
npm run build
```

This will:
1. Build the production bundle
2. Generate a `dist/stats.html` file with interactive bundle visualization

### View Analysis Report

Open `dist/stats.html` in your browser to view:
- Bundle size breakdown by module
- Gzip and Brotli compressed sizes
- Dependency tree visualization
- Largest dependencies

## Current Bundle Structure

Based on the latest build:

### Main Bundles

| Bundle | Size | Gzipped | Description |
|--------|------|---------|-------------|
| index.js | 185.46 KB | 55.14 KB | Main application code |
| react-vendor.js | 162.61 KB | 53.34 KB | React, React DOM, React Router |
| animation-vendor.js | 122.55 KB | 40.79 KB | Framer Motion, GSAP, Lenis |
| ui-vendor.js | 107.34 KB | 34.84 KB | Radix UI components |
| form-vendor.js | 52.96 KB | 12.11 KB | React Hook Form, Zod |

### Page Chunks (Lazy Loaded)

| Page | Size | Gzipped | Description |
|------|------|---------|-------------|
| AdminProducts | 40.54 KB | 9.88 KB | Admin product management |
| CategoryPage | 35.41 KB | 9.43 KB | Category listing page |
| ProductSlugPage | 19.90 KB | 5.88 KB | Product detail page |
| BrandPage | 18.22 KB | 5.15 KB | Brand page |
| AdminImport | 16.41 KB | 5.37 KB | Admin import functionality |

## Optimization Strategies

### 1. Code Splitting

The build is configured with manual chunks for:
- **react-vendor**: Core React libraries
- **ui-vendor**: UI component libraries (Radix UI)
- **form-vendor**: Form handling libraries
- **animation-vendor**: Animation libraries

This ensures:
- Better caching (vendor code changes less frequently)
- Parallel loading of chunks
- Smaller initial bundle size

### 2. Lazy Loading

All page components are lazy loaded using `React.lazy()`:
- Pages load only when navigated to
- Reduces initial bundle size
- Improves Time to Interactive (TTI)

### 3. Tree Shaking

Vite automatically removes unused code:
- Only imported functions are included
- Dead code is eliminated
- Unused exports are removed

## Identifying Large Dependencies

### Current Large Dependencies

1. **Framer Motion** (animation-vendor): 122.55 KB
   - Used for: Page transitions, animations
   - Optimization: Consider using CSS animations for simple cases

2. **Radix UI** (ui-vendor): 107.34 KB
   - Used for: Accessible UI components
   - Optimization: Already split into separate chunk

3. **React Router** (react-vendor): Part of 162.61 KB
   - Used for: Client-side routing
   - Optimization: Essential, already optimized

### How to Identify Issues

1. Open `dist/stats.html` in browser
2. Look for:
   - Large modules (> 50 KB)
   - Duplicate dependencies
   - Unused code
3. Use the treemap view to visualize size distribution

## Performance Targets

### Bundle Size Targets

- **Initial JS**: < 200 KB (gzipped) ✅ Currently: 55.14 KB
- **Total JS**: < 500 KB (gzipped) ✅ Currently: ~200 KB
- **CSS**: < 50 KB (gzipped) ✅ Currently: 17.60 KB

### Loading Performance Targets

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s

## Optimization Checklist

- [x] Code splitting configured
- [x] Lazy loading implemented for routes
- [x] Vendor chunks separated
- [x] Tree shaking enabled
- [x] Minification enabled
- [x] CSS code splitting enabled
- [x] Source maps disabled in production
- [ ] Consider reducing animation library size
- [ ] Monitor bundle size on each build

## Monitoring Bundle Size

### Set Up Size Limits

Add to `package.json`:

```json
{
  "size-limit": [
    {
      "path": "dist/assets/js/index-*.js",
      "limit": "200 KB"
    },
    {
      "path": "dist/assets/js/react-vendor-*.js",
      "limit": "170 KB"
    }
  ]
}
```

### CI/CD Integration

Add to your CI pipeline:

```bash
npm run build
# Check if bundle size exceeds limits
# Fail build if size increases significantly
```

## Troubleshooting

### Bundle Size Increased

1. Check `dist/stats.html` for new large dependencies
2. Review recent dependency additions
3. Consider alternatives or lazy loading

### Duplicate Dependencies

1. Check for multiple versions of same package
2. Use `npm dedupe` to consolidate
3. Review peer dependencies

### Large Chunks

1. Split large chunks further using dynamic imports
2. Consider lazy loading heavy features
3. Review if all code in chunk is necessary

## Additional Resources

- [Vite Build Optimization](https://vitejs.dev/guide/build.html)
- [Rollup Plugin Visualizer](https://github.com/btd/rollup-plugin-visualizer)
- [Web.dev Bundle Size Guide](https://web.dev/reduce-javascript-payloads-with-code-splitting/)
