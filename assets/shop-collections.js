/* ============================================================
   Quity Shop / Collections — behaviors for the qsh- sections.
   Vanilla JS, no dependencies. Everything binds inside its own
   card root so cards stay independent of each other:

   1. Variant select -> price / availability   [data-qsh-variant]
   2. Quantity stepper                          [data-qsh-qty]
   3. Add to cart (AJAX, native fallback)       [data-qsh-form]

   The cart repaint mirrors assets/product-store.js: the header
   cart is theme.miniCart, painted by assets/theme.js rather than
   by Liquid, so an AJAX add has to ask it to repaint.
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
    /* money_format can carry markup (<span class=money>…</span>); the result is
       written with textContent, so strip it rather than print the tags. */
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

  /* ---------- Theme cart drawer ---------- */
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

  /* With the drawer disabled nothing opens on add, so announce it through the
     theme's growl notice, same as the grid/quickview add buttons. */
  function notifyAdded(item) {
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
      document.dispatchEvent(new CustomEvent('qsh:cart:added', { detail: { item: item, cart: null } }));
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
        document.dispatchEvent(new CustomEvent('qsh:cart:added', { detail: { item: item, cart: cart } }));
      })
      .catch(function () { /* header stays as-is; the add itself still succeeded */ })
      .then(function () { notifyAdded(item); });
  }

  /* ---------- Spotlight card ---------- */
  function initCard(root) {
    var dataEl = root.querySelector('[data-qsh-data]');
    if (!dataEl) return;
    var data;
    try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
    if (!data.variants || !data.variants.length) return;

    var moneyFormat = data.moneyFormat || '${{amount}}';
    var state = { variantId: data.initialVariant, qty: 1 };

    var els = {
      select: root.querySelector('[data-qsh-variant]'),
      price: root.querySelector('[data-qsh-price]'),
      compare: root.querySelector('[data-qsh-compare]'),
      qtyNum: root.querySelector('[data-qsh-qty-num]'),
      idInput: root.querySelector('[data-qsh-id-input]'),
      qtyInput: root.querySelector('[data-qsh-qty-input]'),
      addBtn: root.querySelector('[data-qsh-add]'),
      error: root.querySelector('[data-qsh-error]')
    };

    function variant() {
      for (var i = 0; i < data.variants.length; i++) {
        if (data.variants[i].id === state.variantId) return data.variants[i];
      }
      return data.variants[0];
    }

    function render() {
      var v = variant();
      if (!v) return;

      if (els.price) els.price.textContent = formatMoney(v.price, moneyFormat);
      if (els.compare) {
        var showCompare = v.compare_at_price && v.compare_at_price > v.price;
        els.compare.hidden = !showCompare;
        if (showCompare) els.compare.textContent = formatMoney(v.compare_at_price, moneyFormat);
      }
      if (els.qtyNum) els.qtyNum.textContent = state.qty;
      if (els.idInput) els.idInput.value = v.id;
      if (els.qtyInput) els.qtyInput.value = state.qty;

      if (els.addBtn) {
        els.addBtn.disabled = !v.available;
        els.addBtn.classList.toggle('qsh-btn--muted', !v.available);
        els.addBtn.textContent = v.available
          ? els.addBtn.getAttribute('data-qsh-add-label') || 'Add to cart'
          : els.addBtn.getAttribute('data-qsh-soldout-label') || 'Sold out';
      }
    }

    if (els.select) {
      els.select.addEventListener('change', function () {
        state.variantId = parseInt(els.select.value, 10);
        showError('');
        render();
      });
    }

    root.querySelectorAll('[data-qsh-qty]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var d = btn.getAttribute('data-qsh-qty') === 'inc' ? 1 : -1;
        state.qty = Math.max(1, state.qty + d);
        render();
      });
    });

    function showError(message) {
      if (!els.error) return;
      els.error.textContent = message;
      els.error.hidden = !message;
    }

    var addedTimer = null;
    function flashAdded() {
      clearTimeout(addedTimer);
      if (!els.addBtn) return;
      els.addBtn.disabled = false;
      els.addBtn.textContent = els.addBtn.getAttribute('data-qsh-added-label') || 'Added';
      addedTimer = setTimeout(render, 1600);
    }

    var form = root.querySelector('[data-qsh-form]');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = variant();
        if (!v || !v.available) return;
        showError('');
        if (els.addBtn) els.addBtn.disabled = true;

        var addUrl = (window.routes && window.routes.cart_add_url) || '/cart/add';
        fetch(addUrl + '.js', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ id: v.id, quantity: state.qty })
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
          if (els.addBtn) els.addBtn.disabled = false;
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

    render();
  }

  /* initAll also runs on shopify:section:load, which fires for one section but
     hands us the whole document. Without this guard every already-initialised
     card picks up a second set of listeners and a click adds twice. Reloaded
     sections arrive as fresh nodes, so they still get initialised. */
  function initEach(selector, key, fn) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (el.qshInit && el.qshInit[key]) return;
      el.qshInit = el.qshInit || {};
      el.qshInit[key] = true;
      fn(el);
    });
  }

  function initAll() {
    initEach('[data-qsh-card]', 'card', initCard);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
  document.addEventListener('shopify:section:load', initAll);
})();
