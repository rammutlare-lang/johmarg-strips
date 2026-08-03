// Tiny static file server for local preview that mimics the production
// host's clean-URL behaviour (e.g. /movement-joints resolves to
// movement-joints.html) — python -m http.server has no such fallback, which
// is why extension-less links (used site-wide) 404 under it locally.
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const port = process.argv[2] ? parseInt(process.argv[2], 10) : 8080;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.pdf': 'application/pdf', '.xml': 'application/xml',
  '.txt': 'text/plain', '.webp': 'image/webp'
};

function send(res, status, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(status, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

http.createServer(function (req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  let filePath = path.join(root, urlPath);

  if (!filePath.startsWith(root)) { res.writeHead(403); res.end('Forbidden'); return; }

  fs.stat(filePath, function (err, stat) {
    if (!err && stat.isFile()) return send(res, 200, filePath);
    if (!err && stat.isDirectory()) {
      const indexPath = path.join(filePath, 'index.html');
      if (fs.existsSync(indexPath)) return send(res, 200, indexPath);
    }
    // Clean-URL fallback: /movement-joints -> movement-joints.html
    const withHtml = filePath + '.html';
    if (fs.existsSync(withHtml)) return send(res, 200, withHtml);

    const notFound = path.join(root, '404.html');
    if (fs.existsSync(notFound)) return send(res, 404, notFound);
    res.writeHead(404); res.end('Not found');
  });
}).listen(port, function () {
  console.log('Dev server running at http://localhost:' + port);
});
