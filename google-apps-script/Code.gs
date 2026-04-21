/* ============================================
   SORA JAPAN NEWS CMS — Google Apps Script API
   ============================================
   Deploy as Web App → "Anyone" access
   ============================================ */

// ─── CONFIG ───
const SPREADSHEET_ID = '1goqsX4WoM6dALboJhgyIod4xazgbNuhcLGFXyRROAlE'; // ← Thay bằng ID Google Sheet
// reCAPTCHA v3 SECRET KEY (server-side)
// ⚠️ KHÔNG dán secret vào code — dùng Script Properties để không lộ khi repo public.
// Setup: Apps Script UI → Project Settings → Script properties → Add property:
//   Key:   RECAPTCHA_SECRET
//   Value: <paste secret key được gửi riêng qua kênh an toàn>
// Nếu chưa set → verifyRecaptcha() bypass (chấp nhận mọi request) để không chặn khách thật.
function getRecaptchaSecret() {
  try {
    return PropertiesService.getScriptProperties().getProperty('RECAPTCHA_SECRET') || '';
  } catch (e) {
    return '';
  }
}
const RECAPTCHA_MIN_SCORE = 0.3; // 0.0-1.0, càng gần 1.0 càng chắc chắn là người thật
const DRIVE_FOLDER_ID = '1CNgojYZ1iU426ZVS3pfSGCFZhNJgiYvT'; // ← Thay bằng ID folder Google Drive cho ảnh
const CACHE_TTL = 300; // 5 minutes (seconds) — CacheService max is 21600 (6h)

function getSheet(name) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
}

// ─── CACHESERVICE LAYER ───
// Reads sheet data from CacheService first (~50ms), falls back to Sheet API (~1-3s).
// CacheService limit: 100KB per key → for large sheets, chunk or skip cache.

function getSheetData(sheetName) {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'sheet_' + sheetName;

  // Try cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) { /* corrupted cache, fall through */ }
  }

  // Cache miss — read from Sheet
  const sheet = getSheet(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();

  // Store in cache (convert Dates to ISO strings for JSON serialization)
  try {
    const serializable = data.map(row =>
      row.map(cell => cell instanceof Date ? cell.toISOString() : cell)
    );
    const json = JSON.stringify(serializable);
    if (json.length < 100000) { // CacheService 100KB limit per key
      cache.put(cacheKey, json, CACHE_TTL);
    }
  } catch (e) { /* too large or other error — skip caching */ }

  return data;
}

function invalidateCache(sheetName) {
  const cache = CacheService.getScriptCache();
  if (sheetName) {
    cache.remove('sheet_' + sheetName);
  } else {
    // Invalidate all known sheets
    cache.removeAll(['sheet_Posts', 'sheet_Categories', 'sheet_Jobs', 'sheet_Contacts', 'sheet_Config']);
  }
}

