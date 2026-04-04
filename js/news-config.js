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
  // Google Apps Script redirects POST → opaque response with CORS issues
  // Workaround: send write operations via GET with encoded payload
  const url = new URL(NEWS_CONFIG.API_URL);
  url.searchParams.set('action', body.action);
  url.searchParams.set('payload', JSON.stringify(body));

  const res = await fetch(url.toString());
  return res.json();
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
  if (!text || text.length <= len) return text