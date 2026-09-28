import { useEffect, useMemo, useState } from 'react';

import CssFlight from './components/dom/CssFlight.jsx';
import Overlay from './components/dom/Overlay.jsx';
import Downstream from './components/dom/Downstream.jsx';
import Preloader from './components/dom/Preloader.jsx';
import { detectTier, TIER_SETTINGS, SCROLL_PAGES } from './lib/constants.js';
import { scrollState } from './lib/scrollState.js';

/**
 * Arham Entertainment - Into the Frame.
 *
 * One continuous camera flight, rendered without WebGL.
 *
 * There was a three.js engine here. It was removed, because nothing in this
 * scene is 3D rendering: it is a clipped video, some transformed images, and
 * coloured air. The projection is eleven lines of maths in lib/flight.js, and
 * doing it by hand costs a third of a millisecond and removes an entire class
 * of failure - a GPU process crash on a hybrid-graphics laptop took the whole
 * page down to a white screen, and no page-level code could recover it.
 *
 * The saving is not marginal: about 363 kB gzipped down to roughly 30, all
 * text back in the DOM as real selectable text, and the video decoding
 * through the normal media path.
 */
export default function App() {
  const [ready, setReady] = useState(false);

  // Exposed so the flight can be measured from a headless browser without
  // threading scroll position through React state.
  useEffect(() => {
    window.__rig = scrollState;
  }, []);

  const tier = useMemo(() => detectTier(), []);
  const settings = TIER_SETTINGS[tier];

  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // There is no scene graph to wait on any more; the first paint is the page.
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Preloader ready={ready} />

      <CssFlight reduced={reduced} haze={settings.haze} />

      <Overlay />

      {/* svh, not vh: the iOS address bar collapsing mid-scroll would change
          the document height and therefore the camera position under you. */}
      <div
        className="scroll-spacer"
        style={{ height: `${SCROLL_PAGES * 100}svh` }}
        aria-hidden="true"
      />

      <Downstream />

      <noscript>
        <div className="fallback">
          <h1>Arham Entertainment</h1>
          <p>
            An entertainment-first marketing agency. Email
            hello@arhamentertainment.com
          </p>
        </div>
      </noscript>
    </>
  );
}
