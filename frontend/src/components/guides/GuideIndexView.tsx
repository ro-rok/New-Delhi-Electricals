import { Link } from 'react-router-dom';
import { GUIDE_CLUSTERS, guidePath } from '@/lib/guides';
import { GUIDE_SUMMARIES, guideSummariesInCluster } from '@/content/guides/manifest';

/**
 * The guides index. Grouped by the commercial category each cluster supports, so the page
 * is useful to a buyer working through one decision rather than a reverse-chronological list.
 */
export function GuideIndexView() {
  const clusters = GUIDE_CLUSTERS
    .map(cluster => ({ cluster, guides: guideSummariesInCluster(cluster.id) }))
    .filter(entry => entry.guides.length > 0);

  return <>
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
      <Link to="/">Home</Link><span aria-hidden="true"> / </span>
      <span aria-current="page">Guides</span>
    </nav>

    <header className="max-w-3xl">
      <p className="text-sm font-medium text-accent">Buying guides · Delhi NCR</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Electrical buying guides</h1>
      <p className="mt-4 text-lg leading-8 text-muted-foreground">
        Practical selection guidance from the counter at New Delhi Electricals: how to read a specification, what
        the ratings on a device actually mean, and what to have ready before you ask for a quotation. Every guide
        covers choosing and buying products. Installation and testing is work for a licensed electrician.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        {GUIDE_SUMMARIES.length} guides across {clusters.length} product areas.
      </p>
    </header>

    {clusters.map(({ cluster, guides }) => (
      <section key={cluster.id} aria-labelledby={`cluster-${cluster.id}`} className="mt-12">
        <h2 id={`cluster-${cluster.id}`} className="text-2xl font-semibold tracking-tight">{cluster.label}</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">{cluster.intro}</p>
        <p className="mt-2 text-sm">
          <Link to={cluster.parentPath} className="text-accent hover:underline">
            Browse {cluster.parentLabel.toLowerCase()} in the catalogue
          </Link>
        </p>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {guides.map(guide => (
            <li key={guide.slug} className="rounded-xl border bg-card p-5">
              <h3 className="font-medium">
                <Link to={guidePath(guide.slug)} className="hover:text-accent">{guide.heading}</Link>
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{guide.summary}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                Supports <Link to={guide.primaryParent.path} className="text-accent hover:underline">{guide.primaryParent.label}</Link>
              </p>
            </li>
          ))}
        </ul>
      </section>
    ))}

    <section aria-labelledby="guides-cta" className="mt-14 rounded-2xl border bg-card p-6">
      <h2 id="guides-cta" className="text-2xl font-semibold tracking-tight">Not sure what your job needs?</h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Send the circuit schedule, bill of quantities or point count you are working from. We price it against what
        we carry and tell you where the schedule asks for something we do not list.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link to="/categories" className="rounded-lg border px-5 py-3 font-medium">Browse the catalogue</Link>
        <Link to="/contact" className="rounded-lg border px-5 py-3 font-medium">Request a quotation</Link>
      </div>
    </section>
  </>;
}

export default GuideIndexView;
