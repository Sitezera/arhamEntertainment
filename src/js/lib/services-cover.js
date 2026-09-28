import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './smooth-scroll.js';

/**
 * Full-screen cover panels — each service slides up to take the whole screen,
 * covering the one before it.
 *
 * Adapted from the featured-work section of RaDins-Design-Jomor-Design-Clone,
 * with two changes:
 *
 *  - The original stacks panels at `top: 100%` and tweens `top` to 0, which
 *    reflows a full-viewport element on every scrub frame. These sit at
 *    inset 0 and move on `yPercent`, so the slide stays on the compositor.
 *  - One timeline drives the whole run off a single pin. The original also
 *    used one pin, which is exactly why it feels light despite covering five
 *    screens — worth keeping.
 *
 * The outgoing panel's media scales down slightly as it is covered, so the
 * panels read as stacked in depth rather than as flat cards sliding.
 */
export function initServicesCover() {
  const section = document.querySelector('.cover');
  if (!section) return null;

  const panels = gsap.utils.toArray('.cover__panel', section);
  if (panels.length < 2) return null;

  // CSS already stacks them for the no-JS / reduced-motion case.
  if (prefersReducedMotion()) return null;

  const incoming = panels.slice(1);

  // `y: 0` alongside yPercent — GSAP parses the CSS translateY(100%) out of the
  // computed matrix as pixels, and would otherwise leave that offset behind.
  gsap.set(incoming, { yPercent: 100, y: 0 });
  gsap.set(panels[0], { yPercent: 0, y: 0 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      // One screen-height of scroll per transition.
      end: () => `+=${(panels.length - 1) * window.innerHeight}`,
      scrub: 1,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  });

  incoming.forEach((panel, i) => {
    const position = i; // one time unit per transition
    const media = panel.querySelector('.cover__media');
    const outgoingMedia = panels[i].querySelector('.cover__media');

    tl.to(panel, { yPercent: 0, y: 0, ease: 'none' }, position);

    // Incoming media settles out of an overscan as its panel arrives…
    if (media) {
      tl.fromTo(media, { scale: 1.18 }, { scale: 1, ease: 'none' }, position);
    }

    // …while the panel being covered recedes.
    if (outgoingMedia) {
      tl.to(outgoingMedia, { scale: 0.92, ease: 'none' }, position);
    }
  });

  return {
    destroy() {
      tl.scrollTrigger?.kill();
      tl.kill();
      gsap.set(panels, { clearProps: 'transform' });
    }
  };
}