// ─── ROUTER ───

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';
  let result;

  try {
    // If payload parameter exists, this is a write operation sent via GET
    // (workaround for Apps Script CORS issues with POST)
    if (e.parameter.payload) {
      const data = JSON.parse(e.parameter.payload);
      result = handleWrite(data);
    } else {
      switch (action) {
        case 'ping':
          result = { status: 'ok', ts: Date.now() };
          break;
        case 'getNewsPage':
          result = getNewsPage(e.parameter);
          break;
        case 'getJobsPage':
          result = getJobsPage(e.parameter);
          break;
        case 'getPosts':
          result = getPosts(e.parameter);
          break;
        case 'getPost':
          result = getPost(e.parameter.slug);
          break;
        case 'getCategories':
          result = getCategories();
          break;
        case 'getStats':
          result = getStats(e.parameter.password);
          break;
        case 'getJobs':
          result = getJobs(e.parameter);
          break;
        case 'getJob':
          result = getJob(e.parameter.id);
          break;
        case 'getContacts':
          result = getContacts(e.parameter);
          break;
        case 'getContact':
          result = getContact(e.parameter.id);
          break;
        default:
          result = { error: 'Unknown action: ' + action };
      }
    }
  } catch (err) {
    result = { error: err.message };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// Shared write handler used by both doGet (payload) and doPost
function handleWrite(data) {
  const action = data.action || '';

  // Public actions (no auth required)
  if (action === 'submitContact') {
    const result = submitContact(data);
    invalidateCache('Contacts');
    return result;
  }

  // Auth check for all other write operations
  if (!auth(data.password)) {
    return { error: 'Unauthorized' };
  }

  let result;
  switch (action) {
    case 'login':
      return { status: 'success', message: 'Đăng nhập thành công' };
    case 'createPost':
      result = createPost(data);
      invalidateCache('Posts');
      return result;
    case 'updatePost':
      result = updatePost(data);
      invalidateCache('Posts');
      return result;
    case 'deletePost':
      result = deletePost(data.id);
      invalidateCache('Posts');
      return result;
    case 'uploadImage':
      return uploadImage(data);
    case 'deleteImage':
      return deleteImage(data.fileId);
    case 'createCategory':
      result = manageCategory('create', data);
      invalidateCache('Categories');
      return result;
    case 'updateCategory':
      result = manageCategory('update', data);
      invalidateCache('Categories');
      return result;
    case 'deleteCategory':
      result = manageCategory('delete', data);
      invalidateCache('Categories');
      return result;
    case 'updateConfig':
      result = updateConfig(data.key, data.value, data.password);
      invalidateCache('Config');
      return result;
    case 'createJob':
      result = createJob(data);
      invalidateCache('Jobs');
      return result;
    case 'updateJob':
      result = updateJob(data);
      invalidateCache('Jobs');
      return result;
    case 'deleteJob':
      result = deleteJob(data.id);
      invalidateCache('Jobs');
      return result;
    case 'updateContact':
      result = updateContact(data);
      invalidateCache('Contacts');
      return result;
    case 'deleteContact':
      result = deleteContact(data.id);
      invalidateCache('Contacts');
      return result;
    default:
      return { error: 'Unknown action: ' + action };
  }
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid JSON' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  let result;
  try {
    result = handleWrite(data);
  } catch (err) {
    result = { error: err.message };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── AUTH ───

function auth(password) {
  if (!password) return false;
  const data = getSheetData('Config');
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'admin_password' && data[i][1] === password) {
      return true;
    }
  }
  return false;
}

// ─── POSTS: READ ───

function getPosts(params) {
  const data = getSheetData('Posts');
  const headers = data[0];
  const rows = data.slice(1);

  // Parse parameters
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 9;
  const category = params.category || '';
  const status = params.status || 'published'; // Default: only published for public
  const search = (params.search || '').toLowerCase();
  const featured = params.featured;

  // Convert rows to objects
  let posts = rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  // Filter
  posts = posts.filter(p => {
    if (status && status !== 'all' && p.status !== status) return false;
    if (category && p.category !== category) return false;
    if (featured === 'true' && p.featured !== true && p.featured !== 'TRUE') return false;
    if (search && !p.title.toLowerCase().includes(search)) return false;
    return true;
  });

  // Sort by publishedAt desc (newest first)
  posts.sort((a, b) => {
    const dateA = new Date(a.publishedAt || a.createdAt);
    const dateB = new Date(b.publishedAt || b.createdAt);
    return dateB - dateA;
  });

  const total = posts.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paginatedPosts = posts.slice(start, start + limit);

  // Don't return full content in list view (save bandwidth)
  const listPosts = paginatedPosts.map(p => {
    const { content, ...rest } = p;
    return rest;
  });

  return {
    status: 'success',
    posts: listPosts,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  };
}

function getPost(slug) {
  if (!slug) return { error: 'Missing slug' };

  const data = getSheetData('Posts');
  const headers = data[0];
  const rows = data.slice(1);

  for (let i = 0; i < rows.length; i++) {
    let obj = {};
    headers.forEach((h, j) => obj[h] = rows[i][j]);

    if (obj.slug === slug && obj.status === 'published') {
      // Increment view count (non-blocking — do after building response)
      const viewColIndex = headers.indexOf('viewCount');
      const currentViews = parseInt(obj.viewCount) || 0;
      obj.viewCount = currentViews + 1;

      // Get related posts (same category, newest, exclude current)
      const relatedPosts = [];
      for (let k = 0; k < rows.length; k++) {
        if (k === i) continue;
        let rObj = {};
        headers.forEach((h, j) => rObj[h] = rows[k][j]);
        if (rObj.status === 'published' && rObj.category === obj.category) {
          const { content, ...rest } = rObj;
          relatedPosts.push(rest);
        }
      }
      relatedPosts.sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));

      // Include categories so frontend doesn't need a 2nd call
      let categories = [];
      try {
        const catData = getSheetData('Categories');
        const catHeaders = catData[0];
        categories = catData.slice(1).map(row => {
          let c = {};
          catHeaders.forEach((h, idx) => c[h] = row[idx]);
          return c;
        }).sort((a, b) => (a.order || 0) - (b.order || 0));
      } catch (e) { /* ignore */ }

      // Write viewCount AFTER building response (deferred, uses real sheet)
      if (viewColIndex !== -1) {
        try {
          getSheet('Posts').getRange(i + 2, viewColIndex + 1).setValue(currentViews + 1);
        } catch (e) { /* non-critical */ }
      }

      return {
        status: 'success',
        post: obj,
        related: relatedPosts.slice(0, 4),
        categories: categories
      };
    }
  }

  return { error: 'Post not found' };
}

// ─── POSTS: WRITE ───

function createPost(data) {
  const sheet = getSheet('Posts');
  const id = generateId();
  const slug = data.slug || generateSlug(data.title);
  const now = new Date().toISOString();

  const row = [
    id,
    data.title || '',
    slug,
    data.excerpt || '',
    data.content || '',
    data.thumbnail || '',
    data.category || '',
    data.tags || '',
    data.author || 'Admin',
    data.status || 'draft',
    now,          // createdAt
    now,          // updatedAt
    data.status === 'published' ? now : '', // publishedAt
    0,            // viewCount
    data.featured || false
  ];

  sheet.appendRow(row);

  return {
    status: 'success',
    message: 'Bài viết đã được tạo',
    id: id,
    slug: slug
  };
}

