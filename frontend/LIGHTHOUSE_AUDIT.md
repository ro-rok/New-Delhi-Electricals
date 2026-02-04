# Lighthouse Performance Audit Guide

## Overview

This guide explains how to run Lighthouse performance audits and interpret the results to ensure the website meets production performance standards.

## Performance Targets

### Desktop
- **Performance**: ≥ 85
- **Accessibility**: ≥ 90
- **Best Practices**: ≥ 90
- **SEO**: ≥ 90

### Mobile
- **Performance**: ≥ 75
- **Accessibility**: ≥ 90
- **Best Practices**: ≥ 90
- **SEO**: ≥ 90

## Running Lighthouse Audits

### Method 1: Chrome DevTools (Recommended for Development)

1. Build the production version:
   ```bash
   npm run build
   npm run preview
   ```

2. Open Chrome DevTools (F12)
3. Navigate to the "Lighthouse" tab
4. Select:
   - Device: Desktop or Mobile
   - Categories: Performance, Accessibility, Best Practices, SEO
   - Mode: Navigation
5. Click "Analyze page load"

### Method 2: Lighthouse CLI (Recommended for CI/CD)

1. Start the preview server:
   ```bash
   npm run build
   npm run preview
   ```

2. In a new terminal, run Lighthouse:
   ```bash
   npm run lighthouse
   ```

This will:
- Run Lighthouse audit on http://localhost:4173
- Generate an HTML report
- Automatically open the report in your browser

### Method 3: PageSpeed Insights (Production URLs)

1. Visit [PageSpeed Insights](https://pagespeed.web.dev/)
2. Enter your production URL
3. Click "Analyze"
4. Review both mobile and desktop scores

## Key Performance Metrics

### Core Web Vitals

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| **FID** (First Input Delay) | ≤ 100ms | 100ms - 300ms | > 300ms |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |

### Additional Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| **FCP** (First Contentful Paint) | < 1.8s | Time until first content appears |
| **TTI** (Time to Interactive) | < 3.5s | Time until page is fully interactive |
| **TBT** (Total Blocking Time) | < 300ms | Time main thread is blocked |
| **Speed Index** | < 3.4s | How quickly content is visually displayed |

## Current Optimizations

### ✅ Implemented

1. **Code Splitting**
   - Vendor chunks separated
   - Route-based lazy loading
   - Manual chunk configuration

2. **Image Optimization**
   - WebP format with JPG fallback
   - Lazy loading for below-the-fold images
   - Responsive images with srcset
   - Image compression (80% quality)

3. **Asset Optimization**
   - Minification enabled (esbuild)
   - CSS code splitting
   - Tree shaking enabled
   - Gzip/Brotli compression

4. **Loading Performance**
   - Preload critical resources
   - Defer non-critical JavaScript
   - Async loading for third-party scripts

5. **Caching Strategy**
   - Long-term caching for static assets
   - Content-based hashing for cache busting

## Common Issues and Solutions

### Issue: Low Performance Score

**Possible Causes:**
- Large JavaScript bundles
- Unoptimized images
- Render-blocking resources
- Long server response times

**Solutions:**
1. Review bundle analysis (`npm run build:analyze`)
2. Optimize images (use WebP, compress)
3. Implement lazy loading
4. Use CDN for static assets
5. Enable HTTP/2 or HTTP/3

### Issue: Poor LCP (Largest Contentful Paint)

**Possible Causes:**
- Large hero images
- Slow server response
- Render-blocking CSS/JS

**Solutions:**
1. Optimize hero images (compress, use WebP)
2. Preload critical images: `<link rel="preload" as="image" href="hero.webp">`
3. Inline critical CSS
4. Use CDN for images

### Issue: High CLS (Cumulative Layout Shift)

**Possible Causes:**
- Images without dimensions
- Dynamic content insertion
- Web fonts loading

**Solutions:**
1. Set explicit width/height on images
2. Reserve space for dynamic content
3. Use `font-display: swap` for web fonts
4. Avoid inserting content above existing content

### Issue: Long TBT (Total Blocking Time)

**Possible Causes:**
- Large JavaScript execution
- Heavy computations on main thread
- Unoptimized third-party scripts

**Solutions:**
1. Split large JavaScript bundles
2. Use Web Workers for heavy computations
3. Defer non-critical JavaScript
4. Optimize third-party scripts

## Audit Checklist

### Before Running Audit

- [ ] Build production version (`npm run build`)
- [ ] Test on preview server (`npm run preview`)
- [ ] Clear browser cache
- [ ] Disable browser extensions
- [ ] Use incognito/private mode

### Pages to Audit

- [ ] Home page (/)
- [ ] Category page (/category/switches)
- [ ] Product detail page (/product/...)
- [ ] Search results (/search)
- [ ] Contact page (/contact)
- [ ] About page (/about)

### Metrics to Check

- [ ] Performance score ≥ target
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] FCP < 1.8s
- [ ] TTI < 3.5s

