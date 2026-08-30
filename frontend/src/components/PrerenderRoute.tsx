import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/Footer';
import { CommercialHubView } from '@/components/commercial/CommercialHubView';
import type { RouteData } from '@/lib/routeData';
import { findHub, hubForProduct, hubPath, whatsappHref } from '@/lib/commercialHubs';
import { useApp } from '@/contexts/AppContext';

/**
 * The React route rendered at build time and hydrated in the browser. It intentionally
 * contains only deterministic, public catalogue state supplied for the current route.
 */
export function PrerenderRoute({ data }: { data: RouteData }) {
  const products = data.products || [];
  const categoryPath = data.category ? `/category/${data.category.slug}` : '/categories';
  const { addToCart, isInCart } = useApp();
  const product = data.product;
  const hub = data.kind === 'hub' && data.hub ? findHub(data.hub.brandSlug, data.hub.slug) : undefined;
  const productHub = product ? hubForProduct(product) : undefined;
  const commercial = data.kind === 'home' || data.kind === 'category' || data.kind === 'brand';
  const whatsappUrl = product
    ? whatsappHref(`Hi! I'm interested in SKU ${product.sku} - ${product.name}. Please share more details.`)
    : `https://wa.me/919654102758`;

  const linkGroups = data.links?.length ? <nav aria-label="Explore the catalogue" className="mt-14 border-t pt-8">
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {data.links.map(group => <div key={group.heading}>
        <h2 className="text-lg font-semibold">{group.heading}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {group.items.map(item => <li key={item.path}>
            <Link to={item.path} className="text-accent hover:underline">{item.label}</Link>
          </li>)}
        </ul>
      </div>)}
    </div>
  </nav> : null;

  const catalogIndex = data.catalogIndex?.groups.length ? <nav aria-label={data.catalogIndex.heading} className="mt-14 border-t pt-8">
    <h2 className="text-lg font-semibold">{data.catalogIndex.heading}</h2>
    {data.catalogIndex.groups.map(group => <section key={group.heading} className="mt-5">
      <h3 className="text-sm font-medium text-muted-foreground">{group.heading}</h3>
      <ul className="mt-2 columns-1 gap-6 text-sm sm:columns-2 lg:columns-3">
        {group.items.map(item => <li key={item.path} className="mb-1 break-inside-avoid">
          <Link to={item.path} className="hover:text-accent">{item.label}</Link>
        </li>)}
      </ul>
    </section>)}
  </nav> : null;

  return <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto max-w-7xl px-4 pt-24 pb-16">
      {hub ? <CommercialHubView hub={hub} products={products} /> : data.kind === 'product' && product ? <>
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <Link to="/">Home</Link><span aria-hidden="true"> / </span><Link to={categoryPath}>{data.category?.name || 'Categories'}</Link><span aria-hidden="true"> / </span><Link to={`/brand/${data.brand?.slug}`}>{product.brand}</Link><span aria-hidden="true"> / </span><span aria-current="page">{product.name}</span>
        </nav>
        <article className="grid gap-10 md:grid-cols-2">
          <div className="aspect-square rounded-2xl border bg-card p-6">{product.images?.[0] ? <img src={product.images[0]} alt={`${product.brand} ${product.name}`} className="mx-auto h-full w-full object-contain" /> : <div className="h-full w-full" />}</div>
          <div><p className="mb-2 text-sm font-medium text-accent">{product.brand} · {product.category}</p><h1 className="text-3xl font-bold tracking-tight">{product.name}</h1><p className="mt-5 leading-7 text-muted-foreground">{product.description || `Enquire about ${product.name} from New Delhi Electricals.`}</p>{product.sku && <p className="mt-4 text-sm">SKU: {product.sku}</p>}
            {data.variantOptions?.length ? <section aria-label="Product variants" className="mt-5"><h2 className="text-sm font-medium">Available variants</h2><div className="mt-2 flex flex-wrap gap-2">{data.variantOptions.map(option => <a key={option.sku} href={option.urlPath} data-variant-sku={option.sku} className="rounded-md border px-3 py-2 text-sm hover:border-accent">{option.color || option.name}</a>)}</div></section> : null}
            <div className="mt-7 flex flex-wrap gap-3"><a data-cta-location="product_prerender" className="inline-flex rounded-lg bg-accent px-5 py-3 font-medium text-accent-foreground" href={whatsappUrl} target="_blank" rel="noreferrer">Enquire on WhatsApp</a><button type="button" onClick={() => addToCart(product, 1)} className="rounded-lg border px-5 py-3 font-medium">{isInCart(product.id) ? 'In Cart' : 'Add to Cart'}</button><Link to="/cart" className="rounded-lg border px-5 py-3 font-medium">View Cart</Link></div>
            {productHub && <p className="mt-6 text-sm text-muted-foreground">
              Comparing the range? See <Link to={hubPath(productHub)} className="text-accent hover:underline">{productHub.heading}</Link> for sizes, ratings and current catalogue prices.
            </p>}
          </div>
        </article>
      </> : <>
        {(data.kind === 'category' || data.kind === 'brand') && <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <Link to="/">Home</Link><span aria-hidden="true"> / </span><Link to={data.kind === 'brand' ? '/brands' : '/categories'}>{data.kind === 'brand' ? 'Brands' : 'Categories'}</Link><span aria-hidden="true"> / </span><span aria-current="page">{data.heading}</span>
        </nav>}
        <header className="max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight">{data.heading}</h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">{data.text || data.description}</p>
          {commercial && <div className="mt-6 flex flex-wrap gap-3">
            <a data-cta-location={`${data.kind}_prerender`} className="inline-flex rounded-lg bg-accent px-5 py-3 font-medium text-accent-foreground" href={whatsappUrl} target="_blank" rel="noreferrer">Enquire on WhatsApp</a>
            <Link to="/cart" className="rounded-lg border px-5 py-3 font-medium">Build a quotation list</Link>
            <Link to="/contact" className="rounded-lg border px-5 py-3 font-medium">Contact the store</Link>
          </div>}
        </header>
        {data.propositions?.length ? <section aria-label="What we do" className="mt-10 grid gap-4 md:grid-cols-3">
          {data.propositions.map(item => <p key={item} className="rounded-xl border bg-card p-5 text-sm leading-6 text-muted-foreground">{item}</p>)}
        </section> : null}
        {products.length > 0 && <section aria-label="Catalogue products" className="mt-10"><h2 className="text-2xl font-semibold">Browse products</h2><ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{products.map(product => <li key={product.id} className="rounded-xl border bg-card p-4"><Link to={product.urlPath || `/${product.brandSlug}/${product.slug}`} className="font-medium hover:text-accent">{product.name}</Link><p className="mt-1 text-sm text-muted-foreground">{product.brand} · {product.category}</p></li>)}</ul></section>}
      </>}
      {linkGroups}
      {catalogIndex}
    </main>
    <Footer />
  </div>;
}
