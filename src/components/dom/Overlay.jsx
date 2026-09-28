import { useEffect, useState } from 'react';

const LINKS = [
  ['/work.html', 'Work'],
  ['/services.html', 'Services'],
  ['/about.html', 'Studio'],
  ['/contact.html', 'Contact']
];

/**
 * The header, layered over the flight.
 *
 * The links are plain anchors to real documents: the flight lives on this
 * page and the rest of the site is ordinary HTML, so there is no router here
 * and nothing to keep in sync.
 */
export default function Overlay() {
  const [open, setOpen] = useState(false);

  // The sheet covers the page, so the flight underneath must not scroll
  // behind it.
  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : '';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="overlay">
      {/* The opening headline is drawn inside the flight, where the two halves
          sit at different depths. This is the same sentence as plain text, for
          everything that is not a pair of eyes. */}
      <h1 className="sr-only">Arham Entertainment, we make culture move</h1>

      <header className="hud">
        <a className="hud__brand" href="/">Arham</a>
        <span className="hud__sub">Entertainment</span>

        <nav className="hud__nav" aria-label="Primary">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>

        <a className="hud__cta" href="/contact.html">
          Start a project
        </a>

        {/* Below 52rem the nav is hidden, so without this the home page would
            be the one page with no way to reach the others. */}
        <button
          className="bar__menu hud__menu"
          type="button"
          aria-expanded={open}
          aria-controls="menu"
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>
      </header>

      <div className="sheet" id="menu" data-open={String(open)}>
        <button
          className="sheet__close"
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          Close
        </button>
        <a href="/" aria-current="page">
          Home
        </a>
        {LINKS.map(([href, label]) => (
          <a key={href} href={href} onClick={() => setOpen(false)}>
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}
