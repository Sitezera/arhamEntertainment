import { useEffect, useState } from 'react';

/** Below this, loading finished so fast that showing a screen would be worse
 *  than showing nothing: a flash of counter and then the page. */
const WORTH_SHOWING_MS = 180;

/**
 * The loading screen, which now measures something.
 *
 * It reports real progress from App: the two type faces and every image the
 * flight will show, counted as each one lands. And it only appears at all if
 * that work is still going after a fifth of a second, so a warm cache gets
 * the page rather than a progress bar it does not need.
 */
export default function Preloader({ ready, progress }) {
  const [show, show_] = useState(false);
  const [gone, gone_] = useState(false);

  // Decide once whether this load is slow enough to deserve a screen.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!ready) show_(true);
    }, WORTH_SHOWING_MS);
    return () => clearTimeout(t);
  }, [ready]);

  // Let the last frame read 100 before it leaves.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => gone_(true), show ? 420 : 0);
    return () => clearTimeout(t);
  }, [ready, show]);

  if (gone || !show) return null;

  const pct = Math.round((ready ? 1 : progress) * 100);

  return (
    <div className="preloader" data-done={ready ? 'true' : 'false'}>
      <div className="preloader__inner">
        <span className="preloader__word">Arham</span>
        <span className="preloader__count">{String(pct).padStart(3, '0')}</span>
      </div>
      <div className="preloader__bar">
        <span style={{ transform: `scaleX(${(ready ? 1 : progress).toFixed(3)})` }} />
      </div>
    </div>
  );
}
