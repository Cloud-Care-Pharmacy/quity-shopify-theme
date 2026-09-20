/* ============================================================
   Quity Homepage — behaviours for the qhm- sections.
   Vanilla JS, no dependencies. Everything binds inside its own
   section root so sections stay independent of each other:

   1. Hero video                         [data-qhm-hero-video]
      Attaches the video source only when the visitor has not asked
      for reduced motion or reduced data; otherwise the poster stays.
   2. Savings calculator                 [data-qhm-savings]
      count (1–40) × cost per cigarette → day / week / year, en-AU.
   3. Carousels (facts, guided)          [data-qhm-carousel]
      Dots jump, arrows step with wraparound, no autoplay.
   4. FAQ accordion (single open)        [data-qhm-faq]
   5. Application form validation        [data-qhm-apply-form]
   6. Mailing list validation            [data-qhm-mail-form]

   Same shape as assets/product-store.js / assets/shop-collections.js,
   including the shopify:section:load re-init guard.
   ============================================================ */
(function () {
  'use strict';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  /* Australian mobile: 04xx xxx xxx or +61 4xx xxx xxx (spaces, dashes,
     brackets and dots tolerated; normalised to +614xxxxxxxx on submit). */
  var AU_MOBILE_RE = /^(?:\+?61|0)4\d{8}$/;

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function saveData() {
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return !!(c && c.saveData);
  }

  /* ---------- 1. Hero video ---------- */
  function initHeroVideo(video) {
    var src = video.getAttribute('data-qhm-video-src');
    if (!src) return;
    if (reducedMotion() || saveData()) return; /* poster only */
    var type = video.getAttribute('data-qhm-video-type');
    var source = document.createElement('source');
    source.src = src;
    if (type) source.type = type;
    video.muted = true;
    video.setAttribute('muted', '');
    video.appendChild(source);
    video.load();
    var p = video.play();
    if (p && typeof p.catch === 'function') p.catch(function () { /* autoplay blocked: poster stays */ });
  }

  /* ---------- 2. Savings calculator ---------- */
  function money(n, locale) {
    var s;
    try {
      s = n.toLocaleString(locale || 'en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch (e) {
      s = n.toFixed(2);
    }
    return '$' + s;
  }

  function initSavings(root) {
    var range = root.querySelector('[data-qhm-range]');
    if (!range) return;
    var perCig = parseFloat(root.getAttribute('data-qhm-per-cig'));
    if (isNaN(perCig) || perCig <= 0) perCig = 2.5;
    var locale = root.getAttribute('data-qhm-locale') || 'en-AU';
    var els = {
      count: root.querySelectorAll('[data-qhm-count]'),
      day: root.querySelector('[data-qhm-day]'),
      week: root.querySelector('[data-qhm-week]'),
      year: root.querySelector('[data-qhm-year]')
    };

    function render() {
      var n = parseInt(range.value, 10);
      if (isNaN(n)) n = 1;
      var day = n * perCig;
      els.count.forEach(function (el) { el.textContent = n; });
      if (els.day) els.day.textContent = money(day, locale);
      if (els.week) els.week.textContent = money(day * 7, locale);
      if (els.year) els.year.textContent = money(day * 365, locale);
      range.setAttribute('aria-valuenow', n);
      range.setAttribute('aria-valuetext', n + (n === 1 ? ' cigarette' : ' cigarettes') + ' a day');
    }

    range.addEventListener('input', render);
    range.addEventListener('change', render);
    render();
  }

  /* ---------- 3. Carousels ---------- */
  function initCarousel(root) {
    var slides = root.querySelectorAll('[data-qhm-slide-index]');
    if (!slides.length) return;
    var count = 0;
    slides.forEach(function (el) {
      var i = parseInt(el.getAttribute('data-qhm-slide-index'), 10) + 1;
      if (i > count) count = i;
    });
    if (count < 1) return;
    var index = parseInt(root.getAttribute('data-qhm-start'), 10) || 0;

    function show(i) {
      index = ((i % count) + count) % count;
      slides.forEach(function (el) {
        el.hidden = parseInt(el.getAttribute('data-qhm-slide-index'), 10) !== index;
      });
      root.querySelectorAll('[data-qhm-dot]').forEach(function (dot) {
        var on = parseInt(dot.getAttribute('data-qhm-dot'), 10) === index;
        dot.setAttribute('data-on', on ? '1' : '0');
        dot.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      root.setAttribute('data-qhm-index', index);
    }

    root.addEventListener('click', function (e) {
      var dot = e.target.closest('[data-qhm-dot]');
      if (dot && root.contains(dot)) {
        show(parseInt(dot.getAttribute('data-qhm-dot'), 10));
        return;
      }
      if (e.target.closest('[data-qhm-prev]')) { show(index - 1); return; }
      if (e.target.closest('[data-qhm-next]')) { show(index + 1); }
    });

    /* Left/right arrow keys when a dot has focus */
    root.addEventListener('keydown', function (e) {
      if (!e.target.closest('[data-qhm-dot]')) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); focusDot(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); focusDot(); }
    });
    function focusDot() {
      var dot = root.querySelector('[data-qhm-dot="' + index + '"]');
      if (dot) dot.focus();
    }

    root.qhmShow = show;
    show(index);
  }

  /* ---------- 4. FAQ (single open) ---------- */
  function initFaq(root) {
    var items = root.querySelectorAll('[data-qhm-faq-item]');
    items.forEach(function (item) {
      var btn = item.querySelector('.qhm-acc__q');
      var panel = item.querySelector('.qhm-acc__a');
      if (!btn || !panel) return;
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        items.forEach(function (o) {
          var b = o.querySelector('.qhm-acc__q');
          var p = o.querySelector('.qhm-acc__a');
          if (b) b.setAttribute('aria-expanded', 'false');
          if (p) p.hidden = true;
        });
        if (!open) {
          btn.setAttribute('aria-expanded', 'true');
          panel.hidden = false;
        }
      });
    });
  }

  /* ---------- Shared inline-error helpers ---------- */
  function fieldError(form, input, message) {
    var msg = form.querySelector('[data-qhm-error-for="' + input.name + '"]');
    if (message) {
      input.classList.add('qhm-field--error');
      input.setAttribute('aria-invalid', 'true');
      if (msg) { msg.textContent = message; msg.hidden = false; }
    } else {
      input.classList.remove('qhm-field--error');
      input.removeAttribute('aria-invalid');
      if (msg) { msg.textContent = ''; msg.hidden = true; }
    }
  }

  function bindForm(form, rules, beforeSubmit) {
    var submitting = false;
    function validateAll() {
      var firstInvalid = null;
      rules.forEach(function (rule) {
        var input = form.querySelector('[name="' + rule.name + '"]');
        if (!input) return;
        var err = rule.validate(input.value, form);
        fieldError(form, input, err);
        if (err && !firstInvalid) firstInvalid = input;
      });
      return firstInvalid;
    }
    rules.forEach(function (rule) {
      var input = form.querySelector('[name="' + rule.name + '"]');
      if (!input) return;
      input.addEventListener('input', function () {
        if (input.classList.contains('qhm-field--error') && !rule.validate(input.value, form)) {
          fieldError(form, input, null);
        }
      });
      input.addEventListener('blur', function () {
        if (input.value) fieldError(form, input, rule.validate(input.value, form));
      });
    });
    form.addEventListener('submit', function (e) {
      if (submitting) { e.preventDefault(); return; }
      var firstInvalid = validateAll();
      if (firstInvalid) {
        e.preventDefault();
        firstInvalid.focus();
        return;
      }
      if (beforeSubmit) beforeSubmit(form);
      submitting = true;
      var btn = form.querySelector('[type="submit"]');
      if (btn) {
        var busy = btn.getAttribute('data-qhm-busy-label');
        if (busy) btn.textContent = busy;
        btn.setAttribute('aria-busy', 'true');
        /* disable on the next tick so the click's submit still goes through */
        setTimeout(function () { btn.disabled = true; }, 0);
      }
    });
  }

  function msg(form, key, fallback) {
    return form.getAttribute('data-qhm-msg-' + key) || fallback;
  }

  /* ---------- 5. Application form ---------- */
  function initApplyForm(form) {
    var PASSWORD_MIN = parseInt(form.getAttribute('data-qhm-password-min'), 10) || 5;
    bindForm(form, [
      { name: 'customer[first_name]', validate: function (v) {
        return (v || '').trim() ? null : msg(form, 'first-name', 'Please enter your first name.');
      } },
      { name: 'customer[last_name]', validate: function (v) {
        return (v || '').trim() ? null : msg(form, 'last-name', 'Please enter your last name.');
      } },
      { name: 'customer[email]', validate: function (v) {
        v = (v || '').trim();
        if (!v) return msg(form, 'email', 'Please enter your email address.');
        if (!EMAIL_RE.test(v)) return msg(form, 'email-format', 'Please enter a valid email address.');
        return null;
      } },
      { name: 'customer[password]', validate: function (v) {
        if (!v) return msg(form, 'password', 'Please create a password.');
        if (v.length < PASSWORD_MIN) return (msg(form, 'password-min', 'Use at least {count} characters.')).replace('{count}', PASSWORD_MIN);
        return null;
      } },
      { name: 'customer[password_confirmation]', validate: function (v, f) {
        var pw = f.querySelector('[name="customer[password]"]');
        if (!v) return msg(form, 'confirm', 'Please confirm your password.');
        if (pw && v !== pw.value) return msg(form, 'confirm-match', 'Passwords do not match.');
        return null;
      } }
    ], function (f) {
      var email = f.querySelector('[name="customer[email]"]');
      if (email) email.value = email.value.trim();
    });
  }

  /* ---------- 6. Mailing list ---------- */
  function normaliseMobile(v) {
    var digits = String(v || '').replace(/[\s\-().]/g, '');
    if (/^0/.test(digits)) digits = '+61' + digits.slice(1);
    else if (/^61/.test(digits)) digits = '+' + digits;
    return digits;
  }

  function initMailForm(form) {
    bindForm(form, [
      { name: 'contact[email]', validate: function (v) {
        v = (v || '').trim();
        if (!v) return msg(form, 'email', 'Please enter your email address.');
        if (!EMAIL_RE.test(v)) return msg(form, 'email-format', 'Please enter a valid email address.');
        return null;
      } },
      { name: 'contact[phone]', validate: function (v) {
        v = (v || '').trim();
        if (!v) return null; /* optional */
        return AU_MOBILE_RE.test(normaliseMobile(v)) ? null : msg(form, 'mobile', 'Enter an Australian mobile, e.g. 04xx xxx xxx.');
      } }
    ], function (f) {
      var phone = f.querySelector('[name="contact[phone]"]');
      if (phone && phone.value.trim()) phone.value = normaliseMobile(phone.value);
      else if (phone) phone.disabled = true; /* don't post an empty phone */
      var email = f.querySelector('[name="contact[email]"]');
      if (email) email.value = email.value.trim();
    });
  }

  /* initAll also runs on shopify:section:load, which fires for one section but
     hands us the whole document. Without this guard every already-initialised
     section picks up a second set of listeners. Reloaded sections arrive as
     fresh nodes, so they still get initialised. */
  function initEach(selector, key, fn) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (el.qhmInit && el.qhmInit[key]) return;
      el.qhmInit = el.qhmInit || {};
      el.qhmInit[key] = true;
      fn(el);
    });
  }

  function initAll() {
    initEach('[data-qhm-hero-video]', 'video', initHeroVideo);
    initEach('[data-qhm-savings]', 'savings', initSavings);
    initEach('[data-qhm-carousel]', 'carousel', initCarousel);
    initEach('[data-qhm-faq]', 'faq', initFaq);
    initEach('[data-qhm-apply-form]', 'apply', initApplyForm);
    initEach('[data-qhm-mail-form]', 'mail', initMailForm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
  document.addEventListener('shopify:section:load', initAll);

  /* Theme editor: reveal the slide / question whose block was selected */
  document.addEventListener('shopify:block:select', function (e) {
    var slide = e.target && e.target.closest ? e.target.closest('[data-qhm-slide-index]') : null;
    if (slide) {
      var carousel = slide.closest('[data-qhm-carousel]');
      if (carousel && carousel.qhmShow) carousel.qhmShow(parseInt(slide.getAttribute('data-qhm-slide-index'), 10));
      return;
    }
    var item = e.target && e.target.closest ? e.target.closest('[data-qhm-faq-item]') : null;
    if (item) {
      var btn = item.querySelector('.qhm-acc__q');
      if (btn && btn.getAttribute('aria-expanded') !== 'true') btn.click();
    }
  });
})();
