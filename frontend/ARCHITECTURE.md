## App Architecture – Delhi Electrical Hub

This document explains how the app is structured today and gives you a clean mental model for working in it. It is **## App Architecture – Delhi Electrical Hub

This document explains how the app is structured today and gives you a clean mental model for working in it. It is **descriptive**, not prescriptive – you can evolve it as the project grows.

---

## Tech Stack Overview

- **Build tool**: Vite
- **Language**: TypeScript
- **Framework**: React (SPA)
- **Styling**: Tailwind CSS + custom CSS
- **UI kit**: Shadcn-style component library under `src/components/ui`

---

## High-level Layers

Think of the app in these layers:

- **App shell & bootstrapping**
  - `src/main.tsx` – React entrypoint, renders the app into `index.html`, wires global providers.
  - `src/App.tsx` – root component; sets up global layout and routing (if/when you add a router).

- **Pages (route-level screens)**
  - `src/pages` – each file is a **page** (full screen) composed from feature and UI components.
  - `src/pages/admin` – admin-only screens (dashboard, products, logs, etc.).

- **Feature / section components**
  - `src/components` – reusable, page-agnostic building blocks and feature sections.
  - Subfolders like `brand`, `catalog`, and `home` group components by **feature**.

- **State, hooks, and domain**
  - `src/contexts` – React contexts (global/shared state for the app).
  - `src/hooks` – reusable logic hooks (recently viewed, shortlist, comparison, analytics, etc.).
  - `src/types` – TypeScript models for products, categories, brands, and other domain types.
  - `src/data` – mock/seed data used to drive the UI in the absence of a real backend.

- **Shared UI / design system**
  - `src/components/ui` – low-level, reusable UI primitives (buttons, inputs, dialogs, tables, etc.).
  - These components are meant to be **generic and stateless**, styled and behaviorally consistent.

- **Utilities & assets**
  - `src/lib/utils.ts` – small utility helpers (formatting, class name helpers, etc.).
  - `src/assets` – images used within React code.
  - `public` – static assets served as-is (favicon, `robots.txt`, placeholders, etc.).

---

## Directory-by-directory Breakdown

### Root

- `index.html` – main HTML shell; Vite injects the React bundle here.
- `package.json`, `bun.lockb`, `package-lock.json` – dependencies and lockfiles.
- `vite.config.ts` – Vite configuration (aliases, plugins, dev server, etc.).
- `tailwind.config.ts`, `postcss.config.js` – Tailwind and PostCSS configuration.
- `tsconfig*.json` – TypeScript configuration for app and tooling.
- `eslint.config.js` – linting configuration.

### `src/` – Application Source

- `main.tsx`
  - Bootstraps the React app.
  - Mounts `App` to the DOM.
  - Ideal place to plug global providers (e.g., context providers, theme providers).

- `App.tsx`
  - Root component for the SPA.
  - Should focus on:
    - High-level layout (header/footer, global wrappers).
    - Routing between pages (if you add a router like React Router).

- `index.css`, `App.css`
  - Global and app-level styling.
  - Tailwind base layers, CSS variables, and overrides.

---

### `src/pages` – Route-level Screens

These are **top-level screens** that users (or admins) navigate to. Each page should:

- Compose feature components from `src/components`.
- Contain minimal layout logic.
- Avoid deep business logic – prefer hooks or contexts for that.

Key pages:

- Public/customer-facing:
  - `Home.tsx`, `Index.tsx`, `NotFound.tsx`
  - `AboutPage.tsx`
  - `BrandPage.tsx`, `BrandsListPage.tsx`
  - `CategoryPage.tsx`, `CategoriesListPage.tsx`
  - `ProductPage.tsx`, `ComparePage.tsx`, `ShortlistPage.tsx`

- Admin (`src/pages/admin`):
  - `AdminLayout.tsx` – shared shell for admin pages (nav, header, common layout).
  - `AdminDashboard.tsx`
  - `AdminProducts.tsx`, `AdminCategories.tsx`, `AdminBrands.tsx`
  - `AdminInquiries.tsx`, `AdminLogs.tsx`
  - `AdminSettings.tsx`, `AdminImport.tsx`
  - `AdminLogin.tsx`

---

### `src/components` – Reusable & Feature Components

This folder contains both generic and feature-specific pieces used by pages.

