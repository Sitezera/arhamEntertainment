/**
 * The whole experience is one axis: the camera flies from START_Z to END_Z as
 * you scroll. Everything else is placed along that line, so tuning the journey
 * means editing this file and nothing else.
 */

export const START_Z = 7;
export const END_Z = -172;

/** How many viewport-heights of scrollbar the flight is spread over. */
export const SCROLL_PAGES = 11;

/**
 * Stretches of the path that get more of the scrollbar than their length
 * deserves, so the camera crosses them more slowly. `factor: 1.1` is ten per
 * cent more scrolling for the same distance.
 */
export const DWELL = [
  // The work title arriving out of the dark. It was going past in half a
  // screen of scrolling, which is not long enough to read a section name.
  { from: -20, to: -30, factor: 1.1 }
];

/** The video you fly through. Sits between the title and the work. */
export const PORTAL_Z = -20;

/** Distance at which the portal begins opening, and at which it is fully open. */
export const PORTAL_OPEN_FROM = 26;
export const PORTAL_OPEN_TO = 5;

/**
 * The portal plane, and the fraction of it the closed window shows.
 * The hero lines are laid out around that window and the shader masks to it,
 * so both read these rather than each carrying their own copy.
 */
export const PORTAL_PLANE = { w: 38, h: 22 };
export const PORTAL_WINDOW = { x: 0.13, y: 0.075 };

/**
 * The headline the reel sits inside, split so the video falls mid-sentence.
 *
 * The two halves are not at the same depth. "WE MAKE" hangs close to the
 * camera and "CULTURE MOVE" hangs well beyond it, with the reel between them.
 * At the top of the page they compose as one flat line, because each half is
 * authored at a size proportional to its own distance. The moment you scroll,
 * that agreement breaks: the near half swells and rushes past your shoulder
 * while the far half is still approaching. The sentence comes apart in depth
 * rather than sliding away, which is the whole point of building this in a
 * volume instead of a timeline.
 */
export const HERO_LINES = { top: 'WE MAKE', bottom: 'CULTURE MOVE' };

/** Depths of the two halves. Both sit in front of the reel, so neither is
 *  occluded by the portal plane as it opens. */
export const HERO_NEAR_Z = -8;
export const HERO_FAR_Z = -16;

/** Units before the plane at which the reel starts dissolving as you enter. */
export const PORTAL_THROUGH_AT = 7;

/** Narrative beats, as camera-Z ranges. The DOM overlay reads these. */
// No 'intro', 'portal' or 'work' beat. The opening headline is set in the
// scene around the reel, the reel opening needs no caption, and the work
// section announces itself with a card that flies past you - see SECTION_CARDS,
/**
 * The flight ends when the horizontal band does. Everything after it is an
 * ordinary scrolling document, so there are no beats: the copy that used to
 * float over the fixed layer is real page content now, and the address sits
 * in the footer where people look for it.
 */

/**
 * Cards that announce a section, set on the flight path rather than in the
 * overlay. The point of them is the approach: each starts as a speck in the
 * middle of the frame, grows as you close on it, and is gone past your
 * shoulder before the section's content arrives.
 */
export const SECTION_CARDS = [{ id: 'work', z: -30, text: 'Our Works' }];

/**
 * The stretch of path given over to the horizontal band.
 *
 * Inside it the camera stops being something you fly forward through and
 * becomes something you track sideways past. That is deliberate: the gallery
 * already uses depth-approach, and announcing a second section with a flying
 * card and then flying at its contents would be the same section twice with
 * different words in it. The band also carries its own name, so it needs no
 * card to announce it.
 */
export const HORIZONTAL = { from: -112, to: -168 };

/**
 * The count, and the quotes below it. Both are ordinary sections in the
 * document after the flight, not layers over it.
 *
 * PLACEHOLDER FIGURES. None of these came from Arham. They are deliberately
 * round rather than fake-precise, because "60+" reads as an estimate and
 * "63.4%" reads as a measurement nobody took. Replace before launch.
 */
export const STATS = [
  { id: 'since', figure: '2014', label: 'Working out of Mumbai since' },
  { id: 'shipped', figure: '60+', label: 'Campaigns shipped' },
  { id: 'reach', figure: '9', label: 'Countries the work has played in' }
];

/**
 * Testimonials, as a bento of four cells for four quotes. Two cells carry
 * real visual weight (a photograph and an accent field) so the grid is not
 * four identical text boxes, and the wide/narrow rhythm keeps it from reading
 * as a table.
 *
 * PLACEHOLDER COPY. Every name, role and company below is invented.
 */
