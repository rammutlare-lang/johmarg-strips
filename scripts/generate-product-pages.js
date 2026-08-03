// Generates one static SEO product detail page per product family under
// /products/<slug>.html — galleries, spec table, generic per-category
// installation guide / applications / compatible-types / FAQ, downloads,
// related products, an enquiry form, and Product + Breadcrumb JSON-LD.
//
// Re-run this (from the repo root: node scripts/generate-product-pages.js)
// whenever js/product-catalog.js or js/product-images.js change.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'products');

function loadGlobal(file, varName) {
  const text = fs.readFileSync(path.join(root, 'js', file), 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(text, sandbox);
  return sandbox.window[varName];
}

const PRODUCT_CATALOG = loadGlobal('product-catalog.js', 'PRODUCT_CATALOG');
const PRODUCT_IMAGES = loadGlobal('product-images.js', 'PRODUCT_IMAGES');
const LIB = loadGlobal('products-index.js', 'PRODUCT_INDEX_LIB');
const ALL = LIB.build(PRODUCT_CATALOG, PRODUCT_IMAGES);

const CAT_FALLBACK_IMAGE = {
  'Tile Trims & Edges': 'product-tile-trim.jpg',
  'Stair Nosing': 'product-stair-nosing.jpg',
  'Flooring Profiles': 'product-flooring.jpg',
  'Metal Profiles': 'product-metal.jpg',
  'PVC Profiles': 'product-pvc.jpg',
  'Movement Joints': 'product-movement.jpg',
  'Spacers': 'product-spacers.jpg',
  'Angle & Flat Bar': 'product-angle-flat-bar.jpg'
};

// ---------- Generic per-category content (approved: templated, not fabricated per-SKU claims) ----------
const INSTALL_STEPS = {
  'Tile Trims & Edges': [
    'Measure the tile edge and cut the trim to length with a mitre saw or hacksaw fitted with a fine-tooth blade.',
    'Dry-fit the trim against the tile edge and mark any mitre cuts needed at corners or returns.',
    'Apply tile adhesive to the substrate and bed the trim’s perforated fixing leg into the adhesive alongside the tile.',
    'Press the tile firmly against the trim, remove excess adhesive immediately, and leave to cure before grouting.'
  ],
  'Stair Nosing': [
    'Measure the full width of the step and cut the nosing to length, mitring external corners where required.',
    'Dry-fit the nosing over the step edge to confirm alignment with the tile or tread surface.',
    'Bed the nosing’s fixing leg into tile adhesive (or fix mechanically for retro-fit profiles) flush with the step edge.',
    'Tile up to the nosing, allow the adhesive to cure fully, then grout before the step is used.'
  ],
  'Flooring Profiles': [
    'Measure the transition point between the two flooring surfaces and cut the profile to length.',
    'Dry-fit the profile to confirm it sits flush with both finished floor levels either side of the joint.',
    'Fix the profile track/base using adhesive, screws or the manufacturer’s clip system appropriate to the substrate.',
    'Snap or press the cover profile into the fixed base once both flooring surfaces are fully laid.'
  ],
  'Metal Profiles': [
    'Measure the run and cut the profile to length, mitring corners for a neat decorative finish.',
    'Dry-fit the profile against the tile or wall surface to check alignment before fixing.',
    'Bed the fixing leg into tile adhesive or suitable construction adhesive alongside the tile or feature surface.',
    'Wipe away excess adhesive immediately and allow to cure fully before grouting or further finishing.'
  ],
  'PVC Profiles': [
    'Measure the tile edge or joint and cut the PVC profile to length with a fine-tooth blade.',
    'Dry-fit the profile to confirm the seal sits correctly against the tile edge or joint.',
    'Bed the fixing leg into tile adhesive or silicone sealant, keeping the profile square to the surface.',
    'Press the tile or surface against the profile, remove excess adhesive/sealant, and allow to cure.'
  ],
  'Movement Joints': [
    'Plan joint spacing according to the tiled area size and expected thermal movement before tiling begins.',
    'Cut the movement joint to length and position it across the expansion gap in the substrate.',
    'Bed both fixing legs into tile adhesive so the joint sits flush with the surrounding tile surface.',
    'Tile up to each side of the joint, leaving the central movement gap free of adhesive and grout.'
  ],
  'Spacers': [
    'Select a spacer size that matches your desired grout joint width for the tile being laid.',
    'Place spacers at each tile corner (or along edges for wedge/levelling types) before pressing the next tile into place.',
    'Check alignment and grout-line consistency across the field as you work, adjusting spacers as needed.',
    'Remove standard spacers before grouting; levelling system caps/straps are removed once the adhesive has cured.'
  ],
  'Angle & Flat Bar': [
    'Measure the corner, edge or opening and cut the angle or flat bar to length.',
    'Dry-fit the profile to check it sits flush against both adjoining surfaces.',
    'Fix using adhesive, screws or rivets appropriate to the substrate and expected load.',
    'Finish or paint as required once the profile is securely fixed in place.'
  ]
};

const APPLICATIONS_TEXT = {
  'Tile Trims & Edges': ['Wall & floor tile edges', 'Exposed tile edges around openings, niches and steps', 'Residential & commercial tiling projects'],
  'Stair Nosing': ['Internal and external staircases', 'Commercial, retail and residential steps', 'Areas requiring slip-resistant step edges'],
  'Flooring Profiles': ['Transitions between carpet, laminate, vinyl, wood and tile', 'Doorways and room-to-room floor changes', 'Expansion gaps in large flooring runs'],
  'Metal Profiles': ['Decorative feature walls and mosaic borders', 'Listello and trim detailing', 'Transition strips between finishes'],
  'PVC Profiles': ['Bathrooms, showers and wet areas', 'Kitchens and other moisture-prone spaces', 'Budget-conscious tiling projects'],
  'Movement Joints': ['Large tiled floor and wall areas', 'Areas subject to thermal expansion/contraction', 'Commercial and industrial tiled floors'],
  'Spacers': ['Wall and floor tile installation', 'Achieving consistent, professional grout lines', 'Large-format tile levelling'],
  'Angle & Flat Bar': ['Corner protection on tiled or plastered edges', 'Skirting and edging applications', 'General fabrication and trim work']
};

const COMPATIBLE_TYPES = {
  'Tile Trims & Edges': 'Ceramic, porcelain and natural stone tiles of matching thickness.',
  'Stair Nosing': 'Ceramic, porcelain, natural stone, carpet and laminate-finished steps, depending on profile type.',
  'Flooring Profiles': 'Carpet, laminate, engineered wood, LVT/vinyl and tiled flooring.',
  'Metal Profiles': 'Ceramic, porcelain and mosaic tile installations.',
  'PVC Profiles': 'Ceramic and porcelain tiles in wet-area installations.',
  'Movement Joints': 'Ceramic, porcelain and natural stone tiled floors and walls.',
  'Spacers': 'Ceramic, porcelain, natural stone and large-format tiles.',
  'Angle & Flat Bar': 'Tiled, plastered, timber and metal-clad edges and corners.'
};

const FAQS = {
  'Tile Trims & Edges': [
    ['What sizes does this trim come in?', 'This profile is available in the sizes listed above, matching common tile thicknesses. If you need a size not shown, contact us and we will confirm availability.'],
    ['Can the trim be cut to length on site?', 'Yes. Aluminium, stainless steel and brass trims can be cut with a mitre saw or hacksaw fitted with a fine-tooth blade, and mitred at corners.'],
    ['Does the price include VAT?', 'No. All prices shown are excl. VAT. VAT and any delivery charges are added to your final quotation.'],
    ['Do you offer trade or bulk pricing?', 'Yes, we offer competitive pricing for contractors, retailers and bulk orders. Request a quote and let us know your quantities.']
  ],
  'Stair Nosing': [
    ['Is this nosing slip-resistant?', 'Our stair nosing profiles are designed to provide a defined, safe step edge. Insert/tread-cover variants add extra grip underfoot.'],
    ['Can it be used on external staircases?', 'Aluminium and stainless steel nosing profiles are suitable for external use; check the specific finish for coastal/corrosive environments.'],
    ['Does the price include VAT?', 'No. All prices shown are excl. VAT — VAT is added to your final quotation.'],
    ['Can this be retro-fitted to existing stairs?', 'Yes, our Retro Fit range is designed to be fixed directly onto existing step edges without re-tiling the whole stair.']
  ],
  'Flooring Profiles': [
    ['Which floor types can this profile join?', 'See "Compatible Flooring Types" above — most profiles in this range are designed for a specific pairing of floor coverings.'],
    ['Can I cut this profile to fit my doorway?', 'Yes, these profiles are supplied in standard lengths and can be cut to size on site with a fine-tooth saw.'],
    ['Does the price include VAT?', 'No. All prices shown are excl. VAT — VAT is added to your final quotation.'],
    ['What finish options are available?', 'See the colour options above — most profiles are available in natural, anodised and powder-coated finishes.']
  ],
  'Metal Profiles': [
    ['What is this profile typically used for?', 'See "Suitable Applications" above — these are largely decorative trims for feature walls, mosaics and transitions.'],
    ['Can it be cut and mitred on site?', 'Yes, using a mitre saw or hacksaw with a fine-tooth blade.'],
    ['Does the price include VAT?', 'No. All prices shown are excl. VAT — VAT is added to your final quotation.'],
    ['What finishes are available?', 'See the colour options above for the finishes available on this profile.']
  ],
  'PVC Profiles': [
    ['Is this suitable for wet areas?', 'Yes, PVC profiles are corrosion-resistant and well suited to bathrooms, showers and other wet or humid areas.'],
    ['Can it be cut to length on site?', 'Yes, using a fine-tooth blade.'],
    ['Does the price include VAT?', 'No. All prices shown are excl. VAT — VAT is added to your final quotation.'],
    ['Do you offer trade or bulk pricing?', 'Yes, request a quote and let us know your quantities for a tailored price.']
  ],
  'Movement Joints': [
    ['How far apart should movement joints be spaced?', 'Spacing depends on the tiled area size, substrate and expected thermal movement — our team can advise based on your project.'],
    ['Can this be tiled directly against?', 'Yes, tile adhesive is applied up to each side of the joint, leaving the central movement gap free.'],
    ['Does the price include VAT?', 'No. All prices shown are excl. VAT — VAT is added to your final quotation.'],
    ['Which material should I choose?', 'Aluminium suits most general applications; stainless steel offers extra corrosion resistance for wet or industrial areas.']
  ],
  'Spacers': [
    ['What grout width does each spacer size give?', 'The spacer size (in mm) corresponds directly to the grout joint width it creates.'],
    ['Are spacers removed before grouting?', 'Standard spacers are removed before grouting; self-levelling system caps and straps are snapped off once the adhesive has cured.'],
    ['Does the price include VAT?', 'No. All prices shown are excl. VAT — VAT is added to your final quotation.'],
    ['Do you offer bulk packet pricing?', 'Yes, request a quote with your required quantities for a tailored price.']
  ],
  'Angle & Flat Bar': [
    ['What is this profile typically used for?', 'See "Suitable Applications" above — these are general-purpose edging, corner and fabrication profiles.'],
    ['Can it be cut, drilled or painted?', 'Yes, aluminium, PVC and brass angle/flat bar can be cut to length and, for aluminium and brass, drilled or painted as needed.'],
    ['Does the price include VAT?', 'No. All prices shown are excl. VAT — VAT is added to your final quotation.'],
    ['Do you offer trade or bulk pricing?', 'Yes, request a quote and let us know your quantities.']
  ]
};

function money(n) {
  return 'R' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escapeAttr(s) { return escapeHtml(s); }

function relatedProducts(p) {
  const sameCat = ALL.filter(function (x) { return x.cat === p.cat && x.slug !== p.slug; });
  const out = [];
  const startIdx = sameCat.findIndex(function (x) { return x.sortIndex > p.sortIndex; });
  const ordered = startIdx === -1 ? sameCat : sameCat.slice(startIdx).concat(sameCat.slice(0, startIdx));
  for (let i = 0; i < ordered.length && out.length < 4; i++) out.push(ordered[i]);
  return out;
}

function swatchDots(colours) {
  return colours.map(function (c) {
    return '<span class="swatch" style="background:' + (LIB.SWATCH_HEX[c] || '#ccc') + ';" title="' + escapeAttr(c) + '"></span>';
  }).join('');
}

function renderPage(p) {
  const catFilterHref = 'products?cat=' + encodeURIComponent(p.cat);
  const catFilterUrl = 'https://www.johmargstrips.co.za/' + catFilterHref;
  const image = p.image || 'images/' + (CAT_FALLBACK_IMAGE[p.cat] || 'products-hero.jpg');
  const imageAbs = image.startsWith('images/') ? '../' + image : image;
  const canonical = 'https://www.johmargstrips.co.za/products/' + p.slug;
  const title = p.family + ' | ' + p.material + ' ' + p.cat + ' | Johmarg Strips';
  const metaDesc = (p.description + ' ' + (p.isPOA ? 'Price on application.' : 'From ' + money(p.minPrice) + ' excl. VAT.') + ' Sizes: ' + (p.sizes.length ? p.sizes.join(', ') : 'one size') + '.').slice(0, 300);

  const variantRows = p.variants.map(function (v) {
    const rowIsPOA = typeof v.price !== 'number';
    return '<tr data-code="' + escapeAttr(v.code) + '" data-price="' + (rowIsPOA ? '' : v.price) + '" data-label="' + escapeAttr(v.label) + '">' +
      '<td>' + escapeHtml(v.label) + '</td>' +
      '<td>' + (rowIsPOA ? 'Price on application' : money(v.price)) + '</td>' +
      '<td>' + (rowIsPOA
        ? '<a href="../quote?product=' + encodeURIComponent(p.family + ' - ' + v.label) + '" class="btn btn-outline-dark" style="padding:6px 12px;font-size:.7rem;">ENQUIRE</a>'
        : '<button type="button" class="btn btn-outline-dark pdp-row-add" style="padding:6px 12px;font-size:.7rem;">ADD</button>') +
      '</td>' +
      '</tr>';
  }).join('');

  const steps = INSTALL_STEPS[p.cat] || [];
  const stepsHtml = steps.map(function (s, i) {
    return '<div class="step"><div class="num">' + (i + 1) + '</div><div><p>' + escapeHtml(s) + '</p></div></div>';
  }).join('');

  const appsHtml = (APPLICATIONS_TEXT[p.cat] || []).map(function (a) { return '<span class="pdp-tag">' + escapeHtml(a) + '</span>'; }).join('');

  const faqHtml = (FAQS[p.cat] || []).map(function (f) {
    return '<details><summary>' + escapeHtml(f[0]) + '</summary><p>' + escapeHtml(f[1]) + '</p></details>';
  }).join('');

  const related = relatedProducts(p);
  const relatedHtml = related.map(function (r) {
    const rImg = r.image || 'images/' + (CAT_FALLBACK_IMAGE[r.cat] || 'products-hero.jpg');
    const rImgAbs = rImg.startsWith('images/') ? '../' + rImg : rImg;
    return '<div class="pcard" data-slug="' + r.slug + '">' +
      '<a class="pcard-img" href="' + r.slug + '" style="background-image:url(\'' + rImgAbs + '\');" aria-label="View ' + escapeAttr(r.family) + '"></a>' +
      '<div class="pcard-body">' +
      '<h3><a href="' + r.slug + '">' + escapeHtml(r.family) + '</a></h3>' +
      '<div class="pcard-price"><span class="amount">' + (r.isPOA ? 'Price on Application' : 'From ' + money(r.minPrice)) + '</span>' + (r.isPOA ? '' : '<span class="excl">excl. VAT</span>') + '</div>' +
      '<div class="pcard-actions"><a href="' + r.slug + '" class="btn btn-outline-dark">VIEW DETAILS</a></div>' +
      '</div></div>';
  }).join('');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.family,
    description: p.description,
    category: p.cat,
    material: p.material,
    image: 'https://www.johmargstrips.co.za/' + image,
    brand: { '@type': 'Brand', name: 'Johmarg Strips' },
    offers: p.isPOA ? {
      '@type': 'Offer',
      priceCurrency: 'ZAR',
      availability: 'https://schema.org/InStock',
      url: canonical,
      description: 'Price on application — contact us for a tailored quote.'
    } : {
      '@type': 'AggregateOffer',
      priceCurrency: 'ZAR',
      lowPrice: p.minPrice,
      highPrice: p.maxPrice,
      offerCount: p.variants.length,
      availability: 'https://schema.org/InStock',
      url: canonical
    }
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.johmargstrips.co.za/' },
      { '@type': 'ListItem', position: 2, name: 'Products', item: 'https://www.johmargstrips.co.za/products' },
      { '@type': 'ListItem', position: 3, name: p.cat, item: catFilterUrl },
      { '@type': 'ListItem', position: 4, name: p.family, item: canonical }
    ]
  };

  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + escapeHtml(title) + '</title>\n' +
    '<meta name="description" content="' + escapeAttr(metaDesc) + '">\n' +
    '<link rel="canonical" href="' + canonical + '">\n' +
    '<meta property="og:type" content="product">\n<meta property="og:site_name" content="Johmarg Strips">\n' +
    '<meta property="og:title" content="' + escapeAttr(title) + '">\n' +
    '<meta property="og:description" content="' + escapeAttr(metaDesc) + '">\n' +
    '<meta property="og:url" content="' + canonical + '">\n' +
    '<meta property="og:image" content="https://www.johmargstrips.co.za/' + image + '">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<meta name="twitter:title" content="' + escapeAttr(title) + '">\n' +
    '<meta name="twitter:description" content="' + escapeAttr(metaDesc) + '">\n' +
    '<link rel="icon" type="image/x-icon" href="../favicon.ico">\n' +
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">\n' +
    '<link rel="stylesheet" href="../css/style.css?v=9">\n' +
    '<script type="application/ld+json">' + JSON.stringify(jsonLd) + '</script>\n' +
    '<script type="application/ld+json">' + JSON.stringify(breadcrumbLd) + '</script>\n' +
    '</head>\n<body>\n' +
    '<a href="#main" class="skip-link">Skip to main content</a>\n' +
    '<div class="topbar"><div class="container"><div class="topbar-left">' +
    '<span><i class="fa-solid fa-location-dot"></i> Proudly South African</span>' +
    '<span><i class="fa-solid fa-circle-check"></i> Trusted Since 2023</span></div>' +
    '<div class="topbar-right"><a href="tel:+27625940168"><i class="fa-solid fa-phone"></i> +27 62 594 0168</a>' +
    '<a href="mailto:johmargstrips@outlook.com"><i class="fa-solid fa-envelope"></i> johmargstrips@outlook.com</a>' +
    '<div class="topbar-social">' +
    '<a href="https://wa.me/27625940168" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>' +
    '<a href="https://web.facebook.com/profile.php?id=61572966972900" target="_blank" rel="noopener" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>' +
    '<a href="https://www.instagram.com/johmargstrips/" target="_blank" rel="noopener" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>' +
    '</div></div></div></div>\n' +
    '<nav class="navbar"><div class="container"><a href="../" class="logo"><img src="../images/logo.png" alt="Johmarg Strips"></a>' +
    '<ul class="nav-links"><li><a href="../">HOME</a></li><li><a href="../about">ABOUT US</a></li>' +
    '<li class="active"><a href="../products">PRODUCTS</a></li>' +
    '<li><a href="../applications">APPLICATIONS</a></li><li><a href="../gallery">GALLERY</a></li><li><a href="../contact">CONTACT US</a></li></ul>' +
    '<div class="nav-right"><a href="../quote" class="btn btn-gold nav-cta">GET A QUOTE</a><button class="nav-toggle" aria-label="Menu"><i class="fa-solid fa-bars"></i></button></div>' +
    '</div></nav>\n' +
    '<main id="main"><section class="section-tight"><div class="container">\n' +
    '<nav class="breadcrumb" aria-label="Breadcrumb"><a href="../">Home</a><span class="sep">/</span>' +
    '<a href="../products">Products</a><span class="sep">/</span>' +
    '<a href="../' + catFilterHref + '">' + escapeHtml(p.cat) + '</a><span class="sep">/</span>' +
    '<span class="current">' + escapeHtml(p.family) + '</span></nav>\n' +
    '<div class="pdp-layout">\n' +
    '<div><div class="pdp-gallery-main" style="background-image:url(\'' + imageAbs + '\');"></div>' +
    '<p class="pdp-gallery-note">Finish shown may vary slightly by colour option — see available finishes below.</p></div>\n' +
    '<div class="pdp-info">\n' +
    '<span class="pdp-cat">' + escapeHtml(p.cat) + ' &middot; ' + escapeHtml(p.material) + '</span>\n' +
    '<h1>' + escapeHtml(p.family) + '</h1>\n' +
    '<div class="pdp-sku-row"><span>Sizes: <b>' + escapeHtml(p.sizes.length ? p.sizes.join(', ') : 'One size') + '</b></span></div>\n' +
    (p.isPOA
      ? '<div class="pdp-price-block"><span class="amount" style="font-size:1.4rem;">Price on Application</span></div>\n' +
        '<p style="font-size:.8rem;color:var(--text-muted);margin:0 0 4px;">Contact us for a tailored price.</p>\n'
      : '<div class="pdp-price-block"><span class="amount">From ' + money(p.minPrice) + '</span><span class="excl" style="font-size:.85rem;color:var(--text-muted);">excl. VAT</span></div>\n') +
    '<div class="pdp-stock"><i class="fa-solid fa-circle"></i> In Stock</div>\n' +
    '<p class="pdp-desc">' + escapeHtml(p.description) + '</p>\n' +
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;"><span style="font-size:.8rem;font-weight:700;">Available Finishes:</span>' + swatchDots(p.colours) + '</div>\n' +
    '<div class="pdp-actions">' +
    (p.isPOA
      ? '<a href="../quote?product=' + encodeURIComponent(p.family) + '" class="btn btn-gold">REQUEST QUOTE</a>'
      : '<button type="button" class="btn btn-gold" id="pdp-add-btn">ADD TO QUOTE</button>' +
        '<button type="button" class="btn btn-dark" id="pdp-quote-btn">REQUEST QUOTE</button>') +
    '<a href="../quote" class="btn btn-outline-dark"><i class="fa-solid fa-headset"></i> ASK AN EXPERT</a>' +
    '</div>\n' +
    '<table class="pdp-variant-table"><thead><tr><th>Size / Finish</th><th>Price (excl. VAT)</th><th></th></tr></thead><tbody>' + variantRows + '</tbody></table>\n' +
    '</div>\n</div>\n' +

    '<div class="pdp-section"><h2>TECHNICAL <span class="accent" style="color:var(--gold-text);">SPECIFICATIONS</span></h2>' +
    '<table class="spec-table"><tbody>' +
    '<tr><td>Material</td><td>' + escapeHtml(p.material) + '</td></tr>' +
    '<tr><td>Product Category</td><td>' + escapeHtml(p.cat) + '</td></tr>' +
    '<tr><td>Available Sizes</td><td>' + escapeHtml(p.sizes.length ? p.sizes.join(', ') : 'One size') + '</td></tr>' +
    '<tr><td>Finish / Colour Options</td><td>' + escapeHtml(p.colours.join(', ')) + '</td></tr>' +
    '</tbody></table></div>\n' +

    '<div class="pdp-section"><h2>INSTALLATION <span class="accent" style="color:var(--gold-text);">GUIDE</span></h2>' +
    '<div class="pdp-install-steps">' + stepsHtml + '</div></div>\n' +

    '<div class="pdp-section"><h2>SUITABLE <span class="accent" style="color:var(--gold-text);">APPLICATIONS</span></h2>' +
    '<div class="pdp-tag-list">' + appsHtml + '</div></div>\n' +

    '<div class="pdp-section"><h2>COMPATIBLE FLOORING / <span class="accent" style="color:var(--gold-text);">TILE TYPES</span></h2>' +
    '<p style="color:var(--text-muted);">' + escapeHtml(COMPATIBLE_TYPES[p.cat] || '') + '</p></div>\n' +

    '<div class="pdp-section"><h2>DOWNLOADS</h2><div class="pdp-downloads">' +
    '<a href="../downloads/JS_Product_Manual.pdf" class="pdp-download-card" download="JS Product Manual.pdf">' +
    '<i class="fa-solid fa-file-pdf"></i><div><div class="name">Full Product Manual (PDF)</div><div class="size">Covers the complete Johmarg Strips range</div></div></a>' +
    '</div></div>\n' +

    (relatedHtml ? '<div class="pdp-section"><h2>RELATED <span class="accent" style="color:var(--gold-text);">PRODUCTS</span></h2><div class="pgrid">' + relatedHtml + '</div></div>\n' : '') +

    '<div class="pdp-section pdp-faq"><h2>FREQUENTLY ASKED <span class="accent" style="color:var(--gold-text);">QUESTIONS</span></h2>' + faqHtml + '</div>\n' +

    '<div class="pdp-section" style="max-width:640px;"><h2>ENQUIRE ABOUT THIS <span class="accent" style="color:var(--gold-text);">PRODUCT</span></h2>' +
    '<div class="form-card">' +
    '<form id="pdp-enquiry-form" data-ajax-form data-success-msg="Thank you for your enquiry! Our team will be in touch shortly." action="https://formsubmit.co/johmargstrips@outlook.com" method="POST" enctype="multipart/form-data">' +
    '<input type="hidden" name="_subject" value="Product enquiry: ' + escapeAttr(p.family) + '">' +
    '<input type="hidden" name="_template" value="table">' +
    '<input type="hidden" name="_captcha" value="false">' +
    '<input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">' +
    '<input type="hidden" name="Product" value="' + escapeAttr(p.family) + ' (' + escapeAttr(p.cat) + ')">' +
    '<div class="form-row"><div class="form-group"><label for="pdp-name">Full Name *</label><input type="text" id="pdp-name" name="Full Name" required></div>' +
    '<div class="form-group"><label for="pdp-email">Email Address *</label><input type="email" id="pdp-email" name="Email" required></div></div>' +
    '<div class="form-group"><label for="pdp-phone">Phone Number</label><input type="tel" id="pdp-phone" name="Phone"></div>' +
    '<div class="form-group"><label for="pdp-msg">Message</label><textarea id="pdp-msg" name="Message" rows="4" placeholder="Quantity needed, project details, etc."></textarea></div>' +
    '<button type="submit" class="btn btn-gold submit-btn">SEND ENQUIRY <i class="fa-solid fa-arrow-right"></i></button>' +
    '</form></div></div>\n' +

    '</div></section></main>\n' +

    '<button type="button" class="cart-toggle-btn" id="quote-toggle"><i class="fa-solid fa-clipboard-list"></i><span class="badge" id="quote-count">0</span><span>QUOTE LIST</span></button>\n' +
    '<div class="cart-overlay" id="quote-overlay"></div>\n' +
    '<aside class="cart-drawer" id="quote-drawer" aria-label="Quote list">' +
    '<div class="cart-drawer-head"><h3>YOUR QUOTE LIST</h3><button type="button" class="cart-close-btn" id="quote-close" aria-label="Close quote list"><i class="fa-solid fa-xmark"></i></button></div>' +
    '<div class="cart-lines" id="quote-lines"></div><div class="cart-empty" id="quote-empty">Your quote list is empty. Add a product to get started.</div>' +
    '<div class="cart-drawer-footer" id="quote-footer" style="display:none;">' +
    '<div class="cart-totals-row grand"><span>Indicative Total (excl. VAT)</span><span id="quote-subtotal">R0.00</span></div>' +
    '<button type="button" class="btn btn-gold cart-checkout-btn" id="quote-submit-btn">SUBMIT QUOTE REQUEST <i class="fa-solid fa-arrow-right"></i></button>' +
    '<p class="cart-sandbox-note">This total is indicative only, excl. VAT — final pricing is confirmed once we review your quote request.</p></div></aside>\n' +

    '<footer><div class="container footer-grid"><div class="footer-brand"><div class="logo-plate"><img src="../images/logo.png" alt="Johmarg Strips"></div>' +
    '<p class="tag">FINISHING TOUCHES.<br>LASTING IMPRESSION.</p></div>' +
    '<div><h4>QUICK LINKS</h4><ul><li><a href="../">Home</a></li><li><a href="../about">About Us</a></li><li><a href="../products">Products</a></li>' +
    '<li><a href="../applications">Applications</a></li><li><a href="../gallery">Gallery</a></li><li><a href="../contact">Contact Us</a></li></ul></div>' +
    '<div><h4>PRODUCTS</h4><ul><li><a href="../tile-trims">Tile Trims &amp; Edges</a></li><li><a href="../stair-nosing">Stair Nosing</a></li>' +
    '<li><a href="../flooring-profiles">Flooring Profiles</a></li><li><a href="../metal-profiles">Metal Profiles</a></li>' +
    '<li><a href="../pvc-profiles">PVC Profiles</a></li><li><a href="../movement-joints">Movement Joints</a></li>' +
    '<li><a href="../spacers">Spacers</a></li><li><a href="../angle-flat-bar">Angle &amp; Flat Bar</a></li></ul></div>' +
    '<div><h4>CONTACT US</h4><ul class="footer-contact"><li><i class="fa-solid fa-phone"></i> +27 62 594 0168</li>' +
    '<li><i class="fa-solid fa-envelope"></i> johmargstrips@outlook.com</li><li><i class="fa-solid fa-globe"></i> Currently operating online</li></ul></div>' +
    '<div><h4>DOWNLOAD PRODUCT MANUAL</h4><p style="font-size:.85rem;">Browse our full range of products and solutions.</p>' +
    '<a href="../downloads/JS_Product_Manual.pdf" class="footer-download" download="JS Product Manual.pdf"><i class="fa-solid fa-download"></i> DOWNLOAD PDF</a></div></div>' +
    '<div class="container footer-bottom"><span>&copy; 2026 Johmarg Strips. All Rights Reserved.</span>' +
    '<div class="footer-bottom-links"><a href="../privacy-policy">Privacy Policy</a><a href="../terms-and-conditions">Terms &amp; Conditions</a>' +
    '<a href="../returns-policy">Returns Policy</a><a href="../responsible-disclosure">Responsible Disclosure</a><a href="../human-rights-statement">Human Rights Statement</a></div></div></footer>\n' +

    '<script src="../js/script.js?v=7"></script>\n' +
    '<script>window.PDP_PRODUCT = ' + JSON.stringify({ uid: p.uid, cat: p.cat, materialGroup: p.materialGroup, family: p.family }) + ';</script>\n' +
    '<script src="../js/product-detail.js?v=2"></script>\n' +
    '</body>\n</html>\n';
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

let count = 0;
ALL.forEach(function (p) {
  fs.writeFileSync(path.join(outDir, p.slug + '.html'), renderPage(p));
  count++;
});
console.log('Generated', count, 'product detail pages in /products');

// ---------- Prerender the first page of products.html's grid (SEO / no-JS) ----------
// js/products-page.js re-renders this on load with live filters/sort/pagination;
// this static markup is what crawlers and no-JS visitors see on first paint.
function poaCardHtml(p) {
  const img = p.image || 'images/' + (CAT_FALLBACK_IMAGE[p.cat] || 'products-hero.jpg');
  const sizesText = p.sizes.length ? p.sizes.join(', ') : 'One size';
  const detailHref = 'products/' + p.slug;
  const swatches = p.colours.slice(0, 5).map(function (c) {
    return '<span class="swatch" style="background:' + (LIB.SWATCH_HEX[c] || '#ccc') + ';" title="' + escapeAttr(c) + '"></span>';
  }).join('');
  return '<div class="pcard" data-slug="' + p.slug + '">' +
    '<a class="pcard-img" href="' + detailHref + '" style="background-image:url(\'' + img + '\');" aria-label="View ' + escapeAttr(p.family) + '"><span class="pcard-stock"><i class="fa-solid fa-circle"></i> In Stock</span></a>' +
    '<div class="pcard-body">' +
    '<h3><a href="' + detailHref + '">' + escapeHtml(p.family) + '</a></h3>' +
    '<p class="pcard-desc">' + escapeHtml(p.description) + '</p>' +
    '<div class="pcard-meta"><span><b>Material:</b> ' + escapeHtml(p.material) + '</span><span><b>Sizes:</b> ' + escapeHtml(sizesText) + '</span></div>' +
    '<div class="pcard-swatches">' + swatches + '</div>' +
    (p.isPOA
      ? '<div class="pcard-price"><span class="amount" style="font-size:1.05rem;">Price on Application</span></div>' +
        '<div class="pcard-actions"><a href="quote?product=' + encodeURIComponent(p.family) + '" class="btn btn-dark" style="width:100%;justify-content:center;">REQUEST QUOTE</a></div>'
      : '<div class="pcard-price"><span class="amount">From ' + money(p.minPrice) + '</span><span class="excl">excl. VAT</span></div>' +
        '<div class="pcard-actions"><button type="button" class="btn btn-gold pcard-add-btn" data-slug="' + p.slug + '">ADD TO QUOTE</button></div>') +
    '</div></div>';
}

const PAGE_SIZE = 16;
const firstPage = ALL.slice().sort(function (a, b) { return a.sortIndex - b.sortIndex; }).slice(0, PAGE_SIZE);
const gridHtml = firstPage.map(poaCardHtml).join('');

const productsHtmlPath = path.join(root, 'products.html');
let productsHtml = fs.readFileSync(productsHtmlPath, 'utf8').replace(/\r\n/g, '\n');

const openTag = '<div class="pgrid" id="products-grid">';
const openIdx = productsHtml.indexOf(openTag);
if (openIdx === -1) {
  console.error('products.html: could not find #products-grid to prerender');
} else {
  let depth = 1, i = openIdx + openTag.length, closeIdx = -1;
  while (i < productsHtml.length && depth > 0) {
    if (productsHtml.startsWith('<div', i)) { depth++; i += 4; }
    else if (productsHtml.startsWith('</div>', i)) { depth--; if (depth === 0) { closeIdx = i; break; } i += 6; }
    else { i++; }
  }
  if (closeIdx === -1) {
    console.error('products.html: could not find matching close for #products-grid');
  } else {
    productsHtml = productsHtml.slice(0, openIdx) + openTag + gridHtml + productsHtml.slice(closeIdx);
    productsHtml = productsHtml.replace(
      '<span class="products-count" id="products-count">Loading products…</span>',
      '<span class="products-count" id="products-count">Showing 1–' + firstPage.length + ' of ' + ALL.length + ' results</span>'
    );
    fs.writeFileSync(productsHtmlPath, productsHtml.replace(/\n/g, '\r\n'));
    console.log('Prerendered products.html grid -', firstPage.length, 'of', ALL.length, 'products (page 1)');
  }
}

// ---------- Update sitemap.xml with one <url> per product detail page ----------
const sitemapPath = path.join(root, 'sitemap.xml');
let sitemap = fs.readFileSync(sitemapPath, 'utf8').replace(/\r\n/g, '\n');
const today = new Date().toISOString().slice(0, 10);
const START = '  <!-- PRODUCT DETAIL PAGES (auto-generated by scripts/generate-product-pages.js) -->\n';
const END = '  <!-- /PRODUCT DETAIL PAGES -->\n';
const productUrls = ALL.map(function (p) {
  return '  <url>\n    <loc>https://www.johmargstrips.co.za/products/' + p.slug + '</loc>\n    <lastmod>' + today + '</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n';
}).join('');
const block = START + productUrls + END;

if (sitemap.indexOf(START) !== -1) {
  sitemap = sitemap.replace(new RegExp(START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), block);
} else {
  sitemap = sitemap.replace('</urlset>', block + '</urlset>');
}
fs.writeFileSync(sitemapPath, sitemap.replace(/\n/g, '\r\n'));
console.log('Updated sitemap.xml with', ALL.length, 'product detail page URLs');
