/**
 * app.js — Vitaly Executive Chauffeur
 * =====================================
 * Vanilla JS. No dependencies. ES2020+.
 * Served statically from /app.js, loaded with defer.
 *
 * Table of Contents
 * ─────────────────
 * §1  Configuration
 * §2  Utilities
 * §3  Cookie consent & GA4 conditional loading
 * §4  Site header — scroll behaviour, mobile nav
 * §5  Quote widget — tabs, pricing, WhatsApp prefill
 * §6  Booking form — validation, submission, pre-fill from URL
 * §7  FAQ accordion
 * §8  Analytics — conversion event tracking
 * §9  Initialisation
 */

'use strict';


/* ═══════════════════════════════════════════════════════════════════
   §1 — CONFIGURATION
   PLACEHOLDER: Update every value in this block before launch.
   ═══════════════════════════════════════════════════════════════════ */

const CONFIG = Object.freeze({
  /** PLACEHOLDER: Real Irish mobile number, no spaces, with country code */
  phone: '+353XXXXXXXXX',

  /** PLACEHOLDER: Same number, no +, for wa.me links */
  whatsapp: '353XXXXXXXXX',

  /** PLACEHOLDER: GA4 Measurement ID from Google Analytics */
  ga4Id: 'G-XXXXXXXXXX',

  /** Booking form POST endpoint — deployed in deliverable 4 (Cloudflare Worker) */
  bookingEndpoint: '/api/booking',

  /**
   * Popular route flat rates (incl. VAT).
   * Keep in sync with QuoteWidget.astro.
   * PLACEHOLDER: Confirm every price with Vitaly before launch.
   */
  routes: [
    { label: 'Dublin Airport → City Centre',   price: 75 },
    { label: 'Dublin Airport → IFSC',          price: 75 },
    { label: 'Dublin Airport → Ballsbridge',   price: 80 },
    { label: 'Dublin Airport → Sandyford',     price: 90 },
    { label: 'Dublin Airport → Citywest',      price: 85 },
    { label: 'Dublin Airport → Leopardstown',  price: 90 },
    { label: 'Dublin Airport → Malahide',      price: 70 },
    { label: 'City Centre → Dublin Airport',   price: 75 },
    { label: 'IFSC → Dublin Airport',          price: 75 },
    { label: 'Sandyford → Dublin Airport',     price: 90 },
  ],

  /** Cookie preference localStorage key */
  cookieKey: 'cookie_consent_v1',

  /** Scroll distance (px) before header gets solid background */
  headerScrollThreshold: 40,
});


/* ═══════════════════════════════════════════════════════════════════
   §2 — UTILITIES
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Shorthand querySelector — returns null if not found.
 * @param {string} selector
 * @param {Document|Element} [ctx=document]
 * @returns {Element|null}
 */
const $ = (selector, ctx = document) => ctx.querySelector(selector);

/**
 * Shorthand querySelectorAll — always returns an Array.
 * @param {string} selector
 * @param {Document|Element} [ctx=document]
 * @returns {Element[]}
 */
const $$ = (selector, ctx = document) =>
  Array.from(ctx.querySelectorAll(selector));

/**
 * Safe addEventListener — no-op if el is null.
 * @param {EventTarget|null} el
 * @param {string} event
 * @param {EventListenerOrEventListenerObject} fn
 * @param {AddEventListenerOptions} [opts]
 */
const on = (el, event, fn, opts) => el?.addEventListener(event, fn, opts);

/**
 * Returns today's date as an ISO string (YYYY-MM-DD).
 * Used to set `min` on date inputs.
 * @returns {string}
 */
const todayISO = () => new Date().toISOString().split('T')[0];

/**
 * Constructs a wa.me click-to-chat URL with a pre-filled message.
 * @param {string} number  — e.g. '353861234567' (no +)
 * @param {string} message — plain text, will be URI-encoded
 * @returns {string}
 */
