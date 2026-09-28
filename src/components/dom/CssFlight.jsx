import { useEffect, useMemo, useRef } from 'react';

import {
  START_Z,
  PORTAL_Z,
  PORTAL_PLANE,
  PORTAL_WINDOW,
  SCREENS,
  HERO_LINES,
  HERO_NEAR_Z,
  HERO_FAR_Z,
  SECTION_CARDS,
  BAND_BLOCKS,
  HORIZONTAL
} from '../../lib/constants.js';
import { scrollState } from '../../lib/scrollState.js';
import { flightAt, pxPerUnit, smoothstep, clamp01, HALF_TAN } from '../../lib/flight.js';
import { gradeAt, toCss, dealHaze, HAZE_SEED } from '../../lib/atmosphere.js';

/**
 * The same flight, without a GPU.
 *
 * This runs when WebGL is unavailable or its context has been lost. It is not
 * a static apology page: it is the identical journey — the same camera Z, the
 * same portal timing, the same gallery — projected by hand into CSS transforms
 * instead of handed to a renderer. Because it writes the same scrollState, the
 * DOM overlay and its beats work here unchanged.
 *
 * No animation library. The WebGL path already drives everything from one rAF
 * reading real scroll position; bringing in a tweening engine to re-implement
 * that would add a dependency to say what this file already says in a loop.
 */

/** Screens are rendered at this width, then scaled, so they stay sharp. */
const BASE_W = 720;

/** Distance at which a work screen is fully lit — matches WorkScreens.jsx. */
const FRAME_D = 7;

