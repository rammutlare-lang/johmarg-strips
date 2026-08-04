// Drives the full faceted Products page (products.html): builds the flattened
// product index (js/products-index.js) from the raw catalogue, renders the
// filter sidebar with live counts, search, sort, pagination and product
// cards, and reuses the same Quote List (localStorage) mechanism as the
// per-category pages (js/catalogue.js) so items added here show up in the
// same drawer and on quote.html.
document.addEventListener('DOMContentLoaded', function () {
  var grid = document.getElementById('products-grid');
  if (!grid) return; // not the products page

  var LIB = window.PRODUCT_INDEX_LIB;
  var ALL = LIB.build(window.PRODUCT_CATALOG || [], window.PRODUCT_IMAGES || {});
  var QUOTE_KEY = 'johmarg_quote_v1';
  var PAGE_SIZE = 15; // multiple of the 3-column grid so every full page's rows come out even
  var COLS = 3;

  var CAT_FALLBACK_IMAGE = {
    'Tile Trims & Edges': 'images/product-tile-trim.jpg',
    'Stair Nosing': 'images/product-stair-nosing.jpg',
    'Flooring Profiles': 'images/product-flooring.jpg',
    'Metal Profiles': 'images/product-metal.jpg',
    'PVC Profiles': 'images/product-pvc.jpg',
    'Movement Joints': 'images/product-movement.jpg',
    'Spacers': 'images/product-spacers.jpg',
    'Angle & Flat Bar': 'images/product-angle-flat-bar.jpg'
  };

  var FACETS = [
    { key: 'category', label: 'Product Category' },
    { key: 'material', label: 'Material' },
    { key: 'colour', label: 'Colour' },
    { key: 'size', label: 'Size (mm)' },
    { key: 'application', label: 'Application' }
  ];

  var filters = { category: new Set(), material: new Set(), colour: new Set(), size: new Set(), application: new Set() };
  var searchTerm = '';
  var sortKey = 'featured';
  var page = 1;
  var collapsedGroups = {};

  // ---------- Preselect from URL (?cat=&material=&search=) ----------
  // URL param stays "cat" for link-compatibility (breadcrumbs, footer, PDP
  // pages all already link with ?cat=<value>) even though the facet/filter
  // key is "category" — it just now expects one of the 4 category names.
  var initialParams = new URLSearchParams(window.location.search);
  var initialCat = initialParams.get('cat');
  if (initialCat) filters.category.add(initialCat);
  var initialMaterial = initialParams.get('material');
  if (initialMaterial) filters.material.add(initialMaterial);
  if (initialParams.get('search')) searchTerm = initialParams.get('search');

  function money(n) {
    return 'R' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function valuesFor(p, key) {
    if (key === 'colour') return p.colours;
    if (key === 'size') return p.sizes;
    return [p[key]];
  }

  function matchesSearch(p) {
    if (!searchTerm) return true;
    var hay = (p.family + ' ' + p.materialGroup + ' ' + p.primaryCode + ' ' +
      p.variants.map(function (v) { return v.label + ' ' + v.code; }).join(' ')).toLowerCase();
    return hay.indexOf(searchTerm) !== -1;
  }

  function matchesFacet(p, key) {
    var set = filters[key];
    if (!set || set.size === 0) return true;
    var vals = valuesFor(p, key);
    return vals.some(function (v) { return set.has(v); });
  }

  function applyFilters(excludeKey) {
    return ALL.filter(function (p) {
      if (!matchesSearch(p)) return false;
      return FACETS.every(function (f) { return f.key === excludeKey || matchesFacet(p, f.key); });
    });
  }

  function sortProducts(list) {
    var out = list.slice();
    if (sortKey === 'featured') out.sort(function (a, b) { return a.sortIndex - b.sortIndex; });
    else if (sortKey === 'newest') out.sort(function (a, b) { return b.sortIndex - a.sortIndex; });
    else if (sortKey === 'name') out.sort(function (a, b) { return a.family.localeCompare(b.family); });
    else if (sortKey === 'price') out.sort(function (a, b) { return (a.isPOA ? Infinity : a.minPrice) - (b.isPOA ? Infinity : b.minPrice); });
    return out;
  }

  // ---------- Filter sidebar ----------
  var filtersPanel = document.getElementById('filters-panel');

  function renderFilters() {
    var html = '<div class="filters-head"><h2>FILTER BY</h2><button type="button" class="filters-clear" id="filters-clear-btn">Clear All</button></div>';

    FACETS.forEach(function (f) {
      var poolExcluding = applyFilters(f.key);
      var counts = {};
      poolExcluding.forEach(function (p) { valuesFor(p, f.key).forEach(function (v) { counts[v] = (counts[v] || 0) + 1; }); });
      var values = Object.keys(counts).sort(function (a, b) {
        if (f.key === 'size') return parseFloat(a) - parseFloat(b);
        return counts[b] - counts[a] || a.localeCompare(b);
      });
      if (!values.length) return;

      var collapsed = collapsedGroups[f.key];
      html += '<div class="filter-group' + (collapsed ? ' collapsed' : '') + '" data-facet="' + f.key + '">' +
        '<button type="button" class="filter-group-head" data-toggle-facet="' + f.key + '"><span>' + f.label.toUpperCase() + '</span><i class="fa-solid fa-chevron-down"></i></button>' +
        '<div class="filter-options">' +
        values.map(function (v) {
          var checked = filters[f.key].has(v) ? ' checked' : '';
          var id = 'f-' + f.key + '-' + LIB.slugify(v);
          var swatch = f.key === 'colour'
            ? '<span class="swatch" style="background:' + (LIB.SWATCH_HEX[v] || '#ccc') + ';"></span>'
            : '';
          return '<label class="filter-option' + (f.key === 'colour' ? ' fo-colour' : '') + '" for="' + id + '">' +
            '<input type="checkbox" id="' + id + '" data-facet="' + f.key + '" value="' + escapeHtml(v) + '"' + checked + '>' +
            swatch +
            '<span class="fo-label">' + escapeHtml(v) + '</span><span class="fo-count">(' + counts[v] + ')</span>' +
            '</label>';
        }).join('') +
        '</div></div>';
    });

    filtersPanel.innerHTML = html;
  }

  filtersPanel.addEventListener('change', function (e) {
    if (!e.target.matches('input[data-facet]')) return;
    var key = e.target.getAttribute('data-facet');
    var val = e.target.value;
    if (e.target.checked) filters[key].add(val); else filters[key].delete(val);
    page = 1;
    renderAll();
  });
  filtersPanel.addEventListener('click', function (e) {
    var toggle = e.target.closest('[data-toggle-facet]');
    if (toggle) {
      var key = toggle.getAttribute('data-toggle-facet');
      collapsedGroups[key] = !collapsedGroups[key];
      renderFilters();
      return;
    }
    if (e.target.id === 'filters-clear-btn') {
      FACETS.forEach(function (f) { filters[f.key].clear(); });
      page = 1;
      renderAll();
    }
  });

  // ---------- Active filter chips ----------
  var chipsEl = document.getElementById('active-filter-chips');
  function renderChips() {
    var chips = [];
    FACETS.forEach(function (f) {
      filters[f.key].forEach(function (v) {
        chips.push({ key: f.key, value: v });
      });
    });
    if (!chips.length) { chipsEl.innerHTML = ''; chipsEl.style.display = 'none'; return; }
    chipsEl.style.display = 'flex';
    chipsEl.innerHTML = chips.map(function (c) {
      return '<span class="active-filter-chip">' + escapeHtml(c.value) +
        '<button type="button" data-remove-facet="' + c.key + '" data-remove-value="' + escapeHtml(c.value) + '" aria-label="Remove filter">' +
        '<i class="fa-solid fa-xmark"></i></button></span>';
    }).join('');
  }
  chipsEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-remove-facet]');
    if (!btn) return;
    filters[btn.getAttribute('data-remove-facet')].delete(btn.getAttribute('data-remove-value'));
    page = 1;
    renderAll();
  });

  // ---------- Toolbar: search, sort, count ----------
  var searchInput = document.getElementById('products-search');
  var sortSelect = document.getElementById('products-sort');
  var countEl = document.getElementById('products-count');

  if (searchInput) {
    searchInput.value = searchTerm;
    searchInput.addEventListener('input', function () {
      searchTerm = searchInput.value.trim().toLowerCase();
      page = 1;
      renderAll();
    });
  }
  if (sortSelect) {
    sortSelect.addEventListener('change', function () {
      sortKey = sortSelect.value;
      page = 1;
      renderAll();
    });
  }

  // ---------- Grid + pagination ----------
  var paginationEl = document.getElementById('products-pagination');

  function cardHtml(p) {
    var img = p.image || CAT_FALLBACK_IMAGE[p.cat] || '';
    var sizesText = p.sizes.length ? p.sizes.join(', ') : 'One size';
    var swatches = p.colours.slice(0, 5).map(function (c) {
      return '<span class="swatch" style="background:' + (LIB.SWATCH_HEX[c] || '#ccc') + ';" title="' + escapeHtml(c) + '"></span>';
    }).join('');
    var more = p.colours.length > 5 ? '<span class="swatch-more">+' + (p.colours.length - 5) + '</span>' : '';
    var detailHref = 'products/' + p.slug;

    return '' +
      '<div class="pcard" data-slug="' + p.slug + '">' +
      '  <a class="pcard-img" href="' + detailHref + '" aria-label="View ' + escapeHtml(p.family) + '">' +
      '    <img src="' + img + '" alt="' + escapeHtml(p.family + ' — ' + p.material + ' ' + p.category) + '" loading="lazy">' +
      '    <span class="pcard-stock"><i class="fa-solid fa-circle"></i> In Stock</span>' +
      '  </a>' +
      '  <div class="pcard-body">' +
      '    <h3><a href="' + detailHref + '">' + escapeHtml(p.family) + '</a></h3>' +
      '    <p class="pcard-desc">' + escapeHtml(p.description) + '</p>' +
      '    <div class="pcard-meta"><span><b>Material:</b> ' + escapeHtml(p.material) + '</span><span><b>Sizes:</b> ' + escapeHtml(sizesText) + '</span></div>' +
      '    <div class="pcard-swatches">' + swatches + more + '</div>' +
      (p.isPOA
        ? '    <div class="pcard-price"><span class="amount" style="font-size:1.05rem;">Price on Application</span></div>' +
          '    <p style="font-size:.7rem;color:var(--text-muted);margin:0;">Contact us for a tailored price.</p>' +
          '    <div class="pcard-actions">' +
          '      <a href="quote?product=' + encodeURIComponent(p.family) + '" class="btn btn-dark" style="width:100%;justify-content:center;">REQUEST QUOTE</a>' +
          '    </div>'
        : '    <div class="pcard-price"><span class="amount">From ' + money(p.minPrice) + '</span><span class="excl">excl. VAT</span></div>' +
          '    <div class="pcard-actions">' +
          '      <button type="button" class="btn btn-gold pcard-add-btn" data-slug="' + p.slug + '">ADD TO QUOTE</button>' +
          '    </div>') +
      '  </div>' +
      '</div>';
  }

  function renderGrid() {
    var filtered = sortProducts(applyFilters(null));
    var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (page > totalPages) page = totalPages;
    var start = (page - 1) * PAGE_SIZE;
    var end = Math.min(start + PAGE_SIZE, filtered.length);

    // Every page should render full rows of real products — PAGE_SIZE is a
    // multiple of COLS so non-last pages always land on a row boundary. The
    // last page can still fall short (e.g. 69 items / 15 per page = a final
    // page of 9, which is fine, or 70 items = a final page of 10, which
    // isn't). When that happens, pull the window back to the previous row
    // boundary so it ends on a full last row — those extra items simply
    // repeat from the page before rather than leaving a part-filled row.
    if (page === totalPages) {
      var shortBy = (end - start) % COLS;
      if (shortBy !== 0) {
        start = Math.max(0, start - (COLS - shortBy));
      }
    }

    var pageItems = filtered.slice(start, end);

    grid.innerHTML = pageItems.length
      ? pageItems.map(cardHtml).join('')
      : '<div class="pgrid-empty">No products match your filters. Try clearing a filter or search term.</div>';

    if (countEl) {
      countEl.textContent = filtered.length
        ? 'Showing ' + (start + 1) + '–' + end + ' of ' + filtered.length + ' results'
        : 'No results';
    }

    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    if (!paginationEl) return;
    if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }
    var html = '<button type="button" data-page="' + (page - 1) + '"' + (page === 1 ? ' disabled' : '') + ' aria-label="Previous page"><i class="fa-solid fa-chevron-left"></i></button>';
    var pages = [];
    for (var i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
      else if (pages[pages.length - 1] !== '...') pages.push('...');
    }
    pages.forEach(function (p) {
      if (p === '...') { html += '<span class="pg-ellipsis">…</span>'; return; }
      html += '<button type="button" data-page="' + p + '" class="' + (p === page ? 'active' : '') + '">' + p + '</button>';
    });
    html += '<button type="button" data-page="' + (page + 1) + '"' + (page === totalPages ? ' disabled' : '') + ' aria-label="Next page"><i class="fa-solid fa-chevron-right"></i></button>';
    paginationEl.innerHTML = html;
  }

  paginationEl && paginationEl.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-page]');
    if (!btn || btn.disabled) return;
    page = parseInt(btn.getAttribute('data-page'), 10);
    renderGrid();
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  function renderAll() {
    renderFilters();
    renderChips();
    renderGrid();
  }

  // ---------- Quote List (shared localStorage cart, same schema as js/catalogue.js) ----------
  function loadQuoteList() {
    try { return JSON.parse(localStorage.getItem(QUOTE_KEY)) || []; } catch (e) { return []; }
  }
  function saveQuoteList(list) { localStorage.setItem(QUOTE_KEY, JSON.stringify(list)); }

  function addToQuote(p, qty) {
    var variant = p.variants[0];
    var list = loadQuoteList();
    var lineId = p.uid + '::' + variant.code;
    var existing = list.filter(function (l) { return l.lineId === lineId; })[0];
    if (existing) existing.qty = Math.min(999, existing.qty + qty);
    else list.push({ lineId: lineId, cat: p.cat, category: p.category, material: p.materialGroup, family: p.family, label: variant.label, code: variant.code, price: variant.price, qty: qty });
    saveQuoteList(list);
    renderQuoteList();
    return list;
  }

  var quoteCountEl = document.getElementById('quote-count');
  var quoteLinesEl = document.getElementById('quote-lines');
  var quoteSubtotalEl = document.getElementById('quote-subtotal');
  var quoteEmptyEl = document.getElementById('quote-empty');
  var quoteFooterEl = document.getElementById('quote-footer');

  function renderQuoteList() {
    var list = loadQuoteList();
    var count = list.reduce(function (sum, l) { return sum + l.qty; }, 0);
    var subtotal = list.reduce(function (sum, l) { return sum + l.qty * l.price; }, 0);
    if (quoteCountEl) quoteCountEl.textContent = count;
    if (!quoteLinesEl) return;
    if (!list.length) {
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
        '  <div class="cart-line-info"><div class="cart-line-name">' + escapeHtml(l.family) + '</div>' +
        '    <div class="cart-line-variant">' + escapeHtml(l.label) + ' · ' + money(l.price) + ' excl. VAT</div></div>' +
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
        var list = loadQuoteList();
        var l = list.filter(function (x) { return x.lineId === lineId; })[0];
        if (l) {
          if (val <= 0) list = list.filter(function (x) { return x.lineId !== lineId; });
          else l.qty = Math.min(999, val);
          saveQuoteList(list);
          renderQuoteList();
        }
        return;
      }
      if (e.target.closest('.cart-line-remove')) {
        saveQuoteList(loadQuoteList().filter(function (x) { return x.lineId !== lineId; }));
        renderQuoteList();
      }
    });
  }

  var quoteToggle = document.getElementById('quote-toggle');
  var quoteClose = document.getElementById('quote-close');
  var quoteOverlay = document.getElementById('quote-overlay');
  var quoteDrawer = document.getElementById('quote-drawer');
  function openQuote() { if (quoteDrawer) { quoteDrawer.classList.add('open'); document.body.classList.add('cart-open'); } }
  function closeQuote() { if (quoteDrawer) { quoteDrawer.classList.remove('open'); document.body.classList.remove('cart-open'); } }
  quoteToggle && quoteToggle.addEventListener('click', openQuote);
  quoteClose && quoteClose.addEventListener('click', closeQuote);
  quoteOverlay && quoteOverlay.addEventListener('click', closeQuote);

  var quoteSubmitBtn = document.getElementById('quote-submit-btn');
  quoteSubmitBtn && quoteSubmitBtn.addEventListener('click', function () {
    if (!loadQuoteList().length) return;
    window.location.href = 'quote?from=quotelist';
  });

  grid.addEventListener('click', function (e) {
    var addBtn = e.target.closest('.pcard-add-btn');
    if (addBtn) {
      var p = ALL.filter(function (x) { return x.slug === addBtn.getAttribute('data-slug'); })[0];
      if (!p) return;
      addToQuote(p, 1);
      openQuote();
      addBtn.textContent = 'ADDED ✓';
      setTimeout(function () { addBtn.textContent = 'ADD TO QUOTE'; }, 1200);
      return;
    }
    var quoteBtn = e.target.closest('.pcard-quote-btn');
    if (quoteBtn) {
      var pr = ALL.filter(function (x) { return x.slug === quoteBtn.getAttribute('data-slug'); })[0];
      if (!pr) return;
      addToQuote(pr, 1);
      window.location.href = 'quote?from=quotelist';
    }
  });

  renderAll();
  renderQuoteList();
});
