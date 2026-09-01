import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode, isSsrBuild }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/public': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    // Bundle analyzer - only in build mode
    !isSsrBuild && mode === 'production' && visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // 'sunburst', 'treemap', 'network'
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable minification
    minify: "esbuild",
    
    // Disable source maps in production
    sourcemap: mode === "development",
    
    // Configure code splitting
    rollupOptions: !isSsrBuild ? {
      output: {
        // Manual chunks for better code splitting
        ...(isSsrBuild ? {} : { manualChunks: {
          // Vendor chunks
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-accordion",
            "@radix-ui/react-popover",
          ],
          "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
          // framer-motion only. GSAP is deliberately NOT listed here: it is
          // dynamically imported by CinematicVideoHero (homepage) alone, and
          // naming it in a manual chunk merged it into a chunk that
          // framer-motion keeps eager, so every category/brand/hub route
          // downloaded and parsed the cinematic animation engine. Leaving it
          // out lets Rollup emit gsap + ScrollTrigger as async-only chunks
          // fetched by the homepage hero and nowhere else.
          // `lenis` was also listed but is imported by no shipped component.
          "animation-vendor": ["framer-motion"],
        } }),
        // Optimize chunk file names
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: isSsrBuild ? "[name].js" : "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
      },
    } : undefined,
    
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    // Enable CSS code splitting
    cssCodeSplit: true,
    
    // Target modern browsers for better optimization
    target: "esnext",
    
    // Optimize dependencies
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    
    // Optimize assets
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
  },
  
  // Enable tree shaking
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
}));
