import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { splitWords, splitChars } from './split-text.js';
import { prefersReducedMotion } from './smooth-scroll.js';

/**
 * Statement blocks — words brighten one by one as the block crosses the
 * viewport. The scrub ties the reveal to the scrollbar, so it reads as
 * something the visitor is doing rather than something playing at them.
 *
 * `data-accent="culture move"` tints those words with the accent colour.
 */
export function initStatements(root = document) {
  root.querySelectorAll('.statement').forEach((el) => {
    const accents = (el.dataset.accent || '').split(/\s+/).filter(Boolean);
    const words = splitWords(el, accents);
    if (!words.length) return;

    if (prefersReducedMotion()) {
      gsap.set(words, { opacity: 1 });
      return;
    }

    gsap.to(words, {
      opacity: 1,
      ease: 'none',
      stagger: 0.12,
      scrollTrigger: {
        trigger: el,
        start: 'top 80%',
        end: 'bottom 58%',
        scrub: 0.6
      }
    });
  });
}

/**
 * Parallax for media inside an overflow-hidden frame.
 * `data-parallax="18"` = travel 18% of the element's height across the scroll.
 * The element must be overscanned (see `.work-card__fill`) or the edge shows.
 */
export function initParallax(root = document) {
  if (prefersReducedMotion()) return;

  root.querySelectorAll('[data-parallax]').forEach((el) => {
    const amount = parseFloat(el.dataset.parallax) || 14;

    gsap.fromTo(
      el,
      { yPercent: -amount / 2 },
      {
        yPercent: amount / 2,
        ease: 'none',
        scrollTrigger: {
          trigger: el.parentElement || el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      }
    );
  });
}

/**
 * Count-up numerals. `data-count="240"`, optional `data-count-decimals="1"`.
 * Runs once, when the stat scrolls into view.
 */
export function initCounters(root = document) {
  root.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count);
    if (Number.isNaN(target)) return;

    const decimals = parseInt(el.dataset.countDecimals, 10) || 0;
    const format = (n) =>
      n.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });

    if (prefersReducedMotion()) {
      el.textContent = format(target);
      return;
    }

    el.textContent = format(0);
    const counter = { value: 0 };

    gsap.to(counter, {
      value: target,
      duration: 2,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = format(counter.value);
      },
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });
}

/**
 * Oversized CTA heading — characters drop in, then drift with the scroll.
 */
export function initCtaHeading(root = document) {
  const heading = root.querySelector('.cta__title');
  if (!heading) return;

  const chars = splitChars(heading);
  if (!chars.length || prefersReducedMotion()) return;

  gsap.from(chars, {
    yPercent: 120,
    opacity: 0,
    duration: 1,
    stagger: 0.03,
    ease: 'power4.out',
    scrollTrigger: { trigger: heading, start: 'top 85%', once: true }
  });
}

/**
 * Quote — words fade up together with a light stagger.
 */
export function initQuotes(root = document) {
  root.querySelectorAll('.quote__text').forEach((el) => {
    const words = splitWords(el);
    if (!words.length || prefersReducedMotion()) return;

    gsap.from(words, {
      yPercent: 100,
      opacity: 0,
      duration: 0.9,
      stagger: 0.025,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
  });
}

export { ScrollTrigger };
