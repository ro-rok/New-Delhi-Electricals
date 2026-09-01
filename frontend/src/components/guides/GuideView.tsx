import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  type Guide, type GuideBlock, type GuideCatalogueItem, formatInr, guidePath, guideWhatsappHref,
} from '@/lib/guides';
import { guideSummaries } from '@/content/guides/manifest';

/**
 * Renders inline markdown-style links inside guide prose. Only this one inline construct is
 * supported on purpose: it keeps a Markdown parser out of the client bundle and guarantees
 * the server and browser produce identical trees.
 */
const INLINE_LINK = /\[([^\]]+)\]\(([^)]+)\)/g;

export function inline(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let index = 0;
  for (const match of text.matchAll(INLINE_LINK)) {
    const start = match.index ?? 0;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    const [, label, href] = match;
    nodes.push(href.startsWith('/')
      ? <Link key={`l${index}`} to={href} className="text-accent underline underline-offset-2 hover:no-underline">{label}</Link>
      : <a key={`l${index}`} href={href} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2 hover:no-underline">{label}</a>);
    cursor = start + match[0].length;
    index += 1;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes.length === 1 ? nodes[0] : nodes.map((node, position) => <Fragment key={position}>{node}</Fragment>);
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Formats an ISO date without Intl, so server and browser output are byte-identical. */
function formatGuideDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  const name = MONTHS[Number(month) - 1];
  return name ? `${Number(day)} ${name} ${year}` : iso;
}

function CatalogueList({ items }: { items: GuideCatalogueItem[] }) {
  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {items.map(item => (
        <li key={item.path} className="rounded-xl border bg-card p-4">
          <Link to={item.path} className="font-medium hover:text-accent">{item.name}</Link>
          {item.sku && <p className="mt-1 text-xs text-muted-foreground">SKU {item.sku}</p>}
          <p className="mt-2 text-sm">
            {typeof item.price === 'number' && item.price > 0
              ? <>{formatInr(item.price)} <span className="text-xs text-muted-foreground">catalogue list price</span></>
              : <span className="text-xs text-muted-foreground">Price on enquiry</span>}
          </p>
          {item.note && <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>}
        </li>
      ))}
    </ul>
  );
}

function Block({ block }: { block: GuideBlock }) {
  switch (block.kind) {
    case 'h3':
      return <h3 className="mt-8 text-lg font-semibold">{block.text}</h3>;
    case 'p':
      return <p className="mt-4 leading-7 text-muted-foreground">{inline(block.text)}</p>;
    case 'list':
      return block.ordered
        ? <ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-muted-foreground">{block.items.map(item => <li key={item}>{inline(item)}</li>)}</ol>
        : <ul className="mt-4 list-disc space-y-2 pl-5 leading-7 text-muted-foreground">{block.items.map(item => <li key={item}>{inline(item)}</li>)}</ul>;
    case 'table':
      return (
        <figure className="mt-6">
          {block.caption && <figcaption className="mb-2 text-sm font-medium">{block.caption}</figcaption>}
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-muted/50">
                <tr>{block.columns.map((column, position) => (
                  <th key={`${column}-${position}`} scope="col" className="border-b px-3 py-2 font-medium">{column}</th>
                ))}</tr>
              </thead>
              <tbody>
                {block.rows.map(row => (
                  <tr key={row.join('|')} className="align-top">
                    {row.map((cell, position) => (
                      <td key={position} className="border-b px-3 py-2 leading-6 text-muted-foreground">{inline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.note && <p className="mt-2 text-xs leading-5 text-muted-foreground">{inline(block.note)}</p>}
        </figure>
      );
    case 'callout':
      return (
        <aside className={`mt-6 rounded-xl border-l-4 bg-card p-5 ${block.tone === 'safety' ? 'border-l-destructive' : 'border-l-accent'}`}>
          <p className="font-medium">{block.heading}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{inline(block.body)}</p>
        </aside>
      );
    case 'catalogue':
      return (
        <section className="mt-8 rounded-2xl border bg-card p-5">
          <h3 className="text-lg font-semibold">{block.heading}</h3>
          {block.intro && <p className="mt-2 text-sm leading-6 text-muted-foreground">{inline(block.intro)}</p>}
          <CatalogueList items={block.items} />
          {block.footnote && <p className="mt-3 text-xs leading-5 text-muted-foreground">{inline(block.footnote)}</p>}
        </section>
      );
    default:
      return null;
  }
}

/**
 * The guide body. Rendered identically by the build-time prerender and by the client route,
 * so a visitor arriving from search and a visitor navigating in-app get the same document
 * and hydration stays byte-stable.
 */
export function GuideView({ guide }: { guide: Guide }) {
  const related = guideSummaries(guide.related);
  const published = formatGuideDate(guide.datePublished);

  return <>
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
      <Link to="/">Home</Link><span aria-hidden="true"> / </span>
      <Link to="/guides">Guides</Link><span aria-hidden="true"> / </span>
      <span aria-current="page">{guide.heading}</span>
    </nav>

    <article>
      <header className="max-w-3xl">
        <p className="text-sm font-medium text-accent">Buying guide · {guide.primaryParent.label}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{guide.heading}</h1>
        <p className="mt-5 text-lg leading-8">{guide.standfirst}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          Written by the counter team at New Delhi Electricals · Published {published}
        </p>
      </header>

      <nav aria-label="On this page" className="mt-8 rounded-xl border bg-card p-5">
        <p className="text-sm font-medium">On this page</p>
        <ol className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {guide.sections.map(section => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="text-accent hover:underline">{section.heading}</a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-10 max-w-3xl">
        {guide.sections.map(section => (
          <section key={section.id} id={section.id} className="mt-12 scroll-mt-24 first:mt-0">
            <h2 className="text-2xl font-semibold tracking-tight">{section.heading}</h2>
            {section.blocks.map((block, position) => <Block key={position} block={block} />)}
          </section>
        ))}
      </div>

      {guide.faqs.length > 0 && (
        <section aria-labelledby="guide-faq" className="mt-14 max-w-3xl">
          <h2 id="guide-faq" className="text-2xl font-semibold tracking-tight">Common questions</h2>
          <dl className="mt-5 space-y-5">
            {guide.faqs.map(faq => (
              <div key={faq.question} className="rounded-xl border bg-card p-5">
                <dt className="font-medium">{faq.question}</dt>
                <dd className="mt-2 text-sm leading-6 text-muted-foreground">{inline(faq.answer)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section aria-labelledby="guide-cta" className="mt-14 rounded-2xl border bg-card p-6">
        <h2 id="guide-cta" className="text-2xl font-semibold tracking-tight">{guide.cta.heading}</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">{guide.cta.body}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={guideWhatsappHref(guide.cta.whatsappText)} target="_blank" rel="noreferrer"
            data-cta-location={`guide_${guide.slug}`}
            className="inline-flex rounded-lg bg-accent px-5 py-3 font-medium text-accent-foreground"
          >{guide.cta.whatsappLabel}</a>
          <Link to={guide.cta.browse.path} className="rounded-lg border px-5 py-3 font-medium">{guide.cta.browse.label}</Link>
          <Link to="/contact" className="rounded-lg border px-5 py-3 font-medium">Request a quotation</Link>
        </div>
      </section>

      <section aria-labelledby="guide-parents" className="mt-12">
        <h2 id="guide-parents" className="text-xl font-semibold">Products covered in this guide</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[guide.primaryParent, ...guide.supporting].map(link => (
            <li key={link.path} className="rounded-xl border bg-card p-5">
              <Link to={link.path} className="font-medium hover:text-accent">{link.label}</Link>
              {link.blurb && <p className="mt-2 text-sm leading-6 text-muted-foreground">{link.blurb}</p>}
            </li>
          ))}
        </ul>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="guide-related" className="mt-12">
          <h2 id="guide-related" className="text-xl font-semibold">Related guides</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {related.map(item => (
              <li key={item.slug} className="rounded-xl border bg-card p-5">
                <Link to={guidePath(item.slug)} className="font-medium hover:text-accent">{item.heading}</Link>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {guide.sources.length > 0 && (
        <section aria-labelledby="guide-sources" className="mt-12 border-t pt-6">
          <h2 id="guide-sources" className="text-lg font-semibold">Sources and further reading</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {guide.sources.map(source => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer nofollow" className="text-accent hover:underline">{source.label}</a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Specifications and catalogue list prices are those held against our catalogue records on the date shown above and can change.
            This guide covers product selection only; installation and testing must be carried out by a licensed electrician.
          </p>
        </section>
      )}
    </article>
  </>;
}

export default GuideView;
