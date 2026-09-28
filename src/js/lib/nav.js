import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { lockScroll, unlockScroll, prefersReducedMotion } from './smooth-scroll.js';

/**
 * Header behaviour: solidify once past the hero, hide on scroll down,
 * reveal on scroll up. Plus the full-screen mobile menu.
 */
export function initNav() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  initHeaderScroll(header);
  initMobileMenu(header);
}

function initHeaderScroll(header) {
  ScrollTrigger.create({
    start: 'top -80',
    end: 99999,
    onUpdate: (self) => {
      const scrolled = self.scroll() > 80;
      header.classList.toggle('is-pinned', scrolled);

      // Never hide the header while the mobile menu is open
      if (document.body.classList.contains('is-menu-open')) {
        header.classList.remove('is-hidden');
        return;
      }

      const hide = self.direction === 1 && self.scroll() > 400;
      header.classList.toggle('is-hidden', hide);
    }
  });
}

function initMobileMenu(header) {
  const toggle = header.querySelector('.menu-toggle');
  const menu = document.querySelector('.mobile-nav');
  if (!toggle || !menu) return;

  const items = menu.querySelectorAll('.mobile-nav__link');
  const foot = menu.querySelector('.mobile-nav__foot');
  const reduce = prefersReducedMotion();
  let open = false;
  let tl = null;

  const buildTimeline = () => {
    const timeline = gsap.timeline({
      paused: true,
      defaults: { ease: 'power4.inOut' },
      onReverseComplete: () => {
        menu.classList.remove('is-open');
        gsap.set(menu, { visibility: 'hidden' });
      }
    });

    timeline
      .set(menu, { visibility: 'visible' })
      .fromTo(
        menu,
        { clipPath: 'inset(0 0 100% 0)' },
        { clipPath: 'inset(0 0 0% 0)', duration: reduce ? 0.01 : 0.7 }
      )
      .fromTo(
        items,
        { yPercent: 115 },
        {
          yPercent: 0,
          duration: reduce ? 0.01 : 0.65,
          stagger: reduce ? 0 : 0.06
        },
        reduce ? 0 : 0.2
      )
      .fromTo(
        foot,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: reduce ? 0.01 : 0.5 },
        reduce ? 0 : 0.45
      );

    return timeline;
  };

  const setOpen = (next) => {
    open = next;
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-menu-open', open);

    if (!tl) tl = buildTimeline();

    if (open) {
      menu.classList.add('is-open');
      lockScroll();
      tl.play();
    } else {
      unlockScroll();
      tl.reverse();
    }
  };

  toggle.addEventListener('click', () => setOpen(!open));

  // Close on link click and on Escape
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) {
      setOpen(false);
      toggle.focus();
    }
  });

  // If the viewport grows past the breakpoint, drop the overlay entirely
  window.matchMedia('(min-width: 62rem)').addEventListener('change', (e) => {
    if (e.matches && open) setOpen(false);
  });
}
