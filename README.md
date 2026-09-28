# Arham 3D — Into the Frame

A scroll-driven 3D site for Arham Entertainment. One continuous camera flight:
you start in open space, fly *into* a video, pass through a gallery of work,
and come out at a contact line.

Built with React 19, Vite and React Three Fiber. Inspired by `portfolio-itom`,
but it is not a copy of it — the differences are listed below, and they are the
interesting part.

```bash
pnpm install
pnpm dev      # http://localhost:5190
pnpm build
pnpm preview
```

## The flight

The whole experience is a single axis. The camera travels from `START_Z` to
`END_Z` as you scroll, and everything else is placed along that line.

`src/lib/constants.js` is the only tuning surface. Moving a work screen,
re-timing the portal, adding a narrative beat or changing the length of the
scroll are all edits to that one file:

| Constant | What it controls |
| --- | --- |
| `START_Z` / `END_Z` | Where the flight begins and ends |
| `SCROLL_PAGES` | How many viewport-heights of scrollbar it is spread over |
| `PORTAL_Z`, `PORTAL_OPEN_FROM/TO`, `PORTAL_THROUGH_AT` | When the reel opens and when you pass through it |
| `SECTION_CARDS` | The cards that fly at you to announce a section |
| `CAPABILITIES` | What we do, placed along the path after "How we work" |
| `DWELL` | Stretches that get extra scrollbar, so the camera crosses them slower |
| `GRADE` (atmosphere.js) | The colour of the air, keyed by camera Z |
| `BEATS` | DOM copy, as camera-Z ranges |
| `SCREENS` | The work gallery: image, depth, side, size, caption |
| `TIER_SETTINGS` | Per-device DPR, particle count, fog distance |

## The order of the flight

The Z axis is the running order, and the sections are spaced so they never
share the frame:

| Camera Z | Scroll | What is on screen |
| --- | --- | --- |
| +7 to -16 | 0-10% | The headline, in two halves at two depths, around the closed reel |
| -16 to -20 | 10-13% | The reel opens and you pass through it |
| -20 to -29 | 13-20% | "Our Works" arrives as a speck and sweeps past |
| -32 to -104 | 25-55% | The gallery, fanning out of the centre as it approaches |
| -112 to -168 | 60-90% | The capabilities band, panned right to left |
| -176 to -190 | 95-100% | The address |

Three rules hold that together, and each is easy to break by moving a number:

- The reel fills the frame until the camera reaches the portal plane, so
  nothing else may fade up before Z -20 or it washes out against the video.
- A work screen starts appearing 20 units out, so the first one at Z -52
  cannot appear before Z -32, which is after the title card has gone.
- The horizontal band owns Z -112 to -168 outright. Nothing else may be
  placed there, because inside it the axis means something different.

## The horizontal band

The gallery already uses depth-approach: things arrive down the middle and
grow. Doing that twice, with a flying card to announce each, would be the same
section built twice with different words in it.

So between Z -112 and -168 the axis changes meaning. Scroll still drives the
same `camZ` every other section reads, but here that number becomes a
horizontal offset: a track of panels is translated from just off the right
edge to just past the left, one continuous sweep. Nothing about the page
scrolls sideways, so the scrollbar, keyboard paging and find-in-page all keep
behaving normally, and the track is clipped by the band so the document never
gets wider than the viewport.

The band opens with its own name, which is why it needs no card. `How we work`
is simply the first panel in the track.

### Nothing in the band shares a baseline

Panels carry circular media discs, duotoned toward the accent. Three of the
four are video, one is a still, and every one of them differs in three ways
set per panel in `CAPABILITIES`:

| Field | What it does |
| --- | --- |
| `disc` | Diameter of the circle, in vh |
| `dy` | Vertical offset, in vh, so no two hang at the same height |
| `above` | Flips the text over the circle instead of under it |

A row of equal tiles on one line is a table. Varying all three is what makes
the band read as things suspended in the same volume the rest of the flight
moves through, rather than as a spec sheet that happens to scroll sideways.

The disc videos only decode while the band is on screen. Four loops running
behind the gallery would cost frames for footage nobody can see, so the same
visibility test that shows the band also plays and pauses them, and
`prefers-reduced-motion` keeps them on their first frame.

