// The stylesheet is loaded as a render-blocking <link> in each page's <head>,
// not imported here. Importing it would make CSS arrive with the JS bundle,
// which in dev means the first paint is unstyled — the wordmark renders at its
// intrinsic SVG size in the UA's visited-link purple before any rules land.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { initSmoothScroll, scrollToTop } from './lib/smooth-scroll.js';
import { initCursor } from './lib/cursor.js';
import { initNav } from './lib/nav.js';
import { initButtons } from './lib/buttons.js';
import { initReveals } from './lib/reveal.js';
import { initMarquees } from './lib/marquee.js';
import { initAccordions } from './lib/accordion.js';
import {
  initStatements,
  initParallax,
  initCounters,
  initCtaHeading,
  initQuotes
} from './lib/effects.js';

gsap.registerPlugin(ScrollTrigger);

// We animate our own page transitions; let the browser restore nothing.
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

function boot() {
  initSmoothScroll();
  initCursor();
  initNav();
  initButtons();

  // Scroll-driven content
  initReveals();
  initStatements();
  initParallax();
  initCounters();
  initQuotes();
  initCtaHeading();
  initAccordions();

  initPage(document.body.dataset.page);
  initFooterYear();

  // Fonts change text metrics, which changes every trigger's start/end, and
  // the marquee sizes its loop from a measured group width — measure that with
  // the fallback font and the ticker wraps with a visible seam. So: wait for
  // the webfonts, then build the marquees and re-measure every trigger.
  const fontsReady = document.fonts?.ready ?? Promise.resolve();
  fontsReady
    .catch(() => {})
    .then(() => {
      initMarquees();
      ScrollTrigger.refresh();
    });

  window.addEventListener('arham:scrolltop', () => scrollToTop(false));
}

async function initPage(page) {
  switch (page) {
    case 'home': {
      const [
        { runPreloader },
        { playHeroIntro },
        { initServicesCover },
        { initZoomReveal }
      ] = await Promise.all([
        import('./lib/preloader.js'),
        import('./lib/hero.js'),
        import('./lib/services-cover.js'),
        import('./lib/zoom-reveal.js')
      ]);

      initZoomReveal();
      initServicesCover();

      // Hero waits for the preloader to hand off mid-expansion, so the
      // headline rises into an image that is still moving.
      await runPreloader();
      playHeroIntro();
      ScrollTrigger.refresh();
      break;
    }

    case 'services': {
      const { initArcCarousel } = await import('./lib/arc-carousel.js');
      initArcCarousel();
      break;
    }

    case 'work': {
      const { initCasePreview } = await import('./lib/case-preview.js');
      initCasePreview();
      break;
    }

    case 'contact': {
      const { initContactForm } = await import('./lib/contact-form.js');
      initContactForm();
      break;
    }

    default:
      break;
  }
}

function initFooterYear() {
  const el = document.querySelector('[data-year]');
  if (el) el.textContent = String(new Date().getFullYear());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
