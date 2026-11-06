const http = require('http');
const fs = require('fs');
const path = require('path');
// Load .env configuration
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (typeof process.loadEnvFile === 'function') {
    try { process.loadEnvFile(envPath); return; } catch (_) { }
  }
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (process.env[key] === undefined) process.env[key] = val;
        }
      });
      console.log('✓ Loaded environment variables from .env');
    } catch (e) {
      console.warn('Warning: Could not read .env file:', e.message);
    }
  }
}
loadEnv();

const PORTS = [8085, 8080, 5000, 3000];
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

let backendService = null;
(async () => {
  try {
    const backendModule = await import('./modules/backend/index.js');
    backendService = backendModule.createBackendService({
      database: {
        dataDir: process.env.WOOBI_DATA_DIR ? path.resolve(BASE_DIR, process.env.WOOBI_DATA_DIR) : path.join(BASE_DIR, 'data'),
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      },
      storage: {
        baseDir: process.env.WOOBI_STORAGE_DIR ? path.resolve(BASE_DIR, process.env.WOOBI_STORAGE_DIR) : path.join(BASE_DIR, 'uploads'),
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
        supabaseBucket: process.env.SUPABASE_STORAGE_BUCKET || 'Troys Assets'
      }
    });
    console.log('✓ Woobi REST API & Security Services mounted with Supabase.');
  } catch (err) {
    console.warn('Backend service initialization warning:', err.message);
  }
})();

const server = http.createServer(async (req, res) => {
  if (backendService && (req.url.startsWith('/api/') || req.url === '/health' || req.url.startsWith('/health?'))) {
    try {
      const handled = await backendService.handleRequest(req, res);
      if (handled !== false) return;
    } catch (err) {
      console.error('API Error:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Internal Server Error' }));
      }
      return;
    }
  }

  let reqUrl = req.url.split('?')[0];
  if (reqUrl === '/' || !reqUrl) reqUrl = '/index.html';

  const cleanPath = decodeURIComponent(reqUrl.replace(/^\/+/, ''));
  const loginPath = cleanPath === 'login' || cleanPath.startsWith('login/');
  const loginRelativePath = cleanPath === 'login' ? '' : cleanPath.slice('login/'.length);
  const filePath = loginPath
    ? path.join(BASE_DIR, 'modules', 'core', 'login', loginRelativePath)
    : path.join(BASE_DIR, cleanPath);

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
    console.log(`  Woobi Fashion Studio is running live:`);
    console.log(`  > Local:   http://localhost:${port}/`);
    console.log(`  > Network: http://127.0.0.1:${port}/`);
    console.log(`======================================================\n`);
  });
}

tryListen(0);
