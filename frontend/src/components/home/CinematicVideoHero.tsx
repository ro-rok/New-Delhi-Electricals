import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── GSAP is browser-only ─────────────────────────────────────────────────────
// Do NOT import gsap or ScrollTrigger at module level.
// This file is bundled into entry-server.js for SSR pre-rendering.
// A module-level gsap.registerPlugin() call crashes Node with:
//   "TypeError: dt.registerPlugin is not a function"
// All GSAP usage lives inside useEffect (client-only, never runs on server).

// ─── constants ────────────────────────────────────────────────────────────────
// Desktop scrubs the video frame-by-frame, so it needs the all-intra ("seek")
// encode at full resolution. Mobile (<768px) never scrubs — it just autoplays a
// muted loop — so it gets the 720p standard-GOP encode instead: same footage,
// ~3.3 MB less transfer and far cheaper decode on phone silicon.
const VIDEO_SRC        = '/ndehero_1440p_seek.mp4';
const VIDEO_SRC_MOBILE = '/ndehero.mp4';
const VIDEO_FPS       = 24;
const FRAME_DURATION  = 1 / VIDEO_FPS;
const SCRUB_SCROLL_PX = 2800;

const TEXT_STAGES = [
  { enter: 0.00, exit: 0.24, label: 'NEW DELHI ELECTRICALS', sub: 'Authorized Partner · Since 1998' },
  { enter: 0.28, exit: 0.54, label: 'Premium Electrical',    sub: '1900+ products · 5 authorised brands' },
  { enter: 0.58, exit: 0.84, label: 'Built for India',       sub: 'Switches · MCBs · Wires · Sockets' },
  { enter: 0.88, exit: 1.00, label: 'Explore the Range',     sub: 'Scroll down to shop ↓' },
] as const;

