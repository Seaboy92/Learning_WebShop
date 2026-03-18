// Minimaler Webshop-Server ohne externe Abhängigkeiten
// Ziel: kein npm install nötig, alles läuft mit Node.js Core.

const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const PORT = process.env.PORT || 3000;

function sendJson(res, status, body) {
  const payload = JSON.stringify(body || {});
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(payload);
}

function sendStatic(res, filePath) {
  fs.readFile(filePath)
    .then((content) => {
      const ext = path.extname(filePath).toLowerCase();
      const mime = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.json': 'application/json; charset=utf-8',
        '.ico': 'image/x-icon',
      }[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      res.end(content);
    })
    .catch(() => {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
    });
}

async function ensureDataFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(ARTICLES_FILE);
  } catch {
    // Wenn die Datei noch nicht existiert, legen wir eine leere Artikel-Liste an.
    // So startet der Server ohne Fehler, aber es gibt kein vorgefülltes Sortiment.
    await fs.writeFile(ARTICLES_FILE, '[]', 'utf8');
  }
}


async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

async function handleApi(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    });
    return res.end();
  }

  if (parsedUrl.pathname === '/api/articles' && method === 'GET') {
    const search = (parsedUrl.query.search || '').toString().toLowerCase();
    const articles = await readJson(ARTICLES_FILE, []);
    const filtered = search
      ? articles.filter((a) =>
          a.title.toLowerCase().includes(search) ||
          a.description.toLowerCase().includes(search)
        )
      : articles;
    return sendJson(res, 200, filtered);
  }

  if (parsedUrl.pathname.startsWith('/api/articles/') && method === 'GET') {
    const id = parsedUrl.pathname.replace('/api/articles/', '');
    const articles = await readJson(ARTICLES_FILE, []);
    const item = articles.find((a) => a.id === id);
    if (!item) return sendJson(res, 404, { message: 'Artikel nicht gefunden' });
    return sendJson(res, 200, item);
  }

  if (parsedUrl.pathname === '/api/orders' && method === 'POST') {
    const body = await parseBody(req);
    console.log('Neue Bestellung:', { order: body });
    return sendJson(res, 200, { message: 'Bestellung aufgenommen', orderId: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex') });
  }

  sendJson(res, 404, { message: 'API nicht gefunden' });
}

async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url).pathname;

  if (parsedUrl.startsWith('/api/')) {
    return handleApi(req, res);
  }

  let filePath = path.join(FRONTEND_DIR, parsedUrl === '/' ? 'index.html' : parsedUrl);

  // Fallback to index.html for SPA routes
  try {
    await fs.access(filePath);
  } catch {
    filePath = path.join(FRONTEND_DIR, 'index.html');
  }

  return sendStatic(res, filePath);
}

ensureDataFiles()
  .then(() => {
    const server = http.createServer(handleRequest);

    server.listen(PORT, () => {
      console.log(`Webshop läuft auf http://localhost:${PORT}`);
      console.log('Backend läuft ohne externe Abhängigkeiten (nur Node Core).');
    });
  })
  .catch((err) => {
    console.error('Fehler beim Starten:', err);
    process.exit(1);
  });
