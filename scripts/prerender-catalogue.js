// Bakes the same markup js/catalogue.js renders client-side directly into
// each category page's static HTML, so search engine crawlers see full
// product content without executing JS. Mirrors js/catalogue.js's
// renderGrid()/tabs logic exactly.
//
// Re-run this (from the repo root: node scripts/prerender-catalogue.js)
// whenever js/product-catalog.js or js/product-images.js change (new
// products, price updates, new photos).
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

function loadGlobal(file, varName) {
  const text = fs.readFileSync(path.join(root, 'js', file), 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(text, sandbox);
  return sandbox.window[varName];
}

const PRODUCT_CATALOG = loadGlobal('product-catalog.js', 'PRODUCT_CATALOG');
const PRODUCT_IMAGES = loadGlobal('product-images.js', 'PRODUCT_IMAGES');

const PAGES = [
  { file: 'tile-trims.html', cat: 'Tile Trims & Edges' },
  { file: 'stair-nosing.html', cat: 'Stair Nosing' },
  { file: 'flooring-profiles.html', cat: 'Flooring Profiles' },
  { file: 'metal-profiles.html', cat: 'Metal Profiles' },
  { file: 'pvc-profiles.html', cat: 'PVC Profiles' },
  { file: 'movement-joints.html', cat: 'Movement Joints' },
  { file: 'spacers.html', cat: 'Spacers' },
  { file: 'angle-flat-bar.html', cat: 'Angle & Flat Bar' }
];

function money(n) {
  return 'R' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const DESCRIPTIONS = {
  'Tile Trims & Edges': function (material) { return 'Premium tile trim profile in ' + material + ', engineered for a clean, professional edge finish.'; },
  'Stair Nosing': function (material) { return 'Durable stair nosing profile in ' + material + ', designed for safety and a lasting finish on every step.'; },
  'Metal Profiles': function (material) { return 'Decorative ' + material + ' transition profile, ideal for a smart, professional finish.'; },
  'PVC Profiles': function () { return 'Lightweight, corrosion-resistant PVC profile — ideal for bathrooms, kitchens and other wet areas.'; },
  'Movement Joints': function (material) { return material + ' movement joint that allows for expansion and ensures long-lasting performance.'; },
  'Flooring Profiles': function (material) { return 'Smooth ' + material + ' transition profile between different flooring surfaces.'; },
  'Spacers': function () { return 'Consistent, professional tiling joints for accurate, even tile spacing.'; },
  'Angle & Flat Bar': function (material) { return 'Durable ' + material + ' edging and corner protection for every application.'; }
};
function shortDescription(pageCat, material) {
  var fn = DESCRIPTIONS[pageCat];
  return fn ? fn(material) : ('Premium ' + material + ' finishing profile.');
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderPage(pageCat) {
  const catalog = PRODUCT_CATALOG
    .map(function (group) {
      return { category: group.category, products: group.products.filter(function (p) { return p.cat === pageCat; }) };
    })
    .filter(function (group) { return group.products.length > 0; });

  const materialNames = catalog.map(function (c) { return c.category; });

  let tabsHtml = '';
  if (materialNames.length > 1) {
    tabsHtml = '<button class="shop-tab active" data-cat="all">All Materials</button>' +
      materialNames.map(function (name) {
        return '<button class="shop-tab" data-cat="' + name.replace(/"/g, '&quot;') + '">' + name + '</button>';
      }).join('');
  }

  let sectionsHtml = '';
  catalog.forEach(function (mat) {
    let cardsHtml = '';
    mat.products.forEach(function (prod) {
      const uid = mat.category + '||' + prod.family;
      const options = prod.variants.map(function (v, i) {
        return '<option value="' + i + '">' + escapeHtml(v.label) + '</option>';
      }).join('');
      const photo = PRODUCT_IMAGES[uid];
      const isFamilyPOA = prod.variants.every(function (v) { return typeof v.price !== 'number'; });
      cardsHtml += '' +
        '<div class="shop-card" data-uid="' + encodeURIComponent(uid) + '">' +
        (photo
          ? '  <div class="shop-card-img has-photo" style="background-image:url(\'' + photo + '\');"></div>'
          : '  <div class="shop-card-img"><i class="fa-solid fa-image"></i><span>Photo coming soon</span></div>') +
        '  <div class="shop-card-body">' +
        '  <span class="shop-card-cat">' + escapeHtml(mat.category) + '</span>' +
        '  <h3>' + escapeHtml(prod.family) + '</h3>' +
        '  <p class="shop-card-desc">' + escapeHtml(shortDescription(pageCat, mat.category)) + '</p>' +
        '  <label class="shop-variant-label">Size / Finish</label><select class="shop-variant-select">' + options + '</select>' +
        (isFamilyPOA
          ? '  <div class="shop-card-price"><span class="shop-price-amount" style="font-size:1.1rem;">Price on Application</span></div>' +
            '  <div class="shop-card-row">' +
            '    <a href="quote?product=' + encodeURIComponent(prod.family) + '" class="btn btn-gold" style="width:100%;justify-content:center;">REQUEST QUOTE</a>' +
            '  </div>'
          : '  <div class="shop-card-price"><span class="shop-price-amount">From ' + money(prod.variants[0].price) + '</span><span class="shop-price-excl">excl. VAT</span></div>' +
            '  <div class="shop-card-row">' +
            '    <div class="shop-qty"><button type="button" class="qty-btn" data-dir="-1">−</button><input type="number" class="qty-input" value="1" min="1" max="999"><button type="button" class="qty-btn" data-dir="1">+</button></div>' +
            '    <button type="button" class="btn btn-gold shop-add-btn">ADD TO QUOTE</button>' +
            '  </div>') +
        '  </div>' +
        '</div>';
    });

    sectionsHtml += '' +
      '<div class="shop-category-section">' +
      (materialNames.length > 1 ? '  <h2 class="shop-category-heading">' + escapeHtml(mat.category) + '</h2>' : '') +
      '  <div class="shop-grid">' + cardsHtml + '</div>' +
      '</div>';
  });

  return { tabsHtml: tabsHtml, gridHtml: sectionsHtml, hideTabs: materialNames.length <= 1 };
}

const tabsRe = /<div class="shop-tabs" id="catalogue-tabs"[^>]*>[\s\S]*?<\/div>/;
const gridRe = /<div id="catalogue-grid">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/;

let failures = [];
PAGES.forEach(function (page) {
  const p = path.join(root, page.file);
  let text = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

  const rendered = renderPage(page.cat);
  const tabsAttr = rendered.hideTabs ? ' style="display:none;"' : '';

  if (!tabsRe.test(text)) { failures.push(page.file + ': catalogue-tabs div not found'); return; }
  text = text.replace(tabsRe, '<div class="shop-tabs" id="catalogue-tabs"' + tabsAttr + '>' + rendered.tabsHtml + '</div>');

  const gridOnlyRe = /<div id="catalogue-grid">[\s\S]*?<\/div>\n {4}<\/div>\n {2}<\/div>\n<\/section>/;
  // Simplest reliable approach: find the exact opening tag and its matching
  // closing </div> by tracking nesting depth from that point.
  const openIdx = text.indexOf('<div id="catalogue-grid">');
  if (openIdx === -1) { failures.push(page.file + ': catalogue-grid div not found'); return; }
  let depth = 0, i = openIdx, closeIdx = -1;
  const openTagLen = '<div id="catalogue-grid">'.length;
  depth = 1; i = openIdx + openTagLen;
  while (i < text.length && depth > 0) {
    if (text.startsWith('<div', i)) { depth++; i += 4; }
    else if (text.startsWith('</div>', i)) { depth--; if (depth === 0) { closeIdx = i; break; } i += 6; }
    else { i++; }
  }
  if (closeIdx === -1) { failures.push(page.file + ': could not find matching close for catalogue-grid'); return; }
  text = text.slice(0, openIdx) + '<div id="catalogue-grid">' + rendered.gridHtml + text.slice(closeIdx);

  fs.writeFileSync(p, text.replace(/\n/g, '\r\n'));
  const cardCount = (rendered.gridHtml.match(/class="shop-card"/g) || []).length;
  console.log('Prerendered', page.file, '-', cardCount, 'products');
});

if (failures.length) {
  console.error('\nFAILURES / SKIPPED:');
  failures.forEach(function (f) { console.error(' -', f); });
  process.exitCode = 1;
}
