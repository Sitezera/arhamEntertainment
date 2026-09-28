import {
  START_Z,
  END_Z,
  DWELL,
  PORTAL_Z,
  PORTAL_OPEN_FROM,
  PORTAL_OPEN_TO,
  PORTAL_THROUGH_AT
} from './constants.js';

/** Vertical field of view of the flight, in degrees. Shared by both engines. */
export const FOV = 58;

/** tan(fov / 2) — half the visible height at one unit of distance. */
export const HALF_TAN = Math.tan((FOV * Math.PI) / 360);

export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

export const lerp = (a, b, t) => a + (b - a) * t;

/** Hermite ramp between two edges, matching THREE.MathUtils.smoothstep. */
export function smoothstep(x, min, max) {
  if (x <= min) return 0;
  if (x >= max) return 1;
  const t = (x - min) / (max - min);
  return t * t * (3 - 2 * t);
}

/**
 * The journey, as pure maths.
 *
 * Both engines read this: the WebGL rig moves a real camera down the Z axis,
 * and the CSS fallback projects the same positions by hand. Keeping the
 * definition of the flight in one place is what lets the fallback be the same
 * experience rather than an approximation of it — the beats, the portal
 * timing and the work gallery all key off these three numbers.
 */
/**
 * Scroll does not map to depth at a constant rate.
 *
 * A band listed in DWELL is given more of the scrollbar than its length
 * deserves, so the camera crosses it more slowly. That is the only honest way
 * to slow one moment down: stretching the whole page slows everything, and
 * holding the camera still would break the one rule this thing runs on, which
 * is that the flight is a function of scroll position and nothing else.
 *
 * Built once, at module load, as a list of segments with a share of the bar.
 */
const SEGMENTS = (() => {
  const marks = new Set([START_Z, END_Z]);
  for (const d of DWELL) {
    marks.add(d.from);
    marks.add(d.to);
  }
  // Descending, because the journey runs from START_Z down to END_Z.
  const sorted = [...marks].sort((a, b) => b - a);

  const segs = [];
  let total = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const z0 = sorted[i];
    const z1 = sorted[i + 1];
    const mid = (z0 + z1) / 2;
    const band = DWELL.find((d) => mid <= d.from && mid >= d.to);
    const weight = (z0 - z1) * (band ? band.factor : 1);
    segs.push({ z0, z1, weight });
    total += weight;
  }

  let cursor = 0;
  return segs.map((s) => {
    const share = s.weight / total;
    const seg = { ...s, start: cursor, share };
    cursor += share;
    return seg;
  });
})();

/** Camera Z for a scroll position, honouring the dwell bands. */
export function zAt(progress) {
  const p = clamp01(progress);
  for (let i = 0; i < SEGMENTS.length; i++) {
    const s = SEGMENTS[i];
    if (p <= s.start + s.share || i === SEGMENTS.length - 1) {
      const t = s.share === 0 ? 0 : (p - s.start) / s.share;
      return lerp(s.z0, s.z1, clamp01(t));
    }
  }
  return END_Z;
}

export function flightAt(progress) {
  const camZ = zAt(progress);

  // How far through the portal plane are we? 0 while it is still a framed
  // screen ahead of you, 1 once it has opened past the edges of the view.
  const dist = Math.abs(camZ - PORTAL_Z);
  const portalOpen = clamp01(
    (PORTAL_OPEN_FROM - dist) / (PORTAL_OPEN_FROM - PORTAL_OPEN_TO)
  );

  // Signed, not absolute: this only ramps as you close the last few units and
  // cross the plane, so the reel dissolves exactly as you enter it rather
  // than hanging around magnified behind you.
  const portalThrough = clamp01(
    (PORTAL_Z + PORTAL_THROUGH_AT - camZ) / PORTAL_THROUGH_AT
  );

  return { camZ, portalOpen, portalThrough };
}

/**
 * How many screen pixels one world unit covers at a given distance ahead of
 * the camera. This is the whole of the perspective projection: the CSS
 * fallback needs nothing else to place the gallery where the camera would.
 */
export function pxPerUnit(distance, viewportHeight) {
  return viewportHeight / (2 * distance * HALF_TAN);
}
