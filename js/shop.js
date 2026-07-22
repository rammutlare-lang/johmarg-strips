document.addEventListener('DOMContentLoaded', function () {
  var catalog = window.SHOP_CATALOG || [];
  var VAT_RATE = 0.15;
  var CART_KEY = 'johmarg_cart_v1';

  // PayFast integration — TEST MODE using PayFast's public sandbox credentials.
  // To go live: replace PAYFAST_MERCHANT_ID / PAYFAST_MERCHANT_KEY with the
  // values from your PayFast dashboard (Settings > Integration), and change
  // PAYFAST_URL to 'https://www.payfast.co.za/eng/process'.
  var PAYFAST_MERCHANT_ID = '10000100';
  var PAYFAST_MERCHANT_KEY = '46f0cd694581a';
  var PAYFAST_URL = 'https://sandbox.payfast.co.za/eng/process';
  var PAYFAST_IS_SANDBOX = true;

  // Per-product photo slot, keyed by "Category||Product family" — populated
  // from js/shop-product-images.js (currently generated placeholder SVGs).
  // Replace an entry's path with a real product photo as they become
  // available; the card picks it up automatically.
  var PRODUCT_IMAGES = window.SHOP_PRODUCT_IMAGES || {};

  var grid = document.getElementById('shop-grid');
  var categoryTabs = document.getElementById('shop-category-tabs');
  var searchInput = document.getElementById('shop-search');
  var cartCountEl = document.getElementById('cart-count');
  var cartTotalEl = document.getElementById('cart-total-mini');
  var cartDrawer = document.getElementById('cart-drawer');
  var cartLinesEl = document.getElementById('cart-lines');
  var cartSubtotalEl = document.getElementById('cart-subtotal');
  var cartVatEl = document.getElementById('cart-vat');
  var cartGrandTotalEl = document.getElementById('cart-grand-total');
  var cartEmptyEl = document.getElementById('cart-empty');
  var cartFooterEl = document.getElementById('cart-footer');

  if (!grid) return; // not on the shop page

  var activeCategory = 'all';
  var searchTerm = '';

  function money(n) {
    return 'R' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  // ---------- Render category tabs ----------
  var categoryNames = catalog.map(function (c) { return c.category; });
  categoryTabs.innerHTML = '<button class="shop-tab active" data-cat="all">All Products</button>' +
    categoryNames.map(function (name) {
      return '<button class="shop-tab" data-cat="' + name.replace(/"/g, '&quot;') + '">' + name + '</button>';
    }).join('');

  categoryTabs.addEventListener('click', function (e) {
    var btn = e.target.closest('.shop-tab');
    if (!btn) return;
    activeCategory = btn.getAttribute('data-cat');
    categoryTabs.querySelectorAll('.shop-tab').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    renderGrid();
  });

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      searchTerm = searchInput.value.trim().toLowerCase();
      renderGrid();
    });
  }

  // ---------- Render product grid, grouped by category — every product card has its own photo slot ----------
  function renderGrid() {
    var sectionsHtml = '';
    catalog.forEach(function (cat) {
      if (activeCategory !== 'all' && cat.category !== activeCategory) return;

      var cardsHtml = '';
      cat.products.forEach(function (prod) {
        if (searchTerm) {
          var haystack = (prod.family + ' ' + cat.category + ' ' + prod.variants.map(function (v) { return v.label + ' ' + v.code; }).join(' ')).toLowerCase();
          if (haystack.indexOf(searchTerm) === -1) return;
        }
        var uid = cat.category + '||' + prod.family;
        var options = prod.variants.map(function (v, i) {
          return '<option value="' + i + '">' + v.label + ' — ' + money(v.price) + '</option>';
        }).join('');
        var photo = PRODUCT_IMAGES[uid];
        cardsHtml += '' +
          '<div class="shop-card" data-uid="' + encodeURIComponent(uid) + '">' +
          (photo
            ? '  <div class="shop-card-img has-photo" style="background-image:url(\'' + photo + '\');"></div>'
            : '  <div class="shop-card-img"><i class="fa-solid fa-image"></i><span>Photo coming soon</span></div>') +
          '  <div class="shop-card-body">' +
          '  <span class="shop-card-cat">' + cat.category + '</span>' +
          '  <h3>' + prod.family + '</h3>' +
          '  <label class="shop-variant-label">Size / Finish</label><select class="shop-variant-select">' + options + '</select>' +
          '  <div class="shop-card-price"><span class="shop-price-amount">' + money(prod.variants[0].price) + '</span><span class="shop-price-excl">excl. VAT</span></div>' +
          '  <div class="shop-card-row">' +
          '    <div class="shop-qty"><button type="button" class="qty-btn" data-dir="-1">−</button><input type="number" class="qty-input" value="1" min="1" max="999"><button type="button" class="qty-btn" data-dir="1">+</button></div>' +
          '    <button type="button" class="btn btn-gold shop-add-btn">ADD TO CART</button>' +
          '  </div>' +
          '  </div>' +
          '</div>';
      });

      if (!cardsHtml) return; // nothing in this category matches the search

      sectionsHtml += '' +
        '<div class="shop-category-section">' +
        '  <h2 class="shop-category-heading">' + cat.category + '</h2>' +
        '  <div class="shop-grid">' + cardsHtml + '</div>' +
        '</div>';
    });
    grid.innerHTML = sectionsHtml || '<p class="shop-no-results">No products match your search.</p>';
  }

  grid.addEventListener('change', function (e) {
    if (!e.target.classList.contains('shop-variant-select')) return;
    var card = e.target.closest('.shop-card');
    var idx = parseInt(e.target.value, 10);
    var uid = decodeURIComponent(card.getAttribute('data-uid'));
    var prod = findProduct(uid);
    card.querySelector('.shop-price-amount').textContent = money(prod.variants[idx].price);
  });

  grid.addEventListener('click', function (e) {
    var qtyBtn = e.target.closest('.qty-btn');
    if (qtyBtn) {
      var input = qtyBtn.parentElement.querySelector('.qty-input');
      var val = parseInt(input.value, 10) || 1;
      var dir = parseInt(qtyBtn.getAttribute('data-dir'), 10);
      val = Math.max(1, val + dir);
      input.value = val;
      return;
    }
    var addBtn = e.target.closest('.shop-add-btn');
    if (addBtn) {
      var card = addBtn.closest('.shop-card');
      var uid = decodeURIComponent(card.getAttribute('data-uid'));
      var prod = findProduct(uid);
      var select = card.querySelector('.shop-variant-select');
      var idx = select ? parseInt(select.value, 10) : 0;
      var variant = prod.variants[idx];
      var qty = parseInt(card.querySelector('.qty-input').value, 10) || 1;
      addToCart(uid, prod, variant, qty);
      addBtn.textContent = 'ADDED ✓';
      setTimeout(function () { addBtn.textContent = 'ADD TO CART'; }, 1200);
    }
  });

  function findProduct(uid) {
    var parts = uid.split('||');
    var catName = parts[0], famName = parts.slice(1).join('||');
    var cat = catalog.filter(function (c) { return c.category === catName; })[0];
    return cat.products.filter(function (p) { return p.family === famName; })[0];
  }

  // ---------- Cart ----------
  function addToCart(uid, prod, variant, qty) {
    var cart = loadCart();
    var lineId = uid + '::' + variant.code;
    var existing = cart.filter(function (l) { return l.lineId === lineId; })[0];
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        lineId: lineId,
        category: uid.split('||')[0],
        family: prod.family,
        label: variant.label,
        code: variant.code,
        price: variant.price,
        qty: qty
      });
    }
    saveCart(cart);
    renderCart();
    openCart();
  }

  function updateLineQty(lineId, qty) {
    var cart = loadCart();
    var line = cart.filter(function (l) { return l.lineId === lineId; })[0];
    if (!line) return;
    if (qty <= 0) {
      cart = cart.filter(function (l) { return l.lineId !== lineId; });
    } else {
      line.qty = qty;
    }
    saveCart(cart);
    renderCart();
  }

  function removeLine(lineId) {
    var cart = loadCart().filter(function (l) { return l.lineId !== lineId; });
    saveCart(cart);
    renderCart();
  }

  function renderCart() {
    var cart = loadCart();
    var count = cart.reduce(function (sum, l) { return sum + l.qty; }, 0);
    var subtotal = cart.reduce(function (sum, l) { return sum + l.qty * l.price; }, 0);
    var vat = subtotal * VAT_RATE;
    var total = subtotal + vat;

    if (cartCountEl) cartCountEl.textContent = count;
    if (cartTotalEl) cartTotalEl.textContent = money(total);

    if (!cartLinesEl) return;

    if (cart.length === 0) {
      cartLinesEl.innerHTML = '';
      if (cartEmptyEl) cartEmptyEl.style.display = 'block';
      if (cartFooterEl) cartFooterEl.style.display = 'none';
      return;
    }
    if (cartEmptyEl) cartEmptyEl.style.display = 'none';
    if (cartFooterEl) cartFooterEl.style.display = 'block';

    cartLinesEl.innerHTML = cart.map(function (l) {
      return '' +
        '<div class="cart-line" data-line-id="' + encodeURIComponent(l.lineId) + '">' +
        '  <div class="cart-line-info">' +
        '    <div class="cart-line-name">' + l.family + '</div>' +
        '    <div class="cart-line-variant">' + l.label + ' · ' + money(l.price) + ' excl. VAT</div>' +
        '  </div>' +
        '  <div class="cart-line-qty"><button type="button" class="qty-btn" data-dir="-1">−</button><input type="number" class="qty-input" value="' + l.qty + '" min="1"><button type="button" class="qty-btn" data-dir="1">+</button></div>' +
        '  <div class="cart-line-total">' + money(l.qty * l.price) + '</div>' +
        '  <button type="button" class="cart-line-remove" aria-label="Remove item"><i class="fa-solid fa-xmark"></i></button>' +
        '</div>';
    }).join('');

    if (cartSubtotalEl) cartSubtotalEl.textContent = money(subtotal);
    if (cartVatEl) cartVatEl.textContent = money(vat);
    if (cartGrandTotalEl) cartGrandTotalEl.textContent = money(total);
  }

  if (cartLinesEl) {
    cartLinesEl.addEventListener('click', function (e) {
      var line = e.target.closest('.cart-line');
      if (!line) return;
      var lineId = decodeURIComponent(line.getAttribute('data-line-id'));
      var qtyBtn = e.target.closest('.qty-btn');
      if (qtyBtn) {
        var input = line.querySelector('.qty-input');
        var val = (parseInt(input.value, 10) || 1) + parseInt(qtyBtn.getAttribute('data-dir'), 10);
        updateLineQty(lineId, val);
        return;
      }
      if (e.target.closest('.cart-line-remove')) {
        removeLine(lineId);
      }
    });
    cartLinesEl.addEventListener('change', function (e) {
      if (!e.target.classList.contains('qty-input')) return;
      var line = e.target.closest('.cart-line');
      var lineId = decodeURIComponent(line.getAttribute('data-line-id'));
      updateLineQty(lineId, parseInt(e.target.value, 10) || 0);
    });
  }

  // ---------- Cart drawer open/close ----------
  var cartToggle = document.getElementById('cart-toggle');
  var cartClose = document.getElementById('cart-close');
  var cartOverlay = document.getElementById('cart-overlay');
  function openCart() { if (cartDrawer) { cartDrawer.classList.add('open'); document.body.classList.add('cart-open'); } }
  function closeCart() { if (cartDrawer) { cartDrawer.classList.remove('open'); document.body.classList.remove('cart-open'); } }
  if (cartToggle) cartToggle.addEventListener('click', openCart);
  if (cartClose) cartClose.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  // ---------- Checkout via PayFast ----------
  var checkoutBtn = document.getElementById('cart-checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function () {
      var cart = loadCart();
      if (cart.length === 0) return;

      var email = window.prompt('Enter your email address for the order confirmation:');
      if (!email || email.indexOf('@') === -1) {
        window.alert('A valid email address is required to check out.');
        return;
      }

      var subtotal = cart.reduce(function (sum, l) { return sum + l.qty * l.price; }, 0);
      var total = Math.round(subtotal * (1 + VAT_RATE) * 100) / 100;
      var orderRef = 'JS' + Date.now();

      var itemSummary = cart.map(function (l) { return l.qty + 'x ' + l.label; }).join(', ');
      if (itemSummary.length > 250) itemSummary = itemSummary.slice(0, 247) + '...';

      var siteRoot = window.location.origin + '/';
      var fields = {
        merchant_id: PAYFAST_MERCHANT_ID,
        merchant_key: PAYFAST_MERCHANT_KEY,
        return_url: siteRoot + 'shop-thank-you?ref=' + orderRef,
        cancel_url: siteRoot + 'shop-cancelled',
        notify_url: siteRoot + 'shop-thank-you',
        email_address: email,
        m_payment_id: orderRef,
        amount: total.toFixed(2),
        item_name: 'Johmarg Strips order #' + orderRef,
        item_description: itemSummary
      };

      var form = document.createElement('form');
      form.method = 'POST';
      form.action = PAYFAST_URL;
      Object.keys(fields).forEach(function (key) {
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = fields[key];
        form.appendChild(input);
      });
      document.body.appendChild(form);

      // Order is on its way to PayFast — clear the cart so a return visit starts fresh.
      localStorage.removeItem(CART_KEY);
      form.submit();
    });
  }

  if (PAYFAST_IS_SANDBOX) {
    console.info('Johmarg Strips Shop: PayFast is running in SANDBOX/test mode. No real payments will be processed. Replace PAYFAST_MERCHANT_ID/PAYFAST_MERCHANT_KEY in js/shop.js and switch PAYFAST_URL to the production endpoint to go live.');
  }

  renderGrid();
  renderCart();
});