### Dwell

Scroll does not map to depth at a constant rate. `DWELL` in `constants.js`
lists bands that get more of the scrollbar than their length deserves:

```js
{ from: -20, to: -30, factor: 1.1 }   // the work title, 10% more scrolling
```

That band takes 5.79% of the bar where its length would earn 5.29%. It is the
only honest way to slow one moment down: lengthening the page slows
everything, and holding the camera still would break the rule the whole thing
runs on, which is that the flight is a function of scroll position and nothing
else. `flight.js` builds the segment table once at module load.

## What differs from itom

**Scroll, not wheel hijack.** itom intercepts wheel events and drives its own
virtual position. This reads the real document scroll and eases toward it.
Native scrolling keeps working: trackpad momentum, scrollbar drag, Page Down,
find-in-page and deep links all behave, and with no scroll listener anywhere
there is nothing to fight the browser for the frame. The easing is frame-rate independent
(`1 - Math.pow(0.0015, delta)`), so it feels identical at 60 Hz and 120 Hz.

**A video, not a door.** itom opens a physical door and walks you through a
frame. Here the reel *is* the portal: far away it is a small lit rectangle, and
as you approach, a rounded clip opens it to full screen while the video fills
the growing window rather than the element. Crossing the plane dissolves it,
so you are never left staring at magnified footage with nowhere to go.

**No human figure, no corridor walls.** Depth is communicated by things you
pass: a sparse star field, and banks of haze with clear air between them.
Nothing encloses you in a tube.

**The sentence has depth.** "WE MAKE" hangs close to the camera and "CULTURE
MOVE" well beyond it, with the reel between them. Each half is authored at a
size proportional to its own distance, so at the top of the page they land the
same size and read as one flat line. Scroll, and that agreement breaks: the
near half swells and is past your shoulder while the far half is still coming.
That is the argument for building this in a volume rather than on a timeline.

**Type rides the camera, not a timeline.** The headline, the section card and
the work captions are all placed in the world at a depth. Nothing scales them:
they grow because you are approaching them, which is why none of it needs a
tweening library.

**Scroll state is not React state.** `src/lib/scrollState.js` is a plain mutable
object shared between the render loop and the DOM overlay's own rAF. Putting a
60 fps value in `useState` would re-render the tree every frame.

## Responsive

Depth-placed layout has no equivalent of a CSS clamp: a fixed size in world
units is a different fraction of every viewport. The gallery and the headline
therefore measure the visible rectangle at the distance they are read, and size
themselves from it.

The gallery has two layouts, chosen by viewport **aspect** (not width — width
calls a landscape phone a desktop), blended across the middle so tablets have no
hard jump:

- **Landscape** — screens keep their authored size and stand beside the flight
  path; the camera threads past and they sweep out through the edge of frame.
  Captions hang off the *inner* edge, which is the half that stays on screen.
- **Portrait** — there is no room beside the path, so screens shrink to the
  frame and centre on it, and the camera flies through them. They fade one at a
  time and dissolve before contact. Captions stack instead of sitting on
  opposite edges, where a title's tail and its tag would meet in the middle.

## The atmosphere

The corridor used to be one flat black from end to end, which made a
nine-screen scroll feel like one screen repeated. `src/lib/atmosphere.js`
gives the journey weather, and it is written rather than filmed.

**Graded air, poured into a pool of light.** A flat field of near-black can
change hue without anyone noticing, which is exactly what happened the first
time: the values were provably different and nobody could see it. The grade
now also drives `.flat__wash`, a soft radial pool tinted by the fog colour, so
you read coloured light falling on something rather than a background swatch
being swapped. `GRADE` is a table of stations keyed by camera Z, and both the
background and the fog are sampled from it — they have to be the same colour,
or fog reads as a grey veil in front of a black wall. The grade is not sky:
this is an entertainment company, so the reference is a venue. Cold and empty
before the lights, ember while the reel burns through, graphite where the work
has to be legible, and a low warm horizon at the end. Changing the mood of the
whole journey is editing that one table.

