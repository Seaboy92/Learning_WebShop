import { afterEach, beforeEach, expect, test } from 'bun:test';

const store = new Map();

function createLocalStorage() {
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

globalThis.window = {
  localStorage: createLocalStorage(),
};

const app = await import('../js/app.js');
const originalFetch = globalThis.fetch;

beforeEach(() => {
  window.localStorage.clear();
  globalThis.fetch = originalFetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('cart helpers read and write localStorage safely', () => {
  expect(app.getCart()).toEqual([]);

  app.setCart([{ productId: 'prod-1', quantity: 2 }]);

  expect(app.getCart()).toEqual([{ productId: 'prod-1', quantity: 2 }]);
});

test('addToCart merges quantities for existing products', () => {
  app.addToCart('prod-1');
  app.addToCart('prod-1', 2);
  app.addToCart('prod-2', 1);

  expect(app.getCart()).toEqual([
    { productId: 'prod-1', quantity: 3 },
    { productId: 'prod-2', quantity: 1 },
  ]);
});

test('removeFromCart and clearCart remove items', () => {
  app.setCart([
    { productId: 'prod-1', quantity: 1 },
    { productId: 'prod-2', quantity: 4 },
  ]);

  app.removeFromCart('prod-1');
  expect(app.getCart()).toEqual([{ productId: 'prod-2', quantity: 4 }]);

  app.clearCart();
  expect(app.getCart()).toEqual([]);
});

test('updateCartItem enforces a minimum quantity of one', () => {
  app.setCart([{ productId: 'prod-1', quantity: 3 }]);

  app.updateCartItem('prod-1', 0);

  expect(app.getCart()).toEqual([{ productId: 'prod-1', quantity: 1 }]);
});

test('formatPrice formats euro values in German locale', () => {
  const formatted = app.formatPrice(9.95);
  expect(formatted).toMatch(/^9,95\s*\D+$/u);
});

test('apiFetch sends JSON requests and returns parsed responses', async () => {
  let capturedUrl;
  let capturedHeaders;

  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    capturedHeaders = options.headers;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const result = await app.apiFetch('/articles');

  expect(capturedUrl).toBe('/api/articles');
  expect(capturedHeaders['Content-Type']).toBe('application/json');
  expect(result).toEqual({ ok: true });
});

test('apiFetch throws the API error message for non-ok responses', async () => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: 'Kaputt' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });

  await expect(app.apiFetch('/orders')).rejects.toThrow(/Kaputt/);
});
