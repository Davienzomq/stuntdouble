/**
 * main.js — Fable 5 Landing Page
 * Features: nav scroll, reveal, counters, tilt, hero canvas particles
 * Loaded with defer; script must never throw even with partial DOM.
 */

(function () {
  'use strict';

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /** Detect reduced-motion preference once. */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Detect touch-only (no fine pointer / hover) devices. */
  const isTouchOnly = window.matchMedia('(hover: none)').matches;

  /** easeOutCubic timing function */
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /** rAF-throttled callback wrapper; calls fn at most once per frame. */
  function rafThrottle(fn) {
    let ticking = false;
    return function (...args) {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          fn.apply(this, args);
          ticking = false;
        });
      }
    };
  }

  /** Simple debounce. */
  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // ─── Nav scroll ─────────────────────────────────────────────────────────────

  function initNav() {
    const nav = document.querySelector('nav.nav');
    if (!nav) return;

    const THRESHOLD = 50;

    function updateNav() {
      if (window.scrollY > THRESHOLD) {
        nav.classList.add('nav--scrolled');
      } else {
        nav.classList.remove('nav--scrolled');
      }
    }

    // Set initial state
    updateNav();

    window.addEventListener('scroll', rafThrottle(updateNav), { passive: true });
  }

  // ─── Reveal (IntersectionObserver) ──────────────────────────────────────────

  function initReveal() {
    const elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal--visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    elements.forEach((el) => observer.observe(el));
  }

  // ─── Stat counters ───────────────────────────────────────────────────────────

  function initCounters() {
    const elements = document.querySelectorAll('.stat__number[data-target]');
    if (!elements.length) return;

    const DURATION = 1600; // ms

    function animateCounter(el, target) {
      if (prefersReducedMotion) {
        el.textContent = Number(target).toLocaleString('en-US');
        return;
      }

      const startTime = performance.now();

      function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / DURATION, 1);
        const value = Math.round(easeOutCubic(progress) * target);
        el.textContent = Number(value).toLocaleString('en-US');

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          // Ensure we land exactly on the target
          el.textContent = Number(target).toLocaleString('en-US');
        }
      }

      requestAnimationFrame(tick);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = parseFloat(entry.target.dataset.target);
            if (!isNaN(target)) {
              animateCounter(entry.target, target);
            }
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    elements.forEach((el) => observer.observe(el));
  }

  // ─── Tilt (3D card effect) ───────────────────────────────────────────────────

  function initTilt() {
    // Skip entirely on touch-only devices
    if (isTouchOnly) return;

    const elements = document.querySelectorAll('[data-tilt]');
    if (!elements.length) return;

    const MAX_DEG = 8;
    const SCALE = 1.02;
    const PERSPECTIVE = 800;

    const TILT_TRANSITION = 'transform 0.1s ease-out, box-shadow 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.4s cubic-bezier(0.22, 1, 0.36, 1)';

    elements.forEach((el) => {
      let resetTimer = null;
      el.style.willChange = 'transform';

      // Apply the fast inline transition only while hovering: setting it at
      // init would override the stylesheet .reveal transition (cards carry
      // both classes) and break the reveal animation.
      el.addEventListener('pointerenter', () => {
        if (resetTimer) {
          clearTimeout(resetTimer);
          resetTimer = null;
        }
        el.style.transition = TILT_TRANSITION;
      });

      el.addEventListener('pointermove', (e) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        // Normalize offset from center: -1..1
        const nx = (e.clientX - cx) / (rect.width / 2);
        const ny = (e.clientY - cy) / (rect.height / 2);

        // rotateY is driven by horizontal offset, rotateX by vertical (inverted)
        const rotateY = nx * MAX_DEG;
        const rotateX = -ny * MAX_DEG;

        el.style.transform =
          `perspective(${PERSPECTIVE}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${SCALE})`;
      }, { passive: true });

      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform 0.4s ease-out, box-shadow 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
        el.style.transform = `perspective(${PERSPECTIVE}px) rotateX(0deg) rotateY(0deg) scale(1)`;
        // After the reset settles, clear inline styles so stylesheet
        // transitions (.reveal, hover) apply again.
        resetTimer = setTimeout(() => {
          el.style.transition = '';
          el.style.transform = '';
          resetTimer = null;
        }, 420);
      });
    });
  }

  // ─── Canvas particle network ─────────────────────────────────────────────────

  function initCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const MAX_DPR = 2;
    const LINE_DIST = 110;        // px — connect particles within this distance
    const MAX_LINE_OPACITY = 0.18;
    const PARTICLE_COLORS = [
      [124, 92, 255],  // purple
      [0, 212, 255],   // cyan
    ];
    const BASE_COUNT = 70;
    const MAX_COUNT = 110;

    let dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    let W = 0;
    let H = 0;
    let particles = [];
    let mouse = { x: -9999, y: -9999 };
    let animFrameId = null;
    let paused = false;
    let canvasInView = true;

    // ── Particle factory ──
    function createParticle() {
      const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        r: 1 + Math.random() * 1.2,  // 1–2.2 px
        color,
      };
    }

    // ── Resize / reinit ──
    function resize() {
      const newDpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const rect = canvas.getBoundingClientRect();
      // Ignore no-op calls (e.g. ResizeObserver's initial fire right after
      // init) so particles aren't needlessly regenerated.
      if (rect.width === W && rect.height === H && newDpr === dpr) return;
      dpr = newDpr;
      W = rect.width;
      H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Scale particle count by area relative to 1280×720 baseline
      const area = W * H;
      const baseline = 1280 * 720;
      const count = Math.min(MAX_COUNT, Math.round(BASE_COUNT * Math.sqrt(area / baseline)));
      particles = Array.from({ length: count }, createParticle);

      // With reduced motion there is no animation loop, so redraw the
      // static frame after every resize (a canvas resize blanks the bitmap).
      if (prefersReducedMotion) {
        drawFrame();
      }
    }

    // ── Draw a single frame ──
    function drawFrame() {
      ctx.clearRect(0, 0, W, H);

      // Draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINE_DIST) {
            const opacity = MAX_LINE_OPACITY * (1 - dist / LINE_DIST);
            const [r, g, b] = particles[i].color;
            ctx.strokeStyle = `rgba(${r},${g},${b},${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        const [r, g, b] = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},0.75)`;
        ctx.fill();
      });
    }

    // ── Update positions ──
    const PARALLAX_STRENGTH = 0.018; // how much mouse affects each particle

    function update() {
      particles.forEach((p) => {
        // Drift
        p.x += p.vx;
        p.y += p.vy;

        // Mouse parallax — only when a real pointer position is known.
        // The {-9999,-9999} sentinel must not pull particles off-screen.
        if (!isTouchOnly && mouse.x !== -9999) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          p.x += dx * PARALLAX_STRENGTH * 0.04;
          p.y += dy * PARALLAX_STRENGTH * 0.04;
        }

        // Wrap edges
        if (p.x < -p.r) p.x = W + p.r;
        else if (p.x > W + p.r) p.x = -p.r;
        if (p.y < -p.r) p.y = H + p.r;
        else if (p.y > H + p.r) p.y = -p.r;
      });
    }

    // ── Animation loop ──
    function loop() {
      if (paused) return;
      update();
      drawFrame();
      animFrameId = requestAnimationFrame(loop);
    }

    // ── Pause/resume on document visibility ──
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        paused = true;
        if (animFrameId) {
          cancelAnimationFrame(animFrameId);
          animFrameId = null;
        }
      } else if (!prefersReducedMotion && canvasInView && animFrameId === null) {
        paused = false;
        loop();
      }
    });

    // ── Pause/resume when canvas leaves/enters viewport ──
    const canvasVisObserver = new IntersectionObserver(
      (entries) => {
        canvasInView = entries[0].isIntersecting;
        if (!canvasInView) {
          paused = true;
          if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
          }
        } else if (!prefersReducedMotion && !document.hidden && animFrameId === null) {
          paused = false;
          loop();
        }
      },
      { threshold: 0 }
    );
    canvasVisObserver.observe(canvas);

    // ── Mouse tracking (skip on touch-only) ──
    // The canvas has pointer-events: none in CSS, so events never fire on
    // the canvas itself — listen on its hero container instead.
    if (!isTouchOnly) {
      const heroEl = canvas.parentElement || document.body;
      heroEl.addEventListener('pointermove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      }, { passive: true });

      heroEl.addEventListener('pointerleave', () => {
        mouse.x = -9999;
        mouse.y = -9999;
      });
    }

    // ── Resize handling ──
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(debounce(resize, 150)).observe(canvas);
    } else {
      window.addEventListener('resize', debounce(resize, 150), { passive: true });
    }

    // ── Init ──
    resize();

    if (prefersReducedMotion) {
      // Static frame already drawn in resize(); do nothing more.
      return;
    }

    loop();
  }

  // ─── Init all features independently ────────────────────────────────────────

  function init() {
    const features = [
      ['nav',      initNav],
      ['reveal',   initReveal],
      ['counters', initCounters],
      ['tilt',     initTilt],
      ['canvas',   initCanvas],
    ];

    features.forEach(([name, fn]) => {
      try {
        fn();
      } catch (err) {
        // Silently swallow — one broken feature must not cascade
        console.warn(`[main.js] Feature "${name}" failed to init:`, err);
      }
    });
  }

  // Script is loaded with defer, so DOM is ready.
  init();

})();
