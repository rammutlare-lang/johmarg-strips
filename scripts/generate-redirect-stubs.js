// Generates lightweight redirect stubs at the 8 retired category URLs
// (tile-trims.html etc.) pointing to their filtered view on the unified
// Products page. These pages were live and indexed by Google for weeks
// before being retired, so a hard 404 would break existing search
// listings/bookmarks — a meta-refresh + canonical is the standard
// redirect technique on a static host with no server-side rewrite config.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// "cat" is the new (4-category) taxonomy target; "title" keeps the original
// specific label people may have bookmarked, for the on-page message only.
const REDIRECTS = [
  { slug: 'tile-trims', cat: 'Architectural Metal Profiles', title: 'Tile Trims & Edges' },
  { slug: 'stair-nosing', cat: 'Floor Transition & Finishing Profiles', title: 'Stair Nosing' },
  { slug: 'flooring-profiles', cat: 'Floor Transition & Finishing Profiles', title: 'Flooring Profiles' },
  { slug: 'metal-profiles', cat: 'Architectural Metal Profiles', title: 'Metal Profiles' },
  { slug: 'pvc-profiles', cat: 'PVC Finishing Profiles', title: 'PVC Profiles' },
  { slug: 'movement-joints', cat: 'Architectural Metal Profiles', title: 'Movement Joints' },
  { slug: 'spacers', cat: 'Tile Installation Systems & Accessories', title: 'Spacers' },
  { slug: 'angle-flat-bar', cat: 'Architectural Metal Profiles', title: 'Angle & Flat Bar' }
];

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderStub(r) {
  const target = 'products?cat=' + encodeURIComponent(r.cat);
  const canonical = 'https://www.johmargstrips.co.za/' + target;
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + escapeHtml(r.title) + ' | Johmarg Strips</title>\n' +
    '<meta name="robots" content="noindex, follow">\n' +
    '<link rel="canonical" href="' + canonical + '">\n' +
    '<meta http-equiv="refresh" content="0; url=' + target + '">\n' +
    '<link rel="stylesheet" href="css/style.css?v=13">\n' +
    '<script>window.location.replace(' + JSON.stringify(target) + ');</script>\n' +
    '</head>\n<body>\n' +
    '<div style="min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 20px;font-family:\'Segoe UI\',Arial,Helvetica,sans-serif;">\n' +
    '<p style="font-size:.9rem;color:#6b6b6b;">This page has moved.</p>\n' +
    '<h1 style="font-size:1.3rem;margin:8px 0 20px;">' + escapeHtml(r.title) + ' is now part of our full Products catalogue.</h1>\n' +
    '<a href="' + target + '" style="display:inline-flex;padding:14px 28px;background:#f5b400;color:#111;font-weight:700;border-radius:6px;text-decoration:none;">GO TO ' + escapeHtml(r.title.toUpperCase()) + '</a>\n' +
    '</div>\n' +
    '</body>\n</html>\n';
}

let count = 0;
REDIRECTS.forEach(function (r) {
  fs.writeFileSync(path.join(root, r.slug + '.html'), renderStub(r));
  count++;
});
console.log('Generated', count, 'redirect stubs');
