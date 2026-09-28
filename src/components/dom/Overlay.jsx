import { useEffect, useState } from 'react';

const LINKS = [
  ['/', 'Home'],
  ['/work.html', 'Work'],
  ['/services.html', 'Services'],
  ['/about.html', 'Studio'],
  ['/contact.html', 'Contact']
];

/**
 * The header.
 *
 * Desktop is this page's own bar: wordmark, inline links, one button, no
 * panel behind it. Mobile borrows the other pages' menu instead, because a
 * row of links does not fit and their full-screen panel already solves it.
 *
 * The links are ordinary anchors to real documents. There is no router.
 */
export default function Overlay() {
  const [open, setOpen] = useState(false);

  // The panel covers the page, so the flight underneath must not scroll
  // behind it.
  useEffect(() => {
    document.body.classList.toggle('is-locked', open);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('is-locked');
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
        <a className="hud__brand" href="/">
          Arham
        </a>
        <span className="hud__sub">Entertainment</span>

        <nav className="hud__nav" aria-label="Primary">
          {LINKS.filter(([href]) => href !== '/').map(([href, label]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>

        <a className="hud__cta" href="/contact.html">
          Start a project
        </a>

        {/* Mobile only. Below the breakpoint the links are hidden, so without
            this the home page would be the one page with no way to reach the
            others. */}
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="menu-toggle__bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </header>

      <div className={'mobile-nav' + (open ? ' is-open' : '')} id="mobile-nav">
        <nav aria-label="Mobile">
          <ul className="mobile-nav__list">
            {LINKS.map(([href, label], i) => (
              <li className="mobile-nav__item" key={href}>
                <a
                  className="mobile-nav__link"
                  href={href}
                  onClick={() => setOpen(false)}
                >
                  <span className="mobile-nav__index">
                    {String(i + 1).padStart(2, '0')}
                  </span>{' '}
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mobile-nav__foot">
          <a href="mailto:hello@arhamentertainment.com">
            hello@arhamentertainment.com
          </a>
          <a href="tel:+912266001200">+91 22 6600 1200</a>
          <span>Unit 402, Raghuvanshi Mills, Lower Parel, Mumbai</span>
        </div>
      </div>
    </div>
  );
}
