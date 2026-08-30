import type { Product } from '@/types/product';

/**
 * Brand x category commercial hubs. Each entry is written against catalogue inventory that
 * was verified to exist, so the copy, facets and guidance differ page by page rather than
 * swapping a brand name into a shared template.
 */
export interface HubFacet {
  /** Specification key present on the hub's catalogue records. */
  key: string;
  label: string;
  /** Rendered after each value, e.g. "sq mm". */
  unit?: string;
}

export interface HubSection { heading: string; body: string }
export interface HubLink { label: string; path: string }
export interface HubFaq { question: string; answer: string }

export interface CommercialHub {
  slug: string;
  brandSlug: string;
  brandName: string;
  /** Catalogue category names whose products belong on this hub. */
  categories: string[];
  categoryPath: string;
  categoryName: string;
  title: string;
  description: string;
  heading: string;
  intro: string;
  /** Short, factual statements shown in the dealer/trust block. */
  proposition: string[];
  rangeHeading: string;
  rangeIntro: string;
  facets: HubFacet[];
  /** Renders a per-metre comparison column for coil-length catalogue records. */
  perMetre?: boolean;
  /** Groups the product grid by catalogue category instead of a flat list. */
  groupByCategory?: boolean;
  guidanceHeading: string;
  guidance: HubSection[];
  applicationsHeading: string;
  applications: HubSection[];
  faqs: HubFaq[];
  related: HubLink[];
  ctaHeading: string;
  ctaBody: string;
  whatsappLabel: string;
  whatsappText: string;
}

const DEALER_LINE = 'New Delhi Electricals is an authorised dealer, and every catalogue record here is a genuine branded product.';
const STORE_LINE = 'Counter and enquiries from 30 A Corner Market, Malviya Nagar, New Delhi, serving Delhi NCR.';