function updatePost(data) {
  if (!data.id) return { error: 'Missing post ID' };

  const sheet = getSheet('Posts');
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const rows = allData.slice(1);

  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.id)) {
      const rowIndex = i + 2; // +2: 1-indexed + header row
      const now = new Date().toISOString();

      // Update each field if provided
      const fields = {
        title: 1, slug: 2, excerpt: 3, content: 4, thumbnail: 5,
        category: 6, tags: 7, author: 8, status: 9
      };

      for (const [field, colIndex] of Object.entries(fields)) {
        if (data[field] !== undefined) {
          sheet.getRange(rowIndex, colIndex + 1).setValue(data[field]);
        }
      }

      // Update slug if title changed
      if (data.title && !data.slug) {
        sheet.getRange(rowIndex, 3).setValue(generateSlug(data.title));
      }

      // updatedAt
      sheet.getRange(rowIndex, 12).setValue(now);

      // publishedAt (set when first published)
      if (data.status === 'published' && !rows[i][12]) {
        sheet.getRange(rowIndex, 13).setValue(now);
      }

      // featured
      if (data.featured !== undefined) {
        sheet.getRange(rowIndex, 15).setValue(data.featured);
      }

      return { status: 'success', message: 'Bài viết đã được cập nhật' };
    }
  }

  return { error: 'Post not found' };
}

function deletePost(id) {
  if (!id) return { error: 'Missing post ID' };

  const sheet = getSheet('Posts');
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];

  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][0]) === String(id)) {
      // Soft delete: change status to "archived"
      const statusColIndex = headers.indexOf('status');
      sheet.getRange(i + 1, statusColIndex + 1).setValue('archived');
      sheet.getRange(i + 1, headers.indexOf('updatedAt') + 1).setValue(new Date().toISOString());
      return { status: 'success', message: 'Bài viết đã được xóa' };
    }
  }

  return { error: 'Post not found' };
}

// ─── CATEGORIES ───

function getCategories() {
  const data = getSheetData('Categories');
  const headers = data[0];
  const rows = data.slice(1);

  const categories = rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  // Sort by order
  categories.sort((a, b) => (a.order || 0) - (b.order || 0));

  return { status: 'success', categories };
}

// ─── BATCH: News page (categories + featured + posts in 1 call) ───

function getNewsPage(params) {
  // 1. Categories (from cache)
  const catData = getSheetData('Categories');
  const catHeaders = catData[0];
  const categories = catData.slice(1).map(row => {
    let obj = {};
    catHeaders.forEach((h, i) => obj[h] = row[i]);
    return obj;
  }).sort((a, b) => (a.order || 0) - (b.order || 0));

  // 2. Posts (from cache)
  const postData = getSheetData('Posts');
  const postHeaders = postData[0];

  let allPosts = postData.slice(1).map(row => {
    let obj = {};
    postHeaders.forEach((h, i) => obj[h] = row[i]);
    return obj;
  }).filter(p => p.status === 'published');

  // Sort newest first
  allPosts.sort((a, b) => {
    return new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt);
  });

  // 3. Featured post
  const featured = allPosts.find(p => p.featured === true || p.featured === 'TRUE');
  let featuredPost = null;
  if (featured) {
    const { content, ...rest } = featured;
    featuredPost = rest;
  }

  // 4. Paginated posts with optional category filter
  const category = params.category || '';
  let filtered = category ? allPosts.filter(p => p.category === category) : allPosts;

  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 9;
  const total = filtered.length;
  const start = (page - 1) * limit;
  const listPosts = filtered.slice(start, start + limit).map(p => {
    const { content, ...rest } = p;
    return rest;
  });

  return {
    status: 'success',
    categories,
    featured: featuredPost,
    posts: listPosts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
}

// ─── BATCH: Jobs page (jobs + nganh options in 1 call) ───

