import gsap from 'gsap';

/**
 * Client-side validation and submit handling for the enquiry form.
 *
 * There is no backend wired up yet — `submitEnquiry` is the single place to
 * plug one in (see README). Until then the form validates, gives feedback,
 * and refuses to pretend it sent anything it didn't.
 */
export function initContactForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const status = form.querySelector('.form-status');
  const submitButton = form.querySelector('[type="submit"]');
  const honeypot = form.querySelector('[name="company_website"]');

  const validators = {
    name: (v) => (v.trim().length >= 2 ? '' : 'Please enter your name'),
    email: (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
        ? ''
        : 'Please enter a valid email address',
    message: (v) =>
      v.trim().length >= 10 ? '' : 'Tell us a little more — 10 characters min'
  };

  const fields = Object.keys(validators)
    .map((name) => {
      const input = form.querySelector(`[name="${name}"]`);
      if (!input) return null;
      const errorEl = form.querySelector(`[data-error-for="${name}"]`);
      return { name, input, errorEl };
    })
    .filter(Boolean);

  const validateField = ({ name, input, errorEl }) => {
    const message = validators[name](input.value);
    if (errorEl) errorEl.textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  };

  // Validate on blur, then live-correct once the field has been touched
  fields.forEach((field) => {
    field.input.addEventListener('blur', () => validateField(field));
    field.input.addEventListener('input', () => {
      if (field.input.getAttribute('aria-invalid') === 'true') {
        validateField(field);
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // A filled honeypot means a bot. Fail silently — don't teach it why.
    if (honeypot && honeypot.value) return;

    const results = fields.map(validateField);
    if (results.includes(false)) {
      setStatus(status, 'Please fix the highlighted fields.', 'error');
      const firstInvalid = fields.find(
        (f) => f.input.getAttribute('aria-invalid') === 'true'
      );
      firstInvalid?.input.focus();
      shake(form);
      return;
    }

    // No endpoint wired up yet. Say so plainly rather than showing a success
    // message for an enquiry that went nowhere. See submitEnquiry() below.
    if (!form.dataset.endpoint) {
      setStatus(
        status,
        'This form isn’t connected yet — please email hello@arhamentertainment.com',
        'error'
      );
      return;
    }

    submitButton.disabled = true;
    setStatus(status, 'Sending…', 'pending');

    try {
      await submitEnquiry(form.dataset.endpoint, new FormData(form));
      form.reset();
      setStatus(
        status,
        'Thanks — we’ll be in touch within one working day.',
        'ok'
      );
    } catch (error) {
      setStatus(
        status,
        'Something went wrong. Email us directly at hello@arhamentertainment.com',
        'error'
      );
    } finally {
      submitButton.disabled = false;
    }
  });
}

/**
 * Posts the enquiry.
 *
 * To connect the form, put the endpoint on the element:
 *   <form class="contact-form" data-endpoint="https://formspree.io/f/XXXX">
 *
 * Any service taking a multipart POST works (Formspree, Basin, Netlify Forms),
 * or point it at your own serverless function using Resend — the same approach
 * ui-components takes.
 */
async function submitEnquiry(endpoint, formData) {
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response;
}

function setStatus(el, message, state) {
  if (!el) return;
  el.textContent = message;
  el.dataset.state = state;
}

function shake(form) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.fromTo(
    form,
    { x: -8 },
    { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' }
  );
}