const buildWaUrl = (number, message) =>
  `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

/**
 * Fires a Google Analytics 4 event if consent has been granted
 * and the gtag function exists.
 * @param {string} eventName
 * @param {Record<string,unknown>} [params]
 */
const track = (eventName, params = {}) => {
  if (typeof gtag === 'function') {
    gtag('event', eventName, params);
  }
};

/**
 * Smooth-scrolls to an element, accounting for the sticky header height.
 * @param {string|Element} target — CSS selector or Element
 */
function scrollTo(target) {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return;
  const headerH = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--vc-header-h') || '80',
    10
  );
  const top = el.getBoundingClientRect().top + window.scrollY - headerH - 16;
  window.scrollTo({ top, behavior: 'smooth' });
}

/**
 * Reads a named query parameter from the current URL.
 * @param {string} name
 * @returns {string|null}
 */
const getParam = (name) => new URLSearchParams(window.location.search).get(name);


/* ═══════════════════════════════════════════════════════════════════
   §3 — COOKIE CONSENT & GA4 CONDITIONAL LOADING
   ═══════════════════════════════════════════════════════════════════ */

/**
 * @typedef {{ necessary: true, analytics: boolean, marketing: boolean, timestamp: number }} CookieConsent
 */

/** Injects the GA4 gtag.js script. Called only after analytics consent. */
function loadGA4() {
  if (document.getElementById('ga4-script')) return; // already loaded
  const s    = document.createElement('script');
  s.id       = 'ga4-script';
  s.async    = true;
  s.src      = `https://www.googletagmanager.com/gtag/js?id=${CONFIG.ga4Id}`;
  document.head.appendChild(s);
  if (typeof gtag === 'function') gtag('config', CONFIG.ga4Id);
}

/**
 * Sends gtag consent update and conditionally loads GA4.
 * @param {CookieConsent} consent
 */
function applyConsent(consent) {
  if (typeof gtag === 'function') {
    gtag('consent', 'update', {
      analytics_storage: consent.analytics ? 'granted' : 'denied',
      ad_storage:        consent.marketing ? 'granted' : 'denied',
    });
  }
  if (consent.analytics) loadGA4();
}

/**
 * Persists consent, applies it, and hides the banner.
 * @param {CookieConsent} consent
 */
function saveConsent(consent) {
  localStorage.setItem(CONFIG.cookieKey, JSON.stringify(consent));
  applyConsent(consent);
  hideCookieBanner();
  hideCookieModal();
}

