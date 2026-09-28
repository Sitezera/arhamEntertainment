import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Curved arc carousel — cards ride along a virtual circle whose apex sits at
 * the top of the section, rotating with the tangent as they pass through.
 *
 * Adapted from ui-components/scroll-trigger/curved-arc-carousel. Changed from
 * the original: it reads gsap/ScrollTrigger from the module graph instead of
 * window globals, and the per-card tilt is derived from the index rather than
 * Math.random(), so the arc looks the same on every load.
 *
 * The geometry is recomputed from the measured card width, which is what
 * guarantees cards never overlap at any viewport size.
 */
export function initArcCarousel() {
  const DOM = {
    section: document.getElementById('arcCarouselSection'),
    pinWrapper: document.getElementById('arcCarouselPinWrapper'),
    system: document.getElementById('arcSystem'),
    svg: document.getElementById('arcSvg'),
    pathBg: document.getElementById('arcPathBg'),
    pathTicks: document.getElementById('arcPathTicks'),
    cardsContainer: document.getElementById('arcCardsContainer'),
    cards: gsap.utils.toArray('.arc-card')
  };

  if (!DOM.section || DOM.cards.length === 0) return null;

  const SETTINGS = {
    cardGapDesktop: 220,
    cardGapMobile: 100,
    baseRadiusDesktop: 1800,
    baseRadiusMobile: 600
  };

  const config = {
    radius: 800,
    angleStepRad: 0.3,
    totalCards: DOM.cards.length
  };

  let scrollTriggerInstance = null;

  /** Recompute radius and angular spacing for the current viewport. */
  function calculateGeometry() {
    const w = window.innerWidth;

    const radiusProgress = clamp01((w - 400) / (1920 - 400));
    config.radius =
      SETTINGS.baseRadiusMobile +
      (SETTINGS.baseRadiusDesktop - SETTINGS.baseRadiusMobile) * radiusProgress;

    // Space cards by their real measured width so they physically separate
    const cardWidth = DOM.cards[0].offsetWidth || (w < 768 ? 260 : 360);
    const gapProgress = clamp01((w - 400) / (1440 - 400));
    const gap =
      SETTINGS.cardGapMobile +
      (SETTINGS.cardGapDesktop - SETTINGS.cardGapMobile) * gapProgress;

    // arc length = radius × angle  →  angle = arc length / radius
    config.angleStepRad = (cardWidth + gap) / config.radius;

    // Match the SVG circle to the same geometry
    const cx = (DOM.svg.clientWidth || w) / 2;
    const cy = config.radius;

    [DOM.pathBg, DOM.pathTicks].forEach((circle) => {
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', config.radius);
    });

    DOM.svg.style.transformOrigin = `${cx}px ${cy}px`;
  }

  /** Place one card at `angleRad` along the circle (0 = apex). */
  function positionCard(card, angleRad, localProgress) {
    const x = config.radius * Math.sin(angleRad);
    const y = config.radius - config.radius * Math.cos(angleRad);

    // The tangent rotation equals the angle itself
    const rotationDeg = angleRad * (180 / Math.PI);
    const tilt = parseFloat(card.dataset.tilt || 0);
    const finalRotation = rotationDeg + tilt * (1 - localProgress);

    // Fade cards out before they reach the screen edge and get clipped
    const absDeg = Math.abs(rotationDeg);
    let opacity = 1;
    if (absDeg > 55) opacity = 0;
    else if (absDeg > 35) opacity = 1 - (absDeg - 35) / 20;

    gsap.set(card, {
      x: x - card.offsetWidth / 2,
      y,
      rotation: finalRotation,
      opacity
    });
  }

  function renderAtProgress(progress) {
    const maxSweep = (config.totalCards - 1) * config.angleStepRad;
    const centerAngle = progress * maxSweep;

    DOM.cards.forEach((card, i) => {
      const angleRad = i * config.angleStepRad - centerAngle;
      const localProgress = Math.max(
        0,
        1 - Math.abs(angleRad) / config.angleStepRad
      );
      positionCard(card, angleRad, localProgress);
    });

    DOM.svg.style.transform = `rotate(${-centerAngle * (180 / Math.PI)}deg)`;
  }

  function build() {
    // Deterministic per-card tilt: alternating, decaying with index
    DOM.cards.forEach((card, i) => {
      card.dataset.tilt = (((i * 2.9) % 7) - 3.5).toFixed(2);
    });

    calculateGeometry();
    scrollTriggerInstance?.kill();
    renderAtProgress(0);

    let snapTimeout;
    let lastProgress = 0;
    let macroDirection = 1;

    scrollTriggerInstance = ScrollTrigger.create({
      trigger: DOM.pinWrapper,
      start: 'top top',
      end: () => (window.innerWidth < 1024 ? '+=1500' : '+=3000'),
      pin: DOM.section,
      pinSpacing: true,
      scrub: window.innerWidth < 1024 ? 0.3 : 0.5,
      onUpdate: (self) => {
        // Ignore micro-jitter when deciding which way the user is going
        if (Math.abs(self.progress - lastProgress) > 0.002) {
          macroDirection = self.progress > lastProgress ? 1 : -1;
        }
        lastProgress = self.progress;

        renderAtProgress(self.progress);

        // Magnetic snap, fired once momentum settles
        clearTimeout(snapTimeout);
        snapTimeout = setTimeout(() => {
          if (self.progress <= 0 || self.progress >= 1) return;

          const step = 1 / (config.totalCards - 1);
          const position = self.progress / step;
          const decimal = position % 1;

          const targetIndex = gsap.utils.clamp(
            0,
            config.totalCards - 1,
            macroDirection === 1
              ? decimal > 0.15
                ? Math.ceil(position)
                : Math.floor(position)
              : decimal < 0.85
                ? Math.floor(position)
                : Math.ceil(position)
          );

          const targetProgress = targetIndex * step;
          if (Math.abs(self.progress - targetProgress) < 0.005) return;

          const targetScroll =
            self.start + targetProgress * (self.end - self.start);

          // Go through Lenis when it exists, otherwise we'd be setting
          // scrollTop underneath its own interpolation and fight it.
          if (window.lenis) {
            window.lenis.scrollTo(targetScroll, {
              duration: 1.2,
              easing: (t) => 1 - Math.pow(1 - t, 4)
            });
          } else {
            const proxy = { y: window.scrollY };
            gsap.to(proxy, {
              y: targetScroll,
              duration: 0.8,
              ease: 'power3.out',
              onUpdate: () => window.scrollTo(0, proxy.y)
            });
          }
        }, 150);
      }
    });
  }

  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 200);
    };

    window.addEventListener('resize', onResize);
    build();

    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(resizeTimer);
      scrollTriggerInstance?.kill();
    };
  });

  mm.add('(prefers-reduced-motion: reduce)', () => {
    // Static, readable fallback: a plain vertical list of the same cards
    gsap.set(DOM.svg, { display: 'none' });
    gsap.set(DOM.cardsContainer, {
      position: 'relative',
      left: 0,
      width: '100%',
      height: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '3rem',
      padding: '3rem 0'
    });
    gsap.set(DOM.cards, {
      position: 'relative',
      opacity: 1,
      width: '90%',
      maxWidth: '640px',
      clearProps: 'transform'
    });
    if (DOM.system) {
      gsap.set(DOM.system, { position: 'relative', height: 'auto', top: 0 });
    }
    gsap.set(DOM.section, { height: 'auto', minHeight: 'auto' });
  });

  return mm;
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}
