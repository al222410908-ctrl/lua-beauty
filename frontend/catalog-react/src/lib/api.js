import { CONFIG } from '../config';

const base = () => CONFIG.API_BASE_URL;

function getToken() {
  return localStorage.getItem('lua_token');
}

export async function fetchApi(url, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  const token = getToken();
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${base()}${url}`, opts);
  if (res.status === 401) {
    localStorage.removeItem('lua_token');
    localStorage.removeItem('lua_user');
    window.dispatchEvent(new CustomEvent('auth-expired'));
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function fetchProducts() {
  const res = await fetch(`${base()}/api/products`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function fetchProductVariants(productId) {
  const res = await fetch(`${base()}/api/products/${productId}/variants`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function fetchSettings() {
  const res = await fetch(`${base()}/api/settings`);
  if (!res.ok) throw new Error("API error");
  const data = await res.json();
  return data;
}
