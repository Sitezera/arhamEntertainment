import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './smooth-scroll.js';

/**
 * Scroll-driven zoom reveal — a small rounded card pins in the middle of the
 * screen and opens out to fill the viewport, so it reads as travelling *into*
 * the image rather than the image merely growing.
 *
 * The idea is Zentry's `About` section (src/components/About.jsx), rebuilt for
 * vanilla with two changes:
 *
 *  - Zentry tweens `width`/`height` on the card. That reflows the element on
 *    every scrub frame. Here the frame is always viewport-sized and only its
 *    `clip-path` inset opens — compositor work, no layout.
 *  - The media inside counter-scales from 1.35 → 1 as the frame opens. Without
 *    it the picture is simply revealed; with it the picture is also settling
 *    back, which is what sells the "moving inside" read.
 *
 * `clip-path` is written from a progress value rather than tweened as a string
 * so the start inset can be measured per breakpoint (a portrait card on
 * desktop, a near-square one on phones).
 */
export function initZoomReveal() {
  const section = document.querySelector('.zoom-reveal');
  if (!section) return null;

  const frame = section.querySelector('.zoom-reveal__frame');
  const media = section.querySelector('.zoom-reveal__media');
  if (!frame || !media) return null;

  // Fully open, no pin — the section is just a full-bleed video.
  if (prefersReducedMotion()) {
    frame.style.clipPath = 'inset(0% 0% 0% 0% round 0px)';
    return null;
  }

  // Closed-state inset, as a percentage of the viewport on each axis.
  const startInset = () =>
    window.innerWidth < 768
      ? { x: 14, y: 21, radius: 22 }
      : { x: 35, y: 18, radius: 28 };

  let inset = startInset();

  const render = (progress) => {
    // ease the opening slightly so it accelerates into the reveal
    const p = gsap.parseEase('power2.inOut')(progress);

    const x = gsap.utils.interpolate(inset.x, 0, p);
    const y = gsap.utils.interpolate(inset.y, 0, p);
    const r = gsap.utils.interpolate(inset.radius, 0, p);

    frame.style.clipPath = `inset(${y}% ${x}% ${y}% ${x}% round ${r}px)`;
    media.style.transform = `scale(${gsap.utils.interpolate(1.35, 1, p)})`;
  };

  render(0);

  const trigger = ScrollTrigger.create({
    trigger: section,
    // `top top`, not Zentry's `center center`. Starting at centre means half
    // the section scrolls past with the card sitting inert before the pin
    // engages, which reads as a dead beat between the hero and the reveal.
    // Pinning the moment the section fills the viewport hands straight off
    // from the hero, so the opening tracks the scroll continuously.
    start: 'top top',
    // Viewport-relative, not a fixed pixel distance. At a flat `+=900` the
    // gesture takes 1.4 screens of scrolling on a short phone but only 0.8 on
    // a desktop — one screen-height makes it feel the same everywhere.
    // invalidateOnRefresh re-runs this on resize and orientation change.
    end: () => `+=${window.innerHeight}`,
    scrub: 0.5,
    pin: true,
    pinSpacing: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => render(self.progress),
    onRefresh: (self) => {
      inset = startInset();
      render(self.progress);
    }
  });

  return {
    destroy() {
      trigger.kill();
      frame.style.clipPath = '';
      media.style.transform = '';
    }
  };
}