function getJobsPage(params) {
  const data = getSheetData('Jobs');
  if (!data || data.length === 0) return { status: 'success', jobs: [], nganhList: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  const headers = data[0];
  const rows = data.slice(1);

  let jobs = rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  // Collect unique nganh values from active jobs for filter
  const nganhSet = {};
  jobs.filter(j => j.Status === 'Active').forEach(j => {
    if (j.Nganh) nganhSet[j.Nganh] = (nganhSet[j.Nganh] || 0) + 1;
  });

  // Filter
  const nganh = params.nganh || '';
  const status = params.status || 'all';
  jobs = jobs.filter(j => {
    if (status && status !== 'all' && j.Status !== status) return false;
    if (nganh && j.Nganh !== nganh) return false;
    return true;
  });

  // Sort by NgayDang desc
  jobs.sort((a, b) => {
    const dA = parseVNDate(a.NgayDang);
    const dB = parseVNDate(b.NgayDang);
    return dB - dA;
  });

  const total = jobs.length;
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 100;
  const start = (page - 1) * limit;
  const paginated = jobs.slice(start, start + limit);

  return {
    status: 'success',
    jobs: paginated,
    nganhList: Object.entries(nganhSet).map(([name, count]) => ({ name, count })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
}

function manageCategory(action, data) {
  const sheet = getSheet('Categories');

  if (action === 'create') {
    const id = generateId();
    const slug = data.slug || generateSlug(data.name);
    sheet.appendRow([id, data.name, slug, data.description || '', data.color || '#0EA5E9', data.order || 0]);
    return { status: 'success', message: 'Danh mục đã được tạo', id };
  }

  if (action === 'update') {
    const allData = sheet.getDataRange().getValues();
    for (let i = 1; i < allData.length; i++) {
      if (String(allData[i][0]) === String(data.id)) {
        if (data.name) sheet.getRange(i + 1, 2).setValue(data.name);
        if (data.slug) sheet.getRange(i + 1, 3).setValue(data.slug);
        if (data.description !== undefined) sheet.getRange(i + 1, 4).setValue(data.description);
        if (data.color) sheet.getRange(i + 1, 5).setValue(data.color);
        if (data.order !== undefined) sheet.getRange(i + 1, 6).setValue(data.order);
        return { status: 'success', message: 'Danh mục đã được cập nhật' };
      }
    }
    return { error: 'Category not found' };
  }

  if (action === 'delete') {
    const allData = sheet.getDataRange().getValues();
    for (let i = 1; i < allData.length; i++) {
      if (String(allData[i][0]) === String(data.id)) {
        sheet.deleteRow(i + 1);
        return { status: 'success', message: 'Danh mục đã được xóa' };
      }
    }
    return { error: 'Category not found' };
  }

  return { error: 'Unknown category action' };
}

// ─── MEDIA / IMAGE UPLOAD ───

function uploadImage(data) {
  if (!data.base64 || !data.filename) {
    return { error: 'Missing base64 or filename' };
  }

  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const decoded = Utilities.base64Decode(data.base64);
    const mimeType = data.mimeType || 'image/jpeg';
    const blob = Utilities.newBlob(decoded, mimeType, data.filename);
    const file = folder.createFile(blob);

    // Make file publicly accessible
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = file.getId();
    const url = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1200';

    // Log to Media sheet
    const mediaSheet = getSheet('Media');
    mediaSheet.appendRow([
      generateId(),
      data.filename,
      fileId,
      url,
      decoded.length,
      new Date().toISOString(),
      data.postId || ''
    ]);

    return {
      status: 'success',
      fileId: fileId,
      url: url,
      message: 'Upload thành công'
    };
  } catch (err) {
    return { error: 'Upload failed: ' + err.message };
  }
}

function deleteImage(fileId) {
  if (!fileId) return { error: 'Missing fileId' };

  try {
    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true);

    // Remove from Media sheet
    const mediaSheet = getSheet('Media');
    const data = mediaSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === fileId) {
        mediaSheet.deleteRow(i + 1);
        break;
      }
    }

    return { status: 'success', message: 'Ảnh đã được xóa' };
  } catch (err) {
    return { error: 'Delete failed: ' + err.message };
  }
}

function getMedia(params) {
  const data = getSheetData('Media');
  const headers = data[0];
  const rows = data.slice(1);

  let media = rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  // Sort newest first
  media.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

  const page = parseInt((params && params.page) || 1);
  const limit = parseInt((params && params.limit) || 20);
  const total = media.length;
  const paginated = media.slice((page - 1) * limit, page * limit);

  return {
    status: 'success',
    media: paginated,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
}

// ─── JOBS: READ ───

function getJobs(params) {
  const data = getSheetData('Jobs');
  if (!data || data.length === 0) return { status: 'success', jobs: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  const headers = data[0];
  const rows = data.slice(1);

  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 20;
  const nganh = params.nganh || '';
  const status = params.status || 'all';
  const search = (params.search || '').toLowerCase();

  let jobs = rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  jobs = jobs.filter(j => {
    if (status && status !== 'all' && j.Status !== status) return false;
    if (nganh && j.Nganh !== nganh) return false;
    if (search && !j.TieuDe.toLowerCase().includes(search) && !j.CongTy.toLowerCase().includes(search)) return false;
    return true;
  });

  // Sort by NgayDang desc
  jobs.sort((a, b) => {
    const dA = parseVNDate(a.NgayDang);
    const dB = parseVNDate(b.NgayDang);
    return dB - dA;
  });

  const total = jobs.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paginated = jobs.slice(start, start + limit);

  return { status: 'success', jobs: paginated, pagination: { page, limit, total, totalPages } };
}

function getJob(id) {
  if (!id) return { error: 'Missing job ID' };

  const data = getSheetData('Jobs');
  if (!data || data.length === 0) return { error: 'Jobs sheet not found' };
  const headers = data[0];
  const rows = data.slice(1);

  const idStr = String(id);
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === idStr) {
      let obj = {};
      headers.forEach((h, j) => obj[h] = rows[i][j]);
      return { status: 'success', job: obj };
    }
  }
  return { error: 'Job not found' };
}

// ─── JOBS: WRITE ───

function createJob(data) {
  const sheet = getSheet('Jobs');
  if (!sheet) return { error: 'Jobs sheet not found. Run setupSheets first.' };

  const id = data.ID || generateJobId();
  const maDon = data.MaDon || generateMaDon(data.Nganh);
  const ngayDang = data.NgayDang || formatDateVN(new Date());

  const row = [
    id, maDon, data.TieuDe || '', data.Nganh || '', data.CongTy || '',
    parseInt(data.SoLuong) || 0, data.GioiTinh || 'Nam/Nữ',
    parseInt(data.TuoiTu) || 20, parseInt(data.TuoiDen) || 30,
    data.JLPT || 'N3', parseInt(data.KinhNghiem) || 0,
    parseInt(data.Luong) || 0, data.DiaDiem || '',
    data.HanNop || '', data.YeuCau || '', data.HinhAnh || '',
    ngayDang, data.Status || 'Active'
  ];

  sheet.appendRow(row);
  return { status: 'success', message: 'Tin tuyển dụng đã được tạo', id: id };
}

