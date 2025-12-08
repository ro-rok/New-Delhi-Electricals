import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTheme } from "next-themes";
import { useLenis } from "@/hooks/useLenis";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Download, Moon, Sun, Zap } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

type ModuleSize = "1M" | "2M" | "3M" | "4M";
type PlateOption = "grid" | "no-grid";

export interface ProductMediaImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  srcSet?: string;
  sizes?: string;
}

export interface ProductPricing {
  mrp?: number | null;
  selling_price?: number | null;
  currency?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  colorName: string;
  colorHex: string;
  moduleSize: ModuleSize;
  plateOption?: PlateOption;
  image?: string;
  modules?: string[];
  sku?: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductHeroProduct {
  sku: string;
  name: string;
  brand: string;
  series?: string;
  shortDescription?: string;
  description?: string;
  media: { images: ProductMediaImage[] };
  pricing: ProductPricing;
  specs?: ProductSpec[];
  variants?: ProductVariant[];
  catalogSource?: { product_family?: string; variant?: string[] };
  datasheetUrl?: string;
}

interface ProductHeroProps {
  product: ProductHeroProduct;
  initialVariant?: string;
  enableSmoothScroll?: boolean;
}

const placeholderHero =
  "https://via.placeholder.com/1200x1500.png?text=New+Delhi+Electrics+Plate";

const defaultVariants: ProductVariant[] = [
  {
    id: "white-1m-grid",
    name: "Ivory Grid",
    colorName: "Ivory",
    colorHex: "#f6f1e9",
    moduleSize: "1M",
    plateOption: "grid",
    image: placeholderHero,
    modules: ["1 x 1M"],
    sku: "NDE-PL-1M-IV",
  },
  {
    id: "onyx-2m-no-grid",
    name: "Onyx Matte",
    colorName: "Onyx",
    colorHex: "#1f1f1f",
    moduleSize: "2M",
    plateOption: "no-grid",
    image: placeholderHero,
    modules: ["1 x 2M", "1 x 1M"],
    sku: "NDE-PL-2M-ON",
  },
  {
    id: "sand-3m-grid",
    name: "Sand Grid",
    colorName: "Sand",
    colorHex: "#d7c7b5",
    moduleSize: "3M",
    plateOption: "grid",
    image: placeholderHero,
    modules: ["2 x 1M", "1 x 1M"],
    sku: "NDE-PL-3M-SA",
  },
  {
    id: "storm-4m-no-grid",
    name: "Storm",
    colorName: "Storm",
    colorHex: "#4a5568",
    moduleSize: "4M",
    plateOption: "no-grid",
    image: placeholderHero,
    modules: ["2 x 2M"],
    sku: "NDE-PL-4M-ST",
  },
];

function formatPrice(price?: number | null, currency = "₹") {
  if (price === undefined || price === null) return "—";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency === "₹" ? "INR" : currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency}${price}`;
  }
}

export const ProductHero: React.FC<ProductHeroProps> = ({
  product,
  initialVariant,
  enableSmoothScroll = true,
}) => {
  useLenis(enableSmoothScroll ? {} : undefined);
  const { theme, setTheme } = useTheme();
  const heroRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const variants = useMemo(
    () => product.variants?.length ? product.variants : defaultVariants,
    [product.variants]
  );

  const initial = useMemo(() => {
    const byId = variants.find((v) => v.id === initialVariant);
    return byId || variants[0];
  }, [initialVariant, variants]);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(initial);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const images = useMemo(() => {
    const mainList = [
      ...(selectedVariant.image
        ? [{ url: selectedVariant.image, alt: `${product.name} ${selectedVariant.name}` }]
        : []),
      ...(product.media?.images?.length ? product.media.images : []),
    ];
    return mainList.length ? mainList : [{ url: placeholderHero, alt: product.name }];
  }, [product.media?.images, product.name, selectedVariant.image, selectedVariant.name]);

  useEffect(() => {
    if (!imageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        imageRef.current,
        { opacity: 0, y: 48, scale: 1.03 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          ease: "power2.out",
          duration: 1,
          scrollTrigger: {
            trigger: imageRef.current,
            start: "top 80%",
          },
        }
      );

      gsap.to(imageRef.current, {
        yPercent: -8,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          scrub: 1.2,
          start: "top bottom",
          end: "bottom top",
        },
      });
    }, imageRef);

    return () => ctx.revert();
  }, []);

  const handleVariantClick = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setActiveImageIndex(0);
  };

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50"
      aria-label={`${product.name} hero`}
    >
      <div className="absolute inset-0 pointer-events-none opacity-60 dark:opacity-40 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.9),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.12),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.08),transparent_28%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 md:px-6 lg:flex-row lg:py-16">
        <div className="flex w-full flex-col gap-4 lg:w-[55%]">
          <div
            ref={imageRef}
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-b from-neutral-100 to-neutral-50 shadow-2xl ring-1 ring-black/5 transition dark:from-neutral-900 dark:to-neutral-800 dark:ring-white/5"
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={images[activeImageIndex]?.url}
                src={images[activeImageIndex]?.url}
                alt={images[activeImageIndex]?.alt || product.name}
                loading="lazy"
                srcSet={images[activeImageIndex]?.srcSet}
                sizes={images[activeImageIndex]?.sizes || "(max-width: 768px) 100vw, 55vw"}
                className="aspect-[4/5] w-full object-cover object-center will-change-transform"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </AnimatePresence>
            <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-full bg-white/70 px-3 py-2 text-xs font-medium backdrop-blur dark:bg-black/40 dark:text-white">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full border border-black/10 shadow-inner"
                  style={{ background: selectedVariant.colorHex }}
                  aria-hidden
                />
                {selectedVariant.colorName} • {selectedVariant.moduleSize}
              </span>
              {selectedVariant.plateOption === "grid" ? "Grid frame" : "No grid"}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2 overflow-x-auto rounded-2xl bg-white/70 p-2 shadow-sm ring-1 ring-neutral-200/70 dark:bg-neutral-900/60 dark:ring-white/5">
              {images.map((img, idx) => (
                <motion.button
                  key={`${img.url}-${idx}`}
                  onClick={() => setActiveImageIndex(idx)}
                  className={cn(
                    "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white",
                    activeImageIndex === idx
                      ? "border-neutral-900 shadow-md dark:border-white"
                      : "border-transparent hover:border-neutral-300 dark:hover:border-neutral-700"
                  )}
                  aria-label={`Show image ${idx + 1}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <img
                    src={img.url}
                    alt={img.alt || product.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </motion.button>
              ))}
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-sm font-medium shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900/70 dark:ring-white/10 md:flex">
              <ChevronLeft className="h-4 w-4 opacity-60" />
              Scroll to explore
              <ChevronRight className="h-4 w-4 opacity-60" />
            </div>
          </div>
        </div>

        <div className="relative flex w-full flex-col gap-6 rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-neutral-200 backdrop-blur dark:bg-neutral-900/80 dark:ring-white/10 lg:w-[45%]">
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label="Toggle theme"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200/80 bg-white text-neutral-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:border-white/10 dark:bg-neutral-800 dark:text-white dark:hover:border-white/30 dark:hover:bg-neutral-700"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
              {product.catalogSource?.product_family || product.brand}
            </p>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight text-neutral-900 dark:text-white md:text-3xl">
              {product.name}
            </h1>
            <p className="text-base text-neutral-600 dark:text-neutral-300">
              {product.shortDescription || product.description || "Minimal, precision-milled cover plates crafted for modern interiors."}
            </p>
          </div>

          <div className="flex items-end gap-3 text-neutral-900 dark:text-white">
            {product.pricing.selling_price ? (
              <>
                <span className="text-3xl font-semibold tracking-tight">
                  {formatPrice(product.pricing.selling_price, product.pricing.currency)}
                </span>
                {product.pricing.mrp && (
                  <span className="text-sm text-neutral-500 line-through">
                    {formatPrice(product.pricing.mrp, product.pricing.currency)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-3xl font-semibold tracking-tight">
                {formatPrice(product.pricing.mrp, product.pricing.currency)}
              </span>
            )}
            {selectedVariant.sku && (
              <span className="ml-auto text-sm text-neutral-500 dark:text-neutral-400">
                SKU: {selectedVariant.sku}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Colors
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {variants.map((variant) => (
                  <motion.button
                    key={variant.id}
                    onClick={() => handleVariantClick(variant)}
                    className={cn(
                      "group relative flex h-12 items-center justify-center overflow-hidden rounded-2xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white",
                      selectedVariant.id === variant.id
                        ? "border-neutral-900 shadow-md ring-1 ring-neutral-900/10 dark:border-white dark:ring-white/20"
                        : "border-neutral-200 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
                    )}
                    aria-label={`Select color ${variant.colorName}`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span
                      className="absolute inset-1 rounded-xl shadow-inner"
                      style={{ background: variant.colorHex }}
                      aria-hidden
                    />
                    <span className="relative z-10 text-xs font-semibold mix-blend-difference text-white drop-shadow">
                      {variant.colorName}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Module size
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {(["1M", "2M", "3M", "4M"] as ModuleSize[]).map((size) => (
                    <motion.button
                      key={size}
                      onClick={() => {
                        const variant = variants.find((v) => v.moduleSize === size) || selectedVariant;
                        handleVariantClick(variant);
                      }}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white",
                        selectedVariant.moduleSize === size
                          ? "border-neutral-900 bg-neutral-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-neutral-900"
                          : "border-neutral-200 bg-white/80 text-neutral-700 hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200 dark:hover:border-neutral-600"
                      )}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      aria-pressed={selectedVariant.moduleSize === size}
                    >
                      {size}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Plate option
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(["grid", "no-grid"] as PlateOption[]).map((plate) => (
                    <motion.button
                      key={plate}
                      onClick={() => {
                        const variant =
                          variants.find((v) => v.plateOption === plate && v.moduleSize === selectedVariant.moduleSize) ||
                          variants.find((v) => v.plateOption === plate) ||
                          selectedVariant;
                        handleVariantClick(variant);
                      }}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-sm font-semibold capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white",
                        selectedVariant.plateOption === plate
                          ? "border-neutral-900 bg-neutral-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-neutral-900"
                          : "border-neutral-200 bg-white/80 text-neutral-700 hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200 dark:hover:border-neutral-600"
                      )}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      aria-pressed={selectedVariant.plateOption === plate}
                    >
                      {plate === "grid" ? "Grid frame" : "No grid"}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-white shadow-lg ring-1 ring-neutral-900/10 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:ring-neutral-900 dark:bg-white dark:text-neutral-900 dark:ring-white/20 dark:focus-visible:ring-offset-neutral-900"
              >
                <Zap className="h-4 w-4" />
                Add to Cart
              </motion.button>
              <motion.a
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                href={product.datasheetUrl || "#"}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-3 text-neutral-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:border-neutral-500"
              >
                <Download className="h-4 w-4" />
                Download Datasheet
              </motion.a>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-neutral-600 dark:text-neutral-300">
              {(product.specs || [
                { label: "Modules", value: selectedVariant.modules?.join(", ") || "Configurable" },
                { label: "Material", value: "Polycarbonate + brushed frame" },
                { label: "Finish", value: selectedVariant.colorName },
                { label: "Dimensions", value: "86mm x 86mm" },
              ]).slice(0, 4).map((spec) => (
                <div
                  key={spec.label}
                  className="flex flex-col rounded-2xl border border-neutral-200/80 bg-white/60 px-3 py-2 shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900/50"
                >
                  <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    {spec.label}
                  </span>
                  <span className="text-sm font-medium text-neutral-900 dark:text-white">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 md:px-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
              Plates
            </p>
            <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white md:text-2xl">
              Choose your perfect configuration
            </h2>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {variants.map((variant) => (
            <motion.button
              key={variant.id}
              onClick={() => handleVariantClick(variant)}
              className={cn(
                "group relative flex flex-col gap-3 rounded-3xl border border-neutral-200/80 bg-white/80 p-4 text-left shadow-lg ring-1 ring-transparent transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:border-neutral-800 dark:bg-neutral-900/70 dark:shadow-none dark:focus-visible:ring-white",
                selectedVariant.id === variant.id
                  ? "ring-2 ring-neutral-900 dark:ring-white"
                  : "hover:-translate-y-1 hover:shadow-xl dark:hover:border-neutral-700"
              )}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.99 }}
              aria-pressed={selectedVariant.id === variant.id}
            >
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/70">
                <motion.img
                  src={variant.image || images[0]?.url || placeholderHero}
                  alt={`${product.name} ${variant.name}`}
                  className="aspect-[4/3] w-full object-cover"
                  loading="lazy"
                  initial={{ scale: 1.02, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {variant.name}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {variant.moduleSize} • {variant.plateOption === "grid" ? "Grid" : "No grid"}
                  </span>
                  <span className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                    {variant.modules?.join(" · ") || "Custom modules"}
                  </span>
                </div>
                <span
                  className="mt-1 h-6 w-6 rounded-full border border-neutral-200 shadow-inner ring-1 ring-black/5 dark:border-neutral-700"
                  style={{ background: variant.colorHex }}
                  aria-hidden
                />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-4 z-30 px-4 md:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl bg-white/90 p-3 shadow-2xl ring-1 ring-neutral-200 backdrop-blur dark:bg-neutral-900/90 dark:ring-white/10">
          <div className="flex flex-col text-sm font-medium text-neutral-900 dark:text-white">
            <span>{product.name}</span>
            <span className="text-neutral-500 dark:text-neutral-400">
              {formatPrice(product.pricing.selling_price || product.pricing.mrp, product.pricing.currency)}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="ml-auto inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-lg ring-1 ring-neutral-900/10 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:bg-white dark:text-neutral-900"
          >
            Add to Cart
          </motion.button>
        </div>
      </div>
    </section>
  );
};

export default ProductHero;
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import useLenis from "@/hooks/useLenis";

// Product shape derived from backend Pydantic schema (simplified for UI)
export interface ProductImage {
  url: string;
  alt?: string;
  color?: string;
  moduleSize?: "1M" | "2M" | "3M" | "4M" | string;
  plateOption?: "grid" | "no-grid" | string;
  width?: number;
  height?: number;
  srcSet?: string;
  sizes?: string;
}

export interface ProductPricing {
  mrp?: number;
  selling_price?: number | null;
  currency?: string;
}

export interface ProductVariant {
  id: string;
  label: string;
  color: string;
  swatch?: string;
  moduleSize: "1M" | "2M" | "3M" | "4M" | string;
  plateOption?: "grid frame" | "no grid frame" | string;
  sku?: string;
  price?: number;
  imageIndex?: number;
  specs?: Record<string, string | number | null>;
}

export interface PlateModule {
  label: string;
  count: number;
}

export interface PlateVariant {
  id: string;
  title: string;
  moduleCount: number;
  moduleSizeLabel: "1M" | "2M" | "3M" | "4M" | string;
  color: string;
  plateOption?: string;
  image?: string;
  modules?: PlateModule[];
}

export interface ProductSpecs {
  modules?: string;
  module_size?: string;
  color?: string;
  material?: string;
  dimensions?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface ProductMedia {
  images: ProductImage[];
}

export interface Product {
  sku: string;
  name: string;
  brand?: string;
  description: string;
  shortDescription?: string;
  media: ProductMedia;
  pricing?: ProductPricing;
  variants?: ProductVariant[];
  plates?: PlateVariant[];
  datasheetUrl?: string;
  specs?: ProductSpecs;
  catalogSource?: {
    product_family?: string;
    variant?: string[];
  };
}

interface ProductHeroProps {
  product: Product;
  initialVariant?: string;
}

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const placeholderImage =
  "https://via.placeholder.com/960x1200.png?text=New+Delhi+Electrics+Plate";

const currencyFormatter = (value?: number, currency = "INR") =>
  value ? new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(value) : "";

const ProductHero: React.FC<ProductHeroProps> = ({ product, initialVariant }) => {
  useLenis(); // smooth scrolling initialized once per mount
  const { theme, setTheme } = useTheme();
  const [selectedVariantId, setSelectedVariantId] = useState<string>(() => {
    if (initialVariant) return initialVariant;
    return product.variants?.[0]?.id ?? "";
  });
  const [activeImage, setActiveImage] = useState<number>(() => {
    const matchedVariant = product.variants?.find((v) => v.id === initialVariant);
    return matchedVariant?.imageIndex ?? 0;
  });

  const heroRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const activeVariant = useMemo(
    () => product.variants?.find((variant) => variant.id === selectedVariantId) ?? product.variants?.[0],
    [product.variants, selectedVariantId],
  );

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!heroRef.current || !imageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        imageRef.current,
        { opacity: 0, y: 40, filter: "blur(8px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top 80%",
          },
        },
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (activeVariant?.imageIndex !== undefined) {
      setActiveImage(activeVariant.imageIndex);
    }
  }, [activeVariant]);

  const images = product.media?.images?.length ? product.media.images : [{ url: placeholderImage, alt: product.name }];

  const displayedImage = images[activeImage] || images[0];

  const handleVariantSelect = (variantId: string) => {
    setSelectedVariantId(variantId);
    const matched = product.variants?.find((variant) => variant.id === variantId);
    if (typeof matched?.imageIndex === "number") {
      setActiveImage(matched.imageIndex);
    }
  };

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
      aria-labelledby="product-hero-heading"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-gradient-to-br from-teal-200/60 to-white blur-3xl dark:from-cyan-500/10 dark:to-slate-900" />
        <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-gradient-to-tr from-slate-200/70 to-white blur-3xl dark:from-teal-500/10 dark:to-slate-900" />
      </div>

      <div className="container relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 md:gap-12 md:py-16 lg:flex-row lg:items-center">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">New Delhi Electrics</p>
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100",
              focusRing,
            )}
            aria-label="Toggle theme"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 shadow-inner" />
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>

        <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="space-y-4">
            <div
              ref={imageRef}
              className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white/70 shadow-[0_20px_80px_-60px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/80"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={displayedImage?.url}
                    src={displayedImage?.url || placeholderImage}
                    alt={displayedImage?.alt || `${product.name} plate preview`}
                    srcSet={displayedImage?.srcSet}
                    sizes={displayedImage?.sizes || "(max-width: 768px) 100vw, 55vw"}
                    loading="lazy"
                    className="h-full w-full object-cover transition will-change-transform"
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                  />
                </AnimatePresence>
                <div className="absolute left-3 top-3 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-700 shadow-sm backdrop-blur dark:bg-slate-900/80 dark:text-slate-200">
                  {activeVariant?.plateOption || "Grid frame"}
                </div>
              </div>

              <div className="flex gap-3 overflow-auto p-4" role="list" aria-label="Product image thumbnails">
                {images.map((image, index) => (
                  <motion.button
                    key={image.url + index.toString()}
                    onClick={() => setActiveImage(index)}
                    className={cn(
                      "group relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900",
                      activeImage === index && "ring-2 ring-teal-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900",
                      focusRing,
                    )}
                    aria-label={`View image ${index + 1}`}
                    aria-pressed={activeImage === index}
                  >
                    <img
                      src={image.url}
                      alt={image.alt || `Thumbnail ${index + 1}`}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:sticky lg:top-10">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Premium Plates</p>
              <h1 id="product-hero-heading" className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-4xl">
                {product.name}
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-300">{product.shortDescription || product.description}</p>
            </div>

            <div className="flex items-baseline gap-3">
              {product.pricing?.selling_price && (
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                  {currencyFormatter(product.pricing.selling_price, product.pricing.currency)}
                </p>
              )}
              {product.pricing?.mrp && (
                <p className="text-sm text-slate-500 line-through dark:text-slate-400">
                  {currencyFormatter(product.pricing.mrp, product.pricing.currency)}
                </p>
              )}
            </div>

            <div className="space-y-3" aria-label="Color swatches">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Colors</p>
                <span className="text-xs text-slate-500 dark:text-slate-400">Tap to preview</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.variants?.map((variant) => (
                  <motion.button
                    key={variant.id}
                    onClick={() => handleVariantSelect(variant.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "group inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900",
                      selectedVariantId === variant.id && "ring-2 ring-teal-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900",
                      focusRing,
                    )}
                    aria-pressed={selectedVariantId === variant.id}
                    aria-label={`Select color ${variant.label}`}
                  >
                    <span
                      aria-hidden
                      className="h-6 w-6 rounded-full border border-slate-200 shadow-inner dark:border-slate-700"
                      style={{ background: variant.swatch || variant.color }}
                    />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{variant.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {variant.moduleSize} · {variant.plateOption || "Grid frame"}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="space-y-3" aria-label="Module size selector">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Module sizes</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {["1M", "2M", "3M", "4M"].map((size) => (
                  <motion.button
                    key={size}
                    onClick={() => {
                      const match = product.variants?.find((variant) => variant.moduleSize === size);
                      if (match) handleVariantSelect(match.id);
                    }}
                    whileHover={{ y: -2 }}
                    className={cn(
                      "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100",
                      activeVariant?.moduleSize === size && "border-teal-500 text-teal-700 dark:text-teal-200",
                      focusRing,
                    )}
                    aria-pressed={activeVariant?.moduleSize === size}
                  >
                    {size}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-3xl border border-slate-100 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 sm:grid-cols-2">
              {product.specs?.material && (
                <SpecRow label="Material" value={product.specs.material} />
              )}
              {product.specs?.dimensions && (
                <SpecRow label="Dimensions" value={product.specs.dimensions} />
              )}
              {activeVariant?.moduleSize && <SpecRow label="Module size" value={activeVariant.moduleSize} />}
              {activeVariant?.color && <SpecRow label="Color" value={activeVariant.color} />}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl focus-visible:outline-none dark:from-teal-500 dark:to-emerald-500",
                  focusRing,
                )}
                aria-label="Add to cart"
              >
                Add to cart
              </motion.button>
              {product.datasheetUrl && (
                <motion.a
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  href={product.datasheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:text-slate-100",
                    focusRing,
                  )}
                  aria-label="Download datasheet"
                >
                  Download datasheet
                </motion.a>
              )}
            </div>
          </div>
        </div>

        {product.plates?.length ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Plate variants</p>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Built for every space</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tap a card to preview</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {product.plates.map((plate) => {
                const isActive =
                  activeVariant?.moduleSize === plate.moduleSizeLabel && activeVariant?.color === plate.color;
                return (
                  <motion.button
                    key={plate.id}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      const match = product.variants?.find(
                        (variant) =>
                          variant.moduleSize === plate.moduleSizeLabel &&
                          variant.color.toLowerCase() === plate.color.toLowerCase(),
                      );
                      if (match) {
                        handleVariantSelect(match.id);
                      } else {
                        setActiveImage(plate.image ? images.findIndex((img) => img.url === plate.image) : 0);
                      }
                    }}
                    className={cn(
                      "relative flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white/90 p-4 text-left shadow-sm backdrop-blur transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80",
                      isActive && "ring-2 ring-teal-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900",
                      focusRing,
                    )}
                    aria-pressed={isActive}
                  >
                    <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-800">
                      <img
                        src={plate.image || displayedImage?.url || placeholderImage}
                        alt={`${plate.title} preview`}
                        className="h-full w-full object-cover transition duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{plate.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {plate.moduleCount} modules · {plate.moduleSizeLabel}
                        </p>
                      </div>
                      <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {plate.color}
                      </div>
                    </div>
                    {plate.modules?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {plate.modules.map((mod) => (
                          <span
                            key={`${plate.id}-${mod.label}`}
                            className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {mod.count} x {mod.label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="fixed bottom-4 left-0 right-0 z-30 px-4 md:hidden">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/95 px-4 py-3 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Now viewing</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {activeVariant?.label || product.name}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            className={cn(
              "inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-md transition dark:bg-teal-500",
              focusRing,
            )}
            aria-label="Add to cart mobile"
          >
            Add
          </motion.button>
        </div>
      </div>
    </section>
  );
};

interface SpecRowProps {
  label: string;
  value?: string | number | null;
}

const SpecRow: React.FC<SpecRowProps> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2 text-sm text-slate-700 shadow-inner dark:bg-slate-800/70 dark:text-slate-200">
      <span className="font-medium">{label}</span>
      <span className="text-right text-slate-600 dark:text-slate-300">{value}</span>
    </div>
  );
};

export default ProductHero;