function showCookieBanner() {
  const banner = $('#cookie-banner');
  if (!banner) return;
  banner.removeAttribute('hidden');
  requestAnimationFrame(() => banner.classList.add('visible'));
}
function hideCookieBanner() {
  const banner = $('#cookie-banner');
  if (!banner) return;
  banner.classList.remove('visible');
  banner.addEventListener(
    'transitionend',
    () => banner.setAttribute('hidden', ''),
    { once: true }
  );
}
function showCookieModal() {
  const modal = $('#cookie-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.removeAttribute('hidden');
  // Focus first interactive element for accessibility
  $('#cookie-modal-save')?.focus();
}
function hideCookieModal() {
  $('#cookie-modal')?.classList.add('hidden');
}

/**
 * Updates a toggle switch's visual and aria state.
 * @param {HTMLElement} btn
 * @param {boolean} on
 */
function setToggle(btn, on) {
  if (!btn) return;
  btn.setAttribute('aria-checked', String(on));
  btn.classList.toggle('bg-gold-500', on);
  btn.classList.toggle('bg-white/15', !on);

  const knob = btn.querySelector('.toggle-knob');
  if (knob) {
    knob.classList.toggle('translate-x-4', on);
    knob.classList.toggle('translate-x-0', !on);
    knob.classList.toggle('bg-white',      on);
    knob.classList.toggle('bg-white/50',  !on);
  }
}

/** Wires up cookie banner, modal, and preference toggles. */
function initCookieConsent() {
  // Load stored preference first
  const raw = localStorage.getItem(CONFIG.cookieKey);
  if (raw) {
    try {
      const stored = /** @type {CookieConsent} */ (JSON.parse(raw));
      applyConsent(stored);
      // Pre-set modal toggle positions in case user re-opens
      setToggle($('#toggle-analytics'), stored.analytics);
      setToggle($('#toggle-marketing'), stored.marketing);
    } catch {
      localStorage.removeItem(CONFIG.cookieKey);
      showCookieBanner();
    }
  } else {
    showCookieBanner();
  }

  // Accept all
  on($('#cookie-accept'), 'click', () =>
    saveConsent({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() })
  );

  // Reject non-essential
  on($('#cookie-reject'), 'click', () =>
    saveConsent({ necessary: true, analytics: false, marketing: false, timestamp: Date.now() })
  );

  // Open preferences modal
  on($('#cookie-manage'), 'click', showCookieModal);

  // Save from modal
  on($('#cookie-modal-save'), 'click', () => {
    const analytics = $('#toggle-analytics')?.getAttribute('aria-checked') === 'true';
    const marketing = $('#toggle-marketing')?.getAttribute('aria-checked') === 'true';
    saveConsent({ necessary: true, analytics, marketing, timestamp: Date.now() });
  });

  // Close modal
  on($('#cookie-modal-close'),    'click', hideCookieModal);
  on($('#cookie-modal-backdrop'), 'click', hideCookieModal);
  on($('#cookie-modal'), 'keydown', (e) => {
    if (e.key === 'Escape') hideCookieModal();
  });

  // Toggle switches
  ['toggle-analytics', 'toggle-marketing'].forEach((id) => {
    const btn = $(`#${id}`);
    on(btn, 'click', () => {
      const current = btn.getAttribute('aria-checked') === 'true';
      setToggle(btn, !current);
    });
  });

  // Re-open from footer "Manage Cookies" link
  on($('#manage-cookies-footer'), 'click', showCookieBanner);
}


/* ═══════════════════════════════════════════════════════════════════
   §4 — SITE HEADER
   ═══════════════════════════════════════════════════════════════════ */

function initHeader() {
  const header      = $('#site-header');
  const navBtn      = $('#mobile-nav-btn');
  const mobileNav   = $('#mobile-nav');
  const hamburger   = $('#hamburger-icon');
  const closeIcon   = $('#close-icon');

  if (!header) return;

  // ── Scroll: solid background once past threshold ──────────────────
  const inner = header.querySelector(':scope > div');

  function handleScroll() {
    const scrolled = window.scrollY > CONFIG.headerScrollThreshold;
    header.dataset.scrolled = String(scrolled);

    if (!inner) return;
    if (scrolled) {
      inner.classList.add('bg-charcoal-900/97', 'backdrop-blur-md',
                          'shadow-lg', 'shadow-black/40');
    } else {
      inner.classList.remove('bg-charcoal-900/97', 'backdrop-blur-md',
                             'shadow-lg', 'shadow-black/40');
    }
  }

  on(window, 'scroll', handleScroll, { passive: true });
  handleScroll(); // run once on load

  // ── Mobile nav toggle ────────────────────────────────────────────
  if (!navBtn || !mobileNav) return;

  function openMobileNav() {
    mobileNav.classList.remove('hidden');
    navBtn.setAttribute('aria-expanded', 'true');
    hamburger?.classList.add('hidden');
    closeIcon?.classList.remove('hidden');
    // Trap focus: move to first link
    mobileNav.querySelector('a')?.focus();
  }

  function closeMobileNav() {
    mobileNav.classList.add('hidden');
    navBtn.setAttribute('aria-expanded', 'false');
    hamburger?.classList.remove('hidden');
    closeIcon?.classList.add('hidden');
  }

  on(navBtn, 'click', () => {
    const open = navBtn.getAttribute('aria-expanded') === 'true';
    open ? closeMobileNav() : openMobileNav();
  });

  // Close when any nav link is clicked
  $$('a', mobileNav).forEach((link) => on(link, 'click', closeMobileNav));

  // Close on Escape
  on(document, 'keydown', (e) => {
    if (e.key === 'Escape' && navBtn.getAttribute('aria-expanded') === 'true') {
      closeMobileNav();
      navBtn.focus();
    }
  });

  // Close if viewport widens past mobile breakpoint
  const mq = window.matchMedia('(min-width: 1024px)');
  on(mq, 'change', (e) => { if (e.matches) closeMobileNav(); });
}


/* ═══════════════════════════════════════════════════════════════════
   §5 — QUOTE WIDGET
   Handles multiple widget instances (hero + CTA band).
   Each widget has a unique id suffix that avoids DOM collisions.
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Initialises a single quote widget instance.
 * @param {HTMLElement} widgetEl
 */
function initQuoteWidget(widgetEl) {
  const id        = widgetEl.id.replace('quote-widget-', '');
  const waNumber  = widgetEl.dataset.waNumber || CONFIG.whatsapp;

  // ── Tab switching ─────────────────────────────────────────────────
  const tabs      = $$('.quote-tab', widgetEl);
  const panels    = $$('[data-panel]', widgetEl);

  function activateTab(tabName) {
    tabs.forEach((t) => {
      const active = t.dataset.tab === tabName;
      t.setAttribute('aria-selected', String(active));
      t.classList.toggle('bg-gold-500',      active);
      t.classList.toggle('text-charcoal-900', active);
      t.classList.toggle('text-white/60',    !active);
      t.classList.toggle('hover:text-white', !active);
    });
    panels.forEach((p) => {
      if (p.dataset.panel === tabName) {
        p.removeAttribute('hidden');
      } else {
        p.setAttribute('hidden', '');
      }
    });
  }

  tabs.forEach((tab) =>
    on(tab, 'click', () => activateTab(tab.dataset.tab || 'popular'))
  );

  // ── Popular routes: instant price on selection ────────────────────
  const routeSelect = $('[data-route-select]', widgetEl);
  const priceResult = $('[data-price-result]', widgetEl);
  const priceAmount = $('[data-price-amount]', widgetEl);
  const bookRoute   = $('[data-book-route]',   widgetEl);
  const getPriceBtn = $('[data-get-price]',    widgetEl);

  function showPrice() {
    if (!routeSelect?.value) return;

    const option  = routeSelect.options[routeSelect.selectedIndex];
    const price   = Number(routeSelect.value);
    const label   = option?.dataset.label || option?.text || '';

    // Display price
    if (priceAmount) priceAmount.textContent = `€${price}`;
    priceResult?.classList.remove('hidden');

    // Pre-fill booking form when "Book this journey →" is clicked
    if (bookRoute) {
      // Remove any previous listener clone
      const freshLink = bookRoute.cloneNode(true);
      bookRoute.parentNode?.replaceChild(freshLink, bookRoute);

      freshLink.addEventListener('click', (e) => {
        e.preventDefault();
        const serviceEl  = /** @type {HTMLSelectElement|null}  */ ($('#booking-service'));
        const notesEl    = /** @type {HTMLTextAreaElement|null} */ ($('#booking-notes'));
        const pickupEl   = /** @type {HTMLInputElement|null}   */ ($('#booking-pickup'));
        const dropoffEl  = /** @type {HTMLInputElement|null}   */ ($('#booking-dropoff'));

        if (serviceEl)  serviceEl.value  = 'Airport Transfer';
        if (notesEl)    notesEl.value    = `Route: ${label} — €${price} incl. VAT`;
        if (pickupEl  && label.includes('→')) pickupEl.value  = label.split('→')[0].trim();
        if (dropoffEl && label.includes('→')) dropoffEl.value = label.split('→')[1].trim();

        scrollTo('#booking');
      });
    }

    track('quote_submitted', { route: label, price });
  }

  on(routeSelect, 'change', showPrice);
  on(getPriceBtn, 'click',  showPrice);

  // ── Custom route: WhatsApp URL construction ───────────────────────
  const waBtn   = $('[data-wa-custom]',   widgetEl);
  const pickup  = $('[data-custom-pickup]',  widgetEl);
  const dropoff = $('[data-custom-dropoff]', widgetEl);
  const cDate   = $('[data-custom-date]',    widgetEl);
  const cTime   = $('[data-custom-time]',    widgetEl);

  function updateWaHref() {
    if (!waBtn) return;
    const from = pickup?.value  || '(pickup not specified)';
    const to   = dropoff?.value || '(drop-off not specified)';
    const d    = cDate?.value   || '(date not specified)';
    const t    = cTime?.value   || '(time not specified)';
    const msg  =
      `Hi Vitaly, I'd like a quote for a transfer.\n\n` +
      `Pickup:    ${from}\n` +
      `Drop-off:  ${to}\n` +
      `Date:      ${d}\n` +
      `Time:      ${t}\n\n` +
      `Please confirm availability and price.`;
    waBtn.href = buildWaUrl(waNumber, msg);
  }

  [pickup, dropoff, cDate, cTime].forEach((el) =>
    on(el, 'input', updateWaHref)
  );
  updateWaHref(); // set initial href

  on(waBtn, 'click', () =>
    track('whatsapp_clicked', { source: 'quote_widget_custom', widget: id })
  );

  // ── Set date inputs to disallow past dates ────────────────────────
  $$('input[type="date"]', widgetEl).forEach((el) => {
    el.min = todayISO();
  });
}

/** Finds and initialises every quote widget on the page. */
function initQuoteWidgets() {
  $$('[id^="quote-widget-"]').forEach(initQuoteWidget);
}


/* ═══════════════════════════════════════════════════════════════════
   §6 — BOOKING FORM
   Validates, posts to /api/booking, handles success / error states.
   ═══════════════════════════════════════════════════════════════════ */

function initBookingForm() {
  const form      = /** @type {HTMLFormElement|null} */   ($('#booking-form'));
  const successEl = $('#booking-success');
  const errorEl   = $('#booking-error');
  const submitBtn = /** @type {HTMLButtonElement|null} */ ($('#booking-submit'));

  if (!form) return;

  // ── Date min = today ──────────────────────────────────────────────
  const dateEl = /** @type {HTMLInputElement|null} */ ($('#booking-date'));
  if (dateEl) dateEl.min = todayISO();

  // ── Pre-fill from URL query params ────────────────────────────────
  // Service cards link to /#booking?service=airport-transfer
  // Fleet cards link to    /#booking?vehicle=s-class
  const paramService = getParam('service');
  const paramVehicle = getParam('vehicle');

  if (paramService) {
    const serviceEl = /** @type {HTMLSelectElement|null} */ ($('#booking-service'));
    if (serviceEl) {
      const match = Array.from(serviceEl.options).find((o) =>
        o.value.toLowerCase().replace(/\s+/g, '-') === paramService.toLowerCase()
        || o.value.toLowerCase().includes(paramService.toLowerCase())
      );
      if (match) serviceEl.value = match.value;
    }
  }

  if (paramVehicle) {
    const notesEl = /** @type {HTMLTextAreaElement|null} */ ($('#booking-notes'));
    if (notesEl && !notesEl.value) {
      const vehicleLabel = paramVehicle === 's-class'  ? 'Mercedes S-Class'
                         : paramVehicle === 'v-class'  ? 'Mercedes V-Class'
                         : paramVehicle;
      notesEl.value = `Preferred vehicle: ${vehicleLabel}`;
    }
  }

  // ── Live inline validation ────────────────────────────────────────
  // Only mark invalid after the user has interacted with the field.

  /**
   * Marks a field as valid or invalid with an accessible message.
   * @param {HTMLElement} field
   * @param {boolean} valid
   * @param {string} [message]
   */
  function setFieldValidity(field, valid, message = '') {
    field.classList.toggle('is-invalid', !valid);
    const errorMsgId = `${field.id}-error`;
    let errorMsg = document.getElementById(errorMsgId);

    if (!valid && message) {
      if (!errorMsg) {
        errorMsg = document.createElement('p');
        errorMsg.id        = errorMsgId;
        errorMsg.className = 'form-error-msg mt-1';
        errorMsg.setAttribute('role', 'alert');
        field.parentNode?.appendChild(errorMsg);
      }
      errorMsg.textContent = message;
      field.setAttribute('aria-describedby', errorMsgId);
    } else if (errorMsg) {
      errorMsg.remove();
      field.removeAttribute('aria-describedby');
    }
  }

  /** Validates a single field and returns true if valid. */
  function validateField(field) {
    if (!(field instanceof HTMLInputElement
       || field instanceof HTMLSelectElement
       || field instanceof HTMLTextAreaElement)) return true;

    if (field.required && !field.value.trim()) {
      setFieldValidity(field, false, 'This field is required.');
      return false;
    }
    if (field.type === 'email' && field.value) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(field.value.trim())) {
        setFieldValidity(field, false, 'Please enter a valid email address.');
        return false;
      }
    }
    if (field.type === 'tel' && field.value) {
      // Accept Irish and international formats
      const telRe = /^\+?[\d\s\-().]{7,20}$/;
      if (!telRe.test(field.value.trim())) {
        setFieldValidity(field, false, 'Please enter a valid phone number.');
        return false;
      }
    }
    if (field.type === 'date' && field.value) {
      if (field.value < todayISO()) {
        setFieldValidity(field, false, 'Please choose a date in the future.');
        return false;
      }
    }
    setFieldValidity(field, true);
    return true;
  }

  // Validate on blur (after user leaves the field)
  $$('input, select, textarea', form).forEach((field) => {
    let touched = false;
    on(field, 'blur', () => {
      touched = true;
      validateField(field);
    });
    on(field, 'input', () => {
      if (touched) validateField(field);
    });
  });

  /** Runs full form validation and returns true if all fields pass. */
  function validateForm() {
    const fields = $$('input, select, textarea', form);
    let allValid = true;
    fields.forEach((f) => {
      if (!validateField(f)) allValid = false;
    });
    // Focus the first invalid field
    if (!allValid) {
      const firstInvalid = /** @type {HTMLElement|null} */ (
        form.querySelector('.is-invalid')
      );
      firstInvalid?.focus();
    }
    return allValid;
  }

  // ── Form submission ───────────────────────────────────────────────
  on(form, 'submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    errorEl?.classList.add('hidden');
    if (submitBtn) {
      submitBtn.disabled    = true;
      submitBtn.textContent = 'Sending…';
    }

    // Collect form data
    /** @type {Record<string, string>} */
    const payload = {};
    new FormData(form).forEach((value, key) => {
      payload[key] = value.toString();
    });

    try {
      const res = await fetch(CONFIG.bookingEndpoint, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept':       'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      // ── Success ──────────────────────────────────────────────────
      form.classList.add('hidden');
      if (successEl) {
        successEl.classList.remove('hidden');
        successEl.classList.add('flex');
        successEl.focus(); // announce to screen readers via role="alert"
      }

      track('form_submitted', {
        form_type:  'booking',
        service:    payload['service']    ?? '',
        pickup:     payload['pickup']     ?? '',
        dropoff:    payload['dropoff']    ?? '',
      });

    } catch (err) {
      // ── Error: show WA fallback ───────────────────────────────────
      if (errorEl) {
        errorEl.classList.remove('hidden');
        // Update WA fallback link with the form data already entered
        const waFallback = errorEl.querySelector('a[href*="wa.me"]');
        if (waFallback) {
          const msg =
            `Hi Vitaly, I tried to book online but hit an error. Here are my details:\n\n` +
            `Name:      ${payload['name']     || '—'}\n` +
            `Service:   ${payload['service']  || '—'}\n` +
            `Pickup:    ${payload['pickup']   || '—'}\n` +
            `Drop-off:  ${payload['dropoff']  || '—'}\n` +
            `Date/Time: ${payload['date']     || '—'} ${payload['time'] || '—'}\n` +
            `Phone:     ${payload['phone']    || '—'}`;
          waFallback.href = buildWaUrl(CONFIG.whatsapp, msg);
        }
      }

      if (submitBtn) {
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Send Booking Request';
      }

      console.error('[booking form]', err);
    }
  });
}


