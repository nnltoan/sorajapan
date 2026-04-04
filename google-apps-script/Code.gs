/* ============================================
   SORA JAPAN NEWS CMS — Google Apps Script API
   ============================================
   Deploy as Web App → "Anyone" access
   ============================================ */

// ─── CONFIG ───
const SPREADSHEET_ID = '1goqsX4WoM6dALboJhgyIod4xazgbNuhcLGFXyRROAlE'; // ← Thay bằng ID Google Sheet
const DRIVE_FOLDER_ID = '1CNgojYZ1iU426ZVS3pfSGCFZhNJgiYvT'; // ← Thay bằng ID folder Google Drive cho ảnh

function getSheet(name) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
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

  // Auth check for all write operations
  if (!auth(data.password)) {
    return { error: 'Unauthorized' };
  }

  switch (action) {
    case 'login':
      return { status: 'success', message: 'Đăng nhập thành công' };
    case 'createPost':
      return createPost(data);
    case 'updatePost':
      return updatePost(data);
    case 'deletePost':
      return deletePost(data.id);
    case 'uploadImage':
      return uploadImage(data);
    case 'deleteImage':
      return deleteImage(data.fileId);
    case 'createCategory':
      return manageCategory('create', data);
    case 'updateCategory':
      return manageCategory('update', data);
    case 'deleteCategory':
      return manageCategory('delete', data);
    case 'updateConfig':
      return updateConfig(data.key, data.value, data.password);
    case 'createJob':
      return createJob(data);
    case 'updateJob':
      return updateJob(data);
    case 'deleteJob':
      return deleteJob(data.id);
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
  const configSheet = getSheet('Config');
  const data = configSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'admin_password' && data[i][1] === password) {
      return true;
    }
  }
  return false;
}

// ─── POSTS: READ ───

function getPosts(params) {
  const sheet = getSheet('Posts');
  const data = sheet.getDataRange().getValues();
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

  const sheet = getSheet('Posts');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  for (let i = 0; i < rows.length; i++) {
    let obj = {};
    headers.forEach((h, j) => obj[h] = rows[i][j]);

    if (obj.slug === slug && obj.status === 'published') {
      // Increment view count
      const viewColIndex = headers.indexOf('viewCount');
      if (viewColIndex !== -1) {
        const currentViews = parseInt(rows[i][viewColIndex]) || 0;
        sheet.getRange(i + 2, viewColIndex + 1).setValue(currentViews + 1);
        obj.viewCount = currentViews + 1;
      }

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

      return {
        status: 'success',
        post: obj,
        related: relatedPosts.slice(0, 4)
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
    if (rows[i][0] === data.id) {
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
    if (allData[i][0] === id) {
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
  const sheet = getSheet('Categories');
  const data = sheet.getDataRange().getValues();
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
      if (allData[i][0] === data.id) {
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
      if (allData[i][0] === data.id) {
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
  const sheet = getSheet('Media');
  const data = sheet.getDataRange().getValues();
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
  const sheet = getSheet('Jobs');
  if (!sheet) return { status: 'success', jobs: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };

  const data = sheet.getDataRange().getValues();
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

  const sheet = getSheet('Jobs');
  if (!sheet) return { error: 'Jobs sheet not found' };

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === id) {
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

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === data.ID) {
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
    if (allData[i][0] === id) {
      sheet.getRange(i + 1, statusIdx + 1).setValue('Closed');
      return { status: 'success', message: 'Tin tuyển dụng đã được đóng' };
    }
  }
  return { error: 'Job not found' };
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

// ─── STATS ───

function getStats(password) {
  if (!auth(password)) return { error: 'Unauthorized' };

  const postsSheet = getSheet('Posts');
  const postsData = postsSheet.getDataRange().getValues();
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

  // Jobs stats
  let totalJobs = 0, activeJobs = 0;
  const jobsSheet = getSheet('Jobs');
  if (jobsSheet && jobsSheet.getLastRow() > 1) {
    const jobsData = jobsSheet.getDataRange().getValues();
    const jHeaders = jobsData[0];
    const jStatusIdx = jHeaders.indexOf('Status');
    const jRows = jobsData.slice(1);
    totalJobs = jRows.length;
    activeJobs = jRows.filter(r => r[jStatusIdx] === 'Active').length;
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
      activeJobs
    }
  };
}

// ─── CONFIG ───

function getConfig(key) {
  const sheet = getSheet('Config');
  const data = sheet.getDataRange().getValues();
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