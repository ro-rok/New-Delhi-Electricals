import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Editorial gate for the published guides.
 *
 * The guide voice rules forbid the AI dash style outright: no U+2014 em dash and no U+2013
 * en dash anywhere in guide body copy, headings, tables, callouts, FAQs, CTA text, sources
 * or the manifest metadata, and no "--" used as a stand-in for one. Unresolved editorial
 * placeholders (TODO, TBD, FACT CHECK REQUIRED and friends) must never ship either.
 *
 * Scope is deliberately narrow: the guide content modules and their manifest. Code comments
 * elsewhere and vendor packages are not editorial copy and are not checked here.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const guidesDir = path.resolve(here, '..', 'src', 'content', 'guides');

const CONTENT_FILES = [
  'manifest.ts',
  'best-wire-for-house-wiring.ts',
  'genuine-finolex-wire.ts',
  'mcb-vs-mccb.ts',
  'how-to-choose-mcb-for-home.ts',
  'rccb-explained.ts',
].map((name) => path.join(guidesDir, name));

const PLACEHOLDERS = ['EXPERT INPUT NEEDED', 'FACT CHECK REQUIRED', 'PLACEHOLDER', 'TODO', 'TBD'];

/** Strip // line comments and block comments so a "--" or a marker in a comment is ignored. */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const failures = [];
let emTotal = 0;
let enTotal = 0;
let pseudoTotal = 0;

for (const file of CONTENT_FILES) {
  if (!fs.existsSync(file)) {
    failures.push(`${path.basename(file)}: expected guide content file is missing`);
    continue;
  }
  const raw = fs.readFileSync(file, 'utf8');
  const prose = stripComments(raw);
  const rel = path.basename(file);

  const em = (prose.match(/—/g) || []).length;
  const en = (prose.match(/–/g) || []).length;
  const pseudo = (prose.match(/--/g) || []).length;
  emTotal += em;
  enTotal += en;
  pseudoTotal += pseudo;

  if (em) failures.push(`${rel}: ${em} em dash (U+2014) in guide copy`);
  if (en) failures.push(`${rel}: ${en} en dash (U+2013) in guide copy`);
  if (pseudo) failures.push(`${rel}: ${pseudo} pseudo dash ("--") in guide copy`);

  for (const marker of PLACEHOLDERS) {
    const hits = (prose.match(new RegExp(`\\b${marker.replace(/ /g, '\\s+')}\\b`, 'g')) || []).length;
    if (hits) failures.push(`${rel}: ${hits} unresolved editorial marker "${marker}"`);
  }
}

console.log('DASH AUDIT:');
console.log(`Em dash count: ${emTotal}`);
console.log(`En dash count: ${enTotal}`);
console.log(`Pseudo double-dash count: ${pseudoTotal}`);

if (failures.length) {
  console.error('\nGuide editorial gate FAILED:');
  for (const line of failures) console.error(`  - ${line}`);
  process.exit(1);
}

console.log(`\nGuide editorial gate passed: ${CONTENT_FILES.length} files clean.`);
