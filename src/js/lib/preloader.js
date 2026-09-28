import gsap from 'gsap';
import { lockScroll, unlockScroll, prefersReducedMotion } from './smooth-scroll.js';

const SESSION_KEY = 'arham:preloaded';

/**
 * Wordmark splits along its midline while a panel opens out of the gap and
 * expands into the hero. Adapted from
 * ui-components/preloaders/split-text-preloader.
 *
 * Resolves *before* the panel finishes expanding so the hero headline can
 * start rising into the still-moving image — the two motions overlap instead
 * of queueing, which is what makes it feel like one gesture.
 *
 * @returns {Promise<void>} resolves when the hero should start animating.
 */
export function runPreloader() {
  const container = document.querySelector('.preloader');
  if (!container) return Promise.resolve();

  const skip =
    prefersReducedMotion() || sessionStorage.getItem(SESSION_KEY) === '1';

  if (skip) {
    gsap.set(container, { display: 'none' });
    return Promise.resolve();
  }

  lockScroll();

  return new Promise((resolve) => {
    const full = container.querySelector('.preloader__word--full');
    const top = container.querySelector('.preloader__word--top');
    const bottom = container.querySelector('.preloader__word--bottom');
    const panel = container.querySelector('.preloader__panel');
    const frames = container.querySelectorAll('.preloader__frame');
    const counter = container.querySelector('.preloader__counter');

    if (!full || !panel) {
      gsap.set(container, { display: 'none' });
      unlockScroll();
      return resolve();
    }

    // Reset to a known state
    gsap.set(container, { visibility: 'visible', zIndex: 9500 });
    gsap.set([full, top, bottom], { scale: 0.92, opacity: 0, y: 0 });
    gsap.set(panel, { width: 0, height: 0, opacity: 0, borderRadius: 20 });
    gsap.set(frames, { opacity: 0 });

    const count = { value: 0 };
    const tl = gsap.timeline({ defaults: { ease: 'power4.inOut' } });

    // ── 1. Wordmark arrives, counter runs ──
    tl.to(full, { scale: 1, opacity: 1, duration: 1.1, ease: 'power3.out' }, 0.2);
    tl.to([top, bottom], { scale: 1, duration: 1.1, ease: 'power3.out' }, 0.2);

    if (counter) {
      tl.to(
        count,
        {
          value: 100,
          duration: 1.6,
          ease: 'power2.inOut',
          onUpdate: () => {
            counter.textContent = String(Math.round(count.value)).padStart(2, '0');
          }
        },
        0.2
      );
    }

    // ── 2. Swap the whole word for the two clipped halves, then split ──
    // The swap happens on the same frame the split starts, so the clip-path
    // seam is never visible on a static word.
    tl.set(full, { opacity: 0 }, 1.9);
    tl.set([top, bottom], { opacity: 1 }, 1.9);

    tl.to(top, { yPercent: -68, duration: 1.3 }, 1.9);
    tl.to(bottom, { yPercent: 68, duration: 1.3 }, 1.9);
    tl.to(
      panel,
      { opacity: 1, width: '42vw', height: '24vh', duration: 1.3 },
      1.9
    );

    // ── 3. Flash through the frames ──
    frames.forEach((frame, i) => {
      if (i === 0) tl.set(frame, { opacity: 1 }, 1.9);
      else tl.set(frame, { opacity: 1 }, 2.25 + i * 0.13);
    });

    const expandAt = 2.25 + frames.length * 0.13 + 0.25;

    // ── 4. Panel takes the screen, halves clear out of frame ──
    tl.to(
      panel,
      { width: '100vw', height: '100vh', borderRadius: 0, duration: 1.4 },
      expandAt
    );
    tl.to(top, { yPercent: -150, duration: 1.4 }, expandAt);
    tl.to(bottom, { yPercent: 150, duration: 1.4 }, expandAt);

    if (counter) {
      tl.to(counter, { opacity: 0, duration: 0.4 }, expandAt);
    }

    // Drop behind the page so the real hero paints on top of the moving panel
    tl.set(container, { zIndex: 1 }, expandAt + 0.05);

    // Hand off to the hero while the panel is still travelling
    tl.add(() => {
      unlockScroll();
      sessionStorage.setItem(SESSION_KEY, '1');
      resolve();
    }, expandAt + 0.75);

    // ── 5. Dissolve ──
    tl.to(container, { opacity: 0, duration: 0.6 }, expandAt + 1.45);
    tl.set(container, { display: 'none' });
  });
}
