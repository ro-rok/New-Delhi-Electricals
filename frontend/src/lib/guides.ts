import { WHATSAPP_NUMBER } from '@/lib/commercialHubs';

/**
 * Editorial guides. These are decision-support articles that sit above the commercial
 * catalogue: each one answers a pre-purchase question and points at exactly one live
 * commercial parent, so the content layer feeds the money pages instead of competing
 * with them.
 *
 * Content is structured data rather than Markdown so the same tree renders in the
 * build-time prerender and in the browser without a parser in the client bundle.
 */

export interface GuideLink {
  label: string;
  path: string;
  /** Shown on link cards; omitted for inline "related pages" lists. */
  blurb?: string;
}

export interface GuideCatalogueItem {
  name: string;
  sku?: string;
  /** Current catalogue list price in INR. Omitted when the record has no price. */
  price?: number;
  path: string;
  note?: string;
}

export type GuideBlock =
  | { kind: 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'list'; ordered?: boolean; items: string[] }
  | { kind: 'table'; caption?: string; columns: string[]; rows: string[][]; note?: string }
  | { kind: 'callout'; tone: 'safety' | 'note'; heading: string; body: string }
  | { kind: 'catalogue'; heading: string; intro?: string; items: GuideCatalogueItem[]; footnote?: string };

export interface GuideSection {
  /** Stable anchor id, also used by the on-page contents list. */
  id: string;
  heading: string;
  blocks: GuideBlock[];
}

export interface GuideFaq { question: string; answer: string }
export interface GuideSource { label: string; url: string }

export interface GuideCta {
  heading: string;
  body: string;
  whatsappLabel: string;
  whatsappText: string;
  browse: GuideLink;
}

export interface GuideClusterMeta {
  id: string;
  label: string;
  /** Live commercial category this cluster supports. */
  parentPath: string;
  parentLabel: string;
  intro: string;
}

/**
 * The light half of a guide: everything the index, the commercial-page link cards and the
 * document head need. These live in the manifest, which every route may import, so they must
 * stay small.
 */
export interface GuideSummary {
  slug: string;
  /** <title>. */
  title: string;
  /** Meta description. */
  description: string;
  /** H1. */
  heading: string;
  /** One-line summary used on the index and on related-guide cards. */
  summary: string;
  cluster: string;
  /** The single commercial parent this guide exists to support. */
  primaryParent: GuideLink;
  /** Secondary live commercial pages linked in context. */
  supporting: GuideLink[];
  datePublished: string;
  dateModified: string;
}

/**
 * The heavy half: the prose. Bodies are loaded only where a guide is actually rendered —
 * served inside the prerendered route data for a search landing, or fetched as an async
 * chunk on an in-app navigation — so they never reach the entry bundle of other routes.
 */
export interface GuideBody {
  slug: string;
  /** The answer, given before the reader has to scroll. */
  standfirst: string;
  sections: GuideSection[];
  faqs: GuideFaq[];
  cta: GuideCta;
  sources: GuideSource[];
  /** Slugs of sibling guides. */
  related: string[];
}

export type Guide = GuideSummary & GuideBody;

export const GUIDE_CLUSTERS: GuideClusterMeta[] = [
  {
    id: 'wires-cables',
    label: 'Wires & cables',
    parentPath: '/category/wires-cables',
    parentLabel: 'Wires & cables',
    intro: 'Choosing conductor sizes, insulation grades and brands before you order coils.',
  },
  {
    id: 'circuit-protection',
    label: 'Circuit protection',
    parentPath: '/category/circuit-protection',
    parentLabel: 'Circuit protection',
    intro: 'MCBs, RCCBs, RCBOs and isolators: what each device does and how a distribution board is specified.',
  },
];

export const GUIDES_PATH = '/guides';

export function guidePath(slug: string): string {
  return `${GUIDES_PATH}/${slug}`;
}

export function guideWhatsappHref(text: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

/** Indian-format currency, matching the catalogue formatting used on commercial pages. */
export { formatInr } from '@/lib/commercialHubs';
