/* ============================================================
   Quity Product Store — behaviors for the qps- sections.
   Vanilla JS, no dependencies. Each behavior binds inside its
   own section root so sections stay independent:

   1. Gallery thumbnail switching        [data-qps-gallery]
   2. Purchase option -> price           [data-qps-option]
   3. Variant select -> price/stock      [data-qps-variant-select]
   4. Quantity stepper + running total   [data-qps-qty]
   5. Sticky add-to-cart reveal          [data-qps-stickybar]
   6. Why-Quity tabs                     [data-qps-tabs]
   7. FAQ accordion (single open)        [data-qps-faq]
   ============================================================ */
(function () {
  'use strict';

  function formatMoney(cents, format) {
    var amount = (cents / 100).toFixed(2);
    var noDecimals = Math.round(cents / 100).toString();
    var withComma = amount.replace('.', ',');
    return (format || '${{amount}}')
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/g, noDecimals)
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/g, withComma)
      .replace(/\{\{\s*amount\s*\}\}/g, amount);
  }

  /* ---------- Product buy box ---------- */
  function initProduct(root) {
    var dataEl = root.querySelector('[data-qps-data]');
    if (!dataEl) return;
    var data;
    try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }

    var moneyFormat = data.moneyFormat || '${{amount}}';
    var state = {
      variantId: data.initialVariant,
      purchase: 'once',
      qty: 1
    };

    var els = {
      priceBig: root.querySelectorAll('[data-qps-price]'),
      priceWas: root.querySelector('[data-qps-price-was]'),
      priceSave: root.querySelector('[data-qps-price-save]'),
      addBtns: root.querySelectorAll('[data-qps-add]'),
      qtyNum: root.querySelector('[data-qps-qty-num]'),
      idInput: root.querySelector('[data-qps-id-input]'),
      qtyInput: root.querySelector('[data-qps-qty-input]'),
      planInput: root.querySelector('[data-qps-plan-input]'),
      stock: root.querySelector('[data-qps-stock]'),
      onceP: root.querySelector('[data-qps-once-price]'),
      subP: root.querySelector('[data-qps-sub-price]')
    };

    function variant() {
      for (var i = 0; i < data.variants.length; i++) {
        if (data.variants[i].id === state.variantId) return data.variants[i];
      }
      return data.variants[0];
    }

    function subPrice(v) {
      if (data.plan && data.plan.prices && data.plan.prices[v.id] != null) {
        return data.plan.prices[v.id];
      }
      return null;
    }

    function render() {
      var v = variant();
      if (!v) return;
      var sub = subPrice(v);
      var isSub = state.purchase === 'sub' && sub != null;
      var unit = isSub ? sub : v.price;

      els.priceBig.forEach(function (el) { el.textContent = formatMoney(unit, moneyFormat); });
      if (els.onceP) els.onceP.textContent = formatMoney(v.price, moneyFormat);
      if (els.subP && sub != null) els.subP.textContent = formatMoney(sub, moneyFormat);

      var compare = isSub ? v.price : (v.compare_at_price > v.price ? v.compare_at_price : null);
      if (els.priceWas) {
        els.priceWas.hidden = compare == null;
        if (compare != null) els.priceWas.textContent = formatMoney(compare, moneyFormat);
      }
      if (els.priceSave) {
        els.priceSave.hidden = compare == null;
        if (compare != null) {
          els.priceSave.textContent = els.priceSave.getAttribute('data-qps-save-label') + ' ' + formatMoney(compare - unit, moneyFormat);
        }
      }

      els.addBtns.forEach(function (btn) {
        var label = btn.getAttribute('data-qps-add');
        if (!v.available) {
          btn.disabled = true;
          btn.textContent = btn.getAttribute('data-qps-soldout') || 'Sold out';
        } else {
          btn.disabled = false;
          btn.textContent = label + ' ' + formatMoney(unit * state.qty, moneyFormat);
        }
      });
      if (els.qtyNum) els.qtyNum.textContent = state.qty;
      if (els.idInput) els.idInput.value = v.id;
      if (els.qtyInput) els.qtyInput.value = state.qty;
      if (els.planInput) {
        if (isSub && data.plan) els.planInput.value = data.plan.id;
        else els.planInput.removeAttribute('value'), els.planInput.value = '';
      }
      if (els.stock) {
        els.stock.textContent = v.available
          ? els.stock.getAttribute('data-qps-instock')
          : (els.stock.getAttribute('data-qps-nostock') || '');
      }
    }

    /* purchase option cards (click + keyboard via the real radios) */
    function selectPurchase(card) {
      state.purchase = card.getAttribute('data-qps-option');
      root.querySelectorAll('[data-qps-option]').forEach(function (c) {
        var active = c === card;
        c.classList.toggle('is-active', active);
        var input = c.querySelector('input[type="radio"]');
        if (input) input.checked = active;
      });
      render();
    }
    root.querySelectorAll('[data-qps-option]').forEach(function (card) {
      card.addEventListener('click', function () { selectPurchase(card); });
      var input = card.querySelector('input[type="radio"]');
      if (input) input.addEventListener('change', function () { if (input.checked) selectPurchase(card); });
    });

    /* variant option selects */
    var selects = root.querySelectorAll('[data-qps-variant-select]');
    function currentOptions() {
      var opts = [];
      selects.forEach(function (s) { opts.push(s.value); });
      return opts;
    }
    selects.forEach(function (s) {
      s.addEventListener('change', function () {
        var opts = currentOptions();
        var match = null;
        for (var i = 0; i < data.variants.length; i++) {
          var v = data.variants[i];
          var ok = true;
          for (var j = 0; j < opts.length; j++) {
            if (v.options[j] !== opts[j]) { ok = false; break; }
          }
          if (ok) { match = v; break; }
        }
        if (match) state.variantId = match.id;
        render();
      });
    });

    /* qty stepper */
    root.querySelectorAll('[data-qps-qty]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var d = btn.getAttribute('data-qps-qty') === 'inc' ? 1 : -1;
        state.qty = Math.max(1, state.qty + d);
        render();
      });
    });

    /* add to cart (AJAX with form fallback) */
    var form = root.querySelector('[data-qps-form]');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = variant();
        if (!v || !v.available) return;
        var body = { id: v.id, quantity: state.qty };
        if (state.purchase === 'sub' && data.plan && subPrice(v) != null) {
          body.selling_plan = data.plan.id;
        }
        var btns = els.addBtns;
        btns.forEach(function (b) { b.disabled = true; });
        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }).then(function (r) {
          if (!r.ok) throw new Error('add failed');
          return fetch('/cart.js').then(function (cr) { return cr.json(); });
        }).then(function (cart) {
          document.querySelectorAll('.cart-count, [data-cart-count]').forEach(function (el) {
            el.textContent = cart.item_count;
          });
          btns.forEach(function (b) {
            b.disabled = false;
            var done = b.getAttribute('data-qps-added') || 'Added';
            var prev = b.textContent;
            b.textContent = done;
            setTimeout(function () { b.textContent = prev; render(); }, 1600);
          });
          document.dispatchEvent(new CustomEvent('qps:cart:added', { detail: cart }));
        }).catch(function () {
          /* AJAX blocked — submit natively */
          btns.forEach(function (b) { b.disabled = false; });
          form.submit();
        });
      });
    }

    /* sticky bar reveal once the buy box scrolls out of view */
    var sticky = document.querySelector('[data-qps-stickybar="' + root.getAttribute('data-qps-product') + '"]');
    var buybox = root.querySelector('[data-qps-buybox]');
    if (sticky && buybox && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        sticky.hidden = entries[0].isIntersecting || entries[0].boundingClientRect.top > 0;
      }, { rootMargin: '0px 0px 0px 0px', threshold: 0 });
      io.observe(buybox);
      /* clicking the sticky Add submits the main form */
      var stickyBtn = sticky.querySelector('[data-qps-sticky-add]');
      if (stickyBtn && form) {
        stickyBtn.addEventListener('click', function () {
          form.dispatchEvent(new Event('submit', { cancelable: true }));
        });
      }
    }

    render();
  }

  /* ---------- Gallery ---------- */
  function initGallery(root) {
    var main = root.querySelector('[data-qps-gallery-main]');
    var thumbs = root.querySelectorAll('[data-qps-gallery-thumb]');
    if (!main || !thumbs.length) return;
    thumbs.forEach(function (t) {
      t.addEventListener('click', function () {
        thumbs.forEach(function (o) { o.setAttribute('aria-pressed', o === t ? 'true' : 'false'); });
        var img = t.querySelector('img');
        if (!img) return;
        main.src = t.getAttribute('data-qps-full') || img.src;
        main.srcset = t.getAttribute('data-qps-full-srcset') || '';
        main.alt = img.alt || '';
      });
    });
  }

  /* ---------- Tabs ---------- */
  function initTabs(root) {
    var tabs = root.querySelectorAll('[role="tab"]');
    var panels = root.querySelectorAll('[role="tabpanel"]');
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t, j) { t.setAttribute('aria-selected', i === j ? 'true' : 'false'); });
        panels.forEach(function (p, j) { p.hidden = i !== j; });
      });
    });
  }

  /* ---------- FAQ (single open) ---------- */
  function initFaq(root) {
    var items = root.querySelectorAll('[data-qps-faq-item]');
    items.forEach(function (item) {
      var btn = item.querySelector('.qps-faq__q');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var open = item.classList.contains('is-open');
        items.forEach(function (o) {
          o.classList.remove('is-open');
          var b = o.querySelector('.qps-faq__q');
          var s = o.querySelector('.qps-faq__sign');
          if (b) b.setAttribute('aria-expanded', 'false');
          if (s) s.textContent = '+';
        });
        if (!open) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
          var sign = item.querySelector('.qps-faq__sign');
          if (sign) sign.textContent = '-';
        }
      });
    });
  }

  function initAll() {
    document.querySelectorAll('[data-qps-product]').forEach(initProduct);
    document.querySelectorAll('[data-qps-gallery]').forEach(initGallery);
    document.querySelectorAll('[data-qps-tabs]').forEach(initTabs);
    document.querySelectorAll('[data-qps-faq]').forEach(initFaq);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
  document.addEventListener('shopify:section:load', initAll);
})();
