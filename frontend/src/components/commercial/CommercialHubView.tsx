import { Link } from 'react-router-dom';
import type { Product } from '@/types/product';
import {
  type CommercialHub, facetValues, formatInr, hubPath, perMetrePrice, priceRange, whatsappHref,
} from '@/lib/commercialHubs';
import { GuideLinkCards } from '@/components/guides/GuideLinkCards';

/**
 * The commercial hub body. Rendered identically by the build-time prerender and by the
 * client route, so a visitor arriving from search and a visitor navigating in-app see the
 * same page and hydration stays byte-stable.
 */
export function CommercialHubView({ hub, products }: { hub: CommercialHub; products: Product[] }) {
  const range = priceRange(products);
  const groups = hub.groupByCategory
    ? hub.categories
        .map(category => ({ category, items: products.filter(product => product.category === category) }))
        .filter(group => group.items.length > 0)
    : [{ category: '', items: products }];
  const facets = hub.facets
    .map(facet => ({ facet, values: facetValues(products, facet) }))
    .filter(entry => entry.values.length > 0);

  return <>
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
      <Link to="/">Home</Link><span aria-hidden="true"> / </span>
      <Link to="/brands">Brands</Link><span aria-hidden="true"> / </span>
      <Link to={`/brand/${hub.brandSlug}`}>{hub.brandName}</Link><span aria-hidden="true"> / </span>
      <span aria-current="page">{hub.categoryName}</span>
    </nav>

    <header className="max-w-3xl">
      <p className="text-sm font-medium text-accent">{hub.brandName} · {hub.categoryName} · Delhi NCR</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{hub.heading}</h1>
      <p className="mt-4 text-lg leading-8 text-muted-foreground">{hub.intro}</p>
      <p className="mt-4 text-sm text-muted-foreground">
        {products.length} {hub.brandName} catalogue {products.length === 1 ? 'product' : 'products'} listed on this page
        {range ? <> · current catalogue list prices from {formatInr(range.min)} to {formatInr(range.max)}</> : null}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={whatsappHref(hub.whatsappText)} target="_blank" rel="noreferrer"
          data-cta-location={`hub_hero_${hub.brandSlug}_${hub.slug}`}
          className="inline-flex rounded-lg bg-accent px-5 py-3 font-medium text-accent-foreground"
        >{hub.whatsappLabel}</a>
        <Link to="/cart" className="rounded-lg border px-5 py-3 font-medium">Build a quotation list</Link>
        <Link to="/contact" className="rounded-lg border px-5 py-3 font-medium">Contact the store</Link>
      </div>
    </header>

    <section aria-labelledby="hub-dealer" className="mt-10 rounded-2xl border bg-card p-6">
      <h2 id="hub-dealer" className="text-xl font-semibold">Buying {hub.brandName} {hub.categoryName.toLowerCase()} from us</h2>
      <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground md:grid-cols-3">
        {hub.proposition.map(item => <li key={item}>{item}</li>)}
      </ul>
    </section>

    {facets.length > 0 && <section aria-labelledby="hub-range" className="mt-12">
      <h2 id="hub-range" className="text-2xl font-semibold">{hub.rangeHeading}</h2>
      <p className="mt-2 max-w-3xl text-muted-foreground">{hub.rangeIntro}</p>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        {facets.map(({ facet, values }) => <div key={facet.key} className="rounded-xl border bg-card p-4">
          <dt className="text-sm font-medium">{facet.label}</dt>
          <dd className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
            {values.map(entry => <span key={entry.value} className="rounded-md border px-2 py-1">
              {entry.value}{facet.unit ? ` ${facet.unit}` : ''} <span className="text-xs">({entry.count})</span>
            </span>)}
          </dd>
        </div>)}
      </dl>
    </section>}

    {groups.map(group => <section key={group.category || 'all'} aria-label={`${hub.brandName} ${group.category || hub.categoryName}`} className="mt-12">
      <h2 className="text-2xl font-semibold">{group.category ? `${hub.brandName} ${group.category.toLowerCase()}` : `${hub.brandName} ${hub.categoryName.toLowerCase()} in our catalogue`}</h2>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {group.items.map(product => {
          const metre = hub.perMetre ? perMetrePrice(product) : null;
          return <li key={product.id} className="rounded-xl border bg-card p-4">
            <Link to={product.urlPath || `/${product.brandSlug}/${product.slug}`} className="font-medium hover:text-accent">{product.name}</Link>
            {product.sku && <p className="mt-1 text-xs text-muted-foreground">SKU {product.sku}</p>}
            <p className="mt-2 text-sm">
              {product.listPrice > 0
                ? <>{formatInr(product.listPrice)} <span className="text-xs text-muted-foreground">catalogue list price{metre ? ` · ${metre}/m` : ''}</span></>
                : <span className="text-xs text-muted-foreground">Price on enquiry</span>}
            </p>
          </li>;
        })}
      </ul>
      {group.category && <p className="mt-3 text-sm">
        <Link to={`/brand/${hub.brandSlug}`} className="text-accent hover:underline">See every {hub.brandName} product we carry</Link>
      </p>}
    </section>)}

    <section aria-labelledby="hub-guidance" className="mt-12">
      <h2 id="hub-guidance" className="text-2xl font-semibold">{hub.guidanceHeading}</h2>
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {hub.guidance.map(item => <div key={item.heading} className="rounded-xl border bg-card p-5">
          <h3 className="font-medium">{item.heading}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
        </div>)}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Selection guidance only. Installation must be carried out by a licensed electrician to the applicable standards.
      </p>
    </section>

    <section aria-labelledby="hub-applications" className="mt-12">
      <h2 id="hub-applications" className="text-2xl font-semibold">{hub.applicationsHeading}</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {hub.applications.map(item => <div key={item.heading} className="rounded-xl border bg-card p-5">
          <h3 className="font-medium">{item.heading}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
        </div>)}
      </div>
    </section>

    <section aria-labelledby="hub-cta" className="mt-12 rounded-2xl border bg-card p-6">
      <h2 id="hub-cta" className="text-2xl font-semibold">{hub.ctaHeading}</h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">{hub.ctaBody}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={whatsappHref(hub.whatsappText)} target="_blank" rel="noreferrer"
          data-cta-location={`hub_footer_${hub.brandSlug}_${hub.slug}`}
          className="inline-flex rounded-lg bg-accent px-5 py-3 font-medium text-accent-foreground"
        >{hub.whatsappLabel}</a>
        <Link to="/cart" className="rounded-lg border px-5 py-3 font-medium">Review quotation list</Link>
      </div>
    </section>

    {hub.faqs.length > 0 && <section aria-labelledby="hub-faq" className="mt-12">
      <h2 id="hub-faq" className="text-2xl font-semibold">Common questions</h2>
      <dl className="mt-5 grid gap-5 md:grid-cols-3">
        {hub.faqs.map(faq => <div key={faq.question} className="rounded-xl border bg-card p-5">
          <dt className="font-medium">{faq.question}</dt>
          <dd className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</dd>
        </div>)}
      </dl>
    </section>}

    <GuideLinkCards commercialPath={hubPath(hub)} heading={`Buying guides for ${hub.categoryName.toLowerCase()}`} />

    <nav aria-label="Related pages" className="mt-12 border-t pt-6">
      <h2 className="text-lg font-semibold">Related pages</h2>
      <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {hub.related.map(link => <li key={link.path}>
          <Link to={link.path} className="text-accent hover:underline">{link.label}</Link>
        </li>)}
      </ul>
    </nav>
  </>;
}

export default CommercialHubView;
