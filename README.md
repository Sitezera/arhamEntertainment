# Arham Entertainment

Marketing site for an entertainment-first agency. The home page is a
scroll-driven flight; the rest of the site is ordinary HTML pages.

```bash
pnpm install
pnpm dev      # http://localhost:5190
pnpm build
pnpm preview
```

## Pages

| File | What it is |
| --- | --- |
| `index.html` | The flight. Mounts React. |
| `work.html`, `services.html`, `about.html`, `contact.html` | Plain HTML pages, copied from the earlier build of this site |

Add a page by creating the HTML file and listing it in `vite.config.js`.

## The home page

One continuous camera move, driven by scroll position and nothing else. No
WebGL: it is a clipped video, some transformed images and coloured air. The
whole projection is about ten lines in `src/lib/flight.js`.

| Scroll | What happens |
| --- | --- |
| 0-15% | Headline in two halves at two depths, around the reel |
| 15-20% | The reel opens and you pass through it |
| 25-55% | The work gallery, approaching down the middle |
| 60-90% | Capabilities, panned sideways |
| 90-100% | The count, the quotes, the footer |

Everything is tuned from `src/lib/constants.js`: depths, timings, copy, and
`DWELL` for stretches that should scroll slower. `src/lib/atmosphere.js` holds
the colour of the air, keyed by depth and seeded so no two visits match. Share
a particular look with `/#seed=premiere`.

## Structure

```
src/
  lib/          flight maths, atmosphere, constants
  components/   React, home page only
  styles/       home page CSS
  css/ js/      the other pages
```

## Before launch

- **The media is not ours.** Every image and `reel.mp4` came from a reference
  site; `work-03.jpg` still has `Copyright: Dirk Lindert` in its EXIF. The
  three panel videos are of unknown licence. The repo is public.
- Placeholder copy: project names, capability lines, the three figures, and
  all four testimonials with their invented names and companies.
