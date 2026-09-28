import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './smooth-scroll.js';

/**
 * Hero entrance + ongoing motion.
 *
 * Three layers of movement, which is what stops it reading as a static block
 * of type:
 *   1. Entrance — masked lines rise, the inline chip wipes open, the floating
 *      cards clip in from below on a stagger.
 *   2. Scroll — the backdrop and each card drift at their own rate, so the
 *      hero comes apart in depth as you leave it.
 *   3. Pointer — cards lean toward the cursor by `data-depth`, which gives the
 *      cluster parallax without any scroll input at all.
 *
 * Called after the preloader hands off, so the headline rises into an image
 * that is still expanding.
 */
export function playHeroIntro() {
  const hero = document.querySelector('.hero');
  if (!hero) return null;

  const lines = hero.querySelectorAll('.hero__line > span');
  const floats = gsap.utils.toArray('.hero__float', hero);
  const fadeIn = hero.querySelectorAll('[data-hero-fade]');
  const media = hero.querySelector('.hero__media');

  if (prefersReducedMotion()) {
    // The CSS pre-animation states are gated on no-preference, so there is
    // nothing to undo — everything is already visible.
    return null;
  }

  const tl = gsap.timeline();

  if (media) {
    tl.fromTo(media, { scale: 1.16 }, { scale: 1, duration: 1.8, ease: 'power3.out' }, 0);
  }

  // `y: 0` in both vars — see the note in base.css about GSAP's matrix parse.
  tl.fromTo(
    lines,
    { yPercent: 115, y: 0 },
    { yPercent: 0, y: 0, duration: 1.15, stagger: 0.09, ease: 'power4.out' },
    0.1
  );

  if (floats.length) {
    tl.fromTo(
      floats,
      { opacity: 0, yPercent: 14, scale: 1.1, clipPath: 'inset(100% 0% 0% 0%)' },
      {
        opacity: 1,
        yPercent: 0,
        scale: 1,
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.3,
        stagger: 0.12,
        ease: 'power4.out'
      },
      0.35
    );
  }

  tl.fromTo(
    fadeIn,
    { y: 26, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.9, stagger: 0.09, ease: 'power3.out' },
    0.6
  );

  // Scroll drift is wired up only once the entrance has landed. A scrubbed
  // tween captures its start value when it first renders, so creating these
  // mid-entrance would snapshot a half-animated yPercent and leave every card
  // permanently offset at scroll position zero.
  tl.eventCallback('onComplete', () => {
    initScrollDrift(hero, media, floats);
    ScrollTrigger.refresh();
  });

  // Pointer drift uses x/y, which compose with yPercent rather than fighting
  // it, so it is safe to start immediately.
  initPointerDrift(floats);

  return tl;
}

/** Each layer leaves the viewport at a different rate. */
function initScrollDrift(hero, media, floats) {
  if (media) {
    gsap.to(media, {
      yPercent: 16,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  floats.forEach((float, i) => {
    gsap.to(float, {
      yPercent: -28 - i * 16,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
    });
  });
}

/**
 * Cards lean toward the cursor, each by its own `data-depth`.
 *
 * quickTo keeps this off the React-style render path entirely: one interpolator
 * per axis per card, fed raw pointer coordinates. Skipped on touch, where
 * there is no hover to drive it.
 */
function initPointerDrift(floats) {
  if (!floats.length) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const setters = floats.map((float) => ({
    depth: parseFloat(float.dataset.depth) || 0.08,
    x: gsap.quickTo(float, 'x', { duration: 1.1, ease: 'power3' }),
    y: gsap.quickTo(float, 'y', { duration: 1.1, ease: 'power3' })
  }));

  window.addEventListener(
    'pointermove',
    (e) => {
      const dx = e.clientX - window.innerWidth / 2;
      const dy = e.clientY - window.innerHeight / 2;

      setters.forEach(({ depth, x, y }) => {
        x(dx * depth);
        y(dy * depth);
      });
    },
    { passive: true }
  );
}
