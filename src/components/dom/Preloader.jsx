import { useEffect, useRef, useState } from 'react';

/**
 * Holds the page until the 3D bundle and first textures are in.
 *
 * Kept short on purpose: this sits in front of the work, so it counts real
 * progress and gets out of the way rather than running a fixed animation.
 */
export default function Preloader({ ready }) {
  const [shown, setShown] = useState(true);
  const [pct, setPct] = useState(0);
  const target = useRef(0);

  useEffect(() => {
    target.current = ready ? 100 : 78;
    let raf;
    const tick = () => {
      setPct((p) => {
        const next = p + (target.current - p) * 0.08;
        return next > 99.5 && ready ? 100 : next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  useEffect(() => {
    if (!ready || pct < 99) return;
    const t = setTimeout(() => setShown(false), 500);
    return () => clearTimeout(t);
  }, [ready, pct]);

  if (!shown) return null;

  return (
    <div className="preloader" data-done={ready ? 'true' : 'false'}>
      <div className="preloader__inner">
        <span className="preloader__word">Arham</span>
        <span className="preloader__count">{String(Math.round(pct)).padStart(3, '0')}</span>
      </div>
      <div className="preloader__bar">
        <span style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
    </div>
  );
}