- General-purpose sections:
  - `Hero.tsx`, `AboutUs.tsx`, `ProductCategories.tsx`, `Testimonials.tsx`
  - `WhyChooseUs.tsx`, `Contact.tsx`, `EnquiryForm.tsx`, `Footer.tsx`
  - `WhatsAppButton.tsx`, `WhatsAppFab.tsx`, `NavLink.tsx`

- Layout:
  - `layout/Header.tsx` – top navigation, logo, global links.

- Home feature (`src/components/home`)
  - `HeroSection.tsx` – primary hero for the home page.
  - `PremiumHero.tsx` – premium-focused hero variant.
  - `FloatingSearchBar.tsx` – search overlay for quick product lookup.
  - `WhatsAppStrip.tsx` – WhatsApp CTA strip on the home page.

- Brand feature (`src/components/brand`)
  - `BrandHero.tsx` – hero/header for brand-specific pages.
  - `CatalogModal.tsx` – modal to show a brand catalog or brochure.
  - `FeaturedCollection.tsx` – highlight a curated set of brand products.
  - `ProductSection.tsx` – reusable layout for groups of products.
  - `WhatsAppCTA.tsx` – WhatsApp call-to-action block.

- Catalog feature (`src/components/catalog`)
  - `BrandShowcase.tsx` – displays multiple brands.
  - `CatalogViewer.tsx` – allows browsing product catalogs.
  - `CategoryGrid.tsx` – category tiles/grid layout.
  - `FeaturedProducts.tsx` – highlight key products.
  - `ProductCard.tsx` – card for a single product.
  - `RecentlyViewed.tsx` – uses hooks/state to show recently viewed products.
  - `SearchModal.tsx` – search overlay for catalog exploration.

---

### `src/components/ui` – Design System & Primitives

This is your **UI kit**. Components here should:

- Be **generic, reusable, and composable**.
- Avoid feature-specific logic; they shouldn’t “know” about products, brands, etc.
- Provide consistent styling and UX across the app.

Examples:

- Form & input: `input.tsx`, `textarea.tsx`, `checkbox.tsx`, `radio-group.tsx`, `select.tsx`
- Feedback: `toast.tsx`, `toaster.tsx`, `alert.tsx`, `sonner.tsx`
- Layout & structure: `card.tsx`, `tabs.tsx`, `accordion.tsx`, `resizable.tsx`, `scroll-area.tsx`
- Navigation: `navigation-menu.tsx`, `menubar.tsx`, `pagination.tsx`, `sidebar.tsx`
- Overlays: `dialog.tsx`, `drawer.tsx`, `sheet.tsx`, `popover.tsx`, `tooltip.tsx`, `hover-card.tsx`
- Misc: `button.tsx`, `badge.tsx`, `avatar.tsx`, `carousel.tsx`, `calendar.tsx`
- Special: `MagneticButton.tsx` – fancier button behavior for standout CTAs.

There is also a `use-toast.ts` helper colocated here to make toast usage ergonomic.

---

### `src/contexts` – Global State & Contexts

- `AppContext.tsx`
  - Central place to store cross-cutting app state (e.g., shortlist, comparison, user info, global filters).
  - Exposes context providers and hooks that can be used in pages and components.
  - Good place to keep state that spans multiple unrelated components or routes.

Keep context files **small and focused**; consider additional contexts if the app grows (e.g., `AuthContext`, `ThemeContext`, `CatalogContext`).

---

### `src/hooks` – Reusable Logic Hooks

Hooks encapsulate logic that is reused in multiple places or that should be separated from rendering concerns.

Current hooks include:

- UX / device:
  - `use-mobile.tsx` – detects or reacts to mobile vs desktop usage.
  - `useMagneticEffect.ts` – shared behavior for magnetic hover effects (e.g. `MagneticButton`).

- Product-centric logic:
  - `useRecentlyViewed.ts` – manage recently viewed products.
  - `useShortlist.ts` – manage a shortlist/wishlist of products.
  - `useComparison.ts` – handle comparing multiple products.

- Cross-cutting concerns:
  - `useAnalytics.ts` – track analytics events.
  - `useToast.ts` – convenience wrapper around toast utilities.

Use this folder whenever you find view-independent logic that you want to reuse across components or pages.

---

### `src/types` – Domain Models

- `product.ts`
  - Shared TypeScript types/interfaces for products, categories, brands, and any related catalog structures.
  - Ensures consistency across hooks, components, and pages when working with product data.

You can add more files here as the domain grows (e.g., `user.ts`, `order.ts`, `inquiry.ts`).

---

