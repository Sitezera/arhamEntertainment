import gsap from 'gsap';
import { prefersReducedMotion } from './smooth-scroll.js';

const NAV_KEY = 'arham:navigating';

/**
 * Curtain transition between pages.
 *
 * Deliberately NOT a SPA router (Barba et al.) — every page stays a real
 * document request, so the HTML a crawler sees is the HTML a visitor gets.
 * The curtain just covers the gap: panels wipe up on leave, retract on
 * arrival.
 *
 * The enter animation only plays when we arrived from an internal link, so a
 * cold landing (search result, pasted URL) paints immediately.
 */
export function initPageTransition() {
  const curtain = document.querySelector('.transition-curtain');
  if (!curtain) return;

  const panels = curtain.querySelectorAll('.transition-curtain__panel');
  const reduce = prefersReducedMotion();

  const arrivedFromInternalLink = sessionStorage.getItem(NAV_KEY) === '1';
  sessionStorage.removeItem(NAV_KEY);

  const hideCurtain = () => gsap.set(curtain, { visibility: 'hidden' });

  if (arrivedFromInternalLink && !reduce) {
    gsap.set(curtain, { visibility: 'visible' });
    gsap.set(panels, { scaleY: 1, transformOrigin: 'top' });
    gsap.to(panels, {
      scaleY: 0,
      duration: 0.7,
      ease: 'power4.inOut',
      stagger: 0.055,
      onComplete: hideCurtain
    });
  } else {
    hideCurtain();
  }

  // Coming back via the bfcache leaves the curtain mid-animation — reset it
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      gsap.set(panels, { scaleY: 0 });
      hideCurtain();
    }
  });

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    if (!isInternalNavigation(link, e)) return;

    // Same page — scroll up instead of reloading
    if (link.href === window.location.href) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('arham:scrolltop'));
      return;
    }

    e.preventDefault();
    sessionStorage.setItem(NAV_KEY, '1');

    if (reduce) {
      window.location.href = link.href;
      return;
    }

    gsap.set(curtain, { visibility: 'visible' });
    gsap.set(panels, { scaleY: 0, transformOrigin: 'bottom' });
    gsap.to(panels, {
      scaleY: 1,
      duration: 0.62,
      ease: 'power4.inOut',
      stagger: 0.05,
      onComplete: () => {
        window.location.href = link.href;
      }
    });
  });
}

/** True only for plain left-clicks on same-origin document links. */
function isInternalNavigation(link, event) {
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }

  const href = link.getAttribute('href');
  if (!href || href.startsWith('#')) return false;
  if (link.target && link.target !== '_self') return false;
  if (link.hasAttribute('download')) return false;
  if (link.dataset.noTransition !== undefined) return false;

  // mailto:, tel:, and anything off-site
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  if (!/^https?:$/.test(url.protocol)) return false;

  // An in-page anchor on the current document
  if (url.pathname === window.location.pathname && url.hash) return false;

  return true;
}
