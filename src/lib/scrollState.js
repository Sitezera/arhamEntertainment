/**
 * One mutable object shared between the R3F frame loop and the DOM overlay.
 *
 * Both read and write it inside their own animation frames, so scroll position
 * never becomes React state. Putting a 60fps value in useState would re-render
 * the whole tree every frame and collapse on mobile.
 */
export const scrollState = {
  /** 0 → 1 across the whole flight */
  progress: 0,
  /** Where the camera actually is, after smoothing */
  camZ: 0,
  /** 0 → 1 as the reel portal opens up around you */
  portalOpen: 0,
  /** 0 → 1 across the last few units, as you actually pass through the plane */
  portalThrough: 0,
  /** Scroll velocity, for motion-reactive touches */
  velocity: 0
};
