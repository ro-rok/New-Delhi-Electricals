/**
 * Shopping Architecture Configuration
 *
 * Maps the raw database categories (which are organized by product taxonomy)
 * into a coherent B2C shopping experience organized by customer intent.
 *
 * PRINCIPLE: Tags/metadata should be used for filtering, search, or
 * merchandising — NOT automatically promoted into primary navigation categories.
 *
 * The old architecture had 11 separate top-level categories:
 *   Accessories, Boxes, Circuit Protection, Data Sockets, Dimmers,
 *   Fan Controls, Hospitality, Plates, Power Sockets, Switches, Wires & Cables
 *
 * The new architecture consolidates them into 5 shopping families:
 *   1. Switches & Sockets  (all switchboard modules)
 *   2. Plates              (cover plates & grid frames)
 *   3. Circuit Protection  (MCBs, RCCBs, isolators)
 *   4. Wires & Cables      (all wiring)
 *   5. Boxes               (mounting boxes)
 */

export interface SubSection {
  id: string;
  name: string;
  /** DB category values that belong to this sub-section */
  dbCategories: string[];
  /** Optional description for the sub-tab */
  description?: string;
  /** Icon name from lucide-react */
  icon?: string;
}

export interface ShoppingCategory {
  id: string;
  displayName: string;
  slug: string;
  description: string;
  tagline: string;
  /** Hero image import path or URL */
  image: string;
  /** All DB category names that belong to this shopping family */
  dbCategories: string[];
  /** Sub-sections for tab navigation within the category page */
  subSections: SubSection[];
  /** Shopping step number (for the guided flow) */
  step: number;
  /** CTA text for the "next step" prompt */
  nextStepText?: string;
  /** Slug of the next category in the shopping flow */
  nextStepSlug?: string;
}

export const SHOPPING_CATEGORIES: ShoppingCategory[] = [
  {
    id: 'switches-sockets',
    displayName: 'Switches & Sockets',
    slug: 'switches-sockets',
    description: 'Choose the core modules for your switchboard — switches, sockets, regulators, dimmers, data outlets, and more.',
    tagline: 'Start here — build your switchboard',
    image: '/category-images/switches-sockets.svg',
    step: 1,
    dbCategories: [
      'Switches',
      'Power Sockets',
      'Fan Controls',
      'Dimmers',
      'Data Sockets',
      'Accessories',
      'Hospitality',
    ],
    subSections: [
      {
        id: 'all',
        name: 'All Modules',
        dbCategories: [
          'Switches', 'Power Sockets', 'Fan Controls', 'Dimmers',
          'Data Sockets', 'Accessories', 'Hospitality',
        ],
        description: 'Browse every switchboard module',
      },
      {
        id: 'switches',
        name: 'Switches',
        dbCategories: ['Switches'],
        description: '1-way, 2-way, DP, and smart switches',
        icon: 'ToggleRight',
      },
      {
        id: 'sockets',
        name: 'Sockets',
        dbCategories: ['Power Sockets'],
        description: '6A, 16A, and multi-pin power sockets',
        icon: 'Plug',
      },
      {
        id: 'controls',
        name: 'Fan Controls & Dimmers',
        dbCategories: ['Fan Controls', 'Dimmers'],
        description: 'Regulators, dimmers, and speed controllers',
        icon: 'SlidersHorizontal',
      },
      {
        id: 'data-connectivity',
        name: 'Data & Connectivity',
        dbCategories: ['Data Sockets'],
        description: 'LAN, TV, telephone, and data outlets',
        icon: 'Wifi',
      },
      {
        id: 'accessories',
        name: 'Accessories & Smart',
        dbCategories: ['Accessories', 'Hospitality'],
        description: 'USB chargers, indicators, buzzers, and smart modules',
        icon: 'Cpu',
      },
    ],
    nextStepText: 'Next: Choose your Plates',
    nextStepSlug: 'plates',
  },
  {
    id: 'plates',
    displayName: 'Plates',
    slug: 'plates',
    description: 'Select cover plates and grid frames that match your chosen modules and interior style.',
    tagline: 'Step 2 — complete your look',
    image: '/category-images/plates.svg',
    step: 2,
    dbCategories: ['Plates'],
    subSections: [
      {
        id: 'all',
        name: 'All Plates',
        dbCategories: ['Plates'],
        description: 'Browse all cover plates',
      },
      {
        id: 'with-grid',
        name: 'With Grid Frames',
        dbCategories: ['Plates'],
        description: 'Plates that include a mounting grid',
      },
      {
        id: 'without-grid',
        name: 'Without Grid Frames',
        dbCategories: ['Plates'],
        description: 'Cover plates only (for existing grids)',
      },
    ],
    nextStepText: 'Next: Circuit Protection',
    nextStepSlug: 'circuit-protection',
  },
  {
    id: 'circuit-protection',
    displayName: 'Circuit Protection',
    slug: 'circuit-protection',
    description: 'MCBs, RCCBs, isolators, and changeover switches to protect your electrical circuits.',
    tagline: 'Safety first — protect your circuits',
    image: '/category-images/circuit-protection.svg',
    step: 3,
    dbCategories: ['Circuit Protection'],
    subSections: [
      {
        id: 'all',
        name: 'All Protection',
        dbCategories: ['Circuit Protection'],
        description: 'Browse all circuit protection products',
      },
      {
        id: 'mcbs',
        name: 'MCBs',
        dbCategories: ['Circuit Protection'],
        description: 'Miniature Circuit Breakers',
        icon: 'Shield',
      },
      {
        id: 'rccbs',
        name: 'RCCBs & ELCBs',
        dbCategories: ['Circuit Protection'],
        description: 'Residual Current Circuit Breakers',
        icon: 'ShieldCheck',
      },
      {
        id: 'isolators',
        name: 'Isolators',
        dbCategories: ['Circuit Protection'],
        description: 'Manual changeover and isolation switches',
        icon: 'Power',
      },
    ],
    nextStepText: 'Next: Wires & Cables',
    nextStepSlug: 'wires-cables',
  },
  {
    id: 'wires-cables',
    displayName: 'Wires & Cables',
    slug: 'wires-cables',
    description: 'High-quality wires and cables for residential, commercial, and industrial wiring.',
    tagline: 'Power it up — quality wiring',
    image: '/category-images/wires-cables.svg',
    step: 4,
    dbCategories: ['Wires & Cables'],
    subSections: [
      {
        id: 'all',
        name: 'All Wires',
        dbCategories: ['Wires & Cables'],
        description: 'Browse all wires and cables',
      },
    ],
    nextStepText: 'Next: Mounting Boxes',
    nextStepSlug: 'boxes',
  },
  {
    id: 'boxes',
    displayName: 'Mounting Boxes',
    slug: 'boxes',
    description: 'GI metal and plastic mounting boxes for flush and surface installation.',
    tagline: 'Step 5 — mounting solutions',
    image: '/category-images/boxes.svg',
    step: 5,
    dbCategories: ['Boxes'],
    subSections: [
      {
        id: 'all',
        name: 'All Boxes',
        dbCategories: ['Boxes'],
        description: 'Browse all mounting boxes',
      },
    ],
  },
  {
    id: 'geysers',
    displayName: 'Geysers & Water Heaters',
    slug: 'geysers',
    description: 'Instant and storage water geysers for your bathroom and kitchen.',
    tagline: 'Hot water, anytime',
    image: '/category-images/geysers.svg',
    step: 6,
    dbCategories: ['geyser'],
    subSections: [
      {
        id: 'all',
        name: 'All Geysers',
        dbCategories: ['geyser'],
        description: 'Browse all geysers and water heaters',
      },
      {
        id: 'instant',
        name: 'Instant Geysers',
        dbCategories: ['geyser'],
        description: 'Quick heating for immediate hot water',
        icon: 'Zap',
      },
      {
        id: 'storage',
        name: 'Storage Geysers',
        dbCategories: ['geyser'],
        description: 'High capacity storage water heaters',
        icon: 'Thermometer',
      },
    ],
  },
];

