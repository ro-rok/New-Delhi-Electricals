/**
 * Sitemap Generator for New Delhi Electricals
 * Generates an XML sitemap with all public pages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base URL for the website
const BASE_URL = 'https://newdelhielectricals.com';

// Static pages with their priorities and change frequencies
const staticPages = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/about', priority: '0.8', changefreq: 'monthly' },
  { url: '/services', priority: '0.8', changefreq: 'monthly' },
  { url: '/contact', priority: '0.8', changefreq: 'monthly' },
  { url: '/faq', priority: '0.7', changefreq: 'monthly' },
  { url: '/categories', priority: '0.9', changefreq: 'weekly' },
  { url: '/brands', priority: '0.9', changefreq: 'weekly' },
  { url: '/cart', priority: '0.5', changefreq: 'never' },
  { url: '/shortlist', priority: '0.5', changefreq: 'never' },
  { url: '/compare', priority: '0.5', changefreq: 'never' },
];

// Generate current date in ISO format
const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

// Generate sitemap XML
const generateSitemap = () => {
  const currentDate = getCurrentDate();
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Add static pages
  staticPages.forEach(page => {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}${page.url}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  
  return xml;
};

// Write sitemap to public directory
const writeSitemap = () => {
  const sitemap = generateSitemap();
  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  
  fs.writeFileSync(outputPath, sitemap, 'utf8');
  console.log('✓ Sitemap generated successfully at:', outputPath);
  console.log(`✓ Total URLs: ${staticPages.length}`);
};

// Run the script
try {
  writeSitemap();
} catch (error) {
  console.error('Error generating sitemap:', error);
  process.exit(1);
}
