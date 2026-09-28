import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis = null;

/**
 * Lenis drives the scroll; ScrollTrigger reads from it.
 * Single source of truth — never let both run their own RAF loop, or pinned
 * sections desync from the content by a frame and visibly judder.
 */
export function initSmoothScroll() {
  if (prefersReducedMotion()) return null;

  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.6,
    autoRaf: false // GSAP's ticker below is the only RAF loop
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  // The arc carousel's snap logic looks for this to avoid fighting Lenis
  window.lenis = lenis;

  return lenis;
}

function tick(time) {
  if (lenis) lenis.raf(time * 1000);
}

export function getLenis() {
  return lenis;
}

/** Freeze the page — used by the preloader and the mobile menu. */
export function lockScroll() {
  document.body.classList.add('is-locked');
  if (lenis) lenis.stop();
}

export function unlockScroll() {
  document.body.classList.remove('is-locked');
  if (lenis) lenis.start();
}

export function scrollToTop(immediate = true) {
  if (lenis) lenis.scrollTo(0, { immediate });
  else window.scrollTo(0, 0);
}