### `src/data` – Mock / Static Data

- `mockData.ts`
  - Contains seed/mock data used to render UI in the absence of a live backend.
  - Useful for local development and design iterations.

As you move to a real backend, this file can either be removed or converted into test/demo data.

---

### `src/lib` – Utilities

- `utils.ts`
  - Generic functions that don’t belong to any particular feature (e.g., formatting, class names).
  - Keep these pure and side-effect free when possible.

Use this folder for any helpers that don’t naturally fit under `hooks`, `components`, or `pages`.

---

### `src/assets` – Images & Media

- Product and hero images:
  - `hero-premium.jpg`, `hero-shop.jpg`, `industrial-hero.jpg`, `smart-home-hero.jpg`, etc.
  - Product imagery like `product-light-premium.jpg`, `product-mcb-premium.jpg`, `product-switch-premium.jpg`, `product-wire-premium.jpg`.
  - Category imagery like `lights.jpg`, `switches.jpg`, `fans.jpg`, `wires-cables.jpg`, `products-collection.jpg`.

These are imported into React components as modules and bundled by Vite.

---

## Recommended Mental Model (Without Refactor)

You can think of your current structure as **four conceptual layers**, without changing any file paths:

- **1. App shell**
  - `main.tsx`, `App.tsx`

- **2. Screens**
  - Everything in `src/pages/**`

- **3. Features**
  - Feature-specific components in:
    - `src/components/home`
    - `src/components/brand`
    - `src/components/catalog`
    - Admin-focused building blocks you might later extract from `src/pages/admin`

- **4. Shared**
  - Shared components: `src/components` (root) and `src/components/layout`
  - Shared UI primitives: `src/components/ui`
  - Shared hooks: `src/hooks`
  - Shared types & data: `src/types`, `src/data`
  - Shared utilities: `src/lib`

When adding new code, choose a location by answering:

1. **Is it a full screen / route?** → `src/pages`
2. **Is it tied to a specific feature (home, brand, catalog, admin)?** → that feature’s folder in `src/components`
3. **Is it a generic UI building block?** → `src/components/ui`
4. **Is it reusable logic, not UI?** → `src/hooks`
5. **Is it a shared type or data shape?** → `src/types`
6. **Is it sample/static data?** → `src/data`
7. **Is it a generic helper function?** → `src/lib`

This keeps the app **modular, discoverable, and easy to scale** as more features are added.

descriptive**, not prescriptive – you can evolve it as the project grows.

---

## Tech Stack Overview

- **Build tool**: Vite
- **Language**: TypeScript
- **Framework**: React (SPA)
- **Styling**: Tailwind CSS + custom CSS
- **UI kit**: Shadcn-style component library under `src/components/ui`

---

## High-level Layers

Think of the app in these layers:

- **App shell & bootstrapping**
  - `src/main.tsx` – React entrypoint, renders the app into `index.html`, wires global providers.
  - `src/App.tsx` – root component; sets up global layout and routing (if/when you add a router).

- **Pages (route-level screens)**
  - `src/pages` – each file is a **page** (full screen) composed from feature and UI components.
  - `src/pages/admin` – admin-only screens (dashboard, products, logs, etc.).

- **Feature / section components**
  - `src/components` – reusable, page-agnostic building blocks and feature sections.
  - Subfolders like `brand`, `catalog`, and `home` group components by **feature**.

- **State, hooks, and domain**
  - `src/contexts` – React contexts (global/shared state for the app).
  - `src/hooks` – reusable logic hooks (recently viewed, shortlist, comparison, analytics, etc.).
  - `src/types` – TypeScript models for products, categories, brands, and other domain types.
  - `src/data` – mock/seed data used to drive the UI in the absence of a real backend.

- **Shared UI / design system**
  - `src/components/ui` – low-level, reusable UI primitives (buttons, inputs, dialogs, tables, etc.).
  - These components are meant to be **generic and stateless**, styled and behaviorally consistent.

- **Utilities & assets**
  - `src/lib/utils.ts` – small utility helpers (formatting, class name helpers, etc.).
  - `src/assets` – images used within React code.
  - `public` – static assets served as-is (favicon, `robots.txt`, placeholders, etc.).

---

## Directory-by-directory Breakdown

### Root

