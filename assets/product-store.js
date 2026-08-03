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

  function withDelimiters(cents, decimals, thousands, decimal) {
    var parts = (Math.abs(cents) / 100).toFixed(decimals).split('.');
    var whole = parts[0].replace(/(\d)(?=(\d\d\d)+$)/g, '$1' + thousands);
    return (cents < 0 ? '-' : '') + whole + (parts[1] ? decimal + parts[1] : '');
  }

  function formatMoney(cents, format) {
    var value = Number(cents);
    if (isNaN(value)) value = 0;
    /* money_format can carry markup (<span class=money>…</span>); we write the
       result with textContent, so strip it rather than print the tags. */
    return String(format || '${{amount}}')
      .replace(/<[^>]*>/g, '')
      .replace(/\{\{\s*(\w+)\s*\}\}/g, function (match, name) {
        switch (name) {
          case 'amount_no_decimals': return withDelimiters(value, 0, ',', '.');
          case 'amount_with_comma_separator': return withDelimiters(value, 2, '.', ',');
          case 'amount_no_decimals_with_comma_separator': return withDelimiters(value, 0, '.', ',');
          case 'amount_with_apostrophe_separator': return withDelimiters(value, 2, "'", '.');
          case 'amount_with_space_separator': return withDelimiters(value, 2, ' ', ',');
          case 'amount_no_decimals_with_space_separator': return withDelimiters(value, 0, ' ', '.');
          default: return withDelimiters(value, 2, ',', '.');
        }
      });
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ---------- Theme cart drawer ----------
     The header cart is the theme's mini cart (snippets/block-cart.liquid). Its
     contents are painted by theme.miniCart in assets/theme.js, not by Liquid on
     every request — so an AJAX add has to ask theme.miniCart to repaint, or the
     drawer keeps showing the cart as it was when the page loaded. generateCart()
     rebuilds the line item list, updateElements() refreshes the count, total and
     free-shipping bar and opens the drawer when the drawer style is enabled. */
  function themeMiniCart() {
    var t = window.theme;
    return t && t.miniCart && typeof t.miniCart.generateCart === 'function' ? t.miniCart : null;
  }

  function isDrawerCart() {
    var el = document.querySelector('.js-mini-cart');
    return !!el && el.getAttribute('data-cartmini') === 'true';
  }

  /* Only used when theme.js has not loaded — keeps the header honest. */
  function paintCartFallback(cart) {
    document.querySelectorAll('.js-cart-count').forEach(function (el) {
      el.textContent = el.textContent.indexOf('(') === 0 ? '(' + cart.item_count + ')' : cart.item_count;
    });
    document.querySelectorAll('.js-cart-total').forEach(function (el) {
      el.textContent = formatMoney(cart.total_price, (window.theme && window.theme.moneyFormat) || '${{amount}}');
    });
  }

  function notifyAdded(item) {
    /* In drawer mode the sliding cart is the confirmation. Otherwise use the
       theme's growl notice, same as the grid/quickview add buttons. */
    if (isDrawerCart() || !item) return;
    var t = window.theme;
    if (!t || !t.alert || typeof t.alert.new !== 'function') return;
    var variant = item.variant_title ? '<i>(' + escapeHtml(item.variant_title) + ')</i>' : '';
    var html =
      '<div class="media mt-2 alert--cart"><a class="mr-3" href="' + ((window.routes && window.routes.cart_url) || '/cart') + '">' +
      '<img class="lazyload" data-src="' + escapeHtml(item.image) + '"></a>' +
      '<div class="media-body align-self-center"><p class="m-0 font-weight-bold">' +
      escapeHtml(item.product_title) + ' x ' + item.quantity + '</p>' + variant + '</div></div>';
    t.alert.new((t.strings && t.strings.addToCartSuccess) || '', html, 3000, 'notice');
  }

  function syncThemeCart(item) {
    var mini = themeMiniCart();
    if (mini) {
      /* theme.miniCart leans on jQuery, Shopify.getCart and theme.Currency; if
         any of those are missing the repaint must not take the add down with it */
      try {
        mini.generateCart();
        mini.updateElements();
      } catch (e) {
        mini = null;
      }
    }
    if (mini) {
      document.dispatchEvent(new CustomEvent('qps:cart:added', { detail: { item: item, cart: null } }));
      notifyAdded(item);
      return;
    }
    fetch((window.routes && window.routes.cart_url ? window.routes.cart_url : '/cart') + '.js', {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        paintCartFallback(cart);
        document.dispatchEvent(new CustomEvent('qps:cart:added', { detail: { item: item, cart: cart } }));
      })
      .catch(function () { /* header stays as-is; the add itself still succeeded */ })
      .then(function () { notifyAdded(item); });
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

    /* add to cart (AJAX, native submit only if the request never lands) */
    var form = root.querySelector('[data-qps-form]') || root.querySelector('form[action*="/cart/add"]');
    var errorEl = root.querySelector('[data-qps-error]');
    var addedTimer = null;

    function showError(message) {
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.hidden = !message;
      }
      var t = window.theme;
      if (message && t && t.alert && typeof t.alert.new === 'function') {
        t.alert.new('', escapeHtml(message), 4000, 'warning');
      }
    }

    function flashAdded() {
      clearTimeout(addedTimer);
      els.addBtns.forEach(function (b) {
        b.disabled = false;
        b.textContent = b.getAttribute('data-qps-added') || 'Added';
      });
      addedTimer = setTimeout(render, 1600);
    }

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = variant();
        if (!v || !v.available) return;
        var body = { id: v.id, quantity: state.qty };
        if (state.purchase === 'sub' && data.plan && subPrice(v) != null) {
          body.selling_plan = data.plan.id;
        }
        showError('');
        els.addBtns.forEach(function (b) { b.disabled = true; });

        var addUrl = (window.routes && window.routes.cart_add_url) || '/cart/add';
        fetch(addUrl + '.js', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(body)
        }).then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (payload) {
            /* Shopify answers 4xx with {description} for sold out, quantity
               limits, etc. Surface it — a native re-submit here would throw the
               shopper onto an error page and read as "nothing happened". */
            if (!r.ok) {
              var err = new Error(payload.description || payload.message || 'add failed');
              err.handled = true;
              throw err;
            }
            return payload;
          });
        }).then(function (item) {
          /* the item is in the cart from here on — nothing below may reach the
             catch and re-post the form, or the shopper gets it twice */
          flashAdded();
          try { syncThemeCart(item); } catch (e) { /* drawer stays stale, add stands */ }
        }).catch(function (err) {
          els.addBtns.forEach(function (b) { b.disabled = false; });
          if (err && err.handled) {
            showError(err.message);
            render();
            return;
          }
          /* the request itself never landed (offline, blocked) — let the
             browser post the form the old-fashioned way */
          if (typeof form.submit === 'function') form.submit();
        });
      });
    }

    /* clicking the sticky Add submits the main form */
    var sticky = document.querySelector('[data-qps-stickybar="' + root.getAttribute('data-qps-product') + '"]');
    if (sticky && form) {
      var stickyBtn = sticky.querySelector('[data-qps-sticky-add]');
      if (stickyBtn) {
        stickyBtn.addEventListener('click', function () {
          if (typeof form.requestSubmit === 'function') form.requestSubmit();
          else form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        });
      }
    }

    /* sticky bar reveal once the buy box scrolls out of view */
    var buybox = root.querySelector('[data-qps-buybox]');
    if (sticky && buybox && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        sticky.hidden = entries[0].isIntersecting || entries[0].boundingClientRect.top > 0;
      }, { rootMargin: '0px 0px 0px 0px', threshold: 0 });
      io.observe(buybox);
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

  /* initAll also runs on shopify:section:load, which fires for one section but
     hands us the whole document. Without this guard every already-initialised
     section picks up a second set of listeners and a click adds twice. Reloaded
     sections arrive as fresh nodes, so they still get initialised. */
  function initEach(selector, key, fn) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (el.qpsInit && el.qpsInit[key]) return;
      el.qpsInit = el.qpsInit || {};
      el.qpsInit[key] = true;
      fn(el);
    });
  }

  function initAll() {
    initEach('[data-qps-product]', 'product', initProduct);
    initEach('[data-qps-gallery]', 'gallery', initGallery);
    initEach('[data-qps-tabs]', 'tabs', initTabs);
    initEach('[data-qps-faq]', 'faq', initFaq);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
  document.addEventListener('shopify:section:load', initAll);
})();
