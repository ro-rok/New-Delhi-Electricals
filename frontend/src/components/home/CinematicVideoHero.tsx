import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

// ─── constants ────────────────────────────────────────────────────────────────
const VIDEO_SRC       = '/ndehero_1440p_seek.mp4';
const VIDEO_FPS       = 24;
const FRAME_DURATION  = 1 / VIDEO_FPS;
const VIDEO_START_TIME = 2;
const SCRUB_SCROLL_PX = 2800;

const TEXT_STAGES = [
  { enter: 0.00, exit: 0.24, label: 'NEW DELHI ELECTRICALS', sub: 'Authorized Partner · Since 1998' },
  { enter: 0.28, exit: 0.54, label: 'Premium Electrical',    sub: '3000+ products · 27 years of trust' },
  { enter: 0.58, exit: 0.84, label: 'Built for India',       sub: 'Switches · MCBs · Wires · Sockets' },
  { enter: 0.88, exit: 1.00, label: 'Explore the Range',     sub: 'Scroll down to shop ↓' },
] as const;

export default function CinematicVideoHero() {
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const overlayRef   = useRef<HTMLDivElement>(null);
  const preloaderRef = useRef<HTMLDivElement>(null);
  const scrollCueRef = useRef<HTMLDivElement>(null);
  const textRefs     = useRef<(HTMLDivElement | null)[]>([]);
  const navigate     = useNavigate();

  // Seek-gate refs — reset on every mount inside the effect
  const progressRef = useRef(0);
  const isSeeking   = useRef(false);
  const rafPending  = useRef(false);
  const videoReady  = useRef(false);

  const getVideoStartTime = useCallback((video: HTMLVideoElement) => {
    if (!Number.isFinite(video.duration)) return VIDEO_START_TIME;
    return Math.min(VIDEO_START_TIME, Math.max(0, video.duration - FRAME_DURATION));
  }, []);

  const getTargetTime = useCallback((video: HTMLVideoElement, progress: number) => {
    const startTime = getVideoStartTime(video);
    return startTime + progress * Math.max(0, video.duration - startTime);
  }, [getVideoStartTime]);

  // ── seek gate ────────────────────────────────────────────────────────────
  const flushSeek = useCallback(() => {
    rafPending.current = false;
    const video = videoRef.current;
    if (!video || !videoReady.current) return;
    const target = getTargetTime(video, progressRef.current);
    if (Math.abs(target - video.currentTime) < FRAME_DURATION * 0.5) return;
    if (isSeeking.current) return;
    isSeeking.current = true;
    video.currentTime = target;
  }, [getTargetTime]);

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

  // ── helper: dismiss preloader and activate hero ──────────────────────────
  const activateHero = useCallback(() => {
    videoReady.current = true;

    const pre = preloaderRef.current;
    if (pre && pre.style.display !== 'none') {
      gsap.to(pre, {
        opacity: 0, duration: 0.8, ease: 'power2.out',
        onComplete: () => {
          pre.style.display = 'none';
        },
      });
    }

    if (overlayRef.current) {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1.4, ease: 'power2.out' }
      );
    }

    // Start on a bright, intentional frame instead of the dark opening frame.
    scheduleSeek(0);

    // Refresh after layout settles so the pin calculates correctly
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
  }, [scheduleSeek]);

  // ── main effect — runs fresh on every mount including SPA navigation ─────
  useEffect(() => {
    const video   = videoRef.current;
    const wrapper = wrapperRef.current;
    if (!video || !wrapper) return;

    // Reset all gate refs for this mount
    progressRef.current = 0;
    isSeeking.current   = false;
    rafPending.current  = false;
    videoReady.current  = false;

    // Reset preloader DOM state in case it was hidden by a previous mount
    const pre = preloaderRef.current;
    if (pre) {
      pre.style.display  = 'flex';
      pre.style.opacity  = '1';
    }
    if (overlayRef.current) overlayRef.current.style.opacity = '0';
    // Reset text
    textRefs.current.forEach(el => {
      if (el) { el.style.opacity = '0'; el.style.transform = 'translateY(16px)'; }
    });
    // Reset scroll cue
    if (scrollCueRef.current) scrollCueRef.current.style.opacity = '1';

    // ── reduced-motion bypass ────────────────────────────────────────────
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (pre) { pre.style.opacity = '0'; pre.style.pointerEvents = 'none'; }
      if (textRefs.current[0]) {
        textRefs.current[0].style.opacity   = '1';
        textRefs.current[0].style.transform = 'translateY(0)';
      }
      if (overlayRef.current) overlayRef.current.style.opacity = '1';
      return;
    }

    // ── mobile: autoplay loop, no scrub ─────────────────────────────────
    if (window.innerWidth < 768) {
      video.muted       = true;
      video.playsInline  = true;
      video.loop        = true;

      const onMobileReady = () => {
        video.currentTime = getVideoStartTime(video);
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

      // Fire immediately if already buffered (cached from prior visit)
      if (video.readyState >= 2) {
        onMobileReady();
      } else {
        video.addEventListener('canplay', onMobileReady, { once: true });
        video.load();
      }

      return () => {
        video.removeEventListener('canplay', onMobileReady);
      };
    }

    // ── Desktop: full scroll-scrub experience ───────────────────────────
    video.muted       = true;
    video.playsInline  = true;
    video.preload      = 'auto';

    // Reset to the 2-second opening frame so the dark first frame is never shown.
    video.pause();
    video.currentTime = VIDEO_START_TIME;

    const onSeeked = () => {
      isSeeking.current = false;
      const target = getTargetTime(video, progressRef.current);
      if (Math.abs(target - video.currentTime) >= FRAME_DURATION * 0.5) {
        isSeeking.current = true;
        video.currentTime = target;
      }
    };
    video.addEventListener('seeked', onSeeked);

    // KEY FIX: check readyState synchronously AFTER attaching the listener.
    // If the browser already has the video buffered (cache hit on SPA nav),
    // canplay/loadeddata will never fire again — so we call activateHero directly.
    const onCanPlay = () => activateHero();

    if (video.readyState >= 2) {
      // Video already buffered — no event will fire, activate immediately
      activateHero();
    } else {
      video.addEventListener('canplay',    onCanPlay, { once: true });
      video.addEventListener('loadeddata', onCanPlay, { once: true });
      video.load();
    }

    // ── GSAP ScrollTrigger ───────────────────────────────────────────────
    const ctx = gsap.context(() => {
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

    return () => {
      ctx.revert();
      video.removeEventListener('seeked',      onSeeked);
      video.removeEventListener('canplay',     onCanPlay);
      video.removeEventListener('loadeddata',  onCanPlay);
    };
  }, [activateHero, getTargetTime, getVideoStartTime, scheduleSeek, updateText]);

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div
      ref={wrapperRef}
      className="cinematic-hero-wrapper"
      style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#050a12' }}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        muted
        playsInline
        preload="auto"
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

      {/* Scroll to enter — z-index 40 so it's above the preloader from first render */}
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