function updateJob(data) {
  if (!data.ID) return { error: 'Missing job ID' };

  const sheet = getSheet('Jobs');
  if (!sheet) return { error: 'Jobs sheet not found' };

  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idStr = String(data.ID);

  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][0]) === idStr) {
      const rowIndex = i + 1;
      // Update each column based on header name
      headers.forEach((h, colIdx) => {
        if (h !== 'ID' && data[h] !== undefined && data[h] !== '') {
          let val = data[h];
          // Convert numeric fields
          if (['SoLuong', 'TuoiTu', 'TuoiDen', 'KinhNghiem', 'Luong'].includes(h)) {
            val = parseInt(val) || 0;
          }
          sheet.getRange(rowIndex, colIdx + 1).setValue(val);
        }
      });
      return { status: 'success', message: 'Tin tuyển dụng đã được cập nhật' };
    }
  }
  return { error: 'Job not found' };
}

function deleteJob(id) {
  if (!id) return { error: 'Missing job ID' };

  const sheet = getSheet('Jobs');
  if (!sheet) return { error: 'Jobs sheet not found' };

  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const statusIdx = headers.indexOf('Status');

  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][0]) === String(id)) {
      sheet.getRange(i + 1, statusIdx + 1).setValue('Closed');
      return { status: 'success', message: 'Tin tuyển dụng đã được đóng' };
    }
  }
  return { error: 'Job not found: ' + String(id) };
}

// ─── JOBS: HELPERS ───

function generateJobId() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 100)).padStart(2, '0');
  return 'SJ-' + y + m + d + seq;
}

function generateMaDon(nganh) {
  const map = { 'CNTT': 'CNTT', 'CơKhi': 'CK', 'CoKhi': 'CK', 'Dien': 'DIEN', 'KinhTe': 'KE', 'XayDung': 'XD' };
  const prefix = map[nganh] || 'OT';
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return 'SJ-' + prefix + '-' + seq;
}

function parseVNDate(str) {
  if (!str) return new Date(0);
  // Format: dd/mm/yyyy
  const parts = String(str).split('/');
  if (parts.length === 3) {
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }
  return new Date(str) || new Date(0);
}

function formatDateVN(d) {
  return String(d.getDate()).padStart(2, '0') + '/' +
         String(d.getMonth() + 1).padStart(2, '0') + '/' +
         d.getFullYear();
}

// ─── CONTACTS CRM ───

/**
 * Verify reCAPTCHA v3 token with Google API.
 * Returns: { valid: true, score: 0.x } or { valid: false, reason: '...' }
 * If RECAPTCHA_SECRET is placeholder → passes through (returns valid=true) so form still works.
 */
function verifyRecaptcha(token) {
  const secret = getRecaptchaSecret();
  if (!secret) {
    return { valid: true, score: 1.0, note: 'recaptcha-disabled' };
  }
  if (!token) {
    return { valid: false, reason: 'missing-token' };
  }
  try {
    const resp = UrlFetchApp.fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'post',
      payload: { secret: secret, response: token },
      muteHttpExceptions: true
    });
    const result = JSON.parse(resp.getContentText());
    if (!result.success) {
      return { valid: false, reason: 'google-rejected', errors: result['error-codes'] };
    }
    if (typeof result.score === 'number' && result.score < RECAPTCHA_MIN_SCORE) {
      return { valid: false, reason: 'score-too-low', score: result.score };
    }
    return { valid: true, score: result.score };
  } catch (e) {
    return { valid: false, reason: 'verify-exception', error: String(e) };
  }
}

function submitContact(data) {
  // --- Anti-spam: verify reCAPTCHA v3 token (if configured) ---
  const rc = verifyRecaptcha(data.recaptchaToken || '');
  if (!rc.valid) {
    return { error: 'recaptcha-failed', reason: rc.reason, score: rc.score };
  }

  const sheet = getSheet('Contacts');
  if (!sheet) return { error: 'Contacts sheet not found. Run setupSheets first.' };

  const id = 'CT-' + Date.now().toString(36).toUpperCase();
  const source = data.source || 'website_main_form';
  const note = rc.note === 'recaptcha-disabled'
    ? 'source: ' + source
    : 'source: ' + source + ' | recaptcha: ' + (rc.score || 'n/a');

  const row = [
    id,
    new Date().toISOString(),
    data.hoTen || '',
    data.sdt || '',
    data.email || '',
    data.chuongTrinh || '',
    'Mới',          // Status
    note,           // Note (source + recaptcha score)
    '',             // AssignedTo
    '',             // UpdatedAt
    source          // Column 11: Source (exit_intent_popup, website_main_form, ...)
  ];
  sheet.appendRow(row);
  return { status: 'success', message: 'Cảm ơn! Thông tin đã được gửi.' };
}