export const TESTIMONIALS = [
  {
    id: 't1',
    span: 'wide',
    image: '/images/tex-04.jpg',
    quote: 'They cut three weeks off our launch and the film still landed.',
    name: 'Ritika Malhotra',
    role: 'Head of Brand, Nilaya Studios'
  },
  {
    id: 't2',
    span: 'narrow',
    quote: 'They asked what the film was for before asking what it should look like.',
    name: 'Farhan Qureshi',
    role: 'Marketing Director, Kavach Sports'
  },
  {
    id: 't3',
    span: 'narrow',
    quote: 'We came for one campaign and have not briefed anyone else since.',
    name: 'Ananya Iyer',
    role: 'Founder, Sur and Script'
  },
  {
    id: 't4',
    span: 'wide',
    accent: true,
    quote: 'Our team is small. They worked like an extension of it, not a vendor to it.',
    name: 'Dev Raghunathan',
    role: 'VP Growth, Meridian Live'
  }
];

/**
 * The band's contents: sentences and circular media, alternating.
 *
 * No headings. A heading plus a body line, repeated four times, is a spec
 * table however you lay it out. Here the sentence IS the content, set big or
 * small so the eye is led rather than marched, and the circles break the run
 * of text the way a photograph breaks a column.
 *
 * `dy` is a vertical offset in vh, `disc` a circle diameter in vh. Both vary
 * per block on purpose: nothing in this band shares a baseline.
 */
export const BAND_BLOCKS = [
  {
    id: 's1',
    kind: 'text',
    size: 'big',
    dy: -6,
    text: 'We decide where an idea lands before anyone films a frame of it.'
  },
  {
    id: 'm1',
    kind: 'video',
    media: '/video/aa1d92adca1d405df1ee55769e132d64_720w.mp4',
    disc: 29,
    dy: -15
  },
  {
    id: 's2',
    kind: 'text',
    size: 'small',
    dy: 13,
    text: 'Shot, cut and graded in house, for screens of every size.'
  },
  {
    id: 'm2',
    kind: 'video',
    media: '/video/5637519c55ffed95a9db801261f046fb_720w.mp4',
    disc: 23,
    dy: 9
  },
  {
    id: 's3',
    kind: 'text',
    size: 'big',
    dy: -9,
    text: 'Built for the feed it lives in, not trimmed down to fit it.'
  },
  {
    id: 'm3',
    kind: 'video',
    media: '/video/5edc78c46560ddd2402db608b7c02c29_720w.mp4',
    disc: 32,
    dy: -5
  },
  {
    id: 's4',
    kind: 'text',
    size: 'small',
    dy: 14,
    text: 'Rooms, stages, and a crowd that leaves still talking about it.'
  },
  {
    id: 'm4',
    kind: 'image',
    media: '/images/tex-01.jpg',
    disc: 26,
    dy: 3
  }
];


/**
 * The work gallery. Screens float either side of the flight path; `side`
 * flips them so the camera threads between them rather than through them.
 */
export const SCREENS = [
  { src: '/images/work-01.jpg', z: -52, side: -1, y: 0.4, scale: 7.5, title: 'Midnight Reel', tag: 'Film launch' },
  { src: '/images/tex-02.jpg', z: -62, side: 1, y: -1.6, scale: 5.6, title: 'Sound of the City', tag: 'Festival' },
  { src: '/images/work-03.jpg', z: -72, side: -1, y: -2.2, scale: 6.2, title: 'Turf Wars', tag: 'Sport' },
  { src: '/images/work-04.jpg', z: -82, side: 1, y: 1.8, scale: 8.0, title: 'First Light', tag: 'Brand' },
  { src: '/images/tex-03.jpg', z: -93, side: -1, y: 1.2, scale: 6.6, title: 'The Long Weekend', tag: 'Streaming' },
  { src: '/images/work-02.jpg', z: -104, side: 1, y: -0.8, scale: 7.0, title: 'Northline Sessions', tag: 'Music' }
];

/** Device tiering. Now only sizes the haze bank. */
export function detectTier() {
  if (typeof window === 'undefined') return 'high';
  const ua = navigator.userAgent || '';
  const mobile = /iPhone|iPad|iPod|Android/i.test(ua);
  const weakCPU = (navigator.hardwareConcurrency || 8) <= 4;
  const lowRAM = (navigator.deviceMemory || 8) <= 4;
  const small = window.innerWidth < 500;
  if (mobile || weakCPU || lowRAM || small) return 'low';
  if ((navigator.hardwareConcurrency || 8) <= 8) return 'mid';
  return 'high';
}

export const TIER_SETTINGS = {
  low: { haze: 34 },
  mid: { haze: 70 },
  high: { haze: 120 }
};
