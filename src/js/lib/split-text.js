/**
 * Minimal text splitters.
 *
 * Deliberately not GSAP SplitText (a paid plugin) — these cover the two cases
 * the site needs and keep the original string on aria-label so screen readers
 * still read a sentence, not a pile of letters.
 */

/** Wrap every character in <span class="char">, grouped by <span class="word">. */
export function splitChars(el) {
  if (!el || el.dataset.split === 'chars') return [];

  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.textContent = '';

  const chars = [];
  const words = text.split(/\s+/);

  words.forEach((word, i) => {
    const wordSpan = document.createElement('span');
    wordSpan.className = 'word';
    wordSpan.setAttribute('aria-hidden', 'true');

    for (const char of word) {
      const charSpan = document.createElement('span');
      charSpan.className = 'char';
      charSpan.textContent = char;
      wordSpan.appendChild(charSpan);
      chars.push(charSpan);
    }

    el.appendChild(wordSpan);

    if (i < words.length - 1) {
      // A real space node, so the line can still wrap between words
      el.appendChild(document.createTextNode(' '));
    }
  });

  el.dataset.split = 'chars';
  return chars;
}

/** Wrap every word in <span class="word">. Accepts `accentWords` to highlight. */
export function splitWords(el, accentWords = []) {
  if (!el || el.dataset.split === 'words') return [];

  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.textContent = '';

  const accents = accentWords.map((w) => w.toLowerCase());
  const words = text.split(/\s+/);
  const spans = [];

  words.forEach((word, i) => {
    const span = document.createElement('span');
    span.className = 'word';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = word;

    const bare = word.toLowerCase().replace(/[^a-z0-9']/g, '');
    if (accents.includes(bare)) span.classList.add('word--accent');

    el.appendChild(span);
    spans.push(span);

    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
  });

  el.dataset.split = 'words';
  return spans;
}