function getContact(id) {
  if (!id) return { error: 'Missing contact ID' };

  const data = getSheetData('Contacts');
  if (!data || data.length === 0) return { error: 'Contacts sheet not found' };
  const headers = data[0];
  const idStr = String(id);
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === idStr) {
      let obj = {};
      headers.forEach((h, j) => obj[h] = data[i][j]);
      return { status: 'success', contact: obj };
    }
  }
  return { error: 'Contact not found: ' + idStr };
}

function getContacts(params) {
  const data = getSheetData('Contacts');
  if (!data || data.length === 0) return { status: 'success', contacts: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  const headers = data[0];
  const rows = data.slice(1);

  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 20;
  const status = params.status || '';
  const chuongTrinh = params.chuongTrinh || '';
  const search = (params.search || '').toLowerCase();

  let contacts = rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  contacts = contacts.filter(c => {
    if (status && c.Status !== status) return false;
    if (chuongTrinh && c.ChuongTrinh !== chuongTrinh) return false;
    if (search) {
      const haystack = (c.HoTen + ' ' + c.SDT + ' ' + c.Email + ' ' + c.Note).toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  // Sort by Timestamp desc (newest first)
  contacts.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));

  const total = contacts.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paginated = contacts.slice(start, start + limit);

  // Pipeline summary (count per status)
  const pipeline = {};
  rows.forEach(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    const s = obj.Status || 'Mới';
    pipeline[s] = (pipeline[s] || 0) + 1;
  });

  return { status: 'success', contacts: paginated, pagination: { page, limit, total, totalPages }, pipeline };
}

function updateContact(data) {
  if (!data.ID) return { error: 'Missing contact ID' };

  const sheet = getSheet('Contacts');
  if (!sheet) return { error: 'Contacts sheet not found' };

  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idStr = String(data.ID);

  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][0]) === idStr) {
      const rowIndex = i + 1;
      headers.forEach((h, colIdx) => {
        if (h !== 'ID' && h !== 'Timestamp' && data[h] !== undefined) {
          sheet.getRange(rowIndex, colIdx + 1).setValue(data[h]);
        }
      });
      // Always update UpdatedAt
      const updatedAtIdx = headers.indexOf('UpdatedAt');
      if (updatedAtIdx >= 0) {
        sheet.getRange(rowIndex, updatedAtIdx + 1).setValue(new Date().toISOString());
      }
      return { status: 'success', message: 'Cập nhật thành công' };
    }
  }
  return { error: 'Contact not found' };
}

function deleteContact(id) {
  if (!id) return { error: 'Missing contact ID' };

  const sheet = getSheet('Contacts');
  if (!sheet) return { error: 'Contacts sheet not found' };

  const allData = sheet.getDataRange().getValues();
  const idStr = String(id);
  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][0]) === idStr) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'Đã xóa liên hệ' };
    }
  }
  return { error: 'Contact not found' };
}

// ─── STATS ───

function getStats(password) {
  if (!auth(password)) return { error: 'Unauthorized' };

  const postsData = getSheetData('Posts');
  const headers = postsData[0];
  const rows = postsData.slice(1);

  let totalPublished = 0, totalDraft = 0, totalArchived = 0, totalViews = 0;
  const statusIdx = headers.indexOf('status');
  const viewIdx = headers.indexOf('viewCount');
  const dateIdx = headers.indexOf('createdAt');

  const recentPosts = [];
  const monthlyCount = {};

  rows.forEach(row => {
    const status = row[statusIdx];
    if (status === 'published') totalPublished++;
    else if (status === 'draft') totalDraft++;
    else if (status === 'archived') totalArchived++;

    totalViews += parseInt(row[viewIdx]) || 0;

    // Monthly stats
    const date = new Date(row[dateIdx]);
    if (!isNaN(date)) {
      const key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      monthlyCount[key] = (monthlyCount[key] || 0) + 1;
    }
  });

  // Recent 5 posts
  const postObjects = rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  postObjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const recent = postObjects.slice(0, 5).map(p => ({
    id: p.id, title: p.title, status: p.status,
    createdAt: p.createdAt, viewCount: p.viewCount
  }));

  // Media count
  const mediaSheet = getSheet('Media');
  const mediaCount = Math.max(0, mediaSheet.getLastRow() - 1);

  // Jobs stats (from cache)
  let totalJobs = 0, activeJobs = 0;
  const jobsByNganh = {};
  const jobsData = getSheetData('Jobs');
  if (jobsData && jobsData.length > 1) {
    const jHeaders = jobsData[0];
    const jStatusIdx = jHeaders.indexOf('Status');
    const jNganhIdx = jHeaders.indexOf('Nganh');
    const jRows = jobsData.slice(1);
    totalJobs = jRows.length;
    jRows.forEach(r => {
      if (r[jStatusIdx] === 'Active') activeJobs++;
      const nganh = r[jNganhIdx] || 'Khac';
      jobsByNganh[nganh] = (jobsByNganh[nganh] || 0) + 1;
    });
  }

  // Contact form stats (from cache)
  const contactStats = [];
  const contactsData = getSheetData('Contacts');
  if (contactsData && contactsData.length > 1) {
    const cRows = contactsData.slice(1);
    const now = new Date();
    for (let m = 2; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const label = String(month + 1).padStart(2, '0') + '/' + year;
      const count = cRows.filter(r => {
        const ts = new Date(r[1]);
        return ts.getFullYear() === year && ts.getMonth() === month;
      }).length;
      contactStats.push({ label, count });
    }
  }
  const totalContacts = contactsData ? Math.max(0, contactsData.length - 1) : 0;

  // Contact pipeline (count per status)
  const contactPipeline = {};
  if (contactsData && contactsData.length > 1) {
    const cpHeaders = contactsData[0];
    const cpStatusIdx = cpHeaders.indexOf('Status');
    contactsData.slice(1).forEach(r => {
      const s = r[cpStatusIdx] || 'Mới';
      contactPipeline[s] = (contactPipeline[s] || 0) + 1;
    });
  }

  return {
    status: 'success',
    stats: {
      totalPosts: rows.length,
      published: totalPublished,
      draft: totalDraft,
      archived: totalArchived,
      totalViews,
      mediaCount,
      recentPosts: recent,
      monthlyCount,
      totalJobs,
      activeJobs,
      jobsByNganh,
      totalContacts,
      contactStats,
      contactPipeline
    }
  };
}

