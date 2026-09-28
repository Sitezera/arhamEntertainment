import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './smooth-scroll.js';

/**
 * Infinite marquee that reacts to scroll.
 *
 * Markup supplies ONE `.marquee__group`; this clones it until the track is at
 * least twice the viewport width, so the wrap point is always off-screen no
 * matter how wide the monitor is.
 *
 * Scrolling speeds the ticker up and flips its direction — the page and the
 * type feel mechanically linked rather than independently animated.
 *
 * `data-speed` = pixels per second. `data-direction` = "left" | "right".
 */
export function initMarquees(root = document) {
  const marquees = root.querySelectorAll('.marquee');

  marquees.forEach((marquee) => {
    const track = marquee.querySelector('.marquee__track');
    const group = marquee.querySelector('.marquee__group');
    if (!track || !group) return;

    const speed = parseFloat(marquee.dataset.speed) || 90;
    const baseDirection = marquee.dataset.direction === 'right' ? 1 : -1;

    // Clone until we comfortably exceed the viewport twice over
    const fill = () => {
      const needed = Math.max(
        2,
        Math.ceil((window.innerWidth * 2) / Math.max(group.offsetWidth, 1)) + 1
      );
      while (track.children.length < needed) {
        const clone = group.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      }
    };

    fill();

    if (prefersReducedMotion()) return;

    const groupWidth = group.offsetWidth;
    if (!groupWidth) return;

    // Wrap x within one group width so the loop is seamless
    const wrap = gsap.utils.wrap(-groupWidth, 0);

    const tween = gsap.to(track, {
      x: baseDirection * groupWidth,
      duration: groupWidth / speed,
      ease: 'none',
      repeat: -1,
      modifiers: {
        x: (x) => `${wrap(parseFloat(x))}px`
      }
    });

    // ── Scroll coupling ──
    let scrollDirection = baseDirection;
    let settleTimer;

    ScrollTrigger.create({
      trigger: marquee,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const velocity = self.getVelocity();
        scrollDirection = velocity > 0 ? baseDirection : -baseDirection;
        const sign = scrollDirection === baseDirection ? 1 : -1;

        // Speed up in proportion to scroll velocity. One tween, retargeted on
        // each tick — spawning a fresh tween per frame (and a second one from
        // its onComplete) just churns instances the next tick overwrites.
        const boost = Math.min(Math.abs(velocity) / 900, 3.5);
        gsap.to(tween, {
          timeScale: sign * (1 + boost),
          duration: 0.3,
          overwrite: true
        });

        // Ease back to the idle speed once the scroll stops. onUpdate fires
        // only while scrolling, so the settle has to be scheduled off a timer
        // rather than a ScrollTrigger callback.
        clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
          gsap.to(tween, {
            timeScale: sign,
            duration: 0.9,
            overwrite: true
          });
        }, 140);
      },
      // Don't burn frames animating a ticker nobody can see
      onEnter: () => tween.play(),
      onLeave: () => tween.pause(),
      onEnterBack: () => tween.play(),
      onLeaveBack: () => tween.pause()
    });
  });
}