/* ═══════════════════════════════════════════════════════════════════
   §7 — FAQ ACCORDION
   Single-open accordion with animated grid-template-rows expansion.
   See .faq-body in styles.css for the transition.
   ═══════════════════════════════════════════════════════════════════ */

function initFAQ() {
  const triggers = $$('[data-faq-trigger]');
  if (!triggers.length) return;

  /**
   * @param {Element} trigger
   * @param {boolean} open
   */
  function setFAQItem(trigger, open) {
    const targetId = /** @type {HTMLElement} */ (trigger).dataset.target;
    const body     = targetId ? document.getElementById(targetId) : null;
    const plus     = trigger.querySelector('.faq-plus');
    const minus    = trigger.querySelector('.faq-minus');
    const iconWrap = trigger.querySelector('.faq-icon');

    trigger.setAttribute('aria-expanded', String(open));
    body?.classList.toggle('open', open);

    plus?.classList.toggle('hidden',  open);
    minus?.classList.toggle('hidden', !open);

    iconWrap?.classList.toggle('border-gold-500/40', open);
    iconWrap?.classList.toggle('text-gold-400',       open);
  }

  triggers.forEach((trigger) => {
    on(trigger, 'click', () => {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';

      // Close all others
      triggers.forEach((t) => {
        if (t !== trigger) setFAQItem(t, false);
      });

      // Toggle this one
      setFAQItem(trigger, !isOpen);
    });
  });
}


