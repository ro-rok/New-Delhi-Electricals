import type { Guide, GuideBody } from '@/lib/guides';
import { GUIDE_SUMMARIES } from './manifest';
import { bestWireForHouseWiring } from './best-wire-for-house-wiring';
import { genuineFinolexWire } from './genuine-finolex-wire';
import { mcbVsMccb } from './mcb-vs-mccb';
import { howToChooseMcbForHome } from './how-to-choose-mcb-for-home';
import { rccbExplained } from './rccb-explained';

/**
 * Full guides: the manifest entry merged with its article body.
 *
 * This module pulls in every guide's prose, so importing it from a shared component would
 * put ~75 kB of article text into the entry bundle of every route. It is imported only by
 * the server entry (which serialises the matching guide into the prerendered route data) and
 * by a dynamic import inside GuidePage for in-app navigation. Use `./manifest` anywhere else.
 */
const BODIES: GuideBody[] = [
  bestWireForHouseWiring,
  genuineFinolexWire,
  mcbVsMccb,
  howToChooseMcbForHome,
  rccbExplained,
];

export const GUIDES: Guide[] = GUIDE_SUMMARIES.map((summary) => {
  const body = BODIES.find((item) => item.slug === summary.slug);
  if (!body) throw new Error(`Guide "${summary.slug}" is in the manifest but has no body module.`);
  return { ...summary, ...body };
});

const ORPHANED = BODIES.filter((body) => !GUIDE_SUMMARIES.some((summary) => summary.slug === body.slug));
if (ORPHANED.length) {
  throw new Error(`Guide bodies with no manifest entry: ${ORPHANED.map((body) => body.slug).join(', ')}`);
}

export function findGuide(slug = ''): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}