## Interpreting Results

### Performance Score Breakdown

- **0-49**: Poor - Immediate action required
- **50-89**: Needs Improvement - Optimization recommended
- **90-100**: Good - Meets performance standards

### Priority Levels

1. **High Priority** (Red)
   - Core Web Vitals failures
   - Render-blocking resources
   - Large JavaScript bundles

2. **Medium Priority** (Orange)
   - Unoptimized images
   - Unused JavaScript
   - Missing cache headers

3. **Low Priority** (Yellow)
   - Minor optimizations
   - Best practice recommendations

## Continuous Monitoring

### Set Up Performance Budget

Create `lighthouserc.json`:

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:4173"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.85}],
        "categories:accessibility": ["error", {"minScore": 0.90}],
        "categories:best-practices": ["error", {"minScore": 0.90}],
        "categories:seo": ["error", {"minScore": 0.90}]
      }
    }
  }
}
```

### CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Build
  run: npm run build

- name: Start preview server
  run: npm run preview &
  
- name: Wait for server
  run: sleep 5

- name: Run Lighthouse
  run: npm run lighthouse

- name: Check performance budget
  run: lhci autorun
```

## Performance Optimization Workflow

1. **Baseline Audit**
   - Run Lighthouse on current version
   - Document current scores
   - Identify top issues

2. **Prioritize Issues**
   - Focus on Core Web Vitals first
   - Address high-impact issues
   - Quick wins vs. long-term improvements

3. **Implement Fixes**
   - Make one change at a time
   - Test after each change
   - Document improvements

4. **Verify Improvements**
   - Run Lighthouse again
   - Compare before/after scores
   - Ensure no regressions

5. **Monitor Continuously**
   - Set up automated audits
   - Track performance over time
   - Alert on regressions

## Resources

- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/)
- [Web.dev Performance Guide](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)

## Performance Report Template

```markdown
# Lighthouse Audit Report

**Date**: [Date]
**URL**: [URL]
**Device**: Desktop/Mobile

## Scores

| Category | Score | Target | Status |
|----------|-------|--------|--------|
| Performance | XX | ≥85 | ✅/❌ |
| Accessibility | XX | ≥90 | ✅/❌ |
| Best Practices | XX | ≥90 | ✅/❌ |
| SEO | XX | ≥90 | ✅/❌ |

## Core Web Vitals

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| LCP | X.Xs | <2.5s | ✅/❌ |
| FID | XXms | <100ms | ✅/❌ |
| CLS | X.XX | <0.1 | ✅/❌ |

## Key Issues

1. [Issue description]
   - Impact: High/Medium/Low
   - Solution: [Proposed solution]

## Recommendations

1. [Recommendation 1]
2. [Recommendation 2]

## Next Steps

- [ ] Address high-priority issues
- [ ] Re-run audit
- [ ] Monitor in production
```
