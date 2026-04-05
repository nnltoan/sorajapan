/* ============================================
   NEWS CMS — Config
   ============================================ */
const NEWS_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbwE1UrOdpMcRdMPN1kPGPjFacHHOBcgSHkhKCn0SqQfjIvWPZ2NvLZKdX5z8rBQSLyihg/exec',
  POSTS_PER_PAGE: 9,
  CACHE_TTL: 5 * 60 * 1000,       // 5 min — data considered "fresh"
  STALE_TTL: 30 * 60 * 1000,      // 30 min — data still usable while revalidating
};

/* ─── Persistent Cache (sessionStorage + memory) ─── */
const _memCache = {};

function _storageKey(url) {
  return 'sj_' + url.replace(/[^a-zA-Z0-9]/g, '').slice(-80);
}

function _getCache(url) {
  // 1. Memory (fastest)
  const mem = _memCache[url];
  if (mem) return mem;
  // 2. sessionStorage (persists across page navigations)
  try {
    const raw = sessionStorage.getItem(_storageKey(url));
    if (raw) {
      const parsed = JSON.parse(raw);
      _memCache[url] = parsed; // promote to memory
      return parsed;
    }
  } catch (e) { /* ignore */ }
  return null;
}

function _setCache(url, data) {
  const entry = { data, time: Date.now() };
  _memCache[url] = entry;
  try {
    sessionStorage.setItem(_storageKey(url), JSON.stringify(entry));
  } catch (e) { /* quota exceeded — memory cache still works */ }
}

function clearCache() {
  // Clear memory
  Object.keys(_memCache).forEach(k => delete _memCache[k]);
  // Clear sessionStorage cache entries
  try {
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith('sj_')) keys.push(k);
    }
    keys.forEach(k => sessionStorage.removeItem(k));
  } catch (e) { /* ignore */ }
}

/* ─── Fetch with stale-while-revalidate ───
   - If cache is FRESH (< CACHE_TTL): return cached, no network call
   - If cache is STALE (< STALE_TTL): return cached immediately, fetch in background
   - If cache is EXPIRED or missing: fetch and wait
   - Optional onUpdate callback: called when background revalidation gets new data
*/
async function fetchAPI(params, onUpdate) {
  const url = new URL(NEWS_CONFIG.API_URL);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });

  const cacheKey = url.toString();
  const cached = _getCache(cacheKey);
  const now = Date.now();

  // FRESH cache — return immediately
  if (cached && (now - cached.time < NEWS_CONFIG.CACHE_TTL)) {
    return cached.data;
  }

  // STALE cache — return immediately + revalidate in background
  if (cached && (now - cached.time < NEWS_CONFIG.STALE_TTL)) {
    // Background revalidate
    fetch(url.toString()).then(r => r.json()).then(freshData => {
      _setCache(cacheKey, freshData);
      if (onUpdate) onUpdate(freshData);
    }).catch(() => {});
    return cached.data;
  }

  // EXPIRED or missing — must wait for network
  const res = await fetch(url.toString());
  const data = await res.json();

  if (!params.action || params.action.startsWith('get')) {
    _setCache(cacheKey, data);
  }
  return data;
}

async function postAPI(body) {
  const jsonStr = JSON.stringify(body);
  const USE_POST_THRESHOLD = 5000;

  if (jsonStr.length > USE_POST_THRESHOLD) {
    console.log('[postAPI] Large payload (' + jsonStr.length + ' chars), using POST');
    return await _postViaPost(jsonStr);
  }

  const url = new URL(NEWS_CONFIG.API_URL);
  url.searchParams.set('action', body.action);
  url.searchParams.set('payload', jsonStr);

  console.log('[postAPI] GET:', body.action);
  const res = await fetch(url.toString(), { redirect: 'follow' });

  const text = await res.text();
  try {
    const result = JSON.parse(text);
    clearCache();
    return result;
  } catch (e) {
    console.error('[postAPI] JSON parse failed:', text.substring(0, 500));
    throw new Error('Invalid response from server');
  }
}

async function _postViaPost(jsonStr) {
  const url = NEWS_CONFIG.API_URL;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: jsonStr,
    redirect: 'follow'
  });

  console.log('[postAPI:POST] status:', res.status, 'type:', res.type);
  const text = await res.text();
  console.log('[postAPI:POST] body:', text.substring(0, 200));

  try {
    const result = JSON.parse(text);
    clearCache();
    return result;
  } catch (e) {
    console.error('[postAPI:POST] JSON parse failed:', text.substring(0, 500));
    throw new Error('Invalid response from server');
  }
}

/* Utility: format date to Vietnamese */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatDateRelative(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return formatDate(dateStr);
}

/* Utility: truncate text */
function truncate(text, len) {
  if (!text || text.length <= len) return text;
  return text.substring(0, len).trimEnd() + '...';
}