/**
 * Legacy slug → new slug mapping
 * Handles old URLs like /category/switches → /category/switches-sockets
 */
const LEGACY_SLUG_MAP: Record<string, string> = {
  'switches': 'switches-sockets',
  'power-sockets': 'switches-sockets',
  'fan-controls': 'switches-sockets',
  'dimmers': 'switches-sockets',
  'data-sockets': 'switches-sockets',
  'accessories': 'switches-sockets',
  'hospitality': 'switches-sockets',
  'plates': 'plates',
  'circuit-protection': 'circuit-protection',
  'wires-cables': 'wires-cables',
  'wires-&-cables': 'wires-cables',
  'boxes': 'boxes',
  'geysers': 'geysers',
  'water-heaters': 'geysers',
};

/**
 * Look up a shopping category by slug.
 * Falls back to legacy slug mapping for old URLs.
 */
export function getShoppingCategory(slug: string): ShoppingCategory | undefined {
  const direct = SHOPPING_CATEGORIES.find(c => c.slug === slug);
  if (direct) return direct;
  // Try legacy mapping
  const legacyTarget = LEGACY_SLUG_MAP[slug];
  if (legacyTarget) {
    return SHOPPING_CATEGORIES.find(c => c.slug === legacyTarget);
  }
  return undefined;
}

/**
 * Check if a slug is a legacy redirect (for URL rewriting)
 */
export function isLegacySlug(slug: string): boolean {
  return slug in LEGACY_SLUG_MAP && !(slug in Object.fromEntries(SHOPPING_CATEGORIES.map(c => [c.slug, true])));
}

/**
 * Get the canonical slug for a potentially legacy slug
 */
export function getCanonicalSlug(slug: string): string {
  return LEGACY_SLUG_MAP[slug] || slug;
}

/**
 * Given a raw DB category name, find which shopping category it belongs to.
 */
export function getShoppingCategoryForDbCategory(dbCategory: string): ShoppingCategory | undefined {
  return SHOPPING_CATEGORIES.find(c => c.dbCategories.includes(dbCategory));
}

/**
 * Get all DB categories that belong to a shopping category slug.
 */
export function getDbCategoriesForShoppingCategory(slug: string): string[] {
  const cat = getShoppingCategory(slug);
  return cat ? cat.dbCategories : [];
}

/**
 * Get the sub-section that matches a given sub-section id within a shopping category.
 */
export function getSubSection(shoppingSlug: string, subSectionId: string): SubSection | undefined {
  const cat = getShoppingCategory(shoppingSlug);
  return cat?.subSections.find(s => s.id === subSectionId);
}

/**
 * Get products count by shopping category from a list of products
 */
export function countProductsByShoppingCategory(
  products: { category: string }[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const cat of SHOPPING_CATEGORIES) {
    counts[cat.slug] = products.filter(p => cat.dbCategories.includes(p.category)).length;
  }
  return counts;
}
