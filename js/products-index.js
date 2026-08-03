// Flattens window.PRODUCT_CATALOG (js/product-catalog.js) into one structured
// record per product family, with Material / Colour / Size(mm) / Application
// parsed out for the Products page filters and for the generated product
// detail pages (see scripts/generate-product-pages.js).
//
// Loaded identically in the browser (via <script>, exposes window.PRODUCT_INDEX_LIB)
// and in Node (via vm sandbox, same as js/product-images.js is loaded by
// scripts/prerender-catalogue.js) — keep this file dependency-free.
window.PRODUCT_INDEX_LIB = (function () {

  // Product Category -> a distinct "where it's used" facet, so Application
  // reads as a different question to the shopper than Category does.
  var APPLICATIONS = {
    'Tile Trims & Edges': 'Tile Edging & Finishing',
    'Stair Nosing': 'Stairs & Steps',
    'Flooring Profiles': 'Floor Transitions',
    'Metal Profiles': 'Decorative Trims & Feature Walls',
    'PVC Profiles': 'Wet Areas (Bathrooms & Kitchens)',
    'Movement Joints': 'Expansion & Movement Joints',
    'Spacers': 'Tile Installation',
    'Angle & Flat Bar': 'Corner Protection & Edging'
  };

  // Mirrors js/catalogue.js's DESCRIPTIONS exactly, keyed by Product Category,
  // taking the raw material-group name (e.g. "Anodised & Powder Coated").
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
  function shortDescription(cat, material) {
    var fn = DESCRIPTIONS[cat];
    return fn ? fn(material) : ('Premium ' + material + ' finishing profile.');
  }

  // Ordered so longer / more specific finish phrases match before generic
  // single-word ones (e.g. "Matt Rose" before a bare "Black" check).
  var COLOUR_PATTERNS = [
    [/carpet bronze/i, ['Bronze']],
    [/dark bronze/i, ['Bronze']],
    [/light bronze/i, ['Bronze']],
    [/matt bronze/i, ['Bronze']],
    [/matt rose/i, ['Rose Gold']],
    [/shiny rose/i, ['Rose Gold']],
    [/matt gold/i, ['Gold']],
    [/polished brass/i, ['Gold']],
    [/matt brass/i, ['Gold']],
    [/matt sand/i, ['Sand']],
    [/shiny sand/i, ['Sand']],
    [/matt titanium/i, ['Titanium']],
    [/shiny titanium/i, ['Titanium']],
    [/matt silver/i, ['Silver']],
    [/polished silver/i, ['Silver']],
    [/brushed/i, ['Silver']],
    [/black\s*\/\s*white/i, ['Black', 'White']],
    [/powder coated black/i, ['Black']],
    [/\bblack\b/i, ['Black']],
    [/\bwhite\b/i, ['White']]
  ];

  // Fallback colour when a variant label carries no finish keyword at all —
  // i.e. the product's natural, uncoated material colour.
  function defaultColour(material) {
    if (material === 'Brass') return ['Gold'];
    if (material === 'PVC') return ['White'];
    if (material === 'Vinyl') return ['Grey'];
    if (material === 'Plastic') return ['Natural'];
    return ['Silver']; // Aluminium / Stainless Steel mill finish
  }

  // PVC and Vinyl variant labels never encode colour (colour is chosen at
  // order time from a standard range) — sourced from the JS_PriceList.xlsx
  // "PVC Colours" / Vinyls "Standard colours" reference lists, not guessed.
  var STANDARD_COLOURS = {
    'PVC': ['White', 'Ivory', 'Buff', 'Light Grey', 'Dark Grey', 'Light Brown', 'Dark Brown', 'Cappuccino', 'Terracotta', 'Black'],
    'Vinyl': ['Black', 'Blue', 'Light Grey', 'Dark Grey', 'Fawn', 'Tan', 'Mink', 'Sage']
  };

  function materialFor(group, family) {
    if (/stainless/i.test(family)) return 'Stainless Steel';
    if (/\bbrass\b/i.test(family)) return 'Brass';
    if (/\bpvc\b/i.test(family)) return 'PVC';
    if (group === 'Spacers') return 'Plastic';
    if (group === 'Vinyls') return 'Vinyl';
    return 'Aluminium'; // Aluminium, Anodised & Powder Coated, Carpet & Wood, Movement Joints, Angle & Flat Bar default
  }

  function slugify(s) {
    return String(s).toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function parseSizes(variants) {
    var seen = {}; var nums = [];
    variants.forEach(function (v) {
      var re = /(\d+(?:\.\d+)?)\s*mm/gi, m;
      while ((m = re.exec(v.label))) {
        var val = parseFloat(m[1]);
        if (!seen[val]) { seen[val] = true; nums.push(val); }
      }
    });
    nums.sort(function (a, b) { return a - b; });
    return nums.map(function (n) { return n + 'mm'; });
  }

  function parseColours(variants, material) {
    var seen = {};
    variants.forEach(function (v) {
      var matched = false;
      for (var i = 0; i < COLOUR_PATTERNS.length; i++) {
        if (COLOUR_PATTERNS[i][0].test(v.label)) {
          COLOUR_PATTERNS[i][1].forEach(function (c) { seen[c] = true; });
          matched = true;
          break;
        }
      }
      if (!matched) defaultColour(material).forEach(function (c) { seen[c] = true; });
    });
    return Object.keys(seen);
  }

  // Swatch colours for rendering — approximate, for the small colour dots only.
  var SWATCH_HEX = {
    'Silver': '#b7bcc2', 'Gold': '#c9a227', 'Black': '#1a1a1a', 'White': '#ffffff',
    'Bronze': '#7c5a3a', 'Titanium': '#8d8983', 'Rose Gold': '#c98f7a', 'Sand': '#d9c49a',
    'Grey': '#9b9b9b', 'Natural': '#e4c66b',
    'Ivory': '#f2ead2', 'Buff': '#d9c39a', 'Dark Grey': '#5a5a5a', 'Light Brown': '#a9784f',
    'Dark Brown': '#4a2f1f', 'Cappuccino': '#8a6142', 'Terracotta': '#b1583a',
    'Blue': '#2f4d7a', 'Fawn': '#c9a679', 'Tan': '#c19a6b', 'Mink': '#7a6a5a', 'Sage': '#8a9878'
  };

  function build(PRODUCT_CATALOG, PRODUCT_IMAGES) {
    PRODUCT_IMAGES = PRODUCT_IMAGES || {};
    var out = [];
    var seenSlugs = {};
    PRODUCT_CATALOG.forEach(function (group) {
      group.products.forEach(function (prod) {
        var material = materialFor(group.category, prod.family);
        var uid = group.category + '||' + prod.family;
        var baseSlug = slugify(group.category + '-' + prod.family);
        var slug = baseSlug, n = 2;
        while (seenSlugs[slug]) { slug = baseSlug + '-' + n; n++; }
        seenSlugs[slug] = true;

        var numericPrices = prod.variants.map(function (v) { return v.price; }).filter(function (p) { return typeof p === 'number'; });
        var isPOA = numericPrices.length === 0; // every variant priced "POA" (price on application)
        var codes = prod.variants.map(function (v) { return v.code; }).filter(Boolean);

        out.push({
          uid: uid,
          slug: slug,
          family: prod.family,
          materialGroup: group.category,
          material: material,
          cat: prod.cat,
          application: APPLICATIONS[prod.cat] || prod.cat,
          sizes: parseSizes(prod.variants),
          colours: STANDARD_COLOURS[material] ? STANDARD_COLOURS[material].slice() : parseColours(prod.variants, material),
          isPOA: isPOA,
          minPrice: isPOA ? null : Math.min.apply(null, numericPrices),
          maxPrice: isPOA ? null : Math.max.apply(null, numericPrices),
          variants: prod.variants,
          primaryCode: codes[0] || '',
          codeCount: codes.length,
          image: PRODUCT_IMAGES[uid] || '',
          description: shortDescription(prod.cat, material),
          sortIndex: out.length
        });
      });
    });
    return out;
  }

  return { build: build, APPLICATIONS: APPLICATIONS, SWATCH_HEX: SWATCH_HEX, slugify: slugify };
})();
