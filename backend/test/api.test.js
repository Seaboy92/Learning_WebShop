const { afterAll, beforeAll, expect, test } = require('bun:test');
const { once } = require('node:events');

const { startServer } = require('../server');

let server;
let baseUrl;

beforeAll(async () => {
  server = await startServer(0);
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  server.close();
  await once(server, 'close');
});

test('GET /api/articles returns the article list', async () => {
  const res = await fetch(`${baseUrl}/api/articles`);
  expect(res.status).toBe(200);
  expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8');

  const articles = await res.json();
  expect(Array.isArray(articles)).toBe(true);
  expect(articles.length).toBeGreaterThanOrEqual(3);
  expect(articles[0].id).toBe('prod-1');
});

test('GET /api/articles?search filters articles case-insensitively', async () => {
  const res = await fetch(`${baseUrl}/api/articles?search=notiz`);
  expect(res.status).toBe(200);

  const articles = await res.json();
  expect(articles.map((article) => article.id)).toEqual(['prod-2']);
});

test('GET /api/articles/:id returns 404 for unknown ids', async () => {
  const res = await fetch(`${baseUrl}/api/articles/unbekannt`);
  expect(res.status).toBe(404);

  const body = await res.json();
  expect(body.message).toBe('Artikel nicht gefunden');
});

test('POST /api/orders accepts an order and returns an order id', async () => {
  const payload = {
    items: [{ id: 'prod-1', quantity: 2, price: 9.95 }],
    total: 19.9,
  };

  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.message).toBe('Bestellung aufgenommen');
  expect(typeof body.orderId).toBe('string');
  expect(body.orderId.length).toBeGreaterThan(10);
});

test('OPTIONS /api/orders returns CORS headers', async () => {
  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'OPTIONS',
  });

  expect(res.status).toBe(204);
  expect(res.headers.get('access-control-allow-origin')).toBe('*');
  expect(res.headers.get('access-control-allow-methods') || '').toMatch(
    /GET,POST,OPTIONS/
  );
});

test('frontend routes return HTML and unknown routes fall back to index.html', async () => {
  const searchRes = await fetch(`${baseUrl}/search.html`);
  expect(searchRes.status).toBe(200);
  expect(searchRes.headers.get('content-type') || '').toMatch(/text\/html/);

  const searchHtml = await searchRes.text();
  expect(searchHtml).toMatch(/Artikelsuche/);

  const fallbackRes = await fetch(`${baseUrl}/does-not-exist`);
  expect(fallbackRes.status).toBe(200);

  const fallbackHtml = await fallbackRes.text();
  expect(fallbackHtml).toMatch(/Mein kleiner WebShop/);
});
