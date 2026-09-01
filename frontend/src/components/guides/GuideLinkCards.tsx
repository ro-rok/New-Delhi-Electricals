import { Link } from 'react-router-dom';
import { guidePath } from '@/lib/guides';
import { guidesSupporting } from '@/content/guides/manifest';

/**
 * Commercial page -> guide links. Rendered on the category and brand-hub pages that a guide
 * names as its parent or as a supporting page, so the content layer is reachable from the
 * catalogue rather than only from the guides index. Renders nothing when no guide applies,
 * which keeps pages without relevant content free of filler links.
 */
export function GuideLinkCards({ commercialPath, heading = 'Buying guides for this range', className = 'mt-12' }: {
  commercialPath: string;
  heading?: string;
  className?: string;
}) {
  const guides = guidesSupporting(commercialPath);
  if (!guides.length) return null;

  return (
    <section aria-labelledby="commercial-guides" className={className}>
      <h2 id="commercial-guides" className="text-xl font-semibold">{heading}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Selection guidance written against the products on this page. Installation and testing is work for a licensed electrician.
      </p>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map(guide => (
          <li key={guide.slug} className="rounded-xl border bg-card p-5">
            <h3 className="font-medium">
              <Link to={guidePath(guide.slug)} className="hover:text-accent">{guide.heading}</Link>
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{guide.summary}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm">
        <Link to="/guides" className="text-accent hover:underline">All electrical buying guides</Link>
      </p>
    </section>
  );
}

export default GuideLinkCards;