export default function CssFlight({ reduced = false, haze = 70 }) {
  const rootRef = useRef(null);
  const reelRef = useRef(null);
  const topRef = useRef(null);
  const botRef = useRef(null);
  const videoRef = useRef(null);
  const screenRefs = useRef([]);
  // Measured text widths, so the diagonal can be aligned to the window's
  // corners without a forced layout read on every frame.
  const metrics = useRef({ vw: 0, near: 0, far: 0 });
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const cardRefs = useRef([]);
  const bandRef = useRef(null);
  const trackRef = useRef(null);
  const trackW = useRef(0);
  const washRef = useRef(null);
  const spacerRef = useRef(null);
  const doneRef = useRef(false);
  const capVideos = useRef([]);
  const bandLive = useRef(false);
  const hazeRef = useRef(null);
  const parallaxRef = useRef(null);

  // Placement, solved once per viewport, mirroring the WebGL gallery: beside
  // the flight path when there is room, centred on the path when there is not.
  const layout = useMemo(() => SCREENS.map(() => ({})), []);

  const bands = useMemo(() => dealHaze(HAZE_SEED, haze).bands, [haze]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reduced) {
      video.pause();
      video.currentTime = 0;
    } else {
      video.play().catch(() => {});
    }
  }, [reduced]);

  useEffect(() => {
    let raf;
    let smoothed = 0;
    let last = performance.now();

    const solveLayout = (vw, vh) => {
      const aspect = vw / vh;
      const visW = 2 * FRAME_D * HALF_TAN * aspect;
      const wide = clamp01((aspect - 0.72) / (1.15 - 0.72));

      SCREENS.forEach((s, i) => {
        const ratio = 16 / 10;
        const fitted = (visW * 0.82) / ratio;
        const size = fitted + (s.scale - fitted) * wide;
        const capped = Math.min(s.scale, Math.max(size, 0.1));
        const width = capped * ratio;
        const beside = s.side * (width / 2 + 0.35);
        const centred = s.side * Math.max(0, visW / 2 - width / 2) * 0.9;
        layout[i] = {
          size: capped,
          width,
          x: centred + (beside - centred) * wide,
          yScale: capped / s.scale,
          crosses: Math.abs(centred + (beside - centred) * wide) < width / 2
        };
      });
    };

    let vw = 0;
    let vh = 0;

    const root = rootRef.current;

    // Pointer parallax. A pointermove listener is not a scroll listener: it
    // fires only while the pointer actually moves, and all it does is store
    // two numbers the existing loop reads.
    const onPointer = (e) => {
      pointer.current.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    const paint = (f, covered) => {
      // This layer is never hidden. It is the page's background for the whole
      // document, not just for the flight: past the end the camera holds at
      // END_Z and what remains is the graded air, the stars and the haze,
      // which is exactly what the sections below should be sitting on.
      //
      // The reel is a different matter. It is fully dissolved long before
      // here, so once the page has covered the viewport there is no reason to
      // keep a video decoding behind it.
      if (covered !== doneRef.current) {
        doneRef.current = covered;
        const reel = videoRef.current;
        if (reel) {
          if (covered) reel.pause();
          else if (!reduced) reel.play().catch(() => {});
        }
      }

      const nextW = window.innerWidth;
      const nextH = window.innerHeight;
      if (nextW !== vw || nextH !== vh) {
        vw = nextW;
        vh = nextH;
        solveLayout(vw, vh);
      }

      // ── The air ──────────────────────────────────────────────────────────
      // The grade is the same table the 3D scene reads, so the journey
      // changes colour in the same places under either engine.
      const g = gradeAt(f.camZ);
      if (root) root.style.backgroundColor = toCss(g.bg);

      // A flat field of near-black changes hue without anyone noticing. This
      // is the same grade poured into a soft pool of light in the middle of
      // the frame, which is what makes the change legible: you read coloured
      // light falling on something, not a background swatch being swapped.
      if (washRef.current) washRef.current.style.setProperty('--wash', toCss(g.fog));

      // Looking around only makes sense while the reel is an object in a
      // room. Once it has opened to fill the view there is nothing to look
      // around, and the same movement just slides the picture under the
      // cursor, so it is damped out and comes back on the far side.
      const attention = 1 - f.portalOpen;
      pointer.current.x += (pointer.current.tx - pointer.current.x) * 0.06;
      pointer.current.y += (pointer.current.ty - pointer.current.y) * 0.06;
      if (parallaxRef.current) {
        parallaxRef.current.style.transform =
          `translate3d(${(-pointer.current.x * 26 * attention).toFixed(2)}px, ${(-pointer.current.y * 16 * attention).toFixed(2)}px, 0)`;
      }

      if (hazeRef.current) {
        // How deep into a haze bank are we? Gaussian per band, strongest
        // wins, so the banks read as places you pass through.
        let amount = 0;
        for (const b of bands) {
          const k = (f.camZ - b.z) / b.depth;
          const v = Math.exp(-k * k);
          if (v > amount) amount = v;
        }
        const hz = hazeRef.current;
        hz.style.setProperty('--haze-tint', toCss(g.fog));
        hz.style.opacity = String(0.34 * amount * (1 - f.portalOpen * 0.88));
        // Drifts sideways only; haze coming at you reads as smoke.
        hz.style.transform =
          `translate3d(${(Math.sin(performance.now() / 14000) * 5).toFixed(2)}%, 0, 0)`;
      }

      // ── The reel ─────────────────────────────────────────────────────────
      // The video always fills the viewport; clip-path is the window onto it.
      // That is exactly what the shader did — the footage fills the opening,
      // not the plane — and it costs nothing here.
      const open = f.portalOpen;
      const closedW = Math.min(vw * 0.34, 420);
      const closedH = closedW / 2.2;
      const w = closedW + (vw - closedW) * open;
      const h = closedH + (vh - closedH) * open;
      const insetX = (((vw - w) / 2) / vw) * 100;
      const insetY = (((vh - h) / 2) / vh) * 100;

      const reel = reelRef.current;
      if (reel) {
        reel.style.clipPath =
          `inset(${insetY.toFixed(3)}% ${insetX.toFixed(3)}% round ${(16 * (1 - open)).toFixed(1)}px)`;
        // drop-shadow follows the clipped silhouette, which is how the rim
        // glow survives without a shader.
        reel.style.filter =
          `drop-shadow(0 0 ${(26 * (1 - open)).toFixed(1)}px rgba(255, 74, 28, ${(0.8 * (1 - open)).toFixed(2)}))`;
        reel.style.opacity = String(1 - smoothstep(f.portalThrough, 0.55, 1));
      }

      // ── The headline, in two halves at two depths ───────────────────────
      // Each half is authored at a size proportional to its own distance, so
      // at the top of the page they land the same size and read as one line.
      // The moment the camera moves, that agreement breaks: the near half
      // swells and is past you in a few units while the far half is still
      // coming. The sentence comes apart in depth.
      const dPortal = START_Z - PORTAL_Z;
      const winW = PORTAL_PLANE.w * PORTAL_WINDOW.x * 2;
      const perChar = HERO_LINES.bottom.length * 0.62;
      const visWPortal = 2 * dPortal * HALF_TAN * (vw / vh);
      const fontWorld = Math.min((winW * 0.95) / perChar, (visWPortal * 0.86) / perChar);

      // Base pixel size is fixed per viewport; the loop only scales, so the
      // text never triggers layout while the camera is moving.
      if (metrics.current.vw !== vw && topRef.current && botRef.current) {
        const px = (z) => {
          const k = (START_Z - z) / dPortal;
          return fontWorld * k * pxPerUnit(START_Z - z, vh);
        };
        const nearPx = px(HERO_NEAR_Z);
        const farPx = px(HERO_FAR_Z);
        topRef.current.style.fontSize = `${nearPx}px`;
        botRef.current.style.fontSize = `${farPx}px`;
        // Widths are read once per viewport so the halves can be edge-aligned
        // to the window without a layout read on every frame.
        metrics.current = {
          vw,
          near: nearPx,
          far: farPx,
          nearW: topRef.current.offsetWidth,
          farW: botRef.current.offsetWidth
        };
      }

      const halves = [
        [topRef, HERO_NEAR_Z, -1, metrics.current.near, metrics.current.nearW],
        [botRef, HERO_FAR_Z, 1, metrics.current.far, metrics.current.farW]
      ];

      for (const [ref, z, dir, basePx, baseW] of halves) {
        const el = ref.current;
        if (!el || !basePx) continue;

        const hd = f.camZ - z;
        // Gone before it reaches the camera, so a half never blows up into an
        // unreadable wall of letterforms on its way past.
        const byDistance = hd <= 0.4 ? 0 : smoothstep(hd, 1.5, 5);

        const kWorld = (START_Z - z) / dPortal;
        const k = pxPerUnit(hd, vh);
        const scale = (fontWorld * kWorld * k) / basePx;

        // Outward drift along the diagonal it sits on, so the halves separate
        // rather than simply growing.
        // Anchored to the reel's actual closed size in pixels, not to the
        // world window: the clip-path window is authored in px, and deriving
        // the corner from world units instead put the type on the video.
        // Everything about a half grows by the same factor its type does,
        // which is what perspective does to a flat thing moving closer.
        // Keyed off the distance fade, not the final visibility: the final
        // value depends on cy, which depends on this, and reading it here
        // threw a ReferenceError every frame that silently blanked the hero.
        const driftPx = (1 - byDistance) * closedW * 0.22;

        // The window grows faster than the type does, so left alone it simply
        // swallows the halves. They are pushed outward as it opens instead:
        // the reel shoulders the sentence apart and they leave the frame,
        // rather than being overrun where they stand.
        const openPush = smoothstep(f.portalOpen, 0.04, 0.72) * vh * 0.62;

        const edgeX = dir * ((closedW / 2) * scale + driftPx + openPush * 0.42);
        const cy = dir * ((closedH / 2 + basePx * 0.85) * scale + driftPx * 0.6 + openPush);

        // The halves hang off opposite corners of the window, so each is
        // aligned by the edge that touches it, not by its centre.
        let cx = edgeX + (dir * -1 * baseW * scale) / 2;

        // Then kept on screen. The window is a third of the viewport on a
        // phone, and a line anchored to its right edge is wider than the room
        // that leaves: "CULTURE MOVE" was starting at -65px and losing its
        // first word off the left. Where there is room the diagonal is
        // untouched; where there is not, the line slides back into view.
        const halfLine = (baseW * scale) / 2;
        const edgeGap = 14;
        const limit = Math.max(0, vw / 2 - halfLine - edgeGap);
        cx = Math.max(-limit, Math.min(limit, cx));

        // The halves hang just outside the closed window, but the window
        // grows as the reel opens and will eventually swallow them. Distance
        // alone does not catch that: the far half is authored to survive to
        // camZ -14, by which point the reel is ninety per cent open and the
        // line is sitting on top of the footage. So measure the actual gap
        // between the line and the window edge, and fade on contact.
        const textHalf = basePx * scale * 0.62;
        const clearance = Math.abs(cy) - textHalf - h / 2;
        const vis = Math.min(byDistance, smoothstep(clearance, -46, 4));

        el.style.visibility = vis <= 0.002 ? 'hidden' : 'visible';
        el.style.opacity = String(vis);
        if (vis <= 0.002) continue;

        el.style.transform =
          `translate(-50%, -50%) translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px) scale(${scale.toFixed(4)})`;
      }

      // ── Section cards ────────────────────────────────────────────────────
      // Same trick as the gallery: each has a place on the path, and the
      // projection makes it rush at you. Nothing is being tweened.
      SECTION_CARDS.forEach((card, i) => {
        const el = cardRefs.current[i];
        if (!el) return;

        const cd = f.camZ - card.z;
        const cvis =
          cd <= 0.4 ? 0 : (1 - smoothstep(cd, 6, 10)) * smoothstep(cd, 1.6, 4.5);

        if (cvis <= 0.002) {
          el.style.visibility = 'hidden';
          el.style.opacity = '0';
          return;
        }

        const ck = pxPerUnit(cd, vh);
        // Authored at five units out; scale is how much nearer it is now.
        el.style.visibility = 'visible';
        el.style.opacity = String(cvis);
        el.style.transform =
          `translate(-50%, -50%) scale(${(ck / pxPerUnit(5, vh)).toFixed(4)})`;
      });

      // ── Capabilities, panned sideways ────────────────────────────────────
      // Inside this band the flight stops going forward and starts going
      // across. Scroll still drives it, and it is still the same camZ every
      // other section reads, but here that number becomes a horizontal
      // offset instead of a distance. Nothing about the page scrolls
      // sideways: the track is translated, so the scrollbar, keyboard paging
      // and find-in-page all keep behaving normally.
      const band = bandRef.current;
      const track = trackRef.current;
      if (band && track) {
        const span = HORIZONTAL.from - HORIZONTAL.to;
        const bt = clamp01((HORIZONTAL.from - f.camZ) / span);
        const inside = f.camZ <= HORIZONTAL.from + 3 && f.camZ >= HORIZONTAL.to - 3;

        band.style.visibility = inside ? 'visible' : 'hidden';

        // Only decode the panel videos while the band is actually on screen.
        // Four loops running behind the gallery would cost frames for footage
        // nobody can see.
        if (inside !== bandLive.current) {
          bandLive.current = inside;
          for (const v of capVideos.current) {
            if (!v) continue;
            if (inside && !reduced) v.play().catch(() => {});
            else v.pause();
          }
        }
        if (inside) {
          if (!trackW.current || trackW.current !== track.scrollWidth) {
            trackW.current = track.scrollWidth;
          }
          // t=0 puts the first panel just off the right edge; t=1 has the
          // last one just past the left. One continuous sweep, no snapping.
          const x = vw - bt * (vw + trackW.current);
          track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
        }
      }

      // ── The gallery ──────────────────────────────────────────────────────
      SCREENS.forEach((s, i) => {
        const el = screenRefs.current[i];
        if (!el) return;
        const L = layout[i];
        const d = f.camZ - s.z;

        if (d <= 0.4) {
          el.style.opacity = '0';
          el.style.visibility = 'hidden';
          return;
        }

        const fadeIn = L.crosses
          ? 1 - smoothstep(d, 10, 16)
          : 1 - smoothstep(d, 10, 20);
        const fadeOut = L.crosses ? smoothstep(d, 4, FRAME_D) : 1;
        const vis = Math.min(fadeIn, fadeOut);

        if (vis <= 0.001) {
          el.style.opacity = '0';
          el.style.visibility = 'hidden';
          return;
        }

        // Same fan-out as the 3D gallery: screens arrive down the middle and
        // spread as they approach, so the work opens out of the centre of the
        // frame rather than sliding in from the edges.
        const spread = 1 - smoothstep(d, 6, 30);

        const k = pxPerUnit(d, vh);
        const scale = (L.width * k) / BASE_W;
        const x = L.x * spread * k;
        const y = -(s.y * L.yScale * spread) * k;

        el.style.visibility = 'visible';
        el.style.opacity = String(vis);
        el.style.transform =
          `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
        el.style.zIndex = String(1000 - Math.round(d));
      });
    };

    const tick = (now) => {
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;

      const doc = document.documentElement;

      // The flight maps to the spacer, NOT to the document. Everything after
      // the spacer is ordinary page content, and measuring against
      // scrollHeight would stretch the flight across it: the band would still
      // be sweeping behind the footer.
      const spacer = spacerRef.current || document.querySelector('.scroll-spacer');
      if (spacer && !spacerRef.current) spacerRef.current = spacer;
      const track = spacer
        ? spacer.offsetTop + spacer.offsetHeight - window.innerHeight
        : doc.scrollHeight - window.innerHeight;
      const raw = track > 0 ? clamp01(doc.scrollTop / track) : 0;

      // The spacer's bottom edge reaching the top of the viewport is the
      // moment the page below is guaranteed to fill the screen.
      const covered = spacer
        ? doc.scrollTop >= spacer.offsetTop + spacer.offsetHeight - 1
        : raw >= 0.999;
      const ease = reduced ? 1 : 1 - Math.pow(0.0015, delta);
      smoothed += (raw - smoothed) * ease;

      const f = flightAt(smoothed);
      scrollState.progress = smoothed;
      scrollState.camZ = f.camZ;
      scrollState.portalOpen = f.portalOpen;
      scrollState.portalThrough = f.portalThrough;

      paint(f, covered);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
    };
  }, [reduced, layout, bands]);

  return (
    <div className="flat" ref={rootRef} aria-hidden="true">
      <div className="flat__stars" />
      <div className="flat__wash" ref={washRef} />
      <div className="flat__haze" ref={hazeRef} />
      <div className="flat__grain" />
      <div className="flat__vignette" />
      <div className="flat__parallax" ref={parallaxRef}>

      <div className="flat__reel" ref={reelRef}>
        <video ref={videoRef} muted loop playsInline preload="auto" src="/video/reel.mp4" />
      </div>

      {SECTION_CARDS.map((card, i) => (
        <div
          key={card.id}
          className="flat__card"
          ref={(el) => (cardRefs.current[i] = el)}
        >
          <span className="flat__card-title">{card.text}</span>
        </div>
      ))}

      <section className="flat__band" ref={bandRef} aria-label="How we work">
        <div className="flat__track" ref={trackRef}>
          {BAND_BLOCKS.map((block, i) =>
            block.kind === 'text' ? (
              <p
                key={block.id}
                className={'flat__say flat__say--' + block.size}
                style={{ '--dy': `${block.dy}vh` }}
              >
                {block.text}
              </p>
            ) : (
              <div
                key={block.id}
                className="flat__disc"
                style={{ '--dy': `${block.dy}vh`, '--disc': `${block.disc}vh` }}
              >
                {block.kind === 'video' ? (
                  <video
                    ref={(el) => (capVideos.current[i] = el)}
                    src={block.media}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img src={block.media} alt="" loading="lazy" />
                )}
              </div>
            )
          )}
        </div>
      </section>

      <p className="flat__line" ref={topRef}>{HERO_LINES.top}</p>
      <p className="flat__line" ref={botRef}>{HERO_LINES.bottom}</p>

      {SCREENS.map((s, i) => (
        <figure
          key={s.src}
          className="flat__screen"
          ref={(el) => (screenRefs.current[i] = el)}
        >
          <img src={s.src} alt="" width={BASE_W} height={Math.round(BASE_W / (16 / 10))} />
          <figcaption>
            <span className="flat__tag">{s.tag.toUpperCase()}</span>
            <span className="flat__title">{s.title}</span>
          </figcaption>
        </figure>
      ))}
      </div>
    </div>
  );
}
