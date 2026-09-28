import { useEffect, useMemo, useState } from 'react';

import CssFlight from './components/dom/CssFlight.jsx';
import Overlay from './components/dom/Overlay.jsx';
import Downstream from './components/dom/Downstream.jsx';
import Preloader from './components/dom/Preloader.jsx';
import {
  detectTier,
  TIER_SETTINGS,
  SCROLL_PAGES,
  SCREENS,
  BAND_BLOCKS
} from './lib/constants.js';
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
  const [progress, setProgress] = useState(0);

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

  // Real progress, or none at all.
  //
  // This used to ease toward 78 and wait on a hard-coded 120ms timeout, which
  // meant the number measured nothing and the screen appeared every time
  // whether there was anything to wait for or not. Now it counts the things
  // the page actually needs: the two faces, and every image the flight will
  // show. Measured, those land around 560ms on a fast connection and a second
  // on a throttled one, so there is genuinely something to wait for.
  useEffect(() => {
    let alive = true;

    const urls = [
      ...SCREENS.map((s) => s.src),
      ...BAND_BLOCKS.filter((b) => b.kind === 'image').map((b) => b.media)
    ];

    const jobs = [
      document.fonts ? document.fonts.ready : Promise.resolve(),
      ...urls.map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image();
            // Resolve either way: a missing image should not hold the page
            // behind a progress bar that can never finish.
            img.onload = img.onerror = resolve;
            img.src = src;
          })
      )
    ];

    let done = 0;
    for (const job of jobs) {
      job.then(() => {
        if (!alive) return;
        done += 1;
        setProgress(done / jobs.length);
      });
    }

    Promise.all(jobs).then(() => alive && setReady(true));

    // A ceiling on the wait. The gallery is about a megabyte of photographs
    // that nothing needs until a quarter of the way down, so on a slow
    // connection waiting for all of it would hold the page for five seconds.
    // Past this the page opens and the rest keeps streaming in behind it.
    const ceiling = setTimeout(() => alive && setReady(true), 2200);

    return () => {
      alive = false;
      clearTimeout(ceiling);
    };
  }, []);

  return (
    <>
      <Preloader ready={ready} progress={progress} />

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