- `index.html` – main HTML shell; Vite injects the React bundle here.
- `package.json`, `bun.lockb`, `package-lock.json` – dependencies and lockfiles.
- `vite.config.ts` – Vite configuration (aliases, plugins, dev server, etc.).
- `tailwind.config.ts`, `postcss.config.js` – Tailwind and PostCSS configuration.
- `tsconfig*.json` – TypeScript configuration for app and tooling.
- `eslint.config.js` – linting configuration.

### `src/` – Application Source

- `main.tsx`
  - Bootstraps the React app.
  - Mounts `App` to the DOM.
  - Ideal place to plug global providers (e.g., context providers, theme providers).

- `App.tsx`
  - Root component for the SPA.
  - Should focus on:
    - High-level layout (header/footer, global wrappers).
    - Routing between pages (if you add a router like React Router).

- `index.css`, `App.css`
  - Global and app-level styling.
  - Tailwind base layers, CSS variables, and overrides.

---

### `src/pages` – Route-level Screens

These are **top-level screens** that users (or admins) navigate to. Each page should:

- Compose feature components from `src/components`.
- Contain minimal layout logic.
- Avoid deep business logic – prefer hooks or contexts for that.

Key pages:

- Public/customer-facing:
  - `Home.tsx`, `Index.tsx`, `NotFound.tsx`
  - `AboutPage.tsx`
  - `BrandPage.tsx`, `BrandsListPage.tsx`
  - `CategoryPage.tsx`, `CategoriesListPage.tsx`
  - `ProductPage.tsx`, `ComparePage.tsx`, `ShortlistPage.tsx`

- Admin (`src/pages/admin`):
  - `AdminLayout.tsx` – shared shell for admin pages (nav, header, common layout).
  - `AdminDashboard.tsx`
  - `AdminProducts.tsx`, `AdminCategories.tsx`, `AdminBrands.tsx`
  - `AdminInquiries.tsx`, `AdminLogs.tsx`
  - `AdminSettings.tsx`, `AdminImport.tsx`
  - `AdminLogin.tsx`

---

### `src/components` – Reusable & Feature Components

This folder contains both generic and feature-specific pieces used by pages.

- General-purpose sections:
  - `Hero.tsx`, `AboutUs.tsx`, `ProductCategories.tsx`, `Testimonials.tsx`
  - `WhyChooseUs.tsx`, `Contact.tsx`, `EnquiryForm.tsx`, `Footer.tsx`
  - `WhatsAppButton.tsx`, `WhatsAppFab.tsx`, `NavLink.tsx`

- Layout:
  - `layout/Header.tsx` – top navigation, logo, global links.

- Home feature (`src/components/home`)
  - `HeroSection.tsx` – primary hero for the home page.
  - `PremiumHero.tsx` – premium-focused hero variant.
  - `FloatingSearchBar.tsx` – search overlay for quick product lookup.
  - `WhatsAppStrip.tsx` – WhatsApp CTA strip on the home page.

- Brand feature (`src/components/brand`)
  - `BrandHero.tsx` – hero/header for brand-specific pages.
  - `CatalogModal.tsx` – modal to show a brand catalog or brochure.
  - `FeaturedCollection.tsx` – highlight a curated set of brand products.
  - `ProductSection.tsx` – reusable layout for groups of products.
  - `WhatsAppCTA.tsx` – WhatsApp call-to-action block.

- Catalog feature (`src/components/catalog`)
  - `BrandShowcase.tsx` – displays multiple brands.
  - `CatalogViewer.tsx` – allows browsing product catalogs.
  - `CategoryGrid.tsx` – category tiles/grid layout.
  - `FeaturedProducts.tsx` – highlight key products.
  - `ProductCard.tsx` – card for a single product.
  - `RecentlyViewed.tsx` – uses hooks/state to show recently viewed products.
  - `SearchModal.tsx` – search overlay for catalog exploration.

---

### `src/components/ui` – Design System & Primitives

This is your **UI kit**. Components here should:

- Be **generic, reusable, and composable**.
- Avoid feature-specific logic; they shouldn’t “know” about products, brands, etc.
- Provide consistent styling and UX across the app.

Examples:

- Form & input: `input.tsx`, `textarea.tsx`, `checkbox.tsx`, `radio-group.tsx`, `select.tsx`
- Feedback: `toast.tsx`, `toaster.tsx`, `alert.tsx`, `sonner.tsx`
- Layout & structure: `card.tsx`, `tabs.tsx`, `accordion.tsx`, `resizable.tsx`, `scroll-area.tsx`
- Navigation: `navigation-menu.tsx`, `menubar.tsx`, `pagination.tsx`, `sidebar.tsx`
- Overlays: `dialog.tsx`, `drawer.tsx`, `sheet.tsx`, `popover.tsx`, `tooltip.tsx`, `hover-card.tsx`
- Misc: `button.tsx`, `badge.tsx`, `avatar.tsx`, `carousel.tsx`, `calendar.tsx`
- Special: `MagneticButton.tsx` – fancier button behavior for standout CTAs.