/* ═══════════════════════════════════════════════════════════════════
   §8 — ANALYTICS TRACKING
   Fires GA4 conversion events on key interactions.
   All tracked elements carry a `data-track` attribute in the HTML.
   ═══════════════════════════════════════════════════════════════════ */

function initAnalyticsTracking() {
  // Generic: any element with data-track="event_name"
  $$('[data-track]').forEach((el) => {
    on(el, 'click', () => {
      const eventName = /** @type {HTMLElement} */ (el).dataset.track;
      if (eventName) {
        track(eventName, {
          source:   el.closest('[id]')?.id ?? 'page',
          label:    el.textContent?.trim().slice(0, 60) ?? '',
        });
      }
    });
  });

  // Phone links — catch any <a href="tel:"> that might not have data-track
  $$('a[href^="tel:"]').forEach((el) => {
    on(el, 'click', () => track('phone_clicked', { source: 'page' }));
  });

  // WhatsApp links — catch any <a href*="wa.me"> not covered by data-track
  $$('a[href*="wa.me"]').forEach((el) => {
    on(el, 'click', () =>
      track('whatsapp_clicked', { source: el.closest('[id]')?.id ?? 'page' })
    );
  });
}


/* ═══════════════════════════════════════════════════════════════════
   §9 — INITIALISATION
   Entry point — runs after DOM is ready.
   ═══════════════════════════════════════════════════════════════════ */

function init() {
  // Cookie consent must run first (controls GA4)
  initCookieConsent();

  // Layout & navigation
  initHeader();

  // Interactive sections
  initQuoteWidgets();
  initBookingForm();
  initFAQ();

  // Passive tracking (after everything is wired up)
  initAnalyticsTracking();
}

// Run immediately if DOM is already parsed, otherwise wait
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
