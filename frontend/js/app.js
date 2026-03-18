const API_BASE = '/api';
const CART_KEY = 'webshop_cart';

export function getCart() {
  try {
    return JSON.parse(window.localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

export function setCart(cart) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(cart || []));
}

export function addToCart(productId, qty = 1) {
  const cart = getCart();
  const item = cart.find((i) => i.productId === productId);
  if (item) {
    item.quantity += qty;
  } else {
    cart.push({ productId, quantity: qty });
  }
  setCart(cart);
}

export function removeFromCart(productId) {
  const cart = getCart().filter((i) => i.productId !== productId);
  setCart(cart);
}

export function updateCartItem(productId, quantity) {
  const cart = getCart().map((i) =>
    i.productId === productId ? { ...i, quantity: Math.max(1, quantity) } : i
  );
  setCart(cart);
}

export function clearCart() {
  setCart([]);
}

export async function apiFetch(path, options = {}) {
  const headers = options.headers || {};
  headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.message || res.statusText;
    throw new Error(msg);
  }
  return data;
}

export function formatPrice(amount) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function renderNav(currentPage) {
  const nav = document.getElementById('main-nav');
  if (!nav) return;

  nav.innerHTML = `
    <a href="/index.html" class="nav-link">Start</a>
    <a href="/search.html" class="nav-link">Suche</a>
    <a href="/cart.html" class="nav-link">Warenkorb</a>
    <a href="/checkout.html" class="nav-link">Bezahlen</a>
    <a href="/impressum.html" class="nav-link">Impressum</a>
  `;

  const active = document.querySelector('.nav-link.active');
  if (active) active.classList.remove('active');
  const current = [...document.querySelectorAll('.nav-link')].find((a) =>
    a.getAttribute('href')?.endsWith(currentPage)
  );
  if (current) current.classList.add('active');
}