export const COMMERCIAL_HUBS: CommercialHub[] = [
  {
    slug: 'wires-cables',
    brandSlug: 'polycab',
    brandName: 'Polycab',
    categories: ['Wires & Cables'],
    categoryPath: '/category/wires-cables',
    categoryName: 'Wires & Cables',
    title: 'Polycab Wires & Cables in Delhi | Dealer, Prices & Quote',
    heading: 'Polycab Wires & Cables in Delhi NCR',
    description: 'Polycab FR-LSH single-core copper house wire from an authorised dealer in Delhi NCR. Compare sizes, coil lengths and current catalogue prices, then request a quote.',
    intro: 'Polycab FR-LSH single-core copper house wire, listed with the sizes and coil lengths we carry in the catalogue and their current catalogue list prices. Compare the range below and send the sizes you need for a quotation.',
    proposition: [
      DEALER_LINE,
      STORE_LINE,
      'Prices shown are current catalogue list prices per coil. Project and bulk pricing is quoted on request.',
    ],
    rangeHeading: 'Polycab house wire range in our catalogue',
    rangeIntro: 'Every size below is a separate catalogue record with its own conductor size, coil length and price.',
    facets: [
      { key: 'size_sqmm', label: 'Conductor size', unit: 'sq mm' },
      { key: 'length_m', label: 'Coil length', unit: 'm' },
      { key: 'wire_type', label: 'Insulation grade' },
      { key: 'core_count', label: 'Cores' },
      { key: 'voltage_rating', label: 'Voltage rating' },
    ],
    perMetre: true,
    guidanceHeading: 'How to choose from this Polycab range',
    guidance: [
      {
        heading: 'Coil length changes with conductor size',
        body: 'In this catalogue the smaller Polycab sizes are listed in 300 m coils and the heavier sizes in 200 m coils. Two records can therefore look far apart on price while costing similar per metre, so compare the per-metre figure before you fix quantities.',
      },
      {
        heading: 'FR-LSH is the grade listed here',
        body: 'Every Polycab record on this page is FR-LSH, flame retardant with low smoke and halogen, single-core copper with PVC insulation rated 1100 V. If a specification calls for a different Polycab grade, send us the requirement and we will confirm what can be supplied.',
      },
      {
        heading: 'Conductor size follows the circuit design',
        body: 'Sizing depends on the load, the run length and the protective device on each circuit. Work from the circuit schedule your electrician or consultant has prepared, and send it across if you would like the quantities priced against it.',
      },
    ],
    applicationsHeading: 'Where this Polycab range is usually specified',
    applications: [
      { heading: 'Home rewiring', body: 'Full-flat and floor-by-floor rewiring, where several conductor sizes are ordered together in 300 m and 200 m coils.' },
      { heading: 'Builder floors and new construction', body: 'Delhi NCR builder-floor projects buying repeat sizes across several units, usually priced as one bulk requirement.' },
      { heading: 'Shop and office fit-outs', body: 'Commercial fit-outs where the contractor supplies a bill of quantities and needs a single priced quotation.' },
      { heading: 'Submains and heavier runs', body: 'The larger conductor sizes in this range are the ones normally used for submain and riser runs rather than final circuits.' },
    ],
    faqs: [
      { question: 'Are the prices on this page current?', answer: 'They are the current catalogue list prices held against each Polycab record. Your quoted price depends on quantity, so send your list for a confirmed quotation.' },
      { question: 'Can I enquire for a single size, or only a full set?', answer: 'You can enquire for any single size on this page. Send the size, coil length and quantity you need and we will quote it.' },
      { question: 'Do you quote for bulk and project requirements?', answer: 'Yes. Share a bill of quantities or a circuit schedule on WhatsApp and we will price the whole requirement together.' },
    ],
    related: [
      { label: 'All Polycab products we carry', path: '/brand/polycab' },
      { label: 'Wires & cables from every brand', path: '/category/wires-cables' },
      { label: 'Finolex wires & cables in Delhi', path: '/brand/finolex/wires-cables' },
    ],
    ctaHeading: 'Get a Polycab wire quotation',
    ctaBody: 'Send the sizes, coil lengths and quantities you need. We reply with current pricing for your requirement.',
    whatsappLabel: 'Get Polycab wire pricing on WhatsApp',
    whatsappText: 'Hi! I would like a quotation for Polycab wires and cables. My requirement is:',
  },
  {
    slug: 'wires-cables',
    brandSlug: 'finolex',
    brandName: 'Finolex',
    categories: ['Wires & Cables'],
    categoryPath: '/category/wires-cables',
    categoryName: 'Wires & Cables',
    title: 'Finolex Wires & Cables Dealer in Delhi | Prices & Quote',
    heading: 'Finolex Wires & Cables in Delhi NCR',
    description: 'Finolex FR and FRLS single-core copper house wire from an authorised dealer in Delhi NCR. Two flame-retardant grades, 0.75 to 35 sq mm, with current catalogue prices.',
    intro: 'Finolex single-core copper house wire in two flame-retardant grades, FR and FRLS, covering short 90 m coils for single-room work through to heavy 35 sq mm conductors. Current catalogue list prices are shown against each record.',
    proposition: [
      DEALER_LINE,
      STORE_LINE,
      'Short 90 m coils are listed alongside the 100 m, 200 m and 300 m coils, so a small job does not have to buy a full-length coil.',
    ],
    rangeHeading: 'Finolex wire grades and sizes in our catalogue',
    rangeIntro: 'The FR records cover the smaller final-circuit sizes and the FRLS records cover the heavier conductors. Both are listed below with their coil lengths.',
    facets: [
      { key: 'wire_type', label: 'Flame-retardant grade' },
      { key: 'size_sqmm', label: 'Conductor size', unit: 'sq mm' },
      { key: 'length_m', label: 'Coil length', unit: 'm' },
      { key: 'core_count', label: 'Cores' },
      { key: 'voltage_rating', label: 'Voltage rating' },
    ],
    perMetre: true,
    guidanceHeading: 'How to choose from this Finolex range',
    guidance: [
      {
        heading: 'FR and FRLS cover different parts of the range',
        body: 'In this catalogue the FR records run from 0.75 to 6 sq mm, the sizes used on final circuits, while FRLS covers 10 to 35 sq mm. FRLS adds a low-smoke requirement that specifications for larger runs and shared spaces often call for.',
      },
      {
        heading: 'Two coil lengths on the smaller sizes',
        body: 'Sizes from 0.75 to 6 sq mm are listed in both a short 90 m coil and a longer 200 m or 300 m coil. The short coil suits a single room or a repair; the long coil normally works out cheaper per metre on a full rewiring job.',
      },
      {
        heading: 'Conductor size follows the circuit design',
        body: 'Load, run length and the protective device decide the size on each circuit. Work from the schedule your electrician or consultant has prepared, and send it across if you want the quantities priced against it.',
      },
    ],
    applicationsHeading: 'Where this Finolex range is usually specified',
    applications: [
      { heading: 'Single-room and repair work', body: 'The 90 m coils exist for exactly this: replacing one circuit or wiring one room without buying a full-length coil.' },
      { heading: 'Whole-home rewiring', body: 'The 300 m coils in 1.0 to 2.5 sq mm are the usual lighting and socket-circuit sizes on a full rewire.' },
      { heading: 'Submains, risers and DB feeds', body: 'The FRLS sizes from 10 to 35 sq mm are the ones normally specified for submain and distribution-board feed runs.' },
      { heading: 'Contractor and project supply', body: 'Contractors working across Delhi NCR ordering repeat sizes against a bill of quantities.' },
    ],
    faqs: [
      { question: 'What is the difference between the FR and FRLS records here?', answer: 'Both are flame retardant. FRLS additionally limits smoke emission, and in this catalogue it is the grade listed on the 10 sq mm and larger conductors.' },
      { question: 'Do you carry Finolex sizes above 35 sq mm?', answer: 'The catalogue on this page runs to 35 sq mm. Send the size you need and we will confirm what can be supplied against your requirement.' },
      { question: 'Are the prices on this page current?', answer: 'They are the current catalogue list prices per coil. Send your quantities for a confirmed quotation.' },
    ],
    related: [
      { label: 'All Finolex products we carry', path: '/brand/finolex' },
      { label: 'Wires & cables from every brand', path: '/category/wires-cables' },
      { label: 'Polycab wires & cables in Delhi', path: '/brand/polycab/wires-cables' },
    ],
    ctaHeading: 'Get a Finolex wire quotation',
    ctaBody: 'Send the grade, sizes, coil lengths and quantities you need for current pricing.',
    whatsappLabel: 'Get Finolex wire pricing on WhatsApp',
    whatsappText: 'Hi! I would like a quotation for Finolex wires and cables. My requirement is:',
  },
  {
    slug: 'switches-sockets',
    brandSlug: 'anchor',
    brandName: 'Anchor',
    categories: ['Switches', 'Power Sockets', 'Fan Controls', 'Dimmers', 'Data Sockets', 'Accessories', 'Hospitality'],
    categoryPath: '/category/switches-sockets',
    categoryName: 'Switches & Sockets',
    title: 'Anchor Switches & Sockets in Delhi | Modular Range & Quote',
    heading: 'Anchor Modular Switches & Sockets',
    description: 'Anchor Penta modular switches, sockets, fan regulators and dimmers from an authorised dealer in Delhi NCR. Browse the range by function and module size, then request a quote.',
    intro: 'The Anchor Penta modular range we carry: switches, power sockets, fan regulators, dimmers, data sockets and hospitality modules. Each record lists its module width, current rating and finish, with current catalogue list prices.',
    proposition: [
      DEALER_LINE,
      STORE_LINE,
      'Modules and matching Anchor plates are quoted together, so a room schedule can be priced in one go.',
    ],
    rangeHeading: 'Anchor Penta range by function',
    rangeIntro: 'Penta is a modular system: choose the function module for each point, then a plate with enough module spaces to hold it.',
    facets: [
      { key: 'mw', label: 'Module width', unit: 'M' },
      { key: 'ampere', label: 'Current rating', unit: 'A' },
      { key: 'color', label: 'Finish' },
      { key: 'type_detail', label: 'Module function' },
    ],
    groupByCategory: true,
    guidanceHeading: 'How to specify an Anchor Penta schedule',
    guidance: [
      {
        heading: 'Count modules before you count plates',
        body: 'Penta modules in this catalogue are 1M, 2M, 3M and 4M wide. Add up the module widths a location needs, then pick an Anchor plate with at least that many spaces. Blank modules fill anything left over.',
      },
      {
        heading: 'Match the current rating to the point',
        body: 'The range covers 6 A through 32 A. Light points and bell pushes sit at the lower ratings, general sockets in the middle, and geyser or air-conditioner points at the higher ones. Your electrician’s point schedule sets which rating goes where.',
      },
      {
        heading: 'Pick one finish across a room',
        body: 'Penta modules here are listed in White and Graphite, with a small number of red modules used for dedicated circuits. Choosing the finish first keeps modules and plates consistent through a room or a floor.',
      },
    ],
    applicationsHeading: 'Where the Anchor Penta range is usually specified',
    applications: [
      { heading: 'Value-conscious home wiring', body: 'Complete flats and floors where a full modular schedule is needed at a controlled per-point cost.' },
      { heading: 'Rental and builder-floor projects', body: 'Repeat point schedules across several identical units, quoted as one bulk requirement.' },
      { heading: 'Hotels, guest houses and hospitality', body: 'The hospitality modules in this range include keycard units and shaver sockets for guest rooms.' },
      { heading: 'Fan and light control', body: 'Fan regulators and LED dimmers across the range, specified alongside the switch points they control.' },
    ],
    faqs: [
      { question: 'Do Anchor Penta modules fit Anchor plates only?', answer: 'Specify Penta modules with plates from the same range. Send your point schedule and we will quote modules and plates together.' },
      { question: 'Which finishes are listed here?', answer: 'The Penta records in our catalogue are White and Graphite, plus a small number of red modules used for dedicated circuits.' },
      { question: 'Can you price a full room-by-room schedule?', answer: 'Yes. Send the point schedule or the number of points per room on WhatsApp and we will quote modules and plates as one list.' },
    ],
    related: [
      { label: 'All Anchor products we carry', path: '/brand/anchor' },
      { label: 'Switches & sockets from every brand', path: '/category/switches-sockets' },
      { label: 'Modular plates and cover plates', path: '/category/plates' },
      { label: 'Havells switches & sockets in Delhi', path: '/brand/havells/switches-sockets' },
    ],
    ctaHeading: 'Get an Anchor Penta quotation',
    ctaBody: 'Send your point schedule, or the modules and plates you need, for current pricing.',
    whatsappLabel: 'Get Anchor switch pricing on WhatsApp',
    whatsappText: 'Hi! I would like a quotation for Anchor switches and sockets. My requirement is:',
  },
  {
    slug: 'switches-sockets',
    brandSlug: 'havells',
    brandName: 'Havells',
    categories: ['Switches', 'Power Sockets', 'Fan Controls', 'Dimmers', 'Data Sockets', 'Accessories', 'Hospitality'],
    categoryPath: '/category/switches-sockets',
    categoryName: 'Switches & Sockets',
    title: 'Havells Switches & Sockets in Delhi | Modular Range & Quote',
    heading: 'Havells Modular Switches & Sockets',
    description: 'Havells Signia and Fabio modular switches, sockets, USB chargers and fan regulators from an authorised dealer in Delhi NCR. Compare both ranges and request a quote.',
    intro: 'Two Havells modular ranges sit in our catalogue, Signia and Fabio, covering switches, shuttered power sockets, USB charging modules, fan regulators, data sockets and relay and scene controllers. Current catalogue list prices are shown against each record.',
    proposition: [
      DEALER_LINE,
      STORE_LINE,
      'Havells modules, plates and matching accessories are quoted together against a room or floor schedule.',
    ],
    rangeHeading: 'Havells Signia and Fabio range by function',
    rangeIntro: 'Both are modular systems. Choose the function modules for each location, then a plate wide enough to hold them.',
    facets: [
      { key: 'mw', label: 'Module width', unit: 'M' },
      { key: 'ampere', label: 'Current rating', unit: 'A' },
      { key: 'color', label: 'Finish' },
      { key: 'type_detail', label: 'Module function' },
    ],
    groupByCategory: true,
    guidanceHeading: 'How to choose between Signia and Fabio',
    guidance: [
      {
        heading: 'Two ranges, one modular method',
        body: 'Signia and Fabio are separate Havells ranges with their own modules and plates. Pick one range per room or floor so modules, plates and finishes stay consistent, and specify plates from the same range as the modules.',
      },
      {
        heading: 'Beyond plain switching',
        body: 'This catalogue includes relay switches, scene controllers, BLDC fan regulators, USB charging modules and shuttered sockets. If a location needs one of these, decide it early, because it changes the module count for that plate.',
      },
      {
        heading: 'Finish drives the plate selection',
        body: 'The Havells modules listed here come in White, Grey, Charcoal Grey and Velvet Black. Confirm the finish before quantities are fixed, because the plate order follows the module finish.',
      },
    ],
    applicationsHeading: 'Where the Havells modular ranges are usually specified',
    applications: [
      { heading: 'Premium apartments and villas', body: 'Where the finish and the module design matter as much as the point count, and darker finishes are often specified.' },
      { heading: 'Offices and commercial fit-outs', body: 'Data sockets, USB charging points and higher-rated sockets specified across an open floor plate.' },
      { heading: 'Hospitality rooms', body: 'The hospitality modules in this range cover guest-room requirements such as keycard and shaver points.' },
      { heading: 'Interior-led renovations', body: 'Architects and interior designers selecting a single Havells range and finish across a whole project.' },
    ],
    faqs: [
      { question: 'Can Signia and Fabio modules be mixed on one plate?', answer: 'Specify modules and plates from the same range. Tell us which range you have chosen and we will quote a matched schedule.' },
      { question: 'Which finishes are in the catalogue?', answer: 'The Havells modular records we carry are listed in White, Grey, Charcoal Grey and Velvet Black.' },
      { question: 'Do you quote modules and plates together?', answer: 'Yes. Send the point schedule or the room-by-room requirement and we will price modules, plates and accessories as one list.' },
    ],
    related: [
      { label: 'All Havells products we carry', path: '/brand/havells' },
      { label: 'Switches & sockets from every brand', path: '/category/switches-sockets' },
      { label: 'Modular plates and cover plates', path: '/category/plates' },
      { label: 'Anchor switches & sockets in Delhi', path: '/brand/anchor/switches-sockets' },
    ],
    ctaHeading: 'Get a Havells modular quotation',
    ctaBody: 'Tell us the range, the finish and the points you need. We reply with current pricing for the full schedule.',
    whatsappLabel: 'Get Havells switch pricing on WhatsApp',
    whatsappText: 'Hi! I would like a quotation for Havells switches and sockets. My requirement is:',
  },
];

