import type { GuideSummary } from '@/lib/guides';

/**
 * The guide manifest: titles, descriptions and the commercial pages each guide supports.
 *
 * This is the only guide module that non-guide routes import, so it deliberately carries no
 * prose. It is also the single source of truth for these fields — the body files in this
 * directory hold the article text and nothing else, and the build fails if a body has no
 * matching entry here.
 *
 * A guide listed here is published: it is prerendered, indexed and added to the sitemap.
 */
export const GUIDE_SUMMARIES: GuideSummary[] = [
  {
    slug: 'best-wire-for-house-wiring',
    title: 'Which Wire Is Best for House Wiring? A Buyer’s Guide (India)',
    description: 'How to choose house wiring cable in India: copper vs aluminium, conductor size per circuit, FR vs FRLS vs FR-LSH insulation, and what actually separates the brands.',
    heading: 'Which wire is best for house wiring? A practical buyer’s guide',
    summary: 'Conductor size, insulation grade and provenance decide whether house wiring is right. Brand comes last.',
    cluster: 'wires-cables',
    primaryParent: {
      label: 'Wires & cables',
      path: '/category/wires-cables',
      blurb: 'Every house wire coil in our catalogue, with current list prices.',
    },
    supporting: [
      { label: 'Polycab wires & cables', path: '/brand/polycab/wires-cables', blurb: 'Polycab FR-LSH single-core copper, 0.75 to 16 sq mm.' },
      { label: 'Finolex wires & cables', path: '/brand/finolex/wires-cables', blurb: 'Finolex FR and FRLS single-core copper, 0.75 to 35 sq mm.' },
    ],
    datePublished: '2026-09-01',
    dateModified: '2026-09-01',
  },
  {
    slug: 'genuine-finolex-wire',
    title: 'How to Check Finolex Wire Is Original: Verifiable Checks',
    description: 'How to confirm a Finolex wire coil is genuine using checks that can actually be verified — BIS licence lookup, the manufacturer’s own product check, and a traceable purchase record.',
    heading: 'How to check that Finolex wire is original',
    summary: 'Verify the BIS licence in the official database and keep a traceable invoice. Looks are the weakest check.',
    cluster: 'wires-cables',
    primaryParent: {
      label: 'Finolex wires & cables',
      path: '/brand/finolex/wires-cables',
      blurb: 'Finolex FR and FRLS house wire from an authorised dealer, with current list prices.',
    },
    supporting: [
      { label: 'Wires & cables', path: '/category/wires-cables', blurb: 'Every house wire coil we carry, across brands.' },
    ],
    datePublished: '2026-09-01',
    dateModified: '2026-09-01',
  },
  {
    slug: 'mcb-vs-mccb',
    title: 'MCB vs MCCB: The Difference, and Which One You Need',
    description: 'MCB vs MCCB explained for buyers: current and breaking capacity, fixed versus adjustable trip settings, poles, standards, and where each one belongs in a real installation.',
    heading: 'MCB vs MCCB: what is the difference, and which do you need?',
    summary: 'The dividing line is not size — it is current rating, fault-breaking capacity and whether the trip settings can be adjusted.',
    cluster: 'circuit-protection',
    primaryParent: {
      label: 'Circuit protection',
      path: '/category/circuit-protection',
      blurb: 'MCBs, RCCBs, RCBOs, isolators and changeover devices with current list prices.',
    },
    supporting: [],
    datePublished: '2026-09-01',
    dateModified: '2026-09-01',
  },
  {
    slug: 'how-to-choose-mcb-for-home',
    title: 'How to Choose an MCB for Home Circuits (Including AC Points)',
    description: 'Choosing MCB ratings for a home distribution board: how rating, cable size, trip curve and poles fit together, plus what a 1.5 ton AC and a geyser point usually need.',
    heading: 'How to choose an MCB for home circuits',
    summary: 'Rating sits between the circuit’s design current and the cable’s capacity. Curve and poles follow from the load.',
    cluster: 'circuit-protection',
    primaryParent: {
      label: 'Circuit protection',
      path: '/category/circuit-protection',
      blurb: 'The MCB, RCCB, RCBO and isolator range with current list prices.',
    },
    supporting: [
      { label: 'Wires & cables', path: '/category/wires-cables', blurb: 'The cable sizes that set the ceiling on your MCB rating.' },
    ],
    datePublished: '2026-09-01',
    dateModified: '2026-09-01',
  },
  {
    slug: 'rccb-explained',
    title: 'RCCB Explained: What It Does, How It Works, Which Rating',
    description: 'What an RCCB is in an electrical installation, how residual current detection works, and how to read the two ratings — 25/40/63 A and 30/100/300 mA sensitivity.',
    heading: 'RCCB explained: what it does, how it works, and which rating to specify',
    summary: 'The device that detects current leaking to earth and disconnects before it becomes a shock or a fire.',
    cluster: 'circuit-protection',
    primaryParent: {
      label: 'Circuit protection',
      path: '/category/circuit-protection',
      blurb: 'RCCBs, RCBOs, MCBs and isolators with current list prices.',
    },
    supporting: [],
    datePublished: '2026-09-01',
    dateModified: '2026-09-01',
  },
];

export function findGuideSummary(slug = ''): GuideSummary | undefined {
  return GUIDE_SUMMARIES.find((guide) => guide.slug === slug);
}

export function guideSummariesInCluster(clusterId: string): GuideSummary[] {
  return GUIDE_SUMMARIES.filter((guide) => guide.cluster === clusterId);
}

/**
 * Guides that support a commercial page, either as their primary parent or as a secondary
 * link. Used by the category and brand-hub pages to surface genuinely relevant reading.
 */
export function guidesSupporting(path: string): GuideSummary[] {
  return GUIDE_SUMMARIES.filter(
    (guide) => guide.primaryParent.path === path || guide.supporting.some((link) => link.path === path),
  );
}

export function guideSummaries(slugs: string[]): GuideSummary[] {
  return slugs.map(findGuideSummary).filter((guide): guide is GuideSummary => Boolean(guide));
}
