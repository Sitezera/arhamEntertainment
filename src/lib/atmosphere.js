/**
 * The atmosphere the flight passes through.
 *
 * The corridor used to be one flat black from end to end, which made a
 * nine-screen scroll feel like one screen repeated. This gives the journey
 * weather: the air is graded along its length, and there is haze in it, so
 * you can see that you have gone somewhere.
 *
 * It is written rather than filmed: the grade and the haze are generated,
 * not authored by hand, from one fixed arrangement.
 *
 * The grade is not sky. This is an entertainment company, so the reference is
 * a venue: cold and empty before the lights, ember while the reel is burning
 * through, graphite where the work has to be legible, and a low warm horizon
 * at the end where the house lights come up.
 */

/** mulberry32 — eight lines, full 2^32 period, reproducible. */
export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The haze arrangement is fixed. It used to be drawn from a seed written into
 * the URL, which meant every visitor got a different room and the address bar
 * grew a "#seed=2530252984" nobody asked about. One good arrangement, chosen
 * once, is simpler and it is what a client would expect to see twice.
 */
export const HAZE_SEED = 20260928;

/** Stations along the flight. Z descends, so these are in journey order. */
export const GRADE = [
  // Before the lights: black, and meant to be. The opening frame is the reel
  // glowing in an unlit room, so the room gets no colour of its own. The
  // grade still reads, because everything after this station is coloured and
  // the first move out of black is the most legible change on the page.
  // Not pure #000: that kills the haze and flattens the star field.
  { z: 7, bg: '#08080a', fog: '#141419', near: 14, far: 150 },
  // The reel burning through. The air takes its colour and closes in.
  { z: -20, bg: '#3a1105', fog: '#7a2c09', near: 7, far: 62 },
  // Out the other side: cold steel, the opposite of what you just left.
  { z: -34, bg: '#05202e', fog: '#0c4a63', near: 11, far: 110 },
  // The gallery: violet graphite, dark enough that the work is the brightest
  // thing in frame and every screen reads against the same neutral.
  { z: -104, bg: '#120c26', fog: '#2c2456', near: 14, far: 150 },
  // House lights.
  { z: -142, bg: '#2a1a06', fog: '#6b4410', near: 16, far: 120 }
];

const hex = (s) => [
  parseInt(s.slice(1, 3), 16) / 255,
  parseInt(s.slice(3, 5), 16) / 255,
  parseInt(s.slice(5, 7), 16) / 255
];

const mixRgb = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t
];

export const toCss = (rgb) =>
  `rgb(${Math.round(rgb[0] * 255)} ${Math.round(rgb[1] * 255)} ${Math.round(rgb[2] * 255)})`;

/** The air at a given camera Z, interpolated between stations. */
export function gradeAt(z) {
  let i = 0;
  while (i < GRADE.length - 2 && z < GRADE[i + 1].z) i++;

  const a = GRADE[i];
  const b = GRADE[i + 1];
  const span = a.z - b.z;
  const t = span === 0 ? 0 : Math.min(Math.max((a.z - z) / span, 0), 1);
  // Smoothed, so a station is a place the air settles into rather than a
  // corner it turns.
  const e = t * t * (3 - 2 * t);

  return {
    bg: mixRgb(hex(a.bg), hex(b.bg), e),
    fog: mixRgb(hex(a.fog), hex(b.fog), e),
    near: a.near + (b.near - a.near) * e,
    far: a.far + (b.far - a.far) * e
  };
}

/**
 * Haze banks, dealt from the seed.
 *
 * Bands are spread down the corridor with gaps between them, because haze
 * everywhere is the same as haze nowhere — you only read it as atmosphere
 * when you pass from clear air into it and out again.
 */
export function dealHaze(seed, count) {
  const rnd = mulberry32(seed);
  const bands = [];
  const n = 5;

  for (let i = 0; i < n; i++) {
    // Spread across the journey but starting after the opening: the first
    // frame should be deep and clear, with the reel the only lit thing in it.
    // Haze arriving with the reel is what makes the reel look like it is
    // lighting something.
    const t = 0.17 + 0.78 * (i / (n - 1));
    const z = 7 + (-142 - 7) * (t + (rnd() - 0.5) * 0.09);
    bands.push({
      z,
      depth: 14 + rnd() * 16,
      radius: 13 + rnd() * 9,
      y: (rnd() - 0.5) * 7,
      density: 0.45 + rnd() * 0.55
    });
  }

  const total = Math.max(12, count);
  const puffs = [];
  let made = 0;

  while (made < total) {
    for (const band of bands) {
      if (made >= total) break;
      const share = Math.round((total / n) * band.density);
      for (let k = 0; k < share && made < total; k++) {
        const a = rnd() * Math.PI * 2;
        const r = Math.sqrt(rnd()) * band.radius;
        puffs.push({
          x: Math.cos(a) * r,
          y: band.y + Math.sin(a) * r * 0.42,
          z: band.z + (rnd() - 0.5) * band.depth,
          size: 7 + rnd() * 13,
          alpha: 0.03 + rnd() * 0.08,
          drift: 0.1 + rnd() * 0.35
        });
        made++;
      }
    }
  }

  return { bands, puffs };
}