export function hubPath(hub: Pick<CommercialHub, 'brandSlug' | 'slug'>): string {
  return `/brand/${hub.brandSlug}/${hub.slug}`;
}

export function findHub(brandSlug = '', slug = ''): CommercialHub | undefined {
  return COMMERCIAL_HUBS.find(hub => hub.brandSlug === brandSlug && hub.slug === slug);
}

/** The hub a product belongs to, used for product -> hub internal links. */
export function hubForProduct(product: { brand?: string; category?: string }): CommercialHub | undefined {
  return COMMERCIAL_HUBS.find(hub => hub.brandName === product.brand && hub.categories.includes(product.category || ''));
}

export function hubsForBrand(brandName: string): CommercialHub[] {
  return COMMERCIAL_HUBS.filter(hub => hub.brandName === brandName);
}

export function hubsForCategoryPath(categoryPath: string): CommercialHub[] {
  return COMMERCIAL_HUBS.filter(hub => hub.categoryPath === categoryPath);
}

export function selectHubProducts<T extends { brand: string; category: string }>(hub: CommercialHub, products: T[]): T[] {
  return products.filter(product => product.brand === hub.brandName && hub.categories.includes(product.category));
}

/** Indian-format currency without Intl, so server and browser output are byte-identical. */
export function formatInr(value: number): string {
  const digits = String(Math.round(Math.abs(value)));
  if (digits.length <= 3) return `₹${digits}`;
  const tail = digits.slice(-3);
  const groups: string[] = [];
  let head = digits.slice(0, -3);
  while (head.length > 2) { groups.unshift(head.slice(-2)); head = head.slice(0, -2); }
  if (head) groups.unshift(head);
  return `₹${groups.join(',')},${tail}`;
}

