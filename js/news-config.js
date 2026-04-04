/* ============================================
   NEWS CMS — Config
   ============================================ */
const NEWS_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbwE1UrOdpMcRdMPN1kPGPjFacHHOBcgSHkhKCn0SqQfjIvWPZ2NvLZKdX5z8rBQSLyihg/exec', // ← Thay sau khi deploy
  POSTS_PER_PAGE: 9,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
};

/* Simple in-memory cache */
const _cache = {};
function clearCache() {
  Object.keys(_cache).forEach(k => delete _cache[k]);
}
async function fetchAPI(params) {
  const url = new URL(NEWS_CONFIG.API_URL);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });

  const cacheKey = url.toString();
  const cached = _cache[cacheKey];
  if (cached && Date.now() - cached.time < NEWS_CONFIG.CACHE_TTL) {
    return cached.data;
  }

  const res = await fetch(url.toString());
  const data = await res.json();

  if (!params.action || params.action.startsWith('get')) {
    _cache[cacheKey] = { data, time: Date.now() };
  }
  return data;
}

async function postAPI(body) {
  const jsonStr = JSON.stringify(body);

  // For large payloads (e.g. image uploads with base64 data),
  // use POST with Content-Type: text/plain to avoid CORS preflight
  // and bypass URL length limits (GET URLs max ~8KB).
  // For small payloads, keep using GET with payload param (proven to work).
  const USE_POST_THRESHOLD = 5000; // bytes

  if (jsonStr.length > USE_POST_THRESHOLD) {
    console.log('[postAPI] Large payload (' + jsonStr.length + ' chars), using POST');
    return await _postViaPost(jsonStr);
  }

  // Small payload → GET with payload param (original approach)
  const url = new URL(NEWS_CONFIG.API_URL);
  url.searchParams.set('action', body.action);
  url.searchParams.set('payload', jsonStr);

  console.log('[postAPI] GET:', body.action);
  const res = await fetch(url.toString(), { redirect: 'follow' });

  const text = await res.text();
  try {
    const result = JSON.parse(text);
    clearCache(); // Xóa cache sau mỗi write để data luôn mới
    return result;
  } catch (e) {
    console.error('[postAPI] JSON parse failed:', text.substring(0, 500));
    throw new Error('Invalid response from server');
  }
}

async function _postViaPost(jsonStr) {
  // Google Apps Script web apps redirect 302 on both GET and POST.
  // Using Content-Type: text/plain makes it a "simple" CORS request
  // (no preflight), so the browser follows the redirect transparently.
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
    clearCache(); // Xóa cache sau mỗi write để data luôn mới
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