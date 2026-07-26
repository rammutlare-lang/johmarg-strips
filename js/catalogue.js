document.addEventListener('DOMContentLoaded', function () {
  var fullCatalog = window.PRODUCT_CATALOG || [];
  var QUOTE_KEY = 'johmarg_quote_v1';

  var grid = document.getElementById('catalogue-grid');
  if (!grid) return; // not a catalogue page

  var pageCat = document.body.getAttribute('data-catalogue-cat');

  // Per-product photo slot, keyed by "Material||Product family" — populated from
  // js/product-images.js. Replace an entry's path with a real product photo as
  // they become available; the card picks it up automatically.
  var PRODUCT_IMAGES = window.PRODUCT_IMAGES || {};

  // Only the material groups (e.g. Aluminium, Stainless Steel) that contain at
  // least one product in this page's category.
  var catalog = fullCatalog
    .map(function (group) {
      return {
        category: group.category,
        products: group.products.filter(function (p) { return p.cat === pageCat; })
      };
    })
    .filter(function (group) { return group.products.length > 0; });

  var categoryTabs = document.getElementById('catalogue-tabs');
  var searchInput = document.getElementById('catalogue-search');
  var quoteCountEl = document.getElementById('quote-count');
  var quoteDrawer = document.getElementById('quote-drawer');
  var quoteLinesEl = document.getElementById('quote-lines');
  var quoteSubtotalEl = document.getElementById('quote-subtotal');
  var quoteEmptyEl = document.getElementById('quote-empty');
  var quoteFooterEl = document.getElementById('quote-footer');

  var activeMaterial = 'all';
  var searchTerm = '';

  function money(n) {
    return 'R' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function minPrice(variants) {
    return variants.reduce(function (min, v) { return Math.min(min, v.price); }, variants[0].price);
  }

  // Clamp any user-typed quantity to a sane whole number between 1 and 999.
  function clampQty(raw) {
    var n = parseInt(raw, 10);
    if (!isFinite(n)) n = 1;
    return Math.min(999, Math.max(1, n));
  }

  function loadQuoteList() {
    try {
      return JSON.parse(localStorage.getItem(QUOTE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function saveQuoteList(list) {
    localStorage.setItem(QUOTE_KEY, JSON.stringify(list));
  }

  var DESCRIPTIONS = {
    'Tile Trims & Edges': function (material) { return 'Premium tile trim profile in ' + material + ', engineered for a clean, professional edge finish.'; },
    'Stair Nosing': function (material) { return 'Durable stair nosing profile in ' + material + ', designed for safety and a lasting finish on every step.'; },
    'Metal Profiles': function (material) { return 'Decorative ' + material + ' transition profile, ideal for a smart, professional finish.'; },
    'PVC Profiles': function () { return 'Lightweight, corrosion-resistant PVC profile — ideal for bathrooms, kitchens and other wet areas.'; },
    'Movement Joints': function (material) { return material + ' movement joint that allows for expansion and ensures long-lasting performance.'; },
    'Flooring Profiles': function (material) { return 'Smooth ' + material + ' transition profile between different flooring surfaces.'; },
    'Spacers': function () { return 'Consistent, professional tiling joints for accurate, even tile spacing.'; },
    'Angle & Flat Bar': function (material) { return 'Durable ' + material + ' edging and corner protection for every application.'; }
  };
  function shortDescription(material) {
    var fn = DESCRIPTIONS[pageCat];
    return fn ? fn(material) : ('Premium ' + material + ' finishing profile.');
  }

  // ---------- Render material tabs ----------
  var materialNames = catalog.map(function (c) { return c.category; });
  if (categoryTabs) {
    if (materialNames.length > 1) {
      categoryTabs.innerHTML = '<button class="shop-tab active" data-cat="all">All Materials</button>' +
        materialNames.map(function (name) {
          return '<button class="shop-tab" data-cat="' + name.replace(/"/g, '&quot;') + '">' + name + '</button>';
        }).join('');
      categoryTabs.addEventListener('click', function (e) {
        var btn = e.target.closest('.shop-tab');
        if (!btn) return;
        activeMaterial = btn.getAttribute('data-cat');
        categoryTabs.querySelectorAll('.shop-tab').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        renderGrid();
      });
    } else {
      categoryTabs.style.display = 'none';
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      searchTerm = searchInput.value.trim().toLowerCase();
      renderGrid();
    });
  }

  // ---------- Render product grid, grouped by material ----------
  function renderGrid() {
    var sectionsHtml = '';
    catalog.forEach(function (mat) {
      if (activeMaterial !== 'all' && mat.category !== activeMaterial) return;

      var cardsHtml = '';
      mat.products.forEach(function (prod) {
        if (searchTerm) {
          var haystack = (prod.family + ' ' + mat.category + ' ' + prod.variants.map(function (v) { return v.label + ' ' + v.code; }).join(' ')).toLowerCase();
          if (haystack.indexOf(searchTerm) === -1) return;
        }
        var uid = mat.category + '||' + prod.family;
        var options = prod.variants.map(function (v, i) {
          return '<option value="' + i + '">' + v.label + '</option>';
        }).join('');
        var photo = PRODUCT_IMAGES[uid];
        cardsHtml += '' +
          '<div class="shop-card" data-uid="' + encodeURIComponent(uid) + '">' +
          (photo
            ? '  <div class="shop-card-img has-photo" style="background-image:url(\'' + photo + '\');"></div>'
            : '  <div class="shop-card-img"><i class="fa-solid fa-image"></i><span>Photo coming soon</span></div>') +
          '  <div class="shop-card-body">' +
          '  <span class="shop-card-cat">' + mat.category + '</span>' +
          '  <h3>' + prod.family + '</h3>' +
          '  <p class="shop-card-desc">' + shortDescription(mat.category) + '</p>' +
          '  <label class="shop-variant-label">Size / Finish</label><select class="shop-variant-select">' + options + '</select>' +
          '  <div class="shop-card-price"><span class="shop-price-amount">From ' + money(minPrice(prod.variants)) + '</span><span class="shop-price-excl">excl. VAT</span></div>' +
          '  <div class="shop-card-row">' +
          '    <div class="shop-qty"><button type="button" class="qty-btn" data-dir="-1">−</button><input type="number" class="qty-input" value="1" min="1" max="999"><button type="button" class="qty-btn" data-dir="1">+</button></div>' +
          '    <button type="button" class="btn btn-gold shop-add-btn">ADD TO QUOTE</button>' +
          '  </div>' +
          '  </div>' +
          '</div>';
      });

      if (!cardsHtml) return; // nothing in this material matches the search

      sectionsHtml += '' +
        '<div class="shop-category-section">' +
        (materialNames.length > 1 ? '  <h2 class="shop-category-heading">' + mat.category + '</h2>' : '') +
        '  <div class="shop-grid">' + cardsHtml + '</div>' +
        '</div>';
    });
    grid.innerHTML = sectionsHtml || '<p class="shop-no-results">No products match your search.</p>';
  }

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
      var qty = clampQty(card.querySelector('.qty-input').value);
      addToQuote(uid, prod, variant, qty);
      addBtn.textContent = 'ADDED ✓';
      setTimeout(function () { addBtn.textContent = 'ADD TO QUOTE'; }, 1200);
    }
  });

  function findProduct(uid) {
    var parts = uid.split('||');
    var matName = parts[0], famName = parts.slice(1).join('||');
    var mat = catalog.filter(function (c) { return c.category === matName; })[0];
    return mat.products.filter(function (p) { return p.family === famName; })[0];
  }

  // ---------- Quote List ----------
  function addToQuote(uid, prod, variant, qty) {
    qty = clampQty(qty);
    var list = loadQuoteList();
    var lineId = uid + '::' + variant.code;
    var existing = list.filter(function (l) { return l.lineId === lineId; })[0];
    if (existing) {
      existing.qty = clampQty(existing.qty + qty);
    } else {
      list.push({
        lineId: lineId,
        cat: pageCat,
        material: uid.split('||')[0],
        family: prod.family,
        label: variant.label,
        code: variant.code,
        price: variant.price,
        qty: qty
      });
    }
    saveQuoteList(list);
    renderQuoteList();
    openQuote();
  }

  function updateLineQty(lineId, qty) {
    var list = loadQuoteList();
    var line = list.filter(function (l) { return l.lineId === lineId; })[0];
    if (!line) return;
    if (qty <= 0) {
      list = list.filter(function (l) { return l.lineId !== lineId; });
    } else {
      line.qty = Math.min(999, qty);
    }
    saveQuoteList(list);
    renderQuoteList();
  }

  function removeLine(lineId) {
    var list = loadQuoteList().filter(function (l) { return l.lineId !== lineId; });
    saveQuoteList(list);
    renderQuoteList();
  }

  function renderQuoteList() {
    var list = loadQuoteList();
    var count = list.reduce(function (sum, l) { return sum + l.qty; }, 0);
    var subtotal = list.reduce(function (sum, l) { return sum + l.qty * l.price; }, 0);

    if (quoteCountEl) quoteCountEl.textContent = count;

    if (!quoteLinesEl) return;

    if (list.length === 0) {
      quoteLinesEl.innerHTML = '';
      if (quoteEmptyEl) quoteEmptyEl.style.display = 'block';
      if (quoteFooterEl) quoteFooterEl.style.display = 'none';
      return;
    }
    if (quoteEmptyEl) quoteEmptyEl.style.display = 'none';
    if (quoteFooterEl) quoteFooterEl.style.display = 'block';

    quoteLinesEl.innerHTML = list.map(function (l) {
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

    if (quoteSubtotalEl) quoteSubtotalEl.textContent = money(subtotal);
  }

  if (quoteLinesEl) {
    quoteLinesEl.addEventListener('click', function (e) {
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
    quoteLinesEl.addEventListener('change', function (e) {
      if (!e.target.classList.contains('qty-input')) return;
      var line = e.target.closest('.cart-line');
      var lineId = decodeURIComponent(line.getAttribute('data-line-id'));
      updateLineQty(lineId, parseInt(e.target.value, 10) || 0);
    });
  }

  // ---------- Quote drawer open/close ----------
  var quoteToggle = document.getElementById('quote-toggle');
  var quoteClose = document.getElementById('quote-close');
  var quoteOverlay = document.getElementById('quote-overlay');
  function openQuote() { if (quoteDrawer) { quoteDrawer.classList.add('open'); document.body.classList.add('cart-open'); } }
  function closeQuote() { if (quoteDrawer) { quoteDrawer.classList.remove('open'); document.body.classList.remove('cart-open'); } }
  if (quoteToggle) quoteToggle.addEventListener('click', openQuote);
  if (quoteClose) quoteClose.addEventListener('click', closeQuote);
  if (quoteOverlay) quoteOverlay.addEventListener('click', closeQuote);

  // ---------- Submit quote request ----------
  var submitBtn = document.getElementById('quote-submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', function () {
      var list = loadQuoteList();
      if (list.length === 0) return;
      window.location.href = 'quote?from=quotelist';
    });
  }

  renderGrid();
  renderQuoteList();
});
