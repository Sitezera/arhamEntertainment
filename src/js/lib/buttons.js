import gsap from 'gsap';
import { prefersReducedMotion } from './smooth-scroll.js';

/**
 * Magnetic button — the element leans toward the cursor and an accent circle
 * grows from the entry point. Ported from
 * ui-components/buttons/magnetic-button.
 */
export class MagneticButton {
  constructor(element) {
    this.element = element;
    this.textElement = element.querySelector('.t-text');
    this.hoverCircle = element.querySelector('.t-hover-circle');
    this.magnetStrength = 0.38;
    this.textStrength = 0.16;

    element.addEventListener('mouseenter', (e) => this.onEnter(e));
    element.addEventListener('mousemove', (e) => this.onMove(e));
    element.addEventListener('mouseleave', (e) => this.onLeave(e));
  }

  onEnter(e) {
    if (!this.hoverCircle) return;
    const rect = this.element.getBoundingClientRect();
    this.hoverCircle.style.left = `${e.clientX - rect.left}px`;
    this.hoverCircle.style.top = `${e.clientY - rect.top}px`;
    gsap.to(this.hoverCircle, {
      width: rect.width * 2.5,
      height: rect.width * 2.5,
      duration: 0.5,
      ease: 'power2.out'
    });
  }

  onMove(e) {
    const rect = this.element.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    gsap.to(this.element, {
      x: x * this.magnetStrength,
      y: y * this.magnetStrength,
      duration: 1,
      ease: 'power3.out'
    });

    if (this.textElement) {
      gsap.to(this.textElement, {
        x: x * this.textStrength,
        y: y * this.textStrength,
        duration: 1,
        ease: 'power3.out'
      });
    }
  }

  onLeave(e) {
    gsap.to(this.element, {
      x: 0,
      y: 0,
      duration: 1,
      ease: 'elastic.out(1, 0.35)'
    });

    if (this.textElement) {
      gsap.to(this.textElement, {
        x: 0,
        y: 0,
        duration: 1,
        ease: 'elastic.out(1, 0.35)'
      });
    }

    if (this.hoverCircle) {
      const rect = this.element.getBoundingClientRect();
      gsap.to(this.hoverCircle, {
        width: 0,
        height: 0,
        left: `${e.clientX - rect.left}px`,
        top: `${e.clientY - rect.top}px`,
        duration: 0.4,
        ease: 'power2.out'
      });
    }
  }
}

/**
 * Wire up every button on the page.
 *
 * The effect is hover-driven, so it is skipped entirely on touch devices and
 * under reduced motion — the CSS hover states carry the interaction alone.
 *
 * Every button uses this one treatment (filled `.btn--accent` for primary,
 * outlined `.btn--ghost` for secondary) so a primary and secondary sitting
 * side by side are identical in size, shape and behaviour. The library's
 * kinetic-text button is a second, visually different treatment — it lives in
 * ui-components if it's ever wanted for a standalone call to action.
 */
export function initButtons(root = document) {
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)')
    .matches;
  if (!canHover || prefersReducedMotion()) return;

  root.querySelectorAll('.btn--magnetic').forEach((el) => {
    new MagneticButton(el);
  });
}
