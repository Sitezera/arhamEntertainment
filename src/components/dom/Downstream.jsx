import { useEffect, useRef } from 'react';

import { STATS, TESTIMONIALS } from '../../lib/constants.js';

/**
 * Everything after the flight.
 *
 * The flight is a fixed layer the page scrolls a spacer past. This is the
 * opposite: ordinary document flow, scrolling normally over the top of it.
 * The switch is deliberate. Three sections of camera work is a journey; six
 * is a hostage situation, and the count, the quotes and the footer are all
 * things people want to read at their own pace rather than fly through.
 *
 * Reveals use IntersectionObserver, not a scroll listener: it fires once per
 * element when it crosses the threshold instead of on every frame.
 */
export default function Downstream() {
  const root = useRef(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = el.querySelectorAll('[data-reveal]');

    if (reduced) {
      for (const item of items) item.dataset.reveal = 'in';
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Also reveal anything already above the viewport. Landing deep in
          // the page (a deep link, a restored scroll position) means earlier
          // items never cross the threshold, and without this they stay
          // blank for anyone who scrolls back up.
          const passed = entry.boundingClientRect.bottom <= 0;
          if (!entry.isIntersecting && !passed) continue;
          entry.target.dataset.reveal = 'in';
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.25 }
    );

    for (const item of items) io.observe(item);
    return () => io.disconnect();
  }, []);

  return (
    <div className="page" ref={root}>
      <section className="page__stats" aria-label="Arham in numbers">
        <div className="page__stats-row">
          {STATS.map((stat, i) => (
            <div
              key={stat.id}
              className="stat"
              data-reveal="out"
              style={{ '--delay': `${i * 90}ms` }}
            >
              <span className="stat__figure">{stat.figure}</span>
              <span className="stat__label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="page__quotes" aria-label="What clients say">
        <div className="bento">
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={t.id}
              className={
                'cell cell--' + t.span + (t.accent ? ' cell--accent' : '')
              }
              data-reveal="out"
              style={{ '--delay': `${i * 80}ms` }}
            >
              {t.image ? (
                <img className="cell__bg" src={t.image} alt="" loading="lazy" />
              ) : null}
              <blockquote>{t.quote}</blockquote>
              <figcaption>
                <span className="cell__name">{t.name}</span>
                <span className="cell__role">{t.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <footer className="page__footer">
        <div className="page__foot-inner">
          <a className="page__mail" href="mailto:hello@arhamentertainment.com">
            hello@arhamentertainment.com
          </a>

          <div className="page__foot-bar">
            <span>Arham Entertainment</span>
            <span>Mumbai</span>
            <span>&copy; 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
