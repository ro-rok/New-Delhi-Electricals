/**
 * Cloudinary Delivery URL Helper
 *
 * The catalogue stores raw Cloudinary *master* URLs (no transformation
 * segment), e.g.
 *   https://res.cloudinary.com/<cloud>/image/upload/v1767338212/catalog-products/xyz.jpg
 *
 * Those masters are camera-resolution JPEGs — several of them are 3-4 MB each.
 * Rendering them straight into a 320 px product card downloads the full master.
 * These helpers rewrite the URL to a size- and format-appropriate derivative:
 *   .../image/upload/f_auto,q_auto,w_640,c_limit,dpr_auto/v1767338212/...
 *
 * SAFETY RULES (do not relax without re-verifying against the catalogue):
 *  - Only `res.cloudinary.com` hosts are rewritten. Product data also contains
 *    smartshop.lk-ea.com, jayceeonline.com, cdn.moglix.com, m.media-amazon.com,
 *    havells.com and backend-relative URLs — those are returned untouched.
 *  - Only the *unsigned* `/image/upload/` delivery path is rewritten. Signed
 *    (`/image/upload/s--sig--/`), authenticated, private and fetch/video
 *    delivery types are returned untouched, because injecting a transformation
 *    into a signed URL invalidates the signature and 401s.
 *  - A URL that already carries a transformation segment is left alone, so this
 *    is idempotent and safe to apply twice.
 *  - data: URIs and empty values pass through unchanged.
 */

const CLOUDINARY_HOST = "res.cloudinary.com";

/** Widths offered in srcset. Kept small — catalogue art is square product shots. */
export const CARD_WIDTHS = [160, 240, 320, 480, 640] as const;
export const DETAIL_WIDTHS = [320, 480, 640, 960, 1280] as const;

/**
 * Cloudinary transformation tokens, in the order Cloudinary documents them.
 * `c_limit` never upscales past the master, so small masters are not blown up.
 */
function buildTransform(width?: number): string {
  const parts = ["f_auto", "q_auto"];
  if (width && Number.isFinite(width) && width > 0) {
    parts.push(`w_${Math.round(width)}`, "c_limit");
  }
  return parts.join(",");
}

/**
 * True when `url` is an unsigned Cloudinary image-upload URL that we may safely
 * insert a transformation into.
 */
export function isTransformableCloudinaryUrl(url?: string | null): boolean {
  if (!url || url.startsWith("data:")) return false;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false; // relative / backend-hosted path
  }

  if (parsed.hostname !== CLOUDINARY_HOST) return false;

  // Expect /<cloud>/image/upload/<rest>. Anything else (video, raw,
  // authenticated, private, fetch) is out of scope.
  const segments = parsed.pathname.split("/").filter(Boolean);
  const uploadIdx = segments.indexOf("upload");
  if (uploadIdx < 2) return false;
  if (segments[uploadIdx - 1] !== "image") return false;

  const rest = segments.slice(uploadIdx + 1);
  if (rest.length === 0) return false;

  // Signed delivery: first segment after `upload` is `s--<signature>--`.
  if (/^s--[\w-]+--$/.test(rest[0])) return false;

  // Already transformed: first segment is neither a version (`v123…`) nor the
  // start of the public id — it is a comma-joined transformation list.
  const first = rest[0];
  const isVersion = /^v\d+$/.test(first);
  const looksLikeTransform =
    !isVersion && /(^|,)(f|q|w|h|c|dpr|e|fl|g|ar|b|r|o|x|y|z|t)_[^,/]+/.test(first);
  if (looksLikeTransform) return false;

  return true;
}

/**
 * Return a delivery URL for `url` sized for a `width`-CSS-pixel render slot.
 * Non-Cloudinary and non-rewritable URLs are returned verbatim.
 */
export function cloudinaryUrl(url?: string | null, width?: number): string {
  if (!url) return "";
  if (!isTransformableCloudinaryUrl(url)) return url;
  return url.replace("/image/upload/", `/image/upload/${buildTransform(width)}/`);
}

/**
 * Build a `srcset` string across `widths`. Returns `undefined` for URLs we do
 * not rewrite, so callers can simply spread it onto the <img>.
 */
export function cloudinarySrcSet(
  url?: string | null,
  widths: readonly number[] = CARD_WIDTHS
): string | undefined {
  if (!isTransformableCloudinaryUrl(url)) return undefined;
  return widths.map((w) => `${cloudinaryUrl(url, w)} ${w}w`).join(", ");
}

/**
 * Everything an <img> needs for responsive Cloudinary delivery.
 *
 * @param url        raw catalogue image URL
 * @param fallback   width used for the plain `src` (the no-srcset fallback)
 * @param widths     candidate widths for `srcset`
 */
export function responsiveImage(
  url?: string | null,
  fallback = 480,
  widths: readonly number[] = CARD_WIDTHS
): { src: string; srcSet?: string } {
  return {
    src: cloudinaryUrl(url, fallback),
    srcSet: cloudinarySrcSet(url, widths),
  };
}
