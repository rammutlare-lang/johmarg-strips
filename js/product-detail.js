// Product detail page (products/<slug>.html) interactivity: Add to Quote per
// variant row (and the top "Add to Quote" / "Request Quote" buttons default
// to the first row), plus the same Quote List cart drawer used across the
// site (js/catalogue.js), so items added here appear in the same drawer and
// on quote.html. Reads variant data straight from the rendered table's
// data-* attributes rather than re-loading the full catalogue script.
document.addEventListener('DOMContentLoaded', function () {
  var table = document.querySelector('.pdp-variant-table');
  var meta = window.PDP_PRODUCT;
  if (!table || !meta) return;

  var QUOTE_KEY = 'johmarg_quote_v1';

  function money(n) {
    return 'R' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function firstRow() { return table.querySelector('tbody tr'); }
  function rowData(tr) {
    return { code: tr.getAttribute('data-code'), price: parseFloat(tr.getAttribute('data-price')), label: tr.getAttribute('data-label') };
  }

  function loadQuoteList() {
    try { return JSON.parse(localStorage.getItem(QUOTE_KEY)) || []; } catch (e) { return []; }
  }
  function saveQuoteList(list) { localStorage.setItem(QUOTE_KEY, JSON.stringify(list)); }

  function addToQuote(variant, qty) {
    var list = loadQuoteList();
    var lineId = meta.uid + '::' + variant.code;
    var existing = list.filter(function (l) { return l.lineId === lineId; })[0];
    if (existing) existing.qty = Math.min(999, existing.qty + qty);
    else list.push({ lineId: lineId, cat: meta.cat, category: meta.category, material: meta.materialGroup, family: meta.family, label: variant.label, code: variant.code, price: variant.price, qty: qty });
    saveQuoteList(list);
    renderQuoteList();
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
    window.location.href = '../quote?from=quotelist';
  });

  table.addEventListener('click', function (e) {
    var btn = e.target.closest('.pdp-row-add');
    if (!btn) return;
    var tr = btn.closest('tr');
    addToQuote(rowData(tr), 1);
    openQuote();
    btn.textContent = 'ADDED';
    setTimeout(function () { btn.textContent = 'ADD'; }, 1200);
  });

  var addBtn = document.getElementById('pdp-add-btn');
  addBtn && addBtn.addEventListener('click', function () {
    var row = firstRow();
    if (!row) return;
    addToQuote(rowData(row), 1);
    openQuote();
    addBtn.textContent = 'ADDED ✓';
    setTimeout(function () { addBtn.textContent = 'ADD TO QUOTE'; }, 1200);
  });

  var quoteBtn = document.getElementById('pdp-quote-btn');
  quoteBtn && quoteBtn.addEventListener('click', function () {
    var row = firstRow();
    if (!row) return;
    addToQuote(rowData(row), 1);
    window.location.href = '../quote?from=quotelist';
  });

  renderQuoteList();
});
