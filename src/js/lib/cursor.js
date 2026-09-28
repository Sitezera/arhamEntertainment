import gsap from 'gsap';
import { prefersReducedMotion } from './smooth-scroll.js';

/**
 * Two-part cursor: a dot that tracks 1:1 and a ring that lags behind.
 * `mix-blend-mode: difference` in CSS means it stays visible over any
 * background without needing to know what it is sitting on.
 *
 * Add `data-cursor="view"` (or any label) to an element to expand the ring
 * and print that word inside it.
 */
export function initCursor() {
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)')
    .matches;
  if (!canHover || prefersReducedMotion()) return;

  const cursor = document.querySelector('.cursor');
  if (!cursor) return;

  const dot = cursor.querySelector('.cursor__dot');
  const ring = cursor.querySelector('.cursor__ring');
  const label = cursor.querySelector('.cursor__label');

  const setDotX = gsap.quickSetter(dot, 'x', 'px');
  const setDotY = gsap.quickSetter(dot, 'y', 'px');
  const setRingX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
  const setRingY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });

  let visible = false;

  window.addEventListener(
    'mousemove',
    (e) => {
      if (!visible) {
        visible = true;
        gsap.to(cursor, { opacity: 1, duration: 0.3 });
      }
      setDotX(e.clientX);
      setDotY(e.clientY);
      setRingX(e.clientX);
      setRingY(e.clientY);
    },
    { passive: true }
  );

  document.addEventListener('mouseleave', () => {
    visible = false;
    gsap.to(cursor, { opacity: 0, duration: 0.25 });
  });

  // ── Hover states ──
  const interactive = 'a, button, [data-cursor], input, textarea, select';

  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest(interactive);
    if (!target) return;

    const text = target.dataset.cursor;

    if (text) {
      gsap.to(ring, {
        width: 84,
        height: 84,
        borderWidth: 0,
        backgroundColor: '#f2eee6',
        duration: 0.4,
        ease: 'power3.out'
      });
      label.textContent = text;
      gsap.to(label, { opacity: 1, duration: 0.3 });
      gsap.to(dot, { opacity: 0, duration: 0.2 });
    } else {
      gsap.to(ring, {
        width: 58,
        height: 58,
        duration: 0.4,
        ease: 'power3.out'
      });
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (!e.target.closest(interactive)) return;

    gsap.to(ring, {
      width: 38,
      height: 38,
      borderWidth: 1,
      backgroundColor: 'transparent',
      duration: 0.4,
      ease: 'power3.out'
    });
    gsap.to(label, { opacity: 0, duration: 0.2 });
    gsap.to(dot, { opacity: 1, duration: 0.2 });
  });

  // Shrink on click for tactile feedback
  window.addEventListener('mousedown', () =>
    gsap.to(ring, { scale: 0.8, duration: 0.2 })
  );
  window.addEventListener('mouseup', () =>
    gsap.to(ring, { scale: 1, duration: 0.3 })
  );
}