// ─── CONFIG ───

function getConfig(key) {
  const data = getSheetData('Config');
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) return data[i][1];
  }
  return null;
}

function updateConfig(key, value, password) {
  if (!auth(password)) return { error: 'Unauthorized' };
  const sheet = getSheet('Config');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return { status: 'success', message: 'Config updated' };
    }
  }
  return { error: 'Config key not found' };
}

// ─── UTILITIES ───

function generateSlug(text) {
  if (!text) return '';
  // Vietnamese diacritics removal
  const map = {
    'à':'a','á':'a','ả':'a','ã':'a','ạ':'a','ă':'a','ằ':'a','ắ':'a','ẳ':'a','ẵ':'a','ặ':'a',
    'â':'a','ầ':'a','ấ':'a','ẩ':'a','ẫ':'a','ậ':'a','è':'e','é':'e','ẻ':'e','ẽ':'e','ẹ':'e',
    'ê':'e','ề':'e','ế':'e','ể':'e','ễ':'e','ệ':'e','ì':'i','í':'i','ỉ':'i','ĩ':'i','ị':'i',
    'ò':'o','ó':'o','ỏ':'o','õ':'o','ọ':'o','ô':'o','ồ':'o','ố':'o','ổ':'o','ỗ':'o','ộ':'o',
    'ơ':'o','ờ':'o','ớ':'o','ở':'o','ỡ':'o','ợ':'o','ù':'u','ú':'u','ủ':'u','ũ':'u','ụ':'u',
    'ư':'u','ừ':'u','ứ':'u','ử':'u','ữ':'u','ự':'u','ỳ':'y','ý':'y','ỷ':'y','ỹ':'y','ỵ':'y',
    'đ':'d','Đ':'d'
  };
  let slug = text.toLowerCase();
  for (const [from, to] of Object.entries(map)) {
    slug = slug.split(from).join(to);
  }
  return slug
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ─── SETUP (Run once) ───

function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Posts sheet
  let postsSheet = ss.getSheetByName('Posts');
  if (!postsSheet) {
    postsSheet = ss.insertSheet('Posts');
    postsSheet.appendRow([
      'id', 'title', 'slug', 'excerpt', 'content', 'thumbnail',
      'category', 'tags', 'author', 'status', 'createdAt', 'updatedAt',
      'publishedAt', 'viewCount', 'featured'
    ]);
    postsSheet.getRange(1, 1, 1, 15).setFontWeight('bold');
  }

  // Categories sheet
  let catSheet = ss.getSheetByName('Categories');
  if (!catSheet) {
    catSheet = ss.insertSheet('Categories');
    catSheet.appendRow(['id', 'name', 'slug', 'description', 'color', 'order']);
    catSheet.getRange(1, 1, 1, 6).setFontWeight('bold');

    // Seed default categories
    const cats = [
      [generateId(), 'Du học', 'du-hoc', 'Tin tức về du học Nhật Bản', '#0EA5E9', 1],
      [generateId(), 'Tuyển dụng', 'tuyen-dung', 'Thông tin tuyển dụng kỹ sư, tokutei', '#F97316', 2],
      [generateId(), 'Tiếng Nhật', 'tieng-nhat', 'Mẹo học tiếng Nhật, tài liệu', '#10B981', 3],
      [generateId(), 'Đời sống Nhật Bản', 'doi-song', 'Văn hóa, đời sống tại Nhật', '#8B5CF6', 4],
      [generateId(), 'Sự kiện', 'su-kien', 'Sự kiện, hội thảo của Sora Japan', '#F59E0B', 5]
    ];
    cats.forEach(c => catSheet.appendRow(c));
  }

  // Media sheet
  let mediaSheet = ss.getSheetByName('Media');
  if (!mediaSheet) {
    mediaSheet = ss.insertSheet('Media');
    mediaSheet.appendRow(['id', 'filename', 'driveFileId', 'url', 'size', 'uploadedAt', 'usedIn']);
    mediaSheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  }

  // Jobs sheet
  let jobsSheet = ss.getSheetByName('Jobs');
  if (!jobsSheet) {
    jobsSheet = ss.insertSheet('Jobs');
    jobsSheet.appendRow([
      'ID', 'MaDon', 'TieuDe', 'Nganh', 'CongTy', 'SoLuong', 'GioiTinh',
      'TuoiTu', 'TuoiDen', 'JLPT', 'KinhNghiem', 'Luong', 'DiaDiem',
      'HanNop', 'YeuCau', 'HinhAnh', 'NgayDang', 'Status'
    ]);
    jobsSheet.getRange(1, 1, 1, 18).setFontWeight('bold');
  }

  // Contacts sheet (CRM)
  let contactsSheet = ss.getSheetByName('Contacts');
  if (!contactsSheet) {
    contactsSheet = ss.insertSheet('Contacts');
    contactsSheet.appendRow(['ID', 'Timestamp', 'HoTen', 'SDT', 'Email', 'ChuongTrinh', 'Status', 'Note', 'AssignedTo', 'UpdatedAt']);
    contactsSheet.getRange(1, 1, 1, 10).setFontWeight('bold');
  }

  // Config sheet
  let configSheet = ss.getSheetByName('Config');
  if (!configSheet) {
    configSheet = ss.insertSheet('Config');
    configSheet.appendRow(['key', 'value']);
    configSheet.getRange(1, 1, 1, 2).setFontWeight('bold');

    configSheet.appendRow(['admin_password', 'sorajapan2026']);
    configSheet.appendRow(['posts_per_page', '9']);
    configSheet.appendRow(['site_name', 'Sora Japan']);
    configSheet.appendRow(['drive_folder_id', DRIVE_FOLDER_ID]);
  }

  // Seed sample posts
  const postsSheet2 = ss.getSheetByName('Posts');
  if (postsSheet2.getLastRow() <= 1) {
    const now = new Date().toISOString();
    const samplePosts = [
      [generateId(), 'Hướng dẫn chi tiết thủ tục du học Nhật Bản 2026', 'huong-dan-thu-tuc-du-hoc-nhat-ban-2026',
       'Tổng hợp đầy đủ các bước chuẩn bị hồ sơ du học Nhật Bản từ A đến Z cho năm 2026.',
       '<h2>1. Chuẩn bị hồ sơ</h2><p>Bước đầu tiên trong hành trình du học Nhật Bản là chuẩn bị đầy đủ hồ sơ...</p><h2>2. Chọn trường</h2><p>Việc lựa chọn trường phù hợp rất quan trọng...</p><h2>3. Nộp đơn</h2><p>Sau khi đã chọn được trường, bạn cần nộp đơn xin học...</p>',
       '', 'du-hoc', 'du học,thủ tục,visa', 'Sora Japan', 'published', now, now, now, 156, true],
      [generateId(), 'Top 5 trường Nhật ngữ tốt nhất Tokyo 2026', 'top-5-truong-nhat-ngu-tot-nhat-tokyo-2026',
       'Khám phá 5 trường Nhật ngữ hàng đầu tại Tokyo được sinh viên Việt Nam đánh giá cao nhất.',
       '<h2>1. Học viện ICA</h2><p>Học viện Đàm thoại Quốc tế ICA là một trong những trường...</p><h2>2. KYORITSU</h2><p>Học viện Nhật ngữ KYORITSU nổi tiếng với...</p>',
       '', 'du-hoc', 'trường nhật ngữ,tokyo', 'Sora Japan', 'published', now, now, now, 89, false],
      [generateId(), 'Cơ hội việc làm kỹ sư IT tại Nhật Bản', 'co-hoi-viec-lam-ky-su-it-tai-nhat-ban',
       'Thị trường tuyển dụng kỹ sư IT tại Nhật Bản đang rất sôi động với nhiều cơ hội hấp dẫn.',
       '<h2>Nhu cầu tuyển dụng</h2><p>Nhật Bản đang thiếu hụt nghiêm trọng nhân lực IT...</p><h2>Mức lương</h2><p>Mức lương trung bình cho kỹ sư IT tại Nhật...</p>',
       '', 'tuyen-dung', 'kỹ sư,IT,việc làm', 'Sora Japan', 'published', now, now, now, 234, true],
      [generateId(), 'Mẹo học kanji hiệu quả cho người mới bắt đầu', 'meo-hoc-kanji-hieu-qua-cho-nguoi-moi',
       'Chia sẻ phương pháp học kanji nhanh và nhớ lâu dành cho người mới học tiếng Nhật.',
       '<h2>Phương pháp liên tưởng</h2><p>Một trong những cách hiệu quả nhất để nhớ kanji...</p>',
       '', 'tieng-nhat', 'kanji,học tiếng nhật,N5', 'Sora Japan', 'published', now, now, now, 312, false],
      [generateId(), 'Cuộc sống du học sinh Việt Nam tại Saitama', 'cuoc-song-du-hoc-sinh-viet-nam-tai-saitama',
       'Trải nghiệm thực tế của du học sinh Việt Nam về cuộc sống, chi phí và văn hóa tại Saitama.',
       '<h2>Chi phí sinh hoạt</h2><p>Saitama là một trong những tỉnh có chi phí sinh hoạt hợp lý...</p>',
       '', 'doi-song', 'saitama,du học sinh,chi phí', 'Sora Japan', 'published', now, now, now, 178, false]
    ];
    samplePosts.forEach(p => postsSheet2.appendRow(p));
  }

  Logger.log('Setup completed successfully!');
}