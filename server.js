const http = require('http');
const fs = require('fs');
const path = require('path');

const PORTS = [8080, 5000, 8085, 3000];
const BASE_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.gltf': 'model/gltf+json',
  '.glb': 'model/gltf-binary',
  '.bin': 'application/octet-stream',
  '.mp4': 'video/mp4',
  '.apk': 'application/vnd.android.package-archive'
};

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];
  if (reqUrl === '/' || !reqUrl) reqUrl = '/index.html';

  const cleanPath = decodeURIComponent(reqUrl.replace(/^\/+/, ''));
  const filePath = path.join(BASE_DIR, cleanPath);

  // Security check: restrict within BASE_DIR
  if (!filePath.toLowerCase().startsWith(BASE_DIR.toLowerCase())) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    let finalPath = filePath;
    if (stats.isDirectory()) {
      finalPath = path.join(filePath, 'index.html');
      if (!fs.existsSync(finalPath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('404 Not Found');
      }
    }

    const ext = path.extname(finalPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });

    if (req.method === 'HEAD') {
      return res.end();
    }

    fs.createReadStream(finalPath).pipe(res);
  });
});

function tryListen(portIndex) {
  if (portIndex >= PORTS.length) {
    console.error('Failed to bind to any port in list:', PORTS);
    process.exit(1);
  }
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : PORTS[portIndex];

  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
      console.log(`Port ${port} in use or restricted, trying next port...`);
      if (!process.env.PORT) {
        tryListen(portIndex + 1);
      }
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`  AURA Wardrobe is running live:`);
    console.log(`  > Local:   http://localhost:${port}/`);
    console.log(`  > Network: http://127.0.0.1:${port}/`);
    console.log(`======================================================\n`);
  });
}

tryListen(0);
