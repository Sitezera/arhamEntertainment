import gsap from 'gsap';
import { prefersReducedMotion } from './smooth-scroll.js';

/**
 * Floating preview that follows the cursor across the work index.
 *
 * Each row carries `data-preview="2"` pointing at a `.case-preview__item`.
 * Desktop pointers only — on touch there is no hover to hang it off, and the
 * rows link straight through to the case study anyway.
 */
export function initCasePreview() {
  const list = document.querySelector('.case-list');
  const preview = document.querySelector('.case-preview');
  if (!list || !preview) return;

  const canHover = window.matchMedia(
    '(min-width: 62rem) and (hover: hover) and (pointer: fine)'
  ).matches;
  if (!canHover || prefersReducedMotion()) return;

  const items = preview.querySelectorAll('.case-preview__item');
  const rows = list.querySelectorAll('.case-row');
  if (!items.length || !rows.length) return;

  // Offset from the cursor so the panel never sits under the pointer
  const setX = gsap.quickTo(preview, 'x', { duration: 0.75, ease: 'power3' });
  const setY = gsap.quickTo(preview, 'y', { duration: 0.75, ease: 'power3' });
  const setRotate = gsap.quickTo(preview, 'rotation', {
    duration: 0.9,
    ease: 'power3'
  });

  let active = -1;
  let lastX = 0;

  const move = (e) => {
    setX(e.clientX + 32);
    setY(e.clientY - preview.offsetHeight / 2);
    // Tilt into the direction of travel
    const delta = gsap.utils.clamp(-8, 8, (e.clientX - lastX) * 0.6);
    setRotate(delta);
    lastX = e.clientX;
  };

  rows.forEach((row) => {
    const index = parseInt(row.dataset.preview, 10);
    if (Number.isNaN(index) || !items[index]) return;

    row.addEventListener('mouseenter', () => {
      if (active === index) return;

      if (active === -1) {
        gsap.to(preview, {
          opacity: 1,
          scale: 1,
          duration: 0.45,
          ease: 'power3.out',
          startAt: { scale: 0.9 }
        });
      }

      if (active > -1 && items[active]) {
        gsap.to(items[active], { opacity: 0, duration: 0.3 });
      }

      gsap.to(items[index], { opacity: 1, duration: 0.35 });
      active = index;
    });

    row.addEventListener('mouseleave', () => {
      gsap.to(preview, { opacity: 0, scale: 0.9, duration: 0.3 });
      if (items[active]) gsap.to(items[active], { opacity: 0, duration: 0.3 });
      active = -1;
    });
  });

  list.addEventListener('mousemove', move, { passive: true });
}