**Haze, dealt from a seed.** Banks of light haze sit in bands along the path,
with clear air between them — haze everywhere is the same as haze nowhere; you
only read it as atmosphere when you pass from clear air into it and out again.
The bands come from a seeded generator, so two visits are not the same room,
and any particular night can be brought back from the URL:

```
/#seed=premiere      any word works — it is hashed
/#seed=2957449661    or the number the page wrote back
```

An empty fragment draws a fresh seed and writes it back with `replaceState`,
so the address bar always names the room you are standing in. Both engines
read the same seed, so a shared link shows the same night on either.

The haze takes its tint from the grade, because haze is only ever the colour of
whatever is lighting it, and it fades out while you are inside the reel —
additive haze over a full-frame video just fogs the footage. The puff texture
is drawn on a canvas at runtime, so none of this adds image bytes to the build.

## No WebGL

There was a three.js engine here. It was removed, and the CSS renderer that
had been the fallback became the only one.

Nothing in this scene is 3D rendering. It is a clipped video, some transformed
images, and coloured air. The entire projection is in `src/lib/flight.js`:
camera Z from scroll, and one function that says how many pixels a world unit
covers at a given distance. `CssFlight.jsx` reads those numbers and writes
transforms. The reel opens with `clip-path: inset(... round ...)` over a
full-bleed `<video>`, so the footage fills the opening rather than the element
— which is exactly what the shader's mask did. The accent rim survives as a
`drop-shadow`, which follows a clipped silhouette.

What that bought:

| | Before | After |
| --- | --- | --- |
| Download | ~363 kB gzipped | ~74 kB gzipped |
| Dependencies | three, @react-three/fiber, @react-three/drei, troika | react, react-dom |
| Source files | 20 | 8 |
| Type | SDF glyphs in a canvas | real selectable DOM text |
| GPU context loss | takes the page to a white screen | cannot happen |

That last row is the real reason. On a hybrid-graphics Linux laptop, Chrome
crashes its own GPU process trying to share buffers between the integrated and
discrete cards:

```
ERROR:ui/gfx/linux/gbm_wrapper.cc] nullptr returned from gbm_bo_import
ERROR:exit_code.cc] Restarting GPU process due to unrecoverable error.
```

Every WebGL context on the machine dies with it, and after a few retries
Chrome blocklists the page: "Web page caused context loss and was blocked".
No page-level code can recover from that. Setting Chrome's ANGLE backend to
Vulkan avoided it, but a site that needs a browser flag is a broken site. With
no GPU context to lose, the failure mode is gone rather than handled.

## Accessibility

- All narrative copy is DOM text in `Overlay.jsx`, so it is selectable,
  findable and screen-readable. The scene contains one short cue and the work
  captions; the headline is never duplicated between the two layers.
- `prefers-reduced-motion: reduce` maps the camera 1:1 to scroll with no easing,
  disables pointer parallax and beat transitions, and holds the reel on its
  first frame. The portal still opens and is still flown through — that motion
  is caused by the visitor's own scrolling.
- `<noscript>` carries the name, the pitch and the email address.

## Performance

`detectTier()` now only sizes the haze bank: 34 puffs on a phone, 120 on a
desktop. Everything else is the same work at every tier, because the work is
a handful of transforms on a handful of elements.

One rAF loop drives the whole page. It reads `document.scrollTop`, eases it,
and writes transforms — no scroll listener, no per-frame layout reads (text
widths are measured once per viewport), and nothing animated but `transform`,
`opacity`, `clip-path` and `background-color`.

Current build: ~74 kB gzipped total, of which React and React-DOM are about
67 kB. The page's own code is roughly 7 kB. There is no vendor chunk to split
and nothing to lazy-load.

## Before this goes live

- **`public/video/reel.mp4` and `public/images/*.jpg` are placeholders and are
  not ours to publish.** They were carried over from the RaDins/Jomor reference
  clone; `work-03.jpg` still carries `Copyright: Dirk Lindert` in its EXIF.
  Replace every one of them with Arham's own footage and stills before launch.
- The six entries in `SCREENS` have invented project names and tags. Replace
  them with real work.
- `window.__rig` and `window.__scene` are exposed on purpose, so the flight can
  be measured from a headless browser. Remove them if that is not wanted.