// ─── component ────────────────────────────────────────────────────────────────
export default function CinematicVideoHero() {
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const overlayRef   = useRef<HTMLDivElement>(null);
  const preloaderRef = useRef<HTMLDivElement>(null);
  const scrollCueRef = useRef<HTMLDivElement>(null);
  const textRefs     = useRef<(HTMLDivElement | null)[]>([]);
  const navigate     = useNavigate();

  // Seek-gate — all refs, zero React state on animation frames
  const progressRef = useRef(0);
  const isSeeking   = useRef(false);
  const rafPending  = useRef(false);
  const videoReady  = useRef(false);

  // ── seek gate ────────────────────────────────────────────────────────────
  const flushSeek = useCallback(() => {
    rafPending.current = false;
    const video = videoRef.current;
    if (!video || !videoReady.current) return;
    const target = progressRef.current * video.duration;
    if (Math.abs(target - video.currentTime) < FRAME_DURATION * 0.5) return;
    if (isSeeking.current) return;
    isSeeking.current = true;
    video.currentTime = target;
  }, []);

  const scheduleSeek = useCallback((progress: number) => {
    progressRef.current = Math.max(0, Math.min(1, progress));
    if (rafPending.current) return;
    rafPending.current = true;
    requestAnimationFrame(flushSeek);
  }, [flushSeek]);

  // ── text driver ──────────────────────────────────────────────────────────
  const updateText = useCallback((progress: number) => {
    TEXT_STAGES.forEach((stage, i) => {
      const el = textRefs.current[i];
      if (!el) return;
      const fadeLen = 0.055;
      const visible = progress >= stage.enter && progress <= stage.exit;
      if (visible) {
        const entering = progress < stage.enter + fadeLen;
        const exiting  = progress > stage.exit  - fadeLen;
        let t = 1;
        if (entering) t = (progress - stage.enter) / fadeLen;
        if (exiting)  t = (stage.exit - progress)  / fadeLen;
        t = Math.max(0, Math.min(1, t));
        el.style.opacity   = String(t);
        el.style.transform = `translateY(${(1 - t) * 16}px)`;
      } else {
        el.style.opacity   = '0';
        el.style.transform = 'translateY(16px)';
      }
    });
  }, []);

  // ── main effect — client-only, runs on every mount (SPA navigation safe) ─
  useEffect(() => {
    const video   = videoRef.current;
    const wrapper = wrapperRef.current;
    if (!video || !wrapper) return;

    // Cleanup handle for the GSAP context (set after dynamic import resolves)
    // eslint-disable-next-line prefer-const
    let gsapCtx: { revert: () => void } | null = null;
    let destroyed = false;

    // Reset all gate refs for this mount
    progressRef.current = 0;
    isSeeking.current   = false;
    rafPending.current  = false;
    videoReady.current  = false;

    // Reset DOM state (previous mount may have left stale inline styles)
    const pre = preloaderRef.current;
    if (pre) { pre.style.display = 'flex'; pre.style.opacity = '1'; }
    if (overlayRef.current) overlayRef.current.style.opacity = '0';
    textRefs.current.forEach(el => {
      if (el) { el.style.opacity = '0'; el.style.transform = 'translateY(16px)'; }
    });
    if (scrollCueRef.current) scrollCueRef.current.style.opacity = '1';

    // ── reduced-motion bypass (no GSAP needed) ──────────────────────────
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Paint the opening frame without downloading the whole video: fetch
      // metadata only, then nudge currentTime onto the leading keyframe so the
      // browser decodes and shows exactly one frame. Uses the 720p source —
      // nothing is scrubbed here, so the all-intra master buys nothing.
      // Order matters: assigning preload before src makes the browser start
      // fetching whatever src currently holds (the 1440p master) only to throw
      // it away on the next line. Set the source first.
      video.src     = VIDEO_SRC_MOBILE;
      video.preload = 'metadata';
      video.addEventListener('loadedmetadata', () => { video.currentTime = 0.04; }, { once: true });
      video.load();

      if (pre) { pre.style.opacity = '0'; pre.style.pointerEvents = 'none'; }
      if (textRefs.current[0]) {
        textRefs.current[0].style.opacity   = '1';
        textRefs.current[0].style.transform = 'translateY(0)';
      }
      if (overlayRef.current) overlayRef.current.style.opacity = '1';
      return;
    }

    // ── dynamic import: GSAP runs in browser only ────────────────────────
    Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]).then(([gsapMod, stMod]) => {
      if (destroyed) return;   // component unmounted while import was in-flight

      const gsap          = gsapMod.default;
      const ScrollTrigger = stMod.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      // ── helper: dismiss preloader, show overlay, seed frame 0 ─────────
      const activateHero = () => {
        videoReady.current = true;
        if (pre && pre.style.display !== 'none') {
          gsap.to(pre, {
            opacity: 0, duration: 0.8, ease: 'power2.out',
            onComplete: () => { pre.style.display = 'none'; },
          });
        }
        if (overlayRef.current) {
          gsap.fromTo(overlayRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 1.4, ease: 'power2.out' }
          );
        }
        scheduleSeek(0);
        requestAnimationFrame(() => { ScrollTrigger.refresh(); });
      };

      // ── mobile: autoplay loop, no scrub ──────────────────────────────
      if (window.innerWidth < 768) {
        video.muted       = true;
        video.playsInline  = true;
        video.loop        = true;

        // Swap to the lighter 720p loop encode. Done here rather than in the
        // JSX so server and client render identical markup (no hydration
        // mismatch); preload="metadata" means almost nothing of the 1440p
        // file has been fetched by this point. The load() below (or the one in
        // the readyState branch) picks the new source up — never both.
        // Source before preload — see the reduced-motion branch above.
        const swappedSource = !video.currentSrc.endsWith(VIDEO_SRC_MOBILE);
        if (swappedSource) video.src = VIDEO_SRC_MOBILE;
        video.preload = 'auto';

        const onMobileReady = () => {
          if (pre) {
            pre.style.transition = 'opacity 0.6s ease';
            pre.style.opacity    = '0';
            setTimeout(() => { pre.style.display = 'none'; }, 650);
          }
          if (overlayRef.current) gsap.to(overlayRef.current, { opacity: 1, duration: 1 });
          if (textRefs.current[0]) {
            gsap.to(textRefs.current[0], { opacity: 1, y: 0, duration: 0.7, delay: 0.4 });
          }
          video.play().catch(() => {});
        };

        if (!swappedSource && video.readyState >= 2) {
          onMobileReady();
        } else {
          video.addEventListener('canplay', onMobileReady, { once: true });
          video.load();
        }
        return;
      }

      // ── Desktop: full scroll-scrub experience ────────────────────────
      video.muted       = true;
      video.playsInline  = true;
      video.preload      = 'auto';
      video.pause();
      video.currentTime  = 0;

      // Re-seek to latest target after seek completes
      const onSeeked = () => {
        isSeeking.current = false;
        const target = progressRef.current * video.duration;
        if (Math.abs(target - video.currentTime) >= FRAME_DURATION * 0.5) {
          isSeeking.current = true;
          video.currentTime = target;
        }
      };
      video.addEventListener('seeked', onSeeked);

      const onCanPlay = () => activateHero();

      // KEY FIX: check readyState AFTER attaching listeners.
      // Cached video (SPA nav) won't re-fire canplay — call directly.
      if (video.readyState >= 2) {
        activateHero();
      } else {
        video.addEventListener('canplay',    onCanPlay, { once: true });
        video.addEventListener('loadeddata', onCanPlay, { once: true });
        video.load();
      }

      // ── GSAP ScrollTrigger ──────────────────────────────────────────
      gsapCtx = gsap.context(() => {
        ScrollTrigger.create({
          trigger:       wrapper,
          start:         'top top',
          end:           `+=${SCRUB_SCROLL_PX}`,
          pin:           true,
          anticipatePin: 1,
          scrub:         true,
          onUpdate: (self) => {
            scheduleSeek(self.progress);
            updateText(self.progress);
            const cue = scrollCueRef.current;
            if (cue) {
              cue.style.opacity = String(Math.max(0, 1 - self.progress / 0.05));
            }
          },
        });
      }, wrapper);

      // Store cleanup so the return fn below can call it
      // (we assign into the outer let so the cleanup closure sees it)
      Object.assign(cleanup, {
        _gsapCtx:   gsapCtx,
        _onSeeked:  onSeeked,
        _onCanPlay: onCanPlay,
        _video:     video,
      });
    });

    // Cleanup object — populated async once the import resolves
    // eslint-disable-next-line prefer-const
    const cleanup: {
      _gsapCtx?:   { revert: () => void };
      _onSeeked?:  () => void;
      _onCanPlay?: () => void;
      _video?:     HTMLVideoElement;
    } = {};

    return () => {
      destroyed = true;
      cleanup._gsapCtx?.revert();
      if (cleanup._video && cleanup._onSeeked)  cleanup._video.removeEventListener('seeked',      cleanup._onSeeked);
      if (cleanup._video && cleanup._onCanPlay) cleanup._video.removeEventListener('canplay',     cleanup._onCanPlay);
      if (cleanup._video && cleanup._onCanPlay) cleanup._video.removeEventListener('loadeddata',  cleanup._onCanPlay);
    };
  }, [scheduleSeek, updateText]);

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div
      ref={wrapperRef}
      className="cinematic-hero-wrapper"
      style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#050a12' }}
    >
      {/* Video.
          preload is "none", not "auto": every branch of the effect below arms
          preload and calls load() itself once it knows which source it wants.
          Starting at "auto" made every visitor — mobile and reduced-motion
          included — eagerly pull the ~15 MB 1440p master in competition with
          LCP resources, and on mobile that download was then thrown away when
          the 720p source was selected. */}
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        muted
        playsInline
        preload="none"
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          transform: 'scale(1.03)',
          transformOrigin: 'center center',
        }}
      />

      {/* Vignette overlay */}
      <div
        ref={overlayRef}
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          opacity: 0,
          background: `
            radial-gradient(ellipse at 50% 50%, transparent 28%, rgba(5,10,18,0.52) 100%),
            linear-gradient(to bottom,
              rgba(5,10,18,0.28) 0%, transparent 22%,
              transparent 58%, rgba(5,10,18,0.80) 100%)
          `,
          pointerEvents: 'none',
        }}
      />

      {/* Preloader */}
      <div
        ref={preloaderRef}
        aria-label="Loading"
        style={{
          position: 'absolute', inset: 0,
          background: '#050a12',
          zIndex: 30,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '22px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '11px',
            background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(37,99,235,0.45)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span style={{
            fontSize: '10px', letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
            fontFamily: 'Inter, sans-serif',
          }}>
            New Delhi Electricals
          </span>
        </div>
        <div style={{
          width: '100px', height: '1px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '1px', overflow: 'hidden',
        }}>
          <div
            className="cinematic-preloader-bar"
            style={{ height: '100%', background: 'rgba(37,99,235,0.85)', width: '0%' }}
          />
        </div>
      </div>

      {/* Text stages */}
      <div
        aria-live="polite"
        style={{
          position: 'absolute', inset: 0,
          zIndex: 10,
          display: 'flex', alignItems: 'flex-end',
          padding: '0 6% 10%',
          pointerEvents: 'none',
        }}
      >
        {TEXT_STAGES.map((stage, i) => (
          <div
            key={i}
            ref={(el) => { textRefs.current[i] = el; }}
            style={{ position: 'absolute', opacity: 0, transform: 'translateY(16px)', willChange: 'opacity, transform' }}
          >
            <p style={{
              margin: 0,
              fontSize: 'clamp(1.8rem, 4.2vw, 3.5rem)',
              fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1,
              color: '#fff', fontFamily: 'Inter, -apple-system, sans-serif',
              textShadow: '0 2px 28px rgba(0,0,0,0.55)',
            }}>
              {stage.label}
            </p>
            <p style={{
              margin: '7px 0 0',
              fontSize: 'clamp(0.7rem, 1.3vw, 0.95rem)',
              letterSpacing: '0.16em', color: 'rgba(255,255,255,0.50)',
              textTransform: 'uppercase', fontFamily: 'Inter, -apple-system, sans-serif',
              fontWeight: 400,
            }}>
              {stage.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Brand bug */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', top: '5%', left: '6%',
          zIndex: 10, display: 'flex', alignItems: 'center',
          gap: '9px', opacity: 0.7,
        }}
      >
        <div style={{
          width: '30px', height: '30px', borderRadius: '8px',
          background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>New Delhi</span>
          <span style={{ fontSize: '8px', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', lineHeight: 1.3, fontFamily: 'Inter, sans-serif' }}>Electricals</span>
        </div>
      </div>

      {/* CTA buttons */}
      <div style={{
        position: 'absolute', bottom: '8%', right: '6%',
        zIndex: 10, display: 'flex', flexDirection: 'column',
        alignItems: 'flex-end', gap: '10px',
      }}>
        <button
          onClick={() => navigate('/categories')}
          style={{
            padding: '10px 24px', background: '#fff', color: '#0d1117',
            border: 'none', borderRadius: '8px', fontSize: '13px',
            fontWeight: 600, fontFamily: 'Inter, sans-serif',
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        >
          Shop Now →
        </button>
        <button
          onClick={() => {
            const msg = encodeURIComponent("Hi! I'm interested in your premium electrical products.");
            window.open(`https://wa.me/919654102758?text=${msg}`, '_blank');
          }}
          style={{
            padding: '9px 20px', background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '8px', fontSize: '12px', fontWeight: 500,
            fontFamily: 'Inter, sans-serif', cursor: 'pointer',
            backdropFilter: 'blur(8px)', transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.14)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
        >
          WhatsApp Us
        </button>
      </div>

      {/* Scroll to enter — z-index 40, above preloader, visible from first render */}
      <div
        ref={scrollCueRef}
        aria-label="Scroll to explore"
        style={{
          position: 'absolute', bottom: '7%', left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 40,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '10px',
          opacity: 1,
          pointerEvents: 'none',
          transition: 'opacity 0.4s ease',
        }}
      >
        <span style={{
          fontSize: '11px', fontWeight: 500,
          letterSpacing: '0.28em', color: '#ffffff',
          textTransform: 'uppercase', fontFamily: 'Inter, sans-serif',
          textShadow: '0 1px 12px rgba(0,0,0,0.6)',
        }}>
          Scroll to enter
        </span>
        <div className="cinematic-scroll-line" />
      </div>
    </div>
  );
}
