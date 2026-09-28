import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './smooth-scroll.js';

/**
 * Scroll reveals, declared in markup: `data-reveal="up|fade|mask|stagger|scale"`.
 *
 * The hidden state is applied here, in JS — never in CSS. If the bundle fails
 * to load, every element stays visible instead of leaving a blank page.
 *
 * Optional: `data-reveal-delay="0.2"`, `data-reveal-stagger="0.08"`.
 */
export function initReveals(root = document) {
  if (prefersReducedMotion()) return;

  const elements = root.querySelectorAll('[data-reveal]');

  elements.forEach((el) => {
    const type = el.dataset.reveal || 'up';
    const delay = parseFloat(el.dataset.revealDelay) || 0;
    const stagger = parseFloat(el.dataset.revealStagger) || 0.085;

    const trigger = {
      trigger: el,
      start: 'top 88%',
      once: true
    };

    if (type === 'stagger') {
      const children = el.children;
      if (!children.length) return;

      gsap.set(children, { y: 34, opacity: 0 });
      gsap.to(children, {
        y: 0,
        opacity: 1,
        duration: 0.9,
        delay,
        stagger,
        ease: 'power3.out',
        scrollTrigger: trigger
      });
      return;
    }

    if (type === 'mask') {
      gsap.set(el, { clipPath: 'inset(0% 0% 100% 0%)' });
      gsap.to(el, {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.15,
        delay,
        ease: 'power4.inOut',
        scrollTrigger: trigger
      });
      return;
    }

    if (type === 'scale') {
      gsap.set(el, { scale: 1.12, opacity: 0 });
      gsap.to(el, {
        scale: 1,
        opacity: 1,
        duration: 1.2,
        delay,
        ease: 'power3.out',
        scrollTrigger: trigger
      });
      return;
    }

    if (type === 'fade') {
      gsap.set(el, { opacity: 0 });
      gsap.to(el, {
        opacity: 1,
        duration: 1,
        delay,
        ease: 'power2.out',
        scrollTrigger: trigger
      });
      return;
    }

    // Default: rise and fade in
    gsap.set(el, { y: 44, opacity: 0 });
    gsap.to(el, {
      y: 0,
      opacity: 1,
      duration: 1,
      delay,
      ease: 'power3.out',
      scrollTrigger: trigger
    });
  });

  // Line-by-line reveal for masked headings on inner pages
  root.querySelectorAll('[data-reveal-lines]').forEach((el) => {
    const lines = el.querySelectorAll('.page-hero__line > span, .hero__line > span');
    if (!lines.length) return;

    // `y: 0` clears the pixel offset GSAP parses out of the CSS
    // translateY(115%) pre-animation state — see playHeroIntro() for why.
    gsap.set(lines, { yPercent: 115, y: 0 });
    gsap.to(lines, {
      yPercent: 0,
      y: 0,
      duration: 1.1,
      stagger: 0.08,
      ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true }
    });
  });
}

/** Re-measure after fonts land or content height changes. */
export function refreshScrollTriggers() {
  ScrollTrigger.refresh();
}
