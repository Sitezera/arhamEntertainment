import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './smooth-scroll.js';

/**
 * Accordion built on real <button aria-expanded> semantics.
 *
 * Panels animate to their measured height then are released to `auto`, so a
 * panel whose content reflows (a long line wrapping on resize) never ends up
 * clipped at a stale pixel height.
 *
 * `data-accordion="single"` closes siblings; otherwise items toggle freely.
 */
export function initAccordions(root = document) {
  root.querySelectorAll('[data-accordion]').forEach((group) => {
    const single = group.dataset.accordion === 'single';
    const items = [...group.querySelectorAll('.accordion__item')];

    const controllers = items.map((item) => {
      const trigger = item.querySelector('.accordion__trigger');
      const panel = item.querySelector('.accordion__panel');
      if (!trigger || !panel) return null;

      let open = trigger.getAttribute('aria-expanded') === 'true';

      // Establish the closed state without a flash of open content
      gsap.set(panel, { height: open ? 'auto' : 0 });

      const setOpen = (next, animate = true) => {
        if (next === open) return;
        open = next;
        trigger.setAttribute('aria-expanded', String(open));

        const duration = animate && !prefersReducedMotion() ? 0.55 : 0;

        gsap.to(panel, {
          height: open ? panel.scrollHeight : 0,
          duration,
          ease: 'power3.inOut',
          onComplete: () => {
            // Release to auto so later reflows are handled by the browser
            if (open) gsap.set(panel, { height: 'auto' });
            ScrollTrigger.refresh();
          }
        });
      };

      trigger.addEventListener('click', () => {
        if (single && !open) {
          controllers.forEach((c) => c && c !== controller && c.close());
        }
        setOpen(!open);
      });

      const controller = {
        close: () => setOpen(false),
        isOpen: () => open
      };

      return controller;
    });
  });
}