export interface FacetValue { value: string; count: number }

/** Distinct catalogue values for a facet, ordered numerically where the data is numeric. */
export function facetValues(products: Array<{ specs?: Product['specs'] }>, facet: HubFacet, limit = 14): FacetValue[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    const raw = product.specs?.[facet.key];
    if (raw === undefined || raw === null || raw === '') continue;
    const value = String(raw);
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  const entries = [...counts.entries()].map(([value, count]) => ({ value, count }));
  const numeric = entries.every(entry => Number.isFinite(Number(entry.value)));
  entries.sort((a, b) => numeric ? Number(a.value) - Number(b.value) : (b.count - a.count) || a.value.localeCompare(b.value));
  return entries.slice(0, limit);
}

export function priceRange(products: Array<{ listPrice?: number }>): { min: number; max: number } | null {
  const prices = products.map(product => Number(product.listPrice || 0)).filter(price => price > 0);
  if (!prices.length) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** Per-metre catalogue price for coil records, so unequal coil lengths stay comparable. */
export function perMetrePrice(product: { listPrice?: number; specs?: Product['specs'] }): string | null {
  const length = Number(product.specs?.length_m || 0);
  const price = Number(product.listPrice || 0);
  if (!length || !price) return null;
  return `₹${(price / length).toFixed(2)}`;
}

export const WHATSAPP_NUMBER = '919654102758';

export function whatsappHref(text: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