There is also a `use-toast.ts` helper colocated here to make toast usage ergonomic.

---

### `src/contexts` – Global State & Contexts

- `AppContext.tsx`
  - Central place to store cross-cutting app state (e.g., shortlist, comparison, user info, global filters).
  - Exposes context providers and hooks that can be used in pages and components.
  - Good place to keep state that spans multiple unrelated components or routes.

Keep context files **small and focused**; consider additional contexts if the app grows (e.g., `AuthContext`, `ThemeContext`, `CatalogContext`).

---

### `src/hooks` – Reusable Logic Hooks

Hooks encapsulate logic that is reused in multiple places or that should be separated from rendering concerns.

Current hooks include:

- UX / device:
  - `use-mobile.tsx` – detects or reacts to mobile vs desktop usage.
  - `useMagneticEffect.ts` – shared behavior for magnetic hover effects (e.g. `MagneticButton`).

- Product-centric logic:
  - `useRecentlyViewed.ts` – manage recently viewed products.
  - `useShortlist.ts` – manage a shortlist/wishlist of products.
  - `useComparison.ts` – handle comparing multiple products.

- Cross-cutting concerns:
  - `useAnalytics.ts` – track analytics events.
  - `useToast.ts` – convenience wrapper around toast utilities.

Use this folder whenever you find view-independent logic that you want to reuse across components or pages.

---

### `src/types` – Domain Models

- `product.ts`
  - Shared TypeScript types/interfaces for products, categories, brands, and any related catalog structures.
  - Ensures consistency across hooks, components, and pages when working with product data.

You can add more files here as the domain grows (e.g., `user.ts`, `order.ts`, `inquiry.ts`).

---

### `src/data` – Mock / Static Data

- `mockData.ts`
  - Contains seed/mock data used to render UI in the absence of a live backend.
  - Useful for local development and design iterations.

As you move to a real backend, this file can either be removed or converted into test/demo data.

---

### `src/lib` – Utilities

- `utils.ts`
  - Generic functions that don’t belong to any particular feature (e.g., formatting, class names).
  - Keep these pure and side-effect free when possible.

Use this folder for any helpers that don’t naturally fit under `hooks`, `components`, or `pages`.

---

### `src/assets` – Images & Media

- Product and hero images:
  - `hero-premium.jpg`, `hero-shop.jpg`, `industrial-hero.jpg`, `smart-home-hero.jpg`, etc.
  - Product imagery like `product-light-premium.jpg`, `product-mcb-premium.jpg`, `product-switch-premium.jpg`, `product-wire-premium.jpg`.
  - Category imagery like `lights.jpg`, `switches.jpg`, `fans.jpg`, `wires-cables.jpg`, `products-collection.jpg`.

These are imported into React components as modules and bundled by Vite.

---

## Recommended Mental Model (Without Refactor)

You can think of your current structure as **four conceptual layers**, without changing any file paths:

- **1. App shell**
  - `main.tsx`, `App.tsx`

- **2. Screens**
  - Everything in `src/pages/**`

- **3. Features**
  - Feature-specific components in:
    - `src/components/home`
    - `src/components/brand`
    - `src/components/catalog`
    - Admin-focused building blocks you might later extract from `src/pages/admin`

- **4. Shared**
  - Shared components: `src/components` (root) and `src/components/layout`
  - Shared UI primitives: `src/components/ui`
  - Shared hooks: `src/hooks`
  - Shared types & data: `src/types`, `src/data`
  - Shared utilities: `src/lib`

When adding new code, choose a location by answering:

1. **Is it a full screen / route?** → `src/pages`
2. **Is it tied to a specific feature (home, brand, catalog, admin)?** → that feature’s folder in `src/components`
3. **Is it a generic UI building block?** → `src/components/ui`
4. **Is it reusable logic, not UI?** → `src/hooks`
5. **Is it a shared type or data shape?** → `src/types`
6. **Is it sample/static data?** → `src/data`
7. **Is it a generic helper function?** → `src/lib`

This keeps the app **modular, discoverable, and easy to scale** as more features are added.


