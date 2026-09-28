/**
 * The header, layered over the flight.
 *
 * It used to carry the narrative beats too, fading them in and out from a rAF
 * reading camera position. Those are gone: the flight now ends at the
 * horizontal band and everything after it is ordinary page content, so there
 * is nothing left to float over the fixed layer but the header itself. No
 * loop, no refs, no state.
 */
export default function Overlay() {
  return (
    <div className="overlay">
      {/* The opening headline is drawn inside the flight, where the two halves
          sit at different depths. This is the same sentence as plain text, for
          everything that is not a pair of eyes. */}
      <h1 className="sr-only">Arham Entertainment, we make culture move</h1>

      <header className="hud">
        <span className="hud__brand">Arham</span>
        <span className="hud__sub">Entertainment</span>
        <a className="hud__cta" href="mailto:hello@arhamentertainment.com">
          Start a project
        </a>
      </header>
    </div>
  );
}
